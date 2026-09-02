import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding initial data...');

  // 1. Create Default Locations
  const locations = [
    { code: 'OFC', name: 'Head Office', type: 'OFFICE' },
    { code: 'P01', name: 'Plant 1', type: 'PLANT' },
    { code: 'P02', name: 'Plant 2', type: 'PLANT' },
    { code: 'P03', name: 'Plant 3', type: 'PLANT' },
  ];

  for (const loc of locations) {
    await prisma.location.upsert({
      where: { code: loc.code },
      update: {},
      create: {
        code: loc.code,
        name: loc.name,
        // @ts-ignore
        type: loc.type,
        active: true
      }
    });
  }

  // 2. Create Super Admin User
  const superAdminPassword = await bcrypt.hash('admin123', 10);
  const headOffice = await prisma.location.findUnique({ where: { code: 'OFC' } });

  if (headOffice) {
    await prisma.user.upsert({
      where: { email: 'admin@dagsap.com' },
      update: {},
      create: {
        nik: 'ADMIN-001',
        name: 'Super Admin',
        email: 'admin@dagsap.com',
        password: superAdminPassword,
        role: 'SUPER_ADMIN',
        active: true,
        defaultLocationId: headOffice.id
      }
    });
  }

  // 3. Document Types
  const docTypes = [
    'Invoice', 'Faktur Pajak', 'Purchase Order', 'Surat Jalan', 'Finance Document', 'HR Document', 'Legal Document', 'Other'
  ];

  for (const docName of docTypes) {
    await prisma.documentType.upsert({
      where: { name: docName },
      update: {},
      create: {
        name: docName,
        active: true
      }
    });
  }

  console.log('Seeding complete.');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
