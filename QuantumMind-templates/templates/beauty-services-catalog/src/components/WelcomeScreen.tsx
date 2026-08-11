import React, { useEffect } from 'react';
import { BeautyConfig } from '../types';
import CategoryIconGrid from './CategoryIconGrid';
import { trackView } from '@quantum/template-sdk';

interface WelcomeScreenProps {
  config: BeautyConfig;
  onStart: () => void;
}

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ config, onStart }) => {
  useEffect(() => {
    try {
      trackView();
    } catch {
      // analytics must never break UI
    }
  }, []);

  const heroStyle: React.CSSProperties = config.hero_image
    ? { backgroundImage: `url(${config.hero_image})`, backgroundSize: 'cover', backgroundPosition: 'center' }
    : { background: `linear-gradient(135deg, ${config.primary_color}, ${config.secondary_color})` };

  return (
    <section className="welcome-screen" aria-label="Welcome">
      <header className="welcome-screen__hero" style={heroStyle}>
        <div className="welcome-screen__overlay">
          <div className="welcome-screen__logo">
            {config.business_logo ? (
              <img src={config.business_logo} alt={config.business_name} className="welcome-screen__logo-img" />
            ) : (
              <span className="welcome-screen__logo-fallback">
                {config.business_name.charAt(0)}
              </span>
            )}
          </div>
          <h1 className="welcome-screen__title">{config.hero_title}</h1>
          <p className="welcome-screen__subtitle">{config.hero_subtitle}</p>
        </div>
      </header>

      <div className="welcome-screen__categories">
        <CategoryIconGrid
          categories={config.categories}
          maxVisible={6}
          ariaLabel="Available service categories"
        />
      </div>

      <button className="welcome-screen__cta" onClick={onStart} type="button">
        {config.labels.start_booking}
      </button>
    </section>
  );
};

export default WelcomeScreen;
