import {
  Before,
  After,
  setWorldConstructor,
  World,
  setDefaultTimeout,
  Status
} from '@cucumber/cucumber';

import { Browser, BrowserContext, Page, chromium } from 'playwright';
import { config } from '../config/env';

setDefaultTimeout(120000);

export class CustomWorld extends World {
  browser!: Browser;
  context!: BrowserContext;
  page!: Page;

  async init() {
    this.browser = await chromium.launch({
      headless: config.headless
    });

    this.context = await this.browser.newContext({
      baseURL: config.baseUrl
    });

    this.page = await this.context.newPage();
  }

  async close() {
    await this.context?.close();
    await this.browser?.close();
  }
}

setWorldConstructor(CustomWorld);

Before(async function (this: CustomWorld) {
  await this.init();
});

After(async function (this: CustomWorld, scenario) {
  if (scenario.result?.status === Status.FAILED) {
    const screenshot = await this.page.screenshot();
    await this.attach(screenshot, 'image/png');
  }

  await this.close();
});