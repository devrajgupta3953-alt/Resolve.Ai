import React, { useState } from 'react';
import { FileCode2, Copy, Check, BookOpen, Layers, ShieldCheck, Sparkles, Cpu } from 'lucide-react';

export const PatentDocumentationViewer: React.FC = () => {
  const [copied, setCopied] = useState(false);
  const [activeSection, setActiveSection] = useState<'claims' | 'workflow' | 'figures' | 'guarantees'>('claims');

  const handleCopyAll = () => {
    navigator.clipboard.writeText(
      `Refer to /PATENT_TECHNICAL_DESCRIPTION.md for the full legal/technical description.`
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="bg-[#2C3E50] rounded-[24px] p-6 sm:p-8 text-white shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border border-[#E8E6E1]/20">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-3 py-0.5 rounded-full text-[10px] uppercase font-bold tracking-widest bg-[#8A9A5B]/30 text-[#D7E4C4] border border-[#8A9A5B]/40">
              Patent-Oriented Technical Specifications
            </span>
            <span className="text-[11px] uppercase tracking-wider text-[#DED9CE]/80 font-mono">Sections A through G</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif italic tracking-tight text-[#FDFCF8]">Computer-Implemented System & Method Specifications</h1>
          <p className="text-xs sm:text-sm text-[#DED9CE]/90 mt-2 max-w-2xl leading-relaxed">
            Formal technical descriptions, multi-factor urgency algorithms, confidence-bounded routing flows, and state
            machines.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopyAll}
            className="px-4 py-2.5 rounded-full bg-[#1E2B37] hover:bg-[#324556] text-xs font-semibold text-[#FDFCF8] flex items-center gap-2 transition border border-[#E8E6E1]/20 shadow-xs"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-[#8A9A5B]" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'Reference Copied' : 'Copy Reference'}
          </button>
        </div>
      </div>

      {/* Navigation tabs */}
      <div className="flex items-center gap-2 border-b border-[#E8E6E1] pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveSection('claims')}
          className={`px-4 py-2 rounded-full text-xs font-semibold uppercase tracking-wider transition ${
            activeSection === 'claims'
              ? 'bg-[#8A9A5B] text-white shadow-xs'
              : 'bg-white border border-[#E8E6E1] text-[#2C3E50] hover:bg-[#F4F1EA]'
          }`}
        >
          Core Technical Concept
        </button>
        <button
          onClick={() => setActiveSection('workflow')}
          className={`px-4 py-2 rounded-full text-xs font-semibold uppercase tracking-wider transition ${
            activeSection === 'workflow'
              ? 'bg-[#8A9A5B] text-white shadow-xs'
              : 'bg-white border border-[#E8E6E1] text-[#2C3E50] hover:bg-[#F4F1EA]'
          }`}
        >
          Deterministic Safety Shield
        </button>
        <button
          onClick={() => setActiveSection('figures')}
          className={`px-4 py-2 rounded-full text-xs font-semibold uppercase tracking-wider transition ${
            activeSection === 'figures'
              ? 'bg-[#8A9A5B] text-white shadow-xs'
              : 'bg-white border border-[#E8E6E1] text-[#2C3E50] hover:bg-[#F4F1EA]'
          }`}
        >
          System Figures & Flowcharts
        </button>
        <button
          onClick={() => setActiveSection('guarantees')}
          className={`px-4 py-2 rounded-full text-xs font-semibold uppercase tracking-wider transition ${
            activeSection === 'guarantees'
              ? 'bg-[#8A9A5B] text-white shadow-xs'
              : 'bg-white border border-[#E8E6E1] text-[#2C3E50] hover:bg-[#F4F1EA]'
          }`}
        >
          State Guarantees & Privacy
        </button>
      </div>

      {/* Content based on tab */}
      {activeSection === 'claims' && (
        <div className="bg-white rounded-[24px] border border-[#E8E6E1] shadow-xs p-6 sm:p-7 space-y-4 text-xs leading-relaxed text-[#2C3E50] animate-in fade-in">
          <h2 className="text-base font-serif font-bold text-[#2C3E50] flex items-center gap-2">
            <Cpu className="w-5 h-5 text-[#8A9A5B]" /> Title of the Technical Invention
          </h2>
          <div className="p-4 bg-[#F4F1EA] border border-[#E8E6E1] rounded-2xl font-serif text-[#2C3E50] text-sm leading-relaxed">
            Computer-Implemented System and Method for Natural-Language Complaint Processing, Multi-Factor Hybrid Urgency
            Assessment, Confidence-Calibrated Automated Department Routing, and Human-in-the-Loop Feedback Optimization
          </div>

          <h3 className="text-sm font-serif font-bold text-[#2C3E50] pt-2">Technical Field</h3>
          <p className="text-[#6B7C8E]">
            The invention relates to institutional workflow automation, natural language understanding, safety hazard
            detection, and confidence-bounded dispatch systems in educational institutions and enterprise environments.
          </p>

          <h3 className="text-sm font-serif font-bold text-[#2C3E50] pt-2">Distinctive Technical Inventions</h3>
          <ol className="list-decimal list-inside space-y-2.5 text-[#2C3E50]">
            <li>
              <strong>Structured Multi-Dimensional NLP Extraction:</strong> Ingests natural-language student text, normalizes
              multilingual inputs (English, Hindi, Hinglish), and outputs structured facts (summary, category, risk flags,
              urgency, confidence, suggested department).
            </li>
            <li>
              <strong>Deterministic Safety Override Shield:</strong> A deterministic regex and pattern matching layer that
              evaluates urgent safety keywords (e.g. exposed wiring, gas leak, fire, harassment) and authoritatively overrides
              probabilistic AI models to enforce HIGH urgency.
            </li>
            <li>
              <strong>Confidence Thresholded Triage Engine:</strong> Mathematically routes tickets based on composite confidence
              bounds: &ge; 0.80 auto-routes; 0.60 to 0.79 enters review queue; &lt; 0.60 routes to general administration triage.
            </li>
            <li>
              <strong>Structured Feedback Repository:</strong> Preserves human overrides as structured tuples containing
              original prediction, human correction, categorized error reason, and reviewer timestamp for quantitative model
              evaluation.
            </li>
          </ol>
        </div>
      )}

      {activeSection === 'workflow' && (
        <div className="bg-white rounded-[24px] border border-[#E8E6E1] shadow-xs p-6 sm:p-7 space-y-4 text-xs leading-relaxed text-[#2C3E50] animate-in fade-in">
          <h2 className="text-base font-serif font-bold text-[#2C3E50] flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-[#5B7235]" /> Deterministic Hybrid Rule Engine Logic
          </h2>
          <p className="text-[#6B7C8E]">
            The system guarantees that generative AI outputs are strictly constrained by deterministic safety rules:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-5 bg-[#F4F1EA] border border-[#E2725B]/40 rounded-2xl space-y-2">
              <h3 className="font-serif font-bold text-[#E2725B] flex items-center gap-1.5">
                <span>🔴</span> High-Risk Deterministic Triggers
              </h3>
              <ul className="list-disc list-inside space-y-1 text-[#2C3E50] text-[11px]">
                <li>Electrical sparking, exposed live wiring, shock hazard</li>
                <li>Fire, gas smell, structural roof/wall cracks</li>
                <li>Assault, physical violence, sexual harassment</li>
                <li>Elevator entrapment, water contamination</li>
              </ul>
              <div className="text-[10px] text-[#E2725B] font-semibold pt-1">
                Verdict: Forces Final Urgency = HIGH, Human Review = TRUE
              </div>
            </div>

            <div className="p-5 bg-[#F4F1EA] border border-[#D99B43]/40 rounded-2xl space-y-2">
              <h3 className="font-serif font-bold text-[#D99B43] flex items-center gap-1.5">
                <span>🟡</span> Medium-Risk Institutional Triggers
              </h3>
              <ul className="list-disc list-inside space-y-1 text-[#2C3E50] text-[11px]">
                <li>Duplicate fee deduction, payment gateway error</li>
                <li>Hostel Wi-Fi failure affecting lab deadline</li>
                <li>Mess food hygiene or expired meal issue</li>
                <li>Library book penalty dispute</li>
              </ul>
              <div className="text-[10px] text-[#D99B43] font-semibold pt-1">
                Verdict: Rule Urgency = MEDIUM, Standard SLA applies
              </div>
            </div>
          </div>
        </div>
      )}

      {activeSection === 'figures' && (
        <div className="bg-white rounded-[24px] border border-[#E8E6E1] shadow-xs p-6 sm:p-7 space-y-4 text-xs text-[#2C3E50] animate-in fade-in">
          <h2 className="text-base font-serif font-bold text-[#2C3E50] flex items-center gap-2">
            <Layers className="w-5 h-5 text-[#8A9A5B]" /> Architectural Flowcharts & Figures
          </h2>
          <p className="text-[#6B7C8E]">
            The full diagrams are documented in <code className="bg-[#F4F1EA] px-2 py-0.5 rounded text-[#2C3E50]">/PATENT_TECHNICAL_DESCRIPTION.md</code>. Below is an interactive
            visual map:
          </p>

          <div className="space-y-4">
            <div className="p-5 bg-[#2C3E50] text-[#DED9CE] rounded-2xl space-y-2 font-mono text-[11px] border border-[#E8E6E1]/20">
              <div className="text-[#8A9A5B] font-bold">Figure 1: Data Ingestion & Classification Pipeline</div>
              <div className="text-[#FDFCF8] leading-relaxed">
                [Student Submission] &rarr; [Text Sanitization] &rarr; [Gemini AI Engine] &rarr; [Deterministic Rule Engine]
                &rarr; [Routing Score Gate] &rarr; [Review Queue / Dept Queue] &rarr; [Audit Logger]
              </div>
            </div>

            <div className="p-5 bg-[#2C3E50] text-[#DED9CE] rounded-2xl space-y-2 font-mono text-[11px] border border-[#E8E6E1]/20">
              <div className="text-[#8A9A5B] font-bold">Figure 2: Confidence-Bounded Triage Decision Gate</div>
              <div className="text-[#FDFCF8] leading-relaxed">
                Composite Confidence C = min(UrgencyConfidence, DeptConfidence)
                <br />
                &bull; If C &ge; 0.80 &amp; Non-Hazardous: Auto-Route to Primary Department
                <br />
                &bull; If 0.60 &le; C &lt; 0.80: Flag for Human Review
                <br />
                &bull; If C &lt; 0.60: Route to General Administration Triage Queue
              </div>
            </div>
          </div>
        </div>
      )}

      {activeSection === 'guarantees' && (
        <div className="bg-white rounded-[24px] border border-[#E8E6E1] shadow-xs p-6 sm:p-7 space-y-4 text-xs text-[#2C3E50] animate-in fade-in leading-relaxed">
          <h2 className="text-base font-serif font-bold text-[#2C3E50] flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-[#8A9A5B]" /> State Machine & Privacy Guarantees
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-5 bg-[#F4F1EA] border border-[#E8E6E1] rounded-2xl space-y-2">
              <h3 className="font-serif font-bold text-[#2C3E50]">Student Privacy Isolation</h3>
              <p className="text-[#6B7C8E]">
                Internal staff notes, confidential investigation logs, and raw probabilistic confidence percentages are
                strictly isolated on the server-side and never dispatched to student client endpoints.
              </p>
            </div>

            <div className="p-5 bg-[#F4F1EA] border border-[#E8E6E1] rounded-2xl space-y-2">
              <h3 className="font-serif font-bold text-[#2C3E50]">Immutable Auditability</h3>
              <p className="text-[#6B7C8E]">
                Every state transition, urgency override, departmental reassignment, note addition, and clarification is
                recorded with actor ID, timestamp, old value, and new value.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
