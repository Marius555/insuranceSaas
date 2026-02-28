import { getSession } from "@/appwrite/getSession";
import { getUserDocument } from "@/appwrite/getUserDocument";
import { Header } from "@/components/navigation/header";
import { Footer } from "@/components/landing/footer";
import { COMPANY } from "@/lib/company";

export const metadata = {
  title: `Contact - ${COMPANY.name}`,
  description: `Get in touch with ${COMPANY.name}.`,
};

export default async function ContactPage() {
  const session = await getSession();
  let userDoc = null;
  if (session) userDoc = await getUserDocument(session.id);

  return (
    <div>
      <Header session={session} userDoc={userDoc} />
      <main className="max-w-3xl mx-auto px-4 py-16">
        <h1 className="text-3xl font-bold mb-2">Contact Us</h1>
        <p className="text-sm text-muted-foreground mb-10">
          Have a question or need help? Reach out to us using any of the methods below.
        </p>

        <div className="space-y-8">
          <div className="rounded-lg border border-border bg-card p-6 space-y-5">
            <h2 className="text-base font-semibold">{COMPANY.legalName}</h2>

            <div className="space-y-4 text-sm">
              <div className="flex flex-col gap-0.5">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">General Inquiries</span>
                <a
                  href={`mailto:${COMPANY.email}`}
                  className="text-primary underline underline-offset-4 hover:opacity-80 transition-opacity"
                >
                  {COMPANY.email}
                </a>
              </div>

              <div className="flex flex-col gap-0.5">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Support</span>
                <a
                  href={`mailto:${COMPANY.supportEmail}`}
                  className="text-primary underline underline-offset-4 hover:opacity-80 transition-opacity"
                >
                  {COMPANY.supportEmail}
                </a>
              </div>

              <div className="flex flex-col gap-0.5">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Phone</span>
                <a
                  href={`tel:${COMPANY.phone.replace(/\s/g, "")}`}
                  className="text-foreground hover:text-primary transition-colors"
                >
                  {COMPANY.phone}
                </a>
              </div>

              <div className="flex flex-col gap-0.5">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Address</span>
                <address className="not-italic text-foreground">
                  {COMPANY.address.split("\n").map((line, i) => (
                    <span key={i} className="block">{line}</span>
                  ))}
                </address>
              </div>
            </div>
          </div>

          <p className="text-sm text-muted-foreground">
            We aim to respond to all inquiries within one business day.
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
