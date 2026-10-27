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
  'M1-garbled-reply.mjs',
  'M2-slow-model.mjs',
  'M3-liar-transcript.mjs',
  'M4-double-extraction.mjs',
  'M5-memory-fades.mjs',
  'M6-alarm-clock.mjs',
  'M7-unreachable-owner.mjs',
  'P1-silent-line.mjs',
  'P2-hallucinated-hangup.mjs',
  'P3-rulebook-enforcement.mjs',
  'P4-question-unanswered.mjs',
  'P5-fast-talker.mjs',
  'P6-social-engineer.mjs',
  'P7-never-ending-call.mjs',
];

const chapterArg = process.argv[2];

async function runChapter(chapterFile) {
  return new Promise((resolve, reject) => {
    const fullPath = path.join(__dirname, chapterFile);
    const proc = spawn(process.execPath, [fullPath], {
      cwd: __dirname,
      env: process.env,
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    let output = '';

    proc.stdout.on('data', chunk => {
      const text = chunk.toString();
      output += text;
      process.stdout.write(text);
    });

    proc.stderr.on('data', chunk => {
      const text = chunk.toString();
      output += text;
      process.stderr.write(text);
    });

    proc.on('close', (code) => {
      // Check for machine-readable result marker
      const resultMatch = output.match(/STRESS_RESULT=(PASS|FAIL|SKIP)/);
      const explicitResult = resultMatch ? resultMatch[1] : null;

      // Map exit codes to results: 0=PASS, 1=FAIL, 2=SKIP
      let status;
      if (explicitResult) {
        status = explicitResult;
      } else if (code === 0) {
        // Check for SKIP markers in output
        const hasSkip = output.includes('⚠️  SKIP') || output.includes('SKIP (manual test required)');
        status = hasSkip ? 'SKIP' : 'PASS';
      } else if (code === 2) {
        status = 'SKIP';
      } else {
        status = 'FAIL';
      }

      if (status === 'FAIL') {
        reject(new Error(`${chapterFile} exited with code ${code}`));
      } else {
        resolve({ status });
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
      const result = await runChapter(chapter);
      results.push({ chapter, status: result.status });
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

  const passed = results.filter(r => r.status === 'PASS');
  const failed = results.filter(r => r.status === 'FAIL');
  const skipped = results.filter(r => r.status === 'SKIP');

  console.log('');
  console.log(`Total: ${results.length}, Passed: ${passed.length}, Failed: ${failed.length}, Skipped: ${skipped.length}`);

  if (failed.length > 0) {
    console.log('');
    console.log('Overall: ✗ FAIL (some chapters failed)');
    process.exit(1);
  }

  if (skipped.length > 0) {
    console.log('');
    console.log('Overall: ⚠️  SKIP (manual tests required)');
    console.log('Note: Skipped chapters require manual verification before certification');
    process.exit(0); // Exit 0 for SKIP - not a failure, but not a full pass
  }

  console.log('');
  console.log('Overall: ✓ PASS');
  process.exit(0);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
