# NRL Email OTP Automation

A Playwright + Cucumber BDD automation project designed to test the NRL Signup flow with automated Gmail OTP verification using the Google Gmail API (OAuth2).

## � Key Features

- **Cucumber BDD**: Scenarios written in human-readable Gherkin syntax.
- **Playwright**: Fast and reliable browser automation.
- **Gmail API Integration**: Securely fetches 6-digit verification codes using OAuth2 (no IMAP required).
- **Self-Healing Locators**: Robust multi-selector strategy to handle UI changes.
- **CI/CD Ready**: Powered by GitHub Actions with **Playwright Browser Caching**, **Concurrency Control**, and **Manual Triggers**.
- **Automated Reporting**: Generates HTML and JSON reports on every test run.

## 📁 Project Structure

```
├── .github/workflows/   # CI/CD configuration (ci.yml)
├── src/
│   ├── features/       # BDD scenarios (.feature)
│   ├── pages/          # Page Object Model (POM)
│   ├── step-definitions/ # Step implementation code
│   ├── support/        # Gmail API helper, Hooks, World setup
│   └── config/         # Environment configuration
├── .env                # Private credentials (NOT tracked by git)
├── cucumber.js         # Cucumber configuration
└── tsconfig.json       # TypeScript configuration
```

## 🛠️ Setup Instructions

### 1. Prerequisites
- **Node.js**: v18 or newer.
- **Google Cloud Project**: With the **Gmail API** enabled and OAuth2 credentials configured.

### 2. Local Environment Setup
Create a `.env` file in the root directory:

```env
BASE_URL=http://d3nxpusm55ya6n.cloudfront.net
USER_EMAIL=your-email@gmail.com
BROWSER=chromium
HEADLESS=false
TIMEOUT=120000

# Gmail OAuth2 Credentials
GMAIL_CLIENT_ID=your-client-id
GMAIL_CLIENT_SECRET=your-client-secret
GMAIL_REFRESH_TOKEN=your-refresh-token
```

### 3. Install and Initialize
```bash
# Install NPM packages
npm install

# Install Playwright browsers and system dependencies
npx playwright install --with-deps
```

## 🧪 Running Tests

### Local Execution
```bash
# Run all tests
npm test

# Open the HTML report after tests
npm run report
```

Reports are saved to `test-output/reports/`.

## ⚙️ CI/CD (GitHub Actions)

The project is fully configured for continuous integration. The workflow is located in `.github/workflows/ci.yml`.

### Features:
- **Playwright Caching**: Speeds up runs by ~2-3 minutes by caching browser binaries.
- **Concurrency**: Cancels outdated runs on the same branch to save resources.
- **Manual Trigger**: Go to **Actions > NRL Email OTP Automation > Run workflow** to trigger tests manually.

### Setup GitHub Secrets:
To enable CI, add the following as **GitHub Secrets** (`Settings > Secrets > Actions`):
- `BASE_URL`
- `USER_EMAIL`
- `GMAIL_CLIENT_ID`
- `GMAIL_CLIENT_SECRET`
- `GMAIL_REFRESH_TOKEN`
- `BROWSER` (optional, defaults to chromium)
- `TIMEOUT` (optional, defaults to 60000)
