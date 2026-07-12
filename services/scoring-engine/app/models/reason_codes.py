from typing import Dict, Any
from core.policy_engine import policy_engine

# RBI & Bank-Audit compliant plain-language reason code catalog
# Every feature used by the ML model maps to an explanation template and actionable advice.
REASON_CODE_CATALOG: Dict[str, Dict[str, str]] = {
    "gst_filing_regularity": {
        "code": "RC_GST_001",
        "title": "GST Return Filing Regularity",
        "positive": "Consistent on-time filing of GSTR-3B returns demonstrates high statutory compliance.",
        "negative": "Frequent delays or gaps in filing GSTR-3B monthly returns indicate potential working capital stress or operational friction.",
        "action": "Set up automated tax filing reminders and maintain dedicated tax reserve buffers to ensure 100% on-time GST filings."
    },
    "gst_late_filing_ratio": {
        "code": "RC_GST_002",
        "title": "GST Late Filing Incidence",
        "positive": "Zero or minimal late filing penalties incurred over the evaluation period.",
        "negative": "High proportion of late GSTR-3B filings resulting in statutory late fee penalties and interest.",
        "action": "File returns before the 20th of each month to avoid accumulating Section 47 late fees and 18% p.a. interest."
    },
    "gst_turnover_cv": {
        "code": "RC_GST_003",
        "title": "Turnover Volatility & Consistency",
        "positive": "Stable and predictable monthly sales revenue reported across GST filings.",
        "negative": "High month-over-month volatility in declared revenue, indicating cash flow unpredictability.",
        "action": "Diversify customer base and secure long-term purchase contracts to smooth out monthly revenue fluctuations."
    },
    "gst_turnover_yoy_growth": {
        "code": "RC_GST_004",
        "title": "Revenue Growth Trajectory",
        "positive": "Strong positive year-over-year revenue growth reported in official tax filings.",
        "negative": "Stagnant or declining revenue trend over consecutive assessment quarters.",
        "action": "Explore new market segments or digital commerce channels to revive sales momentum."
    },
    "gst_itc_claim_ratio": {
        "code": "RC_GST_005",
        "title": "Input Tax Credit (ITC) Utilization",
        "positive": "Healthy and verified Input Tax Credit ratio matching industry benchmarks.",
        "negative": "Disproportionately high or erratic ITC claims relative to gross tax liability, flagging potential audit risk.",
        "action": "Reconcile GSTR-2B inward supplies monthly with supplier invoices to ensure clean ITC matching."
    },
    "upi_monthly_volume_avg": {
        "code": "RC_CF_001",
        "title": "Digital Payment Velocity",
        "positive": "High daily transaction volume across digital payment channels (UPI/Bank Switch), evidencing active commerce.",
        "negative": "Low or sporadic digital transaction frequency, suggesting reliance on untraceable cash settlements.",
        "action": "Incentivize digital payments from customers using dynamic QR codes and instant settlement merchant solutions."
    },
    "upi_credit_debit_ratio": {
        "code": "RC_CF_002",
        "title": "Operating Cash-Flow Ratio",
        "positive": "Favorable credit-to-debit cash flow ratio indicating healthy net operating surplus.",
        "negative": "Tight or negative credit-to-debit ratio where cash outflows closely match or exceed inflows.",
        "action": "Optimize vendor payment terms and accelerate receivables collection to widen operating cash margins."
    },
    "upi_unique_payers_avg": {
        "code": "RC_CF_003",
        "title": "Customer Concentration Risk",
        "positive": "Broad and diversified customer base with multiple independent payers each month.",
        "negative": "High concentration risk with revenue dependent on a very small number of payers.",
        "action": "Expand marketing efforts to acquire new retail or B2B clients, reducing dependency on top 3 buyers."
    },
    "epfo_contribution_regularity": {
        "code": "RC_PAY_001",
        "title": "EPFO Employer Statutory Compliance",
        "positive": "Flawless track record of monthly employee provident fund contributions and wage reporting.",
        "negative": "Delayed or defaulted EPFO employer contributions, indicating severe payroll liquidity constraints.",
        "action": "Prioritize statutory payroll remittances by the 15th of each month to avoid Section 7Q/14B damages and preserve employee trust."
    },
    "epfo_member_growth_rate": {
        "code": "RC_PAY_002",
        "title": "Workforce Stability & Retention",
        "positive": "Stable or expanding formal headcount covered under EPFO, reflecting business expansion.",
        "negative": "Contracting active employee headcount, signaling potential operational downsizing or labor attrition.",
        "action": "Invest in employee retention programs and formalize contract workers into registered payroll."
    },
    "udyam_vintage_months": {
        "code": "RC_DIG_001",
        "title": "Business Vintage & Formalization",
        "positive": "Established operational history with verified Udyam registration and formal banking links.",
        "negative": "Limited operational vintage or recent formalization under MSME Ministry guidelines.",
        "action": "Maintain active registration and link all business bank accounts to strengthen formal credit identity over time."
    },
    "aa_od_limit_utilization": {
        "code": "RC_CR_001",
        "title": "Working Capital Limit Utilization",
        "positive": "Prudent utilization of overdraft / cash credit limits with substantial headroom maintained.",
        "negative": "High or exhausted utilization of existing working capital limits, leaving zero emergency liquidity buffer.",
        "action": "Reduce reliance on short-term overdrafts by injecting equity or converting structural debt into term loans."
    },
    "aa_bounce_flag": {
        "code": "RC_CR_002",
        "title": "Bank Account Dishonour / Return Incidence",
        "positive": "Zero cheque bounces or ECS/NACH return dishonours recorded in Account Aggregator bank statements.",
        "negative": "Incidence of inward/outward payment dishonour or insufficient funds flags in bank statement history.",
        "action": "Maintain adequate minimum balances before scheduled loan EMI or vendor auto-debit dates."
    },
    "ntc_thin_file_flag": {
        "code": "RC_CR_003",
        "title": "New-to-Credit (NTC) Alternative Evaluation",
        "positive": "Alternative digital footprint (UPI velocity and GST regularity) successfully compensates for lack of traditional bureau history.",
        "negative": "Thin-file credit history requires additional seasoning of digital cash flows for higher credit limit qualification.",
        "action": "Continue routing 100% of business turnover through formal banking channels to build a robust alternative credit score."
    }
}

def get_reason_code(feature_name: str, shap_value: float) -> Dict[str, Any]:
    """Returns the formatted plain-language reason code object for a given feature and its SHAP impact."""
    catalog_entry = REASON_CODE_CATALOG.get(feature_name, {
        "code": f"RC_GEN_{feature_name.upper()[:8]}",
        "title": feature_name.replace("_", " ").title(),
        "positive": f"Favorable contribution from {feature_name.replace('_', ' ')}.",
        "negative": f"Adverse impact from {feature_name.replace('_', ' ')}.",
        "action": "Monitor and optimize this operational metric to improve overall financial health."
    })
    
    # In default probability model, shap_value < 0 lowers default risk (improves health score -> POSITIVE impact).
    # shap_value >= 0 increases default risk (lowers health score -> NEGATIVE impact).
    is_favorable = shap_value < 0
    sw = policy_engine.get_scoring_weights()
    points_impact = max(1, int(round(abs(shap_value) * float(sw.get("shapPointsMultiplier", 60.0)))))
    
    explanation = catalog_entry["positive"] if is_favorable else catalog_entry["negative"]
    if not is_favorable and abs(shap_value) > 0.005:
        action_advice = f"{catalog_entry['action']} (Counterfactual estimation: resolving this risk factor can boost your health score by approx +{points_impact} points)."
    else:
        action_advice = catalog_entry["action"] if not is_favorable else "Maintain current performance standards."
    
    return {
        "code": catalog_entry["code"],
        "featureName": feature_name,
        "title": catalog_entry["title"],
        "impactDirection": "POSITIVE" if is_favorable else "NEGATIVE",
        "shapContribution": round(float(shap_value), 4),
        "explanation": explanation,
        "actionableAdvice": action_advice
    }
