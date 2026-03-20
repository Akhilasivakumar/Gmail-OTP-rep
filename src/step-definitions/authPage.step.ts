import { Given, When, Then } from '@cucumber/cucumber';
import { AuthPage } from '../pages/authPage';
import { getOtpWithRetry } from '../support/otpHelper';
import registrationData from '../fixtures/signup.json';

let authPage: AuthPage;

Given("I open NRL login page", async function () {
  authPage = new AuthPage(this.page);
  await authPage.open(process.env.BASE_URL!);
});

When("I signup with email", async function () {
  // Click the "Sign up" link to switch from login to signup
  await authPage.clickSignup();

  // Wait for signup page to load
  await this.page.waitForTimeout(2000);

  // Enter the email address (with a unique +timestamp suffix to avoid "already exists" errors)
  const baseEmail = process.env.USER_EMAIL!;
  const dynamicEmail = baseEmail.replace('@', `+${Date.now()}@`);
  console.log(`[Test] Using dynamic email: ${dynamicEmail}`);
  await authPage.enterEmail(dynamicEmail);

  // Submit the form
  await authPage.clickContinue();

  // Short wait in case of redirect
  await this.page.waitForTimeout(2000);
});

Then("I fetch OTP and complete signup", async function () {
  // Wait 7 seconds for the OTP email to arrive
  console.log('[Test] Waiting 7 seconds for OTP email to arrive...');
  await this.page.waitForTimeout(7000);

  // Fetch the most recent 6-digit OTP from Gmail
  const otp = await getOtpWithRetry();

  // Enter the OTP and submit
  await authPage.enterOtp(otp);
  await authPage.submitOtp();

  // Wait for the next page to load (Registration Details page)
  await this.page.waitForLoadState('networkidle');
  console.log('[Test] OTP submitted. Current URL:', this.page.url());

  // Registration Data in JSON format
  console.log('[Test] Filling registration details with data:', JSON.stringify(registrationData));

  // Fill registration details
  try {
    console.log('[Test] Calling fillRegistrationDetails...');
    await authPage.fillRegistrationDetails(registrationData);
  } catch (err) {
    console.error('[Test] Error while filling registration details:', err);
    throw err;
  }

  // Submit the registration form
  console.log('[Test] Clicking Next to complete registration...');
  await authPage.clickNext();

  // Handle post-registration Skip button
  await authPage.clickSkip();


  await this.page.waitForLoadState('networkidle');
  console.log('[Test] Registration completed. Current URL:', this.page.url());
});