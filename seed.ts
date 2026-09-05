// @ts-check
import 'dotenv/config';
import { PrismaClient } from './lib/db-prisma/generated/client';

const prisma = new PrismaClient();

const CONTACT_PHONE = process.env.TEST_PHONE_NUMBER ?? '+918926130730';

// ---------------------------------------------------------------------------
// 8 essential contacts seeded for every user
// ---------------------------------------------------------------------------
const CONTACTS = [
  {
    name: 'Bright Smile Dental',
    business: 'Dentist / dental clinic',
    category: 'Healthcare & Medical',
    initials: 'BS',
    color: '#f7ad92',
    note: 'Ask for a late morning slot',
  },
  {
    name: 'Dr. Patel — Family Practice',
    business: 'Doctor / GP',
    category: 'Healthcare & Medical',
    initials: 'DP',
    color: '#8fc9b0',
    note: 'Annual physical is due',
  },
  {
    name: 'Riverside Auto Service',
    business: 'Car service / mechanic',
    category: 'Home, Auto & Local Services',
    initials: 'RA',
    color: '#e0b568',
    note: 'Due for an oil change + brake check',
  },
  {
    name: 'Horizon Insurance',
    business: 'Insurance company',
    category: 'Financial, Insurance & Bills',
    initials: 'HI',
    color: '#c9a4dd',
    note: 'Policy renewal question',
  },
  {
    name: 'Meridian Bank',
    business: 'Bank / credit card company',
    category: 'Financial, Insurance & Bills',
    initials: 'MB',
    color: '#7fa8dd',
    note: 'Dispute a charge',
  },
  {
    name: 'Metro DMV',
    business: 'DMV / motor vehicle dept',
    category: 'Government & Bureaucracy',
    initials: 'MD',
    color: '#7fb3d5',
    note: 'License renewal — appointment needed',
  },
  {
    name: 'ConnectMobile',
    business: 'Telecom / mobile provider',
    category: 'Customer Service & Retail',
    initials: 'CM',
    color: '#a8c9a8',
    note: 'Question about the new plan',
  },
  {
    name: 'Phone Agent',
    business: 'Your personal assistant',
    category: 'Assistant',
    initials: 'PA',
    color: '#ff9b83',
    note: 'Ready to help with everyday admin',
    online: true,
  },
] as const;

async function seedContactsForUser(userId: string) {
  for (const c of CONTACTS) {
    const contact = await prisma.contact.create({
      data: {
        userId,
        name:     c.name,
        business: c.business,
        category: c.category,
        phone:    CONTACT_PHONE,
        initials: c.initials,
        color:    c.color,
        note:     c.note,
        online:   'online' in c ? Boolean(c.online) : false,
      },
    });

    await prisma.conversation.create({
      data: {
        title:     `Chat with ${c.name}`,
        contactId: contact.id,
      },
    });
  }
}

async function main() {
  console.log('Starting seed...');

  // Remove stale seed-placeholder users (no real Google ID)
  const deleted = await prisma.user.deleteMany({
    where: { googleId: { startsWith: 'seed-' } },
  });
  if (deleted.count > 0) {
    console.log(`Removed ${deleted.count} placeholder seed user(s).`);
  }

  // Seed contacts for every real user that currently has none
  const users = await prisma.user.findMany({
    select: { id: true, email: true, _count: { select: { contacts: true } } },
  });

  const needsSeeding = users.filter((u) => u._count.contacts === 0);

  if (needsSeeding.length === 0) {
    console.log('All users already have contacts — nothing to seed.');
    return;
  }

  console.log(`Seeding ${CONTACTS.length} contacts for ${needsSeeding.length} user(s)...`);

  for (const user of needsSeeding) {
    await seedContactsForUser(user.id);
    console.log(`  ✓ ${user.email} — ${CONTACTS.length} contacts added`);
  }

  console.log('\nSeed complete.');
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
