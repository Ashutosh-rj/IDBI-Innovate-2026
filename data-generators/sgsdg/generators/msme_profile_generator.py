import uuid
from datetime import datetime, date, timedelta
from typing import Dict, Any
import numpy as np
from .base import BaseGenerator, Scenario, MsmeCategory
from .gst_generator import GstGenerator
from .upi_generator import UpiGenerator
from .aa_generator import AaGenerator
from .epfo_generator import EpfoGenerator

class MsmeProfileGenerator(BaseGenerator):
    """
    Master orchestrator that generates a complete MSME profile along with all alternate data streams
    (GST, UPI, AA, EPFO) and computes a ground-truth proxy default label for ML scorecard training.
    """
    def __init__(self, seed: int = None):
        super().__init__(seed)
        self.gst_gen = GstGenerator(seed)
        self.upi_gen = UpiGenerator(seed)
        self.aa_gen = AaGenerator(seed)
        self.epfo_gen = EpfoGenerator(seed)

    def reseed(self, seed: int):
        super().reseed(seed)
        self.gst_gen.reseed(seed)
        self.upi_gen.reseed(seed + 1)
        self.aa_gen.reseed(seed + 2)
        self.epfo_gen.reseed(seed + 3)

    def generate(self, msme_id: str = None, category: str = None, scenario: str = None, **kwargs) -> Dict[str, Any]:
        if msme_id is None:
            msme_id = str(uuid.uuid4())
        if scenario is None:
            # Sample scenario based on cohort stratification weights
            scen_weights = self.config["cohort_stratification"]["scenarios"]
            scen_names = list(scen_weights.keys())
            scen_probs = list(scen_weights.values())
            scenario = self.rng.choice(scen_names, p=scen_probs)
        if category is None:
            category = self.rng.choice(["MICRO", "SMALL", "MEDIUM"], p=[0.70, 0.20, 0.10])
            
        history_months = 24
        if scenario == Scenario.NTC_THIN_FILE:
            history_months = self.config["scenarios"]["NTC_THIN_FILE"]["history_months"]
            
        start_date = date.today() - timedelta(days=history_months * 30)
        
        # Identifiers
        state_code = f"{self.rng.integers(1, 35):02d}"
        pan = f"{self.faker.lexify('?????')}{self.rng.integers(1000, 9999)}{self.faker.lexify('?')}".upper()
        gstin = f"{state_code}{pan}1Z{self.faker.lexify('?')}".upper()
        udyam = f"UDYAM-MH-{self.rng.integers(10, 99)}-{self.rng.integers(1000000, 9999999)}"
        vpa = f"{self.faker.company().lower().replace(' ', '').replace(',', '')}@idbi"
        est_code = f"MH/BAN/{self.rng.integers(10000, 99999)}/000"
        acc_ref = f"REF-{uuid.uuid4().hex[:10].upper()}"
        consent_id = str(uuid.uuid4())
        
        # Generate Alternate Data Streams
        gst_filings = self.gst_gen.generate(msme_id, category, scenario, gstin, start_date, history_months)
        upi_summary = self.upi_gen.generate(msme_id, category, scenario, vpa, start_date, history_months)
        aa_statement = self.aa_gen.generate(msme_id, consent_id, category, scenario, acc_ref, start_date, history_months)
        epfo_record = self.epfo_gen.generate(msme_id, category, scenario, est_code, start_date, history_months)
        
        # Profile metadata
        profile = {
            "msmeId": msme_id,
            "udyamNumber": udyam,
            "businessName": self.faker.company(),
            "legalName": self.faker.company() + " Pvt Ltd",
            "category": category,
            "sector": self.rng.choice(["MANUFACTURING", "SERVICES"], p=[0.45, 0.55]),
            "gstin": gstin,
            "pan": pan,
            "registrationDate": start_date.isoformat(),
            "address": {
                "line1": self.faker.street_address(),
                "city": "Mumbai",
                "district": "Mumbai City",
                "state": "Maharashtra",
                "pincode": f"4000{self.rng.integers(10, 99)}"
            },
            "nicCode": "2511",
            "investmentInPlantMachinery": 1500000.0 if category == "MICRO" else (15000000.0 if category == "SMALL" else 50000000.0),
            "declaredTurnover": round(float(np.sum([f["supDetails"]["osupDet"]["txval"] for f in gst_filings]) * (12.0 / history_months)), 2),
            "linkedAccounts": [
                {
                    "accountType": "BANK_CURRENT",
                    "linkedAccRef": acc_ref,
                    "fipId": "FIP-IDBI-001",
                    "maskedAccNumber": aa_statement["account"]["maskedAccNumber"]
                }
            ],
            "contactEmail": self.faker.company_email(),
            "contactMobile": f"9{self.rng.integers(100000000, 999999999)}",
            "numberOfEmployees": epfo_record["monthlySummaries"][-1]["activeMembers"],
            "epfoEstablishmentCode": est_code,
            "createdAt": datetime.utcnow().isoformat() + "Z",
            "updatedAt": datetime.utcnow().isoformat() + "Z"
        }
        
        # Compute Ground-Truth Proxy Default Label via Logistic Function of Features
        # Why: Guarantees no hardcoding while ensuring model learns real relationships!
        total_filings = len(gst_filings)
        late_filings = sum(1 for f in gst_filings if f["filingStatus"] in ["LATE", "NOT_FILED"])
        filing_delay_ratio = late_filings / max(1, total_filings)
        
        turnovers = [f["supDetails"]["osupDet"]["txval"] for f in gst_filings]
        turnover_cv = float(np.std(turnovers) / max(1.0, np.mean(turnovers))) if len(turnovers) > 1 else 0.0
        
        epfo_regularity = epfo_record["aggregateStats"]["contributionRegularity"]
        
        # Logistic equation: z = beta0 + beta1*delay_ratio + beta2*turnover_cv - beta3*epfo_regularity
        z = -2.5 + 3.2 * filing_delay_ratio + 1.8 * turnover_cv - 2.0 * epfo_regularity
        if scenario == Scenario.STRESSED_LIQUIDITY:
            z += 1.5
        elif scenario == Scenario.HEALTHY_ESTABLISHED:
            z -= 1.5
            
        prob_default = 1.0 / (1.0 + np.exp(-z))
        default_label = int(self.rng.random() < prob_default)
        
        return {
            "profile": profile,
            "gstFilings": gst_filings,
            "upiSummary": upi_summary,
            "aaStatement": aa_statement,
            "epfoRecord": epfo_record,
            "scenario": str(scenario),
            "groundTruthLabel": {
                "default12m": default_label,
                "defaultProbability": round(float(prob_default), 4),
                "labelingEquation": "z = -2.5 + 3.2*filing_delay + 1.8*turnover_cv - 2.0*epfo_regularity"
            }
        }
