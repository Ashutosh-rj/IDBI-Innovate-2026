import pytest
import numpy as np
from ml.evaluate import evaluate_fairness_across_segments

def test_fairness_evaluation_pass():
    """
    AUDIT-T2-3: Test fairness evaluation across cohort segments under fair conditions.
    When score distributions and approval rates across MICRO, SMALL, and MEDIUM segments
    satisfy the industry standard four-fifths (80%) rule (DIR >= 0.80), overallPassedFairness MUST be True.
    """
    np.random.seed(42)
    n_per_seg = 100
    
    # Generate scores with similar distributions across segments
    scores_micro = np.random.normal(700, 50, n_per_seg)
    scores_small = np.random.normal(710, 50, n_per_seg)
    scores_medium = np.random.normal(720, 50, n_per_seg)
    
    scores = np.concatenate([scores_micro, scores_small, scores_medium])
    y_true = np.random.binomial(1, 0.05, len(scores))
    y_prob = np.random.uniform(0.01, 0.1, len(scores))
    
    segments = ["MICRO"] * n_per_seg + ["SMALL"] * n_per_seg + ["MEDIUM"] * n_per_seg
    
    res = evaluate_fairness_across_segments(y_true, y_prob, scores, segments, reference_segment="MEDIUM")
    
    assert res["overallPassedFairness"] is True
    assert "segmentMetrics" in res
    assert "disparateImpactAnalysis" in res
    assert res["referenceSegment"] == "MEDIUM"
    
    for seg in ["MICRO", "SMALL", "MEDIUM"]:
        assert seg in res["segmentMetrics"]
        assert seg in res["disparateImpactAnalysis"]
        assert res["disparateImpactAnalysis"][seg]["isFair"] is True
        assert res["disparateImpactAnalysis"][seg]["disparateImpactRatio"] >= 0.80

def test_fairness_evaluation_disparate_impact_warning():
    """
    AUDIT-T2-3: Test that severe disparity in approval rates triggers disparate impact warning.
    If a segment's approval rate drops below 80% of the reference segment without valid leniency,
    overallPassedFairness MUST be False and isFair MUST be False.
    """
    np.random.seed(42)
    
    # Reference segment (MEDIUM): high scores, 90% approval rate
    scores_medium = np.full(100, 750)
    # Target segment (MICRO): low scores, only 30% approval rate
    scores_micro = np.array([650]*30 + [550]*70)
    
    scores = np.concatenate([scores_medium, scores_micro])
    y_true = np.zeros(len(scores))
    y_prob = np.zeros(len(scores))
    segments = ["MEDIUM"] * 100 + ["MICRO"] * 100
    
    res = evaluate_fairness_across_segments(y_true, y_prob, scores, segments, reference_segment="MEDIUM", approval_threshold=600)
    
    assert res["overallPassedFairness"] is False
    assert res["disparateImpactAnalysis"]["MICRO"]["isFair"] is False
    assert res["disparateImpactAnalysis"]["MICRO"]["disparateImpactRatio"] < 0.80
    assert "WARNING" in res["disparateImpactAnalysis"]["MICRO"]["status"]
