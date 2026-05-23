/**
 * Write OTP email HTML preview (run after build).
 *   npm run mail:preview
 * Open catering-backend/otp-email-preview.html in a browser.
 */
const fs = require('fs');
const path = require('path');

const distPath = path.join(__dirname, '../dist/mail/otp-email.template.js');
if (!fs.existsSync(distPath)) {
  console.error('Run npm run build first.');
  process.exit(1);
}

const { buildOtpEmailHtml } = require(distPath);
const appUrl = (process.env.APP_PUBLIC_URL || 'http://localhost:3000').replace(/\/$/, '');
const html = buildOtpEmailHtml({
  fullName: 'Rajesh Kumar',
  businessName: 'Royal Rajputana Caterers',
  subdomain: 'royal-rajputana',
  otpPlain: '482916',
  siteName: 'Bharat Cater Hub',
  verifyUrl: `${appUrl}/verify-otp`,
  workspaceHost: 'royal-rajputana.bharatcaterhub.com',
  homeUrl: appUrl,
  chefHatUrl: `${appUrl}/brand/chef-hat-gold.svg`,
  logoImageUrl: `${appUrl}/brand/bharat-cater-hub-logo-email.svg`,
  brandPrimary: 'Bharat',
  brandSecondary: 'Cater Hub',
});

const out = path.join(__dirname, '../otp-email-preview.html');
fs.writeFileSync(out, html, 'utf8');
console.log(`Preview written: ${out}`);
