import re
import random
from datetime import datetime, timedelta
from typing import Tuple
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

# SLA durations (days) per category
CATEGORY_SLA_DAYS = {
    "water": 3,
    "electricity": 4,
    "sanitation": 7,
    "road": 15,
    "pension": 15,
    "other": 10,
}

# Department routing per category
CATEGORY_DEPARTMENTS = {
    "water": "Rural Water Supply & Sanitation Department",
    "electricity": "Gram Panchayat Energy Cell (MSEDCL/State Discom)",
    "sanitation": "Health & Rural Sanitation Committee",
    "road": "Public Works Department (PWD Rural Roads)",
    "pension": "Social Welfare & Women/Child Development Cell",
    "other": "Panchayat Development Office (PDO)",
}

# Multilingual keywords for grievance classification
KEYWORD_RULES = {
    "water": [
        r"\bwater\b", r"\bpipeline\b", r"\bpipe\b", r"\btap\b", r"\bborewell\b", r"\bdrinking\b", r"\bleak\w*\b",
        r"पानी", r"नल", r"जल", r"पाइप", r"पाइपलाइन", r"बोरवेल", r"सप्लाई", r"लीकेज", r"फूटी", r"टैंकर",
        r"पाणी", r"नळ", r"विहीर", r"पाईप", r"पाईपलाईन", r"गळती", r"पुरवठा", r"फुटली", r"फुटला", r"टँकर"
    ],
    "electricity": [
        r"\belectricity\b", r"\blight\b", r"\bstreet\s*light\b", r"\bpower\b", r"\btransformer\b", r"\bpole\b", r"\bdark\b",
        r"बिजली", r"लाइट", r"स्ट्रीट लाइट", r"खंभा", r"ट्रांसफार्मर", r"अंधेरा", r"खराब", r"बिजली गुल",
        r"वीज", r"लाईट", r"पथदिवे", r"खांब", r"ट्रान्सफॉर्मर", r"अंधार", r"बंद आहे", r"नादुरुस्त"
    ],
    "sanitation": [
        r"\bsanitation\b", r"\bgarbage\b", r"\bwaste\b", r"\bdrain\b", r"\bgutter\b", r"\bcleaning\b", r"\btrash\b", r"\bsewage\b",
        r"कचरा", r"गंदगी", r"सफाई", r"नाली", r"गटर", r"स्वच्छता", r"बदबू", r"शौचालय",
        r"कचरा", r"घाण", r"स्वच्छता", r"गटार", r"नाले", r"सफाई", r"दुर्गंधी", r"शौचालय"
    ],
    "road": [
        r"\broad\b", r"\bpothole\b", r"\bpavement\b", r"\bbridge\b", r"\bhighway\b", r"\bfootpath\b",
        r"सड़क", r"गड्ढा", r"रास्ता", r"मरम्मत", r"पुल", r"टूटी सड़क",
        r"रस्ता", r"खड्डा", r"खड्डे", r"मार्ग", r"दुरुस्ती", r"पूल", r"डांबरीकरण"
    ],
    "pension": [
        r"\bpension\b", r"\bold age\b", r"\bwidow\b", r"\bdisbursement\b", r"\binstallment\b",
        r"पेंशन", r"वृद्धावस्था", r"विधवा", r"किस्त", r"वृद्ध",
        r"पेन्शन", r"निवृत्तीवेतन", r"विधवा", r"हप्ता", r"ज्येष्ठ"
    ],
}

class SLAService:
    @staticmethod
    def classify_grievance(text: str) -> Tuple[str, str, int]:
        """
        Classifies grievance text into category, department, and SLA days.
        Uses regex and multilingual keyword matching.
        """
        normalized = text.lower()
        matched_scores = {cat: 0 for cat in KEYWORD_RULES}

        for category, patterns in KEYWORD_RULES.items():
            for pattern in patterns:
                if re.search(pattern, normalized, re.IGNORECASE):
                    matched_scores[category] += 1

        # Select highest scoring category
        best_category = max(matched_scores, key=matched_scores.get)
        if matched_scores[best_category] == 0:
            best_category = "other"

        sla_days = CATEGORY_SLA_DAYS.get(best_category, 10)
        department = CATEGORY_DEPARTMENTS.get(best_category, CATEGORY_DEPARTMENTS["other"])

        return best_category, department, sla_days

    @staticmethod
    def calculate_deadline(days: int) -> datetime:
        return datetime.utcnow() + timedelta(days=days)

    @staticmethod
    def generate_tracking_id() -> str:
        year = datetime.utcnow().year
        rand_num = random.randint(10000, 99999)
        return f"GS-{year}-{rand_num}"

    @staticmethod
    async def check_and_escalate_overdue_grievances(db: AsyncSession) -> int:
        """
        Scans grievances past their SLA deadline that are not yet resolved
        and escalates their status. Returns count of escalated records.
        """
        from app.models.grievance import Grievance
        now = datetime.utcnow()

        stmt = select(Grievance).where(
            Grievance.status.in_(["submitted", "in_progress"]),
            Grievance.sla_deadline < now
        )
        result = await db.execute(stmt)
        overdue_grievances = result.scalars().all()

        count = 0
        for item in overdue_grievances:
            item.status = "escalated"
            if not item.resolution_notes:
                item.resolution_notes = f"Auto-escalated by GramSetu SLA Monitor on {now.strftime('%Y-%m-%d %H:%M')}: SLA deadline breached."
            else:
                item.resolution_notes += f" | Auto-escalated on {now.strftime('%Y-%m-%d %H:%M')} (SLA breached)."
            count += 1

        if count > 0:
            await db.commit()

        return count

sla_service = SLAService()
