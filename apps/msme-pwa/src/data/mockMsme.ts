import type { MsmeProfile, ConsentRecord } from '../types';

export const MOCK_MSMES: MsmeProfile[] = [
  {
    msmeId: "MSME-2026-001",
    udyamNumber: "UDYAM-MH-12-0014523",
    businessName: "Aarav Precision Polymers Pvt Ltd",
    category: "SMALL",
    sector: "MANUFACTURING",
    registrationDate: "2019-03-12",
    healthScore: 815,
    riskBand: "PRIME_RISK",
    defaultProbability12m: 0.012,
    isNtcThinFile: false,
    subScores: {
      taxComplianceScore: 92.5,
      cashFlowVelocityScore: 88.0,
      payrollStabilityScore: 85.0,
      businessVintageScore: 90.0,
      liquidityBufferScore: 82.0,
      dataQualityScore: 95.0
    },
    topReasonCodes: [
      {
        code: "GST_REG_001",
        category: "GST",
        impact: "POSITIVE",
        description: "GSTR-3B filed on time for 12/12 consecutive months without default.",
        advice: "Maintain exemplary filing regularity to retain prime interest rate discounts.",
        shapValue: 42.5
      },
      {
        code: "CF_TURNOVER_001",
        category: "Cash Flow",
        impact: "POSITIVE",
        description: "Healthy monthly turnover growth (+14.2% YoY) with low coefficient of variation.",
        advice: "Turnover stability qualifies for higher credit limit enhancements under OCEN.",
        shapValue: 35.0
      },
      {
        code: "EPFO_COMP_001",
        category: "Payroll",
        impact: "POSITIVE",
        description: "Regular EPF wage remittances for 34 active members with zero payment defaults.",
        advice: "Stable formal workforce indicates robust operational health.",
        shapValue: 28.0
      },
      {
        code: "AA_OD_UTIL_002",
        category: "Credit",
        impact: "NEGATIVE",
        description: "OD Limit utilization averaged 68% over the last quarter.",
        advice: "Reduce OD utilization below 50% to boost liquidity buffer subscore by ~15 points.",
        shapValue: -12.0
      }
    ],
    keyMetrics: {
      monthlyTurnover: 1450000.0,
      gstr3bRegularity: 1.0,
      odUtilization: 0.68,
      epfActiveMembers: 34,
      chequeBounces: 0
    }
  },
  {
    msmeId: "MSME-2026-004",
    udyamNumber: "UDYAM-KA-02-0099381",
    businessName: "Venkateswara Cloud Solutions LLP",
    category: "MICRO",
    sector: "IT_SERVICES",
    registrationDate: "2024-02-01",
    healthScore: 655,
    riskBand: "MODERATE_RISK",
    defaultProbability12m: 0.062,
    isNtcThinFile: true,
    subScores: {
      taxComplianceScore: 70.0,
      cashFlowVelocityScore: 75.0,
      payrollStabilityScore: 65.0,
      businessVintageScore: 50.0,
      liquidityBufferScore: 65.0,
      dataQualityScore: 80.0
    },
    topReasonCodes: [
      {
        code: "NTC_THIN_FILE_001",
        category: "Credit",
        impact: "NEGATIVE",
        description: "New-to-Credit (NTC) / Thin-File applicant with <2 years operating vintage.",
        advice: "Score is benchmarked via alternate GST and UPI cash flow streams. Maintain 6 months of clean GST returns to transition to Prime band.",
        shapValue: -25.0
      },
      {
        code: "UPI_GROWTH_001",
        category: "Digital",
        impact: "POSITIVE",
        description: "Consistent 20% MoM growth in UPI merchant settlements.",
        advice: "Strong cash flow trajectory offsets thin credit footprint.",
        shapValue: 28.5
      }
    ],
    keyMetrics: {
      monthlyTurnover: 420000.0,
      gstr3bRegularity: 1.0,
      odUtilization: 0.40,
      epfActiveMembers: 8,
      chequeBounces: 0
    }
  },
  {
    msmeId: "MSME-2026-006",
    udyamNumber: "UDYAM-UP-15-0033412",
    businessName: "Rudra Foundry & Metal Works",
    category: "SMALL",
    sector: "MANUFACTURING",
    registrationDate: "2020-11-05",
    healthScore: 540,
    riskBand: "HIGH_RISK",
    defaultProbability12m: 0.142,
    isNtcThinFile: false,
    subScores: {
      taxComplianceScore: 45.0,
      cashFlowVelocityScore: 55.0,
      payrollStabilityScore: 50.0,
      businessVintageScore: 70.0,
      liquidityBufferScore: 40.0,
      dataQualityScore: 75.0
    },
    topReasonCodes: [
      {
        code: "GST_DEFAULT_001",
        category: "GST",
        impact: "NEGATIVE",
        description: "4 consecutive months of delayed GSTR-3B filings with significant late fees.",
        advice: "Immediate tax regularization required. High risk of ITC mismatch for buyers.",
        shapValue: -45.0
      },
      {
        code: "AA_OD_OVERDRAWN_001",
        category: "Credit",
        impact: "NEGATIVE",
        description: "OD Limit utilization at 96% with recurring insufficient funds alerts.",
        advice: "Infuse equity or working capital to restore liquidity buffer.",
        shapValue: -38.0
      }
    ],
    keyMetrics: {
      monthlyTurnover: 1100000.0,
      gstr3bRegularity: 0.666,
      odUtilization: 0.96,
      epfActiveMembers: 22,
      chequeBounces: 3
    }
  }
];

export const INITIAL_CONSENTS: ConsentRecord[] = [
  {
    consentHandle: "CH-REBIT-2026-88412",
    fiuId: "FIU-IDBI-BANK-INNOVATE",
    aaId: "AA-ONEMONEY-001",
    purposeCode: "101 - CREDIT_SCORE_ASSESSMENT",
    fiTypes: ["DEPOSIT", "TERM_DEPOSIT", "GST_RETURNS"],
    status: "ACTIVE",
    consentStart: "2026-06-01T00:00:00Z",
    consentExpiry: "2026-12-31T23:59:59Z"
  },
  {
    consentHandle: "CH-REBIT-2026-77123",
    fiuId: "FIU-IDBI-BANK-INNOVATE",
    aaId: "AA-ANUMATI-002",
    purposeCode: "102 - WORKING_CAPITAL_MONITORING",
    fiTypes: ["GSTR_1", "GSTR_3B", "EPFO_CONTRIBUTIONS"],
    status: "ACTIVE",
    consentStart: "2026-05-15T00:00:00Z",
    consentExpiry: "2026-11-15T23:59:59Z"
  }
];
