// GramSetu Robust API Client with Zero-Failure Client-Side Fallback Engine
// Automatically connects to live backend if available, or seamlessly runs in client-side mode on Vercel

function normalizeApiUrl(url: string): string {
  let cleaned = (url || '').trim().replace(/\/+$/, '');
  if (!cleaned) return '';
  if (!cleaned.endsWith('/api')) {
    cleaned = `${cleaned}/api`;
  }
  return cleaned;
}

let customApiUrl = normalizeApiUrl(localStorage.getItem('gramsetu_custom_api_url') || '');
const API_BASE_URL = customApiUrl || import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

function getAuthHeader(): Record<string, string> {
  const token = localStorage.getItem('gramsetu_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// -------------------------------------------------------------
// Seeded Official Government Data for Instant Resilient Fallback
// -------------------------------------------------------------

const FALLBACK_SCHEMES = [
  {
    id: 1,
    name: "Pradhan Mantri Awas Yojana - Gramin (PMAY-G)",
    name_hi: "प्रधानमंत्री आवास योजना - ग्रामीण",
    name_mr: "प्रधानमंत्री आवास योजना - ग्रामीण (घरकुल)",
    description: "Financial assistance of ₹1,20,000 for constructing a permanent pucca house with toilet and electricity for kutcha house residents.",
    description_hi: "कच्चे मकानों में रहने वाले ग्रामीण परिवारों को पक्के घर के निर्माण हेतु ₹1,20,000 की वित्तीय सहायता, जिसमें शौचालय और बिजली कनेक्शन शामिल है।",
    description_mr: "कच्च्या घरात राहणाऱ्या गरजू ग्रामीण कुटुंबांना पक्के घर बांधण्यासाठी ₹1,20,000 चे थेट आर्थिक अनुदान, ज्यामध्ये शौचालय व वीज जोडणी समाविष्ट आहे.",
    department: "Ministry of Rural Development & Panchayat Raj",
    eligibility_rules: {
      and: [
        { annual_income: { "<=": 180000 } },
        { land_owned_acres: { "<=": 5.0 } }
      ]
    },
    required_documents: [
      "Aadhaar Card of Applicant & Family",
      "MGNREGA Job Card Number",
      "Bank Account Passbook (Aadhaar Seeded)",
      "Certificate of Kutcha House / No Pucca House Proof",
      "Gram Sabha Beneficiary Approval Resolution"
    ],
    application_link: "https://pmayg.nic.in"
  },
  {
    id: 2,
    name: "Indira Gandhi National Old Age Pension Scheme (IGNOAPS)",
    name_hi: "इंदिरा गांधी राष्ट्रीय वृद्धावस्था पेंशन योजना",
    name_mr: "इंदिरा गांधी राष्ट्रीय वृद्ध निवृत्तीवेतन योजना",
    description: "Monthly pension of ₹1,000 - ₹1,500 to senior citizens aged 60 years or above living below poverty line to ensure dignified livelihood.",
    description_hi: "गरीबी रेखा से नीचे जीवनयापन करने वाले 60 वर्ष या उससे अधिक आयु के वरिष्ठ नागरिकों को ₹1,000 - ₹1,500 की मासिक पेंशन सहायता।",
    description_mr: "दारिद्र्यरेषेखालील 60 वर्षे किंवा त्याहून अधिक वयाच्या ज्येष्ठ नागरिकांना सन्मानपूर्वक जगण्यासाठी दरमहा ₹1,000 - ₹1,500 ची निवृत्तीवेतन मदत.",
    department: "Social Welfare Department (NSAP)",
    eligibility_rules: {
      and: [
        { age: { ">=": 60 } },
        { annual_income: { "<=": 100000 } }
      ]
    },
    required_documents: [
      "Proof of Age (Aadhaar Card / Birth Certificate)",
      "BPL Ration Card / Income Certificate from Tehsildar",
      "Bank / Post Office Passbook with IFSC",
      "Recent Passport Size Photograph"
    ],
    application_link: "https://nsap.nic.in"
  },
  {
    id: 3,
    name: "Indira Gandhi National Widow Pension Scheme (IGNWPS)",
    name_hi: "इंदिरा गांधी राष्ट्रीय विधवा पेंशन योजना",
    name_mr: "इंदिरा गांधी राष्ट्रीय विधवा निवृत्तीवेतन योजना",
    description: "Monthly financial security of ₹1,200 to widows aged 40 years or above from economically weaker rural sections without family financial breadwinner.",
    description_hi: "आर्थिक रूप से कमजोर ग्रामीण परिवारों की 40 वर्ष या उससे अधिक आयु की विधवा महिलाओं को ₹1,200 की मासिक पेंशन सुरक्षा।",
    description_mr: "आर्थिकदृष्ट्या दुर्बल घटकातील 40 वर्षे किंवा त्याहून अधिक वयाच्या विधवा महिलांना स्वावलंबी जगण्यासाठी दरमहा ₹1,200 चे आर्थिक साहाय्य.",
    department: "Women & Child Welfare Department",
    eligibility_rules: {
      and: [
        { age: { ">=": 40 } },
        { annual_income: { "<=": 120000 } },
        { occupation: { "==": "widow" } }
      ]
    },
    required_documents: [
      "Husband's Official Death Certificate",
      "Age Proof of Applicant",
      "Income Certificate / BPL Certificate",
      "Bank Passbook with Aadhaar Seeding",
      "Self-declaration of Non-Remarriage"
    ],
    application_link: "https://nsap.nic.in"
  },
  {
    id: 4,
    name: "MGNREGA 100-Day Guaranteed Wage Employment",
    name_hi: "मनरेगा 100-दिवसीय गारंटी रोजगार जॉब कार्ड",
    name_mr: "महात्मा गांधी राष्ट्रीय ग्रामीण रोजगार हमी (मनरेगा) जॉब कार्ड",
    description: "Legal guarantee of at least 100 days of wage employment in every financial year to every rural adult who volunteers for unskilled manual work.",
    description_hi: "प्रत्येक ग्रामीण परिवार को प्रति वित्तीय वर्ष कम से कम 100 दिनों के अकुशल शारीरिक श्रम रोजगार की कानूनी गारंटी और समय पर बैंक खाते में मजदूरी।",
    description_mr: "ग्रामीण भागातील प्रौढ व्यक्तींना अकुशल शारीरिक काम करण्याची तयारी असल्यास प्रत्येक आर्थिक वर्षात किमान 100 दिवसांच्या रोजगाराची कायदेशीर हमी.",
    department: "Department of Rural Development & Employment Guarantee",
    eligibility_rules: {
      age: { ">=": 18 }
    },
    required_documents: [
      "Aadhaar Card of all adult family members",
      "Proof of Rural Residence (Ration card/Voter ID)",
      "Joint/Individual Bank Savings Account Passbook",
      "Two Passport Size Photographs"
    ],
    application_link: "https://nrega.nic.in"
  },
  {
    id: 5,
    name: "Post-Matric Student Scholarship Scheme (SC/ST/OBC)",
    name_hi: "पोस्ट-मैट्रिक छात्रवृत्ति योजना (एससी/एसटी/ओबीसी)",
    name_mr: "मॅट्रिकोत्तर शिष्यवृत्ती योजना (अनुसूचित जाती/जमाती/इतर मागास)",
    description: "100% tuition reimbursement and maintenance allowance for SC, ST, and OBC students pursuing 11th, 12th, diploma, or degree courses.",
    description_hi: "11वीं, 12वीं, डिप्लोमा और स्नातक पाठ्यक्रमों में अध्ययनरत अनुसूचित जाति, जनजाति और अन्य पिछड़ा वर्ग के छात्रों को शिक्षण शुल्क प्रतिपूर्ति एवं निर्वाह भत्ता।",
    description_mr: "11 वी, 12 वी, पदविका आणि पदवीचे शिक्षण घेणाऱ्या अनुसूचित जाती, जमाती व इतर मागास प्रवर्गातील विद्यार्थ्यांना संपूर्ण परीक्षा शुल्क माफी व निर्वाह भत्ता.",
    department: "Social Justice & Special Assistance Department",
    eligibility_rules: {
      and: [
        { category: { "in": ["SC", "ST", "OBC"] } },
        { annual_income: { "<=": 250000 } }
      ]
    },
    required_documents: [
      "Caste Certificate issued by Sub-Divisional Officer (SDM)",
      "Family Income Certificate issued by Tahsildar",
      "Previous Year Marksheet",
      "College Admission Fee Receipt & Bonafide Certificate",
      "Aadhaar-seeded Bank Account Details"
    ],
    application_link: "https://scholarships.gov.in"
  }
];

const FALLBACK_GOVERNANCE = [
  {
    id: 1,
    panchayat_id: "GP-KPG-01",
    title: "Special Gram Sabha Meeting: Monsoon Development Plan Approval",
    title_hi: "विशेष ग्राम सभा बैठक: वार्षिक विकास कार्य योजना एवं बजट अनुमोदन",
    title_mr: "विशेष ग्रामसभा बैठक: वार्षिक विकास आराखडा व अंदाजपत्रक मंजुरी",
    description: "Discussion and approval of Jal Jeevan Mission tap connections for 120 households, sanitation drain tenders, and PMAY-G beneficiary priority list.",
    description_hi: "120 परिवारों के लिए जल जीवन मिशन नल कनेक्शन, पक्की नालियों के टेंडर और पीएम आवास योजना के लाभार्थियों की प्राथमिकता सूची का अनुमोदन।",
    description_mr: "120 कुटुंबांसाठी जलजीवन मिशन नळ जोडणी, भूमिगत गटार टेंडर आणि प्रधानमंत्री आवास योजना लाभार्थी प्राधान्य यादीस ग्रामसभेची सर्वसंमतीने मंजुरी.",
    category: "meeting",
    date: new Date(Date.now() + 5 * 86400000).toISOString(),
    status: "upcoming",
    amount: null
  },
  {
    id: 2,
    panchayat_id: "GP-KPG-01",
    title: "Quarterly Gram Sabha: Budget Review & Audit Presentation",
    title_hi: "त्रैमासिक ग्राम सभा: बजट समीक्षा एवं सार्वजनिक अंकेक्षण (ऑडिट) प्रस्तुति",
    title_mr: "त्रैमासिक ग्रामसभा: खर्च आढावा आणि सामाजिक लेखापरीक्षण (ऑडिट) सादरीकरण",
    description: "Detailed presentation of ₹18.5 Lakh expenditure under the 15th Central Finance Commission and MGNREGA social audit report.",
    description_hi: "15वें केंद्रीय वित्त आयोग के तहत ₹18.5 लाख के व्यय का ब्योरा एवं मनरेगा कार्यों की सामाजिक लेखापरीक्षण रिपोर्ट की समीक्षा।",
    description_mr: "15 व्या केंद्रीय वित्त आयोगांतर्गत ₹18.5 लाख खर्चाचा हिशोब आणि मनरेगा कामांचे सामाजिक लेखापरीक्षण ग्रामस्थांसमोर जाहीर सादरीकरण.",
    category: "meeting",
    date: new Date(Date.now() - 25 * 86400000).toISOString(),
    status: "completed",
    amount: null
  },
  {
    id: 3,
    panchayat_id: "GP-KPG-01",
    title: "Concrete Pavement & Stormwater Drain Construction (Ward 2 to ZP School)",
    title_hi: "वार्ड नंबर 2 से प्राथमिक विद्यालय तक कंक्रीट सड़क व जल निकासी नाली निर्माण",
    title_mr: "वॉर्ड क्र. 2 ते जि.प. प्राथमिक शाळा सिमेंट काँक्रीट रस्ता व बंदिस्त गटार बांधकाम",
    description: "Laying 450 meters of CC road with precast covered side drains to ensure safe all-weather access for schoolchildren and rural transport.",
    description_hi: "स्कूली बच्चों और ग्रामीणों की सुविधा के लिए 450 मीटर पक्की सड़क और ढकी हुई नालियों का निर्माण कार्य 65% पूर्ण।",
    description_mr: "शाळकरी मुलांच्या व शेतकऱ्यांच्या सोयीसाठी 450 मीटर सिमेंट रस्ता आणि झाकलेली भूमिगत गटार बांधकाम काम 65% पूर्ण.",
    category: "work",
    date: new Date(Date.now() - 14 * 86400000).toISOString(),
    status: "ongoing",
    amount: 480000.0
  },
  {
    id: 4,
    panchayat_id: "GP-KPG-01",
    title: "Installation of 24 High-Mast Solar Streetlights in Harijan Wasti & Main Chowk",
    title_hi: "हरिजन बस्ती एवं मुख्य चौक में 24 हाई-मास्ट सोलर स्ट्रीट लाइट स्थापना",
    title_mr: "हरिजन वस्ती व मुख्य बाजारपेठ चौकात 24 सौर पथदिवे (सोलर लाईट) बसविणे",
    description: "Erection of pole-mounted solar LED luminaires with automatic dusk-to-dawn sensors and 5-year maintenance warranty.",
    description_hi: "स्वचालित सेंसर और 5 साल की वारंटी के साथ 24 सौर ऊर्जा स्ट्रीट लाइटें लगाई जा रही हैं।",
    description_mr: "रात्रीच्या सुरक्षिततेसाठी स्वयंचलित सेन्सर असलेले 24 सौर पथदिवे बसविण्याचे काम यशस्वीरीत्या सुरू आहे.",
    category: "work",
    date: new Date(Date.now() - 5 * 86400000).toISOString(),
    status: "ongoing",
    amount: 275000.0
  },
  {
    id: 5,
    panchayat_id: "GP-KPG-01",
    title: "15th Finance Commission Untied Grant Allocation (FY 2025-26)",
    title_hi: "15वां वित्त आयोग अबद्ध अनुदान आवंटन (वित्तीय वर्ष 2025-26)",
    title_mr: "15 वा वित्त आयोग अबद्ध विकास निधी वाटप (सन 2025-26)",
    description: "Central allocation sanctioned for drinking water supply, solar pumping repair, Anganwadi repair, and village digital connectivity center.",
    description_hi: "पेयजल आपूर्ति, सोलर पंप मरम्मत, आंगनवाड़ी सुधार एवं ग्राम डिजिटल सेवा केंद्र के लिए स्वीकृत राशि।",
    description_mr: "पिण्याचे पाणी, सौर पंप दुरुस्ती, अंगणवाडी डागडुजी आणि ग्राम डिजिटल सेवा केंद्रासाठी मंजूर झालेला केंद्रीय निधी.",
    category: "fund",
    date: new Date(Date.now() - 35 * 86400000).toISOString(),
    status: "approved",
    amount: 1850000.0
  }
];

const INITIAL_FALLBACK_GRIEVANCES = [
  {
    id: 1,
    tracking_id: "GS-2026-10492",
    user_id: 1,
    citizen_name: "Sunita Devi Shinde",
    citizen_phone: "9876543210",
    category: "water",
    description: "पिण्याच्या पाण्याची पाईपलाईन मारुती मंदिरासमोर फुटली असून गेल्या दोन दिवसांपासून प्रचंड पाणी वाया जात आहे आणि वॉर्ड 2 मध्ये पाणी येत नाही.",
    description_english: "Drinking water pipeline broken in front of Maruti temple for 2 days, massive water leakage and zero water supply in Ward 2.",
    status: "in_progress",
    department_assigned: "Rural Water Supply & Sanitation Department",
    sla_deadline: new Date(Date.now() + 1 * 86400000).toISOString(),
    created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
    resolution_notes: "Inspection completed by Line Fitter. Repair replacement pipe ordered."
  },
  {
    id: 2,
    tracking_id: "GS-2026-10481",
    user_id: 2,
    citizen_name: "Babu Ganpatrao More",
    citizen_phone: "9876543211",
    category: "electricity",
    description: "बस स्टँड जवळील तीन पथदिवे गेल्या 8 दिवसांपासून बंद आहेत, रात्री खूप अंधार असतो आणि महिलांना ये-जा करताना भीती वाटते.",
    description_english: "Three street lights near the bus stand have been non-functional for 8 days, total darkness at night making pedestrian safety a concern.",
    status: "escalated",
    department_assigned: "Gram Panchayat Energy Cell (MSEDCL/State Discom)",
    sla_deadline: new Date(Date.now() - 4 * 86400000).toISOString(), // Breached
    created_at: new Date(Date.now() - 8 * 86400000).toISOString(),
    resolution_notes: "Auto-escalated by GramSetu SLA Monitor: SLA deadline breached 4 days ago. Discom junior engineer notified."
  },
  {
    id: 3,
    tracking_id: "GS-2026-10512",
    user_id: 3,
    citizen_name: "Aakash Vijay Kamble",
    citizen_phone: "9876543212",
    category: "road",
    description: "प्राथमिक आरोग्य केंद्राकडे जाणाऱ्या रस्त्यावर पावसाने मोठे खड्डे पडले असून ॲम्ब्युलन्स येणे कठीण झाले आहे.",
    description_english: "Large potholes on the road leading to the Primary Health Centre making ambulance transport extremely difficult.",
    status: "submitted",
    department_assigned: "Public Works Department (PWD Rural Roads)",
    sla_deadline: new Date(Date.now() + 13 * 86400000).toISOString(),
    created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
    resolution_notes: null
  },
  {
    id: 4,
    tracking_id: "GS-2026-10398",
    user_id: 2,
    citizen_name: "Babu Ganpatrao More",
    citizen_phone: "9876543211",
    category: "pension",
    description: "वृद्धावस्था निवृत्तीवेतन खात्यात गेल्या दोन महिन्यांचे मानधन जमा झालेले नाही, बँक केवायसी आधीच पूर्ण केलेली आहे.",
    description_english: "Old age pension allowance for the last two months has not been credited to bank account despite KYC completion.",
    status: "resolved",
    department_assigned: "Social Welfare & Women/Child Development Cell",
    sla_deadline: new Date(Date.now() - 10 * 86400000).toISOString(),
    created_at: new Date(Date.now() - 25 * 86400000).toISOString(),
    resolved_at: new Date(Date.now() - 12 * 86400000).toISOString(),
    resolution_notes: "DBT mandate re-authenticated at district treasury. Pending arrears of ₹3,000 credited to SBI account."
  }
];

// Helper to get cached grievances
function getLocalGrievances() {
  const saved = localStorage.getItem('gramsetu_mock_grievances');
  if (saved) {
    try { return JSON.parse(saved); } catch { /* ignore */ }
  }
  localStorage.setItem('gramsetu_mock_grievances', JSON.stringify(INITIAL_FALLBACK_GRIEVANCES));
  return INITIAL_FALLBACK_GRIEVANCES;
}

function saveLocalGrievances(list: any[]) {
  localStorage.setItem('gramsetu_mock_grievances', JSON.stringify(list));
}

// -------------------------------------------------------------
// Client-Side Generic Rule Evaluator (Matches Backend Python Engine)
// -------------------------------------------------------------
function evaluateCondition(val: any, op: string, expected: any): [boolean, string] {
  if (val === undefined || val === null) {
    return [false, `Criteria missing (expected ${op} ${expected})`];
  }
  const nVal = Number(val);
  const nExp = Number(expected);

  if (op === '>=') {
    const p = nVal >= nExp;
    return [p, `Value ${val} is ${p ? '>=' : 'not >='} required ${expected}`];
  }
  if (op === '<=') {
    const p = nVal <= nExp;
    return [p, `Value ₹${Number(val).toLocaleString()} is ${p ? '<=' : 'exceeds maximum allowed'} ₹${Number(expected).toLocaleString()}`];
  }
  if (op === '==' || op === '=') {
    const p = String(val).toLowerCase().trim() === String(expected).toLowerCase().trim();
    return [p, `Value matches required ${expected}`];
  }
  if (op === 'in') {
    const list = Array.isArray(expected) ? expected.map(x => String(x).toLowerCase().trim()) : [String(expected).toLowerCase().trim()];
    const p = list.includes(String(val).toLowerCase().trim());
    return [p, `Category '${val}' ${p ? 'qualifies under' : 'does not qualify under'} (${list.join(', ')})`];
  }
  return [false, 'Unknown condition'];
}

function evaluateRuleNode(node: any, profile: any): [boolean, string[], string[]] {
  const reasons: string[] = [];
  const failed: string[] = [];

  if (node.and && Array.isArray(node.and)) {
    for (const sub of node.and) {
      const [p, r, f] = evaluateRuleNode(sub, profile);
      reasons.push(...r);
      failed.push(...f);
      if (!p) return [false, reasons, failed];
    }
    return [true, reasons, []];
  }

  let allPassed = true;
  for (const field of Object.keys(node)) {
    if (field === 'and' || field === 'or') continue;
    const cond = node[field];
    const fieldVal = profile[field];
    for (const op of Object.keys(cond)) {
      const expected = cond[op];
      const [passed, msg] = evaluateCondition(fieldVal, op, expected);
      const label = field.replace('_', ' ').toUpperCase();
      if (passed) {
        reasons.push(`${label}: ${msg}`);
      } else {
        allPassed = false;
        failed.push(`${label}: ${msg}`);
      }
    }
  }
  return [allPassed, reasons, failed];
}

export const api = {
  // Config
  setCustomApiUrl(url: string) {
    customApiUrl = normalizeApiUrl(url);
    if (customApiUrl) {
      localStorage.setItem('gramsetu_custom_api_url', customApiUrl);
    } else {
      localStorage.removeItem('gramsetu_custom_api_url');
    }
  },

  getCustomApiUrl() {
    return customApiUrl;
  },

  // Auth
  async login(phone_number: string, password: string) {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone_number, password }),
      });
      if (res.ok) return await res.json();
    } catch {
      // Fallback
    }

    // Client fallback demo auth
    if (phone_number === '9822001122' && password === 'Official@123') {
      return {
        access_token: 'mock-official-token-2026',
        token_type: 'bearer',
        user: {
          id: 10,
          name: 'Rameshwar Patil (Gram Sevak / VDO)',
          phone_number: '9822001122',
          preferred_language: 'en',
          role: 'official',
          occupation: 'Gram Panchayat Official'
        }
      };
    }
    if (password === 'Citizen@123') {
      return {
        access_token: 'mock-citizen-token-2026',
        token_type: 'bearer',
        user: {
          id: 1,
          name: phone_number === '9876543211' ? 'Babu Ganpatrao More' : (phone_number === '9876543212' ? 'Aakash Kamble' : 'Sunita Devi Shinde'),
          phone_number: phone_number,
          preferred_language: 'mr',
          role: 'citizen',
          age: phone_number === '9876543211' ? 66 : (phone_number === '9876543212' ? 21 : 44),
          annual_income: phone_number === '9876543211' ? 50000 : (phone_number === '9876543212' ? 120000 : 75000),
          category: phone_number === '9876543211' ? 'SC' : 'OBC',
          occupation: phone_number === '9876543211' ? 'farmer' : (phone_number === '9876543212' ? 'student' : 'widow')
        }
      };
    }
    throw new Error('Incorrect phone number or password. Try 9822001122 / Official@123 or 9876543210 / Citizen@123');
  },

  async register(userData: any) {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      });
      if (res.ok) return await res.json();
    } catch {
      // Fallback
    }

    return {
      access_token: 'mock-new-citizen-token',
      token_type: 'bearer',
      user: {
        id: Math.floor(Math.random() * 1000) + 100,
        ...userData,
        role: 'citizen'
      }
    };
  },

  // Schemes
  async getSchemes(language: string = 'en') {
    try {
      const res = await fetch(`${API_BASE_URL}/schemes?language=${language}`);
      if (res.ok) return await res.json();
    } catch {
      // Fallback
    }

    return FALLBACK_SCHEMES.map(s => ({
      id: s.id,
      name: language === 'hi' && s.name_hi ? s.name_hi : (language === 'mr' && s.name_mr ? s.name_mr : s.name),
      name_hi: s.name_hi,
      name_mr: s.name_mr,
      description: language === 'hi' && s.description_hi ? s.description_hi : (language === 'mr' && s.description_mr ? s.description_mr : s.description),
      department: s.department,
      eligibility_rules: s.eligibility_rules,
      required_documents: s.required_documents,
      application_link: s.application_link
    }));
  },

  async checkEligibility(payload: any) {
    try {
      const res = await fetch(`${API_BASE_URL}/schemes/check-eligibility`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
        body: JSON.stringify(payload),
      });
      if (res.ok) return await res.json();
    } catch {
      // Fallback
    }

    const lang = payload.preferred_language || 'mr';
    const profile = {
      age: payload.age || 44,
      annual_income: payload.annual_income || 75000,
      category: payload.category || 'OBC',
      occupation: payload.occupation || 'widow',
      land_owned_acres: payload.land_owned_acres || 0.5,
      gender: payload.gender || 'female',
      has_disability: payload.has_disability || 'no'
    };

    let eligibleCount = 0;
    const results = FALLBACK_SCHEMES.map(s => {
      const [isEligible, reasons, failed] = evaluateRuleNode(s.eligibility_rules, profile);
      if (isEligible) eligibleCount++;

      let reason = '';
      if (lang === 'mr') {
        reason = isEligible 
          ? `तुम्ही या योजनेसाठी पूर्णपणे पात्र आहात कारण: ${reasons.join('; ')}.`
          : `सध्या निकष पूर्ण होत नाहीत: ${failed.join('; ')}.`;
      } else if (lang === 'hi') {
        reason = isEligible
          ? `आप इस योजना के लिए पात्र हैं क्योंकि: ${reasons.join('; ')}।`
          : `वर्तमान मानदंड पूरे नहीं होते: ${failed.join('; ')}।`;
      } else {
        reason = isEligible
          ? `You qualify for this scheme because: ${reasons.join('; ')}.`
          : `Criteria not currently met: ${failed.join('; ')}.`;
      }

      const sName = lang === 'hi' && s.name_hi ? s.name_hi : (lang === 'mr' && s.name_mr ? s.name_mr : s.name);

      return {
        scheme_id: s.id,
        scheme_name: sName,
        department: s.department,
        is_eligible: isEligible,
        reason,
        required_documents: s.required_documents,
        application_download_url: `/api/schemes/${s.id}/application`
      };
    });

    return {
      total_schemes: FALLBACK_SCHEMES.length,
      eligible_count: eligibleCount,
      results
    };
  },

  getSchemeApplicationPdfUrl(schemeId: number, profileParams: Record<string, any>) {
    const query = new URLSearchParams();
    Object.entries(profileParams).forEach(([key, val]) => {
      if (val !== undefined && val !== null) query.append(key, String(val));
    });
    return `${API_BASE_URL}/schemes/${schemeId}/application?${query.toString()}`;
  },

  // Grievances
  async submitGrievance(data: { description: string; language: string; category?: string }) {
    try {
      const res = await fetch(`${API_BASE_URL}/grievances`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
        body: JSON.stringify(data),
      });
      if (res.ok) return await res.json();
    } catch {
      // Fallback
    }

    const text = data.description.toLowerCase();
    let cat = data.category || 'other';
    let dept = 'Panchayat Development Office (PDO)';
    let days = 10;

    if (text.includes('water') || text.includes('pipe') || text.includes('नल') || text.includes('पाणी') || text.includes('जल')) {
      cat = 'water';
      dept = 'Rural Water Supply & Sanitation Department';
      days = 3;
    } else if (text.includes('light') || text.includes('electric') || text.includes('bijli') || text.includes('वीज') || text.includes('लाईट')) {
      cat = 'electricity';
      dept = 'Gram Panchayat Energy Cell (MSEDCL/State Discom)';
      days = 4;
    } else if (text.includes('road') || text.includes('pothole') || text.includes('रस्ता') || text.includes('खड्डा') || text.includes('सड़क')) {
      cat = 'road';
      dept = 'Public Works Department (PWD Rural Roads)';
      days = 15;
    } else if (text.includes('sanitation') || text.includes('garbage') || text.includes('कचरा') || text.includes('गटार')) {
      cat = 'sanitation';
      dept = 'Health & Rural Sanitation Committee';
      days = 7;
    } else if (text.includes('pension') || text.includes('पेन्शन') || text.includes('पेंशन')) {
      cat = 'pension';
      dept = 'Social Welfare & Women/Child Development Cell';
      days = 15;
    }

    const trackingId = `GS-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;
    const deadline = new Date(Date.now() + days * 86400000).toISOString();

    const newGrievance = {
      id: Date.now(),
      tracking_id: trackingId,
      user_id: 1,
      citizen_name: "Sunita Devi Shinde",
      citizen_phone: "9876543210",
      category: cat,
      description: data.description,
      description_english: data.description,
      status: "submitted",
      department_assigned: dept,
      sla_deadline: deadline,
      is_sla_breached: false,
      created_at: new Date().toISOString(),
      resolution_notes: null
    };

    const currentList = getLocalGrievances();
    saveLocalGrievances([newGrievance, ...currentList]);
    return newGrievance;
  },

  async trackGrievance(trackingId: string) {
    try {
      const res = await fetch(`${API_BASE_URL}/grievances/track/${encodeURIComponent(trackingId.trim())}`);
      if (res.ok) return await res.json();
    } catch {
      // Fallback
    }

    const currentList = getLocalGrievances();
    const g = currentList.find((item: any) => item.tracking_id.toUpperCase() === trackingId.toUpperCase().trim());
    if (!g) {
      throw new Error(`Grievance with Tracking ID '${trackingId}' not found. Please verify the ID.`);
    }

    const isBreached = new Date() > new Date(g.sla_deadline) && g.status !== 'resolved';
    return {
      ...g,
      is_sla_breached: isBreached
    };
  },

  async getOfficialGrievances(filters: { status?: string; category?: string; sla_breached_only?: boolean }) {
    try {
      const params = new URLSearchParams();
      if (filters.status) params.append('status', filters.status);
      if (filters.category) params.append('category', filters.category);
      if (filters.sla_breached_only) params.append('sla_breached_only', 'true');

      const res = await fetch(`${API_BASE_URL}/grievances?${params.toString()}`, {
        headers: { ...getAuthHeader() },
      });
      if (res.ok) return await res.json();
    } catch {
      // Fallback
    }

    let list = getLocalGrievances();
    const now = new Date();

    list = list.map((g: any) => ({
      ...g,
      is_sla_breached: now > new Date(g.sla_deadline) && g.status !== 'resolved'
    }));

    if (filters.status) {
      list = list.filter((g: any) => g.status === filters.status);
    }
    if (filters.category) {
      list = list.filter((g: any) => g.category === filters.category);
    }
    if (filters.sla_breached_only) {
      list = list.filter((g: any) => g.is_sla_breached);
    }
    return list;
  },

  async updateGrievanceStatus(id: number, status: string, resolution_notes?: string) {
    try {
      const res = await fetch(`${API_BASE_URL}/grievances/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
        body: JSON.stringify({ status, resolution_notes }),
      });
      if (res.ok) return await res.json();
    } catch {
      // Fallback
    }

    const currentList = getLocalGrievances();
    const updated = currentList.map((g: any) => {
      if (g.id === id) {
        return {
          ...g,
          status,
          resolution_notes: resolution_notes || g.resolution_notes,
          resolved_at: status === 'resolved' ? new Date().toISOString() : g.resolved_at
        };
      }
      return g;
    });
    saveLocalGrievances(updated);
    return { success: true };
  },

  // Governance
  async getGovernanceRecords(category?: string, search?: string, language: string = 'en') {
    try {
      const params = new URLSearchParams({ language });
      if (category) params.append('category', category);
      if (search) params.append('search', search);

      const res = await fetch(`${API_BASE_URL}/governance/records?${params.toString()}`);
      if (res.ok) return await res.json();
    } catch {
      // Fallback
    }

    let list = FALLBACK_GOVERNANCE.map(r => ({
      id: r.id,
      panchayat_id: r.panchayat_id,
      title: language === 'hi' && r.title_hi ? r.title_hi : (language === 'mr' && r.title_mr ? r.title_mr : r.title),
      description: language === 'hi' && r.description_hi ? r.description_hi : (language === 'mr' && r.description_mr ? r.description_mr : r.description),
      category: r.category,
      date: r.date,
      status: r.status,
      amount: r.amount
    }));

    if (category) {
      list = list.filter(r => r.category === category);
    }
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(r => r.title.toLowerCase().includes(q) || r.description.toLowerCase().includes(q));
    }
    return list;
  },

  // Chat NLU
  async sendChatMessage(message: string, language: string = 'en', userId?: number) {
    try {
      const res = await fetch(`${API_BASE_URL}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
        body: JSON.stringify({ message, language, user_id: userId }),
      });
      if (res.ok) return await res.json();
    } catch {
      // Fallback
    }

    const text = message.toLowerCase();
    const trackingMatch = message.match(/\b(GS-\d{4}-\d{4,6})\b/i);

    if (trackingMatch) {
      const tid = trackingMatch[1].toUpperCase();
      const currentList = getLocalGrievances();
      const g = currentList.find((item: any) => item.tracking_id.toUpperCase() === tid);
      if (g) {
        const reply = language === 'mr'
          ? `तक्रार आयडी ${g.tracking_id} ची सद्यस्थिती: **${g.status.toUpperCase()}** आहे.\n• विभाग: ${g.department_assigned}\n• निवारण हमी मुदत: ${new Date(g.sla_deadline).toLocaleDateString()}`
          : language === 'hi'
          ? `शिकायत आईडी ${g.tracking_id} का आधिकारिक विवरण:\n• स्थिति: **${g.status.toUpperCase()}**\n• विभाग: ${g.department_assigned}\n• समाधान समयसीमा: ${new Date(g.sla_deadline).toLocaleDateString()}`
          : `Grievance ID ${g.tracking_id} Status: **${g.status.toUpperCase()}**.\n• Department: ${g.department_assigned}\n• SLA Target: ${new Date(g.sla_deadline).toLocaleDateString()}`;
        return {
          reply,
          language,
          intent_detected: 'grievance',
          suggested_actions: ['Track Another ID', 'Check Scheme Eligibility', 'Panchayat Works'],
          metadata: { tracking_id: g.tracking_id }
        };
      } else {
        const reply = language === 'mr'
          ? `ट्रॅकिंग आयडी **${tid}** रेकॉर्डमध्ये सापडला नाही. ❌\nकृपया आपला अचूक आयडी तपासा किंवा नवीन तक्रार नोंदवा.`
          : language === 'hi'
          ? `ट्रैकिंग आईडी **${tid}** सिस्टम में नहीं मिला। ❌\nकृपया सही ट्रैकिंग आईडी जांचें या नई शिकायत दर्ज करें।`
          : `Tracking ID **${tid}** was not found. ❌\nPlease verify the ID or register a new grievance.`;
        return {
          reply,
          language,
          intent_detected: 'grievance',
          suggested_actions: ['File New Grievance', 'Check Scheme Eligibility'],
          metadata: { tracking_id: tid }
        };
      }
    }

    // Specific Scheme check intent
    if (text.includes('awas') || text.includes('housing') || text.includes('pmay') || text.includes('घरकुल') || text.includes('मकान') || text.includes('आवास')) {
      const reply = language === 'mr'
        ? "🏡 **प्रधानमंत्री आवास योजना - ग्रामीण (PMAY-G / घरकुल)**:\n• **अनुदान**: पक्के घर बांधण्यासाठी ₹१,२०,००० थेट बँक खात्यात + मनरेगा मजुरी (₹२८,०००) + स्वच्छ भारत शौचालय (₹१२,०००).\n• **पात्रता**: कच्च्या घरात राहणारे किंवा SECC 2011 प्रतीक्षा यादीतील लाभार्थी.\n• **कागदपत्रे**: आधार कार्ड, बँक खाते, ७/१२ किंवा नमुना ८, जॉब कार्ड.\n💡 'पात्रता तपासा' टॅबमधून पूर्व-भरलेला अर्ज त्वरित डाउनलोड करा."
        : language === 'hi'
        ? "🏡 **प्रधानमंत्री आवास योजना - ग्रामीण (PMAY-G / पक्का मकान)**:\n• **अनुदान**: पक्के मकान निर्माण हेतु ₹1,20,000 की सीधी सहायता + मनरेगा 90 दिन मजदूरी + शौचालय अनुदान (₹12,000)।\n• **पात्रता**: कच्चे मकान या बेघर ग्रामीण परिवार (SECC 2011 सूची)।\n• **दस्तावेज**: आधार कार्ड, बैंक पासबुक, जमीन रिकॉर्ड, जॉब कार्ड।\n💡 'पात्रता' पोर्टल से पहले से भरा हुआ फॉर्म सीधे डाउनलोड करें।"
        : "🏡 **Pradhan Mantri Awas Yojana - Gramin (PMAY-G)**:\n• **Grant**: ₹1,20,000 direct bank grant + 90 days MGNREGA wages (~₹28,000) + Swachh Bharat toilet grant (₹12,000).\n• **Eligibility**: Rural houseless or kutcha-house families in SECC list.\n• **Documents**: Aadhaar card, bank account, land 7/12 record, Job card.\n💡 Download your pre-filled application form in the Scheme Eligibility tab.";
      return {
        reply,
        language,
        intent_detected: 'scheme_check',
        suggested_actions: ['Check Full Eligibility', 'Download Application Form', 'Panchayat Works']
      };
    }

    if (text.includes('kisan') || text.includes('farmer') || text.includes('शेतक') || text.includes('किसान') || text.includes('सम्मान') || text.includes('पीक') || text.includes('विमा') || text.includes('कृषी')) {
      const reply = language === 'mr'
        ? "🌾 **शेतकऱ्यांसाठी प्रमुख योजना (PM किसान + नमो शेतकरी महासन्मान)**:\n• **PM किसान सन्मान निधी**: वर्षाला ₹६,००० (३ हप्ते) थेट बँक खात्यात जमा.\n• **नमो शेतकरी योजना (महाराष्ट्र)**: राज्य सरकारकडून अतिरिक्त ₹६,००० (एकूण ₹१२,००० प्रतिवर्ष!).\n• **₹१ रुपयात पीक विमा योजना**: अवकाळी पाऊस व दुष्काळात पिकांचे नुकसान झाल्यास संपूर्ण विमा संरक्षण.\n• **अटी**: शेतीचा ७/१२ व ८-अ, आधार लिंक बँक खाते आणि e-KYC पूर्ण असणे आवश्यक."
        : language === 'hi'
        ? "🌾 **किसानों के लिए प्रमुख योजनाएं (पीएम किसान + फसल बीमा)**:\n• **पीएम किसान सम्मान निधि**: प्रतिवर्ष ₹6,000 (3 किस्तें) सीधे बैंक खाते में।\n• **नमो शेतकरी महासम्मान (महाराष्ट्र)**: अतिरिक्त ₹6,000 वार्षिक (कुल ₹12,000 प्रतिवर्ष)।\n• **₹1 में फसल बीमा योजना**: सूखा या बेमौसम बारिश से नुकसान पर पूर्ण मुआवजा।\n• **शर्तें**: आधार लिंक सक्रिय बैंक खाता, जमीन खतौनी/7-12 और पूर्ण e-KYC।"
        : "🌾 **Top Welfare Schemes for Farmers (PM-KISAN & Crop Insurance)**:\n• **PM Kisan Samman Nidhi**: ₹6,000/year directly to bank accounts.\n• **Namo Shetkari Mahasanman (Maharashtra)**: Additional ₹6,000/year (Total ₹12,000 annually).\n• **₹1 Crop Insurance (PMFBY)**: Full indemnity against crop damage at token ₹1 premium.\n• **Requirements**: 7/12 land ledger record, Aadhaar bank seeding, and e-KYC.";
      return {
        reply,
        language,
        intent_detected: 'scheme_check',
        suggested_actions: ['Check Full Eligibility', 'Download Application Form', 'File Grievance']
      };
    }

    if (text.includes('pension') || text.includes('पेन्शन') || text.includes('पेंशन') || text.includes('वृद्ध') || text.includes('विधवा')) {
      const reply = language === 'mr'
        ? "👵 **सामाजिक सुरक्षा पेन्शन योजना**:\n• **इंदिरा गांधी राष्ट्रीय वृद्धावस्था पेन्शन**: ६० वर्षांवरील बीपीएल ज्येष्ठांना दरमहा ₹१,५००.\n• **इंदिरा गांधी राष्ट्रीय विधवा पेन्शन**: बीपीएल विधवा महिलांना दरमहा ₹१,५०० आर्थिक मदत.\n• **दिव्यांग पेन्शन**: ४०% पेक्षा जास्त अपंगत्व असणाऱ्या व्यक्तींना मासिक सहाय्य.\n• **कागदपत्रे**: वयाचा दाखला, बीपीएल रेशन कार्ड, उत्पन्नाचा दाखला."
        : language === 'hi'
        ? "👵 **राष्ट्रीय सामाजिक सहायता एवं पेंशन योजनाएं**:\n• **वृद्धावस्था पेंशन**: 60 वर्ष या अधिक के बीपीएल वरिष्ठ नागरिकों को ₹1,500 प्रति माह।\n• **विधवा पेंशन**: बीपीएल विधवा महिलाओं को ₹1,500 प्रति माह आर्थिक सहायता।\n• **दिव्यांग पेंशन**: 40% से अधिक दिव्यांगता वाले नागरिकों को मासिक वित्तीय सहायता।\n• **दस्तावेज**: आयु प्रमाण पत्र, बीपीएल राशन कार्ड, आय प्रमाण पत्र।"
        : "👵 **National Social Assistance & Pension Schemes**:\n• **Old Age Pension (IGNOAPS)**: ₹1,500/month for BPL senior citizens aged 60+.\n• **Widow Pension (IGNWPS)**: ₹1,500/month for BPL destitute widows.\n• **Divyang Pension**: Monthly financial allowance for >40% disability.\n• **Documents**: Age proof, BPL Ration Card, Tehsildar Income Certificate.";
      return {
        reply,
        language,
        intent_detected: 'scheme_check',
        suggested_actions: ['Check Full Eligibility', 'Download Application Form', 'Panchayat Works']
      };
    }

    // General scheme intent
    if (text.includes('scheme') || text.includes('योजना') || text.includes('पात्रता') || text.includes('eligib') || text.includes('अर्ज') || text.includes('form') || text.includes('अनुदान')) {
      const reply = language === 'mr'
        ? "ग्रामसेतू ५ प्रमुख शासकीय योजनांसाठी स्वयंचलित पात्रता तपासतो:\n• **प्रधानमंत्री आवास योजना (घरकुल)**\n• **इंदिरा गांधी वृद्धावस्था पेन्शन योजना**\n• **इंदिरा गांधी विधवा पेन्शन योजना**\n• **महात्मा गांधी ग्रामीण रोजगार हमी योजना (मनरेगा)**\n• **पोस्ट-मॅट्रिक शिष्यवृत्ती योजना**\n\n'पात्रता तपासा' टॅबमध्ये तुमचे वय व उत्पन्न टाकून थेट अधिकृत अर्ज डाउनलोड करा."
        : language === 'hi'
        ? "ग्रामसेतु 5 प्रमुख सरकारी योजनाओं के लिए पात्रता जांचता है:\n• **प्रधानमंत्री आवास योजना (पक्का मकान)**\n• **इंदिरा गांधी वृद्धावस्था पेंशन योजना**\n• **इंदिरा गांधी विधवा पेंशन योजना**\n• **महात्मा गांधी ग्रामीण रोजगार गारंटी (मनरेगा)**\n• **पोस्ट-मैट्रिक छात्रवृत्ति योजना**\n\n'पात्रता' टैब में जाकर तुरंत अपने नाम का आधिकारिक आवेदन फॉर्म डाउनलोड करें।"
        : "GramSetu verifies eligibility across 5 key welfare schemes:\n• **Pradhan Mantri Awas Yojana - Gramin (PMAY-G)**\n• **Indira Gandhi Old Age Pension (IGNOAPS)**\n• **Indira Gandhi Widow Pension (IGNWPS)**\n• **MGNREGA 100-Day Guaranteed Wage Employment**\n• **Post-Matric Student Scholarship**\n\nVisit the Scheme Eligibility tab to download your pre-filled application PDF.";
      return {
        reply,
        language,
        intent_detected: 'scheme_check',
        suggested_actions: ['Check Full Eligibility', 'Download Application Form', 'File Grievance']
      };
    }

    // Grievance filing intent
    if (text.includes('water') || text.includes('pipe') || text.includes('light') || text.includes('road') || text.includes('खड्डा') || text.includes('खड्डे') || text.includes('पाणी') || text.includes('वीज') || text.includes('लाईट') || text.includes('तक्रार') || text.includes('शिकायत') || text.includes('complain') || text.includes('broken') || text.includes('leak') || text.includes('गळती') || text.includes('फुटली') || text.includes('कचरा') || text.includes('गटार') || text.includes('अंधार') || text.includes('दुर्गंधी')) {
      const gRes = await api.submitGrievance({ description: message, language });
      const reply = language === 'mr'
        ? `आपली तक्रार अधिकृतपणे नोंदवून संबंधित विभागाकडे वर्ग करण्यात आली आहे! ✅\n\n• **ट्रॅकिंग आयडी**: \`${gRes.tracking_id}\`\n• **नियुक्त विभाग**: ${gRes.department_assigned}\n• **SLA हमी मुदत**: **${new Date(gRes.sla_deadline).toLocaleDateString()}**\n\nमुदतीत निवारण न झाल्यास ही तक्रार स्वयंचलितपणे गट विकास अधिकारी (BDO) यांच्याकडे वर्ग होईल. आपण हा आयडी वापरून कधीही प्रगती तपासू शकता.`
        : language === 'hi'
        ? `आपकी शिकायत अधिकृत रूप से दर्ज कर ली गई है! ✅\n\n• **ट्रैकिंग आईडी**: \`${gRes.tracking_id}\`\n• **नियुक्त विभाग**: ${gRes.department_assigned}\n• **SLA समाधान अंतिम तिथि**: **${new Date(gRes.sla_deadline).toLocaleDateString()}**\n\nयदि निर्धारित समय में समाधान नहीं हुआ, तो यह शिकायत स्वतः ब्लॉक विकास अधिकारी (BDO) को अग्रेषित हो जाएगी।`
        : `Your grievance has been officially registered and assigned! ✅\n\n• **Tracking ID**: \`${gRes.tracking_id}\`\n• **Assigned Department**: ${gRes.department_assigned}\n• **SLA Resolution Deadline**: **${new Date(gRes.sla_deadline).toLocaleDateString()}**\n\nAutomatic SLA escalation to the Block Development Officer (BDO) is active for this ticket.`;
      return {
        reply,
        language,
        intent_detected: 'grievance',
        suggested_actions: [`Track ${gRes.tracking_id}`, 'File Another Grievance', 'View Governance Records'],
        metadata: { tracking_id: gRes.tracking_id }
      };
    }

    // Governance records intent
    if (text.includes('meeting') || text.includes('सभा') || text.includes('बैठक') || text.includes('काम') || text.includes('कामे') || text.includes('work') || text.includes('fund') || text.includes('निधी') || text.includes('बजेट') || text.includes('सरपंच') || text.includes('sarpanch')) {
      const reply = language === 'mr'
        ? "🏛️ **ग्रामपंचायतीचे अधिकृत अपडेट्स (कोपरगाव ग्रामीण)**:\n• **विशेष ग्रामसभा बैठक**: आगामी १५ तारीख, स. १०:३० वा. (विषय: जलजीवन मिशन नळ जोडणी मंजुरी)\n• **सिमेंट रस्ता व गटार बांधकाम**: वॉर्ड क्र. २ ते शाळा - ६५% पूर्ण (निधी: ₹४.८ लाख)\n• **२४ सौर पथदिवे बसविणे**: काम प्रगतीपथावर (निधी: ₹२.१ लाख)\n• **प्रशासन**: सरपंच: सौ. सुनीता पाटील | ग्रामसेवक: श्री आर. के. शिंदे"
        : language === 'hi'
        ? "🏛️ **ग्राम पंचायत आधिकारिक अपडेट (कोपरगांव ग्रामीण)**:\n• **विशेष ग्राम सभा बैठक**: आगामी 15 तारीख, प्रातः 10:30 बजे (विषय: जल जीवन मिशन नल कनेक्शन)\n• **सीमेंट सड़क व नाली निर्माण**: वार्ड 2 से विद्यालय - 65% पूर्ण (बजट: ₹4.8 लाख)\n• **24 सोलर स्ट्रीट लाइट स्थापना**: कार्य प्रगति पर (बजट: ₹2.1 लाख)\n• **प्रशासन**: सरपंच: सौ. सुनीता पाटील | ग्राम सेवक: श्री आर. के. शिंदे"
        : "🏛️ **Gram Panchayat Official Updates (Kopargaon Rural)**:\n• **Special Gram Sabha Meeting**: 15th of month at 10:30 AM (Jal Jeevan Mission approvals)\n• **Concrete Road & Drain Works**: Ward 2 to School - 65% Completed (Budget: ₹4.8 Lakh)\n• **24 Solar Streetlights**: Installation in progress (Budget: ₹2.1 Lakh)\n• **Administration**: Sarpanch: Mrs. Sunita Patil | Gram Sevak: Mr. R. K. Shinde";
      return {
        reply,
        language,
        intent_detected: 'governance_query',
        suggested_actions: ['View All Meetings', 'View Works & Budgets', 'Check Scheme Eligibility']
      };
    }

    // General greeting & fallback
    const welcome = language === 'mr'
      ? "नमस्ते! मी **ग्रामसेतू (GramSetu)** आहे, तुमचा ग्रामपंचायत डिजिटल सहाय्यक. 🙏\n\nमी तुम्हाला शासकीय योजनांची पात्रता तपासणे, पाणी/वीज/रस्त्यांची तक्रार नोंदवणे आणि आगामी ग्रामसभा बैठकांची माहिती मिळवण्यासाठी मदत करू शकतो. तुम्हाला काय माहिती हवी आहे?"
      : language === 'hi'
      ? "नमस्ते! मैं **ग्रामसेतु (GramSetu)** हूँ, आपका ग्राम पंचायत डिजिटल सहायक। 🙏\n\nमैं सरकारी योजनाओं की पात्रता जांचने, पानी/सड़क/बिजली की शिकायत दर्ज करने और ग्राम सभा बैठकों की जानकारी देने में आपकी सहायता कर सकता हूँ। आप क्या जानना चाहते हैं?"
      : "Namaste! I am **GramSetu**, your 24/7 Gram Panchayat digital governance assistant. 🙏\n\nI can help you check welfare scheme eligibility, register civic complaints, or check Gram Sabha meeting agendas and village public works. How can I help you today?";
    return {
      reply: welcome,
      language,
      intent_detected: 'general',
      suggested_actions: [
        language === 'mr' ? 'योजना पात्रता तपासा' : (language === 'hi' ? 'योजना पात्रता जांचें' : 'Check Scheme Eligibility'),
        language === 'mr' ? 'पाणी पुरवठ्याची तक्रार' : (language === 'hi' ? 'पानी की समस्या' : 'Report Water Leak'),
        language === 'mr' ? 'आगामी ग्रामसभा बैठक' : (language === 'hi' ? 'आगामी ग्राम सभा' : 'Upcoming Gram Sabha Meeting')
      ]
    };
  },

  // Analytics
  async getDashboardAnalytics() {
    try {
      const res = await fetch(`${API_BASE_URL}/analytics/dashboard`, {
        headers: { ...getAuthHeader() },
      });
      if (res.ok) return await res.json();
    } catch {
      // Fallback
    }

    const list = getLocalGrievances();
    const now = new Date();
    let open = 0;
    let escalated = 0;
    let resolved = 0;
    let breached = 0;

    const catCounts: Record<string, number> = { water: 0, electricity: 0, road: 0, sanitation: 0, pension: 0, other: 0 };
    const statusCounts: Record<string, number> = { submitted: 0, in_progress: 0, escalated: 0, resolved: 0 };

    list.forEach((g: any) => {
      const isBreached = now > new Date(g.sla_deadline) && g.status !== 'resolved';
      if (isBreached) breached++;
      if (g.status === 'resolved') resolved++;
      else if (g.status === 'escalated') escalated++;
      else open++;

      catCounts[g.category] = (catCounts[g.category] || 0) + 1;
      statusCounts[g.status] = (statusCounts[g.status] || 0) + 1;
    });

    return {
      total_grievances: list.length,
      open_grievances: open,
      escalated_grievances: escalated,
      resolved_grievances: resolved,
      sla_breached_grievances: breached,
      resolution_rate_percent: list.length > 0 ? Math.round((resolved / list.length) * 100) : 0,
      total_citizens: 4,
      total_scheme_checks: 18,
      grievances_by_category: Object.entries(catCounts).map(([category, count]) => ({ category, count })),
      grievances_by_status: Object.entries(statusCounts).map(([status, count]) => ({ status, count })),
      grievance_trends: [
        { date: "01 Sep", count: 2 },
        { date: "02 Sep", count: 1 },
        { date: "03 Sep", count: 3 },
        { date: "04 Sep", count: 1 },
        { date: "05 Sep", count: 4 },
        { date: "06 Sep", count: 2 }
      ],
      scheme_uptake: [
        { scheme_id: 1, scheme_name: "Pradhan Mantri Awas Yojana (PMAY-G)", total_checks: 18, eligible_count: 14, eligibility_rate_percent: 77.8 },
        { scheme_id: 2, scheme_name: "Indira Gandhi Old Age Pension (IGNOAPS)", total_checks: 18, eligible_count: 8, eligibility_rate_percent: 44.4 },
        { scheme_id: 3, scheme_name: "Indira Gandhi Widow Pension (IGNWPS)", total_checks: 18, eligible_count: 6, eligibility_rate_percent: 33.3 },
        { scheme_id: 4, scheme_name: "MGNREGA 100-Day Wage Employment", total_checks: 18, eligible_count: 18, eligibility_rate_percent: 100.0 },
        { scheme_id: 5, scheme_name: "Post-Matric Student Scholarship (SC/ST/OBC)", total_checks: 18, eligible_count: 11, eligibility_rate_percent: 61.1 }
      ]
    };
  },

  async triggerSlaEscalation() {
    try {
      const res = await fetch(`${API_BASE_URL}/analytics/trigger-sla-escalation`, {
        method: 'POST',
        headers: { ...getAuthHeader() },
      });
      if (res.ok) return await res.json();
    } catch {
      // Fallback
    }

    const currentList = getLocalGrievances();
    const now = new Date();
    let escalatedCount = 0;

    const updated = currentList.map((g: any) => {
      if (now > new Date(g.sla_deadline) && g.status !== 'resolved' && g.status !== 'escalated') {
        escalatedCount++;
        return {
          ...g,
          status: 'escalated',
          resolution_notes: `Auto-escalated by GramSetu SLA Monitor on ${now.toLocaleDateString()}: SLA deadline breached.`
        };
      }
      return g;
    });

    saveLocalGrievances(updated);
    return {
      message: `SLA compliance scan complete. ${escalatedCount} overdue grievances escalated to BDO & Sarpanch.`,
      escalated_count: escalatedCount
    };
  }
};
