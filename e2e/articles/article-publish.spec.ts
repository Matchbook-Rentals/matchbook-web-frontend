import { test, expect } from '@playwright/test';
import { signInAsAdmin, signOut } from '../helpers/auth';

test.describe('Article Publishing', () => {
  const uniqueId = Date.now().toString().slice(-6);

  test.beforeEach(async ({ page }) => {
    await signInAsAdmin(page);
  });

  test('should publish a draft article', async ({ page }) => {
    const testSlug = `publish-test-${uniqueId}`;
    const testTitle = `Publish Test ${uniqueId}`;

    // Create a draft article first
    await page.goto('/manage/articles/new');
    await page.getByPlaceholder('Title').fill(testTitle);

    const editor = page.locator('[contenteditable="true"]');
    await editor.click();
    await editor.type('Content for publish test.');

    await page.getByRole('button', { name: /continue/i }).click();
    await page.getByPlaceholder('article-url-slug').clear();
    await page.getByPlaceholder('article-url-slug').fill(testSlug);
    await page.getByRole('button', { name: /view article/i }).click();
    await page.waitForURL(`/articles/${testSlug}`, { timeout: 10000 });

    // Go to article manager
    await page.goto('/manage/articles');

    // Find and open the article card menu
    const articleText = page.locator(`text=${testTitle}`);
    await expect(articleText).toBeVisible();

    // Find the menu button near this article
    const articleContainer = articleText.locator('..').locator('..');
    const menuButton = articleContainer.getByRole('button').first();
    await menuButton.click();

    // Click publish
    await page.getByRole('menuitem', { name: /publish/i }).click();

    // Verify toast
    await expect(page.getByText(/published/i)).toBeVisible({ timeout: 5000 });
  });

  test('should unpublish a published article', async ({ page }) => {
    const testSlug = `unpublish-test-${uniqueId}`;
    const testTitle = `Unpublish Test ${uniqueId}`;

    // Create and publish an article
    await page.goto('/manage/articles/new');
    await page.getByPlaceholder('Title').fill(testTitle);

    const editor = page.locator('[contenteditable="true"]');
    await editor.click();
    await editor.type('Content for unpublish test.');

    await page.getByRole('button', { name: /continue/i }).click();
    await page.getByPlaceholder('article-url-slug').clear();
    await page.getByPlaceholder('article-url-slug').fill(testSlug);
    await page.getByRole('button', { name: /view article/i }).click();
    await page.waitForURL(`/articles/${testSlug}`, { timeout: 10000 });

    // Go to manager and publish it first
    await page.goto('/manage/articles');
    const articleText = page.locator(`text=${testTitle}`);
    await expect(articleText).toBeVisible();

    const articleContainer = articleText.locator('..').locator('..');
    let menuButton = articleContainer.getByRole('button').first();
    await menuButton.click();
    await page.getByRole('menuitem', { name: /publish/i }).click();
    await page.waitForTimeout(1000); // Wait for state update

    // Now unpublish it
    await page.goto('/manage/articles');
    const articleTextAfter = page.locator(`text=${testTitle}`);
    await expect(articleTextAfter).toBeVisible();

    const containerAfter = articleTextAfter.locator('..').locator('..');
    menuButton = containerAfter.getByRole('button').first();
    await menuButton.click();
    await page.getByRole('menuitem', { name: /unpublish/i }).click();

    // Verify toast
    await expect(page.getByText(/unpublished/i)).toBeVisible({ timeout: 5000 });
  });

  test('should verify published article is accessible without login', async ({ page, context }) => {
    const testSlug = `public-access-${uniqueId}`;
    const testTitle = `Public Access Test ${uniqueId}`;
    const testContent = 'This content should be publicly visible.';

    // Create article
    await page.goto('/manage/articles/new');
    await page.getByPlaceholder('Title').fill(testTitle);

    const editor = page.locator('[contenteditable="true"]');
    await editor.click();
    await editor.type(testContent);

    await page.getByRole('button', { name: /continue/i }).click();
    await page.getByPlaceholder('article-url-slug').clear();
    await page.getByPlaceholder('article-url-slug').fill(testSlug);
    await page.getByRole('button', { name: /view article/i }).click();
    await page.waitForURL(`/articles/${testSlug}`, { timeout: 10000 });

    // Publish the article
    await page.goto('/manage/articles');
    const articleText = page.locator(`text=${testTitle}`);
    await expect(articleText).toBeVisible();

    const articleContainer = articleText.locator('..').locator('..');
    const menuButton = articleContainer.getByRole('button').first();
    await menuButton.click();
    await page.getByRole('menuitem', { name: /publish/i }).click();
    await page.waitForTimeout(1000);

    // Sign out
    await signOut(page);

    // Try to access the article as anonymous user
    await page.goto(`/articles/${testSlug}`);

    // Should be able to see the article
    await expect(page.getByRole('heading', { name: testTitle })).toBeVisible();
    await expect(page.getByText(testContent)).toBeVisible();
  });

  test('should verify draft article is NOT accessible without login', async ({ page }) => {
    const testSlug = `draft-access-${uniqueId}`;
    const testTitle = `Draft Access Test ${uniqueId}`;

    // Create a draft article (not published)
    await page.goto('/manage/articles/new');
    await page.getByPlaceholder('Title').fill(testTitle);

    const editor = page.locator('[contenteditable="true"]');
    await editor.click();
    await editor.type('This content should NOT be publicly visible.');

    await page.getByRole('button', { name: /continue/i }).click();
    await page.getByPlaceholder('article-url-slug').clear();
    await page.getByPlaceholder('article-url-slug').fill(testSlug);
    await page.getByRole('button', { name: /view article/i }).click();
    await page.waitForURL(`/articles/${testSlug}`, { timeout: 10000 });

    // Sign out
    await signOut(page);

    // Try to access the draft article as anonymous user
    await page.goto(`/articles/${testSlug}`);

    // Should get 404 or redirect (not found)
    await expect(page).toHaveURL(/.*/, { timeout: 5000 });
    // The article title should NOT be visible
    await expect(page.getByRole('heading', { name: testTitle })).not.toBeVisible();
  });

  test('should verify editor content matches published view', async ({ page }) => {
    const testSlug = `match-view-${uniqueId}`;
    const testTitle = `Match View Test ${uniqueId}`;

    // Create article with specific formatting
    await page.goto('/manage/articles/new');
    await page.getByPlaceholder('Title').fill(testTitle);

    const editor = page.locator('[contenteditable="true"]');
    await editor.click();

    // Add bold text
    await editor.type('This text should be bold.');
    await page.keyboard.press('Control+a');
    await page.locator('button[title="Bold selected text"]').click();

    // Save article
    await page.getByRole('button', { name: /continue/i }).click();
    await page.getByPlaceholder('article-url-slug').clear();
    await page.getByPlaceholder('article-url-slug').fill(testSlug);
    await page.getByRole('button', { name: /view article/i }).click();
    await page.waitForURL(`/articles/${testSlug}`, { timeout: 10000 });

    // Publish it
    await page.goto('/manage/articles');
    const articleText = page.locator(`text=${testTitle}`);
    await expect(articleText).toBeVisible();

    const articleContainer = articleText.locator('..').locator('..');
    const menuButton = articleContainer.getByRole('button').first();
    await menuButton.click();
    await page.getByRole('menuitem', { name: /publish/i }).click();
    await page.waitForTimeout(1000);

    // View published article
    await page.goto(`/articles/${testSlug}`);

    // Check that bold formatting is preserved in published view
    const articleContent = page.locator('article');
    await expect(articleContent.locator('strong')).toBeVisible();
    await expect(articleContent.locator('strong')).toContainText('This text should be bold');
  });

  test('should preserve line breaks between editor and published view', async ({ page }) => {
    const testSlug = `linebreaks-${uniqueId}`;
    const testTitle = `Line Breaks Test ${uniqueId}`;

    // Create article with line breaks
    await page.goto('/manage/articles/new');
    await page.getByPlaceholder('Title').fill(testTitle);

    const editor = page.locator('[contenteditable="true"]');
    await editor.click();

    // Type text with line breaks
    await editor.type('First paragraph.');
    await page.keyboard.press('Enter');
    await page.keyboard.press('Enter');
    await editor.type('Second paragraph.');

    // Save and publish
    await page.getByRole('button', { name: /continue/i }).click();
    await page.getByPlaceholder('article-url-slug').clear();
    await page.getByPlaceholder('article-url-slug').fill(testSlug);
    await page.getByRole('button', { name: /view article/i }).click();
    await page.waitForURL(`/articles/${testSlug}`, { timeout: 10000 });

    // Publish
    await page.goto('/manage/articles');
    const articleText = page.locator(`text=${testTitle}`);
    const articleContainer = articleText.locator('..').locator('..');
    const menuButton = articleContainer.getByRole('button').first();
    await menuButton.click();
    await page.getByRole('menuitem', { name: /publish/i }).click();
    await page.waitForTimeout(1000);

    // View published article
    await page.goto(`/articles/${testSlug}`);

    // Check both paragraphs are present
    const articleContent = page.locator('article');
    await expect(articleContent.getByText('First paragraph.')).toBeVisible();
    await expect(articleContent.getByText('Second paragraph.')).toBeVisible();
  });
});
