import './booking-review.css';

export default function BookingLoading() {
  return (
    <>
      {/* Stepper skeleton */}
      <div className="booking-review__stepper-wrap">
        <div className="booking-review__stepper">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="booking-review__step-item">
              <div className="booking-review__step-dot booking-review__skeleton-pulse" />
              <div className="booking-review__skeleton-text booking-review__skeleton-pulse" />
              {i < 3 && <div className="booking-review__step-line booking-review__skeleton-pulse" />}
            </div>
          ))}
        </div>
      </div>

      {/* Content skeleton */}
      <div className="booking-review__content">
        {/* Property card skeleton */}
        <div className="booking-review__property-card">
          <div className="booking-review__skeleton-image booking-review__skeleton-pulse" />
          <div className="booking-review__property-info">
            <div className="booking-review__skeleton-title booking-review__skeleton-pulse" />
            <div className="booking-review__skeleton-meta booking-review__skeleton-pulse" />
            <div className="booking-review__skeleton-chip booking-review__skeleton-pulse" />
            <div className="booking-review__skeleton-chip booking-review__skeleton-pulse" />
          </div>
        </div>

        {/* Payment section skeleton */}
        <div className="booking-review__section">
          <div className="booking-review__skeleton-section-title booking-review__skeleton-pulse" />
          <div className="booking-review__divider" />
          {[0, 1, 2].map((i) => (
            <div key={i} className="booking-review__skeleton-row booking-review__skeleton-pulse" />
          ))}
        </div>
      </div>

      {/* Footer skeleton */}
      <footer className="booking-review__footer">
        <div className="booking-review__skeleton-btn booking-review__skeleton-pulse" />
        <div className="booking-review__skeleton-btn booking-review__skeleton-pulse" />
      </footer>
    </>
  );
}
