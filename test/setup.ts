import '@testing-library/jest-dom';
import { vi } from 'vitest';

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