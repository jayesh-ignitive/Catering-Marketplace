import { LegalPageShell } from "@/components/common/LegalPageShell";
import { publicSiteConfig } from "@/lib/site-config";
import type { Metadata } from "next";
export const metadata: Metadata = {
  title: `Terms & Conditions | ${publicSiteConfig.siteName}`,
  description: `Terms and conditions for using ${publicSiteConfig.siteName} and our catering marketplace.`,
  alternates: { canonical: `${publicSiteConfig.siteUrl}/terms` },
};

export default function TermsPage() {
  const contact = publicSiteConfig.contactEmail;

  return (
    <LegalPageShell title="Terms & Conditions" lastUpdatedLabel="Last updated: 3 May 2026">
      <p>
        These Terms & Conditions (“Terms”) govern your access to and use of the website and services operated
        by <strong>{publicSiteConfig.siteName}</strong> (“we”, “us”, “our”) at{" "}
        <a href={publicSiteConfig.siteUrl} className="font-medium text-brand-red underline-offset-2 hover:underline">
          {publicSiteConfig.siteUrl}
        </a>{" "}
        (the “Services”). By accessing or using the Services,
        you agree to be bound by these Terms. If you disagree, do not use the Services.
      </p>

      <section>
        <h2>1. The Services</h2>
        <p>
          The Services include an online directory and marketplace-style platform that helps users discover
          catering businesses and enables caterers to publish profiles, packages, and related information. We
          facilitate discovery and communication; unless expressly stated, we are not a party to contracts
          between customers and caterers for food, events, or deliveries.
        </p>
      </section>

      <section>
        <h2>2. Eligibility</h2>
        <p>
          You must be at least eighteen (18) years old and capable of entering a binding agreement under
          applicable law to use the Services. If you use the Services on behalf of a business, you represent
          that you have authority to bind that business.
        </p>
      </section>

      <section>
        <h2>3. Accounts</h2>
        <p>
          You may need an account to access certain features. You agree to provide accurate information, keep
          credentials confidential, and notify us of unauthorised use. We may suspend or terminate accounts that
          violate these Terms or pose risk to the Services or other users.
        </p>
      </section>

      <section>
        <h2>4. User content and listings</h2>
        <p>
          You retain ownership of content you submit. You grant us a worldwide, non-exclusive licence to host,
          display, reproduce, adapt, and distribute such content as reasonably necessary to operate and promote
          the Services. You represent that you have all rights necessary to grant this licence and that your
          content does not infringe third-party rights or violate law.
        </p>
        <p>
          Caterers are responsible for the accuracy of menus, pricing indications, availability, licences,
          hygiene claims, and imagery. Customers are responsible for verifying details directly with caterers
          before placing orders or signing contracts.
        </p>
      </section>

      <section>
        <h2>5. Acceptable use</h2>
        <p>You agree not to:</p>
        <ul>
          <li>Use the Services unlawfully, fraudulently, or to harass, abuse, or harm others;</li>
          <li>Attempt to gain unauthorised access to systems, accounts, or data;</li>
          <li>Introduce malware, scrape or overload the Services in a way that impairs performance;</li>
          <li>Misrepresent identity or affiliation, or post misleading or defamatory content;</li>
          <li>Circumvent payment, verification, or listing policies where applicable.</li>
        </ul>
      </section>

      <section>
        <h2>6. Fees and payments</h2>
        <p>
          Certain features may be subject to fees (e.g. subscription or promotional placements). Where fees
          apply, terms will be presented at checkout or in a separate agreement. Taxes may apply as required
          by law.
        </p>
      </section>

      <section>
        <h2>7. Intellectual property</h2>
        <p>
          Except for user content, the Services, branding, logos, and underlying software are owned by us or
          our licensors and are protected by intellectual property laws. No rights are granted except as
          expressly stated in these Terms.
        </p>
      </section>

      <section>
        <h2>8. Third-party links</h2>
        <p>
          The Services may link to third-party websites or services. We are not responsible for their content
          or practices. Your use of third-party sites is at your own risk and subject to their terms.
        </p>
      </section>

      <section>
        <h2>9. Disclaimers</h2>
        <p>
          The Services are provided on an “as is” and “as available” basis. To the fullest extent permitted by
          law, we disclaim all warranties, express or implied, including merchantability, fitness for a
          particular purpose, and non-infringement. We do not warrant uninterrupted or error-free operation.
        </p>
      </section>

      <section>
        <h2>10. Limitation of liability</h2>
        <p>
          To the fullest extent permitted by applicable law, we and our affiliates, directors, employees, and
          agents shall not be liable for any indirect, incidental, special, consequential, or punitive damages,
          or for loss of profits, data, or goodwill, arising from your use of the Services. Our aggregate
          liability for any claim arising out of these Terms or the Services shall not exceed the greater of
          (a) the amount you paid us for the Services in the twelve (12) months before the claim or (b) INR
          5,000, except where liability cannot be limited under mandatory law.
        </p>
      </section>

      <section>
        <h2>11. Indemnity</h2>
        <p>
          You agree to indemnify and hold harmless {publicSiteConfig.siteName} and its affiliates from claims,
          damages, losses, and expenses (including reasonable legal fees) arising from your content, your use of
          the Services, or your breach of these Terms.
        </p>
      </section>

      <section>
        <h2>12. Governing law and disputes</h2>
        <p>
          These Terms are governed by the laws of India, without regard to conflict-of-law rules. Courts at
          Mumbai, Maharashtra shall have exclusive jurisdiction, subject to any mandatory provisions applicable
          to consumers.
        </p>
      </section>

      <section>
        <h2>13. Changes</h2>
        <p>
          We may modify these Terms by posting an updated version on this page and revising the “Last updated”
          date. Material changes may be communicated via the Services or email where appropriate. Continued use
          after changes become effective constitutes acceptance of the revised Terms.
        </p>
      </section>

      <section>
        <h2>14. Contact</h2>
        <p>
          Questions about these Terms:{" "}
          <a href={`mailto:${contact}`}>{contact}</a>
          {publicSiteConfig.supportPhoneDisplay ? (
            <>
              {" "}
              · <a href={`tel:${publicSiteConfig.supportPhoneTel}`}>{publicSiteConfig.supportPhoneDisplay}</a>
            </>
          ) : null}
        </p>
        <p className="text-sm text-gray-500">
          These Terms are a general template for product use. Have them reviewed by qualified counsel before
          relying on them for regulatory or litigation purposes.
        </p>
      </section>
    </LegalPageShell>
  );
}
