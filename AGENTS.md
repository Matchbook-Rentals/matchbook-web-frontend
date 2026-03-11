# Agent Development Guide

## Build/Test Commands
- **Build**: ⚠️ **DO NOT RUN** - This breaks dev instances
- **Lint**: `npm run lint` 
- **Tests**: `npm test` (vitest run), `npm run test:watch` (vitest watch)
- **Single test file**: `vitest run path/to/test.spec.ts`
- **Unit tests**: `npm run test:unit`, `npm run test:unit:watch`
- **Integration tests**: `npm run test:integration`, `npm run test:integration:watch`
- **E2E tests**: `npm run test:e2e`, `npm run test:e2e:headed`, `npm run test:e2e:ui`

## Code Style & Conventions
- **TypeScript**: Strict mode enabled, use proper typing
- **Imports**: Use `@/` alias for src imports (e.g., `import { cn } from "@/lib/utils"`)
- **Components**: PascalCase for React components, kebab-case for files
- **Functions**: camelCase for functions and variables
- **Styling**: Tailwind CSS classes, use `cn()` utility for conditional classes
- **Error handling**: Use try-catch blocks with proper error logging
- **Async functions**: Use async/await, handle promises properly
- **Comments**: JSDoc format for functions, minimal inline comments

## Framework & Libraries
- **Next.js 14** with app router, server components
- **Prisma** for database ORM
- **Clerk** for authentication
- **Tailwind CSS** + Radix UI components
- **Vitest** for unit/integration testing, **Playwright** for E2E