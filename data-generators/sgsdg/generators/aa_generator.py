import uuid
from datetime import datetime, date, timedelta
from typing import Dict, Any
import numpy as np
from .base import BaseGenerator, Scenario

class AaGenerator(BaseGenerator):
    """
    Generates synthetic Account Aggregator FI statements compliant with aa-fi-statement.schema.json.
    Mirrors ReBIT FI Data schema v2.0.0 for DEPOSIT / CURRENT accounts.
    """
    def generate(self, msme_id: str, consent_id: str, category: str, scenario: str, account_ref: str, start_date: date, history_months: int = 24) -> Dict[str, Any]:
        scenario_config = self.config["scenarios"].get(scenario, self.config["scenarios"]["HEALTHY_ESTABLISHED"])
        
        # Base balance anchored by category
        base_balance = 50000.0
        if category == "SMALL":
            base_balance = 450000.0
        elif category == "MEDIUM":
            base_balance = 2500000.0
            
        if scenario == Scenario.STRESSED_LIQUIDITY:
            base_balance *= 0.25
        elif scenario == Scenario.HIGH_GROWTH:
            base_balance *= 1.8
            
        current_balance = round(float(self.rng.normal(base_balance, base_balance * 0.2)), 2)
        if current_balance < 0:
            current_balance = 5000.0
            
        od_limit = round(base_balance * 1.5, 2)
        
        # Generate transactions over the history period
        transactions = []
        curr_date = start_date
        running_bal = current_balance
        
        total_days = history_months * 30
        for day_offset in range(total_days):
            txn_date = start_date + timedelta(days=day_offset)
            
            # Decide if transaction happens today
            if self.rng.random() < 0.7:
                # 60% credit, 40% debit
                is_credit = self.rng.random() < 0.6
                mode = self.rng.choice(["UPI", "NEFT", "RTGS", "IMPS"], p=[0.55, 0.25, 0.15, 0.05])
                
                if is_credit:
                    amt = round(float(self.rng.lognormal(8.0, 1.2)), 2) # Average ~3000-8000
                    running_bal += amt
                    txn_type = "CREDIT"
                    narration = f"{mode}/CR/{self.faker.bban()}/{self.faker.company()}"
                else:
                    amt = round(float(self.rng.lognormal(8.2, 1.1)), 2)
                    running_bal = max(0.0, running_bal - amt)
                    txn_type = "DEBIT"
                    narration = f"{mode}/DR/{self.faker.bban()}/Supplier Payment"
                    
                txn_record = {
                    "type": txn_type,
                    "mode": str(mode),
                    "amount": f"{amt:.2f}",
                    "currentBalance": f"{running_bal:.2f}",
                    "transactionTimestamp": txn_date.isoformat() + "T10:30:00Z",
                    "narration": narration[:100],
                    "reference": f"TXN-{uuid.uuid4().hex[:10].upper()}",
                    "valueDate": txn_date.isoformat()
                }
                transactions.append(txn_record)
                
        end_date = start_date + timedelta(days=total_days)
        
        return {
            "statementId": str(uuid.uuid4()),
            "msmeId": msme_id,
            "consentId": consent_id,
            "sessionId": f"SESSION-{uuid.uuid4().hex[:12].upper()}",
            "fipId": "FIP-IDBI-001",
            "account": {
                "linkedAccRef": account_ref,
                "maskedAccNumber": f"XXXX-XXXX-{self.rng.integers(1000, 9999)}",
                "type": "deposit",
                "version": "2.0.0",
                "profile": {
                    "holders": {
                        "type": "SINGLE",
                        "holder": [
                            {
                                "name": self.faker.company(),
                                "dob": "1985-06-15",
                                "mobile": f"9{self.rng.integers(100000000, 999999999)}",
                                "pan": f"{self.faker.lexify('?????')}{self.rng.integers(1000, 9999)}{self.faker.lexify('?')}".upper(),
                                "email": self.faker.company_email(),
                                "nominee": "REGISTERED"
                            }
                        ]
                    }
                },
                "summary": {
                    "currentBalance": f"{running_bal:.2f}",
                    "currency": "INR",
                    "branch": "Main Branch, Mumbai",
                    "facility": "OD",
                    "ifscCode": "IBKL0000123",
                    "micrCode": "400259001",
                    "openingDate": start_date.isoformat(),
                    "currentODLimit": f"{od_limit:.2f}",
                    "drawingLimit": f"{od_limit * 0.8:.2f}",
                    "status": "ACTIVE"
                },
                "transactions": {
                    "startDate": start_date.isoformat(),
                    "endDate": end_date.isoformat(),
                    "transaction": transactions[-150:] # Keep last 150 txns to avoid bloated payloads
                }
            },
            "source": "SANDBOX",
            "fetchTimestamp": datetime.utcnow().isoformat() + "Z"
        }
