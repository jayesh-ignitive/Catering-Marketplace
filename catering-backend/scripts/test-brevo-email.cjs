/**
 * Send a test OTP-style email via Brevo Transactional API (reads catering-backend/.env).
 *
 * Usage:
 *   npm run mail:test
 *   npm run mail:test -- --to=you@example.com
 *   npm run mail:verify
 */
require('dotenv').config();
const fs = require('fs');
const path = require('path');

const BREVO_SEND_URL = 'https://api.brevo.com/v3/smtp/email';
const templateDist = path.join(__dirname, '../dist/mail/otp-email.template.js');

function readEnv(name) {
  return (process.env[name] ?? '').trim();
}

function isTruthy(name) {
  const v = readEnv(name).toLowerCase();
  return v === 'true' || v === '1' || v === 'yes' || v === 'on';
}

function getApiKey() {
  const api = readEnv('BREVO_API_KEY');
  if (api) return api;
  const legacy = readEnv('BREVO_SMTP_KEY');
  if (legacy.startsWith('xkeysib-')) return legacy;
  return '';
}

const toArg = process.argv.find((a) => a.startsWith('--to='));
const to = (toArg ? toArg.slice(5) : readEnv('DEV_OTP_EMAIL') || readEnv('MAIL_FROM')).trim();
const verifyOnly = process.argv.includes('--verify-only');

const apiKey = getApiKey();
const fromEmail = readEnv('MAIL_FROM');
const fromName = readEnv('MAIL_FROM_NAME') || 'Bharat Cater Hub';
const mailEnabled = readEnv('MAIL_ENABLED').toLowerCase();

if (!apiKey) {
  console.error('Set BREVO_API_KEY (xkeysib-…) in .env — Brevo → SMTP & API → API keys.');
  console.error('(Legacy: xkeysib- value in BREVO_SMTP_KEY is still accepted.)');
  process.exit(1);
}
if (mailEnabled === 'false' || mailEnabled === '0') {
  console.error('MAIL_ENABLED=false — remove it or set MAIL_ENABLED=true to send.');
  process.exit(1);
}
if (!fromEmail) {
  console.error('Set MAIL_FROM to a verified sender in Brevo.');
  process.exit(1);
}
if (!to) {
  console.error('Pass --to=your@email.com or set DEV_OTP_EMAIL in .env');
  process.exit(1);
}

const otp =
  readEnv('REGISTRATION_OTP_CODE') ||
  readEnv('DEV_OTP_CODE') ||
  String(Math.floor(100000 + Math.random() * 900000));

function buildPayload() {
  const siteName = readEnv('SITE_NAME') || 'Bharat Cater Hub';
  const appUrl = readEnv('APP_PUBLIC_URL').replace(/\/$/, '');
  const verifyUrl = appUrl ? `${appUrl}/verify-otp` : null;
  const parent = readEnv('SUBDOMAIN_PARENT_DOMAIN') || 'bharatcaterhub.com';

  if (fs.existsSync(templateDist)) {
    const { buildOtpEmailHtml, buildOtpEmailText, buildOtpEmailSubject } =
      require(templateDist);
    const input = {
      fullName: 'Test User',
      businessName: 'Demo Catering Co.',
      subdomain: 'demo-catering',
      otpPlain: otp,
      siteName,
      verifyUrl,
      workspaceHost: `demo-catering.${parent}`,
      homeUrl: appUrl || 'http://localhost:3000',
      chefHatUrl: appUrl ? `${appUrl}/brand/chef-hat-gold.svg` : '',
      logoImageUrl: appUrl ? `${appUrl}/brand/bharat-cater-hub-logo-email.svg` : '',
      brandPrimary: 'Bharat',
      brandSecondary: 'Cater Hub',
    };
    return {
      subject: `[Test] ${buildOtpEmailSubject(otp, siteName)}`,
      text: buildOtpEmailText(input),
      html: buildOtpEmailHtml(input),
    };
  }

  return {
    subject: `[Test] Your verification code: ${otp}`,
    text: `Test OTP: ${otp}\n\nRun npm run build for full branded template.`,
    html: `<p>Test OTP: <strong>${otp}</strong></p>`,
  };
}

async function sendTestEmail() {
  const { subject, text, html } = buildPayload();

  const res = await fetch(BREVO_SEND_URL, {
    method: 'POST',
    headers: {
      accept: 'application/json',
      'content-type': 'application/json',
      'api-key': apiKey,
    },
    body: JSON.stringify({
      sender: { name: fromName, email: fromEmail },
      to: [{ email: to }],
      subject,
      htmlContent: html,
      textContent: text,
    }),
  });

  const bodyText = await res.text();
  let body = {};
  if (bodyText) {
    try {
      body = JSON.parse(bodyText);
    } catch {
      body = { message: bodyText };
    }
  }

  if (!res.ok) {
    throw new Error(`Brevo API ${res.status}: ${body.message ?? bodyText ?? res.statusText}`);
  }

  return body.messageId;
}

async function main() {
  console.log('Brevo Transactional API test');
  console.log(`  api key: ${apiKey.slice(0, 12)}… (${apiKey.startsWith('xkeysib-') ? 'REST' : 'unexpected prefix'})`);
  console.log(`  from: ${fromName} <${fromEmail}>`);
  console.log(`  to:   ${to}`);
  console.log(
    `  fixed OTP mode: ${isTruthy('REGISTRATION_FIXED_OTP') ? 'on' : 'off'}`,
  );

  if (verifyOnly) {
    console.log('\nAPI key present; use mail:test to send a message.');
    return;
  }

  console.log('\nSending test email…');
  const messageId = await sendTestEmail();
  console.log(`\nEmail sent. messageId=${messageId ?? '(none)'}`);
  console.log(`Use OTP ${otp} if fixed OTP mode is enabled.`);
}

main().catch((err) => {
  console.error('\nFailed:', err.message || err);
  process.exit(1);
});
