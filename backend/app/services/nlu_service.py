import re
import logging
from typing import Tuple, Dict, Any, Optional

logger = logging.getLogger(__name__)

INTENT_PATTERNS = {
    "greeting": [
        r"\bhello\b", r"\bhi\b", r"\bhey\b", r"\bnamaste\b", r"\bgood\s*morning\b", r"\bgood\s*evening\b",
        r"\bwho\s*are\s*you\b", r"\bhelp\b",
        r"नमस्ते", r"नमस्कार", r"प्रणाम", r"राम\s*राम", r"सुप्रभात", r"तुम\s*कौन\s*हो", r"मदद",
        r"नमस्कार", r"नमस्ते", r"सुप्रभात", r"राम\s*राम", r"तू\s*कोण\s*आहेस", r"मदत"
    ],
    "scheme_check": [
        r"\bscheme\b", r"\beligib\w*\b", r"\bapply\b", r"\bqualif\w*\b", r"\byojana\b", r"\bpension\b",
        r"\bawas\b", r"\bmgnrega\b", r"\bscholarship\b", r"\bform\b", r"\bbenefit\b", r"\bkisan\b",
        r"\bfarmer\b", r"\bsubsidy\b", r"\bloan\b", r"\bration\b", r"\btoilet\b", r"\bhousing\b", r"\bpmay\b",
        r"\binsurance\b",
        r"योजना", r"पात्रता", r"पात्र", r"आवेदन", r"लाभ", r"पेंशन", r"आवास", r"मकान", r"घर",
        r"छात्रवृत्ति", r"फॉर्म", r"किसान", r"कृषि", r"सब्सिडी", r"अनुदान", r"कर्ज", r"राशन",
        r"शौचालय", r"मनरेगा", r"रोजगार", r"वृद्धावस्था", r"विधवा", r"बीमा",
        r"योजना", r"पात्रता", r"पात्र", r"अर्ज", r"लाभ", r"मिळेल", r"पेन्शन", r"निवृत्तीवेतन",
        r"घरकुल", r"आवास", r"घर", r"मनरेगा", r"रोजगार\s*हमी", r"शिष्यवृत्ती", r"शेतकरी",
        r"किसान", r"कृषी", r"सबसिडी", r"अनुदान", r"कर्ज", r"रेशन", r"शौचालय", r"वृद्ध",
        r"विधवा", r"अपंग", r"विमा", r"पीक"
    ],
    "grievance": [
        r"\bgrievance\b", r"\bcomplain\w*\b", r"\bbroken\b", r"\bleak\w*\b", r"\bpothole\w*\b", r"\bissue\b",
        r"\bproblem\b", r"\btrack\b", r"\bstatus\b", r"\bnot\s+working\b", r"\bdanger\b", r"\bwater\b",
        r"\bpipeline\b", r"\bpipe\b", r"\bstreet\s*light\b", r"\belectric\w*\b", r"\bdrain\w*\b",
        r"\bgarbage\b", r"\bsanitat\w*\b", r"\brepair\b", r"\bfix\b", r"\bdark\b", r"\bsewage\b",
        r"शिकायत", r"समस्या", r"टूटा", r"टूटी", r"खराब", r"पानी\s*नहीं", r"नल", r"पाइप", r"पाइपलाइन",
        r"बिजली", r"लाइट", r"स्ट्रीट\s*लाइट", r"अंधेरा", r"गंदगी", r"कचरा", r"नाली", r"सीवर",
        r"गड्ढा", r"सड़क", r"लीकेज", r"मरम्मत", r"ठीक\s*करो", r"बंद\s*है", r"चालू\s*नहीं", r"ट्रैक",
        r"स्थिति", r"स्टेटस",
        r"तक्रार", r"समस्या", r"अडचण", r"नादुरुस्त", r"खराब", r"फुटली", r"फुटला", r"गळती",
        r"पाणी\s*गळती", r"पाणी\s*येत\s*नाही", r"पाणी", r"नळ", r"पाईप", r"पाईपलाईन", r"वीज",
        r"लाईट", r"पथदिवे", r"अंधार", r"खड्डा", r"खड्डे", r"रस्ता", r"कचरा", r"घाण", r"गटार",
        r"दुर्गंधी", r"दुरुस्त", r"दुरुस्ती", r"बंद\s*आहे", r"चालू\s*नाही", r"ट्रॅक", r"स्थिती",
        r"स्टेटस"
    ],
    "governance_query": [
        r"\bmeeting\b", r"\bgram\s*sabha\b", r"\bsabha\b", r"\bfund\b", r"\bbudget\b", r"\bwork\b",
        r"\bdevelopment\b", r"\bsarpanch\b", r"\bup-sarpanch\b", r"\bgram\s*sevak\b", r"\bpanchayat\b",
        r"\bexpenditure\b", r"\bproject\b", r"\baudit\b", r"\btender\b", r"\bcertificate\b", r"\boffice\b",
        r"बैठक", r"ग्राम\s*सभा", r"सभा", r"सरपंच", r"उपसरपंच", r"ग्राम\s*सेवक", r"पंचायत",
        r"फंड", r"बजट", r"कार्य", r"विकास", r"पैसा", r"खर्च", r"परियोजना", r"ऑडिट", r"टेंडर",
        r"प्रमाण\s*पत्र", r"दाखिला", r"कार्यालय",
        r"बैठक", r"ग्रामसभा", r"सभा", r"सरपंच", r"उपसरपंच", r"ग्रामसेवक", r"ग्रामपंचायत",
        r"निधी", r"अंदाजपत्रक", r"बजेट", r"कामे", r"विकास\s*कामे", r"खर्च", r"ऑडिट", r"टेंडर",
        r"दाखला", r"प्रमाणपत्र", r"जन्म\s*दाखला", r"मृत्यू\s*दाखला", r"कार्यालय"
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

        scores = {intent: 0 for intent in INTENT_PATTERNS}

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
