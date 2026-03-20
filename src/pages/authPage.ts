import { Page } from 'playwright';
import { expect } from '@playwright/test';

import registrationSelectors from './registrationSelectors.json';


export interface RegistrationData {
  password?: string;
  firstName?: string;
  lastName?: string;
  birthday?: {
    day: string;
    month: string;
    year: string;
  };
  mobile?: {
    countryCode?: string;
    number: string;
  };
  subscribe?: boolean;
}


export class AuthPage {
  constructor(private page: Page) { }

  async open(url: string) {
    await this.page.goto(url);
    await this.page.waitForLoadState('networkidle');
  }

  /** Click the Sign Up link on the landing/login page */
  async clickSignup() {
    const signupSelectors = [
      'a:has-text("Sign up")',
      'a:has-text("Sign Up")',
      'button:has-text("Sign up")',
      'button:has-text("Sign Up")',
      '[data-testid="signup"]',
    ];
    for (const sel of signupSelectors) {
      const el = this.page.locator(sel).first();
      if (await el.isVisible().catch(() => false)) {
        await el.click();
        return;
      }
    }
    throw new Error('Could not find a Sign Up button/link on the page');
  }

  /** Type the email address into the email input field */
  async enterEmail(email: string) {
    const emailSelectors = [
      'input[type="email"]',
      'input[name="email"]',
      'input[placeholder*="email" i]',
      'input[id*="email" i]',
    ];
    for (const sel of emailSelectors) {
      const el = this.page.locator(sel).first();
      if (await el.isVisible().catch(() => false)) {
        await el.fill(email);
        return;
      }
    }
    throw new Error('Could not find an email input field on the page');
  }

  /** Click the primary Continue / Submit button after entering email.
   *  Excludes hidden form submit buttons (aria-hidden) and uses Enter as fallback. */
  async clickContinue() {
    // Try visible, non-hidden submit buttons first
    const visibleSubmit = this.page.locator('button[type="submit"]:not([aria-hidden="true"]):visible').first();
    if (await visibleSubmit.isVisible().catch(() => false)) {
      await visibleSubmit.click();
      return;
    }

    // Fallback: press Enter on the email input to submit the form
    const emailInput = this.page.locator('input[type="email"], input[name="username"]').first();
    if (await emailInput.isVisible().catch(() => false)) {
      await emailInput.press('Enter');
      return;
    }

    throw new Error('Could not submit the form — no visible submit button or email input found');
  }

  /** Wait for the OTP input to appear and fill it */
  async enterOtp(otp: string) {
    const otpSelectors = [
      'input[inputmode="numeric"]',
      'input[name="code"]',
      'input[name="otp"]',
      'input[placeholder*="code" i]',
      'input[placeholder*="otp" i]',
      'input[type="number"]',
    ];
    for (const sel of otpSelectors) {
      try {
        await this.page.waitForSelector(sel, { timeout: 10000 });
        await this.page.locator(sel).first().fill(otp);
        return;
      } catch {
        // try next selector
      }
    }
    throw new Error('OTP input field did not appear — check that the email was sent');
  }

  /** Click the final Submit / Verify button after entering OTP */
  async submitOtp() {
    const submitSelectors = [
      'button[type="submit"]',
      'button:has-text("Verify")',
      'button:has-text("Confirm")',
      'button:has-text("Continue")',
    ];
    for (const sel of submitSelectors) {
      const el = this.page.locator(sel).first();
      if (await el.isVisible().catch(() => false)) {
        await el.click();
        return;
      }
    }
    throw new Error('Could not find an OTP submit button on the page');
  }

  /** Fill the registration form after OTP submission */
  async fillRegistrationDetails(data: RegistrationData) {
    const s = registrationSelectors;
    console.log('[AuthPage] Starting to fill registration details...');

    // Wait for the password field to be visible to ensure we are on the registration page
    await this.page.waitForSelector(s.password, { state: 'visible', timeout: 15000 });

    // Fill Password
    if (data.password) {
      console.log('[AuthPage] Filling password...');
      const passLoc = this.page.locator(s.password).first();
      await passLoc.scrollIntoViewIfNeeded();
      await passLoc.fill(data.password);
      await this.page.waitForTimeout(500);
    }

    // Fill First Name
    if (data.firstName) {
      console.log(`[AuthPage] Filling first name: ${data.firstName}`);
      const firstNameLoc = this.page.locator(s.firstName).first();
      await firstNameLoc.scrollIntoViewIfNeeded();
      await firstNameLoc.waitFor({ state: 'visible' });
      await firstNameLoc.fill(data.firstName);
      await this.page.waitForTimeout(500);
    }

    // Fill Last Name
    if (data.lastName) {
      console.log(`[AuthPage] Filling last name: ${data.lastName}`);
      const lastNameLoc = this.page.locator(s.lastName).first();
      await lastNameLoc.scrollIntoViewIfNeeded();
      await lastNameLoc.waitFor({ state: 'visible' });
      await lastNameLoc.fill(data.lastName);
      await this.page.waitForTimeout(500);
    }

    // Fill Birthday
    if (data.birthday) {
      console.log(`[AuthPage] Filling birthday: ${data.birthday.day}/${data.birthday.month}/${data.birthday.year}`);

      // Helper to fill or type into the fields
      const fillBirthdayField = async (selector: string, value: string, label: string) => {
        const loc = this.page.locator(selector).first();
        try {
          await loc.waitFor({ state: 'visible', timeout: 5000 });
          await loc.scrollIntoViewIfNeeded();
          await loc.click(); // Ensure focus
          await loc.fill(''); // Clear first
          await loc.fill(value);
          await loc.dispatchEvent('change');
          await loc.dispatchEvent('blur');
          await this.page.keyboard.press('Tab'); // Trigger validation
          // Small delay to ensure events are triggered
          await this.page.waitForTimeout(500);

          // Verify if it's filled as expected (handle auto-formatting like 02 -> 2)
          const actualValue = await loc.inputValue();
          console.log(`[AuthPage] Filled ${label} with ${value}, actual value on page: ${actualValue}`);
          if (actualValue !== value && actualValue !== value.replace(/^0/, '')) {
            console.warn(`[AuthPage] Warning: ${label} value mismatch! Expected ${value}, got ${actualValue}`);
          }
          console.log(`[AuthPage] Filled ${label} with ${value}`);
        } catch (err) {
          console.warn(`[AuthPage] Could not fill ${label} normally, trying to focus and type...`);
          await loc.focus();
          await this.page.keyboard.type(value, { delay: 100 });
          await this.page.keyboard.press('Tab'); // Trigger validation
        }
      };

      await fillBirthdayField(s.birthdayDay, data.birthday.day, 'Day');
      await expect.soft(this.page.locator(s.birthdayDay)).toHaveValue(data.birthday.day);

      await fillBirthdayField(s.birthdayMonth, data.birthday.month, 'Month');
      await expect.soft(this.page.locator(s.birthdayMonth)).toHaveValue(data.birthday.month);

      await fillBirthdayField(s.birthdayYear, data.birthday.year, 'Year');
      await expect.soft(this.page.locator(s.birthdayYear)).toHaveValue(data.birthday.year);


      await this.page.waitForTimeout(500);
    }

    // Fill Mobile Number
    if (data.mobile) {
      console.log(`[AuthPage] Filling mobile: ${data.mobile.number}`);

      // Handle Country Code Selection (e.g., India +91)
      if (data.mobile.countryCode || data.mobile.number.startsWith('7') || data.mobile.number.startsWith('8') || data.mobile.number.startsWith('9')) {
        console.log('[AuthPage] Selecting India (+91) country code...');
        const countryDropdown = this.page.locator(s.countryCodeDropdown).first();
        try {
          await countryDropdown.waitFor({ state: 'visible', timeout: 5000 });


          const tagName = await countryDropdown.evaluate(el => el.tagName.toLowerCase()).catch(() => 'button');
          if (tagName === 'select') {
            console.log('[AuthPage] Using selectOption for country code...');
            await countryDropdown.selectOption({ label: 'IN (+91)' });
            const currentVal = await countryDropdown.evaluate(el => (el as HTMLSelectElement).value);
            if (currentVal !== 'IN') {
              await countryDropdown.selectOption({ value: 'IN' });
            }
          } else {
            console.log('[AuthPage] Falling back to custom dropdown logic...');
            await countryDropdown.click();
            const searchInput = this.page.locator(s.countryCodeSearch).first();
            if (await searchInput.isVisible().catch(() => false)) {
              await searchInput.fill('India');
              await this.page.waitForTimeout(500);
              await this.page.keyboard.press('Enter');
            } else {
              const indiaOption = this.page.locator('text=India, li:has-text("India"), li:has-text("+91")').first();
              await indiaOption.click();
            }
          }
          await this.page.waitForTimeout(1000);

        } catch (err: any) {
          console.warn('[AuthPage] Could not change country code, it might already be correct or the selector failed.', err.message);
        }

      }

      const mobileLoc = this.page.locator(s.mobileNumber).first();
      await mobileLoc.scrollIntoViewIfNeeded();
      await mobileLoc.waitFor({ state: 'visible' });
      await mobileLoc.fill('');
      await mobileLoc.type(data.mobile.number, { delay: 100 });
      await this.page.keyboard.press('Tab');
      await this.page.waitForTimeout(500);
    }

    // Subscribe Checkbox
    if (data.subscribe !== undefined) {
      console.log(`[AuthPage] Setting subscription to: ${data.subscribe}`);
      const checkbox = this.page.locator(s.subscribe).first();
      await checkbox.scrollIntoViewIfNeeded();
      await checkbox.waitFor({ state: 'visible' });
      const isChecked = await checkbox.isChecked();
      if (data.subscribe !== isChecked) {
        await checkbox.click();
      }
    }
    console.log('[AuthPage] Finished filling registration details.');
  }




  /** Click the Next button on the registration page */
  async clickNext() {
    const nextButton = this.page.locator(registrationSelectors.nextButton);
    await nextButton.waitFor({ state: 'visible' });
    await nextButton.click();
  }

  /** Click the Skip button if it appears after registration */
  async clickSkip() {
    const skipButton = this.page.locator(registrationSelectors.skipButton).first();
    try {
      await skipButton.waitFor({ state: 'visible', timeout: 10000 });
      await skipButton.click();
      console.log('[AuthPage] Clicked Skip button.');
    } catch (err) {
      console.log('[AuthPage] Skip button did not appear or was not clickable.');
    }
  }
}



