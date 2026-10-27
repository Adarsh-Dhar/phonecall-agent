/**
 * Known-issues.json handling
 *
 * Manages the ledger of known red checks with fix PR references
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class Ledger {
  constructor(knownIssuesPath = null) {
    this.knownIssuesPath = knownIssuesPath || join(__dirname, '..', 'known-issues.json');
    this.knownIssues = new Map();
    this.load();
  }

  load() {
    if (existsSync(this.knownIssuesPath)) {
      try {
        const data = readFileSync(this.knownIssuesPath, 'utf-8');
        const issues = JSON.parse(data);
        for (const issue of issues) {
          this.knownIssues.set(issue.checkId, issue);
        }
      } catch (error) {
        // Fail silently if file doesn't exist or is invalid
        console.warn(`Failed to load known issues: ${error.message}`);
      }
    }
  }

  save() {
    const issues = Array.from(this.knownIssues.values());
    writeFileSync(this.knownIssuesPath, JSON.stringify(issues, null, 2));
  }

  isKnownRed(checkId) {
    return this.knownIssues.has(checkId);
  }

  getKnownIssue(checkId) {
    return this.knownIssues.get(checkId);
  }

  addKnownIssue(checkId, reason, fixPr = null) {
    this.knownIssues.set(checkId, {
      checkId,
      reason,
      fixPr,
      addedAt: new Date().toISOString(),
    });
    this.save();
  }

  markFixed(checkId) {
    const issue = this.knownIssues.get(checkId);
    if (issue) {
      this.knownIssues.delete(checkId);
      this.save();
      return issue;
    }
    return null;
  }

  getAllKnownIssues() {
    return Array.from(this.knownIssues.values());
  }

  checkUnexpectedPass(results) {
    const unexpectedPasses = [];
    
    for (const result of results) {
      if (result.verdict === 'PASS' && this.isKnownRed(result.checkId)) {
        const issue = this.getKnownIssue(result.checkId);
        unexpectedPasses.push({
          checkId: result.checkId,
          description: result.description,
          knownIssue: issue,
        });
      }
    }

    return unexpectedPasses;
  }
}

export { Ledger };
