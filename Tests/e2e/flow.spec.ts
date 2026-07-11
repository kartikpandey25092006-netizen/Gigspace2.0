import { test, expect } from '@playwright/test';

test.describe('Campus Gigs & Rentals - End-to-End User Flow', () => {
  const timestamp = Date.now();
  const student1 = {
    name: 'E2E Alice',
    email: `alice_${timestamp}@college.edu`,
    password: 'password123',
    college: 'E2E State University'
  };

  const student2 = {
    name: 'E2E Bob',
    email: `bob_${timestamp}@college.edu`,
    password: 'password123',
    college: 'E2E State University'
  };

  test('should complete the entire cycle from Signup to Transaction Completion and Rating', async ({ page }) => {
    // 1. Signup Alice (Student 1)
    await page.goto('/login');
    await page.click('text=Don\'t have an account? Sign up');
    await page.fill('#name-input', student1.name);
    await page.fill('#college-input', student1.college);
    await page.fill('#email-input', student1.email);
    await page.fill('#password-input', student1.password);
    await page.click('button[type="submit"]');

    // Confirm navigation to home feed
    await expect(page).toHaveURL('/');
    await expect(page.locator('h1')).toContainText('Campus Marketplace');

    // 2. Alice posts a Gig
    await page.click('text=Post a Gig');
    await page.fill('#modal-title', 'E2E Chemistry Tutoring');
    await page.fill('#modal-desc', 'Tutoring for organic chemistry exam prep. 2 hours.');
    await page.fill('#modal-price', '40');
    await page.selectOption('#modal-cat', 'Tutoring');
    await page.click('button[type="submit"]');

    // Verify gig card displays
    await page.waitForTimeout(1000);
    await expect(page.locator('text=E2E Chemistry Tutoring')).toBeVisible();

    // Logout Alice
    await page.click('button[title="Log out"]');
    await expect(page).toHaveURL('/login');

    // 3. Signup Bob (Student 2)
    await page.click('text=Don\'t have an account? Sign up');
    await page.fill('#name-input', student2.name);
    await page.fill('#college-input', student2.college);
    await page.fill('#email-input', student2.email);
    await page.fill('#password-input', student2.password);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/');

    // 4. Bob accepts Alice's Gig
    await page.click('text=E2E Chemistry Tutoring');
    await expect(page.locator('h1')).toContainText('E2E Chemistry Tutoring');
    
    // Accept Gig
    page.once('dialog', dialog => dialog.accept());
    await page.click('text=Accept Gig Task');

    // Verify gig gets accepted
    await expect(page.locator('text=Working in Escrow')).toBeVisible();

    // 5. Bob sends Alice a message in chat
    await page.click('text=Chat');
    await page.click(`text=${student1.name}`);
    await page.fill('input[placeholder*="Write message"]', 'Hi Alice, ready for the chemistry tutor session!');
    await page.click('button[type="submit"]');

    // Logout Bob
    await page.click('button[title="Log out"]');

    // 6. Login Alice to complete and rate transaction
    await page.fill('#email-input', student1.email);
    await page.fill('#password-input', student1.password);
    await page.click('button[type="submit"]');

    // Go to chat to check message
    await page.click('text=Chat');
    await expect(page.locator('text=Hi Alice, ready for the chemistry tutor session!')).toBeVisible();

    // Browse to details page to complete
    await page.click('text=Browse');
    await page.click('text=E2E Chemistry Tutoring');

    // Confirm Completion
    page.once('dialog', dialog => dialog.accept());
    await page.click('text=Approve Task Completed');

    // Rating dialogue modal should open
    await expect(page.locator('text=Rate the Transaction')).toBeVisible();
    await page.selectOption('#rating-stars', '5');
    await page.fill('#rating-comment', 'Awesome help, prompt and knowledgeable!');
    await page.click('text=Submit Review');

    // Confirm completion and logout
    await page.click('button[title="Log out"]');
    await expect(page).toHaveURL('/login');
  });
});
