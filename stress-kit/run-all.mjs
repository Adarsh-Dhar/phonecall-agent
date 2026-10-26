/**
 * Run all stress test chapters
 * Usage: node run-all.mjs [chapter_number]
 * If chapter_number is provided, only that chapter runs
 */

import 'dotenv/config';
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CHAPTERS = [
  '01-contact-crud.mjs',
  '02-contact-races.mjs',
  '03-validation-fuzz.mjs',
  '04-dial-storm.mjs',
  '05-call-state-races.mjs',
  '06-ws-soak.mjs',
  '07-authz-matrix.mjs',
];

const chapterArg = process.argv[2];

async function runChapter(chapterFile) {
  return new Promise((resolve, reject) => {
    const fullPath = path.join(__dirname, chapterFile);
    const proc = spawn('node', [fullPath], {
      stdio: 'inherit',
      env: process.env,
    });

    proc.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`${chapterFile} exited with code ${code}`));
      }
    });

    proc.on('error', reject);
  });
}

async function main() {
  console.log('='.repeat(80));
  console.log('Stress Test Suite');
  console.log('='.repeat(80));
  console.log('');

  const chaptersToRun = chapterArg
    ? [CHAPTERS[parseInt(chapterArg) - 1]]
    : CHAPTERS;

  if (chapterArg && !chaptersToRun[0]) {
    console.error(`Invalid chapter number: ${chapterArg}`);
    console.error(`Available chapters: 1-${CHAPTERS.length}`);
    process.exit(1);
  }

  const results = [];

  for (const chapter of chaptersToRun) {
    if (!chapter) continue;
    
    console.log(`\nRunning ${chapter}...`);
    try {
      await runChapter(chapter);
      results.push({ chapter, status: 'PASS' });
    } catch (error) {
      results.push({ chapter, status: 'FAIL', error: error.message });
    }
  }

  console.log('');
  console.log('='.repeat(80));
  console.log('SUMMARY');
  console.log('='.repeat(80));
  
  for (const result of results) {
    console.log(`${result.chapter}: ${result.status}`);
    if (result.status === 'FAIL') {
      console.log(`  Error: ${result.error}`);
    }
  }

  const failed = results.filter(r => r.status === 'FAIL');
  console.log('');
  console.log(`Total: ${results.length}, Passed: ${results.length - failed.length}, Failed: ${failed.length}`);
  
  if (failed.length > 0) {
    process.exit(1);
  }
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
