export type CatererOtpEmailContext = {
  fullName: string;
  businessName: string;
  subdomain: string | null;
  otpPlain: string;
};

/** Matches catering-website globals.css / @theme brand tokens */
const BRAND = {
  red: '#e53935',
  redHover: '#c62828',
  dark: '#1c1c1c',
  gold: '#d4af37',
  yellow: '#ffc107',
  bg: '#faf7f4',
  surface: '#ffffff',
  border: '#e7e0d9',
  muted: '#57534e',
  mutedLight: '#78716c',
  grayBg: '#f5f5f5',
} as const;

export type OtpEmailTemplateInput = CatererOtpEmailContext & {
  siteName: string;
  verifyUrl: string | null;
  workspaceHost: string | null;
  /** Public site origin, e.g. https://bharatcaterhub.com */
  homeUrl: string;
  /** Gold chef hat icon — same asset as BrandLogoLink */
  chefHatUrl: string;
  /** Full logo image fallback (SVG) for clients that ignore web fonts */
  logoImageUrl: string;
  brandPrimary: string;
  brandSecondary: string;
};

/** Matches catering-website BrandLogoLink (siteFooter / onboarding on dark). */
function buildBrandLogoEmailHeader(input: OtpEmailTemplateInput): string {
  const home = escapeHtml(input.homeUrl);
  const hat = escapeHtml(input.chefHatUrl);
  const logoImg = escapeHtml(input.logoImageUrl);
  const primary = escapeHtml(input.brandPrimary);
  const secondary = escapeHtml(input.brandSecondary);

  const htmlLogoBlock = hat
    ? `<table role="presentation" cellspacing="0" cellpadding="0" align="center" style="margin:0 auto;">
      <tr>
        <td align="center">
          <a href="${home}" style="text-decoration:none;color:#ffffff;display:inline-block;">
            <table role="presentation" cellspacing="0" cellpadding="0" align="center">
              <tr>
                <td align="center" style="height:24px;line-height:0;font-size:0;padding:0;">
                  <img src="${hat}" width="40" height="40" alt="" style="display:block;margin:0 auto -18px auto;border:0;"/>
                </td>
              </tr>
              <tr>
                <td align="center" style="font-family:'Great Vibes','Brush Script MT','Segoe Script',Georgia,serif;font-size:36px;line-height:1.05;color:#ffffff;padding:8px 0 0 12px;letter-spacing:-0.02em;">
                  ${primary}
                </td>
              </tr>
              <tr>
                <td align="center" style="padding-top:2px;">
                  <span style="display:inline-block;background:${BRAND.red};color:#ffffff;font-size:8px;font-weight:800;letter-spacing:0.12em;text-transform:uppercase;padding:4px 10px;border-radius:4px;">
                    ${secondary}
                  </span>
                </td>
              </tr>
            </table>
          </a>
        </td>
      </tr>
    </table>`
    : '';

  const imageLogoBlock = logoImg
    ? `<a href="${home}" style="text-decoration:none;display:inline-block;line-height:0;">
        <img src="${logoImg}" width="220" height="auto" alt="${escapeHtml(input.siteName)}" style="display:block;margin:0 auto;border:0;max-width:220px;height:auto;"/>
      </a>`
    : '';

  return htmlLogoBlock || imageLogoBlock;
}

export function buildOtpEmailSubject(otpPlain: string, siteName: string): string {
  return `Your ${otpPlain} verification code — ${siteName}`;
}

export function buildOtpEmailText(input: OtpEmailTemplateInput): string {
  const lines = [
    `${input.siteName}`,
    '',
    `Hi ${input.fullName},`,
    '',
    `Thanks for registering ${input.businessName}.`,
    '',
    `Your verification code: ${input.otpPlain}`,
    '',
    'This code expires in 15 minutes.',
  ];
  if (input.verifyUrl) {
    lines.push('', `Verify here: ${input.verifyUrl}`);
  }
  if (input.workspaceHost) {
    lines.push('', `Workspace: ${input.workspaceHost}`);
  }
  lines.push(
    '',
    'If you did not create an account, you can ignore this email.',
    '',
    `— ${input.siteName}`,
  );
  return lines.join('\n');
}

export function buildOtpEmailHtml(input: OtpEmailTemplateInput): string {
  const name = escapeHtml(input.fullName);
  const business = escapeHtml(input.businessName);
  const site = escapeHtml(input.siteName);
  const otp = escapeHtml(input.otpPlain);
  const digitBoxStyle =
    'font-size:28px;font-weight:800;color:#1c1c1c;font-family:ui-monospace,Consolas,monospace;text-align:center;padding:14px 12px;background:#ffffff;border:1px solid #e7e0d9;border-radius:10px;min-width:36px;';
  const digitCells = input.otpPlain
    .padEnd(6, ' ')
    .slice(0, 6)
    .split('')
    .map(
      (d) =>
        `<td style="${digitBoxStyle}">${escapeHtml(d.trim() || '·')}</td><td style="width:6px;font-size:0;line-height:0;">&nbsp;</td>`,
    )
    .join('');

  const workspaceRow = input.workspaceHost
    ? `<tr>
        <td style="padding:0 32px 24px;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:${BRAND.grayBg};border-radius:12px;border:1px solid ${BRAND.border};">
            <tr>
              <td style="padding:14px 18px;font-size:13px;line-height:1.5;color:${BRAND.muted};">
                <strong style="color:${BRAND.dark};">Your workspace</strong><br/>
                <span style="font-family:ui-monospace,Consolas,monospace;color:${BRAND.red};">${escapeHtml(input.workspaceHost)}</span>
                <span style="color:${BRAND.mutedLight};"> — available after verification &amp; DNS setup</span>
              </td>
            </tr>
          </table>
        </td>
      </tr>`
    : '';

  const ctaRow = input.verifyUrl
    ? `<tr>
        <td align="center" style="padding:8px 32px 28px;">
          <a href="${escapeHtml(input.verifyUrl)}" style="display:inline-block;background:${BRAND.red};color:#ffffff;font-size:15px;font-weight:700;text-decoration:none;padding:14px 32px;border-radius:12px;box-shadow:0 8px 20px rgba(229,57,53,0.35);">
            Verify email &rarr;
          </a>
        </td>
      </tr>`
    : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <meta name="color-scheme" content="light"/>
  <meta name="supported-color-schemes" content="light"/>
  <title>Verify your email</title>
  <link href="https://fonts.googleapis.com/css2?family=Great+Vibes&amp;display=swap" rel="stylesheet"/>
</head>
<body style="margin:0;padding:0;background:${BRAND.bg};font-family:system-ui,-apple-system,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;-webkit-font-smoothing:antialiased;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:${BRAND.bg};">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;">
          <!-- Header (BrandLogoLink on dark — Great Vibes + gold hat + red badge) -->
          <tr>
            <td style="background:${BRAND.dark};border-radius:16px 16px 0 0;padding:28px 32px 26px;text-align:center;">
              ${buildBrandLogoEmailHeader(input)}
            </td>
          </tr>
          <!-- Body card -->
          <tr>
            <td style="background:${BRAND.surface};border-left:1px solid ${BRAND.border};border-right:1px solid ${BRAND.border};">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="padding:32px 32px 8px;">
                    <p style="margin:0 0 6px;font-size:11px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:${BRAND.red};">
                      Email verification
                    </p>
                    <h1 style="margin:0;font-size:24px;font-weight:800;line-height:1.25;color:${BRAND.dark};">
                      Verify your email
                    </h1>
                  </td>
                </tr>
                <tr>
                  <td style="padding:12px 32px 0;font-size:15px;line-height:1.6;color:${BRAND.muted};">
                    <p style="margin:0 0 12px;">Hi <strong style="color:${BRAND.dark};">${name}</strong>,</p>
                    <p style="margin:0;">
                      Thanks for registering <strong style="color:${BRAND.dark};">${business}</strong> on ${site}.
                      Enter this one-time code on the verification page:
                    </p>
                  </td>
                </tr>
                <!-- OTP boxes -->
                <tr>
                  <td style="padding:28px 24px 8px;">
                    <table role="presentation" cellspacing="0" cellpadding="0" align="center">
                      <tr>${digitCells}</tr>
                    </table>
                    <p style="margin:16px 0 0;text-align:center;font-size:12px;color:${BRAND.mutedLight};letter-spacing:0.05em;">
                      Or copy: <strong style="color:${BRAND.dark};font-family:ui-monospace,Consolas,monospace;letter-spacing:0.2em;">${otp}</strong>
                    </p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:8px 32px 0;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                      <tr>
                        <td style="border-left:4px solid ${BRAND.yellow};background:${BRAND.grayBg};border-radius:0 8px 8px 0;padding:12px 16px;font-size:13px;line-height:1.5;color:${BRAND.muted};">
                          <strong style="color:${BRAND.dark};">Expires in 15 minutes.</strong>
                          If you didn&rsquo;t sign up, you can safely ignore this email.
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                ${ctaRow}
                ${workspaceRow}
              </table>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background:${BRAND.dark};border-radius:0 0 16px 16px;padding:20px 32px;text-align:center;">
              <p style="margin:0 0 8px;font-size:13px;font-weight:600;color:#ffffff;">
                ${site}
              </p>
              <p style="margin:0;font-size:11px;line-height:1.5;color:#9ca3af;">
                India&rsquo;s trusted catering directory &middot; Automated message, please do not reply
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 16px 0;text-align:center;font-size:11px;color:${BRAND.mutedLight};">
              &copy; ${new Date().getFullYear()} ${site}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
