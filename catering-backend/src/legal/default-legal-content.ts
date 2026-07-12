/** Default English HTML for seeding legal CMS (placeholders replaced at serve time). */

export const LEGAL_PLACEHOLDERS = {
  siteName: '{{siteName}}',
  siteUrl: '{{siteUrl}}',
  contactEmail: '{{contactEmail}}',
  supportPhoneInline: '{{supportPhoneInline}}',
} as const;

export const DEFAULT_TERMS_TITLE = 'Terms & Conditions';
export const DEFAULT_TERMS_LAST_UPDATED = 'Effective Date: June 23, 2026';

export const DEFAULT_TERMS_BODY_HTML = `<p>
Welcome to <strong>${LEGAL_PLACEHOLDERS.siteName}</strong> (&ldquo;Platform&rdquo;, &ldquo;Website&rdquo;, &ldquo;we&rdquo;, &ldquo;our&rdquo;, or &ldquo;us&rdquo;).
By accessing or using our website <a href="${LEGAL_PLACEHOLDERS.siteUrl}">${LEGAL_PLACEHOLDERS.siteUrl}</a>,
you agree to comply with and be bound by these Terms &amp; Conditions.
If you do not agree with these terms, please do not use our platform.
</p>
<section><h2>1. About Bharat Cater Hub</h2><p>
${LEGAL_PLACEHOLDERS.siteName} is an online marketplace that connects customers with caterers across India.
Caterer owners can create business listings, upload menus, packages, images, and receive enquiries from potential customers.
${LEGAL_PLACEHOLDERS.siteName} acts only as a facilitator and is not a party to any agreement between customers and caterers.
</p></section>
<section><h2>2. Eligibility</h2><p>By using this platform, you confirm that:</p><ul>
<li>You are at least 18 years old.</li>
<li>You have the legal authority to enter into agreements.</li>
<li>All information you provide is accurate and up to date.</li>
</ul></section>
<section><h2>3. User Accounts</h2><p>Users may create accounts to access certain features. You are responsible for:</p><ul>
<li>Maintaining account confidentiality.</li>
<li>Protecting your login credentials.</li>
<li>All activities performed under your account.</li>
</ul><p>You must immediately notify us of any unauthorized account access.</p></section>
<section><h2>4. Caterer Listings</h2><p>Caterer owners are solely responsible for the accuracy of their listings, including:</p><ul>
<li>Business details</li>
<li>Menus</li>
<li>Pricing</li>
<li>Images</li>
<li>Service descriptions</li>
<li>Availability</li>
</ul><p>${LEGAL_PLACEHOLDERS.siteName} does not guarantee the accuracy or completeness of any listing.</p></section>
<section><h2>5. Customer Enquiries</h2><p>
Customers may submit enquiries through the platform. Submitting an enquiry does not create any contractual relationship with
${LEGAL_PLACEHOLDERS.siteName}. Any final agreement, pricing, negotiation, booking, or payment is solely between the customer and the caterer.
</p></section>
<section><h2>6. No Guarantee</h2><p>${LEGAL_PLACEHOLDERS.siteName} does not guarantee:</p><ul>
<li>Caterer availability</li>
<li>Service quality</li>
<li>Pricing accuracy</li>
<li>Customer satisfaction</li>
<li>Event outcomes</li>
<li>Booking confirmations</li>
</ul><p>Users must independently verify all information before making decisions.</p></section>
<section><h2>7. Payments</h2><p>If payment features are introduced in the future:</p><ul>
<li>${LEGAL_PLACEHOLDERS.siteName} may facilitate transactions.</li>
<li>Additional payment terms may apply.</li>
<li>Applicable taxes and charges may be collected.</li>
</ul><p>Currently, ${LEGAL_PLACEHOLDERS.siteName} is not responsible for transactions conducted outside the platform.</p></section>
<section><h2>8. Prohibited Activities</h2><p>Users must not:</p><ul>
<li>Provide false information.</li>
<li>Post misleading content.</li>
<li>Upload copyrighted material without permission.</li>
<li>Spam other users.</li>
<li>Attempt unauthorized access.</li>
<li>Interfere with website functionality.</li>
<li>Use the platform for unlawful activities.</li>
</ul><p>Violation may result in account suspension or permanent removal.</p></section>
<section><h2>9. Intellectual Property</h2><p>All website content including:</p><ul>
<li>Logo</li>
<li>Design</li>
<li>Software</li>
<li>Text</li>
<li>Graphics</li>
<li>Branding</li>
</ul><p>belongs to ${LEGAL_PLACEHOLDERS.siteName} unless otherwise stated. Unauthorized reproduction or distribution is prohibited.</p></section>
<section><h2>10. Third-Party Links</h2><p>
Our website may contain links to third-party websites. We are not responsible for their content, privacy practices, or services.
Users access third-party websites at their own risk.
</p></section>
<section><h2>11. Limitation of Liability</h2><p>${LEGAL_PLACEHOLDERS.siteName} shall not be liable for:</p><ul>
<li>Any direct or indirect damages.</li>
<li>Business losses.</li>
<li>Data loss.</li>
<li>Service interruptions.</li>
<li>Disputes between customers and caterers.</li>
<li>Event cancellations or dissatisfaction.</li>
</ul><p>Users use the platform at their own risk.</p></section>
<section><h2>12. Indemnification</h2><p>
Users agree to indemnify and hold ${LEGAL_PLACEHOLDERS.siteName} harmless from any claims, damages, liabilities, expenses,
or legal actions arising from misuse of the platform.
</p></section>
<section><h2>13. Termination</h2><p>
We reserve the right to suspend or terminate any account without prior notice if users violate these Terms &amp; Conditions.
</p></section>
<section><h2>14. Changes to Terms</h2><p>
We may update these Terms &amp; Conditions at any time. Updated versions will be posted on this page with a revised effective date.
Continued use of the platform constitutes acceptance of the updated terms.
</p></section>
<section><h2>15. Governing Law</h2><p>
These Terms &amp; Conditions shall be governed by the laws of India. Any disputes shall be subject to the jurisdiction of courts
located in Ahmedabad, Gujarat, India.
</p></section>
<section><h2>16. Contact Us</h2><p>
<strong>${LEGAL_PLACEHOLDERS.siteName}</strong><br />
Website: <a href="${LEGAL_PLACEHOLDERS.siteUrl}">${LEGAL_PLACEHOLDERS.siteUrl}</a><br />
Email: <a href="mailto:${LEGAL_PLACEHOLDERS.contactEmail}">${LEGAL_PLACEHOLDERS.contactEmail}</a>${LEGAL_PLACEHOLDERS.supportPhoneInline}
</p></section>`;

export const DEFAULT_PRIVACY_TITLE = 'Privacy Policy';
export const DEFAULT_PRIVACY_LAST_UPDATED = 'Effective Date: June 23, 2026';

export const DEFAULT_PRIVACY_BODY_HTML = `<p>
At <strong>${LEGAL_PLACEHOLDERS.siteName}</strong> (&ldquo;we&rdquo;, &ldquo;our&rdquo;, &ldquo;us&rdquo;), we value your privacy and are committed to
protecting your personal information. This Privacy Policy explains how we collect, use, store, and protect information when you use
<a href="${LEGAL_PLACEHOLDERS.siteUrl}">${LEGAL_PLACEHOLDERS.siteUrl}</a>.
</p>
<section><h2>1. About Bharat Cater Hub</h2><p>
${LEGAL_PLACEHOLDERS.siteName} is an online platform that connects customers with caterers across India. Caterer owners can create business listings,
upload menus and packages, and receive customer enquiries.
</p></section>
<section><h2>2. Information We Collect</h2>
<h3>Customer Information</h3><p>We may collect:</p><ul>
<li>Name</li>
<li>Mobile Number</li>
<li>Email Address</li>
<li>Event Date</li>
<li>Event Location</li>
<li>Event Type</li>
<li>Number of Guests</li>
<li>Budget Information</li>
<li>Enquiry Details</li>
</ul>
<h3>Caterer Information</h3><p>We may collect:</p><ul>
<li>Business Name</li>
<li>Owner Name</li>
<li>Mobile Number</li>
<li>Email Address</li>
<li>Business Address</li>
<li>City and State</li>
<li>Business Description</li>
<li>Menus and Packages</li>
<li>Images and Pricing</li>
</ul>
<h3>Technical Information</h3><p>We may automatically collect:</p><ul>
<li>IP Address</li>
<li>Device Information</li>
<li>Browser Information</li>
<li>Operating System</li>
<li>Website Usage Data</li>
<li>Cookies</li>
</ul></section>
<section><h2>3. How We Use Your Information</h2><p>We use information to:</p><ul>
<li>Create and manage accounts.</li>
<li>Connect customers with caterers.</li>
<li>Process customer enquiries.</li>
<li>Improve platform performance.</li>
<li>Provide customer support.</li>
<li>Prevent fraud and misuse.</li>
<li>Send notifications and updates.</li>
<li>Comply with legal requirements.</li>
</ul></section>
<section><h2>4. Sharing Information</h2><p>We do not sell personal information. We may share information with:</p><ul>
<li>Registered caterers</li>
<li>Customers requesting services</li>
<li>Technology service providers</li>
<li>Legal or government authorities when required</li>
</ul></section>
<section><h2>5. Data Security</h2><p>
We implement reasonable security measures to protect your information. However, no internet transmission or electronic storage system is completely secure.
</p></section>
<section><h2>6. Cookies</h2><p>We may use cookies to:</p><ul>
<li>Improve website functionality</li>
<li>Remember user preferences</li>
<li>Analyze website traffic</li>
<li>Enhance user experience</li>
</ul><p>Users may disable cookies through browser settings.</p></section>
<section><h2>7. Data Retention</h2><p>We retain data only as long as necessary to:</p><ul>
<li>Provide services</li>
<li>Resolve disputes</li>
<li>Comply with legal obligations</li>
<li>Enforce our policies</li>
</ul></section>
<section><h2>8. Your Rights</h2><p>You may request to:</p><ul>
<li>Access your information</li>
<li>Update incorrect information</li>
<li>Delete your information</li>
<li>Withdraw consent where applicable</li>
</ul><p>Please contact us to exercise these rights.</p></section>
<section><h2>9. Children&rsquo;s Privacy</h2><p>
Our services are not intended for individuals under 18 years of age. We do not knowingly collect information from children.
</p></section>
<section><h2>10. Third-Party Services</h2><p>
We may use third-party tools and services. We are not responsible for their privacy practices. Users should review their respective privacy policies.
</p></section>
<section><h2>11. Policy Updates</h2><p>
We may update this Privacy Policy periodically. Changes will be posted on this page along with the revised effective date.
</p></section>
<section><h2>12. Contact Us</h2><p>
<strong>${LEGAL_PLACEHOLDERS.siteName}</strong><br />
Website: <a href="${LEGAL_PLACEHOLDERS.siteUrl}">${LEGAL_PLACEHOLDERS.siteUrl}</a><br />
Email: <a href="mailto:${LEGAL_PLACEHOLDERS.contactEmail}">${LEGAL_PLACEHOLDERS.contactEmail}</a>${LEGAL_PLACEHOLDERS.supportPhoneInline}
</p><p>By using ${LEGAL_PLACEHOLDERS.siteName}, you agree to this Privacy Policy.</p></section>`;
