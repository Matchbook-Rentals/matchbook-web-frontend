import { test, expect } from '@playwright/test';
import { signIn } from './helpers/auth';

test.describe('Add Property Flow', () => {
  test('should open add property modal and navigate to blank listing', async ({ page }) => {
    // Sign in first
    await signIn(page);
    
    // Navigate to host dashboard listings page
    await page.goto('/app/host/dashboard/listings');
    
    // Look for the Add Property button (it may be either the modal trigger or a direct link)
    // First, let's check if the modal trigger exists
    const addPropertyTrigger = page.getByTestId('add-property-trigger');
    const addPropertyLink = page.getByRole('link', { name: 'Add Property' });
    
    // Check if modal trigger exists (when there's a listing in creation)
    if (await addPropertyTrigger.isVisible()) {
      // Click the Add Property modal trigger
      await addPropertyTrigger.click();
      
      // Wait for modal to open and verify it's visible
      await expect(page.getByText('How would you like to start?')).toBeVisible();
      
      // Click "Start with a blank listing"
      await page.getByTestId('start-blank-button').click();
      
      // Should navigate to the add property page with new=true
      await expect(page).toHaveURL(/.*\/app\/host\/add-property\?new=true.*/);
      
    } else if (await addPropertyLink.isVisible()) {
      // If no modal, click the direct link
      await addPropertyLink.click();
      
      // Should navigate to the add property page with new=true
      await expect(page).toHaveURL(/.*\/app\/host\/add-property\?new=true.*/);
      
    } else {
      throw new Error('Add Property button not found - neither modal trigger nor direct link is visible');
    }
    
    // Now we should be on the add property page - verify the Next button is present
    await expect(page.getByTestId('next-button')).toBeVisible();
    
    // Fill out the highlights form - select apartment, unfurnished, and no pets
    await page.getByTestId('card-apartment').click();
    await page.getByTestId('card-unfurnished').click();
    await page.getByTestId('card-no-pets').click();
    
    // Click the Next button to advance to the next step
    await page.getByTestId('next-button').click();
    
    // Verify we moved to the location step
    await expect(page.getByText('Where is your place located?')).toBeVisible();
    
    // Verify we're still on the add property page but moved to the next step
    await expect(page).toHaveURL(/.*\/app\/host\/add-property.*/);
    
    // The Next button should still be visible for the next step
    await expect(page.getByTestId('next-button')).toBeVisible();
  });
  
  test('should open add property modal and pick up where left off', async ({ page }) => {
    // Sign in first
    await signIn(page);
    
    // Navigate to host dashboard listings page
    await page.goto('/app/host/dashboard/listings');
    
    // Look for the Add Property modal trigger (only test this if modal exists)
    const addPropertyTrigger = page.getByTestId('add-property-trigger');
    
    // Skip this test if modal doesn't exist (no listing in creation)
    if (await addPropertyTrigger.isVisible()) {
      // Click the Add Property modal trigger
      await addPropertyTrigger.click();
      
      // Wait for modal to open and verify it's visible
      await expect(page.getByText('How would you like to start?')).toBeVisible();
      
      // Click "Pick up where you left off"
      await page.getByTestId('pick-up-where-left-off-button').click();
      
      // Should navigate to the add property page (with or without draftId)
      await expect(page).toHaveURL(/.*\/app\/host\/add-property.*/);
      
    } else {
      // Skip this test if modal trigger is not visible
      test.skip();
    }
  });
});