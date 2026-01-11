import { clerkSetup } from '@clerk/testing/playwright'
import { test as setup } from '@playwright/test'

// Run setup serially to ensure Clerk token is obtained before tests
setup.describe.configure({ mode: 'serial' })

setup('global setup', async ({}) => {
  await clerkSetup()
})
