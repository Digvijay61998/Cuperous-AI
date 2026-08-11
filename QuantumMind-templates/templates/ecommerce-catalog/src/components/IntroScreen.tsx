import React from 'react';
import { EcommerceConfig } from '../types';

interface IntroScreenProps {
  config: EcommerceConfig;
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
          <h1 id="intro-title" className="intro-screen__title">
            {config.tagline}
          </h1>
          <p className="intro-screen__subtitle">
            {config.subtitle}
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
