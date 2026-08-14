import React, { useState } from 'react';
import { FlaskConical, CheckCircle2, XCircle, Play, RefreshCw, ShieldCheck, Layers, Terminal } from 'lucide-react';
import { TestResultItem, TestRunResponse } from '../types';

export const AutomatedTestRunner: React.FC = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [testResponse, setTestResponse] = useState<TestRunResponse | null>(null);
  const [activeSuite, setActiveSuite] = useState<string>('ALL');

  const runTests = async () => {
    setIsRunning(true);
    try {
      const res = await fetch('/api/tests/run', { method: 'POST' });
      const data = await res.json();
      setTestResponse(data);
    } catch (err) {
      console.error('Test run failed:', err);
    } finally {
      setIsRunning(false);
    }
  };

  const suites = testResponse ? Array.from(new Set(testResponse.results.map((r) => r.suite))) : [];
  const filteredResults =
    testResponse && activeSuite !== 'ALL'
      ? testResponse.results.filter((r) => r.suite === activeSuite)
      : testResponse?.results || [];

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
      {/* Test Suite Banner */}
      <div className="bg-[#2C3E50] rounded-[24px] p-6 sm:p-8 text-white shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border border-[#E8E6E1]/20">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-3 py-0.5 rounded-full text-[10px] uppercase font-bold tracking-widest bg-[#8A9A5B]/30 text-[#D7E4C4] border border-[#8A9A5B]/40">
              System Verification & Automated Test Harness
            </span>
            <span className="text-[11px] uppercase tracking-wider text-[#DED9CE]/80 font-mono">Section 44 Test Suite</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif italic tracking-tight text-[#FDFCF8]">Institutional Architecture Test Runner</h1>
          <p className="text-xs sm:text-sm text-[#DED9CE]/90 mt-2 max-w-2xl leading-relaxed">
            Execute integration test suites verifying data validation, deterministic safety shields, confidence bounds,
            cross-role privacy isolation, and audit log generation.
          </p>
        </div>

        <button
          onClick={runTests}
          disabled={isRunning}
          className="px-5 py-2.5 bg-[#8A9A5B] hover:bg-[#78884E] disabled:opacity-50 text-white rounded-full text-xs font-semibold uppercase tracking-wider shadow-xs flex items-center gap-2 transition"
        >
          {isRunning ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              Running Suite...
            </>
          ) : (
            <>
              <Play className="w-4 h-4 fill-white" />
              Run Full Test Suite
            </>
          )}
        </button>
      </div>

      {/* Results Overview if executed */}
      {testResponse ? (
        <div className="space-y-6 animate-in fade-in">
          {/* Summary KPIs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-[#E8E6E1] shadow-xs">
              <div className="text-[10px] font-bold text-[#7D8B99] uppercase tracking-wider">Total Tests</div>
              <div className="text-2xl font-serif font-bold text-[#2C3E50]">{testResponse.total}</div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-[#8A9A5B]/30 bg-[#F4F1EA] shadow-xs">
              <div className="text-[10px] font-bold text-[#5B7235] uppercase tracking-wider">Passed</div>
              <div className="text-2xl font-serif font-bold text-[#5B7235]">{testResponse.passed}</div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-[#E2725B]/30 bg-[#F4F1EA] shadow-xs">
              <div className="text-[10px] font-bold text-[#E2725B] uppercase tracking-wider">Failed</div>
              <div className="text-2xl font-serif font-bold text-[#E2725B]">{testResponse.failed}</div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-[#E8E6E1] shadow-xs">
              <div className="text-[10px] font-bold text-[#7D8B99] uppercase tracking-wider">Execution Time</div>
              <div className="text-2xl font-serif font-bold text-[#8A9A5B]">{testResponse.durationMs} ms</div>
            </div>
          </div>

          {/* Suite Filter */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            <button
              onClick={() => setActiveSuite('ALL')}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider transition ${
                activeSuite === 'ALL'
                  ? 'bg-[#8A9A5B] text-white shadow-xs'
                  : 'bg-white border border-[#E8E6E1] text-[#2C3E50] hover:bg-[#F4F1EA]'
              }`}
            >
              All Suites ({testResponse.results.length})
            </button>
            {suites.map((s) => (
              <button
                key={s}
                onClick={() => setActiveSuite(s)}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider transition ${
                  activeSuite === s
                    ? 'bg-[#8A9A5B] text-white shadow-xs'
                    : 'bg-white border border-[#E8E6E1] text-[#2C3E50] hover:bg-[#F4F1EA]'
                }`}
              >
                {s}
              </button>
            ))}
          </div>

          {/* Test items list */}
          <div className="bg-white rounded-[24px] border border-[#E8E6E1] shadow-xs overflow-hidden divide-y divide-[#E8E6E1]">
            {filteredResults.map((item) => (
              <div key={item.id} className="p-4 sm:p-5 flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  {item.status === 'PASSED' ? (
                    <CheckCircle2 className="w-5 h-5 text-[#5B7235] flex-shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="w-5 h-5 text-[#E2725B] flex-shrink-0 mt-0.5" />
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 bg-[#F4F1EA] text-[#2C3E50] rounded-full border border-[#E8E6E1]">
                        {item.suite}
                      </span>
                      <h4 className="text-xs font-bold text-[#2C3E50]">{item.name}</h4>
                    </div>
                    {item.message && <p className="text-xs text-[#E2725B] font-mono mt-1">{item.message}</p>}
                  </div>
                </div>

                <div className="text-right flex-shrink-0">
                  <span
                    className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase ${
                      item.status === 'PASSED'
                        ? 'bg-[#8A9A5B]/20 text-[#5B7235]'
                        : 'bg-[#E2725B]/20 text-[#E2725B]'
                    }`}
                  >
                    {item.status}
                  </span>
                  <div className="text-[10px] text-[#7D8B99] font-mono mt-1">{item.durationMs}ms</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-[24px] border border-[#E8E6E1] p-12 text-center text-[#7D8B99] shadow-xs space-y-3">
          <FlaskConical className="w-12 h-12 text-[#8A9A5B] mx-auto" />
          <h3 className="text-base font-serif font-bold text-[#2C3E50]">Test Harness Ready</h3>
          <p className="text-xs text-[#6B7C8E] max-w-md mx-auto leading-relaxed">
            Click the "Run Full Test Suite" button above to initiate automated unit & integration tests covering NLP validation,
            deterministic safety overrides, routing fallbacks, and RBAC security.
          </p>
        </div>
      )}
    </div>
  );
};
