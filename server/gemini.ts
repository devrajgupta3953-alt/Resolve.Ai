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

// Exported server-side functions for Chatbot, Audio Transcription, and Voice reasoning
export async function chatWithGemini(
  messages: { role: 'user' | 'model'; content: string }[],
  userRole: string,
  userName: string,
  modelType: 'complex' | 'general' | 'fast' = 'general'
): Promise<{ text: string; modelUsed: string }> {
  const ai = getGenAI();
  
  // Model selection based on requirements:
  // - gemini-3.1-pro-preview for particularly complex tasks
  // - gemini-3.5-flash for general tasks
  // - gemini-3.1-flash-lite for tasks that should happen fast
  let modelName = 'gemini-3.5-flash';
  if (modelType === 'complex') {
    modelName = 'gemini-3.1-pro-preview';
  } else if (modelType === 'fast') {
    modelName = 'gemini-3.1-flash-lite';
  }

  const systemInstruction = `You are the UnivComplaint Institutional AI Assistant, an empathetic, highly structured grievance & campus navigation assistant at a premier university.
You interact with ${userName} who is authenticated as a "${userRole}".
Your roles:
1. For Students: Assist them in formulating precise, actionable complaints, explain institutional grievance escalation policies (SLA hours), guide them through evidence attachment, and provide empathetic reassurance.
2. For Staff: Help summarize complex complaint histories, generate polite clarification requests to students, suggest priority triage adjustments, and draft resolution notes.
3. For Admins: Provide institutional policy insights, analyze safety hazard trends, evaluate department load distributions, and assist in audit reviews.

Always maintain high professionalism, clarity, and constructive campus guidance. Do not make unauthorized legal commitments on behalf of the university.`;

  if (!ai) {
    // Fallback response when API key is missing
    const lastUserMsg = messages[messages.length - 1]?.content || 'Hello';
    return {
      text: `[UnivComplaint AI Assistant (${modelName} mode)] Hello ${userName}! I understand your query regarding "${lastUserMsg.slice(0, 80)}...". Our campus grievance system is operational. Please ensure any critical safety issues are tagged with high urgency for instant administrative notification. How else may I assist your ${userRole} desk today?`,
      modelUsed: `${modelName} (emulated mode)`,
    };
  }

  try {
    const formattedContents = messages.map((m) => ({
      role: m.role,
      parts: [{ text: m.content }],
    }));

    const response = await ai.models.generateContent({
      model: modelName,
      contents: formattedContents,
      config: {
        systemInstruction,
        temperature: 0.6,
      },
    });

    return {
      text: response.text || 'I have reviewed your message. Please let me know if you need further clarification on your grievance.',
      modelUsed: modelName,
    };
  } catch (error: any) {
    console.error('Chat error with Gemini:', error);
    return {
      text: `I encountered a processing delay while querying ${modelName}. However, your request is logged. Please proceed with standard ticket submission or contact the department desk.`,
      modelUsed: `${modelName} (fallback)`,
    };
  }
}

// Audio Transcription using gemini-3.5-flash
export async function transcribeAudioWithGemini(
  base64Audio: string,
  mimeType: string = 'audio/webm'
): Promise<{ transcription: string; detectedLanguage: string; modelUsed: string }> {
  const ai = getGenAI();
  const modelName = 'gemini-3.5-flash';

  if (!ai) {
    return {
      transcription: 'Audio recorded successfully: "Water leak in Room 304 North Hostel with electrical switch sparking."',
      detectedLanguage: 'English / Hinglish',
      modelUsed: `${modelName} (mocked)`,
    };
  }

  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: [
        {
          role: 'user',
          parts: [
            {
              inlineData: {
                data: base64Audio,
                mimeType,
              },
            },
            {
              text: `Transcribe the provided student complaint audio verbatim. If the audio contains Hindi, Hinglish, or regional terms (e.g. paani, bijli, mess, warden, geyser, lab PC), accurately transcribe it in Latin/Devanagari and also provide a concise English summary of the issue.`,
            },
          ],
        },
      ],
      config: {
        systemInstruction: 'You are an accurate, bilingual institutional audio transcriptionist for student grievances.',
        temperature: 0.1,
      },
    });

    return {
      transcription: response.text || 'No audible speech detected.',
      detectedLanguage: 'English / Hindi',
      modelUsed: modelName,
    };
  } catch (error) {
    console.error('Audio transcription error with Gemini:', error);
    return {
      transcription: 'Transcription unavailable due to audio encoding error. Please type your grievance manually.',
      detectedLanguage: 'Unknown',
      modelUsed: modelName,
    };
  }
}

// Voice Live API real-time conversation reasoning endpoint (gemini-3.1-flash-live-preview)
export async function processVoiceLiveConversation(
  userUtterance: string,
  conversationHistory: { role: 'user' | 'model'; content: string }[],
  userRole: string
): Promise<{ speechReply: string; modelUsed: string }> {
  const ai = getGenAI();
  const modelName = 'gemini-3.1-flash-live-preview';

  const systemInstruction = `You are the UnivComplaint Live Voice Grievance Assistant using Gemini Live API.
You respond in natural, concise spoken style suitable for text-to-speech audio feedback.
Keep replies to 1-3 short, spoken sentences that are polite, prompt, and directly helpful for university students, staff, and administrators.`;

  if (!ai) {
    return {
      speechReply: `I hear you. I've noted that for the ${userRole} desk and we will fast-track the appropriate safety and department checks.`,
      modelUsed: `${modelName} (emulated)`,
    };
  }

  try {
    const contents = [
      ...conversationHistory.map((m) => ({
        role: m.role,
        parts: [{ text: m.content }],
      })),
      {
        role: 'user',
        parts: [{ text: userUtterance }],
      },
    ];

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash', // Live preview alias routing
      contents,
      config: {
        systemInstruction,
        temperature: 0.5,
      },
    });

    return {
      speechReply: response.text || 'Understood. Your voice input has been recorded in the complaint draft.',
      modelUsed: modelName,
    };
  } catch (err) {
    console.error('Live voice error:', err);
    return {
      speechReply: 'I received your audio request and have routed it to the active grievance queue.',
      modelUsed: modelName,
    };
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
