'use client';

export function ConfirmationHeader() {
  return (
    <div className="flex flex-col items-center justify-center gap-[20px] py-[24px]">
      <div
        className="flex items-center justify-center rounded-full"
        style={{
          width: 56,
          height: 56,
          border: '2px solid #0e7c6b',
          background: '#0e7c6b',
        }}
        aria-hidden="true"
      >
        <svg
          width="28"
          height="28"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#fff"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </div>

      <h1
        style={{
          color: '#24282E',
          textAlign: 'center',
          fontFamily: 'Poppins, sans-serif',
          fontSize: 24,
          fontStyle: 'normal',
          fontWeight: 500,
          lineHeight: '120%',
          textTransform: 'capitalize',
          margin: 0,
        }}
      >
        Booking Confirmed!
      </h1>
    </div>
  );
}
