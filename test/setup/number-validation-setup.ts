import { vi, beforeAll, afterAll } from 'vitest';

// Mock setup specifically for number validation tests

// Mock Clerk auth - this will be overridden in individual tests
export const mockAuth = vi.fn(() => ({ userId: 'test-user-123' }));

vi.mock('@clerk/nextjs/server', () => ({
  auth: mockAuth,
}));

// Mock Prisma for unit tests (integration tests use real Prisma)
export const mockPrisma = {
  listing: {
    findUnique: vi.fn(),
    update: vi.fn(),
    create: vi.fn(),
    deleteMany: vi.fn(),
  },
  listingInCreation: {
    findFirst: vi.fn(),
    update: vi.fn(),
    create: vi.fn(),
    deleteMany: vi.fn(),
  },
  listingMonthlyPricing: {
    deleteMany: vi.fn(),
    create: vi.fn(),
    createMany: vi.fn(),
    findUnique: vi.fn(),
    findMany: vi.fn(),
  },
  listingImage: {
    createMany: vi.fn(),
    deleteMany: vi.fn(),
  },
  $transaction: vi.fn(),
  $connect: vi.fn(),
  $disconnect: vi.fn(),
};

// Only mock Prisma for unit tests, not integration tests
if (process.env.NODE_ENV === 'test' && !process.env.INTEGRATION_TEST) {
  vi.mock('@/lib/prismadb', () => ({
    default: mockPrisma,
  }));
}

// Test data helpers
export const createMockListing = (overrides = {}) => ({
  id: 'test-listing-123',
  userId: 'test-user-123',
  title: 'Test Listing',
  description: 'Test description',
  status: 'available',
  approvalStatus: 'approved',
  roomCount: 2,
  bathroomCount: 1,
  guestCount: 2,
  latitude: 40.7128,
  longitude: -74.0060,
  squareFootage: 1000,
  depositSize: 2000,
  petDeposit: 0,
  petRent: 0,
  rentDueAtBooking: 1000,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

export const createMockDraft = (overrides = {}) => ({
  id: 'test-draft-123',
  userId: 'test-user-123',
  title: 'Test Draft',
  description: 'Test description',
  squareFootage: 1200,
  depositSize: 2500,
  petDeposit: 500,
  petRent: 100,
  rentDueAtBooking: 1200,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

export const createMockPricing = (overrides = {}) => ({
  months: 6,
  price: 2000,
  utilitiesIncluded: false,
  ...overrides,
});

// Test utilities
export const expectNumberToBeCapped = (value: number | null, max: number = 10000000) => {
  if (value === null) return;
  expect(value).toBeLessThanOrEqual(max);
  expect(value).toBeGreaterThanOrEqual(0);
};

export const expectPricingToBeCapped = (pricing: Array<{ price: number }>, max: number = 10000000) => {
  pricing.forEach(p => {
    expect(p.price).toBeLessThanOrEqual(max);
    expect(p.price).toBeGreaterThanOrEqual(0);
  });
};

// Reset mocks before each test
beforeAll(() => {
  vi.clearAllMocks();
});

// Cleanup after tests
afterAll(() => {
  vi.restoreAllMocks();
});