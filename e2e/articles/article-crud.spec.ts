import { test, expect } from '@playwright/test';
import { signInAsAdmin } from '../helpers/auth';

test.describe('Article CRUD Operations', () => {
  // Generate unique title for each test run to avoid conflicts
  const uniqueId = Date.now().toString().slice(-6);
  const testArticleTitle = `Test Article ${uniqueId}`;
  const testArticleSlug = `test-article-${uniqueId}`;

  test.beforeEach(async ({ page }) => {
    await signInAsAdmin(page);
  });

  test('should navigate to article manager', async ({ page }) => {
    await page.goto('/manage/articles');
    await expect(page).toHaveURL('/manage/articles');
    await expect(page.getByRole('heading', { name: 'Articles' })).toBeVisible();
  });

  test('should create a new article', async ({ page }) => {
    // Navigate directly to new article page
    await page.goto('/manage/articles/new');
    await expect(page).toHaveURL('/manage/articles/new');

    // Fill in article details
    await page.getByPlaceholder('Title').fill(testArticleTitle);

    // Wait for and fill the editor
    const editor = page.locator('[contenteditable="true"]');
    await editor.waitFor({ state: 'visible' });
    await editor.click();
    await editor.fill('This is test content for the article.');

    // Fill author info
    await page.getByPlaceholder('Daniel Resner').fill('Test Author');
    await page.getByPlaceholder('CEO').fill('Test Title');

    // Click continue to open SEO modal
    await page.getByRole('button', { name: /continue/i }).click();

    // Wait for SEO modal
    await expect(page.getByText('Add SEO')).toBeVisible();

    // Fill SEO fields - the slug input is already visible with auto-generated value
    // Find and fill the Article ID input
    const articleIdInput = page.locator('input').first();
    await articleIdInput.clear();
    await articleIdInput.fill(testArticleSlug);

    // Blur to trigger validation, then wait
    await articleIdInput.blur();
    await page.waitForTimeout(2000);

    // Make sure "Checking availability" is gone
    await expect(page.getByText('Checking availability')).not.toBeVisible({ timeout: 5000 });

    // Check there's no slug error
    const hasError = await page.locator('text=already taken').isVisible();
    if (hasError) {
      throw new Error('Slug already exists - test data conflict');
    }

    // Click submit button - should be enabled now
    const submitButton = page.getByRole('button', { name: /view article/i });
    await expect(submitButton).toBeEnabled({ timeout: 5000 });
    await submitButton.click();

    // Wait for navigation to the article page
    await page.waitForURL(new RegExp(`/articles/${testArticleSlug}`), { timeout: 30000 });

    // Verify we're on the article page - use heading selector to be specific
    await expect(page.getByRole('heading', { name: testArticleTitle })).toBeVisible({ timeout: 10000 });
  });

  test('should list articles in manager', async ({ page }) => {
    await page.goto('/manage/articles');

    // Should see article cards (at least one from previous test or existing articles)
    const articleGrid = page.locator('.grid');
    await expect(articleGrid).toBeVisible();
  });

  test('should edit an existing article', async ({ page }) => {
    // First create an article to edit
    await page.goto('/manage/articles/new');

    const editTitle = `Edit Test ${uniqueId}`;
    const editSlug = `edit-test-${uniqueId}`;

    // Create the article
    await page.getByPlaceholder('Title').fill(editTitle);
    const editor = page.locator('[contenteditable="true"]');
    await editor.click();
    await page.keyboard.type('Original content.');
    await page.getByRole('button', { name: /continue/i }).click();

    // Wait for SEO modal and fill slug
    await expect(page.getByText('Add SEO')).toBeVisible();
    await page.locator('label:has-text("Article ID") + input, label:has-text("Article ID") ~ input').first().clear();
    await page.locator('label:has-text("Article ID") + input, label:has-text("Article ID") ~ input').first().fill(editSlug);
    await page.waitForTimeout(1000);

    // Submit and wait for navigation
    const submitBtn1 = page.getByRole('button', { name: /view article/i });
    await expect(submitBtn1).toBeEnabled();
    await submitBtn1.click();
    await page.waitForURL(`**/articles/**`, { timeout: 20000 });

    // Navigate to edit page
    await page.goto(`/manage/articles/${editSlug}/edit`);
    await page.waitForSelector('[contenteditable="true"]', { state: 'visible' });

    // Modify the title
    const titleInput = page.locator('textarea, input[placeholder="Title"]').first();
    await titleInput.clear();
    await titleInput.fill(`${editTitle} - Updated`);

    // Save changes
    await page.getByRole('button', { name: /save changes/i }).click();
    await expect(page.getByText('Add SEO')).toBeVisible();
    await page.waitForTimeout(1000);

    const submitBtn2 = page.getByRole('button', { name: /view article/i });
    await expect(submitBtn2).toBeEnabled();
    await submitBtn2.click();
    await page.waitForURL(`**/articles/**`, { timeout: 20000 });

    // Verify changes
    await expect(page.getByRole('heading', { name: `${editTitle} - Updated` })).toBeVisible({ timeout: 10000 });
  });

  test('should delete an article', async ({ page }) => {
    // First create an article to delete
    await page.goto('/manage/articles/new');

    const deleteTitle = `Delete Test ${uniqueId}`;
    const deleteSlug = `delete-test-${uniqueId}`;

    // Create the article
    await page.getByPlaceholder('Title').fill(deleteTitle);
    const editor = page.locator('[contenteditable="true"]');
    await editor.click();
    await page.keyboard.type('Content to delete.');
    await page.getByRole('button', { name: /continue/i }).click();

    // Wait for SEO modal and fill slug
    await expect(page.getByText('Add SEO')).toBeVisible();
    await page.locator('label:has-text("Article ID") + input, label:has-text("Article ID") ~ input').first().clear();
    await page.locator('label:has-text("Article ID") + input, label:has-text("Article ID") ~ input').first().fill(deleteSlug);
    await page.waitForTimeout(1000);

    // Submit and wait for navigation
    const submitBtn = page.getByRole('button', { name: /view article/i });
    await expect(submitBtn).toBeEnabled();
    await submitBtn.click();
    await page.waitForURL(`**/articles/**`, { timeout: 20000 });

    // Go to article manager
    await page.goto('/manage/articles');
    await page.waitForSelector('.grid', { state: 'visible' });

    // Handle the confirm dialog before clicking delete
    page.on('dialog', dialog => dialog.accept());

    // Find the article and open its menu using the three-dot button
    const articleCard = page.locator(`text=${deleteTitle}`).locator('xpath=ancestor::div[contains(@class, "relative")]').first();
    const menuButton = articleCard.locator('button').first();
    await menuButton.click();

    // Click delete in the dropdown
    await page.getByRole('menuitem', { name: /delete/i }).click();

    // Verify article is removed (toast should appear)
    await expect(page.getByText(/deleted/i)).toBeVisible({ timeout: 5000 });
  });
});
