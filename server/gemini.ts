import { GoogleGenAI, Type } from '@google/genai';
import { AIAnalysis, Department, UrgencyLevel } from '../src/types';

// Server-side lazy initialization for GoogleGenAI
let aiClient: GoogleGenAI | null = null;

function getGenAI(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return null;
  }
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

export async function analyzeComplaintWithGemini(
  complaintId: string,
  title: string,
  description: string,
  structuredFields: {
    campusLocation?: string;
    courseOrProgram?: string;
    semester?: string;
    incidentDate?: string;
    isOngoing?: boolean;
    studentCategory?: string;
    studentDepartment?: string;
  },
  availableDepartments: Department[]
): Promise<AIAnalysis> {
  const startTime = Date.now();
  const departmentListStr = availableDepartments
    .map((d) => `${d.code} (${d.name}): Handles ${d.categories.join(', ')}`)
    .join('\n');

  const deptCodes = availableDepartments.map((d) => d.code);

  const systemInstruction = `You are an AI complaint-analysis decision-support component inside an educational institution's student complaint-management system.
Your task is to analyze the supplied student complaint and return structured classification information.
You must NOT invent facts, speculate without grounding, or make final institutional/legal determinations.
Your purpose is to assist authorized human staff.

Allowed Urgency levels:
- LOW: Non-critical suggestions, cosmetic issues, minor administrative inquiries with no immediate consequence.
- MEDIUM: Repeated unresolved service failures, academic progress hurdles, fee/refund issues, approaching deadlines, moderate infrastructure faults.
- HIGH: Potential immediate physical safety hazards (e.g. electrical shock, fire, gas, structural collapse), severe harassment/threat/ragging/discrimination, medical emergencies, imminent academic disqualification.

Available Departments:
${departmentListStr}

Available Department Codes:
${deptCodes.join(', ')}

Guidelines:
1. Detect the original language (English, Hindi, Hinglish, etc.). If not in English, provide a clear normalized English representation.
2. Extract factual summary, category, subcategory, entities (location, dates, deadlines, equipment), risk flags, missing information.
3. If uncertainty exists, lower the confidence score and set requiresHumanReview = true.
4. Keep explanations concise, factual, and direct.`;

  const prompt = `Student Complaint Input:
Title: ${title}
Description: ${description}
Additional Context:
- Campus / Location: ${structuredFields.campusLocation || 'Not specified'}
- Course / Program: ${structuredFields.courseOrProgram || 'Not specified'}
- Semester: ${structuredFields.semester || 'Not specified'}
- Incident Date: ${structuredFields.incidentDate || 'Not specified'}
- Ongoing Issue: ${structuredFields.isOngoing ? 'Yes' : 'No'}
- Student Suggested Category: ${structuredFields.studentCategory || 'None'}
- Student Suggested Department: ${structuredFields.studentDepartment || 'None'}

Perform comprehensive NLP analysis and return strictly valid JSON matching the schema.`;

  const ai = getGenAI();

  if (!ai) {
    // Graceful rule-based fallback when Gemini API key is not yet configured
    console.warn('Gemini API key not configured. Using deterministic AI emulation fallback.');
    return generateFallbackAIAnalysis(complaintId, title, description, structuredFields, availableDepartments, startTime);
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.7-flash',
      contents: prompt,
      config: {
        systemInstruction,
        temperature: 0.1,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING, description: 'Short factual 1-2 sentence summary' },
            category: { type: Type.STRING, description: 'High-level category e.g. HOSTEL, FACILITIES, ACADEMICS, IT, FINANCE, SAFETY, LIBRARY, TRANSPORT' },
            subcategory: { type: Type.STRING, description: 'Specific subcategory' },
            urgency: { type: Type.STRING, enum: ['LOW', 'MEDIUM', 'HIGH'], description: 'Urgency level' },
            urgency_confidence: { type: Type.NUMBER, description: 'Confidence between 0.0 and 1.0' },
            urgency_reason: { type: Type.STRING, description: 'Concise explanation for assigned urgency' },
            suggested_department: { type: Type.STRING, description: 'Must match one of available department codes' },
            department_confidence: { type: Type.NUMBER, description: 'Confidence between 0.0 and 1.0' },
            alternative_department: { type: Type.STRING, description: 'Secondary department code if applicable' },
            risk_flags: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'e.g. POTENTIAL_SAFETY_HAZARD, HARASSMENT_DISCRIMINATION, ACADEMIC_CONSEQUENCE, FINANCIAL_DISCREPANCY, INFRASTRUCTURE_FAILURE'
            },
            entities: {
              type: Type.OBJECT,
              properties: {
                location: { type: Type.STRING, nullable: true },
                incident_date: { type: Type.STRING, nullable: true },
                deadline: { type: Type.STRING, nullable: true },
                equipment_or_item: { type: Type.STRING, nullable: true }
              }
            },
            detected_language: { type: Type.STRING, description: 'e.g. English, Hindi, Hinglish' },
            normalized_english_text: { type: Type.STRING, description: 'Normalized English translation if non-English' },
            missing_information: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            requires_human_review: { type: Type.BOOLEAN, description: 'True if high risk, low confidence, or sensitive' },
            recommended_action: { type: Type.STRING, description: 'Recommended immediate operational action' }
          },
          required: [
            'summary',
            'category',
            'subcategory',
            'urgency',
            'urgency_confidence',
            'urgency_reason',
            'suggested_department',
            'department_confidence',
            'risk_flags',
            'requires_human_review',
            'recommended_action'
          ]
        }
      }
    });

    const responseText = response.text || '{}';
    const parsed = JSON.parse(responseText);
    const processingTimeMs = Date.now() - startTime;

    // Validate department code against available
    let validDept = parsed.suggested_department;
    if (!deptCodes.includes(validDept)) {
      const match = availableDepartments.find(
        (d) =>
          d.code.toLowerCase() === (validDept || '').toLowerCase() ||
          d.name.toLowerCase().includes((validDept || '').toLowerCase())
      );
      validDept = match ? match.code : availableDepartments[0]?.code || 'GENERAL_ADMIN';
    }

    const urgencyVal: UrgencyLevel = ['LOW', 'MEDIUM', 'HIGH'].includes(parsed.urgency)
      ? (parsed.urgency as UrgencyLevel)
      : 'MEDIUM';

    return {
      id: `ai-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      complaintId,
      model: 'gemini-3.7-flash',
      summary: parsed.summary || title,
      category: (parsed.category || 'GENERAL').toUpperCase(),
      subcategory: (parsed.subcategory || 'GENERAL_INQUIRY').toUpperCase(),
      urgency: urgencyVal,
      urgencyConfidence: typeof parsed.urgency_confidence === 'number' ? Math.min(Math.max(parsed.urgency_confidence, 0), 1) : 0.85,
      urgencyReason: parsed.urgency_reason || 'Urgency determined based on reported impact and facts.',
      suggestedDepartment: validDept,
      departmentConfidence: typeof parsed.department_confidence === 'number' ? Math.min(Math.max(parsed.department_confidence, 0), 1) : 0.88,
      alternativeDepartment: parsed.alternative_department,
      riskFlags: Array.isArray(parsed.risk_flags) ? parsed.risk_flags : [],
      entities: {
        location: parsed.entities?.location || structuredFields.campusLocation || null,
        incidentDate: parsed.entities?.incident_date || structuredFields.incidentDate || null,
        deadline: parsed.entities?.deadline || null,
        equipmentOrItem: parsed.entities?.equipment_or_item || null,
      },
      detectedLanguage: parsed.detected_language || 'English',
      normalizedEnglishText: parsed.normalized_english_text || description,
      missingInformation: Array.isArray(parsed.missing_information) ? parsed.missing_information : [],
      requiresHumanReview: Boolean(parsed.requires_human_review || urgencyVal === 'HIGH'),
      recommendedAction: parsed.recommended_action || (urgencyVal === 'HIGH' ? 'Immediate human review and escalation' : 'Standard department queue routing'),
      processingTimeMs,
      createdAt: new Date().toISOString(),
      status: 'SUCCESS',
    };
  } catch (error) {
    console.error('Gemini API execution error:', error);
    return generateFallbackAIAnalysis(complaintId, title, description, structuredFields, availableDepartments, startTime);
  }
}

// Deterministic heuristic fallback when Gemini API is unavailable or throws
function generateFallbackAIAnalysis(
  complaintId: string,
  title: string,
  description: string,
  structuredFields: any,
  departments: Department[],
  startTime: number
): AIAnalysis {
  const combined = `${title} ${description}`.toLowerCase();
  let urgency: UrgencyLevel = 'LOW';
  let category = 'GENERAL';
  let subcategory = 'GENERAL_REQUEST';
  let suggestedDept = 'GENERAL_ADMIN';
  const riskFlags: string[] = [];
  let urgencyReason = 'Routine administrative inquiry or minor issue.';
  let requiresHumanReview = false;
  let urgencyConfidence = 0.85;
  let departmentConfidence = 0.85;

  // Language check heuristics
  const hasHindiKeywords = /[\u0900-\u097F]|(kripya|mera|meri|nahi|chal\s*raha|pani|bijli|kamra|pareshani|sikayat)/i.test(combined);
  const detectedLanguage = hasHindiKeywords ? (combined.includes('kripya') || combined.includes('nahi') ? 'Hinglish' : 'Hindi') : 'English';

  // Safety & High Risk
  if (/(exposed|wiring|electric|shock|spark|fire|gas\s*leak|collapse|threat|harass|assault|ragging|emergency|bleeding)/i.test(combined)) {
    urgency = 'HIGH';
    urgencyConfidence = 0.94;
    urgencyReason = 'Detected high-risk physical safety or severe harassment hazard.';
    riskFlags.push('POTENTIAL_SAFETY_HAZARD');
    requiresHumanReview = true;
    if (/(wiring|electric|shock|spark|collapse|leak)/i.test(combined)) {
      category = 'FACILITIES';
      subcategory = 'ELECTRICAL_OR_STRUCTURAL_HAZARD';
      suggestedDept = 'FACILITIES';
    } else {
      category = 'SAFETY';
      subcategory = 'CAMPUS_SECURITY';
      suggestedDept = 'SECURITY';
    }
  } else if (/(wifi|internet|network|portal|login|password|laptop|lab\s*pc|server|erp)/i.test(combined)) {
    category = 'IT';
    subcategory = 'NETWORK_CONNECTIVITY';
    suggestedDept = 'IT_SUPPORT';
    urgency = /(not\s*working\s*for\s*\d+|exam|deadline|portal\s*down)/i.test(combined) ? 'MEDIUM' : 'LOW';
    urgencyReason = urgency === 'MEDIUM' ? 'Prolonged connectivity or system access failure.' : 'Routine IT service request.';
  } else if (/(fee|charged\s*twice|refund|payment|tuition|scholarship|receipt|fine)/i.test(combined)) {
    category = 'FINANCE';
    subcategory = 'PAYMENT_DISCREPANCY';
    suggestedDept = 'FINANCE';
    urgency = 'MEDIUM';
    urgencyConfidence = 0.91;
    urgencyReason = 'Financial transaction discrepancy requiring accounting verification.';
  } else if (/(hostel|room|mess|geyser|bed|almirah|warden|curfew|bathroom|cleanliness)/i.test(combined)) {
    category = 'HOSTEL';
    subcategory = 'ROOM_MAINTENANCE';
    suggestedDept = 'HOSTEL_ADMIN';
    urgency = /(leak|overflow|broken|two\s*weeks|days)/i.test(combined) ? 'MEDIUM' : 'LOW';
    urgencyReason = 'Hostel facility maintenance and living condition concern.';
  } else if (/(exam|grades|hall\s*ticket|professor|attendance|curriculum|marksheet|transcript)/i.test(combined)) {
    category = 'ACADEMICS';
    subcategory = 'EXAMINATION_OR_GRADES';
    suggestedDept = 'ACADEMIC_AFFAIRS';
    urgency = /(deadline|tomorrow|hall\s*ticket|missing\s*marks)/i.test(combined) ? 'MEDIUM' : 'LOW';
    urgencyReason = 'Academic evaluation or course administration concern.';
  } else if (/(library|book|journal|study\s*room|due\s*date)/i.test(combined)) {
    category = 'LIBRARY';
    subcategory = 'LIBRARY_SERVICES';
    suggestedDept = 'LIBRARY';
    urgency = 'LOW';
    urgencyReason = 'Library resource management or timing request.';
  } else if (/(bus|transport|shuttle|route|driver|timing)/i.test(combined)) {
    category = 'TRANSPORT';
    subcategory = 'BUS_SERVICE';
    suggestedDept = 'TRANSPORT';
    urgency = 'LOW';
    urgencyReason = 'Institutional transport service feedback.';
  }

  // Ensure department exists
  const deptExists = departments.find((d) => d.code === suggestedDept);
  if (!deptExists) {
    suggestedDept = departments[0]?.code || 'GENERAL_ADMIN';
  }

  return {
    id: `ai-fallback-${Date.now()}`,
    complaintId,
    model: 'gemini-3.7-flash (deterministic fallback)',
    summary: title,
    category,
    subcategory,
    urgency,
    urgencyConfidence,
    urgencyReason,
    suggestedDepartment: suggestedDept,
    departmentConfidence,
    alternativeDepartment: suggestedDept === 'HOSTEL_ADMIN' ? 'FACILITIES' : undefined,
    riskFlags,
    entities: {
      location: structuredFields.campusLocation || null,
      incidentDate: structuredFields.incidentDate || null,
      deadline: null,
      equipmentOrItem: null,
    },
    detectedLanguage,
    normalizedEnglishText: description,
    missingInformation: [],
    requiresHumanReview: requiresHumanReview || urgency === 'HIGH',
    recommendedAction: urgency === 'HIGH' ? 'Immediate human review and escalation' : 'Route to department queue',
    processingTimeMs: Date.now() - startTime,
    createdAt: new Date().toISOString(),
    status: 'FALLBACK',
  };
}
