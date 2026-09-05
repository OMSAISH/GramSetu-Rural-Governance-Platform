import re
from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.user import User
from app.models.scheme import Scheme
from app.models.grievance import Grievance
from app.models.governance import GovernanceRecord
from app.schemas.chat import ChatRequest, ChatResponse
from app.services.auth_service import get_optional_user
from app.services.nlu_service import nlu_service
from app.services.sla_service import sla_service
from app.services.rule_engine import rule_evaluator
from app.services.translation_service import translation_service

router = APIRouter(prefix="/chat", tags=["Citizen Chatbot & NLU Assistant"])

@router.post("", response_model=ChatResponse)
async def chat_handler(
    payload: ChatRequest,
    current_user: Optional[User] = Depends(get_optional_user),
    db: AsyncSession = Depends(get_db)
):
    lang = payload.language or (current_user.preferred_language if current_user else "en")
    if lang not in ("en", "hi", "mr"):
        lang = "en"

    message = payload.message.strip()
    user_id = payload.user_id or (current_user.id if current_user else None)

    # 1. NLU Intent Classification
    intent, confidence, entities = nlu_service.classify_intent(message)

    # 2. Check for explicit tracking ID query
    if "tracking_id" in entities:
        tracking_id = entities["tracking_id"]
        stmt = select(Grievance).where(Grievance.tracking_id == tracking_id)
        res = await db.execute(stmt)
        g = res.scalar_one_or_none()
        if g:
            status_localized = translation_service.get_static_text(g.status, target_lang=lang)
            category_localized = translation_service.get_static_text(g.category, target_lang=lang)
            deadline_str = g.sla_deadline.strftime("%d-%b-%Y")
            
            if lang == "hi":
                reply = f"शिकायत आईडी {g.tracking_id} की स्थिति: **{status_localized}**। श्रेणी: {category_localized}। विभाग: {g.department_assigned}। अनुमानित समाधान तिथि: {deadline_str}।"
            elif lang == "mr":
                reply = f"तक्रार आयडी {g.tracking_id} ची स्थिती: **{status_localized}** आहे. श्रेणी: {category_localized}. विभाग: {g.department_assigned}. निवारण मुदत: {deadline_str}."
            else:
                reply = f"Grievance ID {g.tracking_id} Status: **{status_localized}**. Category: {category_localized}. Assigned Dept: {g.department_assigned}. SLA Deadline: {deadline_str}."
            
            return ChatResponse(
                reply=reply,
                language=lang,
                intent_detected="grievance",
                suggested_actions=["Track Another Grievance", "Check Scheme Eligibility", "View Panchayat Works"],
                metadata={"tracking_id": g.tracking_id, "status": g.status}
            )

    # 3. Route according to Intent
    if intent == "scheme_check":
        # If user has a profile with income/age
        profile = {}
        if current_user:
            profile = {
                "age": current_user.age,
                "annual_income": current_user.annual_income,
                "category": current_user.category,
                "occupation": current_user.occupation,
                "land_owned_acres": current_user.land_owned_acres,
                "gender": current_user.gender,
                "has_disability": current_user.has_disability,
            }

        stmt = select(Scheme).order_by(Scheme.id)
        schemes_res = await db.execute(stmt)
        schemes = schemes_res.scalars().all()

        if profile.get("age") is not None and profile.get("annual_income") is not None:
            eligible_schemes = []
            for s in schemes:
                is_el, _ = rule_evaluator.evaluate(s.eligibility_rules, profile, lang=lang)
                if is_el:
                    s_name = s.name
                    if lang == "hi" and s.name_hi:
                        s_name = s.name_hi
                    elif lang == "mr" and s.name_mr:
                        s_name = s.name_mr
                    eligible_schemes.append(s_name)

            if eligible_schemes:
                if lang == "hi":
                    reply = f"आपकी प्रोफाइल के अनुसार, आप इन {len(eligible_schemes)} योजनाओं के लिए पात्र हैं:\n" + "\n".join([f"• **{name}**" for name in eligible_schemes]) + "\n\nआप पात्रता टैब में जाकर पहले से भरा हुआ आवेदन फॉर्म डाउनलोड कर सकते हैं।"
                elif lang == "mr":
                    reply = f"तुमच्या प्रोफाइलनुसार, तुम्ही या {len(eligible_schemes)} योजनांसाठी पात्र आहात:\n" + "\n".join([f"• **{name}**" for name in eligible_schemes]) + "\n\nतुम्ही पात्रता टॅबमध्ये जाऊन पूर्व-भरलेला अर्ज डाउनलोड करू शकता."
                else:
                    reply = f"Based on your profile, you are eligible for {len(eligible_schemes)} welfare schemes:\n" + "\n".join([f"• **{name}**" for name in eligible_schemes]) + "\n\nYou can download your pre-filled application forms in the Scheme Eligibility portal."
            else:
                if lang == "hi":
                    reply = "वर्तमान मानदंडों के अनुसार आप किसी भी योजना के लिए सीधे पात्र नहीं हैं। अधिक जानकारी के लिए ग्राम पंचायत कार्यालय से संपर्क करें।"
                elif lang == "mr":
                    reply = "सध्याच्या निकषांनुसार तुम्ही थेट कोणत्याही योजनेसाठी पात्र ठरत नाही. अधिक माहितीसाठी ग्रामपंचायत कार्यालयाशी संपर्क साधावा."
                else:
                    reply = "Based on your current profile metrics, you do not meet the direct criteria for these schemes. Please visit the Gram Panchayat office for special relaxations."
        else:
            # Tell user about schemes and suggest filling their profile
            schemes_list = []
            for s in schemes[:3]:
                name = s.name_hi if lang == "hi" and s.name_hi else (s.name_mr if lang == "mr" and s.name_mr else s.name)
                schemes_list.append(f"• **{name}** ({s.department})")
            
            if lang == "hi":
                reply = f"ग्रामसेतु इन मुख्य योजनाओं के लिए पात्रता जांचता है:\n" + "\n".join(schemes_list) + "\n\nसटीक पात्रता जांचने के लिए कृपया अपनी आयु, वार्षिक आय और सामाजिक श्रेणी दर्ज करें।"
            elif lang == "mr":
                reply = f"ग्रामसेतू या प्रमुख योजनांसाठी पात्रता तपासतो:\n" + "\n".join(schemes_list) + "\n\nअचूक पात्रता तपासण्यासाठी कृपया तुमचे वय, वार्षिक उत्पन्न आणि जात प्रवर्ग नोंदवा."
            else:
                reply = f"GramSetu proactively verifies eligibility for top welfare schemes:\n" + "\n".join(schemes_list) + "\n\nPlease complete your citizen profile (age, income, category) to see personalized results and download pre-filled PDF applications."

        return ChatResponse(
            reply=reply,
            language=lang,
            intent_detected="scheme_check",
            suggested_actions=["Check Full Eligibility", "Download Application Form", "File Grievance"],
            metadata={"schemes_count": len(schemes)}
        )

    elif intent == "grievance":
        # Check if the user is describing a specific issue to file
        is_filing_intent = any(word in message.lower() for word in [
            "broken", "leak", "problem", "not working", "pothole", "dirty", "garbage", "dark",
            "खराब", "पानी नहीं", "गड्ढा", "कचरा", "अंधेरा", "समस्या", "तक्रार", "गळती", "घाण", "लाईट बंद"
        ])

        if is_filing_intent and len(message.split()) >= 3:
            # Auto-file the grievance
            category, department, sla_days = sla_service.classify_grievance(message)
            deadline = sla_service.calculate_deadline(sla_days)
            tracking_id = sla_service.generate_tracking_id()

            # Ensure we have a valid user_id
            target_user_id = user_id
            if not target_user_id:
                stmt_u = select(User).where(User.role == "citizen").limit(1)
                u_res = await db.execute(stmt_u)
                c_user = u_res.scalar_one_or_none()
                target_user_id = c_user.id if c_user else 1

            desc_en = message
            if lang != "en":
                desc_en = translation_service.translate_to_english(message, source_lang=lang)

            new_g = Grievance(
                tracking_id=tracking_id,
                user_id=target_user_id,
                category=category,
                description=message,
                description_english=desc_en,
                status="submitted",
                department_assigned=department,
                sla_deadline=deadline,
                created_at=datetime.utcnow()
            )
            db.add(new_g)
            await db.commit()

            deadline_str = deadline.strftime("%d-%b-%Y")
            dept_localized = department
            cat_localized = translation_service.get_static_text(category, target_lang=lang)

            if lang == "hi":
                reply = f"आपकी शिकायत दर्ज कर ली गई है! ✅\n\n• **ट्रैकिंग आईडी**: `{tracking_id}`\n• **श्रेणी**: {cat_localized}\n• **विभाग**: {dept_localized}\n• **समाधान समयसीमा (SLA)**: {deadline_str}\n\nआप किसी भी समय इस आईडी से स्थिति ट्रैक कर सकते हैं।"
            elif lang == "mr":
                reply = f"तुमची तक्रार यशस्वीरित्या नोंदवली गेली आहे! ✅\n\n• **ट्रॅकिंग आयडी**: `{tracking_id}`\n• **श्रेणी**: {cat_localized}\n• **संबंधित विभाग**: {dept_localized}\n• **निवारण मुदत (SLA)**: {deadline_str}\n\nतुम्ही हा आयडी वापरून कधीही प्रगती तपासू शकता."
            else:
                reply = f"Your grievance has been officially registered! ✅\n\n• **Tracking ID**: `{tracking_id}`\n• **Category**: {cat_localized}\n• **Department**: {dept_localized}\n• **SLA Deadline**: {deadline_str}\n\nYou can track the live resolution status anytime using this ID."

            return ChatResponse(
                reply=reply,
                language=lang,
                intent_detected="grievance",
                suggested_actions=[f"Track {tracking_id}", "File Another Grievance", "View Governance Records"],
                metadata={"tracking_id": tracking_id, "category": category, "department": department}
            )
        else:
            if lang == "hi":
                reply = "आप ग्राम पंचायत से संबंधित किसी भी समस्या (पानी, सड़क, बिजली, पेंशन, स्वच्छता) की शिकायत यहाँ लिख सकते हैं। कृपया अपनी समस्या का थोड़ा विवरण दें।"
            elif lang == "mr":
                reply = "तुम्ही ग्रामपंचायतीशी संबंधित कोणत्याही समस्येची (पाणी, रस्ते, वीज, पेन्शन, स्वच्छता) तक्रार येथे नोंदवू शकता. कृपया समस्येचे थोडे वर्णन सांगा."
            else:
                reply = "You can file grievances regarding water leaks, streetlights, road repairs, sanitation, or pension delays. Please describe your issue, or type a Tracking ID (e.g. GS-2026-XXXXX) to track an existing request."

            return ChatResponse(
                reply=reply,
                language=lang,
                intent_detected="grievance",
                suggested_actions=["Report Water Leak", "Report Broken Streetlight", "Track Grievance"],
                metadata={}
            )

    elif intent == "governance_query":
        # Search records
        stmt = select(GovernanceRecord).order_by(GovernanceRecord.date.desc()).limit(3)
        res = await db.execute(stmt)
        records = res.scalars().all()

        formatted_records = []
        for r in records:
            title = r.title_hi if lang == "hi" and r.title_hi else (r.title_mr if lang == "mr" and r.title_mr else r.title)
            date_str = r.date.strftime("%d-%b-%Y")
            amount_str = f" (₹{r.amount:,.0f})" if r.amount else ""
            formatted_records.append(f"• **{title}** [{r.category.upper()}] - {r.status.title()} ({date_str}){amount_str}")

        header = translation_service.get_static_text("governance_records_found", target_lang=lang)
        reply = f"{header}\n\n" + "\n".join(formatted_records)

        return ChatResponse(
            reply=reply,
            language=lang,
            intent_detected="governance_query",
            suggested_actions=["View All Meetings", "View Village Budget & Works", "Ask About Welfare Schemes"],
            metadata={"record_count": len(records)}
        )

    else:
        # General greeting / fallback
        welcome = translation_service.get_static_text("welcome_message", target_lang=lang)
        prompt = translation_service.get_static_text("help_prompt", target_lang=lang)
        reply = f"{welcome}\n\n💡 {prompt}"

        return ChatResponse(
            reply=reply,
            language=lang,
            intent_detected="general",
            suggested_actions=["Check Scheme Eligibility", "File a Grievance", "Panchayat Meetings & Works"],
            metadata={}
        )
