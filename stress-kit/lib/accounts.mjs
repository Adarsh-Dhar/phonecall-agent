/**
 * Account seeding and JWT minting
 *
 * Creates test accounts and mints JWT tokens for authentication
 */

import { randomBytes } from 'crypto';
import { SignJWT, jwtVerify } from 'jose';

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
      phone: accountData.phone || `+1${Math.floor(Math.random() * 9000000000) + 1000000000}`,
      business: accountData.business || 'Test Business',
      category: accountData.category || 'technology',
      timezone: accountData.timezone || 'America/New_York',
      agentMode: accountData.agentMode || 'auto',
      ...accountData,
    };

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

  mintJwt(accountId, expiresIn = '24h') {
    const secret = new TextEncoder().encode(this.jwtSecret);

    return new SignJWT({ sub: accountId, type: 'access' })
      .setProtectedHeader({ alg: 'HS256' })
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
