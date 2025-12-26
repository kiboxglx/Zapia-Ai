import { test, expect } from '@playwright/test';

test.describe('Authentication & Dashboard Access', () => {

    test('should redirect unauthenticated user to Clerk login', async ({ page }) => {
        await page.goto('/dashboard');
        // Expect to be redirected to a Clerk URL or login page
        await expect(page).toHaveURL(/.*clerk.*/);
    });

    // NOTE: To test authenticated state, you need to set up `global-setup.ts` to save signed-in state.
    // For now, we simulate what happens if we could bypass or if we use a mock.

    /*
    test('should load dashboard for authenticated user', async ({ page }) => {
        // Mocking auth cookie or using saved storage state
        // await page.context().addCookies([...]);
        
        await page.goto('/dashboard');
        await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
        await expect(page.getByText('Total Leads')).toBeVisible();
    });
    */
});
