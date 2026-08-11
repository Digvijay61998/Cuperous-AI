import type { MeetingConfig } from '../types';

interface InfoPanelProps {
  config: MeetingConfig;
}

export function InfoPanel({ config }: InfoPanelProps) {
  const hasLogo = Boolean(config.business_logo);
  const fallbackChar = config.business_name?.charAt(0)?.toUpperCase() || 'M';

  return (
    <header className="info-panel">
      {/* Logo */}
      {hasLogo ? (
        <img
          src={config.business_logo}
          alt={`${config.business_name} logo`}
          className="info-panel__logo"
        />
      ) : (
        <div className="info-panel__logo--fallback" aria-hidden="true">
          {fallbackChar}
        </div>
      )}

      {/* Content block */}
      <div className="info-panel__content">
        <h2 className="info-panel__title">{config.meeting_title}</h2>
        <p className="info-panel__subtitle">{config.meeting_subtitle}</p>
      </div>

      {/* Duration badge */}
      <div className="info-panel__duration">
        <svg
          className="info-panel__duration-icon"
          viewBox="0 0 16 16"
          fill="none"
          aria-hidden="true"
        >
          <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" />
          <path d="M8 4v4l2.5 1.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        <span>{config.meeting_duration} min</span>
      </div>

      {/* Description (desktop only) */}
      <p className="info-panel__description">{config.meeting_description}</p>
    </header>
  );
}
