import type { MsmeProfile } from '../types';

export const MOCK_COHORT: MsmeProfile[] = [
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
    ocenLspPayload: {
      lspId: "LSP-IDBI-INNOVATE-001",
      creditPassportId: "CP-MH-2026-99482",
      timestamp: "2026-07-07T10:30:00Z",
      verificationStatus: "VERIFIED_AUDIT_GRADE"
    },
    keyMetrics: {
      monthlyTurnover: 1450000.0,
      gstr3bRegularity: 1.0,
      odUtilization: 0.68,
      epfActiveMembers: 34,
      chequeBounces: 0
    }
  },
  {
    msmeId: "MSME-2026-002",
    udyamNumber: "UDYAM-GJ-05-0089124",
    businessName: "Kiran Textiles & Weaving Mill",
    category: "MEDIUM",
    sector: "TEXTILES",
    registrationDate: "2016-08-20",
    healthScore: 745,
    riskBand: "PRIME_RISK",
    defaultProbability12m: 0.028,
    isNtcThinFile: false,
    subScores: {
      taxComplianceScore: 85.0,
      cashFlowVelocityScore: 78.0,
      payrollStabilityScore: 80.0,
      businessVintageScore: 95.0,
      liquidityBufferScore: 70.0,
      dataQualityScore: 90.0
    },
    topReasonCodes: [
      {
        code: "VINTAGE_001",
        category: "Vintage",
        impact: "POSITIVE",
        description: "Established business vintage of 9+ years with consistent banking footprint.",
        advice: "Long operating history provides strong insulation against cyclical downturns.",
        shapValue: 38.0
      },
      {
        code: "GST_REG_002",
        category: "GST",
        impact: "NEGATIVE",
        description: "2 late filings observed in GSTR-3B over the last 12 months.",
        advice: "Automate tax filing schedules; zero late filings will add ~18 points to your score.",
        shapValue: -18.5
      }
    ],
    ocenLspPayload: {
      lspId: "LSP-IDBI-INNOVATE-001",
      creditPassportId: "CP-GJ-2026-88123",
      timestamp: "2026-07-07T09:15:00Z",
      verificationStatus: "VERIFIED_AUDIT_GRADE"
    },
    keyMetrics: {
      monthlyTurnover: 3200000.0,
      gstr3bRegularity: 0.833,
      odUtilization: 0.55,
      epfActiveMembers: 85,
      chequeBounces: 0
    }
  },
  {
    msmeId: "MSME-2026-003",
    udyamNumber: "UDYAM-DL-03-0044192",
    businessName: "Neelam Digital Logistics & Fleet",
    category: "SMALL",
    sector: "LOGISTICS",
    registrationDate: "2022-01-10",
    healthScore: 680,
    riskBand: "MODERATE_RISK",
    defaultProbability12m: 0.054,
    isNtcThinFile: false,
    subScores: {
      taxComplianceScore: 75.0,
      cashFlowVelocityScore: 82.0,
      payrollStabilityScore: 65.0,
      businessVintageScore: 60.0,
      liquidityBufferScore: 68.0,
      dataQualityScore: 85.0
    },
    topReasonCodes: [
      {
        code: "UPI_VELOCITY_001",
        category: "Digital",
        impact: "POSITIVE",
        description: "High digital transaction density via UPI (>500 monthly transactions).",
        advice: "Strong digital adoption supports real-time cash flow verification under OCEN.",
        shapValue: 32.0
      },
      {
        code: "EPFO_CHURN_001",
        category: "Payroll",
        impact: "NEGATIVE",
        description: "High employee turnover / member drop in EPFO records over the last 6 months.",
        advice: "Stabilize workforce retention to improve payroll stability subscore.",
        shapValue: -24.0
      },
      {
        code: "AA_BOUNCE_001",
        category: "Credit",
        impact: "NEGATIVE",
        description: "1 inward cheque dishonour / bounce recorded in bank statements in Q3.",
        advice: "Maintain adequate clearing balances to prevent bounce penalties (-30 points).",
        shapValue: -30.0
      }
    ],
    keyMetrics: {
      monthlyTurnover: 850000.0,
      gstr3bRegularity: 0.916,
      odUtilization: 0.72,
      epfActiveMembers: 18,
      chequeBounces: 1
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
    msmeId: "MSME-2026-005",
    udyamNumber: "UDYAM-TN-08-0055123",
    businessName: "Meenakshi Agro Processing Works",
    category: "SMALL",
    sector: "AGRI_FOOD",
    registrationDate: "2018-05-14",
    healthScore: 790,
    riskBand: "PRIME_RISK",
    defaultProbability12m: 0.018,
    isNtcThinFile: false,
    subScores: {
      taxComplianceScore: 90.0,
      cashFlowVelocityScore: 84.0,
      payrollStabilityScore: 82.0,
      businessVintageScore: 88.0,
      liquidityBufferScore: 80.0,
      dataQualityScore: 92.0
    },
    topReasonCodes: [
      {
        code: "GST_REG_001",
        category: "GST",
        impact: "POSITIVE",
        description: "100% GSTR-3B filing compliance with zero late fees.",
        advice: "Qualifies for instant OCEN invoice discounting facilities.",
        shapValue: 38.0
      }
    ],
    keyMetrics: {
      monthlyTurnover: 1800000.0,
      gstr3bRegularity: 1.0,
      odUtilization: 0.35,
      epfActiveMembers: 28,
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
  },
  {
    msmeId: "MSME-2026-007",
    udyamNumber: "UDYAM-WB-04-0077812",
    businessName: "Dasgupta Packaging & Cartons",
    category: "SMALL",
    sector: "PACKAGING",
    registrationDate: "2017-09-18",
    healthScore: 720,
    riskBand: "PRIME_RISK",
    defaultProbability12m: 0.035,
    isNtcThinFile: false,
    subScores: {
      taxComplianceScore: 82.0,
      cashFlowVelocityScore: 76.0,
      payrollStabilityScore: 78.0,
      businessVintageScore: 85.0,
      liquidityBufferScore: 72.0,
      dataQualityScore: 88.0
    },
    topReasonCodes: [
      {
        code: "VINTAGE_001",
        category: "Vintage",
        impact: "POSITIVE",
        description: "8+ years of stable manufacturing operations in Kolkata industrial corridor.",
        advice: "Eligible for long-term term loan enhancement under IDBI Track 03.",
        shapValue: 30.0
      }
    ],
    keyMetrics: {
      monthlyTurnover: 1650000.0,
      gstr3bRegularity: 0.916,
      odUtilization: 0.58,
      epfActiveMembers: 30,
      chequeBounces: 0
    }
  },
  {
    msmeId: "MSME-2026-008",
    udyamNumber: "UDYAM-MH-14-0091823",
    businessName: "Sai Kripa Solar Installations",
    category: "MICRO",
    sector: "RENEWABLE_ENERGY",
    registrationDate: "2023-06-15",
    healthScore: 690,
    riskBand: "MODERATE_RISK",
    defaultProbability12m: 0.048,
    isNtcThinFile: true,
    subScores: {
      taxComplianceScore: 78.0,
      cashFlowVelocityScore: 80.0,
      payrollStabilityScore: 68.0,
      businessVintageScore: 55.0,
      liquidityBufferScore: 68.0,
      dataQualityScore: 85.0
    },
    topReasonCodes: [
      {
        code: "GREEN_SECTOR_001",
        category: "Sector",
        impact: "POSITIVE",
        description: "Operating in high-growth renewable energy / solar installation sector.",
        advice: "Priority sector lending (PSL) benefits applicable under RBI guidelines.",
        shapValue: 25.0
      }
    ],
    keyMetrics: {
      monthlyTurnover: 650000.0,
      gstr3bRegularity: 1.0,
      odUtilization: 0.45,
      epfActiveMembers: 12,
      chequeBounces: 0
    }
  },
  {
    msmeId: "MSME-2026-009",
    udyamNumber: "UDYAM-GJ-01-0022194",
    businessName: "Patel Pharma & Chemical Exporters",
    category: "MEDIUM",
    sector: "PHARMACEUTICALS",
    registrationDate: "2015-02-11",
    healthScore: 860,
    riskBand: "PRIME_RISK",
    defaultProbability12m: 0.008,
    isNtcThinFile: false,
    subScores: {
      taxComplianceScore: 96.0,
      cashFlowVelocityScore: 92.0,
      payrollStabilityScore: 90.0,
      businessVintageScore: 98.0,
      liquidityBufferScore: 88.0,
      dataQualityScore: 98.0
    },
    topReasonCodes: [
      {
        code: "EXPORT_STABILITY_001",
        category: "Cash Flow",
        impact: "POSITIVE",
        description: "High-value export realizations with zero GST refund delays or mismatches.",
        advice: "Top-tier borrower profile. Recommend preferential pricing and collateral-free OCEN limit.",
        shapValue: 55.0
      }
    ],
    ocenLspPayload: {
      lspId: "LSP-IDBI-INNOVATE-001",
      creditPassportId: "CP-GJ-2026-11092",
      timestamp: "2026-07-07T08:00:00Z",
      verificationStatus: "VERIFIED_AUDIT_GRADE"
    },
    keyMetrics: {
      monthlyTurnover: 5800000.0,
      gstr3bRegularity: 1.0,
      odUtilization: 0.22,
      epfActiveMembers: 140,
      chequeBounces: 0
    }
  },
  {
    msmeId: "MSME-2026-010",
    udyamNumber: "UDYAM-MH-01-0066512",
    businessName: "Omkar Hospitality & Catering Services",
    category: "MICRO",
    sector: "HOSPITALITY",
    registrationDate: "2021-10-01",
    healthScore: 610,
    riskBand: "MODERATE_RISK",
    defaultProbability12m: 0.088,
    isNtcThinFile: false,
    subScores: {
      taxComplianceScore: 65.0,
      cashFlowVelocityScore: 62.0,
      payrollStabilityScore: 58.0,
      businessVintageScore: 65.0,
      liquidityBufferScore: 55.0,
      dataQualityScore: 80.0
    },
    topReasonCodes: [
      {
        code: "CF_VOLATILITY_001",
        category: "Cash Flow",
        impact: "NEGATIVE",
        description: "Seasonal cash flow dips observed during monsoon months in bank statements.",
        advice: "Opt for flexible OD drawdown structures aligned with seasonal revenue peaks.",
        shapValue: -22.0
      }
    ],
    keyMetrics: {
      monthlyTurnover: 380000.0,
      gstr3bRegularity: 0.833,
      odUtilization: 0.82,
      epfActiveMembers: 15,
      chequeBounces: 1
    }
  }
];
