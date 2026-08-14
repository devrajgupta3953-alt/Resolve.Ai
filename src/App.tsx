import React, { useEffect, useState, useCallback } from 'react';
import { Navbar } from './components/Navbar';
import { LoginPage } from './components/LoginPage';
import { StudentPortal } from './components/StudentPortal';
import { StaffPortal } from './components/StaffPortal';
import { AdminPortal } from './components/AdminPortal';
import { AutomatedTestRunner } from './components/AutomatedTestRunner';
import { PatentDocumentationViewer } from './components/PatentDocumentationViewer';
import { GeminiChatbot } from './components/GeminiChatbot';
import {
  AIFeedbackRecord,
  AuditLog,
  Complaint,
  DashboardMetrics,
  Department,
  SystemSettings,
  User,
} from './types';
import { CheckCircle, AlertCircle, Info, RefreshCw, MessageSquare, Sparkles } from 'lucide-react';

export default function App() {
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(true);
  const [currentTab, setCurrentTab] = useState<string>('student');

  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [feedbackRecords, setFeedbackRecords] = useState<AIFeedbackRecord[]>([]);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [isChatOpen, setIsChatOpen] = useState<boolean>(false);

  const showToast = (text: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Helper headers with authenticated user id
  const getAuthHeaders = useCallback(() => {
    return {
      'Content-Type': 'application/json',
      'x-user-id': currentUser?.id || 'usr-admin-1',
    };
  }, [currentUser]);

  // Load initial data
  const loadUsersAndInitialState = useCallback(async () => {
    try {
      const usersRes = await fetch('/api/auth/users');
      const usersData = await usersRes.json();
      const loadedUsers = usersData.users || [];
      setUsers(loadedUsers);

      // If no active user set, pick first student or admin
      if (!currentUser && loadedUsers.length > 0) {
        const studentUser = loadedUsers.find((u: User) => u.role === 'STUDENT') || loadedUsers[0];
        setCurrentUser(studentUser);
      }
    } catch (err) {
      console.error('Failed to load users:', err);
    }
  }, [currentUser]);

  const loadAllData = useCallback(async () => {
    if (!currentUser) return;
    try {
      setIsLoading(true);
      const headers = { 'x-user-id': currentUser.id };

      const [complaintsRes, deptsRes, metricsRes, settingsRes, auditRes, perfRes] = await Promise.all([
        fetch('/api/complaints?scope=all', { headers }),
        fetch('/api/departments', { headers }),
        fetch('/api/dashboard', { headers }),
        fetch('/api/settings', { headers }),
        fetch('/api/audit', { headers }),
        fetch('/api/ai-performance', { headers }),
      ]);

      const [cData, dData, mData, sData, aData, pData] = await Promise.all([
        complaintsRes.json(),
        deptsRes.json(),
        metricsRes.json(),
        settingsRes.json(),
        auditRes.json(),
        perfRes.json(),
      ]);

      setComplaints(cData.complaints || []);
      setDepartments(dData.departments || []);
      setMetrics(mData.metrics || null);
      setSettings(sData.settings || null);
      setAuditLogs(aData.auditLogs || []);
      setFeedbackRecords(pData.feedbackList || []);
    } catch (err) {
      console.error('Failed to fetch data:', err);
    } finally {
      setIsLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    loadUsersAndInitialState();
  }, [loadUsersAndInitialState]);

  useEffect(() => {
    if (currentUser && isLoggedIn) {
      loadAllData();
    }
  }, [currentUser, isLoggedIn, loadAllData]);

  // Handle successful login
  const handleLogin = (user: User) => {
    setCurrentUser(user);
    setIsLoggedIn(true);
    if (user.role === 'STUDENT') {
      setCurrentTab('student');
    } else if (user.role === 'STAFF') {
      setCurrentTab('staff');
    } else if (user.role === 'ADMIN') {
      setCurrentTab('admin');
    }
    showToast(`Authenticated as ${user.name} (${user.role})`, 'success');
  };

  // Handle logout
  const handleLogout = () => {
    setIsLoggedIn(false);
    showToast('Signed out of institutional session.', 'info');
  };

  // Handle switching user
  const handleSwitchUser = (newUser: User) => {
    setCurrentUser(newUser);
    // Switch primary tab view according to role
    if (newUser.role === 'STUDENT') {
      setCurrentTab('student');
    } else if (newUser.role === 'STAFF') {
      setCurrentTab('staff');
    } else if (newUser.role === 'ADMIN') {
      setCurrentTab('admin');
    }
    showToast(`Switched active persona to ${newUser.name} (${newUser.role})`, 'info');
  };

  // Submit Complaint
  const handleSubmitComplaint = async (formData: any): Promise<Complaint | null> => {
    try {
      const res = await fetch('/api/complaints', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to submit complaint');
      }

      const data = await res.json();
      showToast(`Complaint submitted successfully! Tracking ID: ${data.complaint.trackingNumber}`, 'success');
      loadAllData();
      return data.complaint;
    } catch (err: any) {
      showToast(err.message || 'Submission error', 'error');
      return null;
    }
  };

  // Review & Override Complaint
  const handleReviewComplaint = async (complaintId: string, action: string, details?: any) => {
    try {
      const res = await fetch(`/api/complaints/${complaintId}/review`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ action, ...details }),
      });

      if (!res.ok) throw new Error('Failed to submit review');
      showToast(`Decision executed: ${action}`, 'success');
      loadAllData();
    } catch (err: any) {
      showToast(err.message || 'Review error', 'error');
    }
  };

  // Assign Complaint
  const handleAssignComplaint = async (complaintId: string, deptId: string, staffName?: string) => {
    try {
      const res = await fetch(`/api/complaints/${complaintId}/assign`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ departmentId: deptId, staffName }),
      });
      if (!res.ok) throw new Error('Failed to assign complaint');
      showToast('Department/Staff assignment updated.', 'success');
      loadAllData();
    } catch (err: any) {
      showToast(err.message || 'Assignment error', 'error');
    }
  };

  // Update Status
  const handleUpdateStatus = async (complaintId: string, status: string, comment?: string) => {
    try {
      const res = await fetch(`/api/complaints/${complaintId}/status`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ status, comment }),
      });
      if (!res.ok) throw new Error('Failed to update status');
      showToast(`Complaint status moved to ${status}`, 'success');
      loadAllData();
    } catch (err: any) {
      showToast(err.message || 'Status update error', 'error');
    }
  };

  // Add Internal Staff Note
  const handleAddInternalNote = async (complaintId: string, text: string) => {
    try {
      const res = await fetch(`/api/complaints/${complaintId}/notes`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ text }),
      });
      if (!res.ok) throw new Error('Failed to add note');
      showToast('Internal note added to record.', 'success');
      loadAllData();
    } catch (err: any) {
      showToast(err.message || 'Note error', 'error');
    }
  };

  // Request Clarification from Student
  const handleRequestClarification = async (complaintId: string, requestText: string) => {
    try {
      const res = await fetch(`/api/complaints/${complaintId}/clarification`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ requestText }),
      });
      if (!res.ok) throw new Error('Failed to request clarification');
      showToast('Clarification request dispatched to student.', 'success');
      loadAllData();
    } catch (err: any) {
      showToast(err.message || 'Clarification error', 'error');
    }
  };

  // Student Answers Clarification
  const handleAnswerClarification = async (complaintId: string, clarificationId: string, responseText: string) => {
    try {
      const res = await fetch(`/api/complaints/${complaintId}/clarification`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ clarificationId, responseText }),
      });
      if (!res.ok) throw new Error('Failed to submit response');
      showToast('Clarification response submitted to staff.', 'success');
      loadAllData();
    } catch (err: any) {
      showToast(err.message || 'Response error', 'error');
    }
  };

  // Student Feedback & Closure
  const handleSubmitStudentFeedback = async (
    complaintId: string,
    rating: number,
    comment: string,
    markedAsResolved: boolean
  ) => {
    try {
      const res = await fetch(`/api/complaints/${complaintId}/feedback`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ satisfactionScore: rating, comment, markedAsResolved }),
      });
      if (!res.ok) throw new Error('Failed to submit feedback');
      showToast('Student satisfaction feedback recorded.', 'success');
      loadAllData();
    } catch (err: any) {
      showToast(err.message || 'Feedback error', 'error');
    }
  };

  // Save Department (Admin)
  const handleSaveDepartment = async (dept: Partial<Department>) => {
    try {
      const endpoint = dept.id ? `/api/departments/${dept.id}` : '/api/departments';
      const method = dept.id ? 'PATCH' : 'POST';
      const res = await fetch(endpoint, {
        method,
        headers: getAuthHeaders(),
        body: JSON.stringify(dept),
      });
      if (!res.ok) throw new Error('Failed to save department');
      showToast('Department configuration updated.', 'success');
      loadAllData();
    } catch (err: any) {
      showToast(err.message || 'Department error', 'error');
    }
  };

  // Save Settings (Admin)
  const handleSaveSettings = async (newSettings: Partial<SystemSettings>) => {
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(newSettings),
      });
      if (!res.ok) throw new Error('Failed to update settings');
      showToast('System thresholds & settings updated.', 'success');
      loadAllData();
    } catch (err: any) {
      showToast(err.message || 'Settings error', 'error');
    }
  };

  // Reset Demo Seed Data
  const handleResetDemoData = async () => {
    try {
      const res = await fetch('/api/seed/reset', { method: 'POST' });
      const data = await res.json();
      showToast(data.message || 'Seed data reloaded successfully.', 'success');
      loadAllData();
    } catch (err) {
      showToast('Failed to reset demo seed data', 'error');
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    window.open('/api/export', '_blank');
  };

  if (!currentUser && users.length === 0) {
    return (
      <div className="min-h-screen bg-[#2C3E50] flex items-center justify-center text-[#FDFCF8]">
        <div className="flex items-center gap-3">
          <RefreshCw className="w-6 h-6 animate-spin text-[#8A9A5B]" />
          <span className="text-sm font-serif italic">Initializing Institutional Complaint Platform...</span>
        </div>
      </div>
    );
  }

  // If user signed out, show dedicated Login Page
  if (!isLoggedIn || !currentUser) {
    return <LoginPage allUsers={users} onLogin={handleLogin} />;
  }

  const reviewRequiredCount = complaints.filter(
    (c) => c.status === 'REVIEW_REQUIRED' || (!c.humanVerified && c.urgency === 'HIGH')
  ).length;

  return (
    <div className="min-h-screen bg-[#FDFCF8] text-[#2C3E50] flex flex-col antialiased selection:bg-[#8A9A5B]/20 selection:text-[#2C3E50]">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 animate-in fade-in slide-in-from-bottom-5">
          <div
            className={`px-4 py-3 rounded-2xl shadow-lg border text-xs font-medium flex items-center gap-2.5 ${
              toastMessage.type === 'success'
                ? 'bg-[#2C3E50] text-[#F1F5EB] border-[#8A9A5B]/40'
                : toastMessage.type === 'error'
                ? 'bg-[#2C3E50] text-[#FDF0ED] border-[#E2725B]/40'
                : 'bg-[#2C3E50] text-[#FDFCF8] border-[#E8E6E1]/30'
            }`}
          >
            {toastMessage.type === 'success' ? (
              <CheckCircle className="w-4 h-4 text-[#8A9A5B] flex-shrink-0" />
            ) : toastMessage.type === 'error' ? (
              <AlertCircle className="w-4 h-4 text-[#E2725B] flex-shrink-0" />
            ) : (
              <Info className="w-4 h-4 text-[#DED9CE] flex-shrink-0" />
            )}
            <span>{toastMessage.text}</span>
          </div>
        </div>
      )}

      {/* Main Top Navigation */}
      <Navbar
        currentUser={currentUser}
        allUsers={users}
        onSwitchUser={handleSwitchUser}
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        onResetDemoData={handleResetDemoData}
        onLogout={handleLogout}
        onToggleChatbot={() => setIsChatOpen(!isChatOpen)}
        isChatOpen={isChatOpen}
        reviewRequiredCount={reviewRequiredCount}
      />

      {/* Dynamic View Portals */}
      <main className="flex-1 pb-16">
        {currentTab === 'student' && (
          <StudentPortal
            currentUser={currentUser}
            departments={departments}
            studentComplaints={complaints}
            onSubmitComplaint={handleSubmitComplaint}
            onRefreshComplaints={loadAllData}
            onSubmitStudentFeedback={handleSubmitStudentFeedback}
            onAnswerClarification={handleAnswerClarification}
            onSelectComplaint={() => {}}
          />
        )}

        {currentTab === 'staff' && (
          <StaffPortal
            currentUser={currentUser}
            complaints={complaints}
            departments={departments}
            onRefreshComplaints={loadAllData}
            onReviewComplaint={handleReviewComplaint}
            onAssignComplaint={handleAssignComplaint}
            onUpdateStatus={handleUpdateStatus}
            onAddInternalNote={handleAddInternalNote}
            onRequestClarification={handleRequestClarification}
          />
        )}

        {currentTab === 'admin' && (
          <AdminPortal
            currentUser={currentUser}
            complaints={complaints}
            departments={departments}
            metrics={metrics}
            settings={settings}
            auditLogs={auditLogs}
            feedbackRecords={feedbackRecords}
            onRefreshAll={loadAllData}
            onReviewComplaint={handleReviewComplaint}
            onSaveDepartment={handleSaveDepartment}
            onSaveSettings={handleSaveSettings}
            onExportCSV={handleExportCSV}
          />
        )}

        {currentTab === 'tests' && <AutomatedTestRunner />}

        {currentTab === 'patent' && <PatentDocumentationViewer />}
      </main>

      {/* Floating Gemini AI Assistant Bubble & Window */}
      {!isChatOpen && (
        <button
          id="floating-gemini-assistant-btn"
          onClick={() => setIsChatOpen(true)}
          className="fixed bottom-5 right-5 z-40 p-3.5 bg-[#2C3E50] hover:bg-[#1E2B37] text-white rounded-full shadow-2xl border-2 border-[#8A9A5B] flex items-center gap-2 transition hover:scale-105"
          title="Open Gemini AI Grievance Assistant"
        >
          <Sparkles className="w-5 h-5 text-[#8A9A5B]" />
          <span className="text-xs font-semibold pr-1 font-sans hidden sm:inline">Ask Gemini</span>
        </button>
      )}

      {isChatOpen && (
        <GeminiChatbot
          currentUser={currentUser}
          isOpen={isChatOpen}
          onClose={() => setIsChatOpen(false)}
        />
      )}

      {/* Institutional Footer - Natural Tones Theme */}
      <footer className="bg-[#F4F1EA] border-t border-[#E8E6E1] py-5 text-xs text-[#6B7C8E]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#8A9A5B]" />
            <span className="font-serif italic font-semibold text-[#2C3E50]">UnivComplaint Intelligence</span>
            <span className="text-[#DED9CE]">•</span>
            <span className="text-[11px] uppercase tracking-wider text-[#6B7C8E]">Gemini 3.7 Flash NLP & Hybrid Safety Engine</span>
          </div>
          <div className="flex items-center gap-4 text-[10px] uppercase font-bold tracking-widest text-[#7D8B99]">
            <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-[#8A9A5B]"></span> Human-in-the-Loop</span>
            <span>•</span>
            <span>Audit Trail Verified</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
