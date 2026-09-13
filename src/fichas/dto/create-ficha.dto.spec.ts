import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateFichaDto } from './create-ficha.dto.js';

const flattenValidationErrors = (errors: any[]): string[] =>
  errors.flatMap((error) => [
    ...Object.values(error.constraints ?? {}),
    ...flattenValidationErrors(error.children ?? []),
  ]);

describe('CreateFichaDto', () => {
  it('requires a student id and non-empty title', async () => {
    const dto = plainToInstance(CreateFichaDto, {
      alunoId: undefined,
      title: '   ',
      divisions: [],
    });

    const errors = await validate(dto);

    expect(errors.length).toBeGreaterThan(0);
  });

  it('requires positive sets and non-empty reps', async () => {
    const dto = plainToInstance(CreateFichaDto, {
      alunoId: 1,
      title: 'Plan A',
      divisions: [
        {
          name: 'Treino A',
          order: 1,
          exercises: [
            {
              exercicioId: 2,
              order: 1,
              sets: 0,
              reps: '   ',
            },
          ],
        },
      ],
    });

    const errors = await validate(dto);
    const flattened = flattenValidationErrors(errors);

    expect(flattened.some((message) => /sets|reps/i.test(String(message)))).toBe(true);
  });
});
