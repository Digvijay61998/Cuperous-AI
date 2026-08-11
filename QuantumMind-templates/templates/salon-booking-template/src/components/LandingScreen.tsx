import type { SalonConfig } from '../types';

interface LandingScreenProps {
  config: SalonConfig;
  onStart: () => void;
}

export function LandingScreen({ config, onStart }: LandingScreenProps) {
  const { labels, reviews, show_reviews } = config;

  const hasReviews = Array.isArray(reviews) && reviews.length > 0;
  const showReviewSnippet = show_reviews && hasReviews;
  const avgRating = hasReviews
    ? Math.round(
        (reviews.reduce((acc, r) => acc + (Number(r.rating) || 0), 0) /
          reviews.length) *
          10,
      ) / 10
    : 0;

  const heroStyle = config.hero_image
    ? { backgroundImage: `url(${config.hero_image})` }
    : undefined;

  return (
    <section className="landing" aria-labelledby="landing-title">
      <div
        className={`hero-banner ${config.hero_image ? '' : 'hero-banner--solid'}`}
        style={heroStyle}
      >
        <div className="hero-banner__overlay">
          <h1 id="landing-title" className="hero-banner__title">
            {config.hero_title}
          </h1>
          <p className="hero-banner__subtitle">{config.hero_subtitle}</p>
        </div>
      </div>

      {showReviewSnippet && (
        <div className="review-snippet" aria-label="Customer rating">
          <span className="review-snippet__star" aria-hidden="true">
            ★
          </span>
          <strong>{avgRating.toFixed(1)}</strong>
          <span className="review-snippet__count">
            ({reviews.length}{' '}
            {reviews.length === 1 ? 'review' : 'reviews'})
          </span>
        </div>
      )}

      <div className="landing__cta">
        <button className="btn btn--primary" onClick={onStart}>
          {labels.cta_book_now}
        </button>
      </div>
    </section>
  );
}
