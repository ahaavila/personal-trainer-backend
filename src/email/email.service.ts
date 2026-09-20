import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly resend: Resend | null = null;
  private readonly defaultFrom: string;
  private readonly frontendUrl: string;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('RESEND_API_KEY');
    this.defaultFrom =
      this.configService.get<string>('EMAIL_FROM') ||
      'FitForge <onboarding@resend.dev>';
    this.frontendUrl =
      this.configService.get<string>('FRONTEND_URL') ||
      'http://localhost:5173';

    if (apiKey) {
      this.resend = new Resend(apiKey);
    } else {
      this.logger.warn(
        'RESEND_API_KEY not configured. Outgoing emails will be logged only.',
      );
    }
  }

  async sendPasswordResetEmail(
    to: string,
    name: string,
    token: string,
  ): Promise<void> {
    const resetUrl = `${this.frontendUrl.replace(/\/$/, '')}/redefinir-senha?token=${token}`;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #0c0a08; color: #f2ede4; padding: 32px; border-radius: 8px;">
        <div style="border-bottom: 2px solid #e2a83e; padding-bottom: 16px; margin-bottom: 24px;">
          <h1 style="color: #e2a83e; font-size: 24px; margin: 0; letter-spacing: 2px;">FITFORGE</h1>
        </div>
        <h2 style="font-size: 20px; margin-top: 0;">Recuperação de Senha</h2>
        <p style="color: #cbbfa3; font-size: 16px; line-height: 1.5;">Olá, ${name || 'Utilizador'}.</p>
        <p style="color: #cbbfa3; font-size: 16px; line-height: 1.5;">
          Recebemos um pedido para redefinir a senha da sua conta no FitForge. Se realizou este pedido, clique no botão abaixo para criar uma nova senha:
        </p>
        <div style="margin: 32px 0; text-align: center;">
          <a href="${resetUrl}" style="background: linear-gradient(90deg, #f2c265, #e2a83e); color: #1a1408; font-weight: bold; text-decoration: none; padding: 14px 28px; border-radius: 6px; display: inline-block; font-size: 16px;">
            Redefinir Minha Senha
          </a>
        </div>
        <p style="color: #a7a095; font-size: 14px; line-height: 1.5;">
          Este link é de utilização única e expira dentro de 1 hora.
        </p>
        <p style="color: #a7a095; font-size: 14px; line-height: 1.5;">
          Caso o botão acima não funcione, copie e cole o seguinte link no seu navegador:<br/>
          <a href="${resetUrl}" style="color: #e2a83e; word-break: break-all;">${resetUrl}</a>
        </p>
        <hr style="border: none; border-top: 1px solid #232019; margin: 32px 0;" />
        <p style="color: #6f6a5f; font-size: 12px; margin: 0;">
          Se não solicitou a redefinição de senha, ignore este e-mail. A sua conta permanece segura.
        </p>
      </div>
    `;

    if (!this.resend) {
      this.logger.log(
        `[MOCK EMAIL] To: ${to} | Subject: Recuperação de Senha - FitForge | URL: ${resetUrl}`,
      );
      return;
    }

    try {
      const response = await this.resend.emails.send({
        from: this.defaultFrom,
        to,
        subject: 'Recuperação de Senha - FitForge',
        html,
      });

      if (response.error) {
        this.logger.error(
          `Failed to send password reset email to ${to}: ${response.error.message}`,
        );
      } else {
        this.logger.log(
          `Password reset email sent successfully to ${to} (ID: ${response.data?.id})`,
        );
      }
    } catch (error) {
      this.logger.error(
        `Exception occurred while sending password reset email to ${to}`,
        error instanceof Error ? error.stack : error,
      );
    }
  }

  async sendStudentInviteEmail(
    to: string,
    studentName: string,
    personalName: string,
    token: string,
  ): Promise<void> {
    const setupUrl = `${this.frontendUrl.replace(/\/$/, '')}/redefinir-senha?token=${token}`;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #0c0a08; color: #f2ede4; padding: 32px; border-radius: 8px;">
        <div style="border-bottom: 2px solid #e2a83e; padding-bottom: 16px; margin-bottom: 24px;">
          <h1 style="color: #e2a83e; font-size: 24px; margin: 0; letter-spacing: 2px;">FITFORGE</h1>
        </div>
        <h2 style="font-size: 20px; margin-top: 0;">Bem-vindo ao FitForge!</h2>
        <p style="color: #cbbfa3; font-size: 16px; line-height: 1.5;">Olá, ${studentName || 'Aluno'}.</p>
        <p style="color: #cbbfa3; font-size: 16px; line-height: 1.5;">
          O seu Personal Trainer ${personalName ? `<strong>${personalName}</strong> ` : ''}criou a sua conta no FitForge para acompanhar os seus treinos e evolução.
        </p>
        <p style="color: #cbbfa3; font-size: 16px; line-height: 1.5;">
          Para ativar o seu acesso e definir a sua senha inicial, clique no botão abaixo:
        </p>
        <div style="margin: 32px 0; text-align: center;">
          <a href="${setupUrl}" style="background: linear-gradient(90deg, #f2c265, #e2a83e); color: #1a1408; font-weight: bold; text-decoration: none; padding: 14px 28px; border-radius: 6px; display: inline-block; font-size: 16px;">
            Ativar Conta e Criar Senha
          </a>
        </div>
        <p style="color: #a7a095; font-size: 14px; line-height: 1.5;">
          Este link de ativação é seguro, de utilização única e expira dentro de 1 hora.
        </p>
        <p style="color: #a7a095; font-size: 14px; line-height: 1.5;">
          Caso o botão acima não funcione, copie e cole o seguinte link no seu navegador:<br/>
          <a href="${setupUrl}" style="color: #e2a83e; word-break: break-all;">${setupUrl}</a>
        </p>
        <hr style="border: none; border-top: 1px solid #232019; margin: 32px 0;" />
        <p style="color: #6f6a5f; font-size: 12px; margin: 0;">
          Se não reconhece este convite, ignore este e-mail.
        </p>
      </div>
    `;

    if (!this.resend) {
      this.logger.log(
        `[MOCK EMAIL] To: ${to} | Subject: Convite para o FitForge | URL: ${setupUrl}`,
      );
      return;
    }

    try {
      const response = await this.resend.emails.send({
        from: this.defaultFrom,
        to,
        subject: 'Convite para o FitForge - Ative a sua conta',
        html,
      });

      if (response.error) {
        this.logger.error(
          `Failed to send student invite email to ${to}: ${response.error.message}`,
        );
      } else {
        this.logger.log(
          `Student invite email sent successfully to ${to} (ID: ${response.data?.id})`,
        );
      }
    } catch (error) {
      this.logger.error(
        `Exception occurred while sending student invite email to ${to}`,
        error instanceof Error ? error.stack : error,
      );
    }
  }

  async sendWorkoutRequestNotificationEmail(
    to: string,
    personalName: string,
    studentName: string,
  ): Promise<void> {
    const actionUrl = `${this.frontendUrl.replace(/\/$/, '')}/nova-ficha-de-treino`;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #0c0a08; color: #f2ede4; padding: 32px; border-radius: 8px;">
        <div style="border-bottom: 2px solid #e2a83e; padding-bottom: 16px; margin-bottom: 24px;">
          <h1 style="color: #e2a83e; font-size: 24px; margin: 0; letter-spacing: 2px;">FITFORGE</h1>
        </div>
        <h2 style="font-size: 20px; margin-top: 0;">Novo Treino Solicitado</h2>
        <p style="color: #cbbfa3; font-size: 16px; line-height: 1.5;">Olá, ${personalName || 'Personal'}.</p>
        <p style="color: #cbbfa3; font-size: 16px; line-height: 1.5;">
          O seu aluno <strong>${studentName}</strong> está atualmente sem nenhuma ficha de treino ativa e solicitou a criação de uma nova rotina de treinos.
        </p>
        <div style="margin: 32px 0; text-align: center;">
          <a href="${actionUrl}" style="background: linear-gradient(90deg, #f2c265, #e2a83e); color: #1a1408; font-weight: bold; text-decoration: none; padding: 14px 28px; border-radius: 6px; display: inline-block; font-size: 16px;">
            Criar Nova Ficha de Treino
          </a>
        </div>
        <hr style="border: none; border-top: 1px solid #232019; margin: 32px 0;" />
        <p style="color: #6f6a5f; font-size: 12px; margin: 0;">
          FitForge - Acompanhamento e alta performance.
        </p>
      </div>
    `;

    if (!this.resend) {
      this.logger.log(
        `[MOCK EMAIL] To: ${to} | Subject: Solicitação de Treino - ${studentName} | URL: ${actionUrl}`,
      );
      return;
    }

    try {
      const response = await this.resend.emails.send({
        from: this.defaultFrom,
        to,
        subject: `FitForge - ${studentName} solicitou uma nova ficha de treino`,
        html,
      });

      if (response.error) {
        this.logger.error(
          `Failed to send workout request notification email to ${to}: ${response.error.message}`,
        );
      } else {
        this.logger.log(
          `Workout request notification email sent successfully to ${to} (ID: ${response.data?.id})`,
        );
      }
    } catch (error) {
      this.logger.error(
        `Exception occurred while sending workout request notification email to ${to}`,
        error instanceof Error ? error.stack : error,
      );
    }
  }
}
