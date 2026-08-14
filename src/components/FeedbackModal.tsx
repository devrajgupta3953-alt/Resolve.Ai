import React, { useState } from 'react';
import { AlertTriangle, MessageSquare, Check, X, ShieldAlert, Sparkles } from 'lucide-react';
import { Complaint, Department, UrgencyLevel, User } from '../types';

interface FeedbackModalProps {
  complaint: Complaint;
  departments: Department[];
  currentUser: User;
  onClose: () => void;
  onSubmitOverride: (payload: {
    action: string;
    urgency?: UrgencyLevel;
    departmentId?: string;
    reason: string;
    feedbackReason: string;
    feedbackExplanation: string;
  }) => Promise<void>;
}

export const FeedbackModal: React.FC<FeedbackModalProps> = ({
  complaint,
  departments,
  currentUser,
  onClose,
  onSubmitOverride,
}) => {
  const [overrideType, setOverrideType] = useState<'URGENCY' | 'DEPARTMENT' | 'BOTH'>('URGENCY');
  const [selectedUrgency, setSelectedUrgency] = useState<UrgencyLevel>(complaint.urgency);
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<string>(
    complaint.assignedDepartmentId || departments[0]?.id || ''
  );
  const [feedbackReason, setFeedbackReason] = useState<string>('WRONG_URGENCY');
  const [feedbackExplanation, setFeedbackExplanation] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const feedbackOptions = [
    { value: 'WRONG_URGENCY', label: 'Wrong Urgency Level' },
    { value: 'WRONG_DEPARTMENT', label: 'Wrong Department Mapping' },
    { value: 'WRONG_CATEGORY', label: 'Wrong Category Classification' },
    { value: 'MISSING_CONTEXT', label: 'Missing Context or Nuance' },
    { value: 'INSUFFICIENT_INFO', label: 'Insufficient Information in Text' },
    { value: 'OTHER', label: 'Other Operational Correction' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSubmitOverride({
        action:
          overrideType === 'URGENCY'
            ? 'CHANGE_URGENCY'
            : overrideType === 'DEPARTMENT'
            ? 'CHANGE_DEPARTMENT'
            : 'CHANGE_URGENCY',
        urgency: selectedUrgency,
        departmentId: selectedDepartmentId,
        reason: feedbackExplanation || 'Human override applied during review.',
        feedbackReason,
        feedbackExplanation,
      });
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#2C3E50]/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-[24px] border border-[#E8E6E1] shadow-2xl max-w-lg w-full p-6 sm:p-7 space-y-5 animate-in fade-in zoom-in-95">
        <div className="flex items-start justify-between border-b border-[#E8E6E1] pb-3.5">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-[#E2725B]/20 text-[#E2725B] flex items-center justify-center">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-serif font-bold text-[#2C3E50]">Human Override & AI Feedback Loop</h3>
              <p className="text-xs text-[#6B7C8E]">Record corrections to audit and improve model reliability.</p>
            </div>
          </div>
          <button onClick={onClose} className="text-[#7D8B99] hover:text-[#2C3E50] p-1.5 rounded-full hover:bg-[#F4F1EA]">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* AI Suggestion Recap */}
        <div className="p-3.5 bg-[#F4F1EA] rounded-2xl border border-[#E8E6E1] text-xs space-y-1.5">
          <div className="text-[#7D8B99] font-medium text-[11px] uppercase tracking-wider">Original AI Recommendation:</div>
          <div className="flex items-center justify-between text-[#2C3E50]">
            <span>
              AI Urgency: <strong className="font-serif">{complaint.aiAnalysis?.urgency || complaint.urgency}</strong> (Conf:{' '}
              {Math.round((complaint.aiAnalysis?.urgencyConfidence || 0.85) * 100)}%)
            </span>
            <span>
              AI Dept: <strong className="font-serif">{complaint.aiAnalysis?.suggestedDepartment || complaint.assignedDepartmentName}</strong>
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Override Action Selection */}
          <div>
            <label className="block font-semibold text-[#2C3E50] mb-1.5">What are you overriding?</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'URGENCY', label: 'Urgency Level' },
                { id: 'DEPARTMENT', label: 'Department' },
                { id: 'BOTH', label: 'Both' },
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => {
                    setOverrideType(opt.id as any);
                    if (opt.id === 'DEPARTMENT') setFeedbackReason('WRONG_DEPARTMENT');
                    if (opt.id === 'URGENCY') setFeedbackReason('WRONG_URGENCY');
                  }}
                  className={`py-2 rounded-full font-semibold text-center transition ${
                    overrideType === opt.id
                      ? 'bg-[#8A9A5B] text-white shadow-xs'
                      : 'bg-white text-[#2C3E50] border border-[#DED9CE] hover:bg-[#F4F1EA]'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* New Urgency Selection */}
          {(overrideType === 'URGENCY' || overrideType === 'BOTH') && (
            <div>
              <label className="block font-semibold text-[#2C3E50] mb-1.5">Set New Urgency Level:</label>
              <div className="grid grid-cols-3 gap-2">
                {(['LOW', 'MEDIUM', 'HIGH'] as UrgencyLevel[]).map((lvl) => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => setSelectedUrgency(lvl)}
                    className={`py-2 rounded-full font-bold border transition ${
                      selectedUrgency === lvl
                        ? lvl === 'HIGH'
                          ? 'bg-[#E2725B] text-white border-[#E2725B]'
                          : lvl === 'MEDIUM'
                          ? 'bg-[#D99B43] text-white border-[#D99B43]'
                          : 'bg-[#8A9A5B] text-white border-[#8A9A5B]'
                        : 'bg-white text-[#2C3E50] border-[#DED9CE] hover:bg-[#F4F1EA]'
                    }`}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* New Department Selection */}
          {(overrideType === 'DEPARTMENT' || overrideType === 'BOTH') && (
            <div>
              <label className="block font-semibold text-[#2C3E50] mb-1">Reassign to Department:</label>
              <select
                value={selectedDepartmentId}
                onChange={(e) => setSelectedDepartmentId(e.target.value)}
                className="w-full p-2.5 bg-[#FDFCF8] border border-[#DED9CE] rounded-xl text-xs font-medium text-[#2C3E50] outline-none focus:border-[#8A9A5B]"
              >
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.code})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Structured Feedback Question */}
          <div>
            <label className="block font-semibold text-[#2C3E50] mb-1">What was incorrect about the AI recommendation?</label>
            <select
              value={feedbackReason}
              onChange={(e) => setFeedbackReason(e.target.value)}
              className="w-full p-2.5 bg-[#FDFCF8] border border-[#DED9CE] rounded-xl text-xs text-[#2C3E50] font-medium outline-none focus:border-[#8A9A5B]"
            >
              {feedbackOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Explanatory notes */}
          <div>
            <label className="block font-semibold text-[#2C3E50] mb-1">Optional Human Justification / Explanation:</label>
            <textarea
              rows={3}
              placeholder="e.g. While civil repairs are needed, immediate student room relocation requires Hostel Administration jurisdiction..."
              value={feedbackExplanation}
              onChange={(e) => setFeedbackExplanation(e.target.value)}
              className="w-full p-2.5 bg-[#FDFCF8] border border-[#DED9CE] rounded-xl text-xs leading-relaxed text-[#2C3E50] outline-none focus:border-[#8A9A5B]"
            />
          </div>

          <div className="flex justify-end gap-2.5 pt-3 border-t border-[#E8E6E1]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-[#F4F1EA] hover:bg-[#E8E6E1] text-[#2C3E50] font-medium rounded-full"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 bg-[#8A9A5B] hover:bg-[#78884E] text-white font-semibold uppercase tracking-wider rounded-full shadow-xs flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              Save Override & Log Feedback
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
