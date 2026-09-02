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

  // 2. Create Default Users (Super Admin, Courier, Receiver)
  const superAdminPassword = await bcrypt.hash('admin123', 10);
  const courierPassword = await bcrypt.hash('courier123', 10);
  const receiverPassword = await bcrypt.hash('receiver123', 10);

  const headOffice = await prisma.location.findUnique({ where: { code: 'OFC' } });
  const plant1 = await prisma.location.findUnique({ where: { code: 'P01' } });

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
        defaultLocationId: headOffice.id,
      },
    });

    await prisma.user.upsert({
      where: { email: 'courier@dagsap.com' },
      update: {},
      create: {
        nik: 'COU-001',
        name: 'Budi (Kurir Operasional)',
        email: 'courier@dagsap.com',
        password: courierPassword,
        role: 'COURIER',
        active: true,
        defaultLocationId: headOffice.id,
      },
    });
  }

  if (plant1) {
    await prisma.user.upsert({
      where: { email: 'receiver@dagsap.com' },
      update: {},
      create: {
        nik: 'REC-001',
        name: 'Siti (Staff Penerima Plant 1)',
        email: 'receiver@dagsap.com',
        password: receiverPassword,
        role: 'RECEIVER',
        active: true,
        defaultLocationId: plant1.id,
      },
    });
  }

  // 3. Document Types
  const docTypes = [
    'Invoice',
    'Faktur Pajak',
    'Purchase Order',
    'Surat Jalan',
    'Finance Document',
    'HR Document',
    'Legal Document',
    'Other',
  ];

  for (const docName of docTypes) {
    await prisma.documentType.upsert({
      where: { name: docName },
      update: {},
      create: {
        name: docName,
        active: true,
      },
    });
  }

  // 4. Sample Documents for Instant Scanning
  const invoiceType = await prisma.documentType.findUnique({ where: { name: 'Invoice' } });
  const suratJalanType = await prisma.documentType.findUnique({ where: { name: 'Surat Jalan' } });

  if (headOffice && plant1 && invoiceType && suratJalanType) {
    await prisma.document.upsert({
      where: { documentNumber: 'DAG-2026-000001' },
      update: {},
      create: {
        documentNumber: 'DAG-2026-000001',
        documentTypeId: invoiceType.id,
        originLocationId: headOffice.id,
        destinationLocationId: plant1.id,
        priority: 'URGENT',
        description: 'Invoice Pengadaan Mesin Pabrik #1042',
        status: 'READY_TO_SEND',
        currentLocationId: headOffice.id,
        currentHolder: 'Head Office Dispatch',
      },
    });

    await prisma.document.upsert({
      where: { documentNumber: 'DAG-2026-000002' },
      update: {},
      create: {
        documentNumber: 'DAG-2026-000002',
        documentTypeId: suratJalanType.id,
        originLocationId: headOffice.id,
        destinationLocationId: plant1.id,
        priority: 'NORMAL',
        description: 'Surat Jalan Logistik Material Batch A-12',
        status: 'IN_TRANSIT',
        currentLocationId: headOffice.id,
        currentHolder: 'Budi (Kurir Operasional)',
      },
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
