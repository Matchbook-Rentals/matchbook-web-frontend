#!/usr/bin/env bash
#
# Generate a dark-mode PDF report from a markdown file with embedded screenshots.
#
# Usage: ./e2e/reports/generate-report.sh e2e/edge-case-auth-redirect.md
#
# Requirements: pandoc, node (uses Playwright for PDF rendering)
#
set -euo pipefail

MARKDOWN_FILE="${1:?Usage: $0 <markdown-file>}"
BASENAME="$(basename "$MARKDOWN_FILE" .md)"
MARKDOWN_DIR="$(dirname "$MARKDOWN_FILE")"
OUTPUT_PDF="e2e/reports/${BASENAME}.pdf"
TMP_HTML="/tmp/${BASENAME}-report.html"
TMP_EMBEDDED="/tmp/${BASENAME}-embedded.html"

# --- Step 1: Convert markdown to HTML via pandoc ---
echo "Converting markdown to HTML..."
pandoc "$MARKDOWN_FILE" \
  --standalone \
  --metadata title="" \
  -o "$TMP_HTML"

# --- Step 2: Embed images as base64 data URIs ---
echo "Embedding images as base64..."
node -e "
const fs = require('fs');
const path = require('path');

let html = fs.readFileSync('$TMP_HTML', 'utf-8');
const mdDir = path.resolve('$MARKDOWN_DIR');

html = html.replace(/src=\"([^\"]+\\.png)\"/g, (match, src) => {
  const imgPath = path.resolve(mdDir, src);
  if (fs.existsSync(imgPath)) {
    const b64 = fs.readFileSync(imgPath).toString('base64');
    return 'src=\"data:image/png;base64,' + b64 + '\"';
  }
  console.warn('  Warning: image not found:', imgPath);
  return match;
});

fs.writeFileSync('$TMP_EMBEDDED', html);
"

# --- Step 3: Inject dark-mode CSS and render PDF via Playwright ---
echo "Rendering PDF..."
node -e "
const { chromium } = require('playwright');
const fs = require('fs');

const DARK_CSS = \`
  html, body {
    background: #1a1a2e !important;
    color: #e0e0e0 !important;
  }
  h1, h2, h3, h4, h5, h6 {
    color: #3c8787 !important;
  }
  a { color: #5bb5b5 !important; }
  code {
    background: #252545 !important;
    color: #c8d6e5 !important;
    padding: 2px 6px;
    border-radius: 4px;
  }
  pre {
    background: #252545 !important;
    color: #c8d6e5 !important;
    padding: 12px;
    border-radius: 8px;
    overflow-x: auto;
  }
  pre code { padding: 0; }
  hr { border-color: #3c8787 !important; opacity: 0.3; }
  table { border-collapse: collapse; width: 100%; }
  th, td {
    border: 1px solid #3c8787 !important;
    padding: 8px 12px;
    color: #e0e0e0 !important;
  }
  th { background: #252545 !important; }
  img {
    max-width: 100%;
    border-radius: 8px;
    border: 1px solid #3c8787;
    margin: 12px 0;
  }
  blockquote {
    border-left-color: #3c8787 !important;
    color: #a0a0b8 !important;
  }
  strong { color: #ffffff !important; }
  figcaption { color: #808098 !important; font-style: italic; }
\`;

(async () => {
  const html = fs.readFileSync('$TMP_EMBEDDED', 'utf-8');
  const styled = html.replace('</head>', '<style>' + DARK_CSS + '</style></head>');

  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setContent(styled, { waitUntil: 'networkidle' });
  await page.pdf({
    path: '$OUTPUT_PDF',
    format: 'A4',
    margin: { top: '20mm', bottom: '20mm', left: '15mm', right: '15mm' },
    printBackground: true,
  });
  await browser.close();
  console.log('Done: $OUTPUT_PDF');
})();
"

# Cleanup
rm -f "$TMP_HTML" "$TMP_EMBEDDED"
echo "Report generated: $OUTPUT_PDF"
