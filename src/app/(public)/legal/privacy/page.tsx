export const metadata = {
  title: "Privacy Policy — AnimeRoom",
};

export default function PrivacyPage() {
  return (
    <>
      <h1 className="text-3xl font-extrabold tracking-tight uppercase sm:text-4xl">
        Privacy Policy
      </h1>
      <p className="text-xs font-bold text-[var(--color-nb-text)]/50 uppercase">
        Last updated: July 17, 2026
      </p>

      <p>
        This Privacy Policy explains what data AnimeRoom collects, why, and how
        it&apos;s handled. It&apos;s written to match what the product actually
        does today, not what we plan to build.
      </p>

      <h2>1. What we collect</h2>
      <ul>
        <li>
          <strong>Account data:</strong> your name, email address, and
          authentication identifiers, handled by our authentication provider
          (Clerk).
        </li>
        <li>
          <strong>Payment data:</strong> handled directly by Stripe. We never
          see or store your full card number. We keep a record of your purchases
          (package, amount, date) and resulting credit balance.
        </li>
        <li>
          <strong>Generation data:</strong> the prompts you submit, and the
          resulting script text, images, audio, and video files, stored in our
          database and in Cloudflare R2 object storage.
        </li>
        <li>
          <strong>Usage data:</strong> job status and progress events, used to
          show you real-time generation progress.
        </li>
      </ul>

      <h2>2. Who we share it with</h2>
      <p>
        We use third-party services to run AnimeRoom. Each only receives the
        data it needs to do its job:
      </p>
      <ul>
        <li>
          <strong>Clerk</strong> — authentication and account management.
        </li>
        <li>
          <strong>Stripe</strong> — payment processing.
        </li>
        <li>
          <strong>Google (Generative AI)</strong> and <strong>Replicate</strong>{" "}
          — generating script text and character images from your prompts.
        </li>
        <li>
          <strong>Cloudflare R2</strong> — storing generated media files.
        </li>
        <li>
          <strong>Upstash</strong> and <strong>Inngest</strong> — real-time
          status updates and background job orchestration.
        </li>
        <li>
          <strong>Vercel</strong> — application hosting.
        </li>
      </ul>
      <p>
        We don&apos;t sell your data, and we don&apos;t share it with anyone
        beyond what&apos;s needed to run the service described above.
      </p>

      <h2>3. Visibility of your content</h2>
      <p>
        Videos you create are <strong>private by default</strong>. They only
        become visible to other users if you explicitly publish them to the
        public Discover feed. You can unpublish a video at any time, which
        removes it from Discover.
      </p>

      <h2>4. Deletion — what &quot;delete&quot; means today</h2>
      <p>
        We&apos;re honest that our delete lifecycle is still being built. Right
        now, unpublishing or removing a video from your account stops it from
        being reachable through the app. Full deletion of the underlying stored
        files and backups is not yet guaranteed to be immediate — we&apos;re
        actively building durable cleanup for this. If you want a video or your
        account data fully removed sooner, contact{" "}
        <a href="mailto:support@animeroom.space" className="underline">
          support@animeroom.space
        </a>{" "}
        and we&apos;ll handle it manually.
      </p>

      <h2>5. Your rights</h2>
      <p>
        You can ask us what data we hold about you, request a copy of it, or ask
        us to delete your account and associated data, by emailing{" "}
        <a href="mailto:support@animeroom.space" className="underline">
          support@animeroom.space
        </a>
        . We handle these requests manually today and will respond as quickly as
        we can.
      </p>

      <h2>6. Children</h2>
      <p>
        AnimeRoom is not directed at children under 16, and we do not knowingly
        collect personal data from them.
      </p>

      <h2>7. Security</h2>
      <p>
        We use reasonable technical measures (encryption in transit,
        access-controlled storage) to protect your data, but no online service
        can guarantee absolute security.
      </p>

      <h2>8. Changes to this policy</h2>
      <p>
        If this policy changes, we&apos;ll update the date at the top of this
        page. Material changes will be flagged in-app.
      </p>

      <h2>9. Contact</h2>
      <p>
        Questions about this policy? Reach us at{" "}
        <a href="mailto:support@animeroom.space" className="underline">
          support@animeroom.space
        </a>
        .
      </p>
    </>
  );
}
