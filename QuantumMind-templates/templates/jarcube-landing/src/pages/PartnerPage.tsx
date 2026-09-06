import React from 'react';
import PageShell from '../components/PageShell';
import FaqSection from '../components/FaqSection';
import BookACallSection from '../components/BookACallSection';
import LeadForm from '../components/LeadForm';
import Icon from '../components/Icon';
import { partner } from '../content/partner';
import { pricing } from '../content/pricing';
import { messageTemplates } from '../utils/whatsapp';
import {
  computeCommissionRows,
  formatCurrencyValue,
  totalCommission,
} from '../utils/commission';

/**
 * Partner programme page.
 *
 * The commission illustration is computed from `commissionRatePct` and
 * `monthlySalesExample` in the content module, so the rate can be changed in one
 * place and every figure in the table follows. Nothing here is a hard-coded
 * number that could fall out of step with the stated split.
 */
const PartnerPage: React.FC = () => {
  const rows = computeCommissionRows(partner);
  const symbol = pricing.currencySymbol;
  const total = totalCommission(rows);

  const partnerOwned = partner.responsibilities.filter((r) => r.owner === 'partner');
  const jarcubeOwned = partner.responsibilities.filter((r) => r.owner === 'jarcube');

  return (
    <PageShell currentPath="/partner">
      {/* Hero */}
      <section className="jc-section jc-page-head" aria-labelledby="jc-partner-heading">
        <div className="jc-container">
          <div className="jc-section-head">
            <span className="jc-eyebrow">Partner programme</span>
            <h1 id="jc-partner-heading">Earn recurring revenue on every client</h1>
            <p className="jc-lead">
              Bring JarCube to the businesses you already advise. You own the
              relationship and earn on it for as long as they stay. We handle the
              engineering, the escalations and the complex builds.
            </p>
            <div className="jc-row jc-row--wrap jc-hero__actions">
              <a className="jc-btn jc-btn--primary jc-btn--lg" href="#apply">
                Apply to partner
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section
        className="jc-section jc-section--sunken"
        aria-labelledby="jc-partner-benefits"
      >
        <div className="jc-container">
          <div className="jc-section-head">
            <span className="jc-eyebrow">Why partner</span>
            <h2 id="jc-partner-benefits">What makes this worth your time</h2>
          </div>

          <div className="jc-grid jc-grid--2">
            {partner.benefits.map((benefit) => (
              <div className="jc-card jc-benefit" key={benefit.title}>
                <span className="jc-icon-tile">
                  <Icon name="sparkle" className="jc-icon jc-icon--lg" />
                </span>
                <h3>{benefit.title}</h3>
                <p>{benefit.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Model + commission */}
      <section className="jc-section" aria-labelledby="jc-partner-model">
        <div className="jc-container">
          <div className="jc-section-head">
            <span className="jc-eyebrow">The model</span>
            <h2 id="jc-partner-model">
              A {partner.commissionRatePct}% recurring share, stated plainly
            </h2>
            <p className="jc-lead">
              No tiers to unlock and no clawbacks. Here are the terms in full.
            </p>
          </div>

          <div className="jc-split">
            <ul className="jc-terms">
              {partner.modelTerms.map((term) => (
                <li key={term}>
                  <Icon name="check" className="jc-icon jc-terms__tick" />
                  <span>{term}</span>
                </li>
              ))}
            </ul>

            <div className="jc-card jc-commission">
              <table className="jc-commission__table">
                <caption className="jc-commission__caption">
                  Illustrative commission on{' '}
                  {formatCurrencyValue(partner.monthlySalesExample, symbol)} of
                  client billing per month, at {partner.commissionRatePct}%
                  recurring.
                </caption>
                <thead>
                  <tr>
                    <th scope="col">Month</th>
                    <th scope="col">Client billing</th>
                    <th scope="col">Your commission</th>
                    <th scope="col">Running total</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.month}>
                      <th scope="row">Month {row.month}</th>
                      <td>{formatCurrencyValue(row.sales, symbol)}</td>
                      <td>{formatCurrencyValue(row.commission, symbol)}</td>
                      <td>
                        <strong>{formatCurrencyValue(row.cumulative, symbol)}</strong>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="jc-commission__note">
                {formatCurrencyValue(total, symbol)} earned across{' '}
                {partner.exampleMonths} months, and it keeps recurring while the
                client stays.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Feature matrix */}
      <section
        className="jc-section jc-section--sunken"
        aria-labelledby="jc-partner-features"
      >
        <div className="jc-container">
          <div className="jc-section-head">
            <span className="jc-eyebrow">What you are selling</span>
            <h2 id="jc-partner-features">The platform in full</h2>
          </div>

          <div className="jc-matrix">
            {partner.featureGroups.map((group) => (
              <div className="jc-card jc-matrix__group" key={group.group}>
                <h3 className="jc-matrix__heading">{group.group}</h3>
                <dl className="jc-matrix__list">
                  {group.items.map((item) => (
                    <div className="jc-matrix__row" key={item.name}>
                      <dt>{item.name}</dt>
                      <dd>{item.body}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Responsibilities */}
      <section className="jc-section" aria-labelledby="jc-partner-resp">
        <div className="jc-container">
          <div className="jc-section-head">
            <span className="jc-eyebrow">Who does what</span>
            <h2 id="jc-partner-resp">Clear lines, so nothing lands in the gap</h2>
            <p className="jc-lead">
              You stay close to the client. We take the technical weight.
            </p>
          </div>

          <div className="jc-split">
            <div className="jc-card jc-resp">
              <h3 className="jc-resp__owner">You handle</h3>
              <ul>
                {partnerOwned.map((r) => (
                  <li key={r.title}>
                    <h4>{r.title}</h4>
                    <p>{r.body}</p>
                  </li>
                ))}
              </ul>
            </div>

            <div className="jc-card jc-resp jc-resp--ours">
              <h3 className="jc-resp__owner">We handle</h3>
              <ul>
                {jarcubeOwned.map((r) => (
                  <li key={r.title}>
                    <h4>{r.title}</h4>
                    <p>{r.body}</p>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Comparison */}
      <section
        className="jc-section jc-section--sunken"
        aria-labelledby="jc-partner-compare"
      >
        <div className="jc-container">
          <div className="jc-section-head">
            <span className="jc-eyebrow">Where we differ</span>
            <h2 id="jc-partner-compare">
              How JarCube compares to a typical setup
            </h2>
          </div>

          <div className="jc-card jc-compare-wrap">
            <table className="jc-compare">
              <caption className="jc-sr-only">
                Comparison of typical alternatives against JarCube across seven
                categories
              </caption>
              <thead>
                <tr>
                  <th scope="col">Category</th>
                  <th scope="col">Typical setup</th>
                  <th scope="col">JarCube</th>
                </tr>
              </thead>
              <tbody>
                {partner.comparison.map((row) => (
                  <tr key={row.category}>
                    <th scope="row">{row.category}</th>
                    <td className="jc-compare__generic">
                      <Icon name="cross" className="jc-icon jc-compare__x" />
                      <span>{row.generic}</span>
                    </td>
                    <td className="jc-compare__ours">
                      <Icon name="check" className="jc-icon jc-compare__tick" />
                      <span>{row.jarcube}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Application form */}
      <section className="jc-section" id="apply" aria-labelledby="jc-partner-apply">
        <div className="jc-container jc-container--narrow">
          <div className="jc-section-head jc-section-head--center">
            <span className="jc-eyebrow">Apply</span>
            <h2 id="jc-partner-apply">Tell us about your client base</h2>
            <p className="jc-lead">
              A few details and we will get back to you with next steps.
            </p>
          </div>

          <div className="jc-card jc-form-card">
            <LeadForm
              template={messageTemplates.partner}
              fields={['name', 'business', 'phone', 'message']}
              submitLabel="Send application"
            />
          </div>
        </div>
      </section>

      <FaqSection />
      <BookACallSection />
    </PageShell>
  );
};

export default PartnerPage;
