import React, { useState } from 'react';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts';
import {
  Sliders,
  ShieldAlert,
  Sparkles,
  Building2,
  Users,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Download,
  Search,
  Plus,
  RefreshCw,
  Edit,
  Database,
  History,
  TrendingUp,
  Activity,
  Layers,
} from 'lucide-react';
import {
  AIFeedbackRecord,
  AuditLog,
  Complaint,
  DashboardMetrics,
  Department,
  SystemSettings,
  User,
} from '../types';
import { FeedbackModal } from './FeedbackModal';

interface AdminPortalProps {
  currentUser: User;
  complaints: Complaint[];
  departments: Department[];
  metrics: DashboardMetrics | null;
  settings: SystemSettings | null;
  auditLogs: AuditLog[];
  feedbackRecords: AIFeedbackRecord[];
  onRefreshAll: () => void;
  onReviewComplaint: (complaintId: string, action: string, details?: any) => Promise<void>;
  onSaveDepartment: (dept: Partial<Department>) => Promise<void>;
  onSaveSettings: (settings: Partial<SystemSettings>) => Promise<void>;
  onExportCSV: () => void;
}

export const AdminPortal: React.FC<AdminPortalProps> = ({
  currentUser,
  complaints,
  departments,
  metrics,
  settings,
  auditLogs,
  feedbackRecords,
  onRefreshAll,
  onReviewComplaint,
  onSaveDepartment,
  onSaveSettings,
  onExportCSV,
}) => {
  const [activeAdminTab, setActiveAdminTab] = useState<
    'analytics' | 'reviewQueue' | 'departments' | 'aiPerformance' | 'audit' | 'settings'
  >('analytics');

  const [reviewComplaint, setReviewComplaint] = useState<Complaint | null>(null);
  const [showOverrideModal, setShowOverrideModal] = useState(false);

  // Department modal state
  const [editingDept, setEditingDept] = useState<Partial<Department> | null>(null);
  const [showDeptModal, setShowDeptModal] = useState(false);

  // Audit search
  const [auditSearch, setAuditSearch] = useState('');

  // Human Review Queue Filter
  const reviewQueue = complaints.filter(
    (c) => c.status === 'REVIEW_REQUIRED' || (!c.humanVerified && c.urgency === 'HIGH')
  );

  // Colors for charts (Natural Tones botanical theme)
  const URGENCY_COLORS: Record<string, string> = {
    'High Urgency': '#E2725B', // Warm Coral/Terracotta
    'Medium Urgency': '#D99B43', // Warm Amber/Ochre
    'Low Urgency': '#8A9A5B', // Sage Green
  };

  const filteredAuditLogs = auditSearch.trim()
    ? auditLogs.filter(
        (l) =>
          l.trackingNumber?.toLowerCase().includes(auditSearch.toLowerCase()) ||
          l.action.toLowerCase().includes(auditSearch.toLowerCase()) ||
          l.actorName.toLowerCase().includes(auditSearch.toLowerCase()) ||
          (l.newValue && l.newValue.toLowerCase().includes(auditSearch.toLowerCase()))
      )
    : auditLogs;

  const handleSaveDeptSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDept?.name || !editingDept?.code) return;
    await onSaveDepartment(editingDept);
    setShowDeptModal(false);
    setEditingDept(null);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      {/* Admin Executive Header */}
      <div className="bg-[#2C3E50] rounded-[24px] p-6 sm:p-8 text-white shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border border-[#E8E6E1]/20">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-3 py-0.5 rounded-full text-[10px] uppercase font-bold tracking-widest bg-[#8A9A5B]/30 text-[#D7E4C4] border border-[#8A9A5B]/40">
              Executive Administration & Control Center
            </span>
            <span className="text-[11px] uppercase tracking-wider text-[#DED9CE]/80 font-mono">Institutional Governance</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif italic tracking-tight text-[#FDFCF8]">Complaint Intelligence Console</h1>
          <p className="text-xs sm:text-sm text-[#DED9CE]/90 mt-2 max-w-2xl leading-relaxed">
            Monitor real-time triage metrics, inspect AI reliability scores, configure routing rules, manage institutional
            departments, and perform human-in-the-loop review.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={onExportCSV}
            className="px-4 py-2.5 rounded-full bg-[#1E2B37] hover:bg-[#324556] text-xs font-semibold text-[#FDFCF8] flex items-center gap-2 transition border border-[#E8E6E1]/20 shadow-xs"
          >
            <Download className="w-3.5 h-3.5 text-[#8A9A5B]" /> Export Data (CSV)
          </button>
          <button
            onClick={onRefreshAll}
            className="px-4 py-2.5 rounded-full bg-[#8A9A5B] hover:bg-[#78884E] text-xs font-semibold uppercase tracking-wider text-white flex items-center gap-2 transition shadow-xs"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Refresh Analytics
          </button>
        </div>
      </div>

      {/* Admin Navigation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto border-b border-[#E8E6E1] pb-2">
        <button
          onClick={() => setActiveAdminTab('analytics')}
          className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition flex items-center gap-1.5 ${
            activeAdminTab === 'analytics'
              ? 'bg-[#8A9A5B] text-white shadow-xs'
              : 'bg-white text-[#2C3E50] hover:bg-[#F4F1EA] border border-[#E8E6E1]'
          }`}
        >
          <TrendingUp className="w-4 h-4" /> Analytics & KPIs
        </button>

        <button
          onClick={() => setActiveAdminTab('reviewQueue')}
          className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition flex items-center gap-1.5 relative ${
            activeAdminTab === 'reviewQueue'
              ? 'bg-[#8A9A5B] text-white shadow-xs'
              : 'bg-white text-[#2C3E50] hover:bg-[#F4F1EA] border border-[#E8E6E1]'
          }`}
        >
          <ShieldAlert className="w-4 h-4" /> Human Review Queue
          {reviewQueue.length > 0 && (
            <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-[#E2725B] text-white font-bold">
              {reviewQueue.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveAdminTab('departments')}
          className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition flex items-center gap-1.5 ${
            activeAdminTab === 'departments'
              ? 'bg-[#8A9A5B] text-white shadow-xs'
              : 'bg-white text-[#2C3E50] hover:bg-[#F4F1EA] border border-[#E8E6E1]'
          }`}
        >
          <Building2 className="w-4 h-4" /> Departments ({departments.length})
        </button>

        <button
          onClick={() => setActiveAdminTab('aiPerformance')}
          className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition flex items-center gap-1.5 ${
            activeAdminTab === 'aiPerformance'
              ? 'bg-[#8A9A5B] text-white shadow-xs'
              : 'bg-white text-[#2C3E50] hover:bg-[#F4F1EA] border border-[#E8E6E1]'
          }`}
        >
          <Sparkles className="w-4 h-4" /> AI Evaluation & Feedback ({feedbackRecords.length})
        </button>

        <button
          onClick={() => setActiveAdminTab('audit')}
          className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition flex items-center gap-1.5 ${
            activeAdminTab === 'audit'
              ? 'bg-[#8A9A5B] text-white shadow-xs'
              : 'bg-white text-[#2C3E50] hover:bg-[#F4F1EA] border border-[#E8E6E1]'
          }`}
        >
          <History className="w-4 h-4" /> Audit Trail
        </button>

        <button
          onClick={() => setActiveAdminTab('settings')}
          className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition flex items-center gap-1.5 ${
            activeAdminTab === 'settings'
              ? 'bg-[#8A9A5B] text-white shadow-xs'
              : 'bg-white text-[#2C3E50] hover:bg-[#F4F1EA] border border-[#E8E6E1]'
          }`}
        >
          <Sliders className="w-4 h-4" /> System Thresholds
        </button>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 1. ANALYTICS & KPIS */}
      {/* ------------------------------------------------------------- */}
      {activeAdminTab === 'analytics' && metrics && (
        <div className="space-y-6 animate-in fade-in">
          {/* Top KPI Metrics Row */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
            <div className="bg-white p-4 rounded-2xl border border-[#E8E6E1] shadow-xs space-y-1">
              <div className="text-[10px] font-bold text-[#7D8B99] uppercase tracking-wider">Total Logged</div>
              <div className="text-2xl font-serif font-bold text-[#2C3E50]">{metrics.totalComplaints}</div>
              <div className="text-[10px] text-[#6B7C8E]">All registered issues</div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-[#E8E6E1] shadow-xs space-y-1">
              <div className="text-[10px] font-bold text-[#7D8B99] uppercase tracking-wider">Open Active</div>
              <div className="text-2xl font-serif font-bold text-[#8A9A5B]">{metrics.openComplaints}</div>
              <div className="text-[10px] text-[#6B7C8E]">In operational queues</div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-[#E8E6E1] shadow-xs space-y-1">
              <div className="text-[10px] font-bold text-[#7D8B99] uppercase tracking-wider">High Urgency</div>
              <div className="text-2xl font-serif font-bold text-[#E2725B]">{metrics.highUrgencyCount}</div>
              <div className="text-[10px] text-[#E2725B] font-medium">Safety & urgent SLA</div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-[#E8E6E1] shadow-xs space-y-1">
              <div className="text-[10px] font-bold text-[#7D8B99] uppercase tracking-wider">Human Review</div>
              <div className="text-2xl font-serif font-bold text-[#D99B43]">{metrics.awaitingReviewCount}</div>
              <div className="text-[10px] text-[#D99B43] font-medium">Pending sign-off</div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-[#E8E6E1] shadow-xs space-y-1">
              <div className="text-[10px] font-bold text-[#7D8B99] uppercase tracking-wider">AI Agreement</div>
              <div className="text-2xl font-serif font-bold text-[#5B7235]">{metrics.aiHumanAgreementRate}%</div>
              <div className="text-[10px] text-[#5B7235] font-medium">Model reliability</div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-[#E8E6E1] shadow-xs space-y-1">
              <div className="text-[10px] font-bold text-[#7D8B99] uppercase tracking-wider">Avg Resolution</div>
              <div className="text-2xl font-serif font-bold text-[#2C3E50]">{metrics.avgResolutionTimeHours}h</div>
              <div className="text-[10px] text-[#6B7C8E]">Mean closure time</div>
            </div>
          </div>

          {/* Charts Row 1: Urgency Breakdown & Weekly Ingestion Trend */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Donut Chart: Urgency Distribution */}
            <div className="lg:col-span-5 bg-white p-5 sm:p-6 rounded-[24px] border border-[#E8E6E1] shadow-xs space-y-3.5">
              <h3 className="text-xs font-serif font-bold uppercase tracking-wider text-[#2C3E50]">Urgency Distribution</h3>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={metrics.byUrgency}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={85}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {metrics.byUrgency.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={URGENCY_COLORS[entry.name] || '#8A9A5B'} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Area Chart: Trend Over Time */}
            <div className="lg:col-span-7 bg-white p-5 sm:p-6 rounded-[24px] border border-[#E8E6E1] shadow-xs space-y-3.5">
              <h3 className="text-xs font-serif font-bold uppercase tracking-wider text-[#2C3E50]">
                7-Day Ingestion & Resolution Volume
              </h3>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={metrics.trendOverTime}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E8E6E1" />
                    <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#7D8B99' }} />
                    <YAxis tick={{ fontSize: 11, fill: '#7D8B99' }} />
                    <Tooltip />
                    <Area type="monotone" dataKey="count" name="Incoming" stroke="#8A9A5B" fill="#D7E4C4" />
                    <Area type="monotone" dataKey="resolved" name="Resolved" stroke="#2C3E50" fill="#E8E6E1" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Charts Row 2: Department Workload & Category Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Bar Chart: Complaints by Department */}
            <div className="lg:col-span-7 bg-white p-5 sm:p-6 rounded-[24px] border border-[#E8E6E1] shadow-xs space-y-3.5">
              <h3 className="text-xs font-serif font-bold uppercase tracking-wider text-[#2C3E50]">
                Department Ticket Distribution
              </h3>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={metrics.byDepartment}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E8E6E1" />
                    <XAxis dataKey="code" tick={{ fontSize: 11, fill: '#7D8B99' }} />
                    <YAxis tick={{ fontSize: 11, fill: '#7D8B99' }} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#8A9A5B" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Bar Chart: Category Breakdown */}
            <div className="lg:col-span-5 bg-white p-5 sm:p-6 rounded-[24px] border border-[#E8E6E1] shadow-xs space-y-3.5">
              <h3 className="text-xs font-serif font-bold uppercase tracking-wider text-[#2C3E50]">Complaints by Category</h3>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={metrics.byCategory} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E8E6E1" />
                    <XAxis type="number" tick={{ fontSize: 11, fill: '#7D8B99' }} />
                    <YAxis dataKey="name" type="category" width={90} tick={{ fontSize: 10, fill: '#7D8B99' }} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#2C3E50" radius={[0, 6, 6, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 2. HUMAN REVIEW QUEUE */}
      {/* ------------------------------------------------------------- */}
      {activeAdminTab === 'reviewQueue' && (
        <div className="bg-white rounded-[24px] border border-[#E8E6E1] shadow-xs p-6 sm:p-7 space-y-5 animate-in fade-in">
          <div className="flex items-center justify-between border-b border-[#E8E6E1] pb-3.5">
            <div>
              <h2 className="text-base font-serif font-bold text-[#2C3E50] flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-[#E2725B]" /> Human-in-the-Loop Triage Queue ({reviewQueue.length})
              </h2>
              <p className="text-xs text-[#6B7C8E] mt-0.5">
                Complaints requiring administrator sign-off due to safety hazard rules, high urgency, or low model confidence.
              </p>
            </div>
          </div>

          {reviewQueue.length === 0 ? (
            <div className="p-12 text-center text-[#7D8B99] text-xs space-y-2">
              <CheckCircle2 className="w-10 h-10 text-[#5B7235] mx-auto mb-2" />
              All complaints are verified. No items currently require human review.
            </div>
          ) : (
            <div className="divide-y divide-[#E8E6E1]">
              {reviewQueue.map((c) => (
                <div key={c.id} className="py-4 hover:bg-[#FDFCF8] transition rounded-2xl space-y-3 px-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-[#2C3E50] bg-[#F4F1EA] px-2.5 py-0.5 rounded-full border border-[#E8E6E1]">
                        {c.trackingNumber}
                      </span>
                      <span
                        className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                          c.urgency === 'HIGH' ? 'badge-high' : 'badge-medium'
                        }`}
                      >
                        Urgency: {c.urgency}
                      </span>
                      <span className="text-xs text-[#6B7C8E]">Student: {c.studentName}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onReviewComplaint(c.id, 'APPROVE')}
                        className="px-3.5 py-1.5 bg-[#8A9A5B] hover:bg-[#78884E] text-white rounded-full text-xs font-semibold uppercase tracking-wider shadow-xs flex items-center gap-1.5"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" /> Approve Decision
                      </button>

                      <button
                        onClick={() => {
                          setReviewComplaint(c);
                          setShowOverrideModal(true);
                        }}
                        className="px-3.5 py-1.5 bg-[#E2725B] hover:bg-[#D05E48] text-white rounded-full text-xs font-semibold uppercase tracking-wider shadow-xs flex items-center gap-1.5"
                      >
                        <Sliders className="w-3.5 h-3.5" /> Override & Feedback
                      </button>
                    </div>
                  </div>

                  <h3 className="text-sm font-serif font-bold text-[#2C3E50]">{c.title}</h3>
                  <p className="text-xs text-[#6B7C8E] leading-relaxed">{c.description}</p>

                  <div className="p-4 bg-[#2C3E50] text-white rounded-2xl text-xs space-y-2 border border-[#E8E6E1]/20">
                    <div className="flex items-center justify-between">
                      <span className="text-[#8A9A5B] font-semibold flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5" /> AI Recommendation Signals:
                      </span>
                      <span className="text-[#DED9CE]/80 font-mono text-[11px]">
                        Confidence: {Math.round((c.aiAnalysis?.urgencyConfidence || 0.85) * 100)}%
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] text-[#DED9CE]">
                      <div>
                        <strong>Category:</strong> {c.aiAnalysis?.category} ({c.aiAnalysis?.subcategory})
                      </div>
                      <div>
                        <strong>Routed Dept:</strong> {c.assignedDepartmentName}
                      </div>
                      <div>
                        <strong>Reason:</strong> {c.aiAnalysis?.urgencyReason}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 3. DEPARTMENT CONFIGURATION */}
      {/* ------------------------------------------------------------- */}
      {activeAdminTab === 'departments' && (
        <div className="bg-white rounded-[24px] border border-[#E8E6E1] shadow-xs p-6 sm:p-7 space-y-5 animate-in fade-in">
          <div className="flex items-center justify-between border-b border-[#E8E6E1] pb-3.5">
            <div>
              <h2 className="text-base font-serif font-bold text-[#2C3E50] flex items-center gap-2">
                <Building2 className="w-5 h-5 text-[#8A9A5B]" /> Institutional Departments & Routing Matrix ({departments.length})
              </h2>
              <p className="text-xs text-[#6B7C8E] mt-0.5">
                Configure department codes, active categories handled, escalation SLAs, and automated routing rules.
              </p>
            </div>

            <button
              onClick={() => {
                setEditingDept({
                  name: '',
                  code: '',
                  description: '',
                  email: '',
                  escalationHours: 24,
                  categories: [],
                  active: true,
                });
                setShowDeptModal(true);
              }}
              className="px-4 py-2 bg-[#8A9A5B] hover:bg-[#78884E] text-white rounded-full text-xs font-semibold uppercase tracking-wider shadow-xs flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" /> Add Department
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
            {departments.map((d) => (
              <div key={d.id} className="p-5 rounded-2xl border border-[#E8E6E1] bg-[#F4F1EA]/60 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="font-mono text-[10px] font-bold px-2 py-0.5 bg-[#8A9A5B]/20 text-[#2C3E50] rounded-full border border-[#8A9A5B]/30">
                      {d.code}
                    </span>
                    <h3 className="font-serif font-bold text-[#2C3E50] text-sm mt-1.5">{d.name}</h3>
                  </div>
                  <button
                    onClick={() => {
                      setEditingDept(d);
                      setShowDeptModal(true);
                    }}
                    className="p-1.5 text-[#7D8B99] hover:text-[#2C3E50] rounded-full hover:bg-[#E8E6E1]"
                  >
                    <Edit className="w-3.5 h-3.5" />
                  </button>
                </div>

                <p className="text-[#6B7C8E] text-[11px] line-clamp-2 leading-relaxed">{d.description}</p>

                <div className="space-y-1 text-[11px] text-[#6B7C8E] pt-2.5 border-t border-[#E8E6E1]">
                  <div>
                    <strong>Email:</strong> {d.email}
                  </div>
                  <div>
                    <strong>Escalation SLA:</strong> {d.escalationHours} hours
                  </div>
                  <div className="flex flex-wrap gap-1 pt-1.5">
                    {d.categories.map((cat, idx) => (
                      <span key={idx} className="bg-white border border-[#E8E6E1] text-[#2C3E50] px-2 py-0.5 rounded-full text-[10px]">
                        {cat}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 4. AI PERFORMANCE & FEEDBACK RECORDS */}
      {/* ------------------------------------------------------------- */}
      {activeAdminTab === 'aiPerformance' && (
        <div className="space-y-6 animate-in fade-in">
          <div className="bg-white rounded-[24px] border border-[#E8E6E1] shadow-xs p-6 sm:p-7 space-y-4">
            <h2 className="text-base font-serif font-bold text-[#2C3E50] flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#8A9A5B]" /> AI Classification Accuracy & Human Override Metrics
            </h2>
            <p className="text-xs text-[#6B7C8E]">
              Evaluates model alignment against human decisions and displays the captured feedback dataset.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
              <div className="p-4 rounded-2xl bg-[#F4F1EA] border border-[#E8E6E1] space-y-1">
                <div className="text-[10px] font-bold text-[#7D8B99] uppercase tracking-wider">AI-Human Agreement</div>
                <div className="text-2xl font-serif font-bold text-[#5B7235]">{metrics?.aiHumanAgreementRate || 92}%</div>
                <div className="text-[10px] text-[#6B7C8E]">Accepted without override</div>
              </div>

              <div className="p-4 rounded-2xl bg-[#F4F1EA] border border-[#E8E6E1] space-y-1">
                <div className="text-[10px] font-bold text-[#7D8B99] uppercase tracking-wider">Urgency Override Rate</div>
                <div className="text-2xl font-serif font-bold text-[#D99B43]">{metrics?.urgencyOverrideRate || 8}%</div>
                <div className="text-[10px] text-[#6B7C8E]">Changed by staff</div>
              </div>

              <div className="p-4 rounded-2xl bg-[#F4F1EA] border border-[#E8E6E1] space-y-1">
                <div className="text-[10px] font-bold text-[#7D8B99] uppercase tracking-wider">Dept Override Rate</div>
                <div className="text-2xl font-serif font-bold text-[#8A9A5B]">{metrics?.deptOverrideRate || 10}%</div>
                <div className="text-[10px] text-[#6B7C8E]">Rerouted by staff</div>
              </div>

              <div className="p-4 rounded-2xl bg-[#F4F1EA] border border-[#E8E6E1] space-y-1">
                <div className="text-[10px] font-bold text-[#7D8B99] uppercase tracking-wider">Logged Corrections</div>
                <div className="text-2xl font-serif font-bold text-[#2C3E50]">{feedbackRecords.length}</div>
                <div className="text-[10px] text-[#6B7C8E]">In training repository</div>
              </div>
            </div>
          </div>

          {/* Feedback Records Table */}
          <div className="bg-white rounded-[24px] border border-[#E8E6E1] shadow-xs p-6 sm:p-7 space-y-4">
            <h3 className="text-sm font-serif font-bold text-[#2C3E50]">Recorded Human Overrides & Explanations ({feedbackRecords.length})</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#E8E6E1] text-[#7D8B99]">
                    <th className="py-2.5">Tracking ID</th>
                    <th className="py-2.5">Feedback Reason</th>
                    <th className="py-2.5">Original AI Prediction</th>
                    <th className="py-2.5">Human Correction</th>
                    <th className="py-2.5">Reviewer Explanation</th>
                    <th className="py-2.5">Reviewer</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E8E6E1] text-[#2C3E50]">
                  {feedbackRecords.map((fb) => (
                    <tr key={fb.id} className="hover:bg-[#FDFCF8]">
                      <td className="py-3 font-mono font-bold text-[#2C3E50]">{fb.trackingNumber}</td>
                      <td className="py-3">
                        <span className="bg-[#D99B43]/20 text-[#2C3E50] px-2.5 py-0.5 rounded-full font-semibold text-[10px]">
                          {fb.feedbackType}
                        </span>
                      </td>
                      <td className="py-3 text-[#6B7C8E]">
                        {fb.originalAISuggestion.urgency || fb.originalAISuggestion.department || 'N/A'}
                      </td>
                      <td className="py-3 font-semibold text-[#2C3E50]">
                        {fb.humanCorrection.urgency || fb.humanCorrection.department || 'N/A'}
                      </td>
                      <td className="py-3 max-w-xs truncate text-[#6B7C8E]">{fb.explanation}</td>
                      <td className="py-3 text-[#7D8B99]">{fb.reviewerName}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 5. AUDIT TRAIL */}
      {/* ------------------------------------------------------------- */}
      {activeAdminTab === 'audit' && (
        <div className="bg-white rounded-[24px] border border-[#E8E6E1] shadow-xs p-6 sm:p-7 space-y-5 animate-in fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E8E6E1] pb-3.5">
            <div>
              <h2 className="text-base font-serif font-bold text-[#2C3E50] flex items-center gap-2">
                <History className="w-5 h-5 text-[#8A9A5B]" /> Immutable Institutional Audit Logs ({auditLogs.length})
              </h2>
              <p className="text-xs text-[#6B7C8E]">Complete, tamper-evident log of all triage, routing, and review operations.</p>
            </div>

            <div className="relative">
              <Search className="w-4 h-4 text-[#8A9A5B] absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search audit trail..."
                value={auditSearch}
                onChange={(e) => setAuditSearch(e.target.value)}
                className="pl-9 pr-3.5 py-2 bg-[#FDFCF8] border border-[#DED9CE] rounded-xl text-xs outline-none focus:border-[#8A9A5B] text-[#2C3E50]"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#E8E6E1] text-[#7D8B99]">
                  <th className="py-2.5">Timestamp</th>
                  <th className="py-2.5">Ticket</th>
                  <th className="py-2.5">Actor</th>
                  <th className="py-2.5">Action</th>
                  <th className="py-2.5">Old Value</th>
                  <th className="py-2.5">New Value / Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8E6E1] text-[#2C3E50] font-mono text-[11px]">
                {filteredAuditLogs.slice(0, 50).map((log) => (
                  <tr key={log.id} className="hover:bg-[#FDFCF8]">
                    <td className="py-2.5 text-[#7D8B99]">{new Date(log.createdAt).toLocaleTimeString()}</td>
                    <td className="py-2.5 font-bold text-[#2C3E50]">{log.trackingNumber || log.complaintId}</td>
                    <td className="py-2.5 text-[#2C3E50]">
                      {log.actorName} ({log.actorRole})
                    </td>
                    <td className="py-2.5 font-semibold text-[#8A9A5B]">{log.action}</td>
                    <td className="py-2.5 text-[#7D8B99]">{log.oldValue || '-'}</td>
                    <td className="py-2.5 text-[#2C3E50] max-w-sm truncate">{log.newValue || log.reason || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 6. SYSTEM SETTINGS & THRESHOLDS */}
      {/* ------------------------------------------------------------- */}
      {activeAdminTab === 'settings' && settings && (
        <div className="bg-white rounded-[24px] border border-[#E8E6E1] shadow-xs p-6 sm:p-8 space-y-6 animate-in fade-in max-w-3xl">
          <div>
            <h2 className="text-base font-serif font-bold text-[#2C3E50] flex items-center gap-2">
              <Sliders className="w-5 h-5 text-[#8A9A5B]" /> System Thresholds & Configuration
            </h2>
            <p className="text-xs text-[#6B7C8E] mt-0.5">
              Adjust AI confidence bounds, default SLA response windows, and deterministic safety rules.
            </p>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              onSaveSettings(settings);
            }}
            className="space-y-5 text-xs"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-5 bg-[#F4F1EA] rounded-2xl border border-[#E8E6E1] space-y-2">
                <label className="block font-bold text-[#2C3E50]">High Confidence Threshold (Auto-Route):</label>
                <input
                  type="number"
                  step="0.05"
                  min="0.5"
                  max="1.0"
                  value={settings.confidenceThresholdHigh}
                  onChange={(e) =>
                    onSaveSettings({ confidenceThresholdHigh: parseFloat(e.target.value) || 0.8 })
                  }
                  className="w-full p-2.5 bg-white border border-[#DED9CE] rounded-xl text-xs text-[#2C3E50] outline-none focus:border-[#8A9A5B]"
                />
                <span className="text-[11px] text-[#6B7C8E]">Scores &ge; this value auto-route to primary dept.</span>
              </div>

              <div className="p-5 bg-[#F4F1EA] rounded-2xl border border-[#E8E6E1] space-y-2">
                <label className="block font-bold text-[#2C3E50]">Medium Confidence Threshold (Triage):</label>
                <input
                  type="number"
                  step="0.05"
                  min="0.3"
                  max="0.8"
                  value={settings.confidenceThresholdMedium}
                  onChange={(e) =>
                    onSaveSettings({ confidenceThresholdMedium: parseFloat(e.target.value) || 0.6 })
                  }
                  className="w-full p-2.5 bg-white border border-[#DED9CE] rounded-xl text-xs text-[#2C3E50] outline-none focus:border-[#8A9A5B]"
                />
                <span className="text-[11px] text-[#6B7C8E]">Scores below this value route to general review queue.</span>
              </div>

              <div className="p-5 bg-[#F4F1EA] rounded-2xl border border-[#E8E6E1] space-y-2">
                <label className="block font-bold text-[#2C3E50]">High Urgency SLA (Hours):</label>
                <input
                  type="number"
                  min="1"
                  max="72"
                  value={settings.defaultSlaHoursHigh}
                  onChange={(e) => onSaveSettings({ defaultSlaHoursHigh: parseInt(e.target.value) || 6 })}
                  className="w-full p-2.5 bg-white border border-[#DED9CE] rounded-xl text-xs text-[#2C3E50] outline-none focus:border-[#8A9A5B]"
                />
              </div>

              <div className="p-5 bg-[#F4F1EA] rounded-2xl border border-[#E8E6E1] space-y-2">
                <label className="block font-bold text-[#2C3E50]">Medium Urgency SLA (Hours):</label>
                <input
                  type="number"
                  min="1"
                  max="168"
                  value={settings.defaultSlaHoursMedium}
                  onChange={(e) => onSaveSettings({ defaultSlaHoursMedium: parseInt(e.target.value) || 24 })}
                  className="w-full p-2.5 bg-white border border-[#DED9CE] rounded-xl text-xs text-[#2C3E50] outline-none focus:border-[#8A9A5B]"
                />
              </div>
            </div>

            <div className="p-5 bg-[#F4F1EA] rounded-2xl border border-[#E8E6E1] space-y-3">
              <label className="font-bold text-[#2C3E50] block">Deterministic Safety Shield Rules</label>
              <div className="flex items-center gap-2.5">
                <input
                  type="checkbox"
                  id="safety-rules-toggle"
                  checked={settings.safetyOverrideRulesEnabled}
                  onChange={(e) => onSaveSettings({ safetyOverrideRulesEnabled: e.target.checked })}
                  className="rounded text-[#8A9A5B] focus:ring-[#8A9A5B] h-4 w-4"
                />
                <label htmlFor="safety-rules-toggle" className="text-xs text-[#2C3E50] font-medium">
                  Enforce automatic HIGH urgency override on safety hazard keywords (spark, wire, harassment, fire)
                </label>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* Override / Feedback Modal */}
      {showOverrideModal && reviewComplaint && (
        <FeedbackModal
          complaint={reviewComplaint}
          departments={departments}
          currentUser={currentUser}
          onClose={() => {
            setShowOverrideModal(false);
            setReviewComplaint(null);
          }}
          onSubmitOverride={async (payload) => {
            await onReviewComplaint(reviewComplaint.id, payload.action, payload);
          }}
        />
      )}

      {/* Add / Edit Department Modal */}
      {showDeptModal && editingDept && (
        <div className="fixed inset-0 z-50 bg-[#2C3E50]/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-[24px] border border-[#E8E6E1] shadow-2xl max-w-md w-full p-6 sm:p-7 space-y-5 animate-in fade-in">
            <h3 className="text-base font-serif font-bold text-[#2C3E50]">
              {editingDept.id ? 'Edit Department' : 'Create New Department'}
            </h3>

            <form onSubmit={handleSaveDeptSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-[#2C3E50] mb-1">Department Name:</label>
                <input
                  type="text"
                  required
                  value={editingDept.name || ''}
                  onChange={(e) => setEditingDept({ ...editingDept, name: e.target.value })}
                  placeholder="e.g. Sports & Athletics"
                  className="w-full p-2.5 bg-[#FDFCF8] border border-[#DED9CE] rounded-xl text-xs text-[#2C3E50] outline-none focus:border-[#8A9A5B]"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#2C3E50] mb-1">Department Code:</label>
                <input
                  type="text"
                  required
                  value={editingDept.code || ''}
                  onChange={(e) => setEditingDept({ ...editingDept, code: e.target.value })}
                  placeholder="e.g. SPORTS"
                  className="w-full p-2.5 bg-[#FDFCF8] border border-[#DED9CE] rounded-xl text-xs text-[#2C3E50] outline-none focus:border-[#8A9A5B]"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#2C3E50] mb-1">Official Email:</label>
                <input
                  type="email"
                  value={editingDept.email || ''}
                  onChange={(e) => setEditingDept({ ...editingDept, email: e.target.value })}
                  placeholder="sports@university.edu"
                  className="w-full p-2.5 bg-[#FDFCF8] border border-[#DED9CE] rounded-xl text-xs text-[#2C3E50] outline-none focus:border-[#8A9A5B]"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#2C3E50] mb-1">Description:</label>
                <textarea
                  rows={2}
                  value={editingDept.description || ''}
                  onChange={(e) => setEditingDept({ ...editingDept, description: e.target.value })}
                  className="w-full p-2.5 bg-[#FDFCF8] border border-[#DED9CE] rounded-xl text-xs text-[#2C3E50] outline-none focus:border-[#8A9A5B]"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-[#E8E6E1]">
                <button
                  type="button"
                  onClick={() => setShowDeptModal(false)}
                  className="px-4 py-2 bg-[#F4F1EA] hover:bg-[#E8E6E1] text-[#2C3E50] rounded-full font-medium"
                >
                  Cancel
                </button>
                <button type="submit" className="px-5 py-2 bg-[#8A9A5B] hover:bg-[#78884E] text-white font-semibold uppercase tracking-wider rounded-full shadow-xs">
                  Save Department
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
