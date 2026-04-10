'use client';

interface PropertyCardProps {
  title: string;
  meta: string;
  imageUrl?: string;
  moveInDate: string;
  moveOutDate: string;
  chipVariant?: 'default' | 'pill';
}

export function PropertyCard({ title, meta, imageUrl, moveInDate, moveOutDate, chipVariant = 'default' }: PropertyCardProps) {
  const chipClass = chipVariant === 'pill'
    ? 'booking-review__chip booking-review__chip--pill'
    : 'booking-review__chip';

  return (
    <div className="booking-review__property-card">
      <div className="booking-review__property-image">
        {imageUrl ? (
          <img src={imageUrl} alt={title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <div className="booking-review__image-placeholder">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#bbb" strokeWidth="1.5">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
          </div>
        )}
      </div>
      <div className="booking-review__property-info">
        <h2 className="booking-review__property-title" style={{ fontWeight: 500 }}>{title}</h2>
        <p className="booking-review__property-meta">{meta}</p>
        <div className="booking-review__date-chips">
          <div className={chipClass}>
            <span className="booking-review__chip-label">Move-In</span>
            <span className="booking-review__chip-date">{moveInDate}</span>
          </div>
          <div className={chipClass}>
            <span className="booking-review__chip-label">Move-Out</span>
            <span className="booking-review__chip-date">{moveOutDate}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
