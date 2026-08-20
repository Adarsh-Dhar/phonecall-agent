import { PrismaClient } from './lib/db-prisma/generated/index.js';

// Ensure DATABASE_URL is set
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = 'file:./prisma/dev.db';
}

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
});

async function main() {
  console.log('Starting seed...');

  // Create contacts
  const contacts = await Promise.all([
    prisma.contact.create({
      data: {
        name: 'Phone Agent',
        business: 'Your personal assistant',
        initials: 'PA',
        color: '#ff9b83',
        note: 'Ready to help with everyday admin',
        online: true,
      },
    }),
    prisma.contact.create({
      data: {
        name: 'Bright Smile Dental',
        business: 'Dental clinic',
        initials: 'BS',
        color: '#f7ad92',
        note: 'Ask for a late morning slot',
        online: false,
      },
    }),
    prisma.contact.create({
      data: {
        name: 'Luca at Northside',
        business: 'Barber studio',
        initials: 'LN',
        color: '#a4c1dd',
        note: 'Prefer Alex or Mei',
        online: false,
      },
    }),
    prisma.contact.create({
      data: {
        name: 'Mara · Parcel desk',
        business: 'Delivery support',
        initials: 'MP',
        color: '#d4b7e9',
        note: 'Tracking: PLX-48290',
        online: false,
      },
    }),
  ]);

  console.log('Created contacts:', contacts.length);

  // Create a conversation
  const conversation = await prisma.conversation.create({
    data: {
      title: 'Main conversation',
    },
  });

  console.log('Created conversation:', conversation.id);

  // Create seed messages
  const messages = await Promise.all([
    prisma.message.create({
      data: {
        role: 'assistant',
        content: 'Good morning, Alex. Tell me what you want to get off your plate and I\'ll help you work through it.',
        time: '9:41 AM',
        conversationId: conversation.id,
      },
    }),
    prisma.message.create({
      data: {
        role: 'user',
        content: 'Can you help me book a dental cleaning next week?',
        time: '9:42 AM',
        conversationId: conversation.id,
      },
    }),
    prisma.message.create({
      data: {
        role: 'assistant',
        content: 'Absolutely. I can help with that. Do you have a preferred day or time window, or should I look for the first opening?',
        time: '9:42 AM',
        conversationId: conversation.id,
      },
    }),
  ]);

  console.log('Created messages:', messages.length);

  // Create history items
  const history = await Promise.all([
    prisma.history.create({
      data: {
        title: 'Dental cleaning',
        detail: 'Chat · Preferences saved',
        status: 'Completed',
        time: 'Yesterday',
        conversationId: conversation.id,
      },
    }),
    prisma.history.create({
      data: {
        title: 'Reschedule haircut',
        detail: 'Chat · Waiting on a reply',
        status: 'Needs you',
        time: 'Jun 12',
        conversationId: conversation.id,
      },
    }),
    prisma.history.create({
      data: {
        title: 'Package delivery update',
        detail: 'Chat · Summary saved',
        status: 'Completed',
        time: 'Jun 08',
        conversationId: conversation.id,
      },
    }),
  ]);

  console.log('Created history items:', history.length);

  console.log('Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
