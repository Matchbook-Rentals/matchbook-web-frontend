import { test, expect } from '@playwright/test';
import { signInAsAdmin } from '../helpers/auth';

test.describe('Article WYSIWYG Editor', () => {
  const uniqueId = Date.now().toString().slice(-6);

  test.beforeEach(async ({ page }) => {
    await signInAsAdmin(page);
    await page.goto('/manage/articles/new');
    await page.waitForSelector('[contenteditable="true"]', { state: 'visible' });
  });

  test('should apply bold formatting', async ({ page }) => {
    const editor = page.locator('[contenteditable="true"]');

    // Type some text
    await editor.click();
    await editor.type('This is bold text');

    // Select the word "bold"
    await editor.click();
    await page.keyboard.press('Control+a'); // Select all
    await page.keyboard.press('ArrowRight');

    // Triple-click to select line, then use keyboard to select "bold"
    await editor.selectText();

    // Click bold button in command bar
    const boldButton = page.locator('button[title="Bold selected text"]');
    await boldButton.click();

    // Verify bold is applied (check for strong tag in editor)
    await expect(editor.locator('strong')).toBeVisible();
  });

  test('should apply italic formatting', async ({ page }) => {
    const editor = page.locator('[contenteditable="true"]');

    // Type and select text
    await editor.click();
    await editor.type('This is italic text');
    await page.keyboard.press('Control+a');

    // Click italic button
    const italicButton = page.locator('button[title="Italicize selected text"]');
    await italicButton.click();

    // Verify italic is applied
    await expect(editor.locator('em')).toBeVisible();
  });

  test('should apply underline formatting', async ({ page }) => {
    const editor = page.locator('[contenteditable="true"]');

    // Type and select text
    await editor.click();
    await editor.type('This is underlined text');
    await page.keyboard.press('Control+a');

    // Click underline button
    const underlineButton = page.locator('button[title="Underline selected text"]');
    await underlineButton.click();

    // Verify underline is applied
    await expect(editor.locator('u')).toBeVisible();
  });

  test('should insert heading', async ({ page }) => {
    const editor = page.locator('[contenteditable="true"]');

    // Click in editor
    await editor.click();

    // Click H2 button (first heading button)
    const h2Button = page.locator('button[title*="Heading"]').first();
    await h2Button.click();

    // Should insert placeholder heading text
    await expect(editor.locator('h2')).toBeVisible();
  });

  test('should insert unordered list', async ({ page }) => {
    const editor = page.locator('[contenteditable="true"]');

    // Type some text
    await editor.click();
    await editor.type('List item one');
    await page.keyboard.press('Control+a');

    // Click list button
    const listButton = page.locator('button[title="Create bullet list from selected text"]');
    await listButton.click();

    // Verify list is created
    await expect(editor.locator('ul')).toBeVisible();
    await expect(editor.locator('li')).toBeVisible();
  });

  test('should insert ordered list', async ({ page }) => {
    const editor = page.locator('[contenteditable="true"]');

    // Type some text
    await editor.click();
    await editor.type('Numbered item');
    await page.keyboard.press('Control+a');

    // Click ordered list button
    const orderedListButton = page.locator('button[title="Create numbered list from selected text"]');
    await orderedListButton.click();

    // Verify ordered list is created
    await expect(editor.locator('ol')).toBeVisible();
  });

  test('should insert and edit link', async ({ page }) => {
    const editor = page.locator('[contenteditable="true"]');

    // Type text to link
    await editor.click();
    await editor.type('Click here for link');
    await page.keyboard.press('Control+a');

    // Click link button
    const linkButton = page.locator('button[title*="Add link"]');
    await linkButton.click();

    // Wait for link modal
    await expect(page.getByText('Add Link')).toBeVisible();

    // Fill in URL
    await page.getByPlaceholder('https://example.com').fill('https://matchbook.com');

    // Display text should be pre-filled from selection
    await expect(page.getByPlaceholder('Link text')).toHaveValue('Click here for link');

    // Insert the link
    await page.getByRole('button', { name: /insert/i }).click();

    // Verify link is inserted
    const link = editor.locator('a');
    await expect(link).toBeVisible();
    await expect(link).toHaveAttribute('href', 'https://matchbook.com');
  });

  test('should persist bold formatting after save and reload', async ({ page }) => {
    const testSlug = `format-bold-${uniqueId}`;

    // Fill title
    await page.getByPlaceholder('Title').fill(`Bold Format Test ${uniqueId}`);

    // Add bold text
    const editor = page.locator('[contenteditable="true"]');
    await editor.click();
    await editor.type('This has bold text');
    await page.keyboard.press('Control+a');

    // Apply bold
    await page.locator('button[title="Bold selected text"]').click();

    // Save article
    await page.getByRole('button', { name: /continue/i }).click();
    await page.getByPlaceholder('article-url-slug').clear();
    await page.getByPlaceholder('article-url-slug').fill(testSlug);
    await page.getByRole('button', { name: /view article/i }).click();
    await page.waitForURL(`/articles/${testSlug}`, { timeout: 10000 });

    // Go back to edit
    await page.goto(`/manage/articles/${testSlug}/edit`);
    await page.waitForSelector('[contenteditable="true"]', { state: 'visible' });

    // Verify bold is still there
    const editEditor = page.locator('[contenteditable="true"]');
    await expect(editEditor.locator('strong')).toBeVisible();
  });

  test('should persist italic formatting after save and reload', async ({ page }) => {
    const testSlug = `format-italic-${uniqueId}`;

    // Fill title
    await page.getByPlaceholder('Title').fill(`Italic Format Test ${uniqueId}`);

    // Add italic text
    const editor = page.locator('[contenteditable="true"]');
    await editor.click();
    await editor.type('This has italic text');
    await page.keyboard.press('Control+a');

    // Apply italic
    await page.locator('button[title="Italicize selected text"]').click();

    // Save article
    await page.getByRole('button', { name: /continue/i }).click();
    await page.getByPlaceholder('article-url-slug').clear();
    await page.getByPlaceholder('article-url-slug').fill(testSlug);
    await page.getByRole('button', { name: /view article/i }).click();
    await page.waitForURL(`/articles/${testSlug}`, { timeout: 10000 });

    // Go back to edit
    await page.goto(`/manage/articles/${testSlug}/edit`);
    await page.waitForSelector('[contenteditable="true"]', { state: 'visible' });

    // Verify italic is still there
    const editEditor = page.locator('[contenteditable="true"]');
    await expect(editEditor.locator('em')).toBeVisible();
  });

  test('should persist heading after save and reload', async ({ page }) => {
    const testSlug = `format-heading-${uniqueId}`;

    // Fill title
    await page.getByPlaceholder('Title').fill(`Heading Format Test ${uniqueId}`);

    // Add heading
    const editor = page.locator('[contenteditable="true"]');
    await editor.click();
    await page.locator('button[title*="Heading"]').first().click();

    // Replace placeholder text
    await page.keyboard.type('My Custom Heading');

    // Save article
    await page.getByRole('button', { name: /continue/i }).click();
    await page.getByPlaceholder('article-url-slug').clear();
    await page.getByPlaceholder('article-url-slug').fill(testSlug);
    await page.getByRole('button', { name: /view article/i }).click();
    await page.waitForURL(`/articles/${testSlug}`, { timeout: 10000 });

    // Go back to edit
    await page.goto(`/manage/articles/${testSlug}/edit`);
    await page.waitForSelector('[contenteditable="true"]', { state: 'visible' });

    // Verify heading is still there
    const editEditor = page.locator('[contenteditable="true"]');
    await expect(editEditor.locator('h2')).toBeVisible();
  });

  test('should apply combined bold and italic formatting', async ({ page }) => {
    const editor = page.locator('[contenteditable="true"]');

    // Type text
    await editor.click();
    await editor.type('Bold and italic');
    await page.keyboard.press('Control+a');

    // Apply bold
    await page.locator('button[title="Bold selected text"]').click();

    // Apply italic (text should still be selected)
    await page.keyboard.press('Control+a');
    await page.locator('button[title="Italicize selected text"]').click();

    // Verify both are applied (should have nested strong/em or em/strong)
    await expect(editor.locator('strong')).toBeVisible();
    await expect(editor.locator('em')).toBeVisible();
  });
});
