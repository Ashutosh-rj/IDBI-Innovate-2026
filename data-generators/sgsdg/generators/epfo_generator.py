import uuid
from datetime import datetime, date, timedelta
from typing import Dict, Any
import numpy as np
from .base import BaseGenerator, Scenario

class EpfoGenerator(BaseGenerator):
    """
    Generates synthetic EPFO employer contribution records compliant with epfo-contribution.schema.json.
    Samples establishment size from Pareto(20, 1.35) and wage from LogNormal(9.8, 0.4).
    """
    def generate(self, msme_id: str, category: str, scenario: str, est_code: str, start_date: date, history_months: int = 24) -> Dict[str, Any]:
        pareto_config = self.config["epfo"]["establishment_size_pareto"]
        wage_config = self.config["epfo"]["wage_lognorm"]
        scenario_config = self.config["scenarios"].get(scenario, self.config["scenarios"]["HEALTHY_ESTABLISHED"])
        
        # Determine employee count: mandatory for 20+, Pareto distribution
        if category == "MICRO":
            base_employees = int(self.rng.uniform(5, 25))
        else:
            # Sample from Pareto: x_m / (U^(1/alpha))
            u = self.rng.random()
            pareto_sample = pareto_config["xm"] / (u ** (1.0 / pareto_config["alpha"]))
            base_employees = min(500, max(20, int(pareto_sample)))
            
        covered = base_employees >= 20
        compliance_prob = self.config["epfo"]["compliance_probabilities"].get(scenario, 0.85)
        
        monthly_summaries = []
        current_date = start_date
        current_members = base_employees
        
        total_defaulted = 0
        total_penalties = 0.0
        on_time_count = 0
        
        for m in range(history_months):
            month_str = current_date.strftime("%Y-%m")
            
            # Headcount evolution
            if scenario == Scenario.HIGH_GROWTH:
                new_joiners = int(self.rng.poisson(3))
                exits = int(self.rng.poisson(1))
            elif scenario == Scenario.STRESSED_LIQUIDITY:
                new_joiners = int(self.rng.poisson(0.5))
                exits = int(self.rng.poisson(2.5))
            else:
                new_joiners = int(self.rng.poisson(1.5))
                exits = int(self.rng.poisson(1.5))
                
            current_members = max(5, current_members + new_joiners - exits)
            
            # Wage calculation
            mean_wage = self.rng.lognormal(wage_config["mu"], wage_config["sigma"])
            total_basic_wages = round(float(current_members * mean_wage), 2)
            
            employer_contrib = round(total_basic_wages * 0.12, 2)
            employee_contrib = round(total_basic_wages * 0.12, 2)
            admin_charges = round(total_basic_wages * 0.005, 2)
            
            due_date = (current_date.replace(day=1) + timedelta(days=32)).replace(day=15)
            
            is_on_time = self.rng.random() < compliance_prob
            status = "ON_TIME"
            delay_days = 0
            penalty = 0.0
            payment_date = due_date
            trrn = f"TRRN{self.rng.integers(1000000000, 9999999999)}"
            
            if not is_on_time and covered:
                if self.rng.random() < 0.7:
                    status = "LATE"
                    delay_days = int(self.rng.exponential(20)) + 1
                    payment_date = due_date + timedelta(days=delay_days)
                    # Penalty: 1% of arrears per month + 12% p.a. interest
                    months_delayed = (delay_days // 30) + 1
                    penalty = round((employer_contrib + employee_contrib) * (0.01 * months_delayed + (0.12 * delay_days / 365.0)), 2)
                else:
                    status = "DEFAULTED"
                    delay_days = max(0, (date.today() - due_date).days)
                    payment_date = None
                    total_defaulted += 1
                    months_delayed = (delay_days // 30) + 1
                    penalty = round((employer_contrib + employee_contrib) * (0.01 * months_delayed + (0.12 * delay_days / 365.0)), 2)
                    trrn = None
            else:
                on_time_count += 1
                
            total_penalties += penalty
            
            summary = {
                "month": month_str,
                "activeMembers": current_members,
                "newJoiners": new_joiners,
                "exits": exits,
                "totalBasicWages": total_basic_wages,
                "employerContribution": employer_contrib,
                "employeeContribution": employee_contrib,
                "adminCharges": admin_charges,
                "wageMonth": month_str,
                "dueDate": due_date.isoformat(),
                "paymentDate": payment_date.isoformat() if payment_date else None,
                "contributionStatus": status,
                "delayDays": int(delay_days),
                "penaltyAmount": round(penalty, 2),
                "trrn": trrn
            }
            monthly_summaries.append(summary)
            
            if current_date.month == 12:
                current_date = current_date.replace(year=current_date.year + 1, month=1)
            else:
                current_date = current_date.replace(month=current_date.month + 1)
                
        regularity = round(float(on_time_count / max(1, history_months)), 3)
        
        return {
            "recordId": str(uuid.uuid4()),
            "msmeId": msme_id,
            "establishmentCode": est_code,
            "establishmentName": self.faker.company(),
            "registrationDate": (start_date - timedelta(days=365)).isoformat(),
            "coveredUnderAct": covered,
            "monthlySummaries": monthly_summaries,
            "aggregateStats": {
                "avgActiveMembers": round(float(np.mean([s["activeMembers"] for s in monthly_summaries])), 1),
                "memberGrowthRate": round(float((monthly_summaries[-1]["activeMembers"] - monthly_summaries[0]["activeMembers"]) / max(1, monthly_summaries[0]["activeMembers"])), 3),
                "contributionRegularity": regularity,
                "totalDefaultedMonths": total_defaulted,
                "totalPenaltiesPaid": round(total_penalties, 2)
            },
            "source": "SANDBOX",
            "fetchTimestamp": datetime.utcnow().isoformat() + "Z"
        }
