import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  buildOtpEmailHtml,
  buildOtpEmailSubject,
  buildOtpEmailText,
  type CatererOtpEmailContext,
} from './otp-email.template';

export type { CatererOtpEmailContext };

const BREVO_SEND_URL = 'https://api.brevo.com/v3/smtp/email';

type BrevoSendResponse = { messageId?: string };

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  constructor(private readonly config: ConfigService) {}

  private isMailDisabled(): boolean {
    const disabled = this.config.get<string>('MAIL_ENABLED')?.trim().toLowerCase();
    return disabled === 'false' || disabled === '0';
  }

  /** Brevo REST API key (xkeysib-…). Legacy: xkeysib- value in BREVO_SMTP_KEY. */
  private getBrevoApiKey(): string | null {
    const apiKey = this.config.get<string>('BREVO_API_KEY')?.trim();
    if (apiKey) return apiKey;
    const legacy = this.config.get<string>('BREVO_SMTP_KEY')?.trim();
    if (legacy?.startsWith('xkeysib-')) return legacy;
    return null;
  }

  private isBrevoEnabled(): boolean {
    if (this.isMailDisabled()) return false;
    return Boolean(this.getBrevoApiKey());
  }

  private mailFrom(): { name: string; email: string } | null {
    const email = this.config.get<string>('MAIL_FROM')?.trim();
    if (!email) return null;
    const name =
      this.config.get<string>('MAIL_FROM_NAME')?.trim() || 'Bharat Cater Hub';
    return { name, email };
  }

  private async sendViaBrevoApi(options: {
    to: string;
    subject: string;
    text: string;
    html: string;
  }): Promise<string | undefined> {
    const apiKey = this.getBrevoApiKey();
    const sender = this.mailFrom();
    if (!apiKey || !sender) {
      return undefined;
    }

    const res = await fetch(BREVO_SEND_URL, {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
        'api-key': apiKey,
      },
      body: JSON.stringify({
        sender: { name: sender.name, email: sender.email },
        to: [{ email: options.to }],
        subject: options.subject,
        htmlContent: options.html,
        textContent: options.text,
      }),
    });

    const bodyText = await res.text();
    let body: BrevoSendResponse & { message?: string; code?: string } = {};
    if (bodyText) {
      try {
        body = JSON.parse(bodyText) as typeof body;
      } catch {
        body = { message: bodyText };
      }
    }

    if (!res.ok) {
      const detail = body.message ?? bodyText ?? res.statusText;
      throw new Error(`Brevo API ${res.status}: ${detail}`);
    }

    return body.messageId;
  }

  private async sendMail(options: {
    to: string;
    subject: string;
    text: string;
    html: string;
  }): Promise<boolean> {
    const from = this.mailFrom();

    if (!this.isBrevoEnabled() || !from) {
      this.logger.log(`--- Email (not sent) → ${options.to} ---`);
      this.logger.log(`Subject: ${options.subject}`);
      this.logger.log(options.text);
      if (!from) {
        this.logger.warn('MAIL_FROM is missing — set a verified Brevo sender address');
      } else if (!this.getBrevoApiKey()) {
        this.logger.warn('BREVO_API_KEY is missing — set your Brevo REST API key (xkeysib-…)');
      }
      return false;
    }

    try {
      const messageId = await this.sendViaBrevoApi(options);
      this.logger.log(
        `Email sent → ${options.to} (${messageId ?? 'ok'})`,
      );
      return true;
    } catch (err) {
      this.logger.error(`Email failed → ${options.to}`, err);
      throw err;
    }
  }

  /**
   * Logs verification link for legacy token flow (if still issued).
   */
  async sendCatererVerificationEmail(
    to: string,
    fullName: string,
    rawToken: string,
  ): Promise<void> {
    const base = this.config
      .getOrThrow<string>('APP_PUBLIC_URL')
      .replace(/\/$/, '');
    const url = `${base}/verify-email?token=${encodeURIComponent(rawToken)}`;
    const html = `<p>Hi ${escapeHtml(fullName)},</p><p><a href="${escapeHtml(url)}">Verify your email</a></p>`;
    const text = `Hi ${fullName},\n\nVerify your email: ${url}`;

    await this.sendMail({
      to,
      subject: 'Verify your email',
      text,
      html,
    });
  }

  private workspaceHost(subdomain: string | null): string | null {
    const parent = this.config.get<string>('SUBDOMAIN_PARENT_DOMAIN')?.trim();
    if (!subdomain || !parent) return null;
    return `${subdomain}.${parent}`;
  }

  private siteName(): string {
    return this.config.get<string>('SITE_NAME')?.trim() || 'Bharat Cater Hub';
  }

  private verifyOtpUrl(): string | null {
    const base = this.publicAppUrl();
    return base ? `${base}/verify-otp` : null;
  }

  private publicAppUrl(): string {
    return this.config.get<string>('APP_PUBLIC_URL')?.replace(/\/$/, '') ?? '';
  }

  private emailBrandAsset(path: string): string {
    const base = this.publicAppUrl();
    return base ? `${base}${path}` : '';
  }

  private emailLogoImageUrl(): string {
    const override = this.config.get<string>('EMAIL_LOGO_URL')?.trim();
    if (override) return override;
    return this.emailBrandAsset('/brand/bharat-cater-hub-logo-email.svg');
  }

  /** OTP email (HTML + plain text) via Brevo Transactional API when configured. */
  async sendCatererOtpEmail(
    to: string,
    ctx: CatererOtpEmailContext,
  ): Promise<void> {
    const homeUrl = this.publicAppUrl() || 'https://bharatcaterhub.com';
    const templateInput = {
      ...ctx,
      siteName: this.siteName(),
      verifyUrl: this.verifyOtpUrl(),
      workspaceHost: this.workspaceHost(ctx.subdomain),
      homeUrl,
      chefHatUrl: this.emailBrandAsset('/brand/chef-hat-gold.svg'),
      logoImageUrl: this.emailLogoImageUrl(),
      brandPrimary:
        this.config.get<string>('BRAND_PRIMARY')?.trim() || 'Bharat',
      brandSecondary:
        this.config.get<string>('BRAND_SECONDARY')?.trim() || 'Cater Hub',
    };

    await this.sendMail({
      to,
      subject: buildOtpEmailSubject(ctx.otpPlain, templateInput.siteName),
      text: buildOtpEmailText(templateInput),
      html: buildOtpEmailHtml(templateInput),
    });
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
