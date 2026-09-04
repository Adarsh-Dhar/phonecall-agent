// @ts-check
import 'dotenv/config';
import { PrismaClient } from './lib/db-prisma/generated/client';

const prisma = new PrismaClient();

// Every contact in this seed uses the same TEST_PHONE_NUMBER from .env.
// Set TEST_PHONE_NUMBER in your environment (e.g. in .env) to inject a real
// E.164 number (+14155551234) without editing this file.
// @ts-ignore - process.env is available at runtime via tsx
const CONTACT_PHONE = process.env.TEST_PHONE_NUMBER ?? '+918926130730';

const CATEGORY = {
  ASSISTANT: 'Assistant',
  HEALTHCARE: 'Healthcare & Medical',
  PERSONAL_CARE: 'Personal Care & Lifestyle',
  HOME_AUTO: 'Home, Auto & Local Services',
  FINANCIAL: 'Financial, Insurance & Bills',
  GOVERNMENT: 'Government & Bureaucracy',
  RETAIL: 'Customer Service & Retail',
  OTHER: 'Other',
} as const;

type Status = 'Completed' | 'Needs you' | 'In Progress';

// Mirrors the ContactKnowledge Prisma model's shape (minus id/contactId,
// which are filled in at seed time).
type KnowledgeSeed = {
  category: 'preference' | 'fact' | 'history' | 'constraint' | 'contact_info';
  key: string;
  value: string;
  confidence?: number; // defaults to 1.0 — seed data is treated as ground truth
};

type ContactSeed = {
  name: string;
  business: string;
  category: string;
  initials: string;
  color: string;
  note?: string;
  online?: boolean;
  // Fully custom thread (flagship contacts). If omitted, a template
  // for the category is used instead (see buildTemplateThread).
  custom?: {
    conversationTitle: string;
    messages: { role: 'user' | 'assistant'; content: string; time: string }[];
    history?: { title: string; detail: string; status: Status; time: string };
  };
  // Seed queries that should appear as pending in the Queries panel.
  queries?: { question: string }[];
  // Fully custom knowledge base for this contact (flagship contacts). If
  // omitted, a template for the category is used instead (see
  // buildTemplateKnowledge). Pass an empty array to seed no knowledge at all.
  knowledge?: KnowledgeSeed[];
};

// One reusable conversation "shape" per category: an opening line the
// agent sends after calling on the user's behalf, a short user reply,
// and a matching history entry. {name} is replaced with the contact name.
const CATEGORY_TEMPLATE: Record<string, {
  reasonForContact: string;
  agentOpen: string;
  userReply: string;
  historyStatus: Status;
  historyDetail: string;
}> = {
  [CATEGORY.HEALTHCARE]: {
    reasonForContact: 'Booking an appointment',
    agentOpen: "I called {name} and found a few available slots — want me to lock one in, or should I ask about a different time window?",
    userReply: 'Go ahead and grab the earliest one that works.',
    historyStatus: 'In Progress',
    historyDetail: 'Chat · Awaiting your confirmation',
  },
  [CATEGORY.PERSONAL_CARE]: {
    reasonForContact: 'Booking / rescheduling',
    agentOpen: "I called {name} about your booking. They have an opening this week — should I confirm it?",
    userReply: 'Yes, confirm it please.',
    historyStatus: 'Completed',
    historyDetail: 'Chat · Booking confirmed',
  },
  [CATEGORY.HOME_AUTO]: {
    reasonForContact: 'Service or repair booking',
    agentOpen: "I called {name} to schedule the service. They can fit you in this week — I asked for a quote too and I'm waiting to hear back.",
    userReply: 'Sounds good, let me know the quote when it comes in.',
    historyStatus: 'In Progress',
    historyDetail: 'Chat · Waiting on quote',
  },
  [CATEGORY.FINANCIAL]: {
    reasonForContact: 'Account / billing question',
    agentOpen: "I called {name} about your account. They need to verify a couple of details with you directly before they can proceed.",
    userReply: 'Okay, what do they need from me?',
    historyStatus: 'Needs you',
    historyDetail: 'Chat · Needs your verification',
  },
  [CATEGORY.GOVERNMENT]: {
    reasonForContact: 'Appointment / status check',
    agentOpen: "I called {name}. They don't offer phone scheduling, so I booked things through their online appointment system instead.",
    userReply: 'Perfect, that saves the hassle.',
    historyStatus: 'Completed',
    historyDetail: 'Chat · Appointment booked',
  },
  [CATEGORY.RETAIL]: {
    reasonForContact: 'Order, billing, or support issue',
    agentOpen: "I called {name} about the issue and opened a case. They said to expect a follow-up within a couple of business days.",
    userReply: 'Thanks, keep me posted.',
    historyStatus: 'In Progress',
    historyDetail: 'Chat · Case opened, awaiting follow-up',
  },
  [CATEGORY.OTHER]: {
    reasonForContact: 'General inquiry',
    agentOpen: "I reached out to {name} on your behalf and got things moving — I'll update you as soon as I hear back.",
    userReply: 'Great, thank you.',
    historyStatus: 'In Progress',
    historyDetail: 'Chat · Follow-up pending',
  },
};

// Generic durable facts per category, used for every contact that doesn't
// define its own `knowledge` array. {name} is replaced with the contact name.
// This is what lets the agent skip asking things it should already know.
const CATEGORY_KNOWLEDGE_TEMPLATE: Record<string, KnowledgeSeed[]> = {
  [CATEGORY.HEALTHCARE]: [
    { category: 'constraint', key: 'preferred_time_window', value: 'Prefers late-morning appointments, roughly 10am to 12pm, when available.' },
    { category: 'fact', key: 'insurance_provider', value: 'Covered under Horizon Insurance PPO — mention this when asked about coverage.' },
    { category: 'history', key: 'last_visit', value: 'Last visit was about 6 months ago with no follow-up issues noted.' },
    { category: 'preference', key: 'reminder_preference', value: 'Wants a reminder text the day before any appointment.' },
  ],
  [CATEGORY.PERSONAL_CARE]: [
    { category: 'preference', key: 'preferred_staff', value: 'Prefers being booked with a specific stylist/technician when one has worked with them before, rather than whoever is next available.' },
    { category: 'fact', key: 'service_frequency', value: 'Typically books this type of appointment every 4 to 6 weeks.' },
    { category: 'constraint', key: 'preferred_days', value: 'Weekday evenings after 5pm or Saturday mornings work best.' },
  ],
  [CATEGORY.HOME_AUTO]: [
    { category: 'fact', key: 'property_type', value: 'Owns a single-family home; someone is usually home to grant access on weekday afternoons.' },
    { category: 'preference', key: 'quote_before_work', value: 'Always wants a written or texted quote before any work begins — never authorize on the spot.' },
    { category: 'constraint', key: 'access_window', value: 'Best reachable for scheduling between 9am and 6pm on weekdays.' },
  ],
  [CATEGORY.FINANCIAL]: [
    { category: 'fact', key: 'account_standing', value: 'Standard account tier, no outstanding balances or disputes on file.' },
    { category: 'preference', key: 'notification_threshold', value: 'Wants to be notified before any charge or change over $100 is processed.' },
    { category: 'constraint', key: 'verification_method', value: 'Prefers identity verification via security questions rather than SMS codes when both are offered.' },
  ],
  [CATEGORY.GOVERNMENT]: [
    { category: 'preference', key: 'channel_preference', value: 'Prefers online scheduling or self-service portals over waiting on hold with support.' },
    { category: 'history', key: 'past_interactions', value: 'Previous interactions with this office were resolved without complications.' },
  ],
  [CATEGORY.RETAIL]: [
    { category: 'preference', key: 'resolution_preference', value: 'Prefers store credit or a replacement over a refund when something goes wrong with an order.' },
    { category: 'fact', key: 'account_tier', value: 'Standard, non-premium membership tier with this business.' },
  ],
  [CATEGORY.OTHER]: [
    { category: 'preference', key: 'communication_preference', value: 'Prefers a short written summary rather than a long back-and-forth.' },
  ],
};

const CONTACTS: ContactSeed[] = [
  // --- Assistant (flagship, fully custom) ---
  {
    name: 'Phone Agent',
    business: 'Your personal assistant',
    category: CATEGORY.ASSISTANT,
    initials: 'PA',
    color: '#ff9b83',
    note: 'Ready to help with everyday admin',
    online: true,
    custom: {
      conversationTitle: 'Main conversation',
      messages: [
        { role: 'assistant', content: "Good morning, Alex. Tell me what you want to get off your plate and I'll help you work through it.", time: '9:41 AM' },
        { role: 'user', content: 'Can you help me book a dental cleaning next week?', time: '9:42 AM' },
        { role: 'assistant', content: 'Absolutely. I can help with that. Do you have a preferred day or time window, or should I look for the first opening?', time: '9:42 AM' },
      ],
    },
    // No per-contact facts for the meta "assistant" thread — it isn't a
    // real-world business, so there's nothing durable to remember about it.
    knowledge: [],
  },

  // --- 1. Healthcare & Medical ---
  {
    name: 'Bright Smile Dental', business: 'Dentist / dental clinic', category: CATEGORY.HEALTHCARE,
    initials: 'BS', color: '#f7ad92', note: 'Ask for a late morning slot',
    custom: {
      conversationTitle: 'Cleaning appointment',
      messages: [
        { role: 'assistant', content: "I called Bright Smile Dental about your cleaning. They have an opening next Thursday at 11:15 AM — want me to lock it in?", time: 'Yesterday, 3:12 PM' },
        { role: 'user', content: 'Yes please, Thursday works.', time: 'Yesterday, 3:20 PM' },
        { role: 'assistant', content: "Booked. You're confirmed for Thursday at 11:15 AM. I'll send a reminder the day before.", time: 'Yesterday, 3:21 PM' },
      ],
      history: { title: 'Dental cleaning', detail: 'Chat · Preferences saved', status: 'Completed', time: 'Yesterday' },
    },
    queries: [
      { question: 'Do you want fluoride treatment added to the cleaning?' },
      { question: 'Would you like a copy of your X-rays sent to you?' },
    ],
    knowledge: [
      { category: 'constraint', key: 'preferred_time_window', value: 'Prefers late-morning appointments, ideally between 10am and 12pm.' },
      { category: 'fact', key: 'insurance_provider', value: 'Covered under Horizon Insurance dental PPO.' },
      { category: 'history', key: 'last_cleaning', value: 'Last cleaning was about 6 months ago; no cavities found, no follow-up needed.' },
      { category: 'preference', key: 'preferred_hygienist', value: 'Prefers being seen by hygienist Dana when she is available.' },
      { category: 'contact_info', key: 'office_hours', value: 'Open Monday to Friday, 8am to 5pm; closed weekends.' },
    ],
  },
  { name: 'Dr. Patel — Family Practice', business: 'Doctor / GP', category: CATEGORY.HEALTHCARE, initials: 'DP', color: '#8fc9b0', note: 'Annual physical is due' },
  { name: 'Riverside Pharmacy', business: 'Pharmacy', category: CATEGORY.HEALTHCARE, initials: 'RP', color: '#9ec5e8', note: 'Refill: blood pressure medication' },
  { name: 'Cedar Valley Hospital — Lab', business: 'Hospital / lab', category: CATEGORY.HEALTHCARE, initials: 'CV', color: '#e8a5a5', note: 'Waiting on bloodwork results' },
  { name: 'Dr. Anya Kim, LMFT', business: 'Therapist / mental health', category: CATEGORY.HEALTHCARE, initials: 'AK', color: '#b9a8dd', note: 'Weekly session, prefers Tuesdays' },
  { name: 'Clearview Optometry', business: 'Optometrist / eye doctor', category: CATEGORY.HEALTHCARE, initials: 'CO', color: '#7fc9c9', note: 'Contact lens order' },
  { name: 'Align Physiotherapy', business: 'Physiotherapist / chiro', category: CATEGORY.HEALTHCARE, initials: 'AP', color: '#e0b568', note: 'Follow-up on knee treatment' },

  // --- 2. Personal Care & Lifestyle ---
  {
    name: 'Luca at Northside', business: 'Hair salon / barber', category: CATEGORY.PERSONAL_CARE,
    initials: 'LN', color: '#a4c1dd', note: 'Prefer Alex or Mei',
    custom: {
      conversationTitle: 'Reschedule haircut',
      messages: [
        { role: 'user', content: 'Can you move my Friday haircut to Saturday instead?', time: 'Jun 12, 6:40 PM' },
        { role: 'assistant', content: "I called Northside — Saturday at 2 PM with Mei is open. Still waiting on your confirmation to lock it in.", time: 'Jun 12, 6:52 PM' },
      ],
      history: { title: 'Reschedule haircut', detail: 'Chat · Waiting on a reply', status: 'Needs you', time: 'Jun 12' },
    },
    knowledge: [
      { category: 'preference', key: 'preferred_stylist', value: 'Prefers Mei or Alex; would rather wait a few extra days than book with anyone else.' },
      { category: 'fact', key: 'usual_service', value: 'Usually books a men\'s haircut with a fade, no beard trim.' },
      { category: 'constraint', key: 'preferred_days', value: 'Saturday afternoons work best; avoid Mondays entirely.' },
    ],
  },
  { name: 'Gloss Nail Studio', business: 'Nail salon / spa', category: CATEGORY.PERSONAL_CARE, initials: 'GN', color: '#e8a5c4', note: 'Gel manicure, book with Priya' },
  { name: 'Radiance Dermatology', business: 'Beauty clinic / dermatologist', category: CATEGORY.PERSONAL_CARE, initials: 'RD', color: '#dab894', note: 'Annual skin check' },
  { name: 'Iron Peak Fitness', business: 'Gym / personal trainer', category: CATEGORY.PERSONAL_CARE, initials: 'IP', color: '#8fb87a', note: 'Book trainer session with Sam' },
  { name: 'Pawsitive Grooming & Vet', business: 'Pet groomer / vet', category: CATEGORY.PERSONAL_CARE, initials: 'PG', color: '#e0c268', note: "Milo's annual checkup + grooming" },

  // --- 3. Home, Auto & Local Services ---
  {
    name: 'Riverside Auto Service', business: 'Car service / mechanic', category: CATEGORY.HOME_AUTO,
    initials: 'RA', color: '#e0b568', note: 'Due for an oil change + brake check',
    custom: {
      conversationTitle: 'Oil change booking',
      messages: [
        { role: 'assistant', content: "Riverside can take the car in Tuesday morning for the oil change and brake inspection. Drop-off by 8 AM works?", time: 'Jun 09, 10:15 AM' },
        { role: 'user', content: 'Tuesday morning is perfect, thanks.', time: 'Jun 09, 10:20 AM' },
      ],
      history: { title: 'Oil change + brake check', detail: 'Chat · Booked for Tuesday', status: 'Completed', time: 'Jun 09' },
    },
    knowledge: [
      { category: 'fact', key: 'vehicle', value: 'Drives a 2018 Honda Civic, silver, plate not on file.' },
      { category: 'history', key: 'last_service', value: 'Oil change and brake inspection completed in June, no issues flagged.' },
      { category: 'preference', key: 'quote_before_work', value: 'Always wants a quote texted before any repair work begins.' },
    ],
  },
  { name: 'Ace Plumbing & Electric', business: 'Plumber / electrician / HVAC', category: CATEGORY.HOME_AUTO, initials: 'AP', color: '#7fa8c9', note: 'Kitchen faucet leak' },
  { name: 'Sparkle Home Cleaning', business: 'Cleaner / housekeeping', category: CATEGORY.HOME_AUTO, initials: 'SH', color: '#a8d4c9', note: 'Biweekly cleaning schedule' },
  { name: 'Guardian Pest Control', business: 'Pest control', category: CATEGORY.HOME_AUTO, initials: 'GP', color: '#c9a878', note: 'Quarterly treatment due' },
  { name: 'QuickKey Locksmith', business: 'Locksmith', category: CATEGORY.HOME_AUTO, initials: 'QK', color: '#b0b0b0', note: 'Spare key for the new lock' },
  { name: 'FixIt Appliance Repair', business: 'Appliance repair', category: CATEGORY.HOME_AUTO, initials: 'FI', color: '#d4a8a8', note: 'Washing machine not draining' },

  // --- 4. Financial, Insurance & Bills ---
  {
    name: 'Horizon Insurance', business: 'Insurance company', category: CATEGORY.FINANCIAL,
    initials: 'HI', color: '#c9a4dd', note: 'Policy renewal question',
    custom: {
      conversationTitle: 'Policy renewal',
      messages: [
        { role: 'user', content: 'My renewal notice mentioned a rate increase — can you find out why?', time: 'Jun 05, 1:02 PM' },
        { role: 'assistant', content: "I called their support team — it's a regional rate adjustment, not tied to any claim. I asked about bundling discounts too and I'm waiting on numbers back.", time: 'Jun 05, 1:30 PM' },
      ],
      history: { title: 'Insurance renewal', detail: 'Chat · Waiting on a reply', status: 'In Progress', time: 'Jun 05' },
    },
    queries: [
      { question: 'Would you like to add roadside assistance to the policy while we have this thread open?' },
    ],
    knowledge: [
      { category: 'fact', key: 'policy_type', value: 'Auto and home bundled policy, annual renewal in June.' },
      { category: 'preference', key: 'response_preference', value: 'Prefers a written reply over waiting on hold for account questions.' },
      { category: 'contact_info', key: 'policy_number', value: 'Policy reference on file: HI-48213-B (mention if asked to verify).' },
    ],
  },
  { name: 'Meridian Bank', business: 'Bank / credit card company', category: CATEGORY.FINANCIAL, initials: 'MB', color: '#7fa8dd', note: 'Dispute a charge' },
  { name: 'CityLine Utilities', business: 'Utility company (electric/gas)', category: CATEGORY.FINANCIAL, initials: 'CU', color: '#e8c268', note: 'Billing looks off this month' },
  { name: 'Northwind Water & Internet', business: 'Utility company (water/internet)', category: CATEGORY.FINANCIAL, initials: 'NW', color: '#8fc9dd', note: 'Report an outage' },
  { name: 'Summit Mortgage Group', business: 'Loan / mortgage provider', category: CATEGORY.FINANCIAL, initials: 'SM', color: '#a8a878', note: 'Question about refinancing' },
  { name: 'Patterson Tax & Accounting', business: 'Tax office / accountant', category: CATEGORY.FINANCIAL, initials: 'PT', color: '#c9b878', note: 'Schedule a filing consult' },

  // --- 5. Government & Bureaucracy ---
  {
    name: 'Metro DMV', business: 'DMV / motor vehicle dept', category: CATEGORY.GOVERNMENT,
    initials: 'MD', color: '#7fb3d5', note: 'License renewal — appointment needed',
    custom: {
      conversationTitle: 'License renewal appointment',
      messages: [
        { role: 'assistant', content: 'The DMV phone line quoted a 40-minute hold, so I booked an in-person appointment online instead for next Wednesday at 9:40 AM.', time: 'Jun 07, 4:18 PM' },
        { role: 'user', content: 'Perfect, that saves me the hassle.', time: 'Jun 07, 4:22 PM' },
      ],
      history: { title: 'License renewal', detail: 'Chat · Appointment booked', status: 'Completed', time: 'Jun 07' },
    },
    knowledge: [
      { category: 'history', key: 'last_appointment', value: 'Renewed driver\'s license in person previously with no complications.' },
      { category: 'preference', key: 'channel_preference', value: 'Prefers booking online over waiting on hold with their support line.' },
    ],
  },
  { name: 'Fairview City Hall', business: 'Local council / city hall', category: CATEGORY.GOVERNMENT, initials: 'FC', color: '#a8b0c9', note: 'Fence permit question' },
  { name: 'Passport & Immigration Office', business: 'Passport / immigration office', category: CATEGORY.GOVERNMENT, initials: 'PI', color: '#9ea8c9', note: 'Check application status' },
  { name: 'Social Security Office', business: 'Social security / benefits office', category: CATEGORY.GOVERNMENT, initials: 'SS', color: '#8fa8b8', note: 'Benefits eligibility question' },
  {
    name: 'Mara · Parcel Desk', business: 'Post office / shipping', category: CATEGORY.GOVERNMENT,
    initials: 'MP', color: '#d4b7e9', note: 'Tracking: PLX-48290',
    custom: {
      conversationTitle: 'Missed delivery follow-up',
      messages: [
        { role: 'user', content: 'My package PLX-48290 says delivered but I never got it.', time: 'Jun 08, 11:00 AM' },
        { role: 'assistant', content: "I called the parcel desk and filed a missing-package trace. They'll investigate with the driver and follow up within 2 business days — I saved the case number for you.", time: 'Jun 08, 11:24 AM' },
      ],
      history: { title: 'Package delivery update', detail: 'Chat · Summary saved', status: 'Completed', time: 'Jun 08' },
    },
    knowledge: [
      { category: 'history', key: 'missing_package_case', value: 'Filed a missing-package trace for tracking PLX-48290; case was opened and resolved.' },
      { category: 'fact', key: 'delivery_instructions', value: 'Deliveries go to the front porch; signature is not required.' },
    ],
  },

  // --- 6. Customer Service & Retail ---
  { name: 'Amazon Customer Support', business: 'Big retailer', category: CATEGORY.RETAIL, initials: 'AZ', color: '#e0a868', note: 'Return a damaged item' },
  { name: 'SkyLine Airlines', business: 'Airline', category: CATEGORY.RETAIL, initials: 'SA', color: '#7fa8dd', note: 'Change flight date' },
  { name: 'ConnectMobile', business: 'Telecom / mobile provider', category: CATEGORY.RETAIL, initials: 'CM', color: '#a8c9a8', note: 'Question about the new plan' },
  { name: 'StreamPlus Support', business: 'Subscription service', category: CATEGORY.RETAIL, initials: 'SP', color: '#c9a8c9', note: 'Cancel unused subscription' },
  { name: 'HomeGoods Online Support', business: 'Online store', category: CATEGORY.RETAIL, initials: 'HG', color: '#d4c8a8', note: 'Warranty claim on a blender' },

  // --- 7. Other frequent ones ---
  { name: 'Lincoln Elementary — Front Office', business: 'School / university', category: CATEGORY.OTHER, initials: 'LE', color: '#a8c9d4', note: "Confirm pickup schedule" },
  { name: 'Parkview Property Management', business: 'Landlord / property management', category: CATEGORY.OTHER, initials: 'PP', color: '#c9b8a8', note: 'Report a maintenance issue' },
  { name: 'Swift Courier Services', business: 'Delivery company', category: CATEGORY.OTHER, initials: 'SC', color: '#a8d4c9', note: 'Reschedule a missed delivery' },
  { name: 'Olive & Vine Trattoria', business: 'Restaurant reservations', category: CATEGORY.OTHER, initials: 'OV', color: '#c9d4a8', note: 'Table for 4, Saturday 7 PM' },
  { name: 'Hargrove & Associates', business: 'Lawyer / legal services', category: CATEGORY.OTHER, initials: 'HA', color: '#b8a8c9', note: 'Schedule a lease review' },
  { name: 'Horizon Claims Adjuster', business: 'Insurance adjuster', category: CATEGORY.OTHER, initials: 'HC', color: '#d4a8a8', note: 'Follow-up on auto claim' },
];

function buildTemplateThread(c: ContactSeed) {
  const t = CATEGORY_TEMPLATE[c.category];
  if (!t) throw new Error(`No template for category: ${c.category}`);
  return {
    conversationTitle: `${t.reasonForContact} — ${c.name}`,
    messages: [
      { role: 'assistant' as const, content: t.agentOpen.replace('{name}', c.name), time: 'Jun 14, 10:00 AM' },
      { role: 'user' as const, content: t.userReply, time: 'Jun 14, 10:05 AM' },
    ],
    history: {
      title: t.reasonForContact,
      detail: t.historyDetail,
      status: t.historyStatus,
      time: 'Jun 14',
    },
  };
}

// Falls back to the category's generic knowledge template when a contact
// doesn't define its own `knowledge` array.
function buildTemplateKnowledge(c: ContactSeed): KnowledgeSeed[] {
  const template = CATEGORY_KNOWLEDGE_TEMPLATE[c.category];
  if (!template) return [];
  return template.map((k) => ({ ...k, value: k.value.replace('{name}', c.name) }));
}

async function main() {
  console.log('Starting seed...');

  // Check if data already exists — if so, skip seeding entirely
  const existing = await prisma.contact.count();
  if (existing > 0) {
    console.log(`Database already has ${existing} contacts — skipping seed.`);
    return;
  }

  console.log('Empty database, seeding contacts...');

  // All contacts use the same TEST_PHONE_NUMBER from .env
  console.log(`Using phone number for all contacts: ${CONTACT_PHONE}`);

  let totalKnowledge = 0;

  for (const c of CONTACTS) {
    const thread = c.custom ?? buildTemplateThread(c);
    const knowledge = c.knowledge ?? buildTemplateKnowledge(c);

    const contact = await prisma.contact.create({
      data: {
        name: c.name,
        business: c.business,
        category: c.category,
        phone: CONTACT_PHONE,
        initials: c.initials,
        color: c.color,
        note: c.note,
        online: c.online ?? false,
      },
    });

    const conversation = await prisma.conversation.create({
      data: {
        title: thread.conversationTitle,
        contactId: contact.id,
      },
    });

    // Seed any pre-defined queries for this contact's conversation
    if (c.queries && c.queries.length > 0) {
      for (const q of c.queries) {
        await prisma.query.create({
          data: {
            question: q.question,
            status: 'pending',
            conversationId: conversation.id,
            contactId: contact.id,
            isKnowledgeGap: false, // Seed queries are not knowledge gaps by default
          },
        });
      }
    }

    // Seed durable knowledge facts for this contact — this is what lets the
    // agent skip asking things it should already know (office hours,
    // insurance, preferred time windows, past visit history, etc).
    if (knowledge.length > 0) {
      for (const k of knowledge) {
        await prisma.contactKnowledge.create({
          data: {
            contactId: contact.id,
            category: k.category,
            key: k.key,
            value: k.value,
            confidence: k.confidence ?? 1.0,
          },
        });
      }
      totalKnowledge += knowledge.length;
    }

    // No seed messages or history — conversations start fresh
  }

  const totalQueries = CONTACTS.reduce((n, c) => n + (c.queries?.length ?? 0), 0);
  console.log(`Seeded ${CONTACTS.length} contacts, each with their own conversation (${totalQueries} seed queries, ${totalKnowledge} knowledge facts).`);
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