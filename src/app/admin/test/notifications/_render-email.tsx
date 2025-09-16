import React from 'react'
import NotificationEmailTemplate from '@/components/email-templates/notification-email'
import { NotificationEmailData } from '@/types'

export function renderEmailToHtml(emailData: NotificationEmailData): string {
  // Create a simple HTML string from the component props
  // This is a workaround since we can't use renderToStaticMarkup in server actions
  
  const html = `
<!DOCTYPE html>
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
    .button {
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
    .message-wrapper {
      background-color: #e7ebe2;
      border-radius: 20px;
      padding: 20px;
    }
    .inner-box {
      background-color: #ffffff;
      border-radius: 20px;
      padding: 20px;
      font-size: 16px;
      line-height: 1.6;
    }
    @media (prefers-color-scheme: dark) {
      body, table {
        background-color: #000000 !important;
        color: #ffffff !important;
      }
      .message-wrapper {
        background-color: #1a1a1a !important;
      }
      .inner-box {
        background-color: #2a2a2a !important;
      }
      .button {
        background-color: #ffffff !important;
        color: #000000 !important;
      }
    }
  </style>
</head>
<body>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" align="center">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width: 500px; width: 100%; padding: 40px 20px;">
          <tr>
            <td align="center" style="font-size: 20px; letter-spacing: 1px; padding-bottom: 30px;">
              ${emailData.companyName}
            </td>
          </tr>
          <tr>
            <td align="center" style="font-size: 30px; line-height: 1.6; padding-bottom: 40px; font-weight: normal;">
              ${emailData.headerText}
            </td>
          </tr>
          <tr>
            <td class="message-wrapper">
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                ${emailData.tagLink ? `
                <tr>
                  <td style="padding: 10px 20px 7px 20px; text-align: left;">
                    <a href="${emailData.tagLink.url}" style="color: #666; font-size: 16px; text-decoration: none;">
                      ${emailData.tagLink.text}
                    </a>
                  </td>
                </tr>
                ` : ''}
                ${emailData.contentTitle ? `
                <tr>
                  <td style="font-weight: bold; padding-bottom: 15px; font-size: 16px; text-align: center;">
                    ${emailData.contentTitle}
                  </td>
                </tr>
                ` : ''}
                <tr>
                  <td class="inner-box">
                    ${emailData.senderLine ? `
                    <p style="margin: 0 0 10px 0; font-weight: bold;">
                      ${emailData.senderLine}
                    </p>
                    ` : ''}
                    ${emailData.contentText.split('\n\n').map((paragraph, index) => 
                      `<p style="margin: ${index === 0 ? '0 0 15px 0' : '0 0 10px 0'};">${paragraph}</p>`
                    ).join('')}
                    ${emailData.footerText ? `
                    <p style="margin: 15px 0 0 0; font-style: italic; color: #666;">
                      ${emailData.footerText}
                    </p>
                    ` : ''}
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding-top: 20px;">
                    <a href="${emailData.buttonUrl}" class="button">
                      ${emailData.buttonText}
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding: 40px 0 10px 0;">
              <table cellpadding="0" cellspacing="0" border="0" align="center">
                <tr>
                  <td align="center" style="padding: 0 8px;">
                    <a href="https://www.facebook.com/matchbookrentals" style="display: flex; align-items: center; justify-content: center; width: 40px; height: 40px; background-color: #0B6E6E; border-radius: 50%; box-sizing: border-box;">
                      <img src="https://img.icons8.com/?size=100&id=98972&format=png&color=FFFFFF" alt="Facebook" width="24" height="24" style="display: block; border-radius: 50%;" />
                    </a>
                  </td>
                  <td align="center" style="padding: 0 8px;">
                    <a href="https://www.instagram.com/matchbookrentals" style="display: flex; align-items: center; justify-content: center; width: 40px; height: 40px; background-color: #0B6E6E; border-radius: 50%; box-sizing: border-box;">
                      <img src="https://img.icons8.com/?size=100&id=32292&format=png&color=FFFFFF" alt="Instagram" width="24" height="24" style="display: block; border-radius: 50%;" />
                    </a>
                  </td>
                  <td align="center" style="padding: 0 8px;">
                    <a href="https://twitter.com/matchbookrent" style="display: flex; align-items: center; justify-content: center; width: 40px; height: 40px; background-color: #0B6E6E; border-radius: 50%; box-sizing: border-box;">
                      <img src="https://img.icons8.com/?size=100&id=YfCbGWCWcuar&format=png&color=FFFFFF" alt="X (Twitter)" width="24" height="24" style="display: block; border-radius: 50%;" />
                    </a>
                  </td>
                  <td align="center" style="padding: 0 8px;">
                    <a href="https://www.tiktok.com/@matchbookrentals" style="display: flex; align-items: center; justify-content: center; width: 40px; height: 40px; background-color: #0B6E6E; border-radius: 50%; box-sizing: border-box;">
                      <img src="https://matchbook-web-frontend.vercel.app/svg/tiktok-brands-solid-full.svg" alt="TikTok" width="24" height="24" style="display: block;" />
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td align="center" style="font-size: 14px; color: #1c1c1c; padding-top: 10px; line-height: 1.6;">
              <strong>${emailData.companyName}</strong><br />
              ${emailData.companyAddress}<br />
              ${emailData.companyCity}<br />
              <a href="https://${emailData.companyWebsite}" style="color: #1c1c1c; text-decoration: none;">
                ${emailData.companyWebsite}
              </a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim()
  
  return html
}