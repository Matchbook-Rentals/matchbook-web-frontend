
// Next.js component to render Freshworks widget
'use client';

import { useEffect } from 'react';

export default function ContactTwo() {
  useEffect(() => {
    // Initialize Freshworks settings
    window.fwSettings = {
      'widget_id': 157000000242
    };

    // Add Freshworks widget initialization script
    const script1 = document.createElement('script');
    script1.text = `
      !function(){if("function"!=typeof window.FreshworksWidget){var n=function(){n.q.push(arguments)};n.q=[],window.FreshworksWidget=n}}()
    `;
    document.head.appendChild(script1);

    // Add Freshworks widget source script
    const script2 = document.createElement('script');
    script2.src = 'https://widget.freshworks.com/widgets/157000000242.js';
    script2.async = true;
    script2.defer = true;
    document.head.appendChild(script2);

    // Cleanup on unmount
    return () => {
      document.head.removeChild(script1);
      document.head.removeChild(script2);
    };
  }, []);

  return (
    <div>
      {/* Empty div as container - widget will be injected by the scripts */}
    </div>
  );
}
