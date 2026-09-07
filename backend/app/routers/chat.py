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
    msg_lower = message.lower()
    user_id = payload.user_id or (current_user.id if current_user else None)

    # 1. NLU Intent Classification
    intent, confidence, entities = nlu_service.classify_intent(message)

    # 2. Check for explicit Tracking ID query (e.g., GS-2026-XXXX)
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
                reply = (
                    f"शिकायत आईडी `{g.tracking_id}` का आधिकारिक विवरण:\n\n"
                    f"• **स्थिति**: **{status_localized}**\n"
                    f"• **श्रेणी**: {category_localized}\n"
                    f"• **नियुक्त विभाग**: {g.department_assigned}\n"
                    f"• **SLA समाधान अंतिम तिथि**: {deadline_str}\n\n"
                    f"कार्यवाही निर्धारित समयसीमा के भीतर पूरी करने की गारंटी है।"
                )
            elif lang == "mr":
                reply = (
                    f"तक्रार आयडी `{g.tracking_id}` चा अधिकृत तपशील:\n\n"
                    f"• **सद्यस्थिती**: **{status_localized}**\n"
                    f"• **श्रेणी**: {category_localized}\n"
                    f"• **नियुक्त विभाग**: {g.department_assigned}\n"
                    f"• **SLA निवारण हमी मुदत**: {deadline_str}\n\n"
                    f"प्रशासनामार्फत निर्धारित वेळेत काम पूर्ण करण्याचे आदेश दिले आहेत."
                )
            else:
                reply = (
                    f"Official status for Grievance ID `{g.tracking_id}`:\n\n"
                    f"• **Current Status**: **{status_localized}**\n"
                    f"• **Category**: {category_localized}\n"
                    f"• **Assigned Department**: {g.department_assigned}\n"
                    f"• **SLA Target Deadline**: {deadline_str}\n\n"
                    f"Guaranteed resolution is actively tracked under Panchayat SLA monitoring."
                )
            
            return ChatResponse(
                reply=reply,
                language=lang,
                intent_detected="grievance",
                suggested_actions=["Track Another Grievance", "Check Scheme Eligibility", "View Panchayat Works"],
                metadata={"tracking_id": g.tracking_id, "status": g.status, "found": True}
            )
        else:
            if lang == "hi":
                reply = f"ट्रैकिंग आईडी **{tracking_id}** सिस्टम में नहीं मिला। ❌\n\nकृपया अपनी सही ट्रैकिंग आईडी जांचें (उदा. `GS-2026-XXXXX`), या 'शिकायत दर्ज करें' पोर्टल पर जाकर नई शिकायत दर्ज करें।"
            elif lang == "mr":
                reply = f"ट्रॅकिंग आयडी **{tracking_id}** रेकॉर्डमध्ये सापडला नाही. ❌\n\nकृपया आपला अचूक ट्रॅकिंग आयडी तपासा (उदा. `GS-2026-XXXXX`), किंवा नवीन तक्रार नोंदवण्यासाठी समस्येचे वर्णन सांगा."
            else:
                reply = f"Tracking ID **{tracking_id}** was not found in the GramSetu registry. ❌\n\nPlease double-check the tracking ID format (e.g., `GS-2026-XXXXX`), or describe your civic issue to register a new complaint."
            
            return ChatResponse(
                reply=reply,
                language=lang,
                intent_detected="grievance",
                suggested_actions=["File New Grievance", "Check Scheme Eligibility", "Panchayat Works"],
                metadata={"tracking_id": tracking_id, "found": False}
            )

    # 3. Handle Greeting & General Identity
    if intent == "greeting" or (intent == "general" and any(w in msg_lower for w in ["hello", "hi", "namaste", "hey", "नमस्ते", "नमस्कार", "प्रणाम"])):
        if lang == "hi":
            reply = (
                "नमस्ते! मैं **ग्रामसेतु (GramSetu)** हूँ, आपका 24/7 ग्राम पंचायत डिजिटल सहायक। 🙏\n\n"
                "मैं आपकी इन सभी कार्यों में सहायता कर सकता हूँ:\n"
                "1. **सरकारी योजनाएँ**: पीएम आवास, वृद्धावस्था/विधवा पेंशन, किसान सम्मान निधि व मनरेगा की पात्रता जांचें व फॉर्म डाउनलोड करें।\n"
                "2. **शिकायत दर्ज करें**: पानी की समस्या, स्ट्रीट लाइट, टूटी सड़क या कचरे की शिकायत दर्ज कर लाइव ट्रैकिंग आईडी पाएं।\n"
                "3. **ग्राम पंचायत कार्य**: आगामी ग्राम सभा बैठक, विकास कार्य, बजट व प्रमाण पत्रों की जानकारी प्राप्त करें।\n\n"
                "आप अपनी आवश्यकता नीचे लिख सकते हैं या बोल सकते हैं!"
            )
        elif lang == "mr":
            reply = (
                "नमस्ते! मी **ग्रामसेतू (GramSetu)** आहे, तुमचा २४/७ ग्रामपंचायत डिजिटल सहाय्यक. 🙏\n\n"
                "मी तुम्हाला खालील कामांसाठी थेट मदत करू शकतो:\n"
                "१. **शासकीय योजना**: घरकुल (PMAY), वृद्धावस्था/विधवा पेन्शन, शेतकरी सन्मान निधी व मनरेगाची पात्रता तपासा आणि पूर्व-भरलेला अर्ज डाउनलोड करा.\n"
                "२. **तक्रार नोंदणी**: पिण्याचे पाणी, पथदिवे, रस्ते, गटार किंवा कचऱ्याची तक्रार नोंदवून तत्काळ ट्रॅकिंग आयडी मिळवा.\n"
                "३. **ग्रामपंचायत प्रशासन**: आगामी ग्रामसभा बैठका, विकास कामांचे अंदाजपत्रक व दाखल्यांबद्दल माहिती मिळवा.\n\n"
                "तुम्हाला कशाबद्दल माहिती हवी आहे?"
            )
        else:
            reply = (
                "Namaste! I am **GramSetu**, your 24/7 Gram Panchayat digital governance assistant. 🙏\n\n"
                "I can proactively assist you with:\n"
                "1. **Welfare Schemes**: Check eligibility for PMAY-G Housing, Pensions, PM Kisan, and MGNREGA with instant pre-filled application PDFs.\n"
                "2. **Grievance Redressal**: Report water leakages, broken streetlights, road potholes, or sanitation issues with guaranteed SLA tracking.\n"
                "3. **Panchayat Transparency**: Check upcoming Gram Sabha agendas, ongoing village development works, and budget allocations.\n\n"
                "How can I help you today?"
            )

        return ChatResponse(
            reply=reply,
            language=lang,
            intent_detected="greeting",
            suggested_actions=[
                "योजना पात्रता तपासा" if lang == "mr" else ("योजना पात्रता जांचें" if lang == "hi" else "Check Scheme Eligibility"),
                "पाणी पुरवठ्याची तक्रार" if lang == "mr" else ("पानी की समस्या दर्ज करें" if lang == "hi" else "Report Water Issue"),
                "आगामी ग्रामसभा बैठक" if lang == "mr" else ("आगामी ग्राम सभा बैठक" if lang == "hi" else "Upcoming Gram Sabha")
            ],
            metadata={}
        )

    # 4. Route according to Intent: Scheme Check
    if intent == "scheme_check":
        # Check if citizen is asking about specific famous scheme
        if any(w in msg_lower for w in ["awas", "housing", "pmay", "घरकुल", "मकान", "आवास"]):
            if lang == "hi":
                reply = (
                    "🏡 **प्रधानमंत्री आवास योजना - ग्रामीण (PMAY-G / पक्का मकान योजना)**:\n\n"
                    "• **आर्थिक सहायता**: पक्के मकान निर्माण हेतु ₹1,20,000 की सीधी सहायता (बैंक खाते में 3 किस्तों में) + मनरेगा 90 दिन मजदूरी (लगभग ₹28,000) + स्वच्छ भारत शौचालय अनुदान (₹12,000)।\n"
                    "• **पात्रता**: कच्चे मकान या बेघर ग्रामीण परिवार, SECC 2011 आवास प्रतीक्षा सूची में नाम।\n"
                    "• **आवश्यक दस्तावेज**: आधार कार्ड, बैंक पासबुक, जमीन का स्वामित्व/7-12, जॉब कार्ड, राशन कार्ड।\n\n"
                    "💡 आप 'पात्रता' टैब में जाकर तुरंत अपने नाम से पहले से भरा हुआ आधिकारिक आवेदन फॉर्म डाउनलोड कर सकते हैं।"
                )
            elif lang == "mr":
                reply = (
                    "🏡 **प्रधानमंत्री आवास योजना - ग्रामीण (PMAY-G / घरकुल योजना)**:\n\n"
                    "• **शासकीय अनुदान**: पक्के घर बांधण्यासाठी ₹१,२०,००० थेट बँक खात्यात + मनरेगा अंतर्गत ९० दिवसांची मजुरी (₹२८,०००) + स्वच्छ भारत शौचालय अनुदान (₹१२,०००).\n"
                    "• **पात्रता**: ग्रामीण भागातील बेघर, कच्च्या घरात राहणारे किंवा SECC 2011 च्या प्रतीक्षा यादीतील लाभार्थी.\n"
                    "• **आवश्यक कागदपत्रे**: आधार कार्ड, बँक पासबुक, जागेचा ७/१२ किंवा नमुना ८, जॉब कार्ड, रेशन कार्ड.\n\n"
                    "💡 तुम्ही 'पात्रता तपासा' टॅबवर जाऊन तुमच्या तपशिलांसह तयार असलेला पूर्व-भरलेला अधिकृत अर्ज थेट डाउनलोड करू शकता."
                )
            else:
                reply = (
                    "🏡 **Pradhan Mantri Awas Yojana - Gramin (PMAY-G / Rural Housing)**:\n\n"
                    "• **Financial Grant**: ₹1,20,000 direct bank transfer in 3 installments + 90 days MGNREGA wage assistance (~₹28,000) + Swachh Bharat toilet grant (₹12,000).\n"
                    "• **Eligibility**: Houseless families or living in kutcha/dilapidated houses as per SECC 2011 priority list.\n"
                    "• **Required Documents**: Aadhaar card, active bank account, land title / 7-12 record, MGNREGA Job card.\n\n"
                    "💡 You can visit the Scheme Eligibility tab to download your pre-filled official application PDF ready for Gram Panchayat submission."
                )
            return ChatResponse(
                reply=reply,
                language=lang,
                intent_detected="scheme_check",
                suggested_actions=["Check Full Eligibility", "Download Application Form", "Panchayat Works"],
                metadata={"scheme": "pmay_g"}
            )

        elif any(w in msg_lower for w in ["kisan", "farmer", "शेतकरी", "शेतकऱ्या", "शेतक", "किसान", "सम्मान निधि", "पीक", "विमा", "कृषी"]):
            if lang == "hi":
                reply = (
                    "🌾 **किसानों के लिए प्रमुख सरकारी योजनाएं (PM किसान + फसल बीमा)**:\n\n"
                    "• **पीएम किसान सम्मान निधि**: प्रतिवर्ष ₹6,000 (₹2,000 की 3 किस्तें) सीधे बैंक खाते में।\n"
                    "• **नमो शेतकरी महासम्मान (महाराष्ट्र)**: राज्य सरकार द्वारा अतिरिक्त ₹6,000 वार्षिक अनुदान (कुल ₹12,000 प्रतिवर्ष)।\n"
                    "• **₹1 में प्रधानमंत्री फसल बीमा योजना**: सूखा, बाढ़ या बेमौसम बारिश से फसल नुकसान पर पूर्ण मुआवजा संरक्षण।\n"
                    "• **शर्तें**: आधार लिंक सक्रिय बैंक खाता, जमीन खतौनी/7-12 और पूर्ण ई-केवाईसी (e-KYC)।"
                )
            elif lang == "mr":
                reply = (
                    "🌾 **शेतकऱ्यांसाठी प्रमुख योजना (PM किसान + नमो शेतकरी महासन्मान)**:\n\n"
                    "• **PM किसान सन्मान निधी**: वर्षाला ₹६,००० (₹२,००० चे ३ हप्ते) थेट बँक खात्यात जमा.\n"
                    "• **नमो शेतकरी महासन्मान निधी (महाराष्ट्र)**: राज्य सरकारकडून अतिरिक्त ₹६,००० वार्षिक अनुदान (एकूण ₹१२,००० प्रतिवर्ष!).\n"
                    "• **₹१ रुपयात पीक विमा योजना**: अवकाळी पाऊस, गारपीट किंवा दुष्काळात पिकांचे नुकसान झाल्यास संपूर्ण विमा संरक्षण.\n"
                    "• **आवश्यक बाबी**: शेतीचा ७/१२ व ८-अ उतारा, आधार लिंक बँक खाते आणि e-KYC पूर्ण असणे आवश्यक आहे."
                )
            else:
                reply = (
                    "🌾 **Top Agricultural Welfare Schemes for Farmers**:\n\n"
                    "• **PM Kisan Samman Nidhi**: ₹6,000/year (3 direct transfers of ₹2,000 each) into Aadhaar-linked accounts.\n"
                    "• **Namo Shetkari Mahasanman (Maharashtra)**: Additional ₹6,000/year from the State Government (Total ₹12,000 annually).\n"
                    "• **₹1 Token Crop Insurance (PMFBY)**: Full financial indemnity against drought, hailstorms, or excess rainfall at just ₹1 token premium.\n"
                    "• **Requirements**: 7/12 land ledger record, Aadhaar-seeded bank account, and verified e-KYC."
                )
            return ChatResponse(
                reply=reply,
                language=lang,
                intent_detected="scheme_check",
                suggested_actions=["Check Full Eligibility", "Download Application Form", "File Grievance"],
                metadata={"scheme": "pm_kisan"}
            )

        elif any(w in msg_lower for w in ["pension", "पेन्शन", "पेंशन", "वृद्ध", "विधवा", "old age", "widow"]):
            if lang == "hi":
                reply = (
                    "👵 **राष्ट्रीय सामाजिक सहायता एवं पेंशन योजनाएं**:\n\n"
                    "• **इंदिरा गांधी राष्ट्रीय वृद्धावस्था पेंशन**: 60 वर्ष या अधिक आयु के बीपीएल वरिष्ठ नागरिकों को ₹1,500 प्रति माह।\n"
                    "• **इंदिरा गांधी राष्ट्रीय विधवा पेंशन**: बीपीएल परिवार की 40-79 वर्ष की विधवा महिलाओं को ₹1,500 प्रति माह।\n"
                    "• **संजय गांधी निराधार योजना (महाराष्ट्र)**: अनाथ, निराधार एवं 40% से अधिक दिव्यांग नागरिकों को आर्थिक संबल।\n"
                    "• **आवश्यक दस्तावेज**: आयु प्रमाण (जन्म दाखिला/आधार), बीपीएल राशन कार्ड, आय प्रमाण पत्र (तहसीलदार द्वारा जारी)।"
                )
            elif lang == "mr":
                reply = (
                    "👵 **सामाजिक सुरक्षा निवृत्तीवेतन योजना (इंदिरा गांधी / संजय गांधी योजना)**:\n\n"
                    "• **इंदिरा गांधी राष्ट्रीय वृद्धावस्था पेन्शन**: वय ६० वर्षे व त्यावरील दारिद्र्यरेषेखालील (BPL) ज्येष्ठांना प्रतिमहा ₹१,५००.\n"
                    "• **इंदिरा गांधी राष्ट्रीय विधवा पेन्शन**: ४० ते ७९ वयोगटातील बीपीएल विधवा भगिनींना प्रतिमहा ₹१,५०० आर्थिक सहाय्य.\n"
                    "• **संजय गांधी निराधार योजना**: निराधार, अनाथ किंवा ४०% पेक्षा जास्त दिव्यांग व्यक्तींना दरमहा सन्मानधन.\n"
                    "• **कागदपत्रे**: वयाचा पुरावा (शाळा सोडल्याचा दाखला/आधार), बीपीएल रेशन कार्ड, तहसीलदारांचा उत्पन्नाचा दाखला."
                )
            else:
                reply = (
                    "👵 **National Social Security & Pension Schemes**:\n\n"
                    "• **Indira Gandhi National Old Age Pension (IGNOAPS)**: ₹1,500/month for BPL senior citizens aged 60+.\n"
                    "• **Indira Gandhi National Widow Pension (IGNWPS)**: ₹1,500/month for BPL widows aged 40-79.\n"
                    "• **Sanjay Gandhi Niradhar Yojana**: Monthly financial sustenance for destitute individuals, orphans, and persons with >40% disability.\n"
                    "• **Documents**: Age proof/Aadhaar, BPL Ration Card, Income Certificate from Tehsildar."
                )
            return ChatResponse(
                reply=reply,
                language=lang,
                intent_detected="scheme_check",
                suggested_actions=["Check Full Eligibility", "Download Application Form", "File Grievance"],
                metadata={"scheme": "pensions"}
            )

        elif any(w in msg_lower for w in ["mgnrega", "मनरेगा", "रोजगार", "हमी", "काम", "job card"]):
            if lang == "hi":
                reply = (
                    "⚒️ **महात्मा गांधी राष्ट्रीय ग्रामीण रोजगार गारंटी योजना (मनरेगा / MGNREGA)**:\n\n"
                    "• **अधिकार**: प्रत्येक ग्रामीण परिवार को वित्तीय वर्ष में 100 दिन के गारंटीकृत अकुशल रोजगार का कानूनी अधिकार।\n"
                    "• **मजदूरी**: महाराष्ट्र में ₹316 प्रतिदिन की मजदूरी सीधे बैंक खाते में जमा होती है।\n"
                    "• **काम के प्रकार**: जल संरक्षण, तालाब, कुआं निर्माण, पौधरोपण, गौशाला निर्माण व ग्रामीण रास्ते।\n"
                    "• **आवेदन**: ग्राम पंचायत में निःशुल्क जॉब कार्ड (Job Card) हेतु आवेदन करें, मांग के 15 दिनों में काम मिलने की गारंटी।"
                )
            elif lang == "mr":
                reply = (
                    "⚒️ **महात्मा गांधी राष्ट्रीय ग्रामीण रोजगार हमी योजना (MGNREGA / रोहयो)**:\n\n"
                    "• **हमी**: प्रत्येक ग्रामीण कुटुंबाला आर्थिक वर्षात १०० दिवसांचा हमी मजुरी रोजगार मिळण्याचा कायदेशीर अधिकार.\n"
                    "• **मजुरी दर**: महाराष्ट्रात प्रतिदिन ₹३१६ मजुरी दर थेट आधार लिंक बँक खात्यात जमा.\n"
                    "• **कामे**: जलसंधारण, विहीर खोदणे, शेततळे, वृक्षारोपण, सिमेंट नाला बांध, जनावरांचे गोठे.\n"
                    "• **अर्ज कसा करावा**: ग्रामपंचायतीत जॉब कार्ड (Job Card) साठी अर्ज करा. कामाची मागणी केल्यापासून १५ दिवसांत काम मिळण्याची हमी."
                )
            else:
                reply = (
                    "⚒️ **Mahatma Gandhi National Rural Employment Guarantee Act (MGNREGA)**:\n\n"
                    "• **Legal Guarantee**: 100 days of guaranteed wage employment per financial year for rural households.\n"
                    "• **Wage Rate**: ₹316/day in Maharashtra credited directly to Aadhaar-linked bank accounts.\n"
                    "• **Permissible Works**: Rainwater harvesting structures, farm ponds, community wells, cattle sheds, rural roads.\n"
                    "• **How to Apply**: Obtain a free Job Card from your Gram Panchayat; employment is provided within 15 days of formal request."
                )
            return ChatResponse(
                reply=reply,
                language=lang,
                intent_detected="scheme_check",
                suggested_actions=["Check Full Eligibility", "Download Application Form", "Panchayat Works"],
                metadata={"scheme": "mgnrega"}
            )

        # General Scheme Listing & Eligibility Calculation
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
                    s_name = s.name_hi if lang == "hi" and s.name_hi else (s.name_mr if lang == "mr" and s.name_mr else s.name)
                    eligible_schemes.append(s_name)

            if eligible_schemes:
                if lang == "hi":
                    reply = f"आपकी नागरिक प्रोफाइल के अनुसार, आप इन {len(eligible_schemes)} योजनाओं के लिए सीधे पात्र हैं:\n\n" + "\n".join([f"• **{name}**" for name in eligible_schemes]) + "\n\nआप 'पात्रता' पोर्टल में जाकर अपना पहले से भरा हुआ पीडीएफ आवेदन फॉर्म तुरंत डाउनलोड कर सकते हैं।"
                elif lang == "mr":
                    reply = f"तुमच्या नागरिक प्रोफाइलनुसार, तुम्ही खालील {len(eligible_schemes)} योजनांसाठी थेट पात्र ठरता:\n\n" + "\n".join([f"• **{name}**" for name in eligible_schemes]) + "\n\nतुम्ही 'पात्रता तपासा' टॅबमध्ये जाऊन तुमचा तयार असलेला पूर्व-भरलेला अर्ज त्वरित डाउनलोड करू शकता."
                else:
                    reply = f"Based on your profile, you are eligible for {len(eligible_schemes)} government welfare schemes:\n\n" + "\n".join([f"• **{name}**" for name in eligible_schemes]) + "\n\nYou can download official pre-filled PDF application forms in the Scheme Eligibility portal."
            else:
                if lang == "hi":
                    reply = "वर्तमान मानदंडों के अनुसार आप किसी भी योजना के लिए सीधे पात्र नहीं हैं। विशेष छूट या ग्राम सभा अनुमोदन के लिए ग्राम पंचायत कार्यालय से संपर्क करें।"
                elif lang == "mr":
                    reply = "सध्याच्या निकषांनुसार तुम्ही थेट कोणत्याही योजनेसाठी पात्र ठरत नाही. विशेष शिथिलतेसाठी किंवा ग्रामसभा ठरावासाठी ग्रामपंचायत कार्यालयाशी संपर्क साधावा."
                else:
                    reply = "Based on your current profile metrics, you do not meet the direct criteria for these schemes. Please visit the Gram Panchayat office for special relaxations."
        else:
            schemes_list = []
            for s in schemes[:4]:
                name = s.name_hi if lang == "hi" and s.name_hi else (s.name_mr if lang == "mr" and s.name_mr else s.name)
                schemes_list.append(f"• **{name}** ({s.department})")
            
            if lang == "hi":
                reply = f"ग्रामसेतु इन मुख्य कल्याणकारी योजनाओं के लिए स्वचालित पात्रता जांचता है:\n\n" + "\n".join(schemes_list) + "\n\nसटीक व्यक्तिगत पात्रता जांचने व पूर्व-भरित फॉर्म डाउनलोड करने के लिए 'पात्रता' टैब में अपना प्रोफाइल पूरा करें।"
            elif lang == "mr":
                reply = f"ग्रामसेतू या प्रमुख शासकीय योजनांसाठी स्वयंचलित पात्रता तपासतो:\n\n" + "\n".join(schemes_list) + "\n\nअचूक वैयक्तिक पात्रता तपासण्यासाठी व तयार अर्ज डाउनलोड करण्यासाठी 'पात्रता' टॅबवर जाऊन आपले प्रोफाइल तपासा."
            else:
                reply = f"GramSetu proactively verifies eligibility for top central and state welfare schemes:\n\n" + "\n".join(schemes_list) + "\n\nPlease visit the Scheme Eligibility tab to see your personalized results and download pre-filled PDF applications."

        return ChatResponse(
            reply=reply,
            language=lang,
            intent_detected="scheme_check",
            suggested_actions=["Check Full Eligibility", "Download Application Form", "File Grievance"],
            metadata={"schemes_count": len(schemes)}
        )

    # 5. Route according to Intent: Grievance Redressal
    elif intent == "grievance":
        is_filing_intent = any(w in msg_lower for w in [
            "broken", "leak", "problem", "not working", "pothole", "dirty", "garbage", "dark",
            "water", "light", "road", "pipe", "drain", "sewer", "repair", "fix", "clean",
            "खराब", "पानी नहीं", "गड्ढा", "कचरा", "अंधेरा", "समस्या", "तक्रार", "गळती", "घाण",
            "लाईट बंद", "लाइट बंद", "नाली", "सड़क", "टूटी", "पाइप", "नल", "बिजली",
            "फुटली", "फुटला", "खड्डे", "रस्ता", "पाणी", "वीज", "लाईट", "पथदिवे", "गटार", "दुर्गंधी",
            "बंद आहे", "नादुरुस्त", "दुरुस्त", "पाणी येत नाही"
        ])

        if is_filing_intent and len(message.strip()) >= 4:
            # Auto-file the grievance
            category, department, sla_days = sla_service.classify_grievance(message)
            deadline = sla_service.calculate_deadline(sla_days)
            tracking_id = sla_service.generate_tracking_id()

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
            cat_localized = translation_service.get_static_text(category, target_lang=lang)

            if lang == "hi":
                reply = (
                    f"आपकी शिकायत अधिकृत रूप से दर्ज कर ली गई है! ✅\n\n"
                    f"• **ट्रैकिंग आईडी**: `{tracking_id}`\n"
                    f"• **श्रेणी**: {cat_localized}\n"
                    f"• **नियुक्त विभाग**: {department}\n"
                    f"• **SLA समाधान अंतिम तिथि**: **{deadline_str}** ({sla_days} दिन की कानूनी गारंटी)\n\n"
                    f"यदि इस अवधि में समाधान नहीं होता है, तो प्रणाली स्वतः ब्लॉक विकास अधिकारी (BDO) को मामला अग्रेषित कर देगी।"
                )
            elif lang == "mr":
                reply = (
                    f"आपली तक्रार अधिकृतपणे नोंदवून संबंधित विभागाकडे वर्ग करण्यात आली आहे! ✅\n\n"
                    f"• **ट्रॅकिंग आयडी**: `{tracking_id}`\n"
                    f"• **तक्रार श्रेणी**: {cat_localized}\n"
                    f"• **नियुक्त विभाग**: {department}\n"
                    f"• **SLA हमी मुदत**: **{deadline_str}** ({sla_days} दिवसांची कायदेशीर हमी)\n\n"
                    f"मुदतीत निवारण न झाल्यास ही तक्रार स्वयंचलितपणे गट विकास अधिकारी (BDO) यांच्याकडे वर्ग होईल. आपण हा आयडी वापरून कधीही प्रगती तपासू शकता."
                )
            else:
                reply = (
                    f"Your grievance has been officially registered and assigned! ✅\n\n"
                    f"• **Tracking ID**: `{tracking_id}`\n"
                    f"• **Category**: {cat_localized}\n"
                    f"• **Assigned Department**: {department}\n"
                    f"• **SLA Resolution Deadline**: **{deadline_str}** ({sla_days} days legal guarantee)\n\n"
                    f"If unresolved within the target timeline, the system will automatically escalate this case to the Block Development Officer (BDO)."
                )

            return ChatResponse(
                reply=reply,
                language=lang,
                intent_detected="grievance",
                suggested_actions=[f"Track {tracking_id}", "File Another Grievance", "View Governance Records"],
                metadata={"tracking_id": tracking_id, "category": category, "department": department, "sla_days": sla_days}
            )
        else:
            if lang == "hi":
                reply = (
                    "आप ग्राम पंचायत से संबंधित किसी भी समस्या (पेयजल, स्ट्रीट लाइट, सड़क, कचरा, नाली सफाई) की शिकायत यहाँ लिख या बोल सकते हैं।\n\n"
                    "कृपया अपनी समस्या का स्थान व विवरण बताएं (उदा. 'मंदिर के पास स्ट्रीट लाइट 3 दिन से बंद है'), या अपनी पुरानी शिकायत का ट्रैकिंग आईडी दर्ज करें।"
                )
            elif lang == "mr":
                reply = (
                    "तुम्ही ग्रामपंचायतीशी संबंधित कोणत्याही समस्येची (पिण्याचे पाणी, पथदिवे, रस्ते, गटार, कचरा सफाई) तक्रार येथे लिहू किंवा बोलून नोंदवू शकता.\n\n"
                    "कृपया समस्येचे ठिकाण व थोडे वर्णन सांगा (उदा. 'शाळेसमोरील पाण्याची पाईपलाईन फुटली आहे'), किंवा आपल्या जुन्या तक्रारीचा ट्रॅकिंग आयडी सांगा."
                )
            else:
                reply = (
                    "You can file civic grievances regarding drinking water, non-functional streetlights, road potholes, garbage, or drainage.\n\n"
                    "Please describe the problem and location (e.g. 'Water pipeline broken near school'), or enter an existing Tracking ID (GS-2026-XXXXX) to check live status."
                )

            return ChatResponse(
                reply=reply,
                language=lang,
                intent_detected="grievance",
                suggested_actions=["Report Water Leak", "Report Broken Streetlight", "Track Grievance"],
                metadata={}
            )

    # 6. Route according to Intent: Governance & Panchayat Administration
    elif intent == "governance_query":
        # Check if asking specifically about meetings
        if any(w in msg_lower for w in ["meeting", "sabha", "ग्रामसभा", "बैठक", "सभा"]):
            if lang == "hi":
                reply = (
                    "🏛️ **आगामी ग्राम सभा बैठक विवरण**:\n\n"
                    "• **विषय**: विशेष ग्राम सभा (जल जीवन मिशन नल कनेक्शन व वित्तीय वर्ष विकास बजट समीक्षा)\n"
                    "• **दिनांक व समय**: आगामी 15 तारीख, प्रातः 10:30 बजे\n"
                    "• **स्थान**: ग्राम पंचायत सभागार, कोपरगांव ग्रामीण\n"
                    "• **अध्यक्षता**: सौ. सुनीता पाटील (सरपंच) एवं श्री आर. के. शिंदे (ग्राम सेवक)\n\n"
                    "सभी ग्रामवासियों से अनुरोध है कि बैठक में उपस्थित होकर अपने वार्ड के विकास कार्यों हेतु सुझाव दें।"
                )
            elif lang == "mr":
                reply = (
                    "🏛️ **आगामी विशेष ग्रामसभा बैठक तपशील**:\n\n"
                    "• **विषय**: विशेष ग्रामसभा (जलजीवन मिशन नळ जोडणी मंजुरी व वार्षिक विकास कामे आढावा)\n"
                    "• **तारीख व वेळ**: आगामी १५ तारीख, सकाळी १०:३० वाजता\n"
                    "• **स्थळ**: ग्रामपंचायत सभागृह, कोपरगाव ग्रामीण\n"
                    "• **अध्यक्षता**: सौ. सुनीता पाटील (सरपंच) व श्री आर. के. शिंदे (ग्रामसेवक)\n\n"
                    "सर्व ग्रामस्थांना उपस्थित राहण्याचे जाहीर आवाहन करण्यात येत आहे."
                )
            else:
                reply = (
                    "🏛️ **Upcoming Gram Sabha Meeting Notice**:\n\n"
                    "• **Agenda**: Special Gram Sabha on Jal Jeevan Mission Tap Approvals & Annual Works Budget Review\n"
                    "• **Date & Time**: 15th of the month at 10:30 AM\n"
                    "• **Venue**: Gram Panchayat Main Hall, Kopargaon Rural\n"
                    "• **Presided By**: Mrs. Sunita Patil (Sarpanch) & Mr. R. K. Shinde (Gram Sevak)\n\n"
                    "All registered village voters are urged to attend and voice their developmental priorities."
                )
            return ChatResponse(
                reply=reply,
                language=lang,
                intent_detected="governance_query",
                suggested_actions=["View All Meetings", "View Village Budget & Works", "Check Scheme Eligibility"],
                metadata={"record_type": "meeting"}
            )

        # Check if asking about Sarpanch / Gram Sevak / Office
        elif any(w in msg_lower for w in ["sarpanch", "sevak", "सरपंच", "ग्रामसेवक", "कार्यालय", "office", "contact"]):
            if lang == "hi":
                reply = (
                    "🏛️ **ग्राम पंचायत प्रशासन विवरण (कोपरगांव ग्रामीण, अहिल्यानगर)**:\n\n"
                    "• **सरपंच**: सौ. सुनीता पाटील (भेंट समय: सोमवार ते शुक्रवार, 11:00 AM - 2:00 PM)\n"
                    "• **उपसरपंच**: श्री गणेश थोरात\n"
                    "• **ग्राम विकास अधिकारी (ग्राम सेवक)**: श्री आर. के. शिंदे\n"
                    "• **कार्यालय समय**: प्रातः 10:00 से सायं 5:30 बजे तक\n"
                    "• **हेल्पलाइन / ईमेल**: support@gramsetu.gov.in | आपातकालीन संपर्क: 1800-120-8040"
                )
            elif lang == "mr":
                reply = (
                    "🏛️ **ग्रामपंचायत प्रशासन संपर्क व वेळ (कोपरगाव ग्रामीण, अहिल्यानगर)**:\n\n"
                    "• **सरपंच**: सौ. सुनीता पाटील (नागरिक भेट वेळ: सोम-शुक्र, स. ११:०० ते दु. २:००)\n"
                    "• **उपसरपंच**: श्री गणेश थोरात\n"
                    "• **ग्राम विकास अधिकारी (ग्रामसेवक)**: श्री आर. के. शिंदे\n"
                    "• **कार्यालयीन वेळ**: सकाळी १०:०० ते सायंकाळी ५:३० पर्यंत\n"
                    "• **अधिकृत संपर्क**: support@gramsetu.gov.in | मोफत हेल्पलाईन: १८००-१२०-८०४०"
                )
            else:
                reply = (
                    "🏛️ **Gram Panchayat Administration Details (Kopargaon Rural, Ahilyanagar)**:\n\n"
                    "• **Sarpanch**: Mrs. Sunita Patil (Citizen Hours: Mon-Fri, 11:00 AM - 2:00 PM)\n"
                    "• **Up-Sarpanch**: Mr. Ganesh Thorat\n"
                    "• **Panchayat Development Officer (Gram Sevak)**: Mr. R. K. Shinde\n"
                    "• **Office Working Hours**: 10:00 AM to 5:30 PM (Working days)\n"
                    "• **Citizen Support**: support@gramsetu.gov.in | Toll-Free: 1800-120-8040"
                )
            return ChatResponse(
                reply=reply,
                language=lang,
                intent_detected="governance_query",
                suggested_actions=["View All Meetings", "View Village Budget & Works", "File Grievance"],
                metadata={"record_type": "contacts"}
            )

        # General Governance Records
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

    # 7. Fallback General Assistance
    else:
        welcome = translation_service.get_static_text("welcome_message", target_lang=lang)
        prompt = translation_service.get_static_text("help_prompt", target_lang=lang)
        reply = f"{welcome}\n\n💡 {prompt}"

        return ChatResponse(
            reply=reply,
            language=lang,
            intent_detected="general",
            suggested_actions=[
                "Check Scheme Eligibility" if lang == "en" else ("योजना पात्रता तपासा" if lang == "mr" else "योजना पात्रता जांचें"),
                "File a Grievance" if lang == "en" else ("तक्रार नोंदवा" if lang == "mr" else "शिकायत दर्ज करें"),
                "Panchayat Meetings & Works" if lang == "en" else ("ग्रामसभा बैठका व विकासकामे" if lang == "mr" else "ग्राम सभा व विकास कार्य")
            ],
            metadata={}
        )
