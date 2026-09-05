import re
import logging
from typing import Tuple, Dict, Any, Optional

logger = logging.getLogger(__name__)

INTENT_PATTERNS = {
    "scheme_check": [
        r"\bscheme\b", r"\beligib\w*\b", r"\bapply\b", r"\bqualif\w*\b", r"\byojana\b", r"\bpension\b",
        r"\bawas\b", r"\bmgnrega\b", r"\bscholarship\b", r"\bform\b", r"\bbenefit\b",
        r"योजना", r"पात्रता", r"पात्र", r"आवेदन", r"लाभ", r"पेंशन", r"आवास", r"छात्रवृत्ति", r"फॉर्म",
        r"योजना", r"पात्रता", r"पात्र", r"अर्ज", r"लाभ", r"पेन्शन", r"घरकुल", r"शिष्यवृत्ती", r"मिळेल"
    ],
    "grievance": [
        r"\bgrievance\b", r"\bcomplain\w*\b", r"\bbroken\b", r"\bleak\b", r"\bpothole\b", r"\bissue\b",
        r"\bproblem\b", r"\btrack\b", r"\bstatus\b", r"\bnot\s+working\b", r"\bdanger\b",
        r"शिकायत", r"समस्या", r"टूटा", r"खराब", r"पानी नहीं", r"बिजली नहीं", r"गंदगी", r"ट्रैक", r"स्थिति",
        r"तक्रार", r"समस्या", r"अडचण", r"नादुरुस्त", r"गळती", r"खड्डा", r"घाण", r"ट्रॅक", r"स्थिती"
    ],
    "governance_query": [
        r"\bmeeting\b", r"\bgram\s*sabha\b", r"\bsabha\b", r"\bfund\b", r"\bbudget\b", r"\bwork\b",
        r"\bdevelopment\b", r"\bsarpanch\b", r"\bexpenditure\b", r"\bproject\b",
        r"बैठक", r"ग्राम\s*सभा", r"सरपंच", r"फंड", r"बजट", r"कार्य", r"विकास", r"पैसा", r"खर्च",
        r"बैठक", r"ग्रामसभा", r"सरपंच", r"निधी", r"अंदाजपत्रक", r"कामे", r"विकास कामे", r"खर्च"
    ]
}

class NLUService:
    @staticmethod
    def classify_intent(message: str) -> Tuple[str, float, Dict[str, Any]]:
        """
        Classifies citizen message into:
        - scheme_check
        - grievance
        - governance_query
        - general
        Returns: (intent, confidence, extracted_entities)
        """
        text = message.strip()
        normalized = text.lower()
        extracted: Dict[str, Any] = {}

        # Check for Tracking ID pattern e.g., GS-2026-12345
        tracking_match = re.search(r"\b(GS-\d{4}-\d{4,6})\b", text, re.IGNORECASE)
        if tracking_match:
            extracted["tracking_id"] = tracking_match.group(1).upper()
            return "grievance", 0.95, extracted

        scores = {
            "scheme_check": 0,
            "grievance": 0,
            "governance_query": 0,
        }

        for intent, patterns in INTENT_PATTERNS.items():
            for pattern in patterns:
                matches = len(re.findall(pattern, normalized, re.IGNORECASE))
                if matches > 0:
                    scores[intent] += matches

        best_intent = max(scores, key=scores.get)
        best_score = scores[best_intent]

        if best_score == 0:
            # Greetings or general queries
            return "general", 0.70, extracted

        confidence = min(0.60 + (best_score * 0.15), 0.98)
        return best_intent, confidence, extracted

nlu_service = NLUService()
