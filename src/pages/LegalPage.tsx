import { useEffect } from "react";

type LegalPageProps = {
  type: "privacy" | "terms";
};

const CONTACT_EMAIL = "kaiit.student@gmail.com";
const UPDATED_DATE = "June 4, 2026";

export default function LegalPage({ type }: LegalPageProps) {
  const isPrivacy = type === "privacy";

  useEffect(() => {
    document.title = isPrivacy ? "Privacy Policy | Algorithm Animator Studio" : "Terms of Service | Algorithm Animator Studio";
  }, [isPrivacy]);

  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="mx-auto w-full max-w-3xl px-5 py-10 sm:py-14">
        <p className="text-sm font-medium uppercase tracking-wide text-muted-foreground">Algorithm Animator Studio</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
          {isPrivacy ? "Privacy Policy" : "Terms of Service"}
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">Last updated: {UPDATED_DATE}</p>

        {isPrivacy ? <PrivacyPolicy /> : <TermsOfService />}

        <section className="mt-8 rounded-md border border-border bg-card p-4 text-sm text-muted-foreground">
          <h2 className="text-base font-semibold text-foreground">Contact</h2>
          <p className="mt-2">
            For questions about this page, contact{" "}
            <a className="text-primary underline underline-offset-4" href={`mailto:${CONTACT_EMAIL}`}>
              {CONTACT_EMAIL}
            </a>
            .
          </p>
        </section>
      </section>
    </main>
  );
}

function PrivacyPolicy() {
  return (
    <div className="mt-8 space-y-7 text-sm leading-7 text-muted-foreground">
      <section>
        <h2 className="text-xl font-semibold text-foreground">Overview</h2>
        <p className="mt-2">
          Algorithm Animator Studio helps users create algorithm animations, generated assets, and video publishing
          workflows. This policy explains what information may be processed when you use the application.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-foreground">Information We Process</h2>
        <p className="mt-2">
          The application may process account information required for authentication, runtime configuration entered by
          the user, generated media metadata, and YouTube upload metadata such as title, description, tags, and privacy
          status. User-provided files and generated content are used only to provide the requested app functionality.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-foreground">Google And YouTube Data</h2>
        <p className="mt-2">
          When a user connects Google or YouTube, the application uses the granted permissions only to perform actions
          requested by the user, such as preparing or uploading videos to the user&apos;s YouTube channel. The application
          does not sell Google user data or use it for advertising.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-foreground">Data Sharing</h2>
        <p className="mt-2">
          We do not sell personal information. Data may be sent to service providers only when necessary to run the
          application, authenticate users, generate media, or complete a user-requested publishing action.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-foreground">Retention And Control</h2>
        <p className="mt-2">
          Local runtime settings may be stored in the browser or in the configured application storage. Users can clear
          local settings from the app settings area or request assistance by contacting the email listed below.
        </p>
      </section>
    </div>
  );
}

function TermsOfService() {
  return (
    <div className="mt-8 space-y-7 text-sm leading-7 text-muted-foreground">
      <section>
        <h2 className="text-xl font-semibold text-foreground">Use Of The Service</h2>
        <p className="mt-2">
          Algorithm Animator Studio is provided for creating educational algorithm animations, generated media, and
          related publishing workflows. Users are responsible for the content they create, upload, export, or publish.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-foreground">User Content</h2>
        <p className="mt-2">
          You must have the rights needed to use any text, images, audio, video, or other materials submitted to the
          application. Do not use the service to create or publish unlawful, infringing, or harmful content.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-foreground">Third-Party Services</h2>
        <p className="mt-2">
          The application may integrate with third-party services, including Google and YouTube. Your use of those
          services is also governed by their own terms, policies, and permission settings.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-foreground">Availability</h2>
        <p className="mt-2">
          The service is provided as-is and may change over time. We do not guarantee uninterrupted availability,
          compatibility with every runtime environment, or successful publishing to third-party platforms.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-foreground">Changes To These Terms</h2>
        <p className="mt-2">
          These terms may be updated when the application changes. Continued use of the application after updates means
          you accept the revised terms.
        </p>
      </section>
    </div>
  );
}
