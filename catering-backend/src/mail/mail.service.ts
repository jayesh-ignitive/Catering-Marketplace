import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export type CatererOtpEmailContext = {
  fullName: string;
  businessName: string;
  subdomain: string | null;
  otpPlain: string;
};

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  constructor(private readonly config: ConfigService) {}

  /**
   * Logs verification link for legacy token flow (if still issued).
   */
  async sendCatererVerificationEmail(to: string, fullName: string, rawToken: string): Promise<void> {
    const base = this.config.getOrThrow<string>('APP_PUBLIC_URL').replace(/\/$/, '');
    const url = `${base}/verify-email?token=${encodeURIComponent(rawToken)}`;
    this.logger.log(`Verification link for ${to} (${fullName}): ${url}`);
  }

  private workspaceHost(subdomain: string | null): string | null {
    const parent = this.config.get<string>('SUBDOMAIN_PARENT_DOMAIN')?.trim();
    if (!subdomain || !parent) return null;
    return `${subdomain}.${parent}`;
  }

  private buildOtpEmailHtml(ctx: CatererOtpEmailContext): string {
    const workspace = this.workspaceHost(ctx.subdomain);
    const appUrl = this.config.get<string>('APP_PUBLIC_URL')?.replace(/\/$/, '') || '';
    const safeName = escapeHtml(ctx.fullName);
    const safeBusiness = escapeHtml(ctx.businessName);
    const otp = escapeHtml(ctx.otpPlain);
    const workspaceBlock = workspace
      ? `<p style="margin:16px 0 0;font-size:14px;color:#444;">Your workspace will be available at <strong>${escapeHtml(workspace)}</strong> once DNS is configured.</p>`
      : '';

    return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/></head>
<body style="margin:0;padding:0;background:#f4f2ef;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="padding:24px 12px;">
    <tr><td align="center">
      <table role="presentation" width="100%" style="max-width:520px;background:#fff;border-radius:16px;padding:32px 28px;box-shadow:0 8px 30px rgba(0,0,0,.06);">
        <tr><td>
          <p style="margin:0;font-size:12px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:#b45309;">Catering</p>
          <h1 style="margin:12px 0 0;font-size:22px;line-height:1.25;color:#1c1917;">Verify your email</h1>
          <p style="margin:16px 0 0;font-size:15px;line-height:1.55;color:#444;">Hi ${safeName},</p>
          <p style="margin:12px 0 0;font-size:15px;line-height:1.55;color:#444;">Thanks for registering <strong>${safeBusiness}</strong> on our platform. Use this one-time code to verify your email address:</p>
          <p style="margin:28px 0;font-size:36px;font-weight:800;letter-spacing:.35em;text-align:center;color:#1c1917;font-family:ui-monospace,monospace;">${otp}</p>
          <p style="margin:0;font-size:13px;line-height:1.5;color:#78716c;">This code expires in 15 minutes. If you didn’t create an account, you can ignore this message.</p>
          ${workspaceBlock}
          ${
            appUrl
              ? `<p style="margin:24px 0 0;font-size:13px;"><a href="${escapeHtml(appUrl + '/verify-otp')}" style="color:#c2410c;">Open verification page</a></p>`
              : ''
          }
        </td></tr>
      </table>
      <p style="margin:20px 0 0;font-size:11px;color:#a8a29e;">This is an automated message; replies are not monitored.</p>
    </td></tr>
  </table>
</body>
</html>`;
  }

  /** OTP email (HTML + plain text). Replace logger with SMTP/SES in production. */
  async sendCatererOtpEmail(to: string, ctx: CatererOtpEmailContext): Promise<void> {
    const workspace = this.workspaceHost(ctx.subdomain);
    const html = this.buildOtpEmailHtml(ctx);
    const text = [
      `Hi ${ctx.fullName},`,
      ``,
      `Your verification code for ${ctx.businessName} is: ${ctx.otpPlain}`,
      `This code expires in 15 minutes.`,
      workspace ? `Workspace: ${workspace}` : '',
      '',
    ]
      .filter(Boolean)
      .join('\n');

    this.logger.log(`--- OTP email → ${to} ---`);
    this.logger.log(text);
    this.logger.debug(`HTML length ${html.length} chars (template ready for SMTP)`);
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
