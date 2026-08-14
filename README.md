# Student Complaint Intelligence & Automated Department Routing System

An AI-assisted institutional complaint management and decision-support platform designed for universities, colleges, schools, and educational organizations.

The system ingests natural-language student complaints, performs structured natural language understanding (NLP) using server-side Gemini AI (`gemini-3.7-flash`), executes deterministic safety and risk rule evaluations, computes confidence-calibrated routing scores, automatically routes tickets to relevant departments, provides a Human-in-the-Loop review queue for high-risk or low-confidence issues, and records structured staff corrections for continuous model evaluation.

---

## Key Features

1. **Natural Language Complaint Ingestion & Multilingual Support**
   - Natural language input with optional context fields (location, program, semester, incident date, ongoing status, attachments).
   - Language detection (English, Hindi, Hinglish) with internal normalized English representations while preserving original student submissions.
2. **Structured AI Semantic Analysis**
   - Uses server-side `@google/genai` (`gemini-3.7-flash`) with structured JSON schema constraints.
   - Extracts factual summary, category, subcategory, urgency, urgency confidence ($0.0 - 1.0$), suggested department, department confidence ($0.0 - 1.0$), alternative department, risk indicators, and extracted entities.
3. **Hybrid AI + Deterministic Rule Engine**
   - Combines probabilistic AI predictions with hard deterministic safety rules (e.g. electrical hazards, fire, gas leaks, structural collapse, harassment allegations).
   - Protective upward elevation: Deterministic safety rules act as an authoritative shield around AI predictions.
4. **Confidence-Calibrated Routing & Transparent Scoring**
   - Configurable confidence thresholds ($\ge 0.80$ Auto-Route, $0.60 - 0.79$ Needs Review, $< 0.60$ General Queue).
   - Transparent routing score computation with human-readable explanations.
5. **Human-in-the-Loop Review Queue**
   - Dedicated review workspace for institutional reviewers to approve, override urgency, reassign department, escalate, or request clarification.
6. **Structured Feedback Loop**
   - Captures categorized feedback reasons whenever a human overrides an AI recommendation (*Wrong Category, Wrong Urgency, Wrong Department, Missing Context, Insufficient Information*).
7. **Role-Based Portals & Privacy Isolation**
   - **Student Portal:** Submit complaints, track status with a visual timeline, answer clarification queries, rate satisfaction. Internal staff notes and raw confidence metrics are strictly hidden.
   - **Department Staff Portal:** Department queue, urgency filters, AI insight workspace, internal notes, request clarification, status updates.
   - **Administrator Portal:** Executive KPI cards, Recharts visualizations, Human Review Queue, Department & Routing Configuration, AI Performance analytics, full Audit Trail, and CSV export.
8. **Automated Test Suite Runner**
   - Built-in interactive test laboratory executing tests across validation, rule engine, department routing, access controls, and audit integrity.
9. **Patent Documentation & Mermaid Architecture Diagrams**
   - Comprehensive technical description file (`PATENT_TECHNICAL_DESCRIPTION.md`) featuring 8 technical figures.

---

## System Architecture

```
Student Portal / Staff Workspace / Admin Dashboard (React + Tailwind CSS + Lucide + Recharts)
                                      │
                                      ▼ HTTPS
                            Express.js Server (Port 3000)
                                      │
         ┌────────────────────────────┼───────────────────────────┐
         ▼                            ▼                           ▼
[Authentication & RBAC]   [Server-Side Gemini AI API]    [Deterministic Rule Engine]
         │                            │                           │
         └────────────────────────────┼───────────────────────────┘
                                      ▼
                       [Database & Audit Manager]
```

---

## Quick Start & Running the Application

### 1. Environment Variables
The application reads the Gemini API key securely from `process.env.GEMINI_API_KEY`.
When running in Google AI Studio, this key is automatically injected from your Secrets panel.

For local execution, create a `.env` file:
```env
GEMINI_API_KEY="your-gemini-api-key"
```

### 2. Development Mode
```bash
npm run dev
```
The server starts at `http://0.0.0.0:3000`.

### 3. Production Build & Start
```bash
npm run build
npm start
```

---

## Pre-Loaded Demo Accounts

The system includes pre-seeded accounts for testing all institutional roles:

| Role | Name | Email | Jurisdiction / Notes |
|---|---|---|---|
| **Administrator** | Dr. Evelyn Vance | `admin@university.edu` | Full system control, human review queue, analytics, settings |
| **Department Staff** | Rajesh Kumar | `rajesh.facilities@university.edu` | Facilities & Maintenance Department Head |
| **Department Staff** | Anita Sharma | `anita.hostel@university.edu` | Hostel Administration Warden |
| **Department Staff** | David Chen | `david.it@university.edu` | IT Support & Systems Engineer |
| **Department Staff** | Priya Patel | `priya.finance@university.edu` | Finance & Accounts Officer |
| **Student** | Aarav Mehta | `aarav.mehta@student.edu` | B.Tech Computer Science (3rd Year) |
| **Student** | Rohan Deshmukh | `rohan.d@student.edu` | B.Com Accounting (Final Year) |

*Use the quick role switcher in the top navigation bar to test the application from any perspective.*

---

## Automated Test Suite

Navigate to the **Automated Tests** tab in the top navigation bar to run end-to-end integration tests:
- **Suite 1:** Complaint Validation & Title/Description Constraints
- **Suite 2:** Deterministic Rule Engine Safety Keyword Triggers
- **Suite 3:** Department Routing & Low-Confidence Fallback
- **Suite 4:** Cross-Student Privacy Isolation & Staff Department Scoping
- **Suite 5:** Structured Feedback Recording & Immutable Audit Logs

---

## License & Compliance
Designed as an institutional SaaS MVP adhering to WCAG AA accessibility guidelines, role-based data isolation, and server-side secret management.
