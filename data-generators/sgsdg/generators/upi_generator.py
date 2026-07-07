import uuid
from datetime import datetime, date, timedelta
from typing import List, Dict, Any
import numpy as np
from .base import BaseGenerator, Scenario, MsmeCategory

class UpiGenerator(BaseGenerator):
    """
    Generates synthetic UPI transaction time-series and monthly summaries compliant with upi-transactions.schema.json.
    Samples daily volume from Negative Binomial (overdispersion) and ticket size from LogNormal mixture (86% < Rs 500).
    """
    def generate(self, msme_id: str, category: str, scenario: str, vpa: str, start_date: date, history_months: int = 24) -> Dict[str, Any]:
        vol_config = self.config["upi"]["daily_volume_neg_binomial"].get(category, self.config["upi"]["daily_volume_neg_binomial"]["MICRO"])
        mix_config = self.config["upi"]["ticket_size_mixture"]
        scenario_config = self.config["scenarios"].get(scenario, self.config["scenarios"]["HEALTHY_ESTABLISHED"])
        
        # Negative binomial parameters: mean mu and variance var -> r and p
        mu = vol_config["mu"] * scenario_config["upi_volume_modifier"]
        var = max(mu * 1.5, vol_config["var"] * (scenario_config["upi_volume_modifier"] ** 2))
        p = mu / var
        r = (mu ** 2) / (var - mu)
        
        yoy_growth = scenario_config["turnover_yoy_growth"]
        monthly_growth_rate = (1.0 + yoy_growth) ** (1.0 / 12.0) - 1.0
        
        monthly_summaries = []
        current_date = start_date
        
        for m in range(history_months):
            month_str = current_date.strftime("%Y-%m")
            days_in_month = 30 # Simplified for speed and consistency
            
            trend_factor = (1.0 + monthly_growth_rate) ** m
            seasonal_factor = 1.0
            if scenario == Scenario.SEASONAL_BUSINESS:
                month_num = current_date.month
                amp = scenario_config["seasonal_amplitude_ratio"]
                seasonal_factor = 1.0 + amp * np.sin(2 * np.pi * (month_num - 3) / 12.0)
                
            daily_txns = self.rng.negative_binomial(r, p, size=days_in_month)
            daily_txns = np.maximum(1, np.round(daily_txns * trend_factor * seasonal_factor).astype(int))
            
            total_credits = 0.0
            total_debits = 0.0
            credit_count = 0
            debit_count = 0
            below_500_count = 0
            
            # Simulate transactions across the month
            for day_idx, daily_count in enumerate(daily_txns):
                # 80% incoming (credits from customers), 20% outgoing (debits to suppliers/utility)
                cr_cnt = int(daily_count * 0.8)
                db_cnt = daily_count - cr_cnt
                
                # Sample incoming ticket sizes from mixture
                for _ in range(cr_cnt):
                    if self.rng.random() < mix_config["comp1_small_retail"]["weight"]:
                        amt = self.rng.lognormal(mix_config["comp1_small_retail"]["lognorm_mu"], mix_config["comp1_small_retail"]["lognorm_sigma"])
                        if amt < 500.0:
                            below_500_count += 1
                    else:
                        amt = self.rng.lognormal(mix_config["comp2_b2b_large"]["lognorm_mu"], mix_config["comp2_b2b_large"]["lognorm_sigma"])
                    total_credits += float(amt)
                    credit_count += 1
                    
                # Sample outgoing debits (typically larger supplier payments)
                for _ in range(db_cnt):
                    amt = self.rng.lognormal(mix_config["comp2_b2b_large"]["lognorm_mu"] + 0.5, mix_config["comp2_b2b_large"]["lognorm_sigma"])
                    total_debits += float(amt)
                    debit_count += 1
                    
            peak_day = int(np.max(daily_txns))
            low_day = int(np.min(daily_txns))
            
            # Unique payers estimation (customer concentration)
            unique_payers = max(5, int(credit_count * self.rng.uniform(0.35, 0.75)))
            unique_payees = max(2, int(debit_count * self.rng.uniform(0.15, 0.40)))
            
            summary = {
                "month": month_str,
                "totalCredits": round(total_credits, 2),
                "totalDebits": round(total_debits, 2),
                "creditCount": credit_count,
                "debitCount": debit_count,
                "avgCreditAmount": round(total_credits / max(1, credit_count), 2),
                "avgDebitAmount": round(total_debits / max(1, debit_count), 2),
                "uniquePayerCount": unique_payers,
                "uniquePayeeCount": unique_payees,
                "peakDayVolume": peak_day,
                "lowDayVolume": low_day,
                "p2mRatio": 0.86, # Matches NPCI macro share
                "below500Count": below_500_count
            }
            monthly_summaries.append(summary)
            
            # Advance month
            if current_date.month == 12:
                current_date = current_date.replace(year=current_date.year + 1, month=1)
            else:
                current_date = current_date.replace(month=current_date.month + 1)
                
        # Calculate period end
        end_date = start_date + timedelta(days=30 * history_months)
        
        return {
            "summaryId": str(uuid.uuid4()),
            "msmeId": msme_id,
            "merchantVpa": vpa,
            "merchantCategoryCode": "5411", # Grocery/Supermarket default MCC
            "periodStart": start_date.isoformat(),
            "periodEnd": end_date.isoformat(),
            "monthlySummaries": monthly_summaries,
            "source": "SANDBOX",
            "fetchTimestamp": datetime.utcnow().isoformat() + "Z"
        }
