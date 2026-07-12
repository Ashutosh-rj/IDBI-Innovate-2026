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
  ocenLspPayload?: {
    lspId: string;
    creditPassportId: string;
    timestamp: string;
    verificationStatus: string;
  };
  keyMetrics: {
    monthlyTurnover: number;
    gstr3bRegularity: number;
    odUtilization: number;
    epfActiveMembers: number;
    chequeBounces: number;
  };
  simulationCoefficients?: {
    gstrWeight?: number;
    odUtilWeight?: number;
    bounceWeight?: number;
    epfWeight?: number;
  };
}

export interface WhatIfSimulation {
  baseScore: number;
  newScore: number;
  delta: number;
  baseRiskBand: string;
  newRiskBand: string;
  modifiedFeatures: Record<string, number>;
  reasons: string[];
}
