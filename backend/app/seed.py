import asyncio
from datetime import datetime, timedelta
from sqlalchemy import select
from app.database import AsyncSessionLocal, init_db
from app.models.user import User
from app.models.scheme import Scheme
from app.models.governance import GovernanceRecord
from app.models.grievance import Grievance
from app.models.eligibility import EligibilityCheck
from app.services.auth_service import get_password_hash

async def seed_data():
    await init_db()
    async with AsyncSessionLocal() as db:
        # Check if already seeded
        res = await db.execute(select(User).where(User.phone_number == "9822001122"))
        if res.scalar_one_or_none():
            print("Database already seeded with demo data.")
            return

        print("Seeding initial users...")
        official = User(
            name="Rameshwar Patil (Gram Sevak / VDO)",
            phone_number="9822001122",
            password_hash=get_password_hash("Official@123"),
            preferred_language="en",
            role="official",
            occupation="Gram Panchayat Official",
            created_at=datetime.utcnow() - timedelta(days=30)
        )
        db.add(official)

        citizen1 = User(
            name="Sunita Devi Shinde",
            phone_number="9876543210",
            password_hash=get_password_hash("Citizen@123"),
            preferred_language="mr",
            role="citizen",
            age=44,
            annual_income=75000.0,
            income_bracket="<100000",
            occupation="widow",
            land_owned_acres=0.5,
            category="OBC",
            gender="female",
            has_disability="no",
            created_at=datetime.utcnow() - timedelta(days=20)
        )
        db.add(citizen1)

        citizen2 = User(
            name="Babu Ganpatrao More",
            phone_number="9876543211",
            password_hash=get_password_hash("Citizen@123"),
            preferred_language="mr",
            role="citizen",
            age=66,
            annual_income=50000.0,
            income_bracket="<100000",
            occupation="farmer",
            land_owned_acres=1.2,
            category="SC",
            gender="male",
            has_disability="no",
            created_at=datetime.utcnow() - timedelta(days=15)
        )
        db.add(citizen2)

        citizen3 = User(
            name="Aakash Vijay Kamble",
            phone_number="9876543212",
            password_hash=get_password_hash("Citizen@123"),
            preferred_language="hi",
            role="citizen",
            age=21,
            annual_income=120000.0,
            income_bracket="100000-250000",
            occupation="student",
            land_owned_acres=0.0,
            category="SC",
            gender="male",
            has_disability="no",
            created_at=datetime.utcnow() - timedelta(days=10)
        )
        db.add(citizen3)

        await db.commit()
        await db.refresh(official)
        await db.refresh(citizen1)
        await db.refresh(citizen2)
        await db.refresh(citizen3)

        print("Seeding welfare schemes...")
        schemes = [
            Scheme(
                name="Pradhan Mantri Awas Yojana - Gramin (PMAY-G)",
                name_hi="प्रधानमंत्री आवास योजना - ग्रामीण",
                name_mr="प्रधानमंत्री आवास योजना - ग्रामीण",
                description="Financial assistance of ₹1,20,000 to rural families without pucca house for the construction of clean, disaster-resilient housing with toilet and electricity connection.",
                description_hi="कच्चे मकानों में रहने वाले ग्रामीण परिवारों को पक्के घर के निर्माण हेतु ₹1,20,000 की वित्तीय सहायता, जिसमें शौचालय और बिजली कनेक्शन शामिल है।",
                description_mr="कच्च्या घरात राहणाऱ्या गरजू ग्रामीण कुटुंबांना पक्के घर बांधण्यासाठी ₹1,20,000 चे थेट आर्थिक अनुदान, ज्यामध्ये शौचालय व वीज जोडणी समाविष्ट आहे.",
                department="Ministry of Rural Development & Panchayat Raj",
                eligibility_rules={
                    "and": [
                        {"annual_income": {"<=": 180000}},
                        {"land_owned_acres": {"<=": 5.0}}
                    ]
                },
                required_documents=[
                    "Aadhaar Card",
                    "MGNREGA Job Card Number",
                    "Bank Account Passbook (Aadhaar linked)",
                    "Certificate of Kutcha House / No Pucca House Proof",
                    "Gram Sabha Beneficiary Approval Resolution"
                ],
                application_link="https://pmayg.nic.in"
            ),
            Scheme(
                name="Indira Gandhi National Old Age Pension Scheme (IGNOAPS)",
                name_hi="इंदिरा गांधी राष्ट्रीय वृद्धावस्था पेंशन योजना",
                name_mr="इंदिरा गांधी राष्ट्रीय वृद्ध निवृत्तीवेतन योजना",
                description="Monthly pension of ₹1,000 - ₹1,500 to senior citizens aged 60 years or above belonging to below-poverty-line rural households to ensure dignified livelihood.",
                description_hi="गरीबी रेखा से नीचे जीवनयापन करने वाले 60 वर्ष या उससे अधिक आयु के वरिष्ठ नागरिकों को ₹1,000 - ₹1,500 की मासिक पेंशन सहायता।",
                description_mr="दारिद्र्यरेषेखालील 60 वर्षे किंवा त्याहून अधिक वयाच्या ज्येष्ठ नागरिकांना सन्मानपूर्वक जगण्यासाठी दरमहा ₹1,000 - ₹1,500 ची निवृत्तीवेतन मदत.",
                department="Social Welfare Department (NSAP)",
                eligibility_rules={
                    "and": [
                        {"age": {">=": 60}},
                        {"annual_income": {"<=": 100000}}
                    ]
                },
                required_documents=[
                    "Proof of Age (Aadhaar Card or School Leaving Certificate)",
                    "BPL Ration Card / Income Certificate (Tahsildar)",
                    "Bank / Post Office Passbook with IFSC",
                    "Recent Passport Size Photograph"
                ],
                application_link="https://nsap.nic.in"
            ),
            Scheme(
                name="Indira Gandhi National Widow Pension Scheme (IGNWPS)",
                name_hi="इंदिरा गांधी राष्ट्रीय विधवा पेंशन योजना",
                name_mr="इंदिरा गांधी राष्ट्रीय विधवा निवृत्तीवेतन योजना",
                description="Monthly financial security of ₹1,200 to widows aged 40 years or above from economically weaker rural sections without family financial breadwinner.",
                description_hi="आर्थिक रूप से कमजोर ग्रामीण परिवारों की 40 वर्ष या उससे अधिक आयु की विधवा महिलाओं को ₹1,200 की मासिक पेंशन सुरक्षा।",
                description_mr="आर्थिकदृष्ट्या दुर्बल घटकातील 40 वर्षे किंवा त्याहून अधिक वयाच्या विधवा महिलांना स्वावलंबी जगण्यासाठी दरमहा ₹1,200 चे आर्थिक साहाय्य.",
                department="Women & Child Welfare Department",
                eligibility_rules={
                    "and": [
                        {"age": {">=": 40}},
                        {"annual_income": {"<=": 120000}},
                        {"occupation": {"==": "widow"}}
                    ]
                },
                required_documents=[
                    "Husband's Official Death Certificate",
                    "Age Proof of Applicant",
                    "Income Certificate / BPL Certificate",
                    "Bank Passbook with Aadhaar Seeding",
                    "Self-declaration of Non-Remarriage"
                ],
                application_link="https://nsap.nic.in"
            ),
            Scheme(
                name="MGNREGA 100-Day Wage Employment Card",
                name_hi="मनरेगा 100-दिवसीय गारंटी रोजगार जॉब कार्ड",
                name_mr="महात्मा गांधी राष्ट्रीय ग्रामीण रोजगार हमी (मनरेगा) जॉब कार्ड",
                description="Legal guarantee of at least 100 days of wage employment in every financial year to every rural household whose adult members volunteer to do unskilled manual work.",
                description_hi="प्रत्येक ग्रामीण परिवार को प्रति वित्तीय वर्ष कम से कम 100 दिनों के अकुशल शारीरिक श्रम रोजगार की कानूनी गारंटी और समय पर बैंक खाते में मजदूरी।",
                description_mr="ग्रामीण भागातील प्रौढ व्यक्तींना अकुशल शारीरिक काम करण्याची तयारी असल्यास प्रत्येक आर्थिक वर्षात किमान 100 दिवसांच्या रोजगाराची कायदेशीर हमी.",
                department="Department of Rural Development & Employment Guarantee",
                eligibility_rules={
                    "age": {">=": 18}
                },
                required_documents=[
                    "Aadhaar Card of all adult family members",
                    "Proof of Rural Residence (Ration card/Voter ID)",
                    "Joint/Individual Bank Savings Account Passbook",
                    "Two Passport Size Photographs"
                ],
                application_link="https://nrega.nic.in"
            ),
            Scheme(
                name="Post-Matric Student Scholarship Scheme (SC/ST/OBC)",
                name_hi="पोस्ट-मैट्रिक छात्रवृत्ति योजना (एससी/एसटी/ओबीसी)",
                name_mr="मॅट्रिकोत्तर शिष्यवृत्ती योजना (अनुसूचित जाती/जमाती/इतर मागास प्रवर्ग)",
                description="100% tuition reimbursement and maintenance allowance for SC, ST, and OBC students pursuing 11th, 12th, diploma, undergraduate, or vocational studies in accredited colleges.",
                description_hi="11वीं, 12वीं, डिप्लोमा और स्नातक पाठ्यक्रमों में अध्ययनरत अनुसूचित जाति, जनजाति और अन्य पिछड़ा वर्ग के छात्रों को शिक्षण शुल्क प्रतिपूर्ति एवं निर्वाह भत्ता।",
                description_mr="11 वी, 12 वी, पदविका आणि पदवीचे शिक्षण घेणाऱ्या अनुसूचित जाती, जमाती व इतर मागास प्रवर्गातील विद्यार्थ्यांना संपूर्ण परीक्षा शुल्क माफी व निर्वाह भत्ता.",
                department="Social Justice & Special Assistance Department",
                eligibility_rules={
                    "and": [
                        {"category": {"in": ["SC", "ST", "OBC"]}},
                        {"annual_income": {"<=": 250000}}
                    ]
                },
                required_documents=[
                    "Caste Certificate issued by Competent Authority (Sub-Divisional Officer)",
                    "Family Income Certificate issued by Tahsildar",
                    "Previous Year Passed Marksheet",
                    "College Admission Fee Receipt & Bonafide Certificate",
                    "Aadhaar-seeded Bank Account Details"
                ],
                application_link="https://scholarships.gov.in"
            )
        ]

        for s in schemes:
            db.add(s)
        await db.commit()

        # Seed initial eligibility checks
        s_list_res = await db.execute(select(Scheme))
        db_schemes = s_list_res.scalars().all()
        for s in db_schemes:
            db.add(EligibilityCheck(
                user_id=citizen1.id,
                scheme_id=s.id,
                is_eligible=(s.id in [1, 3, 4, 5]),
                reason="Auto-evaluated during onboarding check",
                checked_at=datetime.utcnow() - timedelta(days=12)
            ))
            db.add(EligibilityCheck(
                user_id=citizen2.id,
                scheme_id=s.id,
                is_eligible=(s.id in [1, 2, 4, 5]),
                reason="Auto-evaluated during onboarding check",
                checked_at=datetime.utcnow() - timedelta(days=8)
            ))
            db.add(EligibilityCheck(
                user_id=citizen3.id,
                scheme_id=s.id,
                is_eligible=(s.id in [4, 5]),
                reason="Auto-evaluated during onboarding check",
                checked_at=datetime.utcnow() - timedelta(days=4)
            ))

        print("Seeding governance records...")
        governance_records = [
            GovernanceRecord(
                panchayat_id="GP-MAHA-042",
                title="Special Gram Sabha Meeting: Annual Development Plan Approval",
                title_hi="विशेष ग्राम सभा बैठक: वार्षिक विकास कार्य योजना एवं बजट अनुमोदन",
                title_mr="विशेष ग्रामसभा बैठक: वार्षिक विकास आराखडा व अंदाजपत्रक मंजुरी",
                description="Discussion and approval of Jal Jeevan Mission tap connections for 120 households, sanitation drain tenders, and selection of PMAY-G beneficiary priority list.",
                description_hi="120 परिवारों के लिए जल जीवन मिशन नल कनेक्शन, पक्की नालियों के टेंडर और पीएम आवास योजना के लाभार्थियों की प्राथमिकता सूची का अनुमोदन।",
                description_mr="120 कुटुंबांसाठी जलजीवन मिशन नळ जोडणी, भूमिगत गटार टेंडर आणि प्रधानमंत्री आवास योजना लाभार्थी प्राधान्य यादीस ग्रामसभेची सर्वसंमतीने मंजुरी.",
                category="meeting",
                date=datetime.utcnow() + timedelta(days=5),
                status="upcoming",
                amount=None
            ),
            GovernanceRecord(
                panchayat_id="GP-MAHA-042",
                title="Quarterly Gram Sabha: Budget Review & Audit Presentation",
                title_hi="त्रैमासिक ग्राम सभा: बजट समीक्षा एवं सार्वजनिक अंकेक्षण (ऑडिट) प्रस्तुति",
                title_mr="त्रैमासिक ग्रामसभा: खर्च आढावा आणि सामाजिक लेखापरीक्षण (ऑडिट) सादरीकरण",
                description="Detailed presentation of ₹18.5 Lakh expenditure under the 15th Central Finance Commission and MGNREGA social audit report.",
                description_hi="15वें केंद्रीय वित्त आयोग के तहत ₹18.5 लाख के व्यय का ब्योरा एवं मनरेगा कार्यों की सामाजिक लेखापरीक्षण रिपोर्ट की समीक्षा।",
                description_mr="15 व्या केंद्रीय वित्त आयोगांतर्गत ₹18.5 लाख खर्चाचा हिशोब आणि मनरेगा कामांचे सामाजिक लेखापरीक्षण ग्रामस्थांसमोर जाहीर सादरीकरण.",
                category="meeting",
                date=datetime.utcnow() - timedelta(days=25),
                status="completed",
                amount=None
            ),
            GovernanceRecord(
                panchayat_id="GP-MAHA-042",
                title="Concrete Pavement & Stormwater Drain Construction (Ward 2 to ZP School)",
                title_hi="वार्ड नंबर 2 से प्राथमिक विद्यालय तक कंक्रीट सड़क व जल निकासी नाली निर्माण",
                title_mr="वॉर्ड क्र. 2 ते जि.प. प्राथमिक शाळा सिमेंट काँक्रीट रस्ता व बंदिस्त गटार बांधकाम",
                description="Laying 450 meters of CC road with precast covered side drains to ensure safe all-weather access for schoolchildren and rural transport.",
                description_hi="स्कूली बच्चों और ग्रामीणों की सुविधा के लिए 450 मीटर पक्की सड़क और ढकी हुई नालियों का निर्माण कार्य 65% पूर्ण।",
                description_mr="शाळकरी मुलांच्या व शेतकऱ्यांच्या सोयीसाठी 450 मीटर सिमेंट रस्ता आणि झाकलेली भूमिगत गटार बांधकाम काम 65% पूर्ण.",
                category="work",
                date=datetime.utcnow() - timedelta(days=14),
                status="ongoing",
                amount=480000.0
            ),
            GovernanceRecord(
                panchayat_id="GP-MAHA-042",
                title="Installation of 24 High-Mast Solar Streetlights in Harijan Wasti & Main Chowk",
                title_hi="हरिजन बस्ती एवं मुख्य चौक में 24 हाई-मास्ट सोलर स्ट्रीट लाइट स्थापना",
                title_mr="हरिजन वस्ती व मुख्य बाजारपेठ चौकात 24 सौर पथदिवे (सोलर लाईट) बसविणे",
                description="Erection of pole-mounted solar LED luminaires with automatic dusk-to-dawn sensors and 5-year maintenance warranty.",
                description_hi="स्वचालित सेंसर और 5 साल की वारंटी के साथ 24 सौर ऊर्जा स्ट्रीट लाइटें लगाई जा रही हैं।",
                description_mr="रात्रीच्या सुरक्षिततेसाठी स्वयंचलित सेन्सर असलेले 24 सौर पथदिवे बसविण्याचे काम यशस्वीरीत्या सुरू आहे.",
                category="work",
                date=datetime.utcnow() - timedelta(days=5),
                status="ongoing",
                amount=275000.0
            ),
            GovernanceRecord(
                panchayat_id="GP-MAHA-042",
                title="15th Finance Commission Untied Grant Allocation (FY 2025-26)",
                title_hi="15वां वित्त आयोग अबद्ध अनुदान आवंटन (वित्तीय वर्ष 2025-26)",
                title_mr="15 वा वित्त आयोग अबद्ध विकास निधी वाटप (सन 2025-26)",
                description="Central allocation sanctioned for drinking water supply, solar pumping repair, Anganwadi repair, and village digital connectivity center.",
                description_hi="पेयजल आपूर्ति, सोलर पंप मरम्मत, आंगनवाड़ी सुधार एवं ग्राम डिजिटल सेवा केंद्र के लिए स्वीकृत राशि।",
                description_mr="पिण्याचे पाणी, सौर पंप दुरुस्ती, अंगणवाडी डागडुजी आणि ग्राम डिजिटल सेवा केंद्रासाठी मंजूर झालेला केंद्रीय निधी.",
                category="fund",
                date=datetime.utcnow() - timedelta(days=35),
                status="approved",
                amount=1850000.0
            ),
            GovernanceRecord(
                panchayat_id="GP-MAHA-042",
                title="MGNREGA Community Farm Pond (Shet-Tale) Excavation Work",
                title_hi="मनरेगा सामुदायिक खेत तालाब (खेत तलाई) खुदाई निर्माण कार्य",
                title_mr="मनरेगा सामुदायिक शेततळे खोदकाम व जलसंधारण प्रकल्प",
                description="Excavation of 30x30 meter percolation farm pond providing 600 person-days of guaranteed manual employment to local farm laborers.",
                description_hi="30x30 मीटर खेत तालाब खुदाई का कार्य पूर्ण, जिससे 40 स्थानीय परिवारों को 600 मानव-दिवस का रोजगार प्राप्त हुआ।",
                description_mr="30x30 मीटर शेततळे खोदकाम पूर्ण, ज्यामधून गावातील 40 मजुरांना 600 मनुष्यदिनांचे हमी रोजगार वेतन मिळाले.",
                category="work",
                date=datetime.utcnow() - timedelta(days=40),
                status="completed",
                amount=320000.0
            )
        ]

        for g_rec in governance_records:
            db.add(g_rec)

        print("Seeding realistic citizen grievances...")
        grievances = [
            Grievance(
                tracking_id="GS-2026-10492",
                user_id=citizen1.id,
                category="water",
                description="पिण्याच्या पाण्याची पाईपलाईन मारुती मंदिरासमोर फुटली असून गेल्या दोन दिवसांपासून प्रचंड पाणी वाया जात आहे आणि वॉर्ड 2 मध्ये पाणी येत नाही.",
                description_english="Drinking water pipeline broken in front of Maruti temple for 2 days, massive water leakage and zero water supply in Ward 2.",
                status="in_progress",
                department_assigned="Rural Water Supply & Sanitation Department",
                sla_deadline=datetime.utcnow() + timedelta(days=1),
                created_at=datetime.utcnow() - timedelta(days=2),
                resolution_notes="Inspection completed by Line Fitter. Repair replacement pipe ordered."
            ),
            Grievance(
                tracking_id="GS-2026-10481",
                user_id=citizen2.id,
                category="electricity",
                description="बस स्टँड जवळील तीन पथदिवे गेल्या 8 दिवसांपासून बंद आहेत, रात्री खूप अंधार असतो आणि महिलांना ये-जा करताना भीती वाटते.",
                description_english="Three street lights near the bus stand have been non-functional for 8 days, total darkness at night making pedestrian safety a concern.",
                status="escalated",
                department_assigned="Gram Panchayat Energy Cell (MSEDCL/State Discom)",
                sla_deadline=datetime.utcnow() - timedelta(days=4), # Breached SLA
                created_at=datetime.utcnow() - timedelta(days=8),
                resolution_notes="Auto-escalated by GramSetu SLA Monitor: SLA deadline breached on 4 days ago. Discom junior engineer notified."
            ),
            Grievance(
                tracking_id="GS-2026-10512",
                user_id=citizen3.id,
                category="road",
                description="प्राथमिक आरोग्य केंद्राकडे जाणाऱ्या रस्त्यावर पावसाने मोठे खड्डे पडले असून ॲम्ब्युलन्स येणे कठीण झाले आहे.",
                description_english="Large potholes on the road leading to the Primary Health Centre making ambulance transport extremely difficult.",
                status="submitted",
                department_assigned="Public Works Department (PWD Rural Roads)",
                sla_deadline=datetime.utcnow() + timedelta(days=13),
                created_at=datetime.utcnow() - timedelta(days=2),
                resolution_notes=None
            ),
            Grievance(
                tracking_id="GS-2026-10398",
                user_id=citizen2.id,
                category="pension",
                description="वृद्धावस्था निवृत्तीवेतन खात्यात गेल्या दोन महिन्यांचे मानधन जमा झालेले नाही, बँक केवायसी आधीच पूर्ण केलेली आहे.",
                description_english="Old age pension allowance for the last two months has not been credited to bank account despite KYC completion.",
                status="resolved",
                department_assigned="Social Welfare & Women/Child Development Cell",
                sla_deadline=datetime.utcnow() - timedelta(days=10),
                created_at=datetime.utcnow() - timedelta(days=25),
                resolved_at=datetime.utcnow() - timedelta(days=12),
                resolution_notes="DBT mandate re-authenticated at district treasury. Pending arrears of ₹3,000 credited to SBI account."
            ),
            Grievance(
                tracking_id="GS-2026-10525",
                user_id=citizen1.id,
                category="sanitation",
                description="आठवडी बाजाराच्या मैदानाभोवती कचऱ्याचे ढीग साचले आहेत आणि मोकळ्या गटारीचे पाणी रस्त्यावर येत आहे, दुर्गंधी पसरली आहे.",
                description_english="Huge mounds of trash accumulated around the weekly market ground, open drain overflowing onto the street with foul smell.",
                status="in_progress",
                department_assigned="Health & Rural Sanitation Committee",
                sla_deadline=datetime.utcnow() + timedelta(days=4),
                created_at=datetime.utcnow() - timedelta(days=3),
                resolution_notes="Tractor and sanitation team dispatched for deep desilting and garbage clearance."
            )
        ]

        for gr in grievances:
            db.add(gr)

        await db.commit()
        print("Database seeded successfully with authentic demo data!")

if __name__ == "__main__":
    asyncio.run(seed_data())
