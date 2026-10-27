/**
 * Account seeding and JWT minting
 *
 * Creates test accounts and mints JWT tokens for authentication
 */

import { randomBytes } from 'crypto';
import { SignJWT, jwtVerify } from 'jose';
import { db } from './env.mjs';

class AccountManager {
  constructor(opts) {
    this.jwtSecret = opts.jwtSecret;
    this.baseUrl = opts.baseUrl;
    this.accounts = new Map();
  }

  generateAccountId() {
    return `cm${randomBytes(12).toString('hex')}`;
  }

  generateEmail(domain = 'stress-test.local') {
    const username = randomBytes(8).toString('hex');
    return `${username}@${domain}`;
  }

  async createAccount(accountData = {}) {
    const id = accountData.id || this.generateAccountId();
    const email = accountData.email || this.generateEmail();

    const account = {
      id,
      email,
      name: accountData.name || 'Test User',
      isService: accountData.isService || false,
      phone: accountData.phone || `+1555${Math.floor(Math.random() * 9000000) + 1000000}`,
      business: accountData.business || 'Test Business',
      category: accountData.category || 'technology',
      timezone: accountData.timezone || 'America/New_York',
      agentMode: accountData.agentMode === true,
      ...accountData,
    };

    // Persist: contacts/calls reference Account(id) by FK, and the server looks the user up per request.
    await db.query(
      `INSERT INTO "Account"
         (id, email, name, "isService", phone, business, category, timezone, "agentMode", "createdAt", "updatedAt")
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9, now(), now())
       ON CONFLICT (id) DO NOTHING`,
      [account.id, account.email, account.name, account.isService, account.phone,
       account.business, account.category, account.timezone, account.agentMode],
    );

    this.accounts.set(id, account);
    return account;
  }

  async createIndividual(accountData = {}) {
    return this.createAccount({
      ...accountData,
      isService: false,
    });
  }

  async createBusiness(accountData = {}) {
    return this.createAccount({
      ...accountData,
      isService: true,
    });
  }

  /** Same payload shape as artifacts/api-server/src/lib/jwt.ts signToken(): { userId, email }. */
  async mintJwt(accountId, expiresIn = '24h') {
    const account = this.accounts.get(accountId);
    if (!account) throw new Error(`mintJwt: unknown account ${accountId}`);
    const secret = new TextEncoder().encode(this.jwtSecret);

    return new SignJWT({ userId: accountId, email: account.email })
      .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
      .setIssuedAt()
      .setExpirationTime(expiresIn)
      .sign(secret);
  }

  async verifyJwt(token) {
    const secret = new TextEncoder().encode(this.jwtSecret);
    try {
      const { payload } = await jwtVerify(token, secret);
      return payload;
    } catch (error) {
      throw new Error('Invalid JWT token');
    }
  }

  getAccount(id) {
    return this.accounts.get(id);
  }

  getAllAccounts() {
    return Array.from(this.accounts.values());
  }

  clearAccounts() {
    this.accounts.clear();
  }

  async seedAccounts(count = 20) {
    const accounts = [];

    for (let i = 0; i < count; i++) {
      const account = await this.createIndividual();
      accounts.push(account);
    }

    return accounts;
  }

  async seedMixedAccounts(individualCount = 15, businessCount = 5) {
    const accounts = [];

    for (let i = 0; i < individualCount; i++) {
      const account = await this.createIndividual();
      accounts.push(account);
    }

    for (let i = 0; i < businessCount; i++) {
      const account = await this.createBusiness();
      accounts.push(account);
    }

    return accounts;
  }
}

export { AccountManager };
export { AccountManager as accounts };
