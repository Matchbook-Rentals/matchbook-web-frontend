import React from 'react';

interface NotificationEmailProps {
  companyName: string;
  headerText: string;
  contentTitle: string;
  contentText: string;
  buttonText: string;
  buttonUrl: string;
  companyAddress: string;
  companyCity: string;
  companyWebsite: string;
  senderLine?: string;
  footerText?: string;
  tagLink?: {
    text: string;
    url: string;
  };
  secondaryButtonText?: string;
  secondaryButtonUrl?: string;
}

const NotificationEmailTemplate: React.FC<NotificationEmailProps> = ({
  companyName,
  headerText,
  contentTitle,
  contentText,
  buttonText,
  buttonUrl,
  companyAddress,
  companyCity,
  companyWebsite,
  senderLine,
  footerText,
  tagLink,
  secondaryButtonText,
  secondaryButtonUrl,
}) => {
  return (
    <html>
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Notification Email</title>
        <style>{`
          body {
            margin: 0;
            padding: 0;
            font-family: Georgia, serif;
            background-color: #ffffff;
          }
          table {
            border-spacing: 0;
          }
          img {
            display: block;
            max-width: 100%;
            height: auto;
          }
          .message-wrapper {
            background-color: #e7ebe2;
          }
          a.button {
            font-size: 16px;
            font-weight: bold;
            color: #ffffff;
            text-decoration: none;
            display: inline-block;
            background-color: #4c4c4c;
            border-radius: 30px;
            padding: 14px 36px;
            max-width: 80%;
            text-align: center;
          }
          @media (prefers-color-scheme: dark) {
            body,
            table {
              background-color: #000000 !important;
              color: #ffffff !important;
            }
            .message-wrapper {
              background-color: #ff0000 !important;
            }
            .inner-box {
              background-color: #2a2a2a !important;
            }
            .button {
              background-color: #ffffff !important;
              color: #000000 !important;
            }
            a,
            a span {
              color: #ffffff !important;
            }
            .footer-link {
              color: #ffffff !important;
              text-decoration: none;
            }
          }
        `}</style>
      </head>
      <body>
        <table role="presentation" width="100%" cellPadding="0" cellSpacing="0" border="0" align="center">
          <tr>
            <td align="center">
              <table role="presentation" width="100%" cellPadding="0" cellSpacing="0" border="0" style={{ maxWidth: '500px', width: '100%', padding: '40px 20px' }}>
                <tr>
                  <td align="center" style={{ fontSize: '20px', letterSpacing: '1px', paddingBottom: '30px' }}>
                    {companyName}
                  </td>
                </tr>
                <tr>
                  <td align="center" style={{ fontSize: '30px', lineHeight: 1.6, paddingBottom: '40px', fontWeight: 'normal' }}>
                    {headerText}
                  </td>
                </tr>
                <tr>
                  <td className="message-wrapper" style={{ borderRadius: '20px', padding: '20px' }}>
                    <table width="100%" cellPadding="0" cellSpacing="0" border="0">
                      {tagLink && (
                        <tr>
                          <td style={{ padding: '10px 20px 7px 20px', textAlign: 'left' }}>
                            <a 
                              href={tagLink.url}
                              style={{
                                color: '#666',
                                fontSize: '16px',
                                textDecoration: 'none'
                              }}
                            >
                              {tagLink.text}
                            </a>
                          </td>
                        </tr>
                      )}
                      <tr>
                        <td style={{ fontWeight: 'bold', paddingBottom: '15px', fontSize: '16px', textAlign: 'center' }}>
                          {contentTitle}
                        </td>
                      </tr>
                      <tr>
                        <td className="inner-box" style={{ backgroundColor: '#ffffff', borderRadius: '20px', padding: '20px', fontSize: '16px', lineHeight: 1.6 }}>
                          {senderLine && (
                            <p style={{ margin: '0 0 10px 0', fontWeight: 'bold' }}>
                              {senderLine}
                            </p>
                          )}
                          {contentText.split('\n\n').map((paragraph, index) => (
                            <p key={index} style={{ margin: index === 0 ? '0 0 15px 0' : '0 0 10px 0' }}>
                              {paragraph}
                            </p>
                          ))}
                          {footerText && (
                            <p style={{ margin: '15px 0 0 0', fontStyle: 'italic', color: '#666' }}>
                              {footerText}
                            </p>
                          )}
                        </td>
                      </tr>
                      <tr>
                        <td align="center" style={{ paddingTop: '20px' }}>
                          <a href={buttonUrl} className="button">
                            {buttonText}
                          </a>
                        </td>
                      </tr>
                      {secondaryButtonText && secondaryButtonUrl && (
                        <tr>
                          <td align="center" style={{ paddingTop: '15px' }}>
                            <a href={secondaryButtonUrl} className="button" style={{ backgroundColor: '#6c757d' }}>
                              {secondaryButtonText}
                            </a>
                          </td>
                        </tr>
                      )}
                    </table>
                  </td>
                </tr>
                <tr>
                  <td align="center" style={{ padding: '40px 0 10px 0' }}>
                    <table cellPadding="0" cellSpacing="0" border="0" align="center">
                      <tr>
                        <td align="center" style={{ padding: '0 8px' }}>
                          <a 
                            href="https://www.facebook.com/matchbookrentals"
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              width: '40px',
                              height: '40px',
                              backgroundColor: '#0B6E6E',
                              borderRadius: '50%',
                              boxSizing: 'border-box'
                            }}
                          >
                            <img 
                              src="https://img.icons8.com/?size=100&id=98972&format=png&color=FFFFFF"
                              alt="Facebook"
                              width="24"
                              height="24"
                              style={{ display: 'block', borderRadius: '50%' }}
                            />
                          </a>
                        </td>
                        <td align="center" style={{ padding: '0 8px' }}>
                          <a 
                            href="https://www.instagram.com/matchbookrentals"
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              width: '40px',
                              height: '40px',
                              backgroundColor: '#0B6E6E',
                              borderRadius: '50%',
                              boxSizing: 'border-box'
                            }}
                          >
                            <img 
                              src="https://img.icons8.com/?size=100&id=32292&format=png&color=FFFFFF"
                              alt="Instagram"
                              width="24"
                              height="24"
                              style={{ display: 'block', borderRadius: '50%' }}
                            />
                          </a>
                        </td>
                        <td align="center" style={{ padding: '0 8px' }}>
                          <a 
                            href="https://twitter.com/matchbookrent"
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              width: '40px',
                              height: '40px',
                              backgroundColor: '#0B6E6E',
                              borderRadius: '50%',
                              boxSizing: 'border-box'
                            }}
                          >
                            <img 
                              src="https://img.icons8.com/?size=100&id=YfCbGWCWcuar&format=png&color=FFFFFF"
                              alt="X (Twitter)"
                              width="24"
                              height="24"
                              style={{ display: 'block', borderRadius: '50%' }}
                            />
                          </a>
                        </td>
                        <td align="center" style={{ padding: '0 8px' }}>
                          <a 
                            href="https://www.tiktok.com/@matchbookrentals"
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              width: '40px',
                              height: '40px',
                              backgroundColor: '#0B6E6E',
                              borderRadius: '50%',
                              boxSizing: 'border-box'
                            }}
                          >
                            <img 
                              src="https://matchbook-web-frontend.vercel.app/svg/tiktok-brands-solid-full.svg"
                              alt="TikTok"
                              width="24"
                              height="24"
                              style={{ display: 'block' }}
                            />
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td align="center" style={{ fontSize: '14px', color: '#1c1c1c', paddingTop: '10px', lineHeight: 1.6 }}>
                    <strong>{companyName}</strong><br />
                    {companyAddress}<br />
                    {companyCity}<br />
                    <a href={`https://${companyWebsite}`} className="footer-link" style={{ color: '#1c1c1c', textDecoration: 'none' }}>
                      {companyWebsite}
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  );
};

export default NotificationEmailTemplate;
