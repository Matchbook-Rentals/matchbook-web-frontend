interface EmailTemplateData {
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

export function generateEmailTemplateHtml(data: EmailTemplateData): string {
  const {
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
  } = data;

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Notification Email</title>
  <style>
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
    .container {
      max-width: 500px;
      width: 100%;
      padding: 40px 20px;
    }
    .header {
      font-size: 20px;
      letter-spacing: 1px;
      padding-bottom: 30px;
      text-align: center;
    }
    .title {
      font-size: 30px;
      line-height: 1.6;
      padding-bottom: 40px;
      font-weight: normal;
      text-align: center;
    }
    .message-wrapper {
      background-color: rgba(11, 110, 110, 0.2);
      background-color: #e0f2f2; /* Gmail fallback - converts rgba to solid color */
      border-radius: 20px;
      padding: 20px;
    }
    .tag-link {
      color: #000000;
      font-size: 16px;
      font-weight: 500;
      text-decoration: none;
      padding: 0px 10px 10px 10px;
      text-align: left;
      display: block;
    }
    .content-title {
      font-weight: bold;
      padding-bottom: 15px;
      font-size: 16px;
      text-align: center;
    }
    .inner-box {
      background-color: #ffffff;
      border-radius: 20px;
      padding: 20px;
      font-size: 16px;
      line-height: 1.6;
    }
    .sender-line {
      margin: 0 0 10px 0;
      font-weight: bold;
    }
    .content-paragraph {
      margin: 0 0 10px 0;
    }
    .content-paragraph.first {
      margin: 0 0 15px 0;
    }
    .footer-text {
      margin: 15px 0 0 0;
      font-style: italic;
      color: #666;
    }
    .button-container {
      text-align: center;
      padding-top: 20px;
    }
    .button {
      font-size: 16px;
      font-weight: bold;
      color: #ffffff;
      text-decoration: none;
      display: inline-block;
      background-color: #0B6E6E;
      border-radius: 30px;
      padding: 14px 36px;
      max-width: 80%;
      text-align: center;
    }
    .secondary-button {
      background-color: #6c757d;
    }
    .secondary-button-container {
      text-align: center;
      padding-top: 15px;
    }
    .social-container {
      text-align: center;
      padding: 40px 0 10px 0;
    }
    .social-icon {
      display: inline-block;
      width: 40px;
      height: 40px;
      background-color: #0B6E6E;
      border-radius: 50%;
      box-sizing: border-box;
      padding: 8px;
      margin: 0 8px;
    }
    .social-icon img {
      display: block;
      margin: 0 auto;
      filter: none !important;
      mix-blend-mode: normal !important;
    }
    .footer {
      font-size: 14px;
      color: #1c1c1c;
      padding-top: 10px;
      line-height: 1.6;
      text-align: center;
    }
    .footer-link {
      color: #1c1c1c;
      text-decoration: none;
    }

    @media (prefers-color-scheme: dark) {
      body,
      table {
        background-color: #000000 !important;
        color: #ffffff !important;
      }
      .message-wrapper {
        background-color: #000000 !important;
      }
      .inner-box {
        background-color: #2a2a2a !important;
      }
      .button {
        background-color: #ffffff !important;
        color: #000000 !important;
      }
      .tag-link {
        color: #ffffff !important;
      }
      .footer-link {
        color: #ffffff !important;
      }
      .footer {
        color: #ffffff !important;
      }
      /* Gmail-specific dark mode text fixes */
      .header, .header span {
        color: #ffffff !important;
      }
      .title, .title span {
        color: #ffffff !important;
      }
      .content-title, .content-title span {
        color: #ffffff !important;
      }
      .sender-line, .sender-line span {
        color: #ffffff !important;
      }
      .content-paragraph, .content-paragraph span {
        color: #ffffff !important;
      }
    }

    /* Gmail-specific targeting - only affects Gmail */
    u + .body .gmail-text {
      color: #000000 !important;
    }

    /* Gmail footer text - needs different handling */
    u + .body .gmail-footer-text {
      color: #1c1c1c !important;
    }

    /* Gmail dark mode: force text to be white in Gmail's dark mode */
    @media (prefers-color-scheme: dark) {
      u + .body .gmail-text {
        color: #ffffff !important;
      }
      u + .body .gmail-footer-text {
        color: #ffffff !important;
      }
      /* Gmail dark mode backgrounds */
      u + .body .message-wrapper[bgcolor] {
        background-color: #1a1a1a !important;
      }
      u + .body .inner-box[bgcolor] {
        background-color: #2a2a2a !important;
      }
    }

    /* Gmail-specific image protection */
    [data-ogsc] img {
      filter: none !important;
    }
  </style>
</head>
<body class="body">
  <!-- Gmail detection hack -->
  <div style="display: none; max-height: 0; overflow: hidden;">
    <u></u>
  </div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" align="center">
    <tr>
      <td align="center">
        <table role="presentation" class="container" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td class="header">
              <span class="gmail-text" style="color: #000000;">${companyName}</span>
            </td>
          </tr>
          <tr>
            <td class="title">
              <span class="gmail-text" style="color: #000000;">${headerText}</span>
            </td>
          </tr>
          <tr>
            <td class="message-wrapper" bgcolor="#e0f2f2">
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                ${tagLink ? `
                <tr>
                  <td>
                    <a href="${tagLink.url}" class="tag-link">
                      ${tagLink.text}
                    </a>
                  </td>
                </tr>
                ` : ''}
                ${contentTitle ? `
                <tr>
                  <td class="content-title">
                    <span class="gmail-text" style="color: #000000;">${contentTitle}</span>
                  </td>
                </tr>
                ` : ''}
                <tr>
                  <td class="inner-box" bgcolor="#ffffff">
                    ${senderLine ? `
                    <p class="sender-line">
                      <span class="gmail-text" style="color: #000000;">${senderLine}</span>
                    </p>
                    ` : ''}
                    ${contentText.split('\n\n').map((paragraph, index) =>
                      `<p class="content-paragraph ${index === 0 ? 'first' : ''}"><span class="gmail-text" style="color: #000000;">${paragraph}</span></p>`
                    ).join('')}
                    ${footerText ? `
                    <p class="footer-text">
                      ${footerText}
                    </p>
                    ` : ''}
                  </td>
                </tr>
                <tr>
                  <td class="button-container">
                    <a href="${buttonUrl}" class="button">
                      ${buttonText}
                    </a>
                  </td>
                </tr>
                ${secondaryButtonText && secondaryButtonUrl ? `
                <tr>
                  <td class="secondary-button-container">
                    <a href="${secondaryButtonUrl}" class="button secondary-button">
                      ${secondaryButtonText}
                    </a>
                  </td>
                </tr>
                ` : ''}
              </table>
            </td>
          </tr>
          <tr>
            <td class="social-container">
              <a href="https://www.facebook.com/matchbookrentals" class="social-icon">
                <img
                  src="https://img.icons8.com/?size=100&id=98972&format=png&color=FFFFFF"
                  alt="Facebook"
                  width="24"
                  height="24"
                  style="filter: none !important; mix-blend-mode: normal !important; color-scheme: light !important;"
                />
              </a>
              <a href="https://www.instagram.com/matchbookrentals" class="social-icon">
                <img
                  src="https://img.icons8.com/?size=100&id=32292&format=png&color=FFFFFF"
                  alt="Instagram"
                  width="24"
                  height="24"
                  style="filter: none !important; mix-blend-mode: normal !important; color-scheme: light !important;"
                />
              </a>
              <a href="https://twitter.com/matchbookrent" class="social-icon">
                <img
                  src="https://img.icons8.com/?size=100&id=YfCbGWCWcuar&format=png&color=FFFFFF"
                  alt="X (Twitter)"
                  width="24"
                  height="24"
                  style="filter: none !important; mix-blend-mode: normal !important; color-scheme: light !important;"
                />
              </a>
              <a href="https://www.tiktok.com/@matchbookrentals" class="social-icon">
                <img
                  src="https://matchbookrentals.com/social-icons/tiktok-32.png"
                  alt="TikTok"
                  width="24"
                  height="24"
                  style="filter: none !important; mix-blend-mode: normal !important; color-scheme: light !important;"
                />
              </a>
            </td>
          </tr>
          <tr>
            <td class="footer">
              <strong><span class="gmail-footer-text">${companyName}</span></strong><br />
              <span class="gmail-footer-text">${companyAddress}</span><br />
              <span class="gmail-footer-text">${companyCity}</span><br />
              <a href="https://${companyWebsite}" class="footer-link">
                ${companyWebsite}
              </a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
