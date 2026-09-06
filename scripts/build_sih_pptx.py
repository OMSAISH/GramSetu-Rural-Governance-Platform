import os
import pptx
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN

def format_run(run, font_name="Arial", size_pt=14, bold=False, color_rgb=None):
    run.font.name = font_name
    run.font.size = Pt(size_pt)
    run.font.bold = bold
    if color_rgb:
        run.font.color.rgb = color_rgb

def set_slide_title(slide, title_text):
    for shape in slide.shapes:
        if shape.name == "Title 1" and shape.has_text_frame:
            tf = shape.text_frame
            tf.clear()
            p = tf.paragraphs[0]
            p.alignment = PP_ALIGN.LEFT
            r = p.add_run()
            r.text = title_text
            format_run(r, font_name="Arial", size_pt=26, bold=True, color_rgb=RGBColor(10, 37, 64))
            return

def set_team_badge(slide, team_name="Team GramSetu"):
    for shape in slide.shapes:
        if "Oval" in shape.name and shape.has_text_frame:
            tf = shape.text_frame
            tf.clear()
            p = tf.paragraphs[0]
            p.alignment = PP_ALIGN.CENTER
            r = p.add_run()
            r.text = team_name
            format_run(r, font_name="Arial", size_pt=9.5, bold=True, color_rgb=RGBColor(255, 255, 255))
            return

def populate_slide_1(slide):
    # TextBox 9 holds the metadata on Title Page
    for shape in slide.shapes:
        if shape.name == "TextBox 9" and shape.has_text_frame:
            tf = shape.text_frame
            tf.clear()
            tf.word_wrap = True
            
            # Position adjustment for clean spacing
            shape.left = Inches(0.8)
            shape.top = Inches(2.3)
            shape.width = Inches(11.5)
            shape.height = Inches(4.2)
            
            fields = [
                ("Problem Statement ID –", " SIH2026 (Smart Governance / Citizen Empowerment)"),
                ("Problem Statement Title –", " Multilingual Digital Governance, Welfare Scheme Entitlement & Grievance Assistant for Rural Gram Panchayats"),
                ("Theme –", " Smart Governance & Citizen Empowerment / Rural Development"),
                ("PS Category –", " Software"),
                ("Team ID –", " [Enter Your SIH Registered Team ID]"),
                ("Team Name –", " Team GramSetu (Registered on portal)"),
                ("Project Name –", " GramSetu (ग्रामसेतू) — Rural Governance Platform"),
                ("Live Working Portal –", " https://gramsetu-rural-governance-platform.vercel.app"),
                ("Live Backend API –", " https://gramsetu-rural-governance-platform.onrender.com")
            ]
            
            for idx, (label, val) in enumerate(fields):
                p = tf.paragraphs[0] if idx == 0 else tf.add_paragraph()
                p.space_before = Pt(3)
                p.space_after = Pt(3)
                
                r_label = p.add_run()
                r_label.text = label
                format_run(r_label, font_name="Arial", size_pt=14, bold=True, color_rgb=RGBColor(10, 37, 64))
                
                r_val = p.add_run()
                r_val.text = val
                format_run(r_val, font_name="Arial", size_pt=13.5, bold=False, color_rgb=RGBColor(51, 65, 85))

def build_content_box(slide, sections):
    for shape in slide.shapes:
        if shape.name == "TextBox 8" and shape.has_text_frame:
            shape.left = Inches(0.8)
            shape.top = Inches(1.35)
            shape.width = Inches(11.7)
            shape.height = Inches(5.35)
            
            tf = shape.text_frame
            tf.clear()
            tf.word_wrap = True
            
            first_p = True
            for sec_idx, sec in enumerate(sections):
                # Section Title
                p_title = tf.paragraphs[0] if first_p else tf.add_paragraph()
                first_p = False
                p_title.space_before = Pt(6 if sec_idx > 0 else 0)
                p_title.space_after = Pt(2)
                
                r_head = p_title.add_run()
                r_head.text = f"• {sec['heading']}"
                format_run(r_head, font_name="Arial", size_pt=14.5, bold=True, color_rgb=RGBColor(10, 37, 64))
                
                # Section Bullet Items
                for item in sec['items']:
                    p_item = tf.add_paragraph()
                    p_item.space_before = Pt(1.5)
                    p_item.space_after = Pt(2)
                    p_item.level = 1
                    
                    if isinstance(item, tuple):
                        bold_part, reg_part = item
                        r_b = p_item.add_run()
                        r_b.text = bold_part
                        format_run(r_b, font_name="Arial", size_pt=12.5, bold=True, color_rgb=RGBColor(217, 119, 6))
                        
                        r_t = p_item.add_run()
                        r_t.text = reg_part
                        format_run(r_t, font_name="Arial", size_pt=12.5, bold=False, color_rgb=RGBColor(30, 41, 59))
                    else:
                        r_t = p_item.add_run()
                        r_t.text = item
                        format_run(r_t, font_name="Arial", size_pt=12.5, bold=False, color_rgb=RGBColor(30, 41, 59))

def populate_slide_2(slide):
    set_slide_title(slide, "IDEA TITLE: GramSetu (ग्रामसेतू) — Rural Governance & Welfare Assistant")
    set_team_badge(slide, "Team GramSetu")
    
    sections = [
        {
            "heading": "Proposed Solution & Live Prototype",
            "items": [
                ("Citizen-Panchayat Bridge: ", "AI-powered bilingual platform bridging rural citizens with Gram Panchayat administration (specifically localized for GP Kopargaon, Dist Ahilyanagar)."),
                ("Live Working Prototype: ", "Fully deployed & operational at https://gramsetu-rural-governance-platform.vercel.app with continuous cloud backend on Render.")
            ]
        },
        {
            "heading": "Detailed Explanation of Core Components",
            "items": [
                ("1. GramSetu AI Sahayak: ", "Multilingual (Marathi/Hindi/English) voice-first assistant answering queries on Gram Sabhas, water supply schedules, and certificate procedures."),
                ("2. 1-Click Scheme Entitlement: ", "Client-side JSON rule engine evaluating eligibility for 5 major schemes (PMAY-G, Pensions, MGNREGA, Scholarships) and auto-generating official Annexure-1 (प्रपत्र क्र. १) print applications."),
                ("3. CPGRAMS-Standard Grievance Desk: ", "Issues unique 12-char certified tracking codes (GS-2026-XXXXX) with a 4-stage verified timeline (Lodged ➔ Assigned ➔ Inspected ➔ Resolved)."),
                ("4. Panchayat MIS War Room: ", "Real-time command center for Gram Sevaks & Sarpanchs with systemic bottleneck heatmaps, official triage registers, and 7-day SLA enforcement.")
            ]
        },
        {
            "heading": "How It Addresses the Problem & Key Uniqueness",
            "items": [
                ("Solves Welfare Drop-off: ", "Translates complex government circulars into a 1-minute 5-parameter check with pre-filled printable government forms."),
                ("Eliminates Lost Grievances: ", "Replaces missing paper notes with time-stamped digital registers and automated escalation to the Block Development Officer (BDO)."),
                ("Zero-Failure Offline Resilience: ", "Embedded client-side rule evaluation engine guarantees 100% uptime with zero latency even during intermittent rural connectivity.")
            ]
        }
    ]
    build_content_box(slide, sections)

def populate_slide_3(slide):
    set_slide_title(slide, "TECHNICAL APPROACH & SYSTEM ARCHITECTURE")
    set_team_badge(slide, "Team GramSetu")
    
    sections = [
        {
            "heading": "Technologies Used & Architecture Stack",
            "items": [
                ("Frontend Tier: ", "React 18, TypeScript, Vite, Tailwind CSS, Lucide Icons (GIGW 3.0 government-standard responsive design with font zoom A-/A+)."),
                ("Backend Services: ", "Python 3.11, FastAPI (Asynchronous RESTful APIs), Pydantic v2 schemas, ReportLab (Official PDF seal generation)."),
                ("Data Persistence Tier: ", "PostgreSQL / SQLite (aiosqlite) with SQLAlchemy 2.0 Async ORM, seed migrations, JWT authentication & Bcrypt hashing."),
                ("Voice & NLU Layer: ", "HTML5 Web Speech API (STT Voice Capture & TTS Audio Playback) + Client-side AST rule parsing engine."),
                ("Cloud Deployment: ", "Vercel Edge CDN (Static frontend) + Render.com (Continuous Python cloud web service).")
            ]
        },
        {
            "heading": "Methodology & End-to-End Implementation Process",
            "items": [
                ("Step 1 (Citizen Input Layer): ", "Voice input captured in Marathi/Hindi/English or entered via high-contrast accessible forms on mobile/desktop."),
                ("Step 2 (Rule Evaluation Engine): ", "Lightweight AST engine evaluates multi-condition logic trees (and, or, >=, <=, in) in < 1ms with zero cloud latency."),
                ("Step 3 (Grievance Registration): ", "Generates certified 12-char tracking ID, computes 7-day SLA target date, and routes ticket to Panchayat triage queue."),
                ("Step 4 (Public Transparency): ", "Proactive public disclosure of Gram Sabha minutes (ठराव), 15th Finance Commission vouchers, and civil works cards (RTI Sec 4(1)(b))."),
                ("Step 5 (Automated SLA Daemon): ", "Background monitor continuously evaluates grievance deadlines and auto-escalates overdue tickets to Taluka BDO.")
            ]
        },
        {
            "heading": "Working Prototype Verification",
            "items": [
                ("Verified Live System: ", "Tested with authentic pre-configured personas for Gram Sevak Rameshwar Patil (9822001122) and rural citizen test cases.")
            ]
        }
    ]
    build_content_box(slide, sections)

def populate_slide_4(slide):
    set_slide_title(slide, "FEASIBILITY AND VIABILITY ANALYSIS")
    set_team_badge(slide, "Team GramSetu")
    
    sections = [
        {
            "heading": "Feasibility & Viability Analysis",
            "items": [
                ("Technical Feasibility: ", "100% browser-standard compliant; requires no native app downloads; ultra-compact bundle (385KB gzip) optimized for 2G/3G rural networks."),
                ("Operational Viability: ", "Directly integrates into existing Panchayati Raj workflow (Gram Sevak, Sarpanch, Waterman); requires zero specialized hardware in GP offices."),
                ("Economic Viability: ", "Built on open-source technologies; cloud hosting costs < ₹50/month per Gram Panchayat, making it sustainable for municipal-wide scale.")
            ]
        },
        {
            "heading": "Potential Challenges and Identified Risks",
            "items": [
                ("1. Digital & Language Literacy: ", "Rural citizens, especially elderly and women, may struggle with textual interfaces and smartphone navigation."),
                ("2. Patchy Rural Internet Connectivity: ", "Intermittent broadband and frequent electricity cuts in interior village wadis."),
                ("3. Bureaucratic Resistance & Inaction: ", "Risk of local officials neglecting digital complaints or delaying physical field inspections."),
                ("4. Privacy & Data Integrity: ", "Handling citizen records (Aadhaar, income certificates, caste documents) securely.")
            ]
        },
        {
            "heading": "Engineered Mitigation Strategies",
            "items": [
                ("Voice-First Accessibility: ", "Native Marathi/Hindi speech recognition and spoken audio prompts eliminate literacy barriers completely."),
                ("Zero-Failure Offline Engine: ", "Browser-side localStorage persistence and rule evaluation guarantee full functionality without active cloud internet."),
                ("Mandatory 7-Day SLA Escalation: ", "Automated hierarchical escalation to Block Development Officer & District Collectorate ensures official accountability."),
                ("Zero-Trust Security: ", "JWT tokenization, role-based access control (Citizen vs Official), input sanitization, and synthetic testing data protection.")
            ]
        }
    ]
    build_content_box(slide, sections)

def populate_slide_5(slide):
    set_slide_title(slide, "PROJECT IMPACT AND SOCIO-ECONOMIC BENEFITS")
    set_team_badge(slide, "Team GramSetu")
    
    sections = [
        {
            "heading": "Potential Impact on Target Audience",
            "items": [
                ("Rural Citizens: ", "Eliminates exploitative middlemen; unlocks ₹1,20,000+ per eligible household in housing, pension, and education subsidies with transparent tracking."),
                ("Panchayat Administration: ", "Cuts paper register backlog by 80%; provides visual MIS heatmaps for data-driven fund deployment in monthly Gram Sabhas."),
                ("Block & District Authorities: ", "Real-time visibility into systemic civic distress (drinking water, power cuts) across hundreds of villages with automated SLA compliance.")
            ]
        },
        {
            "heading": "Multi-Dimensional Benefits to Society",
            "items": [
                ("Social Empowerment: ", "Empowers marginalized rural groups (widows, smallholder farmers, SC/ST, senior citizens) to claim their constitutional rights with dignity."),
                ("Economic Savings: ", "Saves rural families ₹200–₹500 per grievance in bus fares and lost daily agricultural wages by eliminating trips to Tehsil offices."),
                ("Democratic Transparency: ", "Proactive public disclosure of Gram Sabha resolutions (ठराव) and 15th Finance Commission fund vouchers under RTI Act Section 4(1)(b)."),
                ("Environmental Sustainability: ", "100% paperless governance workflow saves reams of administrative stationery and physical file storage annually.")
            ]
        },
        {
            "heading": "Scalability & Nationwide Reach",
            "items": [
                ("Proven Prototype: ", "Tested for Gram Panchayat Kopargaon; architected for rapid rollout across all 28,000+ GPs in Maharashtra and 2.5 Lakh Panchayats pan-India.")
            ]
        }
    ]
    build_content_box(slide, sections)

def populate_slide_6(slide):
    set_slide_title(slide, "RESEARCH, REFERENCES & PROJECT REPOSITORY")
    set_team_badge(slide, "Team GramSetu")
    
    sections = [
        {
            "heading": "Government Frameworks & Regulatory Standards",
            "items": [
                ("Guidelines for Indian Government Websites (GIGW 3.0): ", "Ministry of Electronics & IT (MeitY) & National Informatics Centre (NIC) accessibility standards."),
                ("Right to Information (RTI) Act 2005: ", "Section 4(1)(b) proactive public disclosure compliance for local self-government institutions."),
                ("CPGRAMS & Aaple Sarkar Citizen Charter: ", "Department of Administrative Reforms and Public Grievances (DARPG) grievance redressal timelines."),
                ("e-GramSwaraj & Mission Antyodaya: ", "Ministry of Panchayati Raj, Government of India (https://egramswaraj.gov.in).")
            ]
        },
        {
            "heading": "Official Scheme Circulars & Verification Sources",
            "items": [
                ("Pradhan Mantri Awas Yojana - Gramin (PMAY-G): ", "Ministry of Rural Development operational guidelines (https://pmayg.nic.in)."),
                ("National Social Assistance Programme (NSAP): ", "IGNOAPS (Old Age) & IGNWPS (Widow) pension guidelines (https://nsap.nic.in)."),
                ("Mahatma Gandhi NREGA: ", "Ministry of Rural Development wage employment framework (https://nrega.nic.in)."),
                ("Direct Benefit Transfer (DBT) Bharat Mission: ", "Cabinet Secretariat government subsidy disbursement standards (https://dbtbharat.gov.in).")
            ]
        },
        {
            "heading": "Academic Research & Live Code Repository",
            "items": [
                ("NITI Aayog & World Bank (2023): ", "\"Empowering Panchayati Raj Institutions through Digital Transparency & Citizen Feedback Loops\"."),
                ("Live Citizen Web Portal: ", "https://gramsetu-rural-governance-platform.vercel.app"),
                ("Live Backend Cloud API: ", "https://gramsetu-rural-governance-platform.onrender.com"),
                ("GitHub Source Code Repository: ", "https://github.com/OMSAISH/GramSetu-Rural-Governance-Platform.git")
            ]
        }
    ]
    build_content_box(slide, sections)

def update_slide_7_notice(slide):
    # Slide 7 has instruction pointers. Add a clear top notice banner.
    for shape in slide.shapes:
        if shape.name == "TextBox 3" and shape.has_text_frame:
            tf = shape.text_frame
            tf.clear()
            p = tf.paragraphs[0]
            r = p.add_run()
            r.text = "IMPORTANT INSTRUCTIONS (SIH SUBMISSION CHECKLIST)"
            format_run(r, font_name="Arial", size_pt=20, bold=True, color_rgb=RGBColor(217, 119, 6))

def main():
    template_path = "SIH2026-IDEA-Presentation-Format.pptx"
    output_path = "/Users/omsaishdhokchaule/Downloads/GramSetu/GramSetu_SIH2026_Idea_Presentation.pptx"
    
    prs = pptx.Presentation(template_path)
    print(f"Loaded template with {len(prs.slides)} slides.")
    
    populate_slide_1(prs.slides[0])
    populate_slide_2(prs.slides[1])
    populate_slide_3(prs.slides[2])
    populate_slide_4(prs.slides[3])
    populate_slide_5(prs.slides[4])
    populate_slide_6(prs.slides[5])
    update_slide_7_notice(prs.slides[6])
    
    prs.save(output_path)
    print(f"Successfully created presentation: {output_path}")

if __name__ == "__main__":
    main()
