import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Use | WISeReady",
  description:
    "Review the terms that govern use of the WISeReady proof-of-concept Medicare prior-authorization reference tool.",
};

export default function TermsPage() {
  return (
    <main className="space-y-12">
      <section className="space-y-4">
        <h2 className="text-3xl font-semibold tracking-tight">Terms of Use</h2>
        <p className="text-sm text-neutral-500">Last updated: October 28, 2025</p>
        <p>
          These Terms of Use (&quot;Terms&quot;) govern your access to and use of the
          WISeReady web application (the &quot;Service&quot;). WISeReady is a proof-of-concept prototype that surfaces current Medicare data and code references to help with WISeR prior-authorization research. By accessing or using the Service you agree to be bound by these Terms. If you do not agree with any part of the Terms, you must not use the Service.
        </p>
      </section>

      <section className="space-y-3">
        <h3 className="text-xl font-semibold tracking-tight">Informational Prototype Only</h3>
        <p>
          WISeReady is an informational tool that references currently available Medicare policy data, code sets, and WISeR program information. It is an early-stage prototype, and the experience, data coverage, and outputs are subject to rapid change. The Service does not provide medical, legal, billing, or compliance advice, and the content is not a substitute for professional judgment.
        </p>
      </section>

      <section className="space-y-3">
        <h3 className="text-xl font-semibold tracking-tight">Data Verification Responsibilities</h3>
        <p>
          While the Service draws from current Medicare resources and procedure codes, you remain solely responsible for validating all results against official Centers for Medicare &amp; Medicaid Services (CMS) publications, your Medicare Administrative Contractor (MAC), and any other authoritative payer sources before making clinical, billing, operational, or compliance decisions. Do not rely on the Service as your only source of truth.
        </p>
      </section>

      <section className="space-y-3">
        <h3 className="text-xl font-semibold tracking-tight">Use of the Service</h3>
        <p>
          You may use the Service only in accordance with these Terms and any
          applicable laws and regulations. You agree not to attempt to interfere
          with the proper functioning of the Service, reverse engineer any part
          of it, or use it to develop a competing product without prior written
          permission from Slicera.
        </p>
      </section>

      <section className="space-y-3">
        <h3 className="text-xl font-semibold tracking-tight">No Warranty</h3>
        <p>
          The Service is provided on an &quot;as is&quot; and &quot;as available&quot; basis without
          warranties of any kind, whether express or implied. Slicera does not
          guarantee that the Service will be uninterrupted, error-free, feature-complete, or that
          the information provided will remain current or accurate. Prototype features may be incomplete or include sample content. Your use of
          the Service is at your sole risk.
        </p>
      </section>

      <section className="space-y-3">
        <h3 className="text-xl font-semibold tracking-tight">
          Limitation of Liability
        </h3>
        <p>
          To the fullest extent permitted by law, Slicera and its officers,
          employees, partners, and affiliates shall not be liable for any indirect,
          incidental, special, consequential, or exemplary damages arising from
          or relating to your use of, or inability to use, the Service. Slicera’s
          total cumulative liability for any claim related to the Service shall
          not exceed one hundred U.S. dollars (USD $100).
        </p>
      </section>

      <section className="space-y-3">
        <h3 className="text-xl font-semibold tracking-tight">Updates</h3>
        <p>
          We may revise these Terms at any time by posting an updated version on
          this page. The &quot;Last updated&quot; date will reflect the most recent
          changes. Continued use of the Service after updates become effective
          constitutes acceptance of the revised Terms.
        </p>
      </section>

      <section className="space-y-3">
        <h3 className="text-xl font-semibold tracking-tight">Contact</h3>
        <p>
          If you have questions about these Terms or the Service, please contact
          Slicera at{" "}
          <a
            href="mailto:support@slicera.io"
            className="underline decoration-dotted underline-offset-4 hover:decoration-solid"
          >
            support@slicera.io
          </a>
          .
        </p>
      </section>
    </main>
  );
}
