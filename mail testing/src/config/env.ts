import dotenv from 'dotenv';


dotenv.config();

export const config = {
  baseUrl: process.env.BASE_URL || '',
  headless: process.env.HEADLESS === 'true',
  browser: process.env.BROWSER || 'chromium',
  timeout: Number(process.env.TIMEOUT) || 60000
};
