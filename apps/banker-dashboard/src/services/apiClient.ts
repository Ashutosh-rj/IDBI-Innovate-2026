import axios from 'axios';
import type { MsmeProfile } from '../types';
import { transformScoringResponse } from './transform';

const GATEWAY_URL = 'http://localhost:8080/api/v1';
const DIRECT_SCORING_URL = 'http://localhost:8000/api/v1';

/**
 * Helper to build a realistic multi-stream data payload from a base MSME profile
 * for live scoring engine inference.
 */
function buildScoringPayload(profile: MsmeProfile) {
  const turnover = profile.keyMetrics.monthlyTurnover || 4500000;
  const bounces = profile.keyMetrics.chequeBounces || 0;
  const odUtil = profile.keyMetrics.odUtilization || 0.45;
  const members = profile.keyMetrics.epfActiveMembers || 24;
  const reg = profile.keyMetrics.gstr3bRegularity || 1.0;

  return {
    profile: {
      msmeId: profile.msmeId,
      businessName: profile.businessName,
      category: profile.category,
      sector: profile.sector,
    },
    gstFilings: [
      { period: "2025-06", turnover: turnover, filing_delay_days: reg === 1 ? 0 : 4, itc_mismatch_flag: 0 },
      { period: "2025-05", turnover: turnover * 0.98, filing_delay_days: reg === 1 ? 0 : 6, itc_mismatch_flag: 0 },
      { period: "2025-04", turnover: turnover * 1.05, filing_delay_days: 0, itc_mismatch_flag: 0 }
    ],
    upiSummary: {
      monthly_volume_avg: turnover * 0.45,
      credit_debit_ratio: 1.12,
      unique_payers_avg: 38
    },
    aaStatement: {
      bounce_flag: bounces > 0 ? 1 : 0,
      bounce_count: bounces,
      od_limit_utilization: odUtil
    },
    epfoRecord: {
      covered_flag: 1,
      active_members: members,
      contribution_regularity: 1.0
    },
    forceRecalculate: true
  };
}

/**
 * Fetches live scores and TreeSHAP explainability for an array of MSME profiles
 * by making real HTTP POST calls to the live API Gateway (or fallback scoring engine).
 */
export async function fetchLiveCohort(baseProfiles: MsmeProfile[]): Promise<MsmeProfile[]> {
  const liveProfiles: MsmeProfile[] = [];

  for (const baseProfile of baseProfiles) {
    const payload = buildScoringPayload(baseProfile);
    let apiResp = null;

    try {
      // Try Gateway first (:8080)
      const res = await axios.post(`${GATEWAY_URL}/score/`, payload, { timeout: 3000 });
      apiResp = res.data;
    } catch (gatewayErr) {
      try {
        // Fallback to direct Python FastAPI Scoring Engine (:8000)
        const resDirect = await axios.post(`${DIRECT_SCORING_URL}/score/`, payload, { timeout: 3000 });
        apiResp = resDirect.data;
      } catch (directErr) {
        console.warn(`Live inference failed for ${baseProfile.msmeId}. Using base profile.`, directErr);
      }
    }

    if (apiResp) {
      liveProfiles.push(transformScoringResponse(apiResp, baseProfile));
    } else {
      liveProfiles.push(baseProfile);
    }
  }

  return liveProfiles;
}

/**
 * Executes a real What-If simulation against the live scoring engine.
 */
export async function simulateWhatIfLive(profile: MsmeProfile, modifications: Record<string, number>): Promise<any> {
  const payload = {
    profile: { msmeId: profile.msmeId, businessName: profile.businessName },
    modifications: modifications
  };

  try {
    const res = await axios.post(`${GATEWAY_URL}/simulate/`, payload, { timeout: 3000 });
    return res.data;
  } catch (err) {
    try {
      const resDirect = await axios.post(`${DIRECT_SCORING_URL}/simulate/`, payload, { timeout: 3000 });
      return resDirect.data;
    } catch (fallbackErr) {
      throw new Error("Unable to connect to live simulation endpoint on :8080 or :8000");
    }
  }
}
