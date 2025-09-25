export const CookieNoticeContent = () => (
  <>
    <p className="mb-6">
      <strong>Last Updated:</strong> 10 September 2025
    </p>

    <p className="mb-6">
      This Cookie Notice explains how MatchBook LLC (&quot;MatchBook,&quot; &quot;we,&quot; &quot;us,&quot; or &quot;our&quot;) uses cookies and similar technologies on our Website. It should be read together with our Privacy Policy.
    </p>

    <p className="mb-6">
      By continuing to browse or use our Website, you agree that we can store and access cookies and similar technologies as described in this notice.
    </p>

    <h2 className="text-xl font-semibold mb-4">What Are Cookies?</h2>

    <p className="mb-6">
      Cookies are small text files placed on your device that help us recognize you, remember your preferences, and improve your experience. Cookies may be set by us (&quot;first-party cookies&quot;) or by third parties that provide services to us (&quot;third-party cookies&quot;).
    </p>

    <p className="mb-6">
      We also use other technologies such as web beacons, clear gifs, pixel tags, and single-pixel gifs that work with cookies to help us count visitors, measure engagement, and verify system integrity.
    </p>

    <h2 className="text-xl font-semibold mb-4">Types of Cookies We Use</h2>

    <h3 className="text-lg font-semibold mb-3">Strictly Necessary Cookies</h3>
    <p className="mb-6">
      Required for the operation of our Website. They enable core functions such as account login, secure transactions, and fraud prevention.
    </p>

    <h3 className="text-lg font-semibold mb-3">Functional Cookies</h3>
    <p className="mb-6">
      Allow our Website to remember your preferences (such as language or region) and provide enhanced, personalized features.
    </p>

    <h3 className="text-lg font-semibold mb-3">Analytics and Performance Cookies</h3>
    <p className="mb-6">
      Collect information about how visitors use our Website (e.g., which pages are visited most often, errors encountered). We use this information to improve performance and understand usage.
    </p>

    <h3 className="text-lg font-semibold mb-3">Advertising and Targeting Cookies</h3>
    <p className="mb-6">
      Record your visits to our Website, pages viewed, and links followed. We use this information to deliver relevant advertising and may share it with third parties for the same purpose.
    </p>

    <h2 className="text-xl font-semibold mb-4">Cookie Table</h2>

    <div className="overflow-x-auto mb-8">
      <table className="w-full border-collapse border border-gray-300">
        <thead>
          <tr className="bg-gray-50">
            <th className="border border-gray-300 p-3 text-left font-semibold">Cookie Name</th>
            <th className="border border-gray-300 p-3 text-left font-semibold">Provider</th>
            <th className="border border-gray-300 p-3 text-left font-semibold">Type</th>
            <th className="border border-gray-300 p-3 text-left font-semibold">Duration</th>
            <th className="border border-gray-300 p-3 text-left font-semibold">Purpose</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="border border-gray-300 p-3 font-mono">session_id</td>
            <td className="border border-gray-300 p-3">MatchBook</td>
            <td className="border border-gray-300 p-3">Strictly Necessary</td>
            <td className="border border-gray-300 p-3">Session</td>
            <td className="border border-gray-300 p-3">Maintains your session when logged into your account; required for security and authentication.</td>
          </tr>
          <tr className="bg-gray-25">
            <td className="border border-gray-300 p-3 font-mono">csrf_token</td>
            <td className="border border-gray-300 p-3">MatchBook</td>
            <td className="border border-gray-300 p-3">Strictly Necessary</td>
            <td className="border border-gray-300 p-3">Session</td>
            <td className="border border-gray-300 p-3">Protects against cross-site request forgery (CSRF) attacks.</td>
          </tr>
          <tr>
            <td className="border border-gray-300 p-3 font-mono">remember_me</td>
            <td className="border border-gray-300 p-3">MatchBook</td>
            <td className="border border-gray-300 p-3">Functional</td>
            <td className="border border-gray-300 p-3">30 days</td>
            <td className="border border-gray-300 p-3">Remembers your login credentials to simplify repeat access.</td>
          </tr>
          <tr className="bg-gray-25">
            <td className="border border-gray-300 p-3 font-mono">_ga</td>
            <td className="border border-gray-300 p-3">Google Analytics</td>
            <td className="border border-gray-300 p-3">Analytics</td>
            <td className="border border-gray-300 p-3">2 years</td>
            <td className="border border-gray-300 p-3">Tracks Website usage and performance metrics (e.g., pages visited, session duration).</td>
          </tr>
          <tr>
            <td className="border border-gray-300 p-3 font-mono">_gid</td>
            <td className="border border-gray-300 p-3">Google Analytics</td>
            <td className="border border-gray-300 p-3">Analytics</td>
            <td className="border border-gray-300 p-3">24 hours</td>
            <td className="border border-gray-300 p-3">Distinguishes unique users for analytics tracking.</td>
          </tr>
          <tr className="bg-gray-25">
            <td className="border border-gray-300 p-3 font-mono">_gat</td>
            <td className="border border-gray-300 p-3">Google Analytics</td>
            <td className="border border-gray-300 p-3">Analytics</td>
            <td className="border border-gray-300 p-3">1 minute</td>
            <td className="border border-gray-300 p-3">Limits the rate of requests sent to Google Analytics servers.</td>
          </tr>
          <tr>
            <td className="border border-gray-300 p-3 font-mono">fr</td>
            <td className="border border-gray-300 p-3">Meta (Facebook)</td>
            <td className="border border-gray-300 p-3">Advertising</td>
            <td className="border border-gray-300 p-3">3 months</td>
            <td className="border border-gray-300 p-3">Delivers targeted ads, measures ad performance, and improves relevance.</td>
          </tr>
          <tr className="bg-gray-25">
            <td className="border border-gray-300 p-3 font-mono">IDE</td>
            <td className="border border-gray-300 p-3">Google Ads (DoubleClick)</td>
            <td className="border border-gray-300 p-3">Advertising</td>
            <td className="border border-gray-300 p-3">1 year</td>
            <td className="border border-gray-300 p-3">Provides interest-based advertising and measures ad campaign effectiveness.</td>
          </tr>
          <tr>
            <td className="border border-gray-300 p-3 font-mono">ad_id</td>
            <td className="border border-gray-300 p-3">Your Ad Partner</td>
            <td className="border border-gray-300 p-3">Advertising</td>
            <td className="border border-gray-300 p-3">Varies</td>
            <td className="border border-gray-300 p-3">Identifies and tracks ad engagement to deliver personalized marketing.</td>
          </tr>
        </tbody>
      </table>
    </div>

    <h2 className="text-xl font-semibold mb-4">Behavioral Tracking</h2>

    <p className="mb-6">
      We may use cookies and similar technologies to collect information about your online activities over time and across third-party websites or other online services (behavioral tracking).
    </p>

    <p className="mb-6">
      For information about how you can opt out of behavioral tracking on this Website and how we respond to web browser signals (such as &quot;Do Not Track&quot;), please see our Do Not Track Disclosure.
    </p>

    <h2 className="text-xl font-semibold mb-4">Managing Cookies</h2>

    <p className="mb-6">
      You can control or disable cookies through your browser settings. Please note that if you disable cookies, some parts of our Website may become inaccessible or not function properly.
    </p>

    <p className="mb-4">
      For more information on how to manage cookies, please visit the help pages of your browser:
    </p>

    <div className="mb-6 pl-6">
      <p className="mb-2">
        &bull; <a href="https://support.google.com/chrome/answer/95647" className="text-blue-600 hover:text-blue-800 underline" target="_blank" rel="noopener noreferrer">Google Chrome</a>
      </p>
      <p className="mb-2">
        &bull; <a href="https://support.mozilla.org/en-US/kb/enhanced-tracking-protection-firefox-desktop" className="text-blue-600 hover:text-blue-800 underline" target="_blank" rel="noopener noreferrer">Mozilla Firefox</a>
      </p>
      <p className="mb-2">
        &bull; <a href="https://support.apple.com/guide/safari/manage-cookies-and-website-data-sfri11471/mac" className="text-blue-600 hover:text-blue-800 underline" target="_blank" rel="noopener noreferrer">Safari</a>
      </p>
      <p className="mb-2">
        &bull; <a href="https://support.microsoft.com/en-us/microsoft-edge/delete-cookies-in-microsoft-edge-63947406-40ac-c3b8-57b9-2a946a29ae09" className="text-blue-600 hover:text-blue-800 underline" target="_blank" rel="noopener noreferrer">Microsoft Edge</a>
      </p>
    </div>

    <h2 className="text-xl font-semibold mb-4">Opt-Out Options</h2>

    <p className="mb-4">
      You can also opt out of interest-based advertising through these industry resources:
    </p>

    <div className="mb-6 pl-6">
      <p className="mb-2">
        &bull; <a href="https://optout.networkadvertising.org/" className="text-blue-600 hover:text-blue-800 underline" target="_blank" rel="noopener noreferrer">Network Advertising Initiative (NAI) Opt-Out</a>
      </p>
      <p className="mb-2">
        &bull; <a href="https://optout.aboutads.info/" className="text-blue-600 hover:text-blue-800 underline" target="_blank" rel="noopener noreferrer">Digital Advertising Alliance (DAA) Opt-Out</a>
      </p>
      <p className="mb-2">
        &bull; <a href="https://adssettings.google.com/" className="text-blue-600 hover:text-blue-800 underline" target="_blank" rel="noopener noreferrer">Google Ads Settings</a>
      </p>
      <p className="mb-2">
        &bull; <a href="https://www.facebook.com/settings?tab=ads" className="text-blue-600 hover:text-blue-800 underline" target="_blank" rel="noopener noreferrer">Facebook Ad Preferences</a>
      </p>
    </div>

    <h2 className="text-xl font-semibold mb-4">Updates to This Cookie Notice</h2>

    <p className="mb-6">
      We may update this Cookie Notice from time to time to reflect changes in technology, law, or our practices. When we do, we will post the updated version on this page with a revised &quot;Last Updated&quot; date.
    </p>

    <p className="mb-6">
      <strong>Questions About Cookies?</strong> If you have questions about our use of cookies or this Cookie Notice, please contact us at <a href="mailto:Support@matchbookrentals.com" className="text-blue-600 hover:text-blue-800 underline">Support@matchbookrentals.com</a>
    </p>

    <p className="mb-6">
      <strong>Important Note:</strong> This Cookie Notice is part of our Privacy Policy. For more information about how we collect, use, and protect your personal information, please review our complete <a href="/privacy-policy" className="text-blue-600 hover:text-blue-800 underline">Privacy Policy</a>.
    </p>
  </>
);