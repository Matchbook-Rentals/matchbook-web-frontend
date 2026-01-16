# End-to-End Tests

This directory contains end-to-end tests for the Matchbook application using Playwright.

## Prerequisites

Before running the tests, you need to install Playwright's system dependencies:

```bash
sudo npx playwright install-deps
```

**Note**: If you see errors about missing dependencies (especially for WebKit/Safari), this command will install them. Chrome and Firefox may work without these dependencies, but for full browser coverage, run this command.

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Install Playwright browsers:
   ```bash
   npx playwright install
   ```

3. Set up environment variables:

   The tests require the following environment variables (typically already in your `.env.local`):

   ```bash
   # Required for dynamic test user creation/cleanup
   CLERK_SECRET_KEY=sk_test_...

   # Required for Clerk testing integration
   CLERK_PUBLISHABLE_KEY=pk_test_...
   ```

   **Note**: The tests dynamically create and clean up Clerk users, so `CLERK_SECRET_KEY` is required.

## Running Tests

Make sure your development server is running on port 3000 (or update the `baseURL` in `playwright.config.ts`):

```bash
npm run dev
```

Then run the tests:

```bash
# Run all tests in headless mode
npm run test:e2e

# Run tests in headed mode (see browser)
npm run test:e2e:headed

# Run tests in UI mode (interactive)
npm run test:e2e:ui

# Debug tests
npm run test:e2e:debug

# Run tests with video recording (always records, even for passing tests)
npm run test:e2e:video

# Run tests with video recording in headed mode
npm run test:e2e:video:headed

# Generate tests by recording browser interactions
npm run test:e2e:codegen

# Run specific test file
npx playwright test e2e/auth-flow.spec.ts
```

### Generating Tests from Browser Actions

To generate tests automatically:

1. Start your dev server: `npm run dev`
2. Run: `npm run test:e2e:codegen`
3. A browser window will open where you can interact with your app
4. Playwright will generate test code based on your actions
5. Copy the generated code into a new test file

This is especially useful for complex UI interactions or when dealing with third-party components like Clerk.

### Video Recording and Screenshots

By default, Playwright will:
- Record videos only for failed tests and retries
- Take screenshots only on failure

When you run `npm run test:e2e:video`, it will always record videos for all tests.

Videos and screenshots are saved in:
- Videos: `test-results/[test-name]/video.webm`
- Screenshots: `test-results/[test-name]/screenshot.png`
- Traces: `test-results/[test-name]/trace.zip`

You can also view test results in the HTML report:
```bash
npx playwright show-report
```

## Test Structure

### Test Files
- `auth-flow.spec.ts` - Complete authentication flow tests (sign in, sign out, session persistence)
- `sign-in.spec.ts` - Sign in specific tests (valid/invalid credentials)
- `sign-in-sign-out.spec.ts` - Simple sign in and sign out flow test
- `verification-flow.spec.ts` - Verification flow tests including credit check and payment capture

### Setup Files
- `global.setup.ts` - Creates a fresh test user in Clerk before tests run
- `global.teardown.ts` - Cleans up all test users after tests complete

### Helper Files
- `helpers/auth.ts` - Authentication helpers (sign in, sign out, session management)
- `helpers/test-user.ts` - Dynamic test user creation/cleanup via Clerk API
- `helpers/verification.ts` - Verification flow helpers (form filling, payment, assertions)

## Test User Management

Tests use dynamically created Clerk users instead of hardcoded credentials:

1. **Before tests run** (`global.setup.ts`):
   - Cleans up any stale test users from previous runs (older than 1 hour)
   - Creates a fresh test user with `admin_dev` role
   - Saves credentials to `.e2e-test-users.json` for cross-process sharing

2. **During tests**:
   - Tests read credentials from the shared file
   - User has full access to protected routes like verification

3. **After tests complete** (`global.teardown.ts`):
   - Deletes all test users created during the run
   - Removes the temporary credentials file

This approach ensures:
- No hardcoded test credentials in the codebase
- Clean state for each test run
- No accumulation of stale test users in Clerk

## Writing New Tests

1. Create a new `.spec.ts` file in the `e2e` directory
2. Import the necessary modules:
   ```typescript
   import { test, expect } from '@playwright/test';
   ```
3. Write your tests using Playwright's API
4. Use the helper functions in `helpers/auth.ts` for common authentication tasks
5. Always wait for the page to fully load before interacting with elements
6. Use proper selectors (prefer roles and text over CSS selectors)
7. Add appropriate timeouts for network requests
8. Test both happy paths and error scenarios

## Notes

- The tests use real credentials, so make sure to handle them securely
- The tests are configured to run against `http://localhost:3000`
- Tests will automatically start the dev server if it's not already running