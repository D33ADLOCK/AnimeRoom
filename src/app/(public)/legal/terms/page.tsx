export const metadata = {
  title: "Terms of Service — AnimeRoom",
};

export default function TermsPage() {
  return (
    <>
      <h1 className="text-3xl font-extrabold tracking-tight uppercase sm:text-4xl">
        Terms of Service
      </h1>
      <p className="text-xs font-bold text-[var(--color-nb-text)]/50 uppercase">
        Last updated: July 17, 2026
      </p>

      <p>
        These Terms of Service (&quot;Terms&quot;) govern your use of AnimeRoom
        (&quot;AnimeRoom&quot;, &quot;we&quot;, &quot;us&quot;), accessible at
        animeroom.space. By creating an account or using the service, you agree
        to these Terms. If you do not agree, do not use AnimeRoom.
      </p>

      <h2>1. What AnimeRoom is</h2>
      <p>
        AnimeRoom lets you generate short-form &quot;anime roast battle&quot;
        videos from a text prompt. The service uses third-party AI providers to
        generate script text, character images, and voice audio, then assembles
        them into a video you can edit and export. AnimeRoom is an early-stage
        product and features may change, break, or be removed as it develops.
      </p>

      <h2>2. Accounts</h2>
      <ul>
        <li>
          You must create an account (via our authentication provider) to
          generate videos.
        </li>
        <li>
          You must be at least 16 years old, or the age of digital consent in
          your jurisdiction if higher, to use AnimeRoom.
        </li>
        <li>
          You are responsible for activity that happens under your account.
        </li>
      </ul>

      <h2>3. Credits and payments</h2>
      <ul>
        <li>
          New accounts receive a free allotment of credits. Additional credits
          are purchased in one-time packages through Stripe — there are no
          subscriptions or recurring charges.
        </li>
        <li>Purchased credits do not expire.</li>
        <li>
          If a generation fails due to a technical error on our side, the
          credits spent on that attempt are automatically returned to your
          balance.
        </li>
        <li>
          See our{" "}
          <a href="/legal/refund" className="underline">
            Refund Policy
          </a>{" "}
          for what happens when you request a refund.
        </li>
      </ul>

      <h2>4. Your content and prompts</h2>
      <ul>
        <li>
          You are responsible for the prompts you submit and the content you
          choose to publish.
        </li>
        <li>
          Videos are private by default. Publishing a video makes it visible to
          other users on the public Discover feed — this is an explicit action
          you take, not a default.
        </li>
        <li>
          Don&apos;t use AnimeRoom to generate content that is illegal,
          harassing, hateful, sexually exploitative, or that infringes someone
          else&apos;s rights. We may remove content or suspend accounts that
          violate this.
        </li>
      </ul>

      <h2>5. Third-party characters and intellectual property</h2>
      <p>
        AnimeRoom lets you reference existing anime characters in your prompts
        for parody and entertainment purposes. Those characters remain the
        property of their respective copyright and trademark holders. AnimeRoom
        is not affiliated with, sponsored by, or endorsed by any anime studio,
        publisher, or rights holder. If you believe content generated through
        AnimeRoom infringes your rights, contact us at{" "}
        <a href="mailto:support@animeroom.space" className="underline">
          support@animeroom.space
        </a>{" "}
        and we will review and remove it where appropriate.
      </p>

      <h2>6. Service availability</h2>
      <p>
        AnimeRoom is provided &quot;as is&quot; and &quot;as available,&quot;
        without warranties of any kind, express or implied. We do not guarantee
        the service will be uninterrupted, error-free, or that generated content
        will meet any particular standard of quality.
      </p>

      <h2>7. Limitation of liability</h2>
      <p>
        To the maximum extent permitted by law, AnimeRoom and its operators are
        not liable for any indirect, incidental, or consequential damages
        arising from your use of the service. Our total liability for any claim
        relating to AnimeRoom is limited to the amount you paid us in the 3
        months before the claim arose.
      </p>

      <h2>8. Termination</h2>
      <p>
        We may suspend or terminate your access if you violate these Terms. You
        may stop using AnimeRoom at any time. Sections that by their nature
        should survive termination (ownership, liability, disputes) will
        survive.
      </p>

      <h2>9. Changes to these Terms</h2>
      <p>
        We may update these Terms as AnimeRoom develops. We&apos;ll update the
        date at the top of this page when we do. Continuing to use AnimeRoom
        after a change means you accept the updated Terms.
      </p>

      <h2>10. Governing law</h2>
      <p>
        These Terms are governed by the laws of India, without regard to
        conflict-of-law principles.
      </p>

      <h2>11. Contact</h2>
      <p>
        Questions about these Terms? Reach us at{" "}
        <a href="mailto:support@animeroom.space" className="underline">
          support@animeroom.space
        </a>
        .
      </p>
    </>
  );
}
