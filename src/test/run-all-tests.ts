import { runAllScoringEngineTests } from '../domain/scoring/engine.test';
import { runPersistenceTests } from './persistence.test';
import { runUserIsolationTests } from './user-isolation.test';

async function main() {
  console.log('====================================================');
  console.log('  SCORE & SIP — FULL APPLICATION TEST SUITE');
  console.log('====================================================\n');

  console.log('--- RUNNING DOMAIN SCORING ENGINE TESTS ---');
  const scoringResults = runAllScoringEngineTests();
  let domainFailures = 0;

  for (const t of scoringResults) {
    if (t.passed) {
      console.log(`  ✓ [PASS] ${t.title}`);
    } else {
      domainFailures++;
      console.error(`  ✗ [FAIL] ${t.title} -> ${t.error}`);
    }
  }

  console.log(`\nDomain Tests: ${scoringResults.length - domainFailures} / ${scoringResults.length} passed.\n`);

  console.log('--- RUNNING REPOSITORY & PERSISTENCE TESTS ---');
  const persistenceResults = await runPersistenceTests();
  let persistenceFailures = 0;

  for (const t of persistenceResults) {
    if (t.passed) {
      console.log(`  ✓ [PASS] ${t.title}`);
    } else {
      persistenceFailures++;
      console.error(`  ✗ [FAIL] ${t.title} -> ${t.error}`);
    }
  }

  console.log(`\nPersistence Tests: ${persistenceResults.length - persistenceFailures} / ${persistenceResults.length} passed.\n`);

  console.log('--- RUNNING USER ISOLATION & AUTH OWNERSHIP TESTS ---');
  const isolationResults = await runUserIsolationTests();
  let isolationFailures = 0;

  for (const t of isolationResults) {
    if (t.passed) {
      console.log(`  ✓ [PASS] ${t.title}`);
    } else {
      isolationFailures++;
      console.error(`  ✗ [FAIL] ${t.title} -> ${t.error}`);
    }
  }

  console.log(`\nUser Isolation Tests: ${isolationResults.length - isolationFailures} / ${isolationResults.length} passed.\n`);

  const totalTests = scoringResults.length + persistenceResults.length + isolationResults.length;
  const totalPassed =
    (scoringResults.length - domainFailures) +
    (persistenceResults.length - persistenceFailures) +
    (isolationResults.length - isolationFailures);
  const totalFailed = domainFailures + persistenceFailures + isolationFailures;

  console.log('====================================================');
  console.log(`  SUMMARY: ${totalPassed} / ${totalTests} TESTS PASSED`);
  if (totalFailed > 0) {
    console.log(`  FAILURES DETECTED: ${totalFailed}`);
    console.log('====================================================');
    process.exit(1);
  } else {
    console.log('  ALL TESTS PASSED SUCCESSFULLY! 🎯');
    console.log('====================================================');
    process.exit(0);
  }
}

main().catch(err => {
  console.error('Fatal test runner error:', err);
  process.exit(1);
});
