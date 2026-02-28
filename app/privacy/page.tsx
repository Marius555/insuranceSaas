import { getSession } from "@/appwrite/getSession";
import { getUserDocument } from "@/appwrite/getUserDocument";
import { Header } from "@/components/navigation/header";
import { Footer } from "@/components/landing/footer";
import { COMPANY } from "@/lib/company";

export const metadata = {
  title: `Privacy Policy - ${COMPANY.name}`,
  description: `Privacy Policy for ${COMPANY.name}.`,
};

export default async function PrivacyPage() {
  const session = await getSession();
  let userDoc = null;
  if (session) userDoc = await getUserDocument(session.id);

  return (
    <div>
      <Header session={session} userDoc={userDoc} />
      <main className="max-w-3xl mx-auto px-4 py-16">
        <h1 className="text-3xl font-bold mb-2">Privacy Policy</h1>
        <p className="text-sm text-muted-foreground mb-10">Last updated: January 1, {COMPANY.copyrightYear}</p>

        <div className="space-y-10 text-sm leading-relaxed">
          <section className="space-y-3">
            <h2 className="text-lg font-semibold">1. Information We Collect</h2>
            <p className="text-muted-foreground">
              We collect information you provide directly, including your name, email address, and account credentials when you create an account. When you submit a vehicle damage claim, we collect the video or images you record, any insurance policy documents you upload, and the details you enter about the incident.
            </p>
            <p className="text-muted-foreground">
              We also automatically collect usage data such as pages visited, features used, device type, browser type, and IP address to help us improve the service.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold">2. How We Use Your Information</h2>
            <p className="text-muted-foreground">
              We use the information we collect to:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
              <li>Provide, operate, and improve the {COMPANY.name} service</li>
              <li>Process vehicle damage assessments using AI analysis</li>
              <li>Authenticate your identity and secure your account</li>
              <li>Send transactional emails (e.g., account confirmation, report ready)</li>
              <li>Respond to your support requests</li>
              <li>Detect and prevent fraudulent activity</li>
            </ul>
            <p className="text-muted-foreground">
              We do not sell your personal information to third parties.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold">3. Data Storage</h2>
            <p className="text-muted-foreground">
              Your account data, uploaded files, and assessment reports are stored using Appwrite, a backend-as-a-service platform. Data is stored in secured cloud infrastructure with encryption at rest and in transit. We implement industry-standard security practices to protect your information from unauthorized access.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold">4. Third-Party Services</h2>
            <p className="text-muted-foreground">
              We use the following third-party services to operate {COMPANY.name}:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
              <li><strong>Google OAuth2</strong> — for sign-in via Google accounts. Your use of Google sign-in is subject to Google&apos;s Privacy Policy.</li>
              <li><strong>Google Gemini AI</strong> — for analyzing vehicle damage from video and images. Media you upload may be sent to Google&apos;s Gemini API for processing. Google&apos;s data processing terms apply.</li>
            </ul>
            <p className="text-muted-foreground">
              We do not control the privacy practices of these third parties and encourage you to review their policies.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold">5. Data Retention</h2>
            <p className="text-muted-foreground">
              We retain your account data and reports for as long as your account is active. You may request deletion of your account and associated data at any time by contacting us at{" "}
              <a href={`mailto:${COMPANY.supportEmail}`} className="text-primary underline underline-offset-4">
                {COMPANY.supportEmail}
              </a>. We will process deletion requests within 30 days.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold">6. Your Rights</h2>
            <p className="text-muted-foreground">
              Depending on your location, you may have the right to access, correct, or delete your personal data. You may also have the right to object to or restrict certain processing, or to request a portable copy of your data. To exercise any of these rights, please contact us using the details below.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold">7. Contact</h2>
            <p className="text-muted-foreground">
              If you have questions about this Privacy Policy or how we handle your data, please contact us:
            </p>
            <address className="not-italic text-muted-foreground space-y-1">
              <p><strong>{COMPANY.legalName}</strong></p>
              {COMPANY.address.split("\n").map((line, i) => (
                <p key={i}>{line}</p>
              ))}
              <p>
                Email:{" "}
                <a href={`mailto:${COMPANY.email}`} className="text-primary underline underline-offset-4">
                  {COMPANY.email}
                </a>
              </p>
            </address>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
