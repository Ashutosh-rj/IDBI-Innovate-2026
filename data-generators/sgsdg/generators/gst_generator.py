import uuid
from datetime import datetime, date, timedelta
from typing import List, Dict, Any
import numpy as np
from .base import BaseGenerator, Scenario, MsmeCategory

class GstGenerator(BaseGenerator):
    """
    Generates synthetic GSTR-3B monthly filing records compliant with gst-filing.schema.json.
    Samples from Beta(17, 3) for compliance and LogNormal for turnover anchored to MSME Ministry limits.
    """
    def generate(self, msme_id: str, category: str, scenario: str, gstin: str, start_date: date, history_months: int = 24) -> List[Dict[str, Any]]:
        filings = []
        cat_config = self.config["gst"]["turnover_lognorm"].get(category, self.config["gst"]["turnover_lognorm"]["MICRO"])
        scenario_config = self.config["scenarios"].get(scenario, self.config["scenarios"]["HEALTHY_ESTABLISHED"])
        
        # Base monthly turnover from lognormal (annual divided by 12)
        base_annual_turnover = self.rng.lognormal(mean=cat_config["mu"], sigma=cat_config["sigma"])
        base_monthly_turnover = base_annual_turnover / 12.0
        
        # Beta distribution parameters for on-time filing probability
        alpha = self.config["gst"]["compliance"]["msme_beta_params"]["alpha"]
        beta = self.config["gst"]["compliance"]["msme_beta_params"]["beta"]
        base_compliance_prob = self.rng.beta(alpha, beta)
        
        # Modify compliance probability by scenario
        compliance_prob = np.clip(base_compliance_prob * scenario_config["gst_late_prob_modifier"], 0.1, 0.99)
        if scenario == Scenario.STRESSED_LIQUIDITY:
            compliance_prob = np.clip(compliance_prob * 0.6, 0.2, 0.7)
            
        yoy_growth = scenario_config["turnover_yoy_growth"]
        monthly_growth_rate = (1.0 + yoy_growth) ** (1.0 / 12.0) - 1.0
        
        current_date = start_date
        for m in range(history_months):
            ret_period = current_date.strftime("%m%Y")
            due_date = (current_date.replace(day=1) + timedelta(days=32)).replace(day=20)
            
            # Apply trend and seasonality
            month_idx = m
            trend_factor = (1.0 + monthly_growth_rate) ** month_idx
            
            seasonal_factor = 1.0
            if scenario == Scenario.SEASONAL_BUSINESS:
                # Peak in Oct-Dec (festive season)
                month_num = current_date.month
                amp = scenario_config["seasonal_amplitude_ratio"]
                seasonal_factor = 1.0 + amp * np.sin(2 * np.pi * (month_num - 3) / 12.0)
                
            # Random noise
            noise = self.rng.normal(1.0, 0.08)
            monthly_turnover = max(10000.0, base_monthly_turnover * trend_factor * seasonal_factor * noise)
            
            # Determine filing status
            is_on_time = self.rng.random() < compliance_prob
            filing_delay_days = 0
            late_fee = 0.0
            filing_status = "ON_TIME"
            filing_date = due_date
            
            if not is_on_time:
                # 85% late, 10% not filed yet (if recent), 5% nil return
                rand_val = self.rng.random()
                if rand_val < 0.85:
                    filing_status = "LATE"
                    filing_delay_days = int(self.rng.exponential(scale=14)) + 1
                    filing_date = due_date + timedelta(days=filing_delay_days)
                    # Late fee calculation: Rs 50/day normal, capped by turnover slab
                    fee_per_day = self.config["gst"]["compliance"]["late_fee_per_day"]
                    cap = self.config["gst"]["compliance"]["statutory_caps"]["micro_1_5cr"]
                    if category == MsmeCategory.SMALL:
                        cap = self.config["gst"]["compliance"]["statutory_caps"]["small_5cr"]
                    elif category == MsmeCategory.MEDIUM:
                        cap = self.config["gst"]["compliance"]["statutory_caps"]["medium_above_5cr"]
                    late_fee = min(cap, float(filing_delay_days * fee_per_day))
                elif rand_val < 0.95:
                    filing_status = "NOT_FILED"
                    filing_date = None
                    filing_delay_days = max(0, (date.today() - due_date).days)
                    late_fee = min(5000.0, float(filing_delay_days * 50.0))
                else:
                    filing_status = "NIL_RETURN"
                    monthly_turnover = 0.0
                    filing_date = due_date
            
            # Tax calculations (assuming average 18% GST rate across supplies)
            txval = round(float(monthly_turnover), 2)
            igst = round(txval * 0.09, 2)
            cgst = round(txval * 0.045, 2)
            sgst = round(txval * 0.045, 2)
            
            # ITC calculation
            itc_config = self.config["gst"]["itc_ratio_normal"]
            itc_ratio = np.clip(
                self.rng.normal(itc_config["mu"], itc_config["sigma"]),
                itc_config["min_clip"],
                itc_config["max_clip"]
            )
            
            # Add ITC mismatch if stressed or by chance
            if self.rng.random() < scenario_config["itc_mismatch_prob"]:
                itc_ratio = min(0.98, itc_ratio * self.rng.uniform(1.15, 1.40)) # Claiming more ITC than available
                
            total_tax = igst + cgst + sgst
            itc_total = round(total_tax * itc_ratio, 2)
            itc_igst = round(itc_total * 0.5, 2)
            itc_cgst = round(itc_total * 0.25, 2)
            itc_sgst = round(itc_total * 0.25, 2)
            
            filing_record = {
                "filingId": str(uuid.uuid4()),
                "msmeId": msme_id,
                "gstin": gstin,
                "retPeriod": ret_period,
                "supDetails": {
                    "osupDet": {
                        "txval": txval,
                        "iamt": igst,
                        "camt": cgst,
                        "samt": sgst,
                        "csamt": 0.0
                    },
                    "osupZero": {"txval": 0.0, "iamt": 0.0, "camt": 0.0, "samt": 0.0, "csamt": 0.0},
                    "osupNilExmp": {"txval": 0.0, "iamt": 0.0, "camt": 0.0, "samt": 0.0, "csamt": 0.0},
                    "isupRev": {"txval": 0.0, "iamt": 0.0, "camt": 0.0, "samt": 0.0, "csamt": 0.0},
                    "osupNongst": {"txval": 0.0, "iamt": 0.0, "camt": 0.0, "samt": 0.0, "csamt": 0.0}
                },
                "interSup": {
                    "unregDetails": [],
                    "compDetails": [],
                    "uinDetails": []
                },
                "itcElg": {
                    "itcAvl": [
                        {
                            "ty": "OTH",
                            "iamt": itc_igst,
                            "camt": itc_cgst,
                            "samt": itc_sgst,
                            "csamt": 0.0
                        }
                    ],
                    "itcRev": [],
                    "itcNet": {
                        "iamt": itc_igst,
                        "camt": itc_cgst,
                        "samt": itc_sgst,
                        "csamt": 0.0
                    },
                    "itcInelg": []
                },
                "inwardSup": {
                    "isupDetails": []
                },
                "filingStatus": filing_status,
                "filingDate": filing_date.isoformat() if filing_date else None,
                "dueDate": due_date.isoformat(),
                "filingDelayDays": int(filing_delay_days),
                "lateFeeAmount": round(late_fee, 2),
                "source": "SANDBOX",
                "fetchTimestamp": datetime.utcnow().isoformat() + "Z"
            }
            filings.append(filing_record)
            
            # Advance to next month
            if current_date.month == 12:
                current_date = current_date.replace(year=current_date.year + 1, month=1)
            else:
                current_date = current_date.replace(month=current_date.month + 1)
                
        return filings
