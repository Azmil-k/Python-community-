const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

prisma.$connect()
  .then(() => {
    console.log('Prisma connected');
    return prisma.$disconnect();
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
