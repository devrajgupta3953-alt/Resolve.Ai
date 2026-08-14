import React, { useState } from 'react';
import {
  Send,
  Search,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText,
  HelpCircle,
  Sparkles,
  Paperclip,
  MapPin,
  Calendar,
  Layers,
  Star,
  ChevronRight,
  MessageSquare,
  ShieldCheck,
  Building,
  RefreshCw,
} from 'lucide-react';
import { Complaint, Department, User } from '../types';

interface StudentPortalProps {
  currentUser: User;
  departments: Department[];
  studentComplaints: Complaint[];
  onSubmitComplaint: (formData: any) => Promise<Complaint | null>;
  onRefreshComplaints: () => void;
  onSubmitStudentFeedback: (complaintId: string, rating: number, comment: string, markedAsResolved: boolean) => Promise<void>;
  onAnswerClarification: (complaintId: string, clarificationId: string, responseText: string) => Promise<void>;
  onSelectComplaint: (complaint: Complaint) => void;
}

export const StudentPortal: React.FC<StudentPortalProps> = ({
  currentUser,
  departments,
  studentComplaints,
  onSubmitComplaint,
  onRefreshComplaints,
  onSubmitStudentFeedback,
  onAnswerClarification,
  onSelectComplaint,
}) => {
  const [activeTab, setActiveTab] = useState<'submit' | 'track' | 'faq'>('submit');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionSuccess, setSubmissionSuccess] = useState<Complaint | null>(null);
  const [searchTrackingId, setSearchTrackingId] = useState('');
  const [selectedTrackComplaint, setSelectedTrackComplaint] = useState<Complaint | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [campusLocation, setCampusLocation] = useState('');
  const [courseOrProgram, setCourseOrProgram] = useState(currentUser.program || 'B.Tech Computer Science (3rd Year)');
  const [academicYearOrSemester, setAcademicYearOrSemester] = useState('Semester 6');
  const [incidentDate, setIncidentDate] = useState('');
  const [isOngoing, setIsOngoing] = useState(true);
  const [studentCategory, setStudentCategory] = useState('');
  const [studentDepartment, setStudentDepartment] = useState('');
  const [attachments, setAttachments] = useState<{ id: string; name: string; size: number; type: string }[]>([]);

  // Feedback State
  const [feedbackRating, setFeedbackRating] = useState(5);
  const [feedbackComment, setFeedbackComment] = useState('');
  const [clarificationReplies, setClarificationReplies] = useState<Record<string, string>>({});

  // Quick Demo Templates to prefill
  const quickTemplates = [
    {
      label: '⚡ Electrical Safety Hazard',
      title: 'Exposed live electrical wiring in Hostel B 2nd floor hallway',
      desc: 'There is an open switchboard box with exposed sparking wires dangling at shoulder height near Room 214. Someone could accidentally brush against it and get severe electric shock.',
      location: 'North Campus - Hostel Block B',
      category: 'FACILITIES',
    },
    {
      label: '💳 Duplicate Fee Deduction',
      title: 'Examination fee debited twice from my bank account',
      desc: 'I attempted to pay my semester examination fee of ₹4,500 on August 10th. The payment gateway showed failure on first attempt but deducted money, and second attempt also deducted ₹4,500. Total ₹9,000 debited with UTR 9821481023.',
      location: 'Main Campus Admin Block',
      category: 'FINANCE',
    },
    {
      label: '📶 Hostel Wi-Fi Down',
      title: 'Wi-Fi in Hostel Block C 3rd floor not working for 4 days',
      desc: 'Wi-Fi SSID Univ-Student-5G on Hostel C 3rd floor connects but has zero internet throughput. Lab submissions are due this Friday and students have to use mobile data.',
      location: 'South Campus - Hostel Block C',
      category: 'IT',
    },
    {
      label: '📚 Library Hours Suggestion',
      title: 'Suggestion for Central Library weekend operating hours extension during mid-terms',
      desc: 'Requesting extended library open hours on Saturdays and Sundays till 11:00 PM during upcoming mid-term examination weeks to support quiet study.',
      location: 'Central Library',
      category: 'LIBRARY',
    },
    {
      label: '🇮🇳 Hindi / Hinglish Demo',
      title: 'Kamre ki khidki ka kanch toota hua hai aur barish ka pani andar aa raha hai',
      desc: 'Kripya dhyan dein, mere hostel room number 308 ki khidki ka kanch kal sham tej hawa se toot gaya hai. Barish ka pani andar aa raha hai.',
      location: 'Hostel Block B Room 308',
      category: 'HOSTEL',
    },
  ];

  const handleApplyTemplate = (tmpl: typeof quickTemplates[0]) => {
    setTitle(tmpl.title);
    setDescription(tmpl.desc);
    setCampusLocation(tmpl.location);
    setStudentCategory(tmpl.category);
  };

  const handleSimulateAttachment = () => {
    const dummyFiles = [
      { id: `att-${Date.now()}-1`, name: 'incident_photo_1.jpg', size: 1420000, type: 'image/jpeg' },
      { id: `att-${Date.now()}-2`, name: 'fee_receipt_bank_statement.pdf', size: 340000, type: 'application/pdf' },
    ];
    const picked = dummyFiles[Math.floor(Math.random() * dummyFiles.length)];
    setAttachments((prev) => [...prev, picked]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;

    setIsSubmitting(true);
    try {
      const created = await onSubmitComplaint({
        title,
        description,
        campusLocation,
        courseOrProgram,
        academicYearOrSemester,
        incidentDate,
        isOngoing,
        studentCategory,
        studentDepartment,
        attachments,
      });

      if (created) {
        setSubmissionSuccess(created);
        // Reset form
        setTitle('');
        setDescription('');
        setAttachments([]);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const searchedComplaints = searchTrackingId.trim()
    ? studentComplaints.filter(
        (c) =>
          c.trackingNumber.toLowerCase().includes(searchTrackingId.toLowerCase()) ||
          c.title.toLowerCase().includes(searchTrackingId.toLowerCase())
      )
    : studentComplaints;

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
      {/* Student Welcome & Role Card */}
      <div className="bg-[#2C3E50] rounded-[24px] p-6 sm:p-8 text-white shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border border-[#E8E6E1]/20">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-3 py-0.5 rounded-full text-[10px] uppercase font-bold tracking-widest bg-[#8A9A5B]/30 text-[#D7E4C4] border border-[#8A9A5B]/40">
              Student Grievance Sanctuary
            </span>
            <span className="text-[11px] uppercase tracking-wider text-[#DED9CE]/80 font-mono">
              ID: {currentUser.studentIdNumber || 'STU-2024-8841'}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif italic tracking-tight text-[#FDFCF8]">
            Welcome, {currentUser.name}
          </h1>
          <p className="text-xs sm:text-sm text-[#DED9CE]/90 mt-2 max-w-2xl leading-relaxed">
            Submit campus issues, safety concerns, or administrative requests. Our AI-assisted routing engine
            evaluates urgency with deterministic safety shields and directs your ticket to the responsible department for swift human action.
          </p>
        </div>

        <div className="flex items-center gap-1.5 bg-[#1E2B37] p-1.5 rounded-full border border-[#E8E6E1]/15">
          <button
            id="tab-submit-btn"
            onClick={() => {
              setActiveTab('submit');
              setSubmissionSuccess(null);
            }}
            className={`px-4 py-2 rounded-full text-xs font-semibold tracking-wide transition-all ${
              activeTab === 'submit' ? 'bg-[#8A9A5B] text-white shadow-sm' : 'text-[#DED9CE] hover:text-white'
            }`}
          >
            Submit Complaint
          </button>
          <button
            id="tab-track-btn"
            onClick={() => setActiveTab('track')}
            className={`px-4 py-2 rounded-full text-xs font-semibold tracking-wide transition-all flex items-center gap-1.5 ${
              activeTab === 'track' ? 'bg-[#8A9A5B] text-white shadow-sm' : 'text-[#DED9CE] hover:text-white'
            }`}
          >
            Track Status ({studentComplaints.length})
          </button>
          <button
            id="tab-faq-btn"
            onClick={() => setActiveTab('faq')}
            className={`px-4 py-2 rounded-full text-xs font-semibold tracking-wide transition-all ${
              activeTab === 'faq' ? 'bg-[#8A9A5B] text-white shadow-sm' : 'text-[#DED9CE] hover:text-white'
            }`}
          >
            Help & FAQ
          </button>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 1. SUBMIT COMPLAINT FORM */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'submit' && (
        <div className="space-y-6">
          {submissionSuccess ? (
            <div className="bg-white rounded-[24px] border border-[#E8E6E1] p-8 sm:p-10 shadow-sm text-center space-y-4 animate-in fade-in">
              <div className="w-16 h-16 rounded-full bg-[#F1F5EB] text-[#5B7235] flex items-center justify-center mx-auto border border-[#D7E4C4]">
                <CheckCircle2 className="w-9 h-9" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#5B7235] bg-[#F1F5EB] px-3.5 py-1 rounded-full border border-[#D7E4C4]">
                  Complaint Ingested & Calibrated
                </span>
                <h2 className="text-2xl sm:text-3xl font-serif text-[#2C3E50] mt-3">
                  Tracking ID: {submissionSuccess.trackingNumber}
                </h2>
                <p className="text-xs sm:text-sm text-[#6B7C8E] max-w-xl mx-auto mt-1.5 leading-relaxed">
                  Your complaint was analyzed by our server-side intelligence engine and routed to{' '}
                  <strong className="text-[#2C3E50] font-semibold">{submissionSuccess.assignedDepartmentName}</strong>.
                </p>
              </div>

              {/* Status summary card */}
              <div className="max-w-md mx-auto bg-[#F4F1EA] border border-[#E8E6E1] rounded-2xl p-5 text-left text-xs space-y-2.5">
                <div className="flex justify-between py-1 border-b border-[#E8E6E1]">
                  <span className="text-[#6B7C8E]">Urgency Assessment:</span>
                  <span className="font-semibold text-[#2C3E50]">{submissionSuccess.urgency}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#E8E6E1]">
                  <span className="text-[#6B7C8E]">Department Routing:</span>
                  <span className="font-semibold text-[#2C3E50]">{submissionSuccess.assignedDepartmentName}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-[#6B7C8E]">Current Queue State:</span>
                  <span className="font-semibold text-[#8A9A5B]">
                    {submissionSuccess.status === 'REVIEW_REQUIRED'
                      ? 'Priority Human Review'
                      : 'Department Operational Queue'}
                  </span>
                </div>
              </div>

              <div className="flex justify-center gap-3 pt-3">
                <button
                  onClick={() => {
                    setSelectedTrackComplaint(submissionSuccess);
                    setActiveTab('track');
                  }}
                  className="px-5 py-2.5 bg-[#8A9A5B] hover:bg-[#77864E] text-white rounded-full text-xs font-semibold tracking-wider uppercase transition shadow-sm"
                >
                  Track Live Timeline
                </button>
                <button
                  onClick={() => setSubmissionSuccess(null)}
                  className="px-5 py-2.5 bg-[#F4F1EA] hover:bg-[#EAE5DA] text-[#2C3E50] border border-[#E8E6E1] rounded-full text-xs font-semibold tracking-wider uppercase transition"
                >
                  Submit Another Complaint
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column: Input Form */}
              <div className="lg:col-span-2 bg-white rounded-[24px] border border-[#E8E6E1] p-6 sm:p-8 shadow-sm space-y-6">
                <div>
                  <h2 className="text-xl font-serif font-bold text-[#2C3E50] flex items-center gap-2">
                    <FileText className="w-5 h-5 text-[#8A9A5B]" />
                    Student Complaint Submission Form
                  </h2>
                  <p className="text-xs text-[#6B7C8E] mt-1 leading-relaxed">
                    Describe your grievance in natural language (English, Hindi, or Hinglish). The AI will extract facts
                    and determine the responsible team.
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                  {/* Complaint Title */}
                  <div>
                    <label htmlFor="complaint-title" className="block text-xs font-semibold text-[#2C3E50] mb-1.5">
                      Complaint Title <span className="text-[#E2725B]">*</span>
                    </label>
                    <input
                      id="complaint-title"
                      type="text"
                      required
                      placeholder="e.g., Exposed live electrical wiring in Hostel B hallway"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="w-full px-4 py-2.5 text-sm rounded-xl bg-[#FDFCF8] border border-[#DED9CE] focus:outline-none focus:ring-2 focus:ring-[#8A9A5B]/30 focus:border-[#8A9A5B] text-[#2C3E50]"
                    />
                  </div>

                  {/* Complaint Description */}
                  <div>
                    <label htmlFor="complaint-desc" className="block text-xs font-semibold text-[#2C3E50] mb-1.5">
                      Detailed Description <span className="text-[#E2725B]">*</span>
                    </label>
                    <textarea
                      id="complaint-desc"
                      required
                      rows={5}
                      placeholder="Describe what happened, exact location, who was affected, dates, and what resolution you are requesting..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="w-full px-4 py-2.5 text-sm rounded-xl bg-[#FDFCF8] border border-[#DED9CE] focus:outline-none focus:ring-2 focus:ring-[#8A9A5B]/30 focus:border-[#8A9A5B] text-[#2C3E50] leading-relaxed"
                    />
                  </div>

                  {/* Optional Structured Context Accordion / Grid */}
                  <div className="p-5 bg-[#F4F1EA] rounded-2xl border border-[#E8E6E1] space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#2C3E50] uppercase tracking-wider flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5 text-[#8A9A5B]" /> Optional Structured Context (Assists AI)
                      </span>
                      <span className="text-[11px] text-[#7D8B99]">Not strictly required</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div>
                        <label htmlFor="campus-location" className="block text-[#6B7C8E] mb-1 flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-[#8A9A5B]" /> Campus / Location
                        </label>
                        <input
                          id="campus-location"
                          type="text"
                          placeholder="e.g. Hostel Block B, Room 214"
                          value={campusLocation}
                          onChange={(e) => setCampusLocation(e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-[#DED9CE] rounded-xl text-xs text-[#2C3E50] focus:border-[#8A9A5B] outline-none"
                        />
                      </div>

                      <div>
                        <label htmlFor="incident-date" className="block text-[#6B7C8E] mb-1 flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-[#8A9A5B]" /> Date of Incident
                        </label>
                        <input
                          id="incident-date"
                          type="date"
                          value={incidentDate}
                          onChange={(e) => setIncidentDate(e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-[#DED9CE] rounded-xl text-xs text-[#2C3E50] focus:border-[#8A9A5B] outline-none"
                        />
                      </div>

                      <div>
                        <label htmlFor="student-dept-hint" className="block text-[#6B7C8E] mb-1 flex items-center gap-1">
                          <Building className="w-3 h-3 text-[#8A9A5B]" /> Suggested Department (if known)
                        </label>
                        <select
                          id="student-dept-hint"
                          value={studentDepartment}
                          onChange={(e) => setStudentDepartment(e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-[#DED9CE] rounded-xl text-xs text-[#2C3E50] focus:border-[#8A9A5B] outline-none cursor-pointer"
                        >
                          <option value="">Let AI automatically identify department</option>
                          {departments.map((d) => (
                            <option key={d.id} value={d.name}>
                              {d.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="flex items-center space-x-2 pt-4">
                        <input
                          type="checkbox"
                          id="is-ongoing"
                          checked={isOngoing}
                          onChange={(e) => setIsOngoing(e.target.checked)}
                          className="rounded accent-[#8A9A5B] h-4 w-4"
                        />
                        <label htmlFor="is-ongoing" className="text-xs text-[#2C3E50] font-medium">
                          Issue is currently active / ongoing
                        </label>
                      </div>
                    </div>

                    {/* Attachments Simulator */}
                    <div className="pt-2 border-t border-[#E8E6E1] flex items-center justify-between">
                      <button
                        type="button"
                        onClick={handleSimulateAttachment}
                        className="inline-flex items-center gap-1 text-xs text-[#8A9A5B] hover:text-[#74844D] font-semibold"
                      >
                        <Paperclip className="w-3.5 h-3.5" /> Attach Photo / Receipt (Simulate Upload)
                      </button>
                      <span className="text-[11px] text-[#7D8B99]">PDF, JPG, PNG (Max 5MB)</span>
                    </div>

                    {attachments.length > 0 && (
                      <div className="flex flex-wrap gap-2 pt-1">
                        {attachments.map((att, i) => (
                          <span
                            key={i}
                            className="inline-flex items-center gap-1 bg-white border border-[#DED9CE] text-[#2C3E50] text-[11px] px-2.5 py-1 rounded-full shadow-2xs"
                          >
                            <Paperclip className="w-3 h-3 text-[#8A9A5B]" /> {att.name}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Submission Action */}
                  <div className="flex items-center justify-between pt-2">
                    <div className="text-xs text-[#6B7C8E] flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-[#8A9A5B]" />
                      Encrypted & confidential submission
                    </div>

                    <button
                      id="btn-submit-complaint"
                      type="submit"
                      disabled={isSubmitting || !title.trim() || !description.trim()}
                      className="px-7 py-3 rounded-full bg-[#8A9A5B] hover:bg-[#78884E] text-white text-xs font-bold tracking-widest uppercase transition flex items-center gap-2 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          Processing with AI Engine...
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          Submit Complaint
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>

              {/* Right Column: Pre-configured Test Templates & Decision Pipeline Preview */}
              <div className="space-y-5">
                <div className="bg-white rounded-[24px] border border-[#E8E6E1] p-6 shadow-sm space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#6B7C8E]">Quick Templates</span>
                    <span className="text-[#8A9A5B] font-bold text-xs tracking-wider uppercase">Instant Load</span>
                  </div>
                  <h3 className="text-lg font-serif font-bold text-[#2C3E50] flex items-center gap-1.5">
                    Sample Scenarios
                  </h3>
                  <p className="text-xs text-[#6B7C8E] leading-relaxed">
                    Click any sample scenario to populate the form and test how the AI classifies urgency and department routing:
                  </p>

                  <div className="space-y-2.5">
                    {quickTemplates.map((t, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => handleApplyTemplate(t)}
                        className="w-full text-left p-3.5 rounded-2xl bg-[#FDFCF8] hover:bg-[#F4F1EA] border border-[#E8E6E1] hover:border-[#8A9A5B] text-xs font-medium text-[#2C3E50] transition block group"
                      >
                        <div className="font-semibold text-[#2C3E50] group-hover:text-[#8A9A5B] transition-colors">{t.label}</div>
                        <div className="text-[#7D8B99] truncate text-[11px] mt-0.5">{t.title}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="bg-[#2C3E50] text-white rounded-[24px] p-6 shadow-sm space-y-3.5 text-xs border border-[#E8E6E1]/20">
                  <h4 className="font-serif italic text-base text-[#FDFCF8] flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-[#8A9A5B]" /> Hybrid Safety Principles
                  </h4>
                  <ul className="space-y-2.5 text-[#DED9CE] leading-relaxed">
                    <li className="flex items-start gap-2">
                      <span className="text-[#E2725B] font-bold text-sm leading-none">•</span>
                      <span>
                        <strong className="text-[#FDFCF8]">Safety Shield:</strong> High-risk keywords (exposed wiring, fire, harassment) trigger deterministic rules to enforce HIGH urgency.
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-[#8A9A5B] font-bold text-sm leading-none">•</span>
                      <span>
                        <strong className="text-[#FDFCF8]">Human in the loop:</strong> Uncertain or high-risk complaints enter a priority review queue for human sign-off.
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-[#DED9CE] font-bold text-sm leading-none">•</span>
                      <span>
                        <strong className="text-[#FDFCF8]">Feedback loop:</strong> Staff corrections are logged for continual institutional evaluation.
                      </span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 2. TRACK COMPLAINT STATUS */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'track' && (
        <div className="space-y-6">
          {/* Search bar */}
          <div className="bg-white rounded-2xl border border-[#E8E6E1] p-4 shadow-sm flex items-center gap-3">
            <Search className="w-5 h-5 text-[#8A9A5B] flex-shrink-0" />
            <input
              type="text"
              placeholder="Search by Tracking Number (e.g. CMP-2026-1001) or title keyword..."
              value={searchTrackingId}
              onChange={(e) => setSearchTrackingId(e.target.value)}
              className="w-full text-sm outline-none text-[#2C3E50] placeholder:text-[#8C9BA5] bg-transparent"
            />
            {searchTrackingId && (
              <button onClick={() => setSearchTrackingId('')} className="text-xs text-[#7D8B99] hover:text-[#2C3E50]">
                Clear
              </button>
            )}
            <button
              onClick={onRefreshComplaints}
              className="p-2 text-[#6B7C8E] hover:text-[#2C3E50] hover:bg-[#F4F1EA] rounded-full transition"
              title="Refresh list"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          {/* Detailed View Modal or Card if selected */}
          {selectedTrackComplaint && (
            <div className="bg-white rounded-[24px] border border-[#8A9A5B]/40 p-6 sm:p-8 shadow-md space-y-6 animate-in fade-in">
              <div className="flex items-start justify-between border-b border-[#E8E6E1] pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-[#F4F1EA] text-[#2C3E50] border border-[#E8E6E1]">
                      {selectedTrackComplaint.trackingNumber}
                    </span>
                    <span
                      className={`text-xs font-semibold px-3 py-0.5 rounded-full ${
                        selectedTrackComplaint.urgency === 'HIGH'
                          ? 'badge-high'
                          : selectedTrackComplaint.urgency === 'MEDIUM'
                          ? 'badge-medium'
                          : 'badge-low'
                      }`}
                    >
                      Urgency: {selectedTrackComplaint.urgency}
                    </span>
                    <span className="text-xs text-[#7D8B99]">
                      Submitted on {new Date(selectedTrackComplaint.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <h3 className="text-xl font-serif font-bold text-[#2C3E50] mt-3">{selectedTrackComplaint.title}</h3>
                </div>

                <button
                  onClick={() => setSelectedTrackComplaint(null)}
                  className="text-xs font-medium px-4 py-1.5 rounded-full bg-[#F4F1EA] text-[#2C3E50] hover:bg-[#EAE5DA] border border-[#E8E6E1]"
                >
                  Close Detail
                </button>
              </div>

              {/* Progress Stepper */}
              <div className="py-2">
                <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#6B7C8E] mb-3">Workflow Lifecycle</h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2.5 text-xs text-center">
                  {[
                    { label: 'Submitted', active: true, done: true },
                    { label: 'AI Analysed', active: true, done: true },
                    {
                      label: selectedTrackComplaint.status === 'REVIEW_REQUIRED' ? 'Human Review' : 'Routed',
                      active: true,
                      done: ['ROUTED', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'].includes(
                        selectedTrackComplaint.status
                      ),
                    },
                    {
                      label: 'Assigned',
                      active: ['ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'].includes(
                        selectedTrackComplaint.status
                      ),
                      done: ['IN_PROGRESS', 'RESOLVED', 'CLOSED'].includes(selectedTrackComplaint.status),
                    },
                    {
                      label: 'In Progress',
                      active: ['IN_PROGRESS', 'RESOLVED', 'CLOSED'].includes(selectedTrackComplaint.status),
                      done: ['RESOLVED', 'CLOSED'].includes(selectedTrackComplaint.status),
                    },
                    {
                      label: 'Resolved',
                      active: ['RESOLVED', 'CLOSED'].includes(selectedTrackComplaint.status),
                      done: ['RESOLVED', 'CLOSED'].includes(selectedTrackComplaint.status),
                    },
                  ].map((step, idx) => (
                    <div
                      key={idx}
                      className={`p-3 rounded-2xl border ${
                        step.done
                          ? 'bg-[#F1F5EB] border-[#D7E4C4] text-[#5B7235] font-semibold'
                          : step.active
                          ? 'bg-[#FBF5EB] border-[#F2DEC0] text-[#B46C1A] font-semibold'
                          : 'bg-[#FDFCF8] border-[#E8E6E1] text-[#8C9BA5]'
                      }`}
                    >
                      <div className="text-[10px] uppercase font-bold tracking-wider opacity-60">Step {idx + 1}</div>
                      <div className="mt-0.5">{step.label}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Complaint Text & Assignment Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="p-5 bg-[#F4F1EA] rounded-2xl border border-[#E8E6E1] space-y-2">
                  <span className="font-bold text-[#2C3E50] uppercase tracking-wider text-[10px]">Original Submission:</span>
                  <p className="text-[#2C3E50] leading-relaxed">{selectedTrackComplaint.description}</p>
                  {selectedTrackComplaint.campusLocation && (
                    <div className="text-[#6B7C8E] pt-2 border-t border-[#E8E6E1]/60">
                      <strong>Location:</strong> {selectedTrackComplaint.campusLocation}
                    </div>
                  )}
                </div>

                <div className="p-5 bg-[#F4F1EA] rounded-2xl border border-[#E8E6E1] space-y-2.5">
                  <span className="font-bold text-[#2C3E50] uppercase tracking-wider text-[10px]">Institutional Assignment:</span>
                  <div>
                    <span className="text-[#6B7C8E]">Handling Department:</span>{' '}
                    <strong className="text-[#2C3E50]">{selectedTrackComplaint.assignedDepartmentName || 'General Administration'}</strong>
                  </div>
                  <div>
                    <span className="text-[#6B7C8E]">Current Status:</span>{' '}
                    <span className="font-bold text-[#8A9A5B] uppercase">{selectedTrackComplaint.status}</span>
                  </div>
                  {selectedTrackComplaint.humanVerified && (
                    <div className="text-[#5B7235] font-medium flex items-center gap-1 pt-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Verified by Institutional Staff Member
                    </div>
                  )}
                </div>
              </div>

              {/* Student Satisfaction Feedback Section if Resolved */}
              {['RESOLVED', 'CLOSED'].includes(selectedTrackComplaint.status) && (
                <div className="p-5 bg-[#F1F5EB] rounded-2xl border border-[#D7E4C4] space-y-3.5">
                  <h4 className="text-xs font-bold text-[#5B7235] uppercase tracking-wider flex items-center gap-1.5">
                    <Star className="w-4 h-4 text-[#D99B43] fill-[#D99B43]" /> Student Satisfaction & Resolution Confirmation
                  </h4>
                  {selectedTrackComplaint.studentFeedback ? (
                    <div className="text-xs text-[#2C3E50] space-y-1.5">
                      <div className="flex items-center gap-1">
                        <strong>Your Rating:</strong>
                        <div className="flex text-[#D99B43]">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star
                              key={s}
                              className={`w-3.5 h-3.5 ${
                                s <= selectedTrackComplaint.studentFeedback!.satisfactionScore ? 'fill-[#D99B43]' : 'text-[#DED9CE]'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                      <p className="italic">"{selectedTrackComplaint.studentFeedback.comment || 'No comment provided.'}"</p>
                      <span className="text-[11px] text-[#7D8B99]">
                        Submitted on {new Date(selectedTrackComplaint.studentFeedback.submittedAt).toLocaleDateString()}
                      </span>
                    </div>
                  ) : (
                    <div className="space-y-3.5 text-xs">
                      <p className="text-[#2C3E50]">
                        This complaint was marked as resolved by staff. Please confirm if you are satisfied with the outcome:
                      </p>
                      <div className="flex items-center gap-3">
                        <span className="font-medium text-[#2C3E50]">Rate service:</span>
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              type="button"
                              onClick={() => setFeedbackRating(star)}
                              className={`p-1 ${star <= feedbackRating ? 'text-[#D99B43]' : 'text-[#DED9CE]'}`}
                            >
                              <Star className="w-5 h-5 fill-current" />
                            </button>
                          ))}
                        </div>
                      </div>

                      <input
                        type="text"
                        placeholder="Optional feedback or comments on resolution..."
                        value={feedbackComment}
                        onChange={(e) => setFeedbackComment(e.target.value)}
                        className="w-full px-3.5 py-2 text-xs bg-white border border-[#DED9CE] rounded-xl text-[#2C3E50]"
                      />

                      <div className="flex gap-2">
                        <button
                          onClick={() =>
                            onSubmitStudentFeedback(selectedTrackComplaint.id, feedbackRating, feedbackComment, true)
                          }
                          className="px-5 py-2 bg-[#8A9A5B] hover:bg-[#77864E] text-white rounded-full text-xs font-semibold uppercase tracking-wider transition"
                        >
                          Confirm & Close Ticket
                        </button>
                        <button
                          onClick={() =>
                            onSubmitStudentFeedback(selectedTrackComplaint.id, feedbackRating, feedbackComment, false)
                          }
                          className="px-5 py-2 bg-[#F4F1EA] text-[#2C3E50] border border-[#E8E6E1] hover:bg-[#EAE5DA] rounded-full text-xs font-medium uppercase tracking-wider transition"
                        >
                          Mark as Still Unresolved
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Student Complaints List */}
          <div className="bg-white rounded-[24px] border border-[#E8E6E1] shadow-sm overflow-hidden">
            <div className="p-5 border-b border-[#E8E6E1] flex items-center justify-between bg-[#F4F1EA]/50">
              <h3 className="text-sm font-serif font-bold text-[#2C3E50]">
                Your Submitted Complaints ({searchedComplaints.length})
              </h3>
              <span className="text-[11px] uppercase tracking-wider text-[#7D8B99]">Click any complaint to view full tracking details</span>
            </div>

            {searchedComplaints.length === 0 ? (
              <div className="p-8 text-center text-[#7D8B99] text-xs">
                No complaints found matching your query.
              </div>
            ) : (
              <div className="divide-y divide-[#E8E6E1]/60">
                {searchedComplaints.map((c) => (
                  <div
                    key={c.id}
                    onClick={() => setSelectedTrackComplaint(c)}
                    className="p-5 hover:bg-[#F4F1EA]/40 cursor-pointer transition flex items-center justify-between gap-4"
                  >
                    <div className="space-y-1.5 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-[#2C3E50] bg-[#F4F1EA] px-2.5 py-0.5 rounded-full border border-[#E8E6E1]">
                          {c.trackingNumber}
                        </span>
                        <span
                          className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${
                            c.urgency === 'HIGH'
                              ? 'badge-high'
                              : c.urgency === 'MEDIUM'
                              ? 'badge-medium'
                              : 'badge-low'
                          }`}
                        >
                          {c.urgency}
                        </span>
                        <span className="text-xs text-[#7D8B99]">
                          {new Date(c.createdAt).toLocaleDateString()}
                        </span>
                      </div>

                      <h4 className="text-sm font-semibold text-[#2C3E50] truncate">{c.title}</h4>
                      <p className="text-xs text-[#6B7C8E] truncate max-w-2xl">{c.description}</p>
                    </div>

                    <div className="flex items-center gap-3 flex-shrink-0">
                      <div className="text-right hidden sm:block">
                        <div className="text-xs font-semibold text-[#2C3E50]">{c.assignedDepartmentName}</div>
                        <span
                          className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                            c.status === 'RESOLVED' || c.status === 'CLOSED'
                              ? 'bg-[#F1F5EB] text-[#5B7235] border border-[#D7E4C4]'
                              : c.status === 'IN_PROGRESS'
                              ? 'bg-[#FBF5EB] text-[#B46C1A] border border-[#F2DEC0]'
                              : 'bg-[#F4F1EA] text-[#2C3E50] border border-[#E8E6E1]'
                          }`}
                        >
                          {c.status}
                        </span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-[#8C9BA5]" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 3. HELP & FAQ SECTION */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'faq' && (
        <div className="bg-white rounded-[24px] border border-[#E8E6E1] p-6 sm:p-8 shadow-sm space-y-6">
          <div>
            <h2 className="text-xl font-serif font-bold text-[#2C3E50] flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-[#8A9A5B]" /> Frequently Asked Questions & Policies
            </h2>
            <p className="text-xs text-[#6B7C8E] mt-1">
              Learn how complaints are prioritized, routed, and resolved across departments.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-5 rounded-2xl bg-[#F4F1EA] border border-[#E8E6E1] space-y-2">
              <h3 className="font-bold text-[#2C3E50] text-sm font-serif">What happens after I submit a complaint?</h3>
              <p className="text-[#6B7C8E] leading-relaxed">
                Your complaint is immediately processed by our server-side NLP engine. It extracts facts, evaluates
                urgency against institutional safety standards, and maps the issue to the relevant department.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-[#F4F1EA] border border-[#E8E6E1] space-y-2">
              <h3 className="font-bold text-[#2C3E50] text-sm font-serif">How is urgency determined?</h3>
              <p className="text-[#6B7C8E] leading-relaxed">
                The system uses a hybrid model: natural language assessment combined with hard deterministic safety
                rules. Immediate hazards (electrical sparks, structural cracks, threats) are elevated to HIGH urgency.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-[#F4F1EA] border border-[#E8E6E1] space-y-2">
              <h3 className="font-bold text-[#2C3E50] text-sm font-serif">Does an AI make final decisions?</h3>
              <p className="text-[#6B7C8E] leading-relaxed">
                No. The AI operates strictly as a decision-support tool for institutional staff. High-urgency and
                uncertain cases are reviewed by human administrators before execution.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-[#F4F1EA] border border-[#E8E6E1] space-y-2">
              <h3 className="font-bold text-[#2C3E50] text-sm font-serif">Can I write in Hindi or Hinglish?</h3>
              <p className="text-[#6B7C8E] leading-relaxed">
                Yes. The system automatically detects languages such as Hindi or Hinglish and normalizes the semantic
                intent while preserving your original submission text.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
