import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Set up test environment variables
process.env.NODE_ENV = 'test';
process.env.TEST_DATABASE_URL = process.env.TEST_DATABASE_URL || 'mysql://g7olyl869vsgp0xva5ak:pscale_pw_L3Y4YI9LvbMNYnQ3rwS30a7Kt70Kg7EbXNrtdssGKrq@aws.connect.psdb.cloud/matchbook-rentals-db?sslaccept=strict';

// Mock environment variables
vi.mock('next/config', () => () => ({
  publicRuntimeConfig: {
    NEXT_PUBLIC_GO_SERVER_URL: 'http://localhost:8080',
  },
}));

// Mock useRouter
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}));

// Mock for components used in tests
vi.mock('@/app/actions/conversations', () => ({
  getAllConversations: vi.fn(),
  createConversation: vi.fn(),
  deleteConversation: vi.fn(),
  createMessage: vi.fn(),
}));

vi.mock('@/app/actions/messages', () => ({
  markMessagesAsReadByTimestamp: vi.fn(),
}));