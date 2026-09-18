interface Props {
  onOpenAccess: () => void;
  contactMailto: string;
  feedbackUrl: string;
  searchSlot: React.ReactNode;
  greeting: string;
  pinnedSlot: React.ReactNode;
}

/**
 * Dark navy masthead: brand, nav actions, search, greeting, and pinned panel.
 *
 * "Contact us" is a plain mailto link and "Feedback" is a direct external
 * Office Forms link (both configured via backend metadata). Only the
 * "Get access" action opens an in-app modal.
 */
export function Header({
  onOpenAccess,
  contactMailto,
  feedbackUrl,
  searchSlot,
  greeting,
  pinnedSlot,
}: Props) {
  return (
    <header className="masthead" role="banner">
      <div className="wrap">
        <nav className="nav" aria-label="Primary">
          <div className="brand">
            <div className="brand__plate" aria-label="Pfizer">Pfizer</div>
            <div className="brand__div" aria-hidden />
            <div className="brand__lockup">
              <div className="brand__kicker">Prometheus</div>
              <div className="brand__name">Tender &amp; Contract Analytics</div>
            </div>
          </div>
          {searchSlot}
          <div className="nav__actions">
            <a
              className="navlink"
              href={contactMailto || 'mailto:analytics@pfizer.com'}
              target="_blank"
              rel="noopener noreferrer"
            >
              Contact us
            </a>
            {feedbackUrl ? (
              <a
                className="navlink"
                href={feedbackUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                Feedback
              </a>
            ) : null}
            <button className="btn-cta" type="button" onClick={onOpenAccess}>Get access</button>
          </div>
        </nav>

        <div className="hero">
          <div>
            <div className="eyebrow">Prometheus · Analytics portal</div>
            <h1 className="hero__title">
              {greeting} <span className="grad">Welcome back.</span>
            </h1>
            <p className="hero__lede">
              Explore Global Tenders &amp; Contracts analytics across platforms and markets.
            </p>
          </div>
          {pinnedSlot}
        </div>
      </div>
    </header>
  );
}
