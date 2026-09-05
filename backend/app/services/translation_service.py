import logging
from typing import Optional
from deep_translator import GoogleTranslator

logger = logging.getLogger(__name__)

# Pre-compiled high-accuracy multilingual dictionary for Gram Panchayat terminology,
# conversational flows, error messages, and citizen prompts.
STATIC_TRANSLATIONS: dict[str, dict[str, str]] = {
    # Greeting / General
    "welcome_message": {
        "en": "Namaste! I am GramSetu, your Gram Panchayat digital assistant. How can I help you today? You can ask about government schemes, check your eligibility, file a grievance, or see Panchayat meetings and development works.",
        "hi": "नमस्ते! मैं ग्रामसेतु हूँ, आपका ग्राम पंचायत डिजिटल सहायक। आज मैं आपकी क्या सहायता कर सकता हूँ? आप सरकारी योजनाओं के बारे में पूछ सकते हैं, पात्रता जांच सकते हैं, शिकायत दर्ज कर सकते हैं या पंचायत की बैठकें और विकास कार्य देख सकते हैं।",
        "mr": "नमस्ते! मी ग्रामसेतू आहे, तुमचा ग्रामपंचायत डिजिटल सहाय्यक. आज मी तुम्हाला कशी मदत करू शकतो? तुम्ही सरकारी योजनांबद्दल विचारू शकता, तुमची पात्रता तपासू शकता, तक्रार नोंदवू शकता किंवा ग्रामपंचायत बैठका आणि विकास कामे पाहू शकता."
    },
    "help_prompt": {
        "en": "You can type: 'Check my eligibility for schemes', 'File a grievance about water supply', or 'When is the next Gram Sabha meeting?'",
        "hi": "आप लिख सकते हैं: 'योजनाओं के लिए मेरी पात्रता जांचें', 'पानी की समस्या की शिकायत दर्ज करें', या 'अगली ग्राम सभा की बैठक कब है?'",
        "mr": "तुम्ही टाईप करू शकता: 'योजनांसाठी माझी पात्रता तपासा', 'पाणी पुरवठ्याची तक्रार नोंदवा', किंवा 'पुढील ग्रामसभा बैठक कधी आहे?'"
    },
    "grievance_submitted": {
        "en": "Your grievance has been successfully submitted! Your Tracking ID is {tracking_id}. It has been routed to the {department} department with an SLA resolution deadline of {deadline}.",
        "hi": "आपकी शिकायत सफलतापूर्वक दर्ज कर ली गई है! आपका ट्रैकिंग आईडी {tracking_id} है। इसे {deadline} की समाधान समयसीमा के साथ {department} विभाग को भेज दिया गया है।",
        "mr": "तुमची तक्रार यशस्वीरित्या नोंदवली गेली आहे! तुमचा ट्रॅकिंग आयडी {tracking_id} आहे. हे {deadline} च्या निवारण मुदतीसह {department} विभागाकडे पाठवले गेले आहे."
    },
    "eligibility_checked": {
        "en": "Based on your profile, you are eligible for {count} government welfare schemes! You can review details and download pre-filled applications.",
        "hi": "आपकी प्रोफाइल के आधार पर, आप {count} सरकारी कल्याणकारी योजनाओं के लिए पात्र हैं! आप विवरण देख सकते हैं और पहले से भरे हुए आवेदन डाउनलोड कर सकते हैं।",
        "mr": "तुमच्या प्रोफाइलच्या आधारे, तुम्ही {count} सरकारी कल्याणकारी योजनांसाठी पात्र आहात! तुम्ही तपशील पाहू शकता आणि आधीच भरलेले अर्ज डाउनलोड करू शकता."
    },
    "governance_records_found": {
        "en": "Here are the latest governance updates and development records from your Gram Panchayat:",
        "hi": "यहाँ आपकी ग्राम पंचायत के नवीनतम शासन अपडेट और विकास कार्य रिकॉर्ड हैं:",
        "mr": "येथे तुमच्या ग्रामपंचायतीचे नवीनतम अपडेट्स आणि विकास कामांचे रेकॉर्ड आहेत:"
    },
    # Categories
    "road": {
        "en": "Road & Infrastructure",
        "hi": "सड़क एवं आधारभूत संरचना",
        "mr": "रस्ते आणि पायाभूत सुविधा"
    },
    "water": {
        "en": "Drinking Water & Pipeline",
        "hi": "पेयजल एवं पाइपलाइन",
        "mr": "पिण्याचे पाणी आणि नळ योजना"
    },
    "electricity": {
        "en": "Electricity & Street Lights",
        "hi": "बिजली एवं स्ट्रीट लाइट",
        "mr": "वीज आणि पथदिवे"
    },
    "pension": {
        "en": "Social Welfare & Pension",
        "hi": "समाज कल्याण एवं पेंशन",
        "mr": "समाजकल्याण आणि निवृत्तीवेतन"
    },
    "sanitation": {
        "en": "Sanitation & Waste Management",
        "hi": "स्वच्छता एवं कचरा प्रबंधन",
        "mr": "स्वच्छता आणि कचरा व्यवस्थापन"
    },
    "other": {
        "en": "General Administration",
        "hi": "सामान्य प्रशासन",
        "mr": "सामान्य प्रशासन"
    },
    # Statuses
    "submitted": {
        "en": "Submitted",
        "hi": "दर्ज की गई",
        "mr": "नोंदवली"
    },
    "in_progress": {
        "en": "In Progress",
        "hi": "कार्य प्रगति पर है",
        "mr": "प्रगतीपथावर आहे"
    },
    "escalated": {
        "en": "Escalated (SLA Breached)",
        "hi": "उच्चाधिकारी को प्रेषित (समयसीमा समाप्त)",
        "mr": "वरिष्ठांकडे वर्ग (मुदत संपली)"
    },
    "resolved": {
        "en": "Resolved",
        "hi": "समाधान हो गया",
        "mr": "निवारण झाले"
    }
}

# Translation cache to avoid redundant network lookups
_translation_cache: dict[tuple[str, str, str], str] = {}

class TranslationService:
    def __init__(self):
        self.supported_languages = ["en", "hi", "mr"]

    def get_static_text(self, key: str, target_lang: str = "en", **kwargs) -> str:
        lang = target_lang if target_lang in self.supported_languages else "en"
        entry = STATIC_TRANSLATIONS.get(key, {})
        text = entry.get(lang) or entry.get("en", key)
        if kwargs:
            try:
                return text.format(**kwargs)
            except Exception:
                return text
        return text

    def translate(self, text: str, target_lang: str, source_lang: str = "auto") -> str:
        if not text or not text.strip():
            return ""
        
        target = target_lang.lower().strip()
        if target not in self.supported_languages:
            target = "en"
            
        if source_lang == target:
            return text

        cache_key = (text, source_lang, target)
        if cache_key in _translation_cache:
            return _translation_cache[cache_key]

        # Check static key matches
        for key, lang_map in STATIC_TRANSLATIONS.items():
            if text in lang_map.values():
                res = lang_map.get(target, text)
                _translation_cache[cache_key] = res
                return res

        # Online deep-translator fallback with graceful fallback on network isolation
        try:
            translator = GoogleTranslator(source=source_lang, target=target)
            translated = translator.translate(text)
            if translated:
                _translation_cache[cache_key] = translated
                return translated
        except Exception as e:
            logger.debug(f"Deep-translator fallback failed or network disabled: {e}. Using original.")

        # Fallback to original text if translation service offline
        _translation_cache[cache_key] = text
        return text

    def translate_to_english(self, text: str, source_lang: str = "auto") -> str:
        return self.translate(text=text, target_lang="en", source_lang=source_lang)

translation_service = TranslationService()
