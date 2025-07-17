import { PrismaClient } from '@prisma/client'

declare global {
  var prisma: PrismaClient | undefined
}

// Use test database URL when in test environment
const getDatabaseUrl = () => {
  const url = process.env.NODE_ENV === 'test' && process.env.TEST_DATABASE_URL 
    ? process.env.TEST_DATABASE_URL 
    : process.env.DATABASE_URL;
  
  // Log only non-sensitive info in test environment
  if (process.env.NODE_ENV === 'test') {
    console.log('🔍 [prismadb] NODE_ENV:', process.env.NODE_ENV);
    console.log('🔍 [prismadb] Using TEST_DATABASE_URL:', !!process.env.TEST_DATABASE_URL);
    console.log('🔍 [prismadb] Using DATABASE_URL fallback:', !process.env.TEST_DATABASE_URL);
  }
  
  return url;
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