import { runAllScoringEngineTests } from '../domain/scoring/engine.test';
import { runPersistenceTests } from './persistence.test';
import { runUserIsolationTests } from './user-isolation.test';
import { runV2GameplayTests } from './v2-gameplay-fixes.test';

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

  console.log('--- RUNNING V2.0 GAMEPLAY, ACE & GUEST REGRESSION TESTS ---');
  const v2Results = await runV2GameplayTests();
  let v2Failures = 0;

  for (const t of v2Results) {
    if (t.passed) {
      console.log(`  ✓ [PASS] ${t.title}`);
    } else {
      v2Failures++;
      console.error(`  ✗ [FAIL] ${t.title} -> ${t.error}`);
    }
  }

  console.log(`\nV2 Regression Tests: ${v2Results.length - v2Failures} / ${v2Results.length} passed.\n`);

  const totalTests = scoringResults.length + persistenceResults.length + isolationResults.length + v2Results.length;
  const totalPassed =
    (scoringResults.length - domainFailures) +
    (persistenceResults.length - persistenceFailures) +
    (isolationResults.length - isolationFailures) +
    (v2Results.length - v2Failures);
  const totalFailed = domainFailures + persistenceFailures + isolationFailures + v2Failures;

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
