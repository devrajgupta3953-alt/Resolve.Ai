export type UrgencyLevel = 'LOW' | 'MEDIUM' | 'HIGH';

export type ComplaintStatus =
  | 'SUBMITTED'
  | 'ANALYSING'
  | 'REVIEW_REQUIRED'
  | 'ROUTED'
  | 'ASSIGNED'
  | 'IN_PROGRESS'
  | 'AWAITING_INFORMATION'
  | 'RESOLVED'
  | 'CLOSED'
  | 'ESCALATED'
  | 'REOPENED'
  | 'REJECTED';

export type UserRole = 'STUDENT' | 'STAFF' | 'ADMIN';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  departmentId?: string;
  studentIdNumber?: string;
  program?: string;
  active: boolean;
  createdAt: string;
}

export interface Department {
  id: string;
  name: string;
  code: string;
  description: string;
  email: string;
  active: boolean;
  categories: string[];
  staffCount?: number;
  escalationHours: number; // SLA hours
  backupDepartmentId?: string;
  priorityHandlingRules?: string;
}

export interface AIAnalysis {
  id: string;
  complaintId: string;
  model: string;
  summary: string;
  category: string;
  subcategory: string;
  urgency: UrgencyLevel;
  urgencyConfidence: number; // 0.0 to 1.0
  urgencyReason: string;
  suggestedDepartment: string; // Department code or ID
  departmentConfidence: number; // 0.0 to 1.0
  alternativeDepartment?: string;
  riskFlags: string[];
  entities: {
    location?: string | null;
    peopleInvolved?: string[] | null;
    incidentDate?: string | null;
    deadline?: string | null;
    equipmentOrItem?: string | null;
  };
  detectedLanguage: string;
  normalizedEnglishText?: string;
  missingInformation: string[];
  requiresHumanReview: boolean;
  recommendedAction: string;
  processingTimeMs: number;
  createdAt: string;
  status: 'SUCCESS' | 'FAILED' | 'FALLBACK';
}

export interface RuleEvaluationResult {
  aiUrgency: UrgencyLevel;
  ruleUrgency: UrgencyLevel;
  finalUrgency: UrgencyLevel;
  ruleTriggered: boolean;
  triggeredRules: string[];
  confidenceStatus: 'AUTO_ACCEPT' | 'NEEDS_REVIEW' | 'GENERAL_QUEUE';
  requiresHumanReview: boolean;
  routingScore: {
    primaryDept: string;
    score: number;
    explanation: string;
    secondaryDept?: string;
  };
}

export interface InternalNote {
  id: string;
  complaintId: string;
  authorId: string;
  authorName: string;
  authorRole: UserRole;
  text: string;
  createdAt: string;
}

export interface StatusUpdate {
  id: string;
  complaintId: string;
  actorId: string;
  actorName: string;
  actorRole: UserRole;
  previousStatus: ComplaintStatus;
  newStatus: ComplaintStatus;
  comment?: string;
  createdAt: string;
}

export interface StudentClarification {
  id: string;
  complaintId: string;
  requestedByStaffId?: string;
  requestedByName?: string;
  requestText: string;
  responseText?: string;
  requestedAt: string;
  respondedAt?: string;
}

export interface ComplaintAttachment {
  id: string;
  name: string;
  size: number;
  type: string;
  url?: string;
}

export interface Complaint {
  id: string;
  trackingNumber: string; // e.g. CMP-2026-1042
  studentId: string;
  studentName: string;
  studentEmail: string;
  studentProgram?: string;
  title: string;
  description: string;
  detectedLanguage?: string;
  
  // Optional structured fields provided by student
  studentSelectedCategory?: string;
  studentSelectedDepartment?: string;
  campusLocation?: string;
  courseOrProgram?: string;
  academicYearOrSemester?: string;
  incidentDate?: string;
  isOngoing: boolean;
  attachments?: ComplaintAttachment[];
  
  // Workflow & Classification State
  category?: string;
  subcategory?: string;
  urgency: UrgencyLevel;
  assignedDepartmentId?: string;
  assignedDepartmentName?: string;
  assignedStaffId?: string;
  assignedStaffName?: string;
  
  status: ComplaintStatus;
  humanVerified: boolean;
  humanOverrideApplied: boolean;
  
  aiAnalysis?: AIAnalysis;
  ruleEvaluation?: RuleEvaluationResult;
  
  // Review details
  reviewedById?: string;
  reviewedByName?: string;
  reviewedAt?: string;
  overrideReason?: string;
  
  // SLA tracking
  escalationDeadline?: string;
  isEscalated: boolean;
  
  // Student satisfaction
  studentFeedback?: {
    satisfactionScore: number; // 1 to 5
    comment?: string;
    markedAsResolved: boolean;
    submittedAt: string;
  };
  
  // Potential duplicate markers
  possibleDuplicateOf?: string[];
  
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
  closedAt?: string;
}

export interface AuditLog {
  id: string;
  complaintId: string;
  trackingNumber?: string;
  actorId: string;
  actorName: string;
  actorRole: UserRole;
  action:
    | 'SUBMITTED'
    | 'AI_ANALYSED'
    | 'URGENCY_SET'
    | 'ROUTED'
    | 'REASSIGNED'
    | 'URGENCY_OVERRIDDEN'
    | 'DEPARTMENT_OVERRIDDEN'
    | 'STAFF_VIEWED'
    | 'NOTE_ADDED'
    | 'INFO_REQUESTED'
    | 'INFO_PROVIDED'
    | 'STATUS_CHANGED'
    | 'ESCALATED'
    | 'RESOLVED'
    | 'CLOSED'
    | 'REOPENED'
    | 'FEEDBACK_RECORDED';
  oldValue?: string;
  newValue?: string;
  reason?: string;
  createdAt: string;
}

export interface AIFeedbackRecord {
  id: string;
  complaintId: string;
  trackingNumber: string;
  aiAnalysisId?: string;
  feedbackType:
    | 'WRONG_CATEGORY'
    | 'WRONG_URGENCY'
    | 'WRONG_DEPARTMENT'
    | 'MISSING_CONTEXT'
    | 'INSUFFICIENT_INFO'
    | 'OTHER';
  originalAISuggestion: {
    category?: string;
    urgency?: UrgencyLevel;
    department?: string;
    confidence?: number;
  };
  humanCorrection: {
    category?: string;
    urgency?: UrgencyLevel;
    department?: string;
  };
  explanation?: string;
  reviewerId: string;
  reviewerName: string;
  reviewerRole: UserRole;
  createdAt: string;
}

export interface SystemSettings {
  confidenceThresholdHigh: number; // e.g. 0.80 -> Auto route provisionally
  confidenceThresholdMedium: number; // e.g. 0.60 -> Needs Review
  defaultSlaHoursLow: number;
  defaultSlaHoursMedium: number;
  defaultSlaHoursHigh: number;
  autoEscalationEnabled: boolean;
  allowedAttachmentTypes: string[];
  maxAttachmentSizeBytes: number;
  supportedLanguages: string[];
  safetyOverrideRulesEnabled: boolean;
}

export interface DashboardMetrics {
  totalComplaints: number;
  openComplaints: number;
  highUrgencyCount: number;
  mediumUrgencyCount: number;
  lowUrgencyCount: number;
  awaitingReviewCount: number;
  inProgressCount: number;
  resolvedCount: number;
  escalatedCount: number;
  avgResolutionTimeHours: number;
  aiHumanAgreementRate: number; // 0 to 100%
  urgencyOverrideRate: number;
  deptOverrideRate: number;
  totalFeedbackCount: number;
  slaBreachCount: number;
  
  byUrgency: { name: string; value: number; color: string }[];
  byDepartment: { name: string; count: number; code: string }[];
  byCategory: { name: string; count: number }[];
  byStatus: { name: string; count: number }[];
  trendOverTime: { date: string; count: number; resolved: number }[];
  workloadByDept: { department: string; open: number; resolved: number; avgHours: number }[];
}

export interface TestResultItem {
  id: string;
  suite: string;
  name: string;
  status: 'PASSED' | 'FAILED' | 'SKIPPED';
  durationMs: number;
  message?: string;
  details?: any;
}

export interface TestRunResponse {
  total: number;
  passed: number;
  failed: number;
  durationMs: number;
  results: TestResultItem[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model' | 'system';
  content: string;
  timestamp: string;
  modelUsed?: string;
  audioAttached?: boolean;
}

export interface VoiceSessionState {
  isActive: boolean;
  status: 'idle' | 'listening' | 'transcribing' | 'speaking' | 'connected' | 'error';
  transcript: string;
  liveResponse: string;
  lastError?: string;
}
