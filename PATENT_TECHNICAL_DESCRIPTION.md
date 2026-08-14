# Patent-Oriented Technical Description

## Title of the Technical Concept
**Computer-Implemented System and Method for Natural-Language Complaint Processing, Multi-Factor Hybrid Urgency Assessment, Confidence-Calibrated Automated Department Routing, and Human-in-the-Loop Feedback Optimization**

---

## A. Technical Field & Problem Statement

### Technical Field
This disclosure relates generally to institutional information systems, enterprise workflow routing, and decision-support engines, and more specifically to computer-implemented systems for ingesting unstructured natural-language complaints, extracting structured multi-dimensional facts and risk indicators, performing hybrid probabilistic-deterministic urgency assessment, executing confidence-bounded departmental dispatch, and capturing structured human corrections for continual evaluation.

### Technical Problem
Traditional complaint-management systems in educational institutions and enterprise environments suffer from several systemic technical shortcomings:
1. **Manual Triage Bottlenecks:** Human administrators must manually read, categorize, and forward high volumes of natural-language complaints. This causes delays, backlogs, and subjective variability in urgency assignment.
2. **Safety Hazard Blind Spots:** Critical safety hazards (e.g., exposed electrical wiring, structural collapse, gas leaks, harassment allegations) can sit unnoticed in standard ticket queues because probabilistic natural-language classifiers may assign low priority based on lexical nuances.
3. **Uncontrolled Generative AI Hallucinations:** Deploying unrestricted generative AI chatbots directly to end users risks hallucinated policies, invalid departmental assignments, and uncalibrated decisions without deterministic safety boundaries.
4. **Lack of Calibrated Confidence & Fallbacks:** Existing systems lack a formal mechanism to separate high-confidence automated routing from low-confidence cases that require human intervention.
5. **Absence of Structured Human-in-the-Loop Feedback Loops:** When human operators correct an erroneous routing or urgency decision, the correction is typically lost as an ad-hoc database update rather than preserved as a structured comparative dataset for model evaluation and iterative refinement.

---

## B. Proposed Technical Solution & Core Architecture

The present system provides a closed-loop, multi-stage, computer-implemented architecture that processes natural-language student complaints through structured semantic analysis, deterministic safety overrides, confidence-bounded routing, and human-verified audit logging.

```
STUDENT SUBMISSION (Natural Language Text + Structured Context)
  │
  ▼
[Text Validation & Privacy Sanitization]
  │
  ▼
[Server-Side NLP / Gemini AI Analysis Service]
  │── Extracts: Category, Subcategory, Entities, Risk Flags, Urgency, Confidence, Department
  ▼
[Deterministic Hybrid Rule Engine]
  │── Evaluates: High-Risk Safety Keywords, Regulatory Rules, Confidence Thresholds
  ▼
[Transparent Routing Engine & Scoring Mechanism]
  │── Computes: Department Capability Match, Location Context, Historical Score
  ▼
[Decision Gate: Human Review Required vs. Auto-Route]
  ├── If High-Risk, Low Confidence (<0.80), or Flagged ──► [Human Review Queue]
  └── If High Confidence & Non-Hazardous ──────────────► [Department Processing Queue]
                                                               │
                                                               ▼
                                                  [Human Override / Acceptance]
                                                               │
                                                               ▼
                                                  [Structured Feedback Capture]
                                                               │
                                                               ▼
                                                  [Audit Trail & Performance Metrics]
```

---

## C. Detailed Technical Pipeline

1. **Input Ingestion & Multilingual Normalization:**
   - Ingests raw complaint title and natural-language text.
   - Detects original language (e.g., English, Hindi, Hinglish).
   - Generates an internal normalized English semantic representation while preserving the unaltered student submission for display and auditability.
2. **Structured NLP Extraction:**
   - Invokes server-side AI model (`gemini-3.7-flash`) with strict schema constraints to produce structured JSON containing: summary, category, subcategory, urgency, urgency confidence ($0.0 \le c_u \le 1.0$), urgency reason, suggested department, department confidence ($0.0 \le c_d \le 1.0$), alternative department, risk flags, extracted entities (locations, dates, deadlines, equipment), and missing information markers.
3. **Deterministic Safety & Risk Override Layer:**
   - Executes deterministic regex and pattern-matching rules over the complaint body.
   - Evaluates high-risk keywords (e.g., exposed wiring, gas leak, fire, sexual harassment, violence, elevator entrapment).
   - If a safety pattern triggers, the system authoritatively elevates final urgency to `HIGH` regardless of probabilistic AI outputs.
4. **Confidence Thresholding & Triage:**
   - Evaluates composite confidence $C = \min(c_u, c_d)$.
   - If $C \ge \theta_{\text{high}}$ (e.g., $0.80$) and non-hazardous: Provisionally auto-routes to primary department.
   - If $\theta_{\text{med}} \le C < \theta_{\text{high}}$ (e.g., $0.60 \le C < 0.80$): Flags complaint as `NEEDS_REVIEW`.
   - If $C < \theta_{\text{med}}$ (e.g., $< 0.60$): Routes to `GENERAL_REVIEW_QUEUE`.
5. **Department Capability Routing Score:**
   - Calculates a transparent routing score:
     $$\text{Routing Score} = S_{\text{base}} + (c_d \times W_{\text{conf}}) + S_{\text{cat\_match}}$$
6. **Human-in-the-Loop Review & Feedback Capture:**
   - When an authorized staff member or administrator approves or overrides an AI suggestion, the system records:
     $$\text{Feedback} = \langle \text{ComplaintId}, \text{AISuggestion}, \text{HumanCorrection}, \text{Reason}, \text{ReviewerId}, t \rangle$$
   - Stores corrections in a dedicated feedback repository for model evaluation and audit tracking.

---

## D. Technical Figures (Mermaid Representations)

### Figure 1: Overall System Architecture
```mermaid
graph TD
    Client[Student & Staff Web Client] -->|HTTPS REST| API[Express API Server]
    API --> Auth[Role-Based Authentication Engine]
    API --> NLP[Server-Side Gemini AI Service]
    API --> Rules[Deterministic Hybrid Rule Engine]
    API --> Routing[Transparent Routing Engine]
    API --> DB[(Persistent Database & Audit Store)]
    
    NLP -->|Structured JSON Schema| Rules
    Rules -->|Urgency + Confidence Assessment| Routing
    Routing -->|Review Required vs Routed| DB
    DB --> Audit[Immutable Audit Logger]
    DB --> Analytics[Real-Time Analytics & Feedback Engine]
```

### Figure 2: Complaint Processing Pipeline
```mermaid
sequenceDiagram
    autonumber
    actor Student
    participant API as Backend API
    participant AI as Gemini NLP Service
    participant Rule as Deterministic Rule Engine
    participant Router as Routing Engine
    participant DB as Persistent Storage
    actor Staff as Human Reviewer

    Student->>API: Submit Complaint(Title, Desc, Context)
    API->>API: Duplicate Detection Check
    API->>AI: Analyze(Natural Language + Context)
    AI-->>API: Structured Output(Category, Risk, Urgency, Conf)
    API->>Rule: EvaluateRules(AI Output, Safety Patterns, Thresholds)
    Rule-->>API: Hybrid Result(Final Urgency, HumanReviewFlag, Score)
    API->>Router: ComputeDepartment(Routing Score, Capabilities)
    Router-->>API: Target Department
    API->>DB: Save Complaint(Status: REVIEW_REQUIRED / ROUTED)
    alt Requires Human Review
        Staff->>API: Review/Override(NewUrgency, NewDept, Reason)
        API->>DB: Save Human Decision + Feedback Record
        API->>DB: Log Audit Entry
    else Auto-Routed
        API->>DB: Dispatch to Department Queue
    end
```

### Figure 3: AI Urgency and Confidence Decision Workflow
```mermaid
flowchart TD
    Start([Complaint Ingestion]) --> AI[Gemini Model Semantic Classification]
    AI --> Extract[Extract AI Urgency & AI Confidence]
    Extract --> SafetyCheck{Deterministic Safety Pattern Detected?}
    
    SafetyCheck -- Yes (Hazard Found) --> ForceHigh[Force Final Urgency = HIGH<br/>Flag Human Review = REQUIRED]
    SafetyCheck -- No --> ConfCheck{Confidence >= Threshold 0.80?}
    
    ConfCheck -- Yes --> CheckUrgency{Is AI Urgency HIGH?}
    CheckUrgency -- Yes --> ForceReview[Final Urgency = HIGH<br/>Flag Human Review = REQUIRED]
    CheckUrgency -- No --> AutoRoute[Set Final Urgency = AI Urgency<br/>Flag Human Review = FALSE]
    
    ConfCheck -- No --> ConfMed{Confidence >= 0.60?}
    ConfMed -- Yes --> NeedsReview[Set Status = NEEDS_REVIEW<br/>Route to Triage Queue]
    ConfMed -- No --> LowConf[Set Status = GENERAL_QUEUE<br/>Manual Classification Required]
    
    ForceHigh --> Route[Routing Layer]
    ForceReview --> Route
    AutoRoute --> Route
    NeedsReview --> Route
    LowConf --> Route
```

### Figure 4: Department Routing Mechanism
```mermaid
flowchart LR
    In[Extracted Category & Subcategory] --> CapCheck[Department Capability Matrix]
    CapCheck --> MatchDept[Match Department by Category Code]
    MatchDept --> ScoreCalc[Compute Routing Score:<br/>Base + DeptConfidence*40 + CatBonus]
    ScoreCalc --> ScoreCheck{Routing Score >= 75 & Conf >= 0.80?}
    ScoreCheck -- Yes --> AssignPrimary[Assign Primary Department Queue]
    ScoreCheck -- No --> AssignFallback[Assign Backup Department / Review Queue]
    AssignPrimary --> Log[Audit Decision with Transparent Score Rationale]
    AssignFallback --> Log
```

### Figure 5: Human-in-the-Loop Correction and Feedback Loop
```mermaid
flowchart TD
    Queue[Human Review Queue / Staff Workspace] --> StaffAction{Staff Decision}
    StaffAction -- Accept Recommendation --> Accept[Mark Human Verified = TRUE]
    StaffAction -- Override Urgency / Dept --> Override[Open Feedback Modal]
    
    Override --> Prompt[Capture: What was incorrect?<br/>Wrong Category / Urgency / Dept / Missing Context]
    Prompt --> Reason[Capture Explanatory Note]
    Reason --> SaveFB[Save Structured Feedback Record]
    SaveFB --> UpdateComplaint[Update Complaint Record with Override Details]
    UpdateComplaint --> AuditLog[Record Immutable Audit Trail Entry]
    AuditLog --> PerfMetrics[Update AI Agreement Rate & Confusion Metrics]
```

### Figure 6: Complaint Lifecycle State Machine
```mermaid
stateDiagram-v2
    [*] --> SUBMITTED: Student Submits Complaint
    SUBMITTED --> ANALYSING: Ingest & Process NLP
    ANALYSING --> REVIEW_REQUIRED: High Risk / Low Confidence
    ANALYSING --> ROUTED: High Confidence & Non-Hazard
    
    REVIEW_REQUIRED --> ROUTED: Human Reviewer Approves / Overrides
    REVIEW_REQUIRED --> REJECTED: Invalid / Duplicate Submission
    
    ROUTED --> ASSIGNED: Assigned to Staff Member
    ASSIGNED --> IN_PROGRESS: Staff Commences Work
    IN_PROGRESS --> AWAITING_INFORMATION: Clarification Requested from Student
    AWAITING_INFORMATION --> IN_PROGRESS: Student Provides Response
    
    IN_PROGRESS --> ESCALATED: SLA Deadline Breached
    ESCALATED --> IN_PROGRESS: Escalation Handled
    
    IN_PROGRESS --> RESOLVED: Staff Resolves Issue
    RESOLVED --> CLOSED: Student Confirms Satisfaction / Auto-Close
    RESOLVED --> REOPENED: Student Marks Issue Unresolved
    REOPENED --> IN_PROGRESS: Further Action Required
    CLOSED --> [*]
    REJECTED --> [*]
```

### Figure 7: Database & Data Relationship Diagram
```mermaid
erDiagram
    USERS ||--o{ COMPLAINTS : "submits / manages"
    DEPARTMENTS ||--o{ COMPLAINTS : "assigned to"
    COMPLAINTS ||--|| AI_ANALYSES : "analyzed by"
    COMPLAINTS ||--o{ AUDIT_LOGS : "generates"
    COMPLAINTS ||--o{ AI_FEEDBACK : "produces"
    COMPLAINTS ||--o{ INTERNAL_NOTES : "contains"
    COMPLAINTS ||--o{ CLARIFICATIONS : "tracks"

    USERS {
        string id PK
        string name
        string email
        string role
        string departmentId FK
    }

    DEPARTMENTS {
        string id PK
        string name
        string code
        string email
        int escalationHours
        boolean active
    }

    COMPLAINTS {
        string id PK
        string trackingNumber
        string studentId FK
        string title
        string description
        string category
        string urgency
        string status
        string assignedDepartmentId FK
        boolean humanVerified
        boolean humanOverrideApplied
    }

    AI_ANALYSES {
        string id PK
        string complaintId FK
        string model
        string urgency
        float urgencyConfidence
        string suggestedDepartment
        float departmentConfidence
        string riskFlags
    }

    AI_FEEDBACK {
        string id PK
        string complaintId FK
        string feedbackType
        string originalValue
        string correctedValue
        string explanation
        string reviewerId FK
    }

    AUDIT_LOGS {
        string id PK
        string complaintId FK
        string actorId FK
        string action
        string oldValue
        string newValue
        datetime createdAt
    }
```

### Figure 8: Failure & Fallback Mechanism
```mermaid
flowchart TD
    Req[Incoming Complaint] --> TryAI{AI Service Call}
    TryAI -- Success --> AIResult[Structured AI Analysis Output]
    TryAI -- Error / Timeout / Missing Key --> Fallback[Deterministic Heuristic Fallback Engine]
    
    Fallback --> ExtractKeywords[Deterministic Keyword & Pattern Matcher]
    ExtractKeywords --> SetFallbackStatus[Set AI Status = FALLBACK]
    SetFallbackStatus --> RequireReview[Flag requiresHumanReview = TRUE]
    
    AIResult --> DB[(Database Persistence)]
    RequireReview --> DB
    
    DB --> PersistCheck{Persistence Succeeded?}
    PersistCheck -- Yes --> Notify[Generate Tracking ID & Confirmation]
    PersistCheck -- No --> ErrorMsg[Return Clear Database Error to User]
```

---

## E. State Transition & Safety Guarantees

1. **No Data Loss Guarantee:** If external AI services fail or timeout, the system executes an internal deterministic heuristic fallback engine and guarantees the complaint is securely stored in a human review queue.
2. **Safety Shielding Principle:** Probabilistic machine learning model output is strictly subordinate to deterministic institutional safety rules. If any safety pattern is matched, the final urgency is enforced as `HIGH` with human review mandatory.
3. **Student Privacy Isolation:** Confidential internal staff notes, private administrative audit trails, and raw model confidence calculations are isolated on the server side and never sent to student endpoints.
4. **Structured Feedback Preservation:** Overrides are stored as structured tuples rather than free-form text, enabling quantitative tracking of human agreement rates and model performance.

*Disclaimer: This document is provided to preserve technical conception and system interactions for review by qualified patent professionals.*
