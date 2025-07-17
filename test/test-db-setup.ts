// Helper function to clean up test data
export async function cleanupTestData(userId: string) {
  try {
    // Import prisma dynamically to avoid import issues
    const { default: prisma } = await import('@/lib/prismadb');
    
    // Clean up in reverse order of foreign key dependencies
    await prisma.listingMonthlyPricing.deleteMany({
      where: {
        listing: {
          userId: userId
        }
      }
    });
    
    await prisma.listingImage.deleteMany({
      where: {
        listing: {
          userId: userId
        }
      }
    });
    
    await prisma.listing.deleteMany({
      where: {
        userId: userId
      }
    });
    
    // Clean up draft images (they use the same ListingImage table)
    await prisma.listingImage.deleteMany({
      where: {
        listingInCreation: {
          userId: userId
        }
      }
    });
    
    await prisma.listingInCreation.deleteMany({
      where: {
        userId: userId
      }
    });
    
    console.log(`✅ Test data cleaned up for user: ${userId}`);
  } catch (error) {
    console.error('❌ Test data cleanup failed:', error);
    // Don't throw error for cleanup failures in tests
  }
}

// Helper function to create a test user ID
export function createTestUserId(): string {
  return `test-user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}