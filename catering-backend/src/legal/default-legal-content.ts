/** Default English HTML for seeding legal CMS (placeholders replaced at serve time). */

export const LEGAL_PLACEHOLDERS = {
  siteName: '{{siteName}}',
  siteUrl: '{{siteUrl}}',
  contactEmail: '{{contactEmail}}',
  supportPhoneInline: '{{supportPhoneInline}}',
} as const;

export const DEFAULT_TERMS_TITLE = 'Terms & Conditions';
export const DEFAULT_TERMS_LAST_UPDATED = 'Last updated: 3 May 2026';

export const DEFAULT_TERMS_BODY_HTML = `<p>
These Terms &amp; Conditions (&ldquo;Terms&rdquo;) govern your access to and use of the website and services operated
by <strong>${LEGAL_PLACEHOLDERS.siteName}</strong> (&ldquo;we&rdquo;, &ldquo;us&rdquo;, &ldquo;our&rdquo;) at
<a href="${LEGAL_PLACEHOLDERS.siteUrl}">${LEGAL_PLACEHOLDERS.siteUrl}</a>
(the &ldquo;Services&rdquo;). By accessing or using the Services,
you agree to be bound by these Terms. If you disagree, do not use the Services.
</p>
<section><h2>1. The Services</h2><p>
The Services include an online directory and marketplace-style platform that helps users discover
catering businesses and enables caterers to publish profiles, packages, and related information. We
facilitate discovery and communication; unless expressly stated, we are not a party to contracts
between customers and caterers for food, events, or deliveries.
</p></section>
<section><h2>2. Eligibility</h2><p>
You must be at least eighteen (18) years old and capable of entering a binding agreement under
applicable law to use the Services. If you use the Services on behalf of a business, you represent
that you have authority to bind that business.
</p></section>
<section><h2>3. Accounts</h2><p>
You may need an account to access certain features. You agree to provide accurate information, keep
credentials confidential, and notify us of unauthorised use. We may suspend or terminate accounts that
violate these Terms or pose risk to the Services or other users.
</p></section>
<section><h2>4. User content and listings</h2><p>
You retain ownership of content you submit. You grant us a worldwide, non-exclusive licence to host,
display, reproduce, adapt, and distribute such content as reasonably necessary to operate and promote
the Services. You represent that you have all rights necessary to grant this licence and that your
content does not infringe third-party rights or violate law.
</p><p>
Caterers are responsible for the accuracy of menus, pricing indications, availability, licences,
hygiene claims, and imagery. Customers are responsible for verifying details directly with caterers
before placing orders or signing contracts.
</p></section>
<section><h2>5. Acceptable use</h2><p>You agree not to:</p><ul>
<li>Use the Services unlawfully, fraudulently, or to harass, abuse, or harm others;</li>
<li>Attempt to gain unauthorised access to systems, accounts, or data;</li>
<li>Introduce malware, scrape or overload the Services in a way that impairs performance;</li>
<li>Misrepresent identity or affiliation, or post misleading or defamatory content;</li>
<li>Circumvent payment, verification, or listing policies where applicable.</li>
</ul></section>
<section><h2>6. Fees and payments</h2><p>
Certain features may be subject to fees (e.g. subscription or promotional placements). Where fees
apply, terms will be presented at checkout or in a separate agreement. Taxes may apply as required
by law.
</p></section>
<section><h2>7. Intellectual property</h2><p>
Except for user content, the Services, branding, logos, and underlying software are owned by us or
our licensors and are protected by intellectual property laws. No rights are granted except as
expressly stated in these Terms.
</p></section>
<section><h2>8. Third-party links</h2><p>
The Services may link to third-party websites or services. We are not responsible for their content
or practices. Your use of third-party sites is at your own risk and subject to their terms.
</p></section>
<section><h2>9. Disclaimers</h2><p>
The Services are provided on an &ldquo;as is&rdquo; and &ldquo;as available&rdquo; basis. To the fullest extent permitted by
law, we disclaim all warranties, express or implied, including merchantability, fitness for a
particular purpose, and non-infringement. We do not warrant uninterrupted or error-free operation.
</p></section>
<section><h2>10. Limitation of liability</h2><p>
To the fullest extent permitted by applicable law, we and our affiliates, directors, employees, and
agents shall not be liable for any indirect, incidental, special, consequential, or punitive damages,
or for loss of profits, data, or goodwill, arising from your use of the Services. Our aggregate
liability for any claim arising out of these Terms or the Services shall not exceed the greater of
(a) the amount you paid us for the Services in the twelve (12) months before the claim or (b) INR
5,000, except where liability cannot be limited under mandatory law.
</p></section>
<section><h2>11. Indemnity</h2><p>
You agree to indemnify and hold harmless ${LEGAL_PLACEHOLDERS.siteName} and its affiliates from claims,
damages, losses, and expenses (including reasonable legal fees) arising from your content, your use of
the Services, or your breach of these Terms.
</p></section>
<section><h2>12. Governing law and disputes</h2><p>
These Terms are governed by the laws of India, without regard to conflict-of-law rules. Courts at
Mumbai, Maharashtra shall have exclusive jurisdiction, subject to any mandatory provisions applicable
to consumers.
</p></section>
<section><h2>13. Changes</h2><p>
We may modify these Terms by posting an updated version on this page and revising the &ldquo;Last updated&rdquo;
date. Material changes may be communicated via the Services or email where appropriate. Continued use
after changes become effective constitutes acceptance of the revised Terms.
</p></section>
<section><h2>14. Contact</h2><p>
Questions about these Terms: <a href="mailto:${LEGAL_PLACEHOLDERS.contactEmail}">${LEGAL_PLACEHOLDERS.contactEmail}</a>${LEGAL_PLACEHOLDERS.supportPhoneInline}
</p><p class="text-sm text-gray-500">
These Terms are a general template for product use. Have them reviewed by qualified counsel before
relying on them for regulatory or litigation purposes.
</p></section>`;

export const DEFAULT_PRIVACY_TITLE = 'Privacy Policy';
export const DEFAULT_PRIVACY_LAST_UPDATED = 'Last updated: 3 May 2026';

export const DEFAULT_PRIVACY_BODY_HTML = `<p>
This Privacy Policy describes how <strong>${LEGAL_PLACEHOLDERS.siteName}</strong> (&ldquo;we&rdquo;, &ldquo;us&rdquo;, or &ldquo;our&rdquo;)
handles information when you use our website at
<a href="${LEGAL_PLACEHOLDERS.siteUrl}">${LEGAL_PLACEHOLDERS.siteUrl}</a>
and related services (the &ldquo;Services&rdquo;). By using the
Services, you agree to this policy. If you do not agree, please do not use the Services.
</p>
<section><h2>1. Information we collect</h2><p>Depending on how you use the Services, we may collect:</p><ul>
<li><strong>Account and profile data</strong> — such as name, email address, phone number, business
name, and catering profile details you choose to provide.</li>
<li><strong>Content you submit</strong> — listings, photos, descriptions, enquiries, reviews, and
messages sent through forms or the platform.</li>
<li><strong>Technical data</strong> — such as IP address, browser type, device identifiers, and
approximate location derived from IP, plus cookies or similar technologies where applicable.</li>
<li><strong>Communications</strong> — records of support requests and correspondence with us.</li>
</ul></section>
<section><h2>2. How we use information</h2><p>We use the information above to:</p><ul>
<li>Provide, operate, and improve the Services and directory features;</li>
<li>Create and manage accounts, authenticate users, and display public marketplace listings;</li>
<li>Facilitate enquiries between customers and caterers, and send service-related notices;</li>
<li>Analyse usage trends, maintain security, detect fraud or abuse, and comply with law;</li>
<li>Send marketing communications where permitted — you may opt out where applicable.</li>
</ul></section>
<section><h2>3. Sharing of information</h2><p>We may share information:</p><ul>
<li><strong>With other users</strong> — profile and listing information you publish is visible as
described in your account settings and on the site.</li>
<li><strong>With service providers</strong> who assist us (e.g. hosting, email, analytics, storage)
under contractual obligations to protect data.</li>
<li><strong>For legal reasons</strong> — if required by law, regulation, court order, or to protect
rights, safety, and integrity of our users and the Services.</li>
<li><strong>In a business transfer</strong> — such as a merger or acquisition, subject to
appropriate safeguards.</li>
</ul><p>We do not sell your personal information as a standalone product.</p></section>
<section><h2>4. Data retention</h2><p>
We retain information for as long as needed to provide the Services, comply with legal obligations,
resolve disputes, and enforce our agreements. Retention periods may vary by data type and use case.
</p></section>
<section><h2>5. Security</h2><p>
We implement reasonable technical and organisational measures to protect information. No method of
transmission or storage is completely secure; we cannot guarantee absolute security.
</p></section>
<section><h2>6. Your choices and rights</h2><p>
Depending on applicable law (including Indian privacy norms where relevant), you may have rights to
access, correct, delete, or restrict certain processing of your personal information, or to object to
processing or withdraw consent where processing is consent-based. To exercise these rights, contact
us using the details below. You may also unsubscribe from marketing emails via the link in those
messages.
</p></section>
<section><h2>7. Children</h2><p>
The Services are not directed at children under 18. We do not knowingly collect personal information
from children. If you believe we have collected such information, please contact us so we can delete
it.
</p></section>
<section><h2>8. International transfers</h2><p>
Your information may be processed in India or other countries where we or our providers operate. We
take steps designed to ensure appropriate safeguards where required by law.
</p></section>
<section><h2>9. Changes to this policy</h2><p>
We may update this Privacy Policy from time to time. We will post the revised version on this page
and update the &ldquo;Last updated&rdquo; date. Continued use of the Services after changes constitutes
acceptance of the updated policy where permitted by law.
</p></section>
<section><h2>10. Contact</h2><p>
For privacy-related questions or requests, contact us at
<a href="mailto:${LEGAL_PLACEHOLDERS.contactEmail}">${LEGAL_PLACEHOLDERS.contactEmail}</a>${LEGAL_PLACEHOLDERS.supportPhoneInline}.
</p><p class="text-sm text-gray-500">
This page is provided for general information and does not constitute legal advice. For specific legal
questions, consult a qualified professional.
</p></section>`;
