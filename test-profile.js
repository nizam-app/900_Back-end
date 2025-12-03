import { prisma } from './src/prisma.js';

async function main() {
  const user = await prisma.user.findUnique({
    where: { phone: '5555555555' },
    include: { 
      technicianProfile: true 
    }
  });
  
  console.log('User Data:');
  console.log(JSON.stringify(user, null, 2));
  
  await prisma.$disconnect();
}

main().catch(console.error);
