import type { MsmeProfile, ReasonCode, SubScores } from '../types';

/**
 * Maps backend scoring engine risk bands to frontend UI union type.
 */
function mapRiskBand(band?: string): 'PRIME_RISK' | 'MODERATE_RISK' | 'HIGH_RISK' {
  if (band === 'PRIME_LOW_RISK' || band === 'PRIME_RISK') return 'PRIME_RISK';
  if (band === 'STANDARD_MODERATE_RISK' || band === 'MODERATE_RISK') return 'MODERATE_RISK';
  return 'HIGH_RISK';
}

/**
 * Maps TreeSHAP reason codes from backend schema (impactDirection, explanation, actionableAdvice)
 * to frontend UI schema (impact, description, advice, category).
 */
function mapReasonCodes(reasons?: any[]): ReasonCode[] {
  if (!reasons || !Array.isArray(reasons)) return [];
  return reasons.map((rc) => {
    const codeStr = rc.code || 'RC_GEN_001';
    let category = 'General';
    if (codeStr.includes('GST') || codeStr.includes('TAX')) category = 'GST & Tax';
    else if (codeStr.includes('CF') || codeStr.includes('UPI') || codeStr.includes('VOL')) category = 'Cash Flow & UPI';
    else if (codeStr.includes('EPFO') || codeStr.includes('PAY') || codeStr.includes('WAGE')) category = 'Payroll & EPFO';
    else if (codeStr.includes('AA') || codeStr.includes('OD') || codeStr.includes('CREDIT') || codeStr.includes('BOUNCE')) category = 'Credit & AA';

    return {
      code: codeStr,
      category,
      impact: rc.impactDirection === 'POSITIVE' || rc.impact === 'POSITIVE' ? 'POSITIVE' : 'NEGATIVE',
      description: rc.explanation || rc.description || 'Shapley additive feature attribution.',
      advice: rc.actionableAdvice || rc.advice || 'Monitor metric for continued health optimization.',
      shapValue: typeof rc.shapContribution === 'number' ? rc.shapContribution : (typeof rc.shapValue === 'number' ? rc.shapValue : 0),
    };
  });
}

/**
 * Maps 5 domain sub-scores and data quality metric.
 */
function mapSubScores(subs?: any, dqScore?: number): SubScores {
  const dq = typeof dqScore === 'number' ? (dqScore <= 1 ? dqScore * 100 : dqScore) : (subs?.dataQualityScore ?? 95.0);
  return {
    taxComplianceScore: subs?.taxComplianceScore ?? 75.0,
    cashFlowVelocityScore: subs?.cashFlowVelocityScore ?? 70.0,
    payrollStabilityScore: subs?.payrollStabilityScore ?? 65.0,
    businessVintageScore: subs?.businessVintageScore ?? 80.0,
    liquidityBufferScore: subs?.liquidityBufferScore ?? 75.0,
    dataQualityScore: Math.round(dq),
  };
}

/**
 * Derives key operational metrics from real feature attributions or fallback profile data,
 * mirroring credit_features.py bounce and OD utilization logic.
 */
function deriveKeyMetrics(apiResp: any, fallback?: Partial<MsmeProfile>): MsmeProfile['keyMetrics'] {
  const feats = apiResp?.allFeatureAttributions || {};
  return {
    monthlyTurnover: fallback?.keyMetrics?.monthlyTurnover ?? 4500000,
    gstr3bRegularity: fallback?.keyMetrics?.gstr3bRegularity ?? 1.0,
    odUtilization: typeof feats['aa_od_limit_utilization'] === 'number' ? feats['aa_od_limit_utilization'] : (fallback?.keyMetrics?.odUtilization ?? 0.45),
    epfActiveMembers: fallback?.keyMetrics?.epfActiveMembers ?? 24,
    chequeBounces: typeof feats['aa_bounce_count'] === 'number' ? feats['aa_bounce_count'] : (fallback?.keyMetrics?.chequeBounces ?? 0),
  };
}

/**
 * Transforms a raw API Gateway / Scoring Engine response into an exact MsmeProfile for UI rendering.
 */
export function transformScoringResponse(
  apiResp: any,
  baseProfile?: MsmeProfile,
  backendIds?: { udyamNumber?: string; creditPassportId?: string; isError?: boolean }
): MsmeProfile {
  const resolvedUdyam = backendIds?.udyamNumber || apiResp.udyamNumber || baseProfile?.udyamNumber || (backendIds?.isError ? "ID unavailable — backend unreachable" : "UDYAM-UNVERIFIED");
  const resolvedPassport = backendIds?.creditPassportId || apiResp.creditPassportId || baseProfile?.ocenLspPayload?.creditPassportId || (backendIds?.isError ? "ID unavailable — backend unreachable" : "CP-UNVERIFIED");

  return {
    msmeId: apiResp.msmeId || baseProfile?.msmeId || "MSME-UNKNOWN",
    udyamNumber: resolvedUdyam,
    businessName: baseProfile?.businessName || `Enterprise Profile ${apiResp.msmeId || ''}`,
    category: baseProfile?.category || "SMALL",
    sector: baseProfile?.sector || "MANUFACTURING",
    registrationDate: baseProfile?.registrationDate || "2020-04-15",
    healthScore: typeof apiResp.healthScore === 'number' ? apiResp.healthScore : (baseProfile?.healthScore || 700),
    riskBand: mapRiskBand(apiResp.riskBand || baseProfile?.riskBand),
    defaultProbability12m: typeof apiResp.defaultProbability12m === 'number' ? apiResp.defaultProbability12m : (baseProfile?.defaultProbability12m || 0.05),
    isNtcThinFile: Boolean(apiResp.isNtcThinFile ?? baseProfile?.isNtcThinFile ?? false),
    subScores: mapSubScores(apiResp.subScores, apiResp.dataQualityScore),
    topReasonCodes: mapReasonCodes(apiResp.topReasonCodes || baseProfile?.topReasonCodes),
    ocenLspPayload: apiResp.ocenEligibility ? {
      lspId: "LSP-IDBI-INNOVATE-LIVE",
      creditPassportId: resolvedPassport,
      timestamp: new Date().toISOString(),
      verificationStatus: apiResp.ocenEligibility.isEligible ? "VERIFIED_ELIGIBLE" : "INELIGIBLE_RISK"
    } : baseProfile?.ocenLspPayload,
    keyMetrics: deriveKeyMetrics(apiResp, baseProfile),
    simulationCoefficients: apiResp.simulationCoefficients || baseProfile?.simulationCoefficients,
  };
}
