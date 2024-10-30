
// Next.js Contact Page Component
'use client';

import { useEffect } from 'react';
import Script from 'next/script';

export default function Contact() {
  useEffect(() => {
    // Dynamically add Freshdesk CSS
    const style = document.createElement('link');
    style.rel = 'stylesheet';
    style.href = 'https://s3.amazonaws.com/assets.freshdesk.com/widget/freshwidget.css';
    document.head.appendChild(style);

    return () => {
      // Cleanup on unmount
      document.head.removeChild(style);
    };
  }, []);

  return (
    <div className="contact-container">
      <Script
        src="https://s3.amazonaws.com/assets.freshdesk.com/widget/freshwidget.js"
        strategy="lazyOnload"
      />

      <iframe
        title="Feedback Form"
        className="freshwidget-embedded-form"
        id="freshwidget-embedded-form"
        src="https://matchbookrentals.freshdesk.com/widgets/feedback_widget/new?&widgetType=embedded&searchArea=no"
        scrolling="no"
        height="800"
        width="100%"
        frameBorder="0"
      />

      <style jsx>{`
        .contact-container {
          width: 100%;
          max-width: 1200px;
          margin: 0 auto;
          padding: 20px;
        }
      `}</style>
    </div>
  );
}
