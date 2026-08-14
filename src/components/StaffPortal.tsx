import React, { useState } from 'react';
import {
  Building2,
  Filter,
  Search,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Sparkles,
  ShieldAlert,
  MessageSquare,
  FileText,
  UserCheck,
  ChevronRight,
  ArrowUpRight,
  Send,
  HelpCircle,
  Tag,
  MapPin,
  RefreshCw,
  PlusCircle,
  SlidersHorizontal,
} from 'lucide-react';
import { Complaint, Department, UrgencyLevel, User } from '../types';
import { FeedbackModal } from './FeedbackModal';

interface StaffPortalProps {
  currentUser: User;
  complaints: Complaint[];
  departments: Department[];
  onRefreshComplaints: () => void;
  onReviewComplaint: (complaintId: string, action: string, details?: any) => Promise<void>;
  onAssignComplaint: (complaintId: string, deptId: string, staffName?: string) => Promise<void>;
  onUpdateStatus: (complaintId: string, status: string, comment?: string) => Promise<void>;
  onAddInternalNote: (complaintId: string, text: string) => Promise<void>;
  onRequestClarification: (complaintId: string, requestText: string) => Promise<void>;
}

export const StaffPortal: React.FC<StaffPortalProps> = ({
  currentUser,
  complaints,
  departments,
  onRefreshComplaints,
  onReviewComplaint,
  onAssignComplaint,
  onUpdateStatus,
  onAddInternalNote,
  onRequestClarification,
}) => {
  const [selectedComplaintId, setSelectedComplaintId] = useState<string | null>(
    complaints.length > 0 ? complaints[0].id : null
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [urgencyFilter, setUrgencyFilter] = useState<string>('ALL');
  const [departmentFilter, setDepartmentFilter] = useState<string>(currentUser.departmentId || 'ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [showOverrideModal, setShowOverrideModal] = useState(false);

  // Form Inputs in Workspace
  const [internalNoteText, setInternalNoteText] = useState('');
  const [clarificationText, setClarificationText] = useState('');
  const [selectedStaffAssignee, setSelectedStaffAssignee] = useState('');

  const selectedComplaint = complaints.find((c) => c.id === selectedComplaintId) || complaints[0] || null;

  // Filter complaints list
  const filteredComplaints = complaints.filter((c) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const match =
        c.trackingNumber.toLowerCase().includes(q) ||
        c.title.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q) ||
        c.studentName.toLowerCase().includes(q);
      if (!match) return false;
    }

    if (urgencyFilter !== 'ALL' && c.urgency !== urgencyFilter) return false;
    if (departmentFilter !== 'ALL' && c.assignedDepartmentId !== departmentFilter) return false;
    if (statusFilter !== 'ALL' && c.status !== statusFilter) return false;

    return true;
  });

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedComplaint || !internalNoteText.trim()) return;
    await onAddInternalNote(selectedComplaint.id, internalNoteText.trim());
    setInternalNoteText('');
  };

  const handleRequestClarification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedComplaint || !clarificationText.trim()) return;
    await onRequestClarification(selectedComplaint.id, clarificationText.trim());
    setClarificationText('');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      {/* Staff Header */}
      <div className="bg-[#2C3E50] rounded-[24px] p-6 sm:p-8 text-white shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border border-[#E8E6E1]/20">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-3 py-0.5 rounded-full text-[10px] uppercase font-bold tracking-widest bg-[#8A9A5B]/30 text-[#D7E4C4] border border-[#8A9A5B]/40">
              Department Operations Desk
            </span>
            <span className="text-[11px] uppercase tracking-wider text-[#DED9CE]/80 font-mono">
              Dept: {departments.find((d) => d.id === currentUser.departmentId)?.name || 'Institutional Multi-Department'}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif italic tracking-tight text-[#FDFCF8]">Staff Workspace: {currentUser.name}</h1>
          <p className="text-xs sm:text-sm text-[#DED9CE]/90 mt-2 max-w-2xl leading-relaxed">
            Triage routed tickets, review AI classification signals, verify safety rules, collaborate via internal
            notes, and execute complaint resolutions.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onRefreshComplaints}
            className="px-4 py-2.5 rounded-full bg-[#1E2B37] hover:bg-[#324556] text-xs font-semibold text-[#FDFCF8] flex items-center gap-2 transition border border-[#E8E6E1]/20 shadow-xs"
          >
            <RefreshCw className="w-3.5 h-3.5 text-[#8A9A5B]" /> Refresh Queue
          </button>
        </div>
      </div>

      {/* Main Grid: Queue Table on Left, Interactive Workspace on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Complaint Queue & Filters (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-[24px] border border-[#E8E6E1] shadow-sm overflow-hidden space-y-4 p-5">
          <div className="flex items-center justify-between border-b border-[#E8E6E1] pb-3.5">
            <h2 className="text-sm font-serif font-bold text-[#2C3E50] flex items-center gap-2">
              <Building2 className="w-4 h-4 text-[#8A9A5B]" /> Operational Queue ({filteredComplaints.length})
            </h2>
            <span className="text-[11px] uppercase tracking-wider text-[#7D8B99]">Filtered Tickets</span>
          </div>

          {/* Filters */}
          <div className="space-y-2.5 text-xs">
            <div className="relative">
              <Search className="w-4 h-4 text-[#8A9A5B] absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search ticket, student, keyword..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2 bg-[#FDFCF8] border border-[#DED9CE] rounded-xl text-xs outline-none focus:border-[#8A9A5B] text-[#2C3E50]"
              />
            </div>

            <div className="grid grid-cols-3 gap-2">
              <select
                value={urgencyFilter}
                onChange={(e) => setUrgencyFilter(e.target.value)}
                className="p-2 bg-[#FDFCF8] border border-[#DED9CE] rounded-xl text-[11px] text-[#2C3E50] outline-none"
              >
                <option value="ALL">All Urgencies</option>
                <option value="HIGH">High Urgency</option>
                <option value="MEDIUM">Medium Urgency</option>
                <option value="LOW">Low Urgency</option>
              </select>

              <select
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
                className="p-2 bg-[#FDFCF8] border border-[#DED9CE] rounded-xl text-[11px] text-[#2C3E50] outline-none"
              >
                <option value="ALL">All Depts</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.code}
                  </option>
                ))}
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="p-2 bg-[#FDFCF8] border border-[#DED9CE] rounded-xl text-[11px] text-[#2C3E50] outline-none"
              >
                <option value="ALL">All Statuses</option>
                <option value="REVIEW_REQUIRED">Review Needed</option>
                <option value="ROUTED">Routed</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="RESOLVED">Resolved</option>
                <option value="ESCALATED">Escalated</option>
              </select>
            </div>
          </div>

          {/* Queue List */}
          <div className="divide-y divide-[#E8E6E1]/60 max-h-[640px] overflow-y-auto space-y-1.5 pt-1">
            {filteredComplaints.length === 0 ? (
              <div className="p-8 text-center text-[#7D8B99] text-xs">No complaints found.</div>
            ) : (
              filteredComplaints.map((c) => {
                const isSelected = selectedComplaint?.id === c.id;
                return (
                  <div
                    key={c.id}
                    onClick={() => setSelectedComplaintId(c.id)}
                    className={`p-3.5 rounded-2xl cursor-pointer transition border ${
                      isSelected
                        ? 'bg-[#F4F1EA] border-[#8A9A5B] shadow-2xs'
                        : 'bg-white border-transparent hover:bg-[#FDFCF8]'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="font-mono font-bold text-[#2C3E50] text-[11px]">{c.trackingNumber}</span>
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            c.urgency === 'HIGH'
                              ? 'badge-high'
                              : c.urgency === 'MEDIUM'
                              ? 'badge-medium'
                              : 'badge-low'
                          }`}
                        >
                          {c.urgency}
                        </span>
                        {c.humanVerified ? (
                          <span title="Human Verified" className="text-[#5B7235]">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          </span>
                        ) : (
                          <span title="Requires Review" className="text-[#B46C1A]">
                            <AlertTriangle className="w-3.5 h-3.5" />
                          </span>
                        )}
                      </div>
                    </div>

                    <h4 className="text-xs font-semibold text-[#2C3E50] line-clamp-1">{c.title}</h4>
                    <p className="text-[11px] text-[#6B7C8E] line-clamp-2 mt-0.5 leading-relaxed">{c.description}</p>

                    <div className="flex items-center justify-between text-[10px] text-[#7D8B99] mt-2.5 pt-1.5 border-t border-[#E8E6E1]/60">
                      <span>{c.assignedDepartmentName || 'Unassigned'}</span>
                      <span className="font-bold uppercase tracking-wider text-[#2C3E50]">{c.status}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Interactive Complaint Review Workspace (7 cols) */}
        <div className="lg:col-span-7 space-y-5">
          {selectedComplaint ? (
            <div className="bg-white rounded-[24px] border border-[#E8E6E1] shadow-sm p-6 sm:p-7 space-y-6">
              {/* Header with Tracking ID, Status, and Urgency */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 border-b border-[#E8E6E1] pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-[#F4F1EA] text-[#2C3E50] border border-[#E8E6E1]">
                      {selectedComplaint.trackingNumber}
                    </span>
                    <span
                      className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                        selectedComplaint.urgency === 'HIGH'
                          ? 'badge-high'
                          : selectedComplaint.urgency === 'MEDIUM'
                          ? 'badge-medium'
                          : 'badge-low'
                      }`}
                    >
                      Urgency: {selectedComplaint.urgency}
                    </span>
                    <span className="text-xs font-semibold uppercase px-2.5 py-0.5 rounded-full bg-[#F4F1EA] text-[#2C3E50] border border-[#E8E6E1]">
                      Status: {selectedComplaint.status}
                    </span>
                  </div>
                  <h2 className="text-lg font-serif font-bold text-[#2C3E50] mt-2.5">{selectedComplaint.title}</h2>
                </div>

                {/* Primary Quick Decision Actions */}
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={() => onReviewComplaint(selectedComplaint.id, 'APPROVE')}
                    className="px-4 py-2 bg-[#8A9A5B] hover:bg-[#78884E] text-white rounded-full text-xs font-semibold uppercase tracking-wider shadow-xs flex items-center gap-1.5 transition"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" /> Accept & Verify
                  </button>

                  <button
                    onClick={() => setShowOverrideModal(true)}
                    className="px-4 py-2 bg-[#E2725B] hover:bg-[#D05E48] text-white rounded-full text-xs font-semibold uppercase tracking-wider shadow-xs flex items-center gap-1.5 transition"
                  >
                    <SlidersHorizontal className="w-3.5 h-3.5" /> Override & Feedback
                  </button>
                </div>
              </div>

              {/* AI Semantic Intelligence Card (Section 12 & 14) */}
              <div className="p-5 bg-[#2C3E50] text-white rounded-2xl space-y-3.5 shadow-xs border border-[#E8E6E1]/20">
                <div className="flex items-center justify-between border-b border-[#E8E6E1]/15 pb-2.5">
                  <span className="text-xs font-bold text-[#8A9A5B] uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-[#8A9A5B]" /> AI Semantic Analysis & Risk Profile
                  </span>
                  <span className="text-[11px] text-[#DED9CE]/80 font-mono">
                    Model: {selectedComplaint.aiAnalysis?.modelUsed || 'gemini-3.7-flash'} (
                    {selectedComplaint.aiAnalysis?.processingTimeMs || 380}ms)
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="bg-[#1E2B37] p-3 rounded-xl border border-[#E8E6E1]/10">
                    <div className="text-[#7D8B99] text-[10px] uppercase font-bold tracking-wider">Category & Subcategory</div>
                    <div className="font-semibold text-[#FDFCF8] mt-0.5">
                      {selectedComplaint.aiAnalysis?.category || selectedComplaint.category}
                    </div>
                    <div className="text-[11px] text-[#DED9CE]">
                      {selectedComplaint.aiAnalysis?.subcategory || 'General'}
                    </div>
                  </div>

                  <div className="bg-[#1E2B37] p-3 rounded-xl border border-[#E8E6E1]/10">
                    <div className="text-[#7D8B99] text-[10px] uppercase font-bold tracking-wider">AI Urgency & Confidence</div>
                    <div className="font-semibold text-[#FDFCF8] mt-0.5 flex items-center gap-1.5">
                      <span
                        className={
                          selectedComplaint.aiAnalysis?.urgency === 'HIGH'
                            ? 'text-[#F4BEB3]'
                            : selectedComplaint.aiAnalysis?.urgency === 'MEDIUM'
                            ? 'text-[#F2DEC0]'
                            : 'text-[#D7E4C4]'
                        }
                      >
                        {selectedComplaint.aiAnalysis?.urgency || selectedComplaint.urgency}
                      </span>
                      <span className="text-[11px] text-[#DED9CE]/80 font-mono">
                        ({Math.round((selectedComplaint.aiAnalysis?.urgencyConfidence || 0.85) * 100)}%)
                      </span>
                    </div>
                    <div className="text-[10px] text-[#DED9CE]/80 truncate mt-0.5">
                      {selectedComplaint.aiAnalysis?.urgencyReason || 'Standard severity heuristics.'}
                    </div>
                  </div>

                  <div className="bg-[#1E2B37] p-3 rounded-xl border border-[#E8E6E1]/10">
                    <div className="text-[#7D8B99] text-[10px] uppercase font-bold tracking-wider">Suggested Dept & Score</div>
                    <div className="font-semibold text-[#FDFCF8] mt-0.5">
                      {selectedComplaint.aiAnalysis?.suggestedDepartment || selectedComplaint.assignedDepartmentName}
                    </div>
                    <div className="text-[10px] text-[#8A9A5B]">
                      Alt: {selectedComplaint.aiAnalysis?.alternativeDepartment || 'General Admin'}
                    </div>
                  </div>
                </div>

                {/* Risk Flags & Entities */}
                {selectedComplaint.aiAnalysis?.riskFlags && selectedComplaint.aiAnalysis.riskFlags.length > 0 && (
                  <div className="bg-[#E2725B]/20 border border-[#E2725B]/40 p-3 rounded-xl text-xs flex items-start gap-2.5">
                    <ShieldAlert className="w-4 h-4 text-[#F4BEB3] flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-[#FDF0ED]">Safety & Risk Flags Detected:</span>
                      <ul className="list-disc list-inside text-[#F4BEB3] text-[11px] mt-0.5 space-y-0.5">
                        {selectedComplaint.aiAnalysis.riskFlags.map((rf, i) => (
                          <li key={i}>{rf}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>

              {/* Original Submission Text & Student Info */}
              <div className="space-y-2.5 text-xs">
                <h4 className="font-serif font-bold text-[#2C3E50] uppercase tracking-wider flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-[#8A9A5B]" /> Student Complaint Submission
                </h4>
                <div className="p-5 bg-[#F4F1EA] rounded-2xl border border-[#E8E6E1] space-y-3">
                  <p className="text-[#2C3E50] leading-relaxed text-sm whitespace-pre-wrap">
                    {selectedComplaint.description}
                  </p>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-3 border-t border-[#E8E6E1] text-[11px] text-[#6B7C8E]">
                    <div>
                      <strong>Student:</strong> {selectedComplaint.studentName}
                    </div>
                    <div>
                      <strong>Program:</strong> {selectedComplaint.studentProgram || 'Undergraduate'}
                    </div>
                    <div>
                      <strong>Location:</strong> {selectedComplaint.campusLocation || 'Campus'}
                    </div>
                    <div>
                      <strong>Date:</strong> {new Date(selectedComplaint.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </div>

              {/* Status Update & Staff Workflow Controls */}
              <div className="p-5 bg-[#F4F1EA] rounded-2xl border border-[#E8E6E1] space-y-3.5 text-xs">
                <h4 className="font-serif font-bold text-[#2C3E50] uppercase tracking-wider">Workflow Transitions & Actions</h4>
                <div className="flex flex-wrap gap-2.5">
                  <button
                    onClick={() => onUpdateStatus(selectedComplaint.id, 'IN_PROGRESS', 'Investigation commenced.')}
                    className="px-4 py-2 bg-[#8A9A5B] hover:bg-[#78884E] text-white rounded-full font-semibold uppercase tracking-wider transition"
                  >
                    Set In Progress
                  </button>
                  <button
                    onClick={() => onUpdateStatus(selectedComplaint.id, 'RESOLVED', 'Resolved by department staff.')}
                    className="px-4 py-2 bg-[#5B7235] hover:bg-[#4C5F2C] text-white rounded-full font-semibold uppercase tracking-wider transition"
                  >
                    Mark Resolved
                  </button>
                  <button
                    onClick={() => onUpdateStatus(selectedComplaint.id, 'CLOSED', 'Ticket concluded.')}
                    className="px-4 py-2 bg-[#2C3E50] hover:bg-[#1E2B37] text-white rounded-full font-semibold uppercase tracking-wider transition"
                  >
                    Close Ticket
                  </button>
                  <button
                    onClick={() => onReviewComplaint(selectedComplaint.id, 'ESCALATE')}
                    className="px-4 py-2 bg-[#E2725B] hover:bg-[#D05E48] text-white rounded-full font-semibold uppercase tracking-wider transition"
                  >
                    Escalate to Dean / Warden
                  </button>
                </div>
              </div>

              {/* Clarification Request to Student (Section 15) */}
              <div className="p-5 bg-[#FDFCF8] rounded-2xl border border-[#DED9CE] space-y-3 text-xs">
                <h4 className="font-serif font-bold text-[#2C3E50] uppercase tracking-wider flex items-center gap-1.5">
                  <MessageSquare className="w-4 h-4 text-[#8A9A5B]" /> Request Clarification from Student
                </h4>
                <form onSubmit={handleRequestClarification} className="flex gap-2.5">
                  <input
                    type="text"
                    placeholder="e.g. Please specify the room number and if any equipment was damaged..."
                    value={clarificationText}
                    onChange={(e) => setClarificationText(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white border border-[#DED9CE] rounded-xl text-xs text-[#2C3E50] outline-none focus:border-[#8A9A5B]"
                  />
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-[#8A9A5B] hover:bg-[#78884E] text-white font-semibold uppercase tracking-wider rounded-full transition flex items-center gap-1.5 flex-shrink-0"
                  >
                    <Send className="w-3.5 h-3.5" /> Send Request
                  </button>
                </form>
              </div>

              {/* Internal Staff Notes (Section 16 - strictly private from student) */}
              <div className="space-y-3 text-xs">
                <h4 className="font-serif font-bold text-[#2C3E50] uppercase tracking-wider flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-[#8A9A5B]" /> Confidential Internal Staff Notes
                </h4>
                <form onSubmit={handleAddNote} className="flex gap-2.5">
                  <input
                    type="text"
                    placeholder="Add internal investigation note (visible only to staff & admins)..."
                    value={internalNoteText}
                    onChange={(e) => setInternalNoteText(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#FDFCF8] border border-[#DED9CE] rounded-xl text-xs text-[#2C3E50] outline-none focus:border-[#8A9A5B]"
                  />
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-[#2C3E50] hover:bg-[#1E2B37] text-white font-semibold uppercase tracking-wider rounded-full transition flex-shrink-0"
                  >
                    Add Note
                  </button>
                </form>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-[24px] border border-[#E8E6E1] p-12 text-center text-[#7D8B99]">
              Select a complaint from the queue to view AI signals and take action.
            </div>
          )}
        </div>
      </div>

      {/* Override & Feedback Modal */}
      {showOverrideModal && selectedComplaint && (
        <FeedbackModal
          complaint={selectedComplaint}
          departments={departments}
          currentUser={currentUser}
          onClose={() => setShowOverrideModal(false)}
          onSubmitOverride={async (payload) => {
            await onReviewComplaint(selectedComplaint.id, payload.action, payload);
          }}
        />
      )}
    </div>
  );
};
