export interface ReasonCode {
  code: string;
  category: string;
  impact: 'POSITIVE' | 'NEGATIVE';
  description: string;
  advice: string;
  shapValue: number;
}

export interface SubScores {
  taxComplianceScore: number;
  cashFlowVelocityScore: number;
  payrollStabilityScore: number;
  businessVintageScore: number;
  liquidityBufferScore: number;
  dataQualityScore: number;
}

export interface MsmeProfile {
  msmeId: string;
  udyamNumber: string;
  businessName: string;
  category: 'MICRO' | 'SMALL' | 'MEDIUM';
  sector: string;
  registrationDate: string;
  healthScore: number;
  riskBand: 'PRIME_RISK' | 'MODERATE_RISK' | 'HIGH_RISK';
  defaultProbability12m: number;
  isNtcThinFile: boolean;
  subScores: SubScores;
  topReasonCodes: ReasonCode[];
  keyMetrics: {
    monthlyTurnover: number;
    gstr3bRegularity: number;
    odUtilization: number;
    epfActiveMembers: number;
    chequeBounces: number;
  };
}

export interface ConsentRecord {
  consentHandle: string;
  fiuId: string;
  aaId: string;
  purposeCode: string;
  fiTypes: string[];
  status: 'INITIATED' | 'PENDING_USER_APPROVAL' | 'ACTIVE' | 'REVOKED' | 'EXPIRED';
  consentStart: string;
  consentExpiry: string;
}
