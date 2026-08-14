import { AIAnalysis, Complaint, Department, RuleEvaluationResult, SystemSettings, UrgencyLevel } from '../src/types';

// Deterministic keywords indicating high-risk physical, safety, or legal hazards
const HIGH_RISK_SAFETY_PATTERNS = [
  /\b(exposed\s+(electrical\s+)?wir(e|ing)|electric\s*shock|sparking|short\s*circuit)\b/i,
  /\b(fire|smoke|gas\s*leak|chemical\s*spill|flammable|explosion)\b/i,
  /\b(ceiling\s*collaps(e|ing)|falling\s*debris|structural\s*damage|wall\s*crack(ing)?)\b/i,
  /\b(harass(ment|ing)|sexual\s*assault|threat(en|ening)?|stalk(ing)?|physical\s*assault|ragging|bully(ing)?)\b/i,
  /\b(medical\s*emergency|unconscious|bleeding|severe\s*injury|poison(ing)?|ambulance)\b/i,
  /\b(weapon|gun|knife|suicide|self-harm|violent)\b/i,
  /\b(elevator\s*trap(ped)?|locked\s*inside\s*emergency)\b/i,
];

const MEDIUM_RISK_PATTERNS = [
  /\b(leak(ing|age)|water\s*seepage|plumbing\s*breakdown|overflow)\b/i,
  /\b(wifi|internet|network\s*down|portal\s*crash|server\s*down)\b/i,
  /\b(charged\s*twice|double\s*deduct(ion)?|fee\s*refund|scholarship\s*delay|payment\s*failure)\b/i,
  /\b(exam\s*hall\s*ticket|admit\s*card|grade\s*discrepancy|attendance\s*shortage)\b/i,
  /\b(mess\s*food|spoiled\s*food|food\s*poisoning\s*mild|hygiene\s*issue)\b/i,
  /\b(air\s*condition(er|ing)|ac\s*not\s*working|heater\s*broken|power\s*cut)\b/i,
  /\b(approaching\s*deadline|deadline\s*tomorrow|due\s*in\s*\d+\s*(day|hour)s?)\b/i,
];

export function evaluateDeterministicRules(
  complaintTitle: string,
  complaintDescription: string,
  aiAnalysis: AIAnalysis | null,
  settings: SystemSettings,
  departments: Department[]
): RuleEvaluationResult {
  const combinedText = `${complaintTitle} ${complaintDescription}`;
  const triggeredRules: string[] = [];
  let ruleUrgency: UrgencyLevel = 'LOW';
  let ruleTriggered = false;

  // 1. Check for High-Risk Deterministic Safety Rules
  for (const pattern of HIGH_RISK_SAFETY_PATTERNS) {
    if (pattern.test(combinedText)) {
      ruleUrgency = 'HIGH';
      ruleTriggered = true;
      triggeredRules.push(`Deterministic Safety Override: Detected safety hazard keyword matching [${pattern.source}]`);
    }
  }

  // 2. Check for Medium-Risk Deterministic Rules if not high
  if (ruleUrgency !== 'HIGH') {
    for (const pattern of MEDIUM_RISK_PATTERNS) {
      if (pattern.test(combinedText)) {
        ruleUrgency = 'MEDIUM';
        ruleTriggered = true;
        triggeredRules.push(`Operational Issue Rule: Detected infrastructure/financial/academic impact keyword [${pattern.source}]`);
      }
    }
  }

  // 3. Synthesize Hybrid Urgency
  const aiUrgency = aiAnalysis ? aiAnalysis.urgency : 'LOW';
  let finalUrgency: UrgencyLevel = aiUrgency;

  // Deterministic safety rules act as an authoritative upward protective layer
  if (settings.safetyOverrideRulesEnabled && ruleTriggered) {
    if (ruleUrgency === 'HIGH') {
      finalUrgency = 'HIGH';
    } else if (ruleUrgency === 'MEDIUM' && aiUrgency === 'LOW') {
      finalUrgency = 'MEDIUM';
    }
  }

  // 4. Evaluate Confidence Status
  const confidence = aiAnalysis ? Math.min(aiAnalysis.urgencyConfidence, aiAnalysis.departmentConfidence) : 0;
  let confidenceStatus: 'AUTO_ACCEPT' | 'NEEDS_REVIEW' | 'GENERAL_QUEUE' = 'GENERAL_QUEUE';

  if (confidence >= settings.confidenceThresholdHigh) {
    confidenceStatus = 'AUTO_ACCEPT';
  } else if (confidence >= settings.confidenceThresholdMedium) {
    confidenceStatus = 'NEEDS_REVIEW';
  } else {
    confidenceStatus = 'GENERAL_QUEUE';
  }

  // 5. Human Review Flag: Required if final urgency is HIGH, confidence is low, or AI explicitly flagged risk
  const requiresHumanReview =
    finalUrgency === 'HIGH' ||
    confidenceStatus !== 'AUTO_ACCEPT' ||
    (aiAnalysis?.riskFlags && aiAnalysis.riskFlags.length > 0) ||
    (aiAnalysis?.requiresHumanReview ?? true);

  // 6. Transparent Routing Score Calculation
  const suggestedDeptCode = aiAnalysis?.suggestedDepartment || 'GENERAL_ADMIN';
  const matchedDept = departments.find(
    (d) =>
      d.code.toLowerCase() === suggestedDeptCode.toLowerCase() ||
      d.id.toLowerCase() === suggestedDeptCode.toLowerCase() ||
      d.name.toLowerCase().includes(suggestedDeptCode.toLowerCase())
  ) || departments.find((d) => d.code === 'GENERAL_ADMIN') || departments[0];

  const category = aiAnalysis?.category || 'GENERAL';
  let score = 50; // base
  if (aiAnalysis?.departmentConfidence) {
    score += Math.round(aiAnalysis.departmentConfidence * 40);
  }
  if (matchedDept?.categories?.some((c) => c.toLowerCase().includes(category.toLowerCase()))) {
    score += 10;
  }

  const explanation = `Suggested ${matchedDept?.name || 'Department'} because complaint category '${category}' and detected issue context best map to this department's designated jurisdiction (Score: ${score}/100, AI Confidence: ${Math.round(confidence * 100)}%).`;

  return {
    aiUrgency,
    ruleUrgency,
    finalUrgency,
    ruleTriggered,
    triggeredRules,
    confidenceStatus,
    requiresHumanReview,
    routingScore: {
      primaryDept: matchedDept?.id || 'dept-general',
      score,
      explanation,
      secondaryDept: aiAnalysis?.alternativeDepartment,
    },
  };
}

// Basic Duplicate Detection using tokenized Jaccard similarity
export function findPotentialDuplicates(
  newTitle: string,
  newDesc: string,
  existingComplaints: Complaint[],
  threshold = 0.45
): string[] {
  const tokenize = (text: string) => {
    return new Set(
      text
        .toLowerCase()
        .replace(/[^\w\s]/g, '')
        .split(/\s+/)
        .filter((w) => w.length > 3)
    );
  };

  const newTokens = tokenize(`${newTitle} ${newDesc}`);
  if (newTokens.size === 0) return [];

  const matchedIds: string[] = [];

  for (const existing of existingComplaints) {
    // Only check open / recent complaints
    if (existing.status === 'CLOSED' || existing.status === 'REJECTED') continue;

    const existingTokens = tokenize(`${existing.title} ${existing.description}`);
    if (existingTokens.size === 0) continue;

    // Calculate Jaccard similarity
    let intersection = 0;
    for (const token of newTokens) {
      if (existingTokens.has(token)) {
        intersection++;
      }
    }
    const union = new Set([...newTokens, ...existingTokens]).size;
    const similarity = intersection / union;

    if (similarity >= threshold) {
      matchedIds.push(existing.trackingNumber || existing.id);
    }
  }

  return matchedIds;
}
