import { LegalPageShell } from "@/components/common/LegalPageShell";
import { publicSiteConfig } from "@/lib/site-config";
import type { Metadata } from "next";
export const metadata: Metadata = {
  title: `Privacy Policy | ${publicSiteConfig.siteName}`,
  description: `How ${publicSiteConfig.siteName} collects, uses, and protects your personal information.`,
  alternates: { canonical: `${publicSiteConfig.siteUrl}/privacy` },
};

export default function PrivacyPolicyPage() {
  const contact = publicSiteConfig.contactEmail;

  return (
    <LegalPageShell title="Privacy Policy" lastUpdatedLabel="Last updated: 3 May 2026">
      <p>
        This Privacy Policy describes how <strong>{publicSiteConfig.siteName}</strong> (“we”, “us”, or “our”)
        handles information when you use our website at{" "}
        <a href={publicSiteConfig.siteUrl} className="font-medium text-brand-red underline-offset-2 hover:underline">
          {publicSiteConfig.siteUrl}
        </a>{" "}
        and related services (the “Services”). By using the
        Services, you agree to this policy. If you do not agree, please do not use the Services.
      </p>

      <section>
        <h2>1. Information we collect</h2>
        <p>Depending on how you use the Services, we may collect:</p>
        <ul>
          <li>
            <strong>Account and profile data</strong> — such as name, email address, phone number, business
            name, and catering profile details you choose to provide.
          </li>
          <li>
            <strong>Content you submit</strong> — listings, photos, descriptions, enquiries, reviews, and
            messages sent through forms or the platform.
          </li>
          <li>
            <strong>Technical data</strong> — such as IP address, browser type, device identifiers, and
            approximate location derived from IP, plus cookies or similar technologies where applicable.
          </li>
          <li>
            <strong>Communications</strong> — records of support requests and correspondence with us.
          </li>
        </ul>
      </section>

      <section>
        <h2>2. How we use information</h2>
        <p>We use the information above to:</p>
        <ul>
          <li>Provide, operate, and improve the Services and directory features;</li>
          <li>Create and manage accounts, authenticate users, and display public marketplace listings;</li>
          <li>Facilitate enquiries between customers and caterers, and send service-related notices;</li>
          <li>Analyse usage trends, maintain security, detect fraud or abuse, and comply with law;</li>
          <li>Send marketing communications where permitted — you may opt out where applicable.</li>
        </ul>
      </section>

      <section>
        <h2>3. Sharing of information</h2>
        <p>We may share information:</p>
        <ul>
          <li>
            <strong>With other users</strong> — profile and listing information you publish is visible as
            described in your account settings and on the site.
          </li>
          <li>
            <strong>With service providers</strong> who assist us (e.g. hosting, email, analytics, storage)
            under contractual obligations to protect data.
          </li>
          <li>
            <strong>For legal reasons</strong> — if required by law, regulation, court order, or to protect
            rights, safety, and integrity of our users and the Services.
          </li>
          <li>
            <strong>In a business transfer</strong> — such as a merger or acquisition, subject to
            appropriate safeguards.
          </li>
        </ul>
        <p>We do not sell your personal information as a standalone product.</p>
      </section>

      <section>
        <h2>4. Data retention</h2>
        <p>
          We retain information for as long as needed to provide the Services, comply with legal obligations,
          resolve disputes, and enforce our agreements. Retention periods may vary by data type and use case.
        </p>
      </section>

      <section>
        <h2>5. Security</h2>
        <p>
          We implement reasonable technical and organisational measures to protect information. No method of
          transmission or storage is completely secure; we cannot guarantee absolute security.
        </p>
      </section>

      <section>
        <h2>6. Your choices and rights</h2>
        <p>
          Depending on applicable law (including Indian privacy norms where relevant), you may have rights to
          access, correct, delete, or restrict certain processing of your personal information, or to object to
          processing or withdraw consent where processing is consent-based. To exercise these rights, contact
          us using the details below. You may also unsubscribe from marketing emails via the link in those
          messages.
        </p>
      </section>

      <section>
        <h2>7. Children</h2>
        <p>
          The Services are not directed at children under 18. We do not knowingly collect personal information
          from children. If you believe we have collected such information, please contact us so we can delete
          it.
        </p>
      </section>

      <section>
        <h2>8. International transfers</h2>
        <p>
          Your information may be processed in India or other countries where we or our providers operate. We
          take steps designed to ensure appropriate safeguards where required by law.
        </p>
      </section>

      <section>
        <h2>9. Changes to this policy</h2>
        <p>
          We may update this Privacy Policy from time to time. We will post the revised version on this page
          and update the “Last updated” date. Continued use of the Services after changes constitutes
          acceptance of the updated policy where permitted by law.
        </p>
      </section>

      <section>
        <h2>10. Contact</h2>
        <p>
          For privacy-related questions or requests, contact us at{" "}
          <a href={`mailto:${contact}`}>{contact}</a>
          {publicSiteConfig.supportPhoneDisplay ? (
            <>
              {" "}
              or by phone at{" "}
              <a href={`tel:${publicSiteConfig.supportPhoneTel}`}>
                {publicSiteConfig.supportPhoneDisplay}
              </a>
            </>
          ) : null}
          .
        </p>
        <p className="text-sm text-gray-500">
          This page is provided for general information and does not constitute legal advice. For specific legal
          questions, consult a qualified professional.
        </p>
      </section>
    </LegalPageShell>
  );
}
