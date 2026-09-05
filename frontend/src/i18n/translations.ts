export type Language = 'en' | 'hi' | 'mr';

export interface Translations {
  appName: string;
  tagline: string;
  nav: {
    chat: string;
    schemes: string;
    grievances: string;
    governance: string;
    dashboard: string;
    login: string;
    logout: string;
    profile: string;
    officialPortal: string;
  };
  chat: {
    title: string;
    subtitle: string;
    inputPlaceholder: string;
    send: string;
    listening: string;
    voiceInput: string;
    quickPrompts: string;
    promptScheme: string;
    promptWater: string;
    promptMeeting: string;
    promptTrack: string;
    intentBadge: string;
    suggestedActions: string;
  };
  schemes: {
    title: string;
    subtitle: string;
    profileHeading: string;
    profileNotice: string;
    age: string;
    annualIncome: string;
    category: string;
    landAcres: string;
    occupation: string;
    gender: string;
    disability: string;
    checkButton: string;
    checking: string;
    resultsTitle: string;
    eligibleNotice: string;
    statusEligible: string;
    statusNotEligible: string;
    qualificationReason: string;
    requiredDocs: string;
    downloadPdf: string;
    generatingPdf: string;
  };
  grievance: {
    title: string;
    subtitle: string;
    tabSubmit: string;
    tabTrack: string;
    descLabel: string;
    descPlaceholder: string;
    categoryLabel: string;
    categoryAuto: string;
    predictedDept: string;
    estimatedSla: string;
    days: string;
    submitBtn: string;
    submitting: string;
    successTitle: string;
    trackingIdLabel: string;
    copyId: string;
    copied: string;
    trackInputPlaceholder: string;
    trackBtn: string;
    status: string;
    dept: string;
    deadline: string;
    resolvedOn: string;
    notes: string;
    timeline: {
      submitted: string;
      inProgress: string;
      escalated: string;
      resolved: string;
    };
    slaBreachedBadge: string;
  };
  governance: {
    title: string;
    subtitle: string;
    filterAll: string;
    filterMeetings: string;
    filterWorks: string;
    filterFunds: string;
    searchPlaceholder: string;
    emptyMessage: string;
    budget: string;
    statusLabel: string;
  };
  official: {
    dashboardTitle: string;
    dashboardSubtitle: string;
    kpiTotalGrievances: string;
    kpiOpen: string;
    kpiEscalated: string;
    kpiResolved: string;
    kpiResolutionRate: string;
    kpiSchemeChecks: string;
    grievancesTitle: string;
    filterCategory: string;
    filterStatus: string;
    filterSlaBreach: string;
    allCategories: string;
    allStatuses: string;
    tableTrackingId: string;
    tableCitizen: string;
    tableCategory: string;
    tableIssue: string;
    tableStatus: string;
    tableSlaDeadline: string;
    tableAction: string;
    updateStatus: string;
    triggerSlaEscalation: string;
    escalationTriggered: string;
    chartCategoryTitle: string;
    chartStatusTitle: string;
    chartTrendsTitle: string;
    chartSchemeUptake: string;
  };
  auth: {
    citizenLogin: string;
    officialLogin: string;
    phoneLabel: string;
    passwordLabel: string;
    nameLabel: string;
    registerTab: string;
    loginTab: string;
    submitLogin: string;
    submitRegister: string;
    loginNotice: string;
    demoOfficialNotice: string;
  };
}

export const translations: Record<Language, Translations> = {
  en: {
    appName: "GramSetu",
    tagline: "Multilingual Gram Panchayat Governance & Citizen Welfare Assistant",
    nav: {
      chat: "AI Sahayak",
      schemes: "Scheme Entitlements",
      grievances: "Grievances & SLA",
      governance: "Panchayat Works",
      dashboard: "Official Dashboard",
      login: "Login / Register",
      logout: "Logout",
      profile: "Citizen Profile",
      officialPortal: "Official Portal",
    },
    chat: {
      title: "GramSetu AI Sahayak",
      subtitle: "Ask governance queries, check welfare schemes, and report local problems in your regional language",
      inputPlaceholder: "Type your query or issue here (e.g. 'How to apply for PMAY?' or 'Broken water pipe')...",
      send: "Send",
      listening: "Listening...",
      voiceInput: "Voice Query (Mic)",
      quickPrompts: "Quick Questions:",
      promptScheme: "Check my eligibility for welfare schemes",
      promptWater: "Water pipeline leaking near school",
      promptMeeting: "When is the next Gram Sabha meeting?",
      promptTrack: "Track grievance status GS-2026-10492",
      intentBadge: "Intent:",
      suggestedActions: "Suggested Next Steps:",
    },
    schemes: {
      title: "Welfare Scheme Entitlement & Auto-Fill",
      subtitle: "Proactively evaluate your eligibility against verified government schemes and download official application forms",
      profileHeading: "Your Household Eligibility Profile",
      profileNotice: "Fill your socioeconomic details below. Our JSON logic rule engine will evaluate exact criteria for national & state schemes.",
      age: "Age (Years)",
      annualIncome: "Annual Household Income (₹)",
      category: "Social Category",
      landAcres: "Land Owned (Acres)",
      occupation: "Primary Occupation",
      gender: "Gender",
      disability: "Person with Disability (Divyang)?",
      checkButton: "Evaluate Eligibility Now",
      checking: "Evaluating Rules...",
      resultsTitle: "Scheme Entitlement Assessment",
      eligibleNotice: "You qualify for {count} schemes! Click to download your pre-filled official application.",
      statusEligible: "Eligible ✅",
      statusNotEligible: "Not Eligible ❌",
      qualificationReason: "Eligibility Analysis:",
      requiredDocs: "Mandatory Documents Checklist:",
      downloadPdf: "Download Pre-filled PDF Form",
      generatingPdf: "Preparing Application...",
    },
    grievance: {
      title: "Panchayat Grievance Redressal & SLA Escalation",
      subtitle: "File civic issues with auto-department routing, tracking IDs, and guaranteed SLA timelines",
      tabSubmit: "File New Grievance",
      tabTrack: "Track Existing Grievance",
      descLabel: "Describe your issue in detail (any language):",
      descPlaceholder: "Example: The drinking water pipeline near Hanuman temple has broken and water is flowing into the street for the last 2 days...",
      categoryLabel: "Detected Category & Department",
      categoryAuto: "Auto-detected from text",
      predictedDept: "Assigned Department:",
      estimatedSla: "SLA Resolution Deadline:",
      days: "days",
      submitBtn: "Submit Grievance Officially",
      submitting: "Submitting & Routing...",
      successTitle: "Grievance Registered Successfully!",
      trackingIdLabel: "Your Official Tracking ID:",
      copyId: "Copy ID",
      copied: "Copied!",
      trackInputPlaceholder: "Enter Tracking ID (e.g. GS-2026-10492)...",
      trackBtn: "Track Live Status",
      status: "Current Status:",
      dept: "Assigned Department:",
      deadline: "SLA Resolution Deadline:",
      resolvedOn: "Resolved On:",
      notes: "Official Resolution Notes:",
      timeline: {
        submitted: "Submitted & Assigned",
        inProgress: "Field Inspection in Progress",
        escalated: "Auto-Escalated (SLA Exceeded)",
        resolved: "Grievance Resolved & Verified",
      },
      slaBreachedBadge: "SLA BREACHED",
    },
    governance: {
      title: "Panchayat Governance & Public Transparency",
      subtitle: "Live schedule of Gram Sabha meetings, ongoing civil infrastructure, and 15th Finance Commission fund allocations",
      filterAll: "All Records",
      filterMeetings: "Gram Sabha Meetings",
      filterWorks: "Development Works",
      filterFunds: "Fund Allocations",
      searchPlaceholder: "Search meetings, road works, tenders, or funds...",
      emptyMessage: "No governance records matched your query.",
      budget: "Sanctioned Budget:",
      statusLabel: "Status:",
    },
    official: {
      dashboardTitle: "Gram Panchayat Official Back-Office Dashboard",
      dashboardSubtitle: "Monitor incoming civic grievances, systemic infrastructure issues, and welfare scheme uptake across the village",
      kpiTotalGrievances: "Total Grievances",
      kpiOpen: "Pending Action",
      kpiEscalated: "SLA Breaches / Escalated",
      kpiResolved: "Resolved & Closed",
      kpiResolutionRate: "Resolution Rate",
      kpiSchemeChecks: "Citizen Scheme Checks",
      grievancesTitle: "Grievance Triage & Resolution Console",
      filterCategory: "Filter by Category",
      filterStatus: "Filter by Status",
      filterSlaBreach: "SLA Breached Only",
      allCategories: "All Categories",
      allStatuses: "All Statuses",
      tableTrackingId: "Tracking ID",
      tableCitizen: "Citizen Name",
      tableCategory: "Category",
      tableIssue: "Issue Description (English)",
      tableStatus: "Status",
      tableSlaDeadline: "SLA Deadline",
      tableAction: "Action",
      updateStatus: "Update Status",
      triggerSlaEscalation: "Run SLA Auto-Escalation Check",
      escalationTriggered: "Overdue grievances auto-escalated!",
      chartCategoryTitle: "Grievances by Category (Systemic Issues)",
      chartStatusTitle: "Grievance Status Breakdown",
      chartTrendsTitle: "Grievance Intake Trend (Past 7 Days)",
      chartSchemeUptake: "Scheme Uptake & Citizen Eligibility Rates",
    },
    auth: {
      citizenLogin: "Citizen Portal",
      officialLogin: "Panchayat Official Login",
      phoneLabel: "Mobile Number",
      passwordLabel: "Password",
      nameLabel: "Full Name",
      registerTab: "Register New Citizen",
      loginTab: "Existing User Login",
      submitLogin: "Sign In Securely",
      submitRegister: "Register Profile",
      loginNotice: "Demo Citizen: 9876543210 / Citizen@123",
      demoOfficialNotice: "Official Demo: 9822001122 / Official@123",
    }
  },

  hi: {
    appName: "ग्रामसेतु",
    tagline: "बहुभाषी ग्राम पंचायत सुशासन एवं नागरिक कल्याण सहायक",
    nav: {
      chat: "एआई सहायक",
      schemes: "सरकारी योजनाएं",
      grievances: "शिकायत एवं निवारण",
      governance: "पंचायत कार्य एवं बैठकें",
      dashboard: "अधिकारी डैशबोर्ड",
      login: "लॉगिन / पंजीकरण",
      logout: "लॉगआउट",
      profile: "नागरिक प्रोफाइल",
      officialPortal: "पंचायत अधिकारी पोर्टल",
    },
    chat: {
      title: "ग्रामसेतु एआई सहायक",
      subtitle: "अपनी स्थानीय भाषा में सरकारी योजनाओं, ग्राम पंचायत बैठकों और जनसमस्याओं के बारे में पूछें",
      inputPlaceholder: "अपनी समस्या या प्रश्न यहाँ लिखें (उदा. 'आवास योजना के लिए पात्रता' या 'पानी की पाइपलाइन टूटी है')...",
      send: "भेजें",
      listening: "सुन रहे हैं...",
      voiceInput: "बोलकर पूछें (माइक)",
      quickPrompts: "त्वरित प्रश्न:",
      promptScheme: "सरकारी योजनाओं के लिए मेरी पात्रता जांचें",
      promptWater: "स्कूल के पास पानी की पाइपलाइन टूट गई है",
      promptMeeting: "अगली ग्राम सभा की बैठक कब है?",
      promptTrack: "शिकायत की स्थिति जांचें GS-2026-10492",
      intentBadge: "पहचाना गया विषय:",
      suggestedActions: "सुझाए गए अगले कदम:",
    },
    schemes: {
      title: "कल्याणकारी योजना पात्रता एवं स्वतः भरा हुआ फॉर्म",
      subtitle: "सरकारी योजनाओं के लिए अपनी पात्रता जांचें और सीधे भरा हुआ आवेदन पत्र डाउनलोड करें",
      profileHeading: "आपकी पारिवारिक पात्रता प्रोफाइल",
      profileNotice: "नीचे अपनी सामाजिक व आर्थिक जानकारी भरें। हमारा नियम इंजन आपकी पात्रता का सटीक मूल्यांकन करेगा।",
      age: "आयु (वर्ष)",
      annualIncome: "वार्षिक पारिवारिक आय (₹)",
      category: "सामाजिक श्रेणी / वर्ग",
      landAcres: "कृषि भूमि (एकड़)",
      occupation: "मुख्य व्यवसाय",
      gender: "लिंग",
      disability: "दिव्यांग हैं?",
      checkButton: "पात्रता का मूल्यांकन करें",
      checking: "मूल्यांकन हो रहा है...",
      resultsTitle: "योजना पात्रता परिणाम",
      eligibleNotice: "आप {count} योजनाओं के लिए पात्र हैं! भरा हुआ फॉर्म डाउनलोड करने के लिए नीचे क्लिक करें।",
      statusEligible: "पात्र हैं ✅",
      statusNotEligible: "अपात्र ❌",
      qualificationReason: "पात्रता का कारण:",
      requiredDocs: "आवश्यक दस्तावेजों की सूची:",
      downloadPdf: "भरा हुआ आवेदन फॉर्म डाउनलोड करें (PDF)",
      generatingPdf: "फॉर्म तैयार हो रहा है...",
    },
    grievance: {
      title: "ग्राम पंचायत शिकायत निवारण एवं समयबद्ध सेवा (SLA)",
      subtitle: "ग्राम समस्याओं को दर्ज करें, स्वतः विभाग आवंटन और निश्चित समयसीमा में समाधान पाएं",
      tabSubmit: "नई शिकायत दर्ज करें",
      tabTrack: "शिकायत की स्थिति ट्रैक करें",
      descLabel: "अपनी समस्या का विस्तार से वर्णन करें (किसी भी भाषा में):",
      descPlaceholder: "उदा. हनुमान मंदिर के सामने पेयजल पाइपलाइन फूट गई है और 2 दिनों से रास्ते पर पानी बह रहा है...",
      categoryLabel: "पहचानी गई श्रेणी एवं विभाग",
      categoryAuto: "विवरण से स्वतः पहचानी गई",
      predictedDept: "आवंटित विभाग:",
      estimatedSla: "समाधान की समयसीमा (SLA):",
      days: "दिन",
      submitBtn: "शिकायत आधिकारिक रूप से दर्ज करें",
      submitting: "दर्ज की जा रही है...",
      successTitle: "शिकायत सफलतापूर्वक दर्ज हुई!",
      trackingIdLabel: "आपकी आधिकारिक ट्रैकिंग आईडी:",
      copyId: "आईडी कॉपी करें",
      copied: "कॉपी हो गया!",
      trackInputPlaceholder: "ट्रैकिंग आईडी दर्ज करें (उदा. GS-2026-10492)...",
      trackBtn: "लाइव स्थिति देखें",
      status: "वर्तमान स्थिति:",
      dept: "संबंधित विभाग:",
      deadline: "समाधान की अंतिम तिथि:",
      resolvedOn: "समाधान तिथि:",
      notes: "अधिकारी की टिप्पणी:",
      timeline: {
        submitted: "दर्ज हुई एवं विभाग को भेजी गई",
        inProgress: "कार्य प्रगति पर है",
        escalated: "उच्चाधिकारी को प्रेषित (समयसीमा समाप्त)",
        resolved: "समस्या का समाधान पूर्ण",
      },
      slaBreachedBadge: "समयसीमा समाप्त",
    },
    governance: {
      title: "ग्राम पंचायत कार्य एवं वित्तीय पारदर्शिता",
      subtitle: "ग्राम सभा बैठकों का कार्यक्रम, चल रहे विकास कार्य और 15वें वित्त आयोग का बजट विवरण",
      filterAll: "सभी रिकॉर्ड",
      filterMeetings: "ग्राम सभा बैठकें",
      filterWorks: "विकास कार्य",
      filterFunds: "निधि एवं अनुदान",
      searchPlaceholder: "बैठकें, सड़क कार्य, बजट या योजनाएं खोजें...",
      emptyMessage: "कोई रिकॉर्ड नहीं मिला।",
      budget: "स्वीकृत बजट:",
      statusLabel: "स्थिति:",
    },
    official: {
      dashboardTitle: "ग्राम पंचायत अधिकारी प्रबंधन डैशबोर्ड",
      dashboardSubtitle: "नागरिकों की शिकायतों, बुनियादी ढांचे की समस्याओं और सरकारी योजनाओं के लाभ की निगरानी करें",
      kpiTotalGrievances: "कुल शिकायतें",
      kpiOpen: "लंबित कार्यवाही",
      kpiEscalated: "समयसीमा समाप्त (एस्केलेटेड)",
      kpiResolved: "समाधान हो चुका",
      kpiResolutionRate: "निवारण दर",
      kpiSchemeChecks: "योजना पात्रता जांच",
      grievancesTitle: "शिकायत निवारण एवं नियंत्रण पटल",
      filterCategory: "श्रेणी अनुसार फ़िल्टर",
      filterStatus: "स्थिति अनुसार फ़िल्टर",
      filterSlaBreach: "केवल समयसीमा पार हुई शिकायतें",
      allCategories: "सभी श्रेणियां",
      allStatuses: "सभी स्थितियां",
      tableTrackingId: "ट्रैकिंग आईडी",
      tableCitizen: "नागरिक का नाम",
      tableCategory: "श्रेणी",
      tableIssue: "समस्या विवरण",
      tableStatus: "स्थिति",
      tableSlaDeadline: "अंतिम तिथि (SLA)",
      tableAction: "कार्यवाही",
      updateStatus: "स्थिति अपडेट करें",
      triggerSlaEscalation: "SLA मॉनिटर रन करें",
      escalationTriggered: "समयसीमा पार शिकायतें उच्च स्तर पर प्रेषित!",
      chartCategoryTitle: "श्रेणी अनुसार शिकायतें (समस्या विश्लेषण)",
      chartStatusTitle: "शिकायत स्थिति वितरण",
      chartTrendsTitle: "पिछले 7 दिनों में दर्ज शिकायतें",
      chartSchemeUptake: "योजनाओं में नागरिकों की पात्रता दर",
    },
    auth: {
      citizenLogin: "नागरिक पोर्टल",
      officialLogin: "पंचायत अधिकारी लॉगिन",
      phoneLabel: "मोबाइल नंबर",
      passwordLabel: "पासवर्ड",
      nameLabel: "पूरा नाम",
      registerTab: "नया नागरिक पंजीकरण",
      loginTab: "मौजूदा उपयोगकर्ता लॉगिन",
      submitLogin: "सुरक्षित लॉगिन करें",
      submitRegister: "पंजीकरण करें",
      loginNotice: "डेमो नागरिक: 9876543210 / Citizen@123",
      demoOfficialNotice: "अधिकारी डेमो: 9822001122 / Official@123",
    }
  },

  mr: {
    appName: "ग्रामसेतू",
    tagline: "बहुभाषिक ग्रामपंचायत सुशासन व नागरिक कल्याण डिजिटल सहाय्यक",
    nav: {
      chat: "एआय सहाय्यक",
      schemes: "शासकीय योजना व हक्क",
      grievances: "तक्रार व निवारण (SLA)",
      governance: "ग्रामपंचायत कामे व सभा",
      dashboard: "अधिकारी डॅशबोर्ड",
      login: "लॉगिन / नोंदणी",
      logout: "लॉगआउट",
      profile: "नागरिक प्रोफाइल",
      officialPortal: "पंचायत अधिकारी दालन",
    },
    chat: {
      title: "ग्रामसेतू एआय सहाय्यक",
      subtitle: "तुमच्या मातृभाषेत शासकीय योजना, ग्रामसभा बैठका आणि गावांमधील समस्यांबद्दल थेट माहिती मिळवा",
      inputPlaceholder: "तुमचा प्रश्न किंवा तक्रार येथे लिहा (उदा. 'घरकुल योजनेसाठी पात्रता' किंवा 'नळाला पाणी येत नाही')...",
      send: "पाठवा",
      listening: "ऐकत आहे...",
      voiceInput: "बोलून विचारा (माईक)",
      quickPrompts: "जलद प्रश्न:",
      promptScheme: "शासकीय योजनांसाठी माझी पात्रता तपासा",
      promptWater: "शाळेजवळील पिण्याच्या पाण्याची पाईपलाईन फुटली आहे",
      promptMeeting: "पुढील ग्रामसभा बैठक कधी आहे?",
      promptTrack: "तक्रार स्थिती तपासा GS-2026-10492",
      intentBadge: "विषय:",
      suggestedActions: "पुढील कृती पर्याय:",
    },
    schemes: {
      title: "कल्याणकारी योजना पात्रता व पूर्व-भरलेला अर्ज",
      subtitle: "सरकारी योजनांसाठी तुमची पात्रता त्वरित तपासा आणि थेट अधिकृत भरलेला अर्ज डाउनलोड करा",
      profileHeading: "तुमची कौटुंबिक पात्रता प्रोफाइल",
      profileNotice: "खाली तुमची सामाजिक व आर्थिक माहिती भरा. आमची प्रणाली सर्व शासकीय निकषांची पडताळणी करेल.",
      age: "वय (वर्षे)",
      annualIncome: "वार्षिक कौटुंबिक उत्पन्न (₹)",
      category: "जात प्रवर्ग",
      landAcres: "शेती जमीन (एकर)",
      occupation: "मुख्य व्यवसाय",
      gender: "लिंग",
      disability: "दिव्यांग व्यक्ती?",
      checkButton: "पात्रता त्वरित तपासा",
      checking: "तपासणी सुरू आहे...",
      resultsTitle: "योजना पात्रता निकाल",
      eligibleNotice: "तुम्ही {count} योजनांसाठी पात्र आहात! खालील बटणावर क्लिक करून भरलेला अर्ज डाउनलोड करा.",
      statusEligible: "पात्र आहात ✅",
      statusNotEligible: "अपात्र ❌",
      qualificationReason: "पात्रतेचे विश्लेषण:",
      requiredDocs: "आवश्यक कागदपत्रांची यादी:",
      downloadPdf: "पूर्व-भरलेला अर्ज डाउनलोड करा (PDF)",
      generatingPdf: "अर्ज तयार होत आहे...",
    },
    grievance: {
      title: "ग्रामपंचायत तक्रार निवारण व मुदत हमी (SLA)",
      subtitle: "गावातील नागरी समस्यांची नोंद करा, योग्य विभागाकडे वर्ग आणि निश्चित मुदतीत निवारण मिळवा",
      tabSubmit: "नवीन तक्रार नोंदवा",
      tabTrack: "तक्रार स्थिती तपासा",
      descLabel: "तुमच्या समस्येचे सविस्तर वर्णन करा (मराठीत किंवा कोणत्याही भाषेत):",
      descPlaceholder: "उदा. मारुती मंदिरासमोरील पिण्याच्या पाण्याची पाईपलाईन फुटली असून गेल्या दोन दिवसांपासून रस्त्यावर पाणी वाहत आहे...",
      categoryLabel: "ओळखलेली श्रेणी व विभाग",
      categoryAuto: "वर्णनावरून स्वयंचलित निवड",
      predictedDept: "संबंधित विभाग:",
      estimatedSla: "निवारण मुदत (SLA):",
      days: "दिवस",
      submitBtn: "तक्रार अधिकृतपणे नोंदवा",
      submitting: "नोंदणी होत आहे...",
      successTitle: "तक्रार यशस्वीरित्या नोंदवली गेली!",
      trackingIdLabel: "तुमचा अधिकृत ट्रॅकिंग आयडी:",
      copyId: "आयडी कॉपी करा",
      copied: "कॉपी झाले!",
      trackInputPlaceholder: "ट्रॅकिंग आयडी टाका (उदा. GS-2026-10492)...",
      trackBtn: "थेट स्थिती तपासा",
      status: "सध्याची स्थिती:",
      dept: "संबंधित विभाग:",
      deadline: "निवारण अंतिम मुदत:",
      resolvedOn: "निवारण तारीख:",
      notes: "अधिकाऱ्यांची शेरे / टीप:",
      timeline: {
        submitted: "तक्रार नोंदवून विभागाकडे वर्ग",
        inProgress: "प्रत्यक्ष कामाची पाहणी सुरू आहे",
        escalated: "वरिष्ठांकडे वर्ग (मुदत संपली)",
        resolved: "तक्रारीचे यशस्वी निवारण पूर्ण",
      },
      slaBreachedBadge: "मुदत संपली",
    },
    governance: {
      title: "ग्रामपंचायत कारभार व सार्वजनिक पारदर्शकता",
      subtitle: "ग्रामसभा बैठकांचे वेळापत्रक, सुरू असलेली विकासकामे आणि 15 व्या वित्त आयोगाचा जमा-खर्च",
      filterAll: "सर्व नोंदी",
      filterMeetings: "ग्रामसभा बैठका",
      filterWorks: "विकासकामे",
      filterFunds: "निधी व अंदाजपत्रक",
      searchPlaceholder: "बैठका, रस्ते कामे, पाणीपुरवठा किंवा निधी शोधा...",
      emptyMessage: "कोणतीही नोंद आढळली नाही.",
      budget: "मंजूर निधी / अंदाजपत्रक:",
      statusLabel: "स्थिती:",
    },
    official: {
      dashboardTitle: "ग्रामपंचायत अधिकारी प्रशासन डॅशबोर्ड",
      dashboardSubtitle: "गावातील नागरी तक्रारी, पायाभूत सुविधांच्या अडचणी आणि शासकीय योजनांच्या लाभाचे विश्लेषण",
      kpiTotalGrievances: "एकूण तक्रारी",
      kpiOpen: "प्रलंबित तक्रारी",
      kpiEscalated: "मुदत उलटलेल्या (एस्केलेटेड)",
      kpiResolved: "निवारण झालेल्या",
      kpiResolutionRate: "निवारण दर",
      kpiSchemeChecks: "योजना पात्रता तपासण्या",
      grievancesTitle: "तक्रार निवारण व नियंत्रण कक्ष",
      filterCategory: "श्रेणीनुसार फिल्टर",
      filterStatus: "स्थितीनुसार फिल्टर",
      filterSlaBreach: "फक्त मुदत संपलेल्या",
      allCategories: "सर्व श्रेणी",
      allStatuses: "सर्व स्थिती",
      tableTrackingId: "ट्रॅकिंग आयडी",
      tableCitizen: "नागरिकाचे नाव",
      tableCategory: "श्रेणी",
      tableIssue: "समस्या वर्णन (इंग्रजी)",
      tableStatus: "स्थिती",
      tableSlaDeadline: "अंतिम मुदत (SLA)",
      tableAction: "कृती",
      updateStatus: "स्थिती बदला",
      triggerSlaEscalation: "SLA मुदत पडताळणी चालवा",
      escalationTriggered: "मुदत संपलेल्या तक्रारी वरिष्ठांकडे वर्ग केल्या!",
      chartCategoryTitle: "श्रेणीनुसार तक्रारी (समस्या विश्लेषण)",
      chartStatusTitle: "तक्रार स्थिती विभागणी",
      chartTrendsTitle: "गेल्या 7 दिवसांतील तक्रार प्रवाह",
      chartSchemeUptake: "विविध योजनांमधील नागरिक पात्रता दर",
    },
    auth: {
      citizenLogin: "नागरिक दालन",
      officialLogin: "पंचायत अधिकारी लॉगिन",
      phoneLabel: "मोबाईल नंबर",
      passwordLabel: "पासवर्ड",
      nameLabel: "पूर्ण नाव",
      registerTab: "नवीन नागरिक नोंदणी",
      loginTab: "विद्यमान नागरिक लॉगिन",
      submitLogin: "सुरक्षित लॉगिन करा",
      submitRegister: "नोंदणी पूर्ण करा",
      loginNotice: "डेमो नागरिक: 9876543210 / Citizen@123",
      demoOfficialNotice: "अधिकारी डेमो: 9822001122 / Official@123",
    }
  }
};
