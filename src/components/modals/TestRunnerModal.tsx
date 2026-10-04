import React, { useState } from 'react';
import { runAllScoringEngineTests, TestResult } from '../../domain/scoring/engine.test';

interface TestRunnerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TestRunnerModal: React.FC<TestRunnerModalProps> = ({ isOpen, onClose }) => {
  const [testResults, setTestResults] = useState<TestResult[]>(() => runAllScoringEngineTests());

  if (!isOpen) return null;

  const passedCount = testResults.filter(t => t.passed).length;
  const allPassed = passedCount === testResults.length;

  const handleRerun = () => {
    setTestResults(runAllScoringEngineTests());
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="bg-[#1c2028] border border-[#3c4a42] rounded-2xl w-full max-w-md max-h-[85vh] overflow-y-auto p-5 shadow-2xl flex flex-col gap-4">
        <div className="flex items-center justify-between border-b border-[#3c4a42]/60 pb-3">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#4edea3] text-2xl">verified</span>
            <h2 className="font-headline font-bold text-lg text-[#dfe2ee]">Scoring Engine Verification</h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#262a33] text-[#bbcabf] hover:text-[#dfe2ee] flex items-center justify-center"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>

        {/* Status banner */}
        <div className={`p-3 rounded-xl border flex items-center justify-between ${
          allPassed
            ? 'bg-[#10b981]/15 border-[#10b981]/40 text-[#4edea3]'
            : 'bg-[#93000a]/20 border-[#93000a]/50 text-[#ffb4ab]'
        }`}>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-xl">
              {allPassed ? 'check_circle' : 'error'}
            </span>
            <span className="font-headline font-bold text-sm">
              {allPassed ? "All Domain Tests Passed!" : "Test Failures Detected"}
            </span>
          </div>
          <span className="font-headline text-xs font-bold px-2 py-0.5 rounded-full bg-[#0a0e16]">
            {passedCount} / {testResults.length}
          </span>
        </div>

        {/* Tests List */}
        <div className="space-y-1.5 max-h-80 overflow-y-auto pr-1">
          {testResults.map((t, idx) => (
            <div
              key={idx}
              className="p-2.5 rounded-lg bg-[#181c24] border border-[#3c4a42]/30 flex items-start justify-between gap-2 text-xs"
            >
              <div className="flex items-start gap-2">
                <span className={`material-symbols-outlined text-[16px] shrink-0 mt-0.5 ${
                  t.passed ? 'text-[#4edea3]' : 'text-[#ffb4ab]'
                }`}>
                  {t.passed ? 'check_circle' : 'cancel'}
                </span>
                <span className="text-[#dfe2ee] font-body">{t.title}</span>
              </div>
              <span className={`font-headline text-[10px] uppercase font-bold shrink-0 px-1.5 py-0.2 rounded ${
                t.passed ? 'bg-[#4edea3]/20 text-[#4edea3]' : 'bg-[#93000a]/30 text-[#ffb4ab]'
              }`}>
                {t.passed ? 'PASS' : 'FAIL'}
              </span>
            </div>
          ))}
        </div>

        <div className="flex gap-2 pt-2">
          <button
            onClick={handleRerun}
            className="flex-1 h-11 rounded-xl bg-[#262a33] hover:bg-[#353942] text-[#dfe2ee] font-headline font-bold text-xs uppercase flex items-center justify-center gap-1 active:scale-95"
          >
            <span className="material-symbols-outlined text-base">replay</span>
            Re-run Tests
          </button>
          <button
            onClick={onClose}
            className="flex-1 h-11 rounded-xl bg-[#4edea3] text-[#003824] font-headline font-bold text-xs uppercase flex items-center justify-center active:scale-95"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
