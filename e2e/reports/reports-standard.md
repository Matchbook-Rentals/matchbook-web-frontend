# Report Generation Standard

Visual QA reports combine Playwright screenshots with markdown documentation
to produce dark-mode PDFs. This is the standard for creating them.

## Directory Structure

```
e2e/
├── screenshots/           # Playwright-captured PNGs (gitignored)
├── reports/               # Generated PDFs (gitignored)
│   ├── reports-standard.md  # This file
│   └── generate-report.sh  # PDF generation script
├── <report-name>.md       # Source markdown (committed)
└── <report-name>-screenshots.spec.ts  # Screenshot capture spec (committed)
```

## 1. Write the Markdown Report

Place it at `e2e/<report-name>.md`. Follow this structure:

```markdown
# Title

**Bug report / Feature:** One-line summary.

**Fix / Implementation:** What was done.

---

## Flow

A text diagram of the user flow.

---

## Desktop Flow

### Step N: Description

Explanation of what's happening.

![Alt text](screenshots/desktop-NN-slug.png)

---

## Mobile Flow

### Step N: Description

Explanation of what's happening.

![Alt text](screenshots/mobile-NN-slug.png)

---

## Additional Viewports

Tablet and laptop screenshots for visual QA. Layout and interactions
are the same as desktop — these capture presentation differences only.

### Laptop (1024×768)

![Step 1 — laptop](screenshots/laptop-01-slug.png)
![Step 2 — laptop](screenshots/laptop-02-slug.png)

### Tablet (768×1024)

![Step 1 — tablet](screenshots/tablet-01-slug.png)
![Step 2 — tablet](screenshots/tablet-02-slug.png)

---

## Test Coverage

| Test | File | Description |
|------|------|-------------|
| ... | `spec-file.ts` | ... |

## Files Changed

- `path/to/file.tsx` — what changed
```

### Naming conventions

- Screenshots: `{desktop|tablet|laptop|mobile}-NN-short-slug.png`
- Markdown: descriptive kebab-case, e.g. `edge-case-auth-redirect.md`
- PDF output: same name as markdown, `.pdf`

## 2. Write the Screenshot Spec

Place it at `e2e/<report-name>-screenshots.spec.ts`.

Key patterns:
- Use a shared `captureFlow(page, prefix)` function reused across all viewports
- Desktop test uses default viewport; mobile uses `{ width: 390, height: 844 }`
- Use `button:visible:has-text("...")` selectors to avoid matching hidden responsive elements
- Screenshots go to `e2e/screenshots/`
- Set `test.setTimeout(120_000)` for flows that involve auth

### Viewport sizes

| Name | Width x Height | Purpose |
|------|---------------|---------|
| `desktop-` | Default (1280×720) | Full desktop layout, primary test target |
| `laptop-` | 1024×768 | Catches cramped desktop layouts |
| `tablet-` | 768×1024 | iPad portrait, common breakpoint |
| `mobile-` | 390×844 | iPhone 14, primary mobile test target |

**Desktop and mobile get full test flows** (interactions, assertions, etc.).
**Tablet and laptop are screenshot-only** — they reuse the same `captureFlow` function
but don't need their own dedicated tests since buttons and layout don't change at
these sizes, only presentation. Include them at the end of the report under an
"Additional Viewports" section.

```typescript
import { test, expect } from '@playwright/test';

const SCREENSHOT_DIR = 'e2e/screenshots';

async function captureFlow(page, prefix: string) {
  // Navigate, interact, screenshot at each step:
  // await page.screenshot({ path: `${SCREENSHOT_DIR}/${prefix}01-step-slug.png`, fullPage: false });
}

test.describe('Report: <title>', () => {
  test('desktop flow', async ({ page, context }) => {
    test.setTimeout(120_000);
    await captureFlow(page, 'desktop-');
  });

  test('mobile flow', async ({ browser }) => {
    test.setTimeout(120_000);
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
    });
    const page = await context.newPage();
    await captureFlow(page, 'mobile-');
    await context.close();
  });

  // Screenshot-only viewports (no additional assertions needed)
  test('laptop screenshots', async ({ browser }) => {
    test.setTimeout(120_000);
    const context = await browser.newContext({
      viewport: { width: 1024, height: 768 },
    });
    const page = await context.newPage();
    await captureFlow(page, 'laptop-');
    await context.close();
  });

  test('tablet screenshots', async ({ browser }) => {
    test.setTimeout(120_000);
    const context = await browser.newContext({
      viewport: { width: 768, height: 1024 },
    });
    const page = await context.newPage();
    await captureFlow(page, 'tablet-');
    await context.close();
  });
});
```

## 3. Generate the PDF

```bash
# Capture screenshots (requires dev server running)
npx playwright test e2e/<report-name>-screenshots.spec.ts

# Generate PDF
./e2e/reports/generate-report.sh e2e/<report-name>.md
```

The script converts markdown to a dark-mode PDF with embedded images.

## Style Notes

- PDFs use dark background (#1a1a2e) with light text (#e0e0e0)
- Images are base64-embedded so the PDF is fully self-contained
- Code blocks use a slightly lighter background (#252545)
- Brand teal (#3c8787) for links and headings
- Tables have subtle borders matching the dark theme
