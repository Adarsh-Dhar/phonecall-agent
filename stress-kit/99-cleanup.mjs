import { db } from './lib.mjs';
// Mirrors/contacts cascade via Account.ownerId; Calls cascade via contactId.
const r = await db.query(`DELETE FROM "Account" WHERE email LIKE 'stress\\_%@stress.test'`);
console.log(`deleted ${r.rowCount} seeded accounts (their contacts, conversations and calls cascade)`);
await db.end();
