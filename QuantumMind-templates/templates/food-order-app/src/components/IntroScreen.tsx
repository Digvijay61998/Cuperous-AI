import React from 'react';
import { FoodOrderConfig } from '../types';

interface IntroScreenProps {
  config: FoodOrderConfig;
  onStart: () => void;
}

const IntroScreen: React.FC<IntroScreenProps> = ({ config, onStart }) => {
  return (
    <section className="intro-screen" aria-labelledby="intro-title">
      <div className="intro-screen__hero">
        {config.hero_image ? (
          <img
            className="intro-screen__hero-img"
            src={config.hero_image}
            alt={`${config.brand_name} hero`}
          />
        ) : (
          <div className="intro-screen__hero-gradient" aria-hidden="true" />
        )}
        <div className="intro-screen__overlay">
          <div className="intro-screen__logo">
            {config.brand_logo ? (
              <img
                className="intro-screen__logo-img"
                src={config.brand_logo}
                alt={`${config.brand_name} logo`}
              />
            ) : (
              <div className="intro-screen__logo-fallback" aria-hidden="true">
                {config.brand_name.charAt(0)}
              </div>
            )}
          </div>
          <h1 id="intro-title" className="intro-screen__title">
            {config.brand_name}
          </h1>
          <p className="intro-screen__tagline">
            {config.labels.intro_tagline}
          </p>
        </div>
      </div>
      <div className="intro-screen__content">
        <button
          className="intro-screen__cta"
          onClick={onStart}
          type="button"
        >
          {config.labels.get_started}
        </button>
      </div>
    </section>
  );
};

export default IntroScreen;
