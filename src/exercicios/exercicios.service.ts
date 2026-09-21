import { BadRequestException, Injectable, NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { AlunoLevel, ExerciseMediaKind } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { PrismaService } from '../prisma/prisma.service.js';
import { ConfigService } from '@nestjs/config';
import type {
  ConfirmMediaDto,
  CreateExercicioDto,
  ExercicioListingDto,
  ExercicioCreatedDto,
  ExercicioListingQuery,
  MediaUploadDto,
  UpdateExercicioDto,
} from './exercicio-listing.dto.js';

const LEVELS = Object.values(AlunoLevel);
const MEDIA_LIMITS = { photo: 10 * 1024 * 1024, video: 100 * 1024 * 1024 };

@Injectable()
export class ExerciciosService {
  private readonly r2Enabled: boolean;
  private readonly r2Bucket: string;
  private readonly r2Client?: S3Client;

  constructor(
    private readonly prisma: PrismaService,
    config: ConfigService,
  ) {
    this.r2Enabled = config.get<string>('R2_ENABLED', 'false') === 'true';
    this.r2Bucket = config.get<string>('R2_BUCKET_NAME', '');
    const accountId = config.get<string>('R2_ACCOUNT_ID', '');
    const accessKeyId = config.get<string>('R2_ACCESS_KEY_ID', '');
    const secretAccessKey = config.get<string>('R2_SECRET_ACCESS_KEY', '');
    const endpoint = config.get<string>('R2_ENDPOINT') || (accountId ? `https://${accountId}.us.r2.cloudflarestorage.com` : '');
    if (this.r2Enabled && accountId && accessKeyId && secretAccessKey) {
      this.r2Client = new S3Client({
        region: 'auto',
        endpoint,
        credentials: { accessKeyId, secretAccessKey },
        forcePathStyle: true,
        requestChecksumCalculation: 'WHEN_REQUIRED',
        responseChecksumValidation: 'WHEN_REQUIRED',
      });
    }
  }

  async list(
    personalId: number,
    query: ExercicioListingQuery,
  ): Promise<ExercicioListingDto[]> {
    const level = this.validateLevel(query.level);
    const search = query.search?.trim();
    const muscleGroup = query.muscleGroup?.trim();

    return this.prisma.exercicio.findMany({
      where: {
        createdByPersonalId: personalId,
        ...(level ? { level } : {}),
        ...(muscleGroup ? { muscleGroup: { equals: muscleGroup, mode: 'insensitive' } } : {}),
        ...(search ? { name: { contains: search, mode: 'insensitive' } } : {}),
      },
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        muscleGroup: true,
        equipment: true,
        description: true,
        defaultSets: true,
        defaultReps: true,
        level: true,
        media: { select: { id: true, kind: true, contentType: true, byteSize: true } },
      },
    });
  }

  async create(personalId: number, input: CreateExercicioDto): Promise<ExercicioCreatedDto> {
    const data = this.validateCreateInput(input);
    const exercise = await this.prisma.exercicio.create({
      data: { ...data, createdByPersonalId: personalId },
      select: { id: true, name: true, muscleGroup: true, equipment: true, description: true, defaultSets: true, defaultReps: true, level: true },
    });
    return { ...exercise, media: [] };
  }

  async findOne(personalId: number, exerciseId: number): Promise<ExercicioCreatedDto> {
    const exercise = await this.prisma.exercicio.findFirst({
      where: { id: exerciseId, createdByPersonalId: personalId },
      select: {
        id: true,
        name: true,
        muscleGroup: true,
        equipment: true,
        description: true,
        defaultSets: true,
        defaultReps: true,
        level: true,
        media: { select: { kind: true, contentType: true, byteSize: true } },
      },
    });

    if (!exercise) throw new NotFoundException('Exercise not found');
    return exercise;
  }

  async update(
    personalId: number,
    exerciseId: number,
    input: UpdateExercicioDto,
  ): Promise<ExercicioCreatedDto> {
    await this.ownedExercise(personalId, exerciseId);
    const data = this.validateCreateInput(input);
    return this.prisma.exercicio.update({
      where: { id: exerciseId },
      data,
      select: {
        id: true,
        name: true,
        muscleGroup: true,
        equipment: true,
        description: true,
        defaultSets: true,
        defaultReps: true,
        level: true,
        media: { select: { kind: true, contentType: true, byteSize: true } },
      },
    });
  }

  async remove(personalId: number, exerciseId: number): Promise<{ message: string }> {
    await this.ownedExercise(personalId, exerciseId);
    await this.prisma.$transaction([
      this.prisma.treinoExercicio.deleteMany({ where: { exercicioId: exerciseId } }),
      this.prisma.exerciseMedia.deleteMany({ where: { exercicioId: exerciseId } }),
      this.prisma.exercicio.delete({ where: { id: exerciseId } }),
    ]);
    return { message: 'Exercise deleted' };
  }

  async authorizeUpload(personalId: number, exerciseId: number, input: MediaUploadDto) {
    const exercise = await this.ownedExercise(personalId, exerciseId);
    if (!this.r2Enabled || !this.r2Client || !this.r2Bucket) {
      throw new ServiceUnavailableException('Media upload is unavailable');
    }
    const data = this.validateMediaInput(input);
    const objectKey = `exercises/${personalId}/${exercise.id}/${randomUUID()}-${data.kind}`;
    const uploadUrl = await getSignedUrl(
      this.r2Client,
      new PutObjectCommand({
        Bucket: this.r2Bucket,
        Key: objectKey,
        ContentType: data.contentType,
      }),
      {
        expiresIn: 300,
      },
    );
    return { uploadUrl, objectKey, expiresIn: 300, kind: data.kind, contentType: data.contentType, byteSize: data.byteSize };
  }

  async confirmUpload(personalId: number, exerciseId: number, input: ConfirmMediaDto) {
    const exercise = await this.ownedExercise(personalId, exerciseId);
    if (!this.r2Enabled) throw new ServiceUnavailableException('Media upload is unavailable');
    const data = this.validateMediaInput(input);
    if (typeof input.objectKey !== 'string' || !input.objectKey.startsWith(`exercises/${personalId}/${exercise.id}/`)) {
      throw new BadRequestException('Invalid media object key');
    }

    // Replace previous media of the same kind if present
    const existing = await this.prisma.exerciseMedia.findMany({
      where: { exercicioId: exercise.id, kind: data.kind },
    });
    for (const old of existing) {
      if (this.r2Client && this.r2Bucket) {
        try {
          await this.r2Client.send(new DeleteObjectCommand({ Bucket: this.r2Bucket, Key: old.objectKey }));
        } catch {
          // ignore S3 delete errors
        }
      }
      await this.prisma.exerciseMedia.delete({ where: { id: old.id } });
    }

    return this.prisma.exerciseMedia.create({
      data: { exercicioId: exercise.id, objectKey: input.objectKey, kind: data.kind, contentType: data.contentType, byteSize: data.byteSize },
      select: { id: true, kind: true, contentType: true, byteSize: true, objectKey: true },
    });
  }

  async media(user: { id: number; role: string }, exerciseId: number) {
    const exercise = await this.accessibleExercise(user, exerciseId);
    const mediaList = await this.prisma.exerciseMedia.findMany({
      where: { exercicioId: exercise.id },
      select: { id: true, kind: true, contentType: true, byteSize: true, objectKey: true },
    });

    if (!this.r2Enabled || !this.r2Client || !this.r2Bucket) {
      return mediaList.map((m) => ({ ...m, url: null }));
    }

    return Promise.all(
      mediaList.map(async (m) => {
        try {
          const url = await getSignedUrl(
            this.r2Client!,
            new GetObjectCommand({
              Bucket: this.r2Bucket,
              Key: m.objectKey,
            }),
            { expiresIn: 3600 },
          );
          return { ...m, url };
        } catch {
          return { ...m, url: null };
        }
      }),
    );
  }

  async removeMedia(personalId: number, exerciseId: number, mediaId: number) {
    const exercise = await this.ownedExercise(personalId, exerciseId);
    const mediaItem = await this.prisma.exerciseMedia.findFirst({
      where: { id: mediaId, exercicioId: exercise.id },
    });
    if (!mediaItem) {
      throw new NotFoundException('Media item not found');
    }

    if (this.r2Client && this.r2Bucket) {
      try {
        await this.r2Client.send(new DeleteObjectCommand({
          Bucket: this.r2Bucket,
          Key: mediaItem.objectKey,
        }));
      } catch {
        // ignore S3 delete errors
      }
    }

    await this.prisma.exerciseMedia.delete({
      where: { id: mediaItem.id },
    });

    return { message: 'Media removed' };
  }

  private async accessibleExercise(user: { id: number; role: string }, exerciseId: number) {
    if (user.role === 'personal') {
      return this.ownedExercise(user.id, exerciseId);
    }

    // If student, check if exercise is part of their assigned training plans or created by their personal
    const student = await this.prisma.user.findUnique({
      where: { id: user.id },
      select: { personalId: true },
    });

    const exercise = await this.prisma.exercicio.findFirst({
      where: {
        id: exerciseId,
        OR: [
          ...(student?.personalId ? [{ createdByPersonalId: student.personalId }] : []),
          {
            treinoExercicios: {
              some: {
                treino: {
                  ficha: {
                    alunoId: user.id,
                  },
                },
              },
            },
          },
        ],
      },
    });

    if (!exercise) throw new NotFoundException('Exercise not found');
    return exercise;
  }

  private async ownedExercise(personalId: number, exerciseId: number) {
    const exercise = await this.prisma.exercicio.findFirst({ where: { id: exerciseId, createdByPersonalId: personalId } });
    if (!exercise) throw new NotFoundException('Exercise not found');
    return exercise;
  }

  private validateCreateInput(input: CreateExercicioDto) {
    if (typeof input.name !== 'string' || input.name.trim().length < 2 || typeof input.muscleGroup !== 'string' || input.muscleGroup.trim().length < 2 || typeof input.description !== 'string' || input.description.trim().length === 0 || typeof input.defaultReps !== 'string' || input.defaultReps.trim().length === 0 || typeof input.defaultSets !== 'number' || !Number.isInteger(input.defaultSets) || input.defaultSets < 1 || input.defaultSets > 20) throw new BadRequestException('Invalid exercise data');
    const level = this.validateLevel(typeof input.level === 'string' ? input.level : undefined);
    if (!level) throw new BadRequestException('Invalid exercise data');
    return { name: input.name.trim(), muscleGroup: input.muscleGroup.trim(), equipment: typeof input.equipment === 'string' && input.equipment.trim() ? input.equipment.trim() : null, level, description: input.description.trim(), defaultSets: input.defaultSets, defaultReps: input.defaultReps.trim() };
  }

  private validateMediaInput(input: MediaUploadDto | ConfirmMediaDto) {
    const kind = input.kind;
    const contentType = input.contentType;
    const byteSize = input.byteSize;
    if (kind !== 'photo' && kind !== 'video' || typeof contentType !== 'string' || typeof byteSize !== 'number' || !Number.isInteger(byteSize) || byteSize < 1) throw new BadRequestException('Invalid media data');
    const prefix = kind === 'photo' ? 'image/' : 'video/';
    if (!contentType.startsWith(prefix) || byteSize > MEDIA_LIMITS[kind]) throw new BadRequestException('Unsupported media or size');
    return { kind: kind as ExerciseMediaKind, contentType, byteSize };
  }

  private validateLevel(value: string | undefined): AlunoLevel | undefined {
    if (value === undefined) {
      return undefined;
    }

    if (!LEVELS.includes(value as AlunoLevel)) {
      throw new BadRequestException('Invalid level filter');
    }

    return value as AlunoLevel;
  }
}