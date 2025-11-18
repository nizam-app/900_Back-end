// prisma/seed.js
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Create Admin User
  const adminPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { phone: '1111111111' },
    update: {},
    create: {
      phone: '1111111111',
      name: 'System Admin',
      email: 'admin@fsm.com',
      passwordHash: adminPassword,
      role: 'ADMIN',
    },
  });
  console.log('✅ Created admin user:', admin.phone);

  // Create Dispatcher
  const dispatcherPassword = await bcrypt.hash('dispatcher123', 10);
  const dispatcher = await prisma.user.upsert({
    where: { phone: '2222222222' },
    update: {},
    create: {
      phone: '2222222222',
      name: 'Main Dispatcher',
      email: 'dispatcher@fsm.com',
      passwordHash: dispatcherPassword,
      role: 'DISPATCHER',
    },
  });
  console.log('✅ Created dispatcher user:', dispatcher.phone);

  // Create Call Center Agent
  const callCenterPassword = await bcrypt.hash('callcenter123', 10);
  const callCenter = await prisma.user.upsert({
    where: { phone: '3333333333' },
    update: {},
    create: {
      phone: '3333333333',
      name: 'Call Center Agent',
      email: 'callcenter@fsm.com',
      passwordHash: callCenterPassword,
      role: 'CALL_CENTER',
    },
  });
  console.log('✅ Created call center user:', callCenter.phone);

  // Create Internal Technician
  const techInternalPassword = await bcrypt.hash('tech123', 10);
  const techInternal = await prisma.user.upsert({
    where: { phone: '4444444444' },
    update: {},
    create: {
      phone: '4444444444',
      name: 'John Technician',
      email: 'tech.internal@fsm.com',
      passwordHash: techInternalPassword,
      role: 'TECH_INTERNAL',
    },
  });

  await prisma.technicianProfile.upsert({
    where: { userId: techInternal.id },
    update: {},
    create: {
      userId: techInternal.id,
      type: 'INTERNAL',
      commissionRate: 0.05,
      bonusRate: 0.05,
      status: 'ACTIVE',
    },
  });
  console.log('✅ Created internal technician:', techInternal.phone);

  // Create Freelancer Technician
  const techFreelancerPassword = await bcrypt.hash('freelancer123', 10);
  const techFreelancer = await prisma.user.upsert({
    where: { phone: '5555555555' },
    update: {},
    create: {
      phone: '5555555555',
      name: 'Mike Freelancer',
      email: 'tech.freelancer@fsm.com',
      passwordHash: techFreelancerPassword,
      role: 'TECH_FREELANCER',
    },
  });

  await prisma.technicianProfile.upsert({
    where: { userId: techFreelancer.id },
    update: {},
    create: {
      userId: techFreelancer.id,
      type: 'FREELANCER',
      commissionRate: 0.2,
      bonusRate: 0.05,
      status: 'ACTIVE',
    },
  });

  await prisma.wallet.upsert({
    where: { technicianId: techFreelancer.id },
    update: {},
    create: {
      technicianId: techFreelancer.id,
      balance: 0,
    },
  });
  console.log('✅ Created freelancer technician:', techFreelancer.phone);

  // Create Categories
  const hvac = await prisma.category.upsert({
    where: { id: 1 },
    update: {},
    create: {
      name: 'HVAC Services',
      description: 'Heating, Ventilation, and Air Conditioning',
    },
  });

  const electrical = await prisma.category.upsert({
    where: { id: 2 },
    update: {},
    create: {
      name: 'Electrical Services',
      description: 'All electrical repairs and installations',
    },
  });

  const plumbing = await prisma.category.upsert({
    where: { id: 3 },
    update: {},
    create: {
      name: 'Plumbing Services',
      description: 'Plumbing repairs and installations',
    },
  });

  console.log('✅ Created categories');

  // Create Subservices
  const hvacRepair = await prisma.subservice.upsert({
    where: { id: 1 },
    update: {},
    create: {
      categoryId: hvac.id,
      name: 'AC Repair',
      description: 'Air conditioner repair and maintenance',
    },
  });

  const hvacInstall = await prisma.subservice.upsert({
    where: { id: 2 },
    update: {},
    create: {
      categoryId: hvac.id,
      name: 'AC Installation',
      description: 'New air conditioner installation',
    },
  });

  const electricalRepair = await prisma.subservice.upsert({
    where: { id: 3 },
    update: {},
    create: {
      categoryId: electrical.id,
      name: 'Electrical Repair',
      description: 'General electrical repairs',
    },
  });

  console.log('✅ Created subservices');

  // Create Services
  await prisma.service.upsert({
    where: { id: 1 },
    update: {},
    create: {
      categoryId: hvac.id,
      subserviceId: hvacRepair.id,
      name: 'AC Not Cooling',
      description: 'Fix air conditioner cooling issues',
      baseRate: 500,
    },
  });

  await prisma.service.upsert({
    where: { id: 2 },
    update: {},
    create: {
      categoryId: hvac.id,
      subserviceId: hvacRepair.id,
      name: 'AC Filter Cleaning',
      description: 'Clean and replace AC filters',
      baseRate: 200,
    },
  });

  await prisma.service.upsert({
    where: { id: 3 },
    update: {},
    create: {
      categoryId: hvac.id,
      subserviceId: hvacInstall.id,
      name: 'Split AC Installation',
      description: 'Install new split AC unit',
      baseRate: 2000,
    },
  });

  console.log('✅ Created services');

  // Create sample customer
  const customerPassword = await bcrypt.hash('customer123', 10);
  const customer = await prisma.user.upsert({
    where: { phone: '9999999999' },
    update: {},
    create: {
      phone: '9999999999',
      name: 'Jane Customer',
      email: 'customer@example.com',
      passwordHash: customerPassword,
      role: 'CUSTOMER',
    },
  });
  console.log('✅ Created sample customer:', customer.phone);

  // Create sample notification
  await prisma.notification.create({
    data: {
      userId: techInternal.id,
      type: 'WO_ASSIGNED',
      title: 'New Work Order Assigned',
      message: 'You have been assigned work order WO-2025001',
      dataJson: JSON.stringify({ woId: 1, woNumber: 'WO-2025001' }),
      isRead: false,
    },
  });
  console.log('✅ Created sample notification');

  console.log('\n🎉 Seeding completed successfully!');
  console.log('\n📝 Test Credentials:');
  console.log('Admin: 1111111111 / admin123');
  console.log('Dispatcher: 2222222222 / dispatcher123');
  console.log('Call Center: 3333333333 / callcenter123');
  console.log('Internal Tech: 4444444444 / tech123');
  console.log('Freelancer: 5555555555 / freelancer123');
  console.log('Customer: 9999999999 / customer123');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
