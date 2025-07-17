import { PrismaClient } from '@prisma/client'

declare global {
  var prisma: PrismaClient | undefined
}

// Use test database URL when in test environment
const getDatabaseUrl = () => {
  if (process.env.NODE_ENV === 'test' && process.env.TEST_DATABASE_URL) {
    return process.env.TEST_DATABASE_URL;
  }
  return process.env.DATABASE_URL;
};

const client = globalThis.prisma || new PrismaClient({
  datasources: {
    db: {
      url: getDatabaseUrl(),
    },
  },
})

if (process.env.NODE_ENV !== 'production') globalThis.prisma = client

export default client;