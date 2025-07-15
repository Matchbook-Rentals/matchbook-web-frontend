import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Customer Support pseudo user data
const customerSupportUser = {
  id: "support-user-001",
  email: "support@matchbook.com", 
  firstName: "Customer",
  lastName: "Support",
  fullName: "Customer Support",
  imageUrl: "https://placehold.co/600x400/0B6E6E/FFF?text=CS",
  role: "admin",
  emailVerified: new Date(),
  createdAt: new Date(),
  updatedAt: new Date()
};

async function main() {
  console.log('Starting to seed Customer Support user...');

  try {
    // Check if Customer Support user already exists
    const existingUser = await prisma.user.findUnique({
      where: { id: customerSupportUser.id }
    });

    if (existingUser) {
      console.log('Customer Support user already exists. Updating...');
      await prisma.user.update({
        where: { id: customerSupportUser.id },
        data: {
          email: customerSupportUser.email,
          firstName: customerSupportUser.firstName,
          lastName: customerSupportUser.lastName,
          fullName: customerSupportUser.fullName,
          imageUrl: customerSupportUser.imageUrl,
          role: customerSupportUser.role,
          emailVerified: customerSupportUser.emailVerified,
          updatedAt: new Date()
        }
      });
    } else {
      console.log('Creating new Customer Support user...');
      await prisma.user.create({
        data: customerSupportUser
      });
    }

    console.log('Successfully seeded Customer Support user!');
    console.log('User ID:', customerSupportUser.id);
    console.log('Email:', customerSupportUser.email);
    console.log('Role:', customerSupportUser.role);

  } catch (error) {
    console.error('Error seeding Customer Support user:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });