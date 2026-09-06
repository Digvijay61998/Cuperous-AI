import React from 'react';
import PageShell from '../components/PageShell';

/**
 * 404 document.
 *
 * Served by S3 as the bucket's error document, so it renders for any unmatched
 * path. Keeps the full shell so a visitor who lands here still has the nav and
 * can get somewhere useful.
 */
const NotFoundPage: React.FC = () => (
  <PageShell currentPath="/404">
    <section className="jc-section jc-page-head" aria-labelledby="jc-404-heading">
      <div className="jc-container jc-container--narrow jc-404">
        <span className="jc-eyebrow">404</span>
        <h1 id="jc-404-heading">We could not find that page</h1>
        <p className="jc-lead">
          The link may be out of date, or the page may have moved. Try one of these
          instead.
        </p>
        <div className="jc-row jc-row--wrap jc-hero__actions">
          <a className="jc-btn jc-btn--primary jc-btn--lg" href="/">
            Back to home
          </a>
          <a className="jc-btn jc-btn--secondary jc-btn--lg" href="/contact">
            Contact us
          </a>
        </div>
      </div>
    </section>
  </PageShell>
);

export default NotFoundPage;
