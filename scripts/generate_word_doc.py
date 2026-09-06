import os
import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import nsdecls, qn

def set_cell_background(cell, fill_hex):
    tcPr = cell._tc.get_or_add_tcPr()
    tcPr.append(parse_xml(f'<w:shd {nsdecls("w")} w:fill="{fill_hex}"/>'))

def set_cell_margins(cell, top=140, bottom=140, left=180, right=180):
    tcPr = cell._tc.get_or_add_tcPr()
    tcMar = OxmlElement('w:tcMar')
    for m, val in [('w:top', top), ('w:bottom', bottom), ('w:left', left), ('w:right', right)]:
        node = OxmlElement(m)
        node.set(qn('w:w'), str(val))
        node.set(qn('w:type'), 'dxa')
        tcMar.append(node)
    tcPr.append(tcMar)

def add_callout(doc, text_paragraphs, title="NOTE", border_color="0A2540", bg_color="F1F5F9"):
    table = doc.add_table(rows=1, cols=1)
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    table.autofit = False
    
    cell = table.cell(0, 0)
    cell.width = Inches(6.5)
    set_cell_background(cell, bg_color)
    set_cell_margins(cell, top=160, bottom=160, left=200, right=200)
    
    tcPr = cell._tc.get_or_add_tcPr()
    borders = parse_xml(
        f'<w:tcBorders {nsdecls("w")}>'
        f'<w:top w:val="none"/>'
        f'<w:left w:val="single" w:sz="24" w:space="0" w:color="{border_color}"/>'
        f'<w:bottom w:val="none"/>'
        f'<w:right w:val="none"/>'
        f'</w:tcBorders>'
    )
    tcPr.append(borders)
    
    p = cell.paragraphs[0]
    p.paragraph_format.space_before = Pt(2)
    p.paragraph_format.space_after = Pt(4)
    run_title = p.add_run(f"[{title}] ")
    run_title.bold = True
    run_title.font.name = "Calibri"
    run_title.font.size = Pt(10.5)
    run_title.font.color.rgb = RGBColor(10, 37, 64)
    
    if isinstance(text_paragraphs, str):
        text_paragraphs = [text_paragraphs]
        
    for i, t in enumerate(text_paragraphs):
        if i > 0:
            p = cell.add_paragraph()
            p.paragraph_format.space_before = Pt(2)
            p.paragraph_format.space_after = Pt(4)
        run_t = p.add_run(t)
        run_t.font.name = "Calibri"
        run_t.font.size = Pt(10)
        run_t.font.color.rgb = RGBColor(51, 65, 85)

def style_table(table, header_bg="0A2540", header_color=RGBColor(255, 255, 255), alt_bg="F8FAFC"):
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    for i, row in enumerate(table.rows):
        trPr = row._tr.get_or_add_trPr()
        trPr.append(parse_xml(f'<w:cantSplit {nsdecls("w")}/>'))
        
        if i == 0:
            trPr.append(parse_xml(f'<w:tblHeader {nsdecls("w")}/>'))
            for cell in row.cells:
                set_cell_background(cell, header_bg)
                set_cell_margins(cell, top=140, bottom=140, left=160, right=160)
                for p in cell.paragraphs:
                    p.paragraph_format.space_before = Pt(2)
                    p.paragraph_format.space_after = Pt(2)
                    for r in p.runs:
                        r.bold = True
                        r.font.name = "Calibri"
                        r.font.size = Pt(10)
                        r.font.color.rgb = header_color
        else:
            bg = alt_bg if i % 2 == 1 else "FFFFFF"
            for cell in row.cells:
                set_cell_background(cell, bg)
                set_cell_margins(cell, top=120, bottom=120, left=160, right=160)
                for p in cell.paragraphs:
                    p.paragraph_format.space_before = Pt(2)
                    p.paragraph_format.space_after = Pt(2)
                    for r in p.runs:
                        r.font.name = "Calibri"
                        r.font.size = Pt(9.5)
                        r.font.color.rgb = RGBColor(30, 41, 59)

def build_gramsetu_document(output_path):
    doc = docx.Document()
    
    sections = doc.sections
    for section in sections:
        section.top_margin = Inches(1.0)
        section.bottom_margin = Inches(1.0)
        section.left_margin = Inches(1.0)
        section.right_margin = Inches(1.0)
        
    normal_style = doc.styles['Normal']
    normal_style.font.name = 'Calibri'
    normal_style.font.size = Pt(11)
    normal_style.font.color.rgb = RGBColor(30, 41, 59)
    
    title_p = doc.add_paragraph()
    title_p.paragraph_format.space_before = Pt(0)
    title_p.paragraph_format.space_after = Pt(4)
    run_title = title_p.add_run("GramSetu (ग्रामसेतू)")
    run_title.font.name = "Arial"
    run_title.font.size = Pt(24)
    run_title.bold = True
    run_title.font.color.rgb = RGBColor(10, 37, 64)
    
    subtitle_p = doc.add_paragraph()
    subtitle_p.paragraph_format.space_before = Pt(0)
    subtitle_p.paragraph_format.space_after = Pt(12)
    run_sub = subtitle_p.add_run("Complete Project Overview & System Guide\nMultilingual Gram Panchayat Governance, Welfare Scheme Entitlement & Grievance Assistant")
    run_sub.font.name = "Calibri"
    run_sub.font.size = Pt(13)
    run_sub.bold = True
    run_sub.font.color.rgb = RGBColor(217, 119, 6)
    
    meta_table = doc.add_table(rows=8, cols=2)
    meta_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    meta_data = [
        ("Team Name & ID:", "SankalpX (SIH 2026)"),
        ("Team Members:", "More Sanjivani, Deshmukh Anushka, Thorat Saujanya, Nehe Dhanshri, Khurud Tanushri, Dhokchaule Omsaish"),
        ("Live Citizen Portal (Vercel):", "https://gramsetu-rural-governance-platform.vercel.app"),
        ("Live Cloud Backend API (Render):", "https://gramsetu-rural-governance-platform.onrender.com"),
        ("GitHub Source Repository:", "https://github.com/OMSAISH/GramSetu-Rural-Governance-Platform.git"),
        ("Target Jurisdiction:", "Gram Panchayat Kopargaon, Taluka: Kopargaon, Dist: Ahilyanagar (Maharashtra)"),
        ("Regulatory Compliance:", "Guidelines for Indian Government Websites (GIGW 3.0), Digital India & RTI Section 4(1)(b)"),
        ("Version & Architecture:", "v1.0 Production Release | Decoupled React 18 + FastAPI + SQLite/Postgres")
    ]
    for row_idx, (k, v) in enumerate(meta_data):
        c0 = meta_table.cell(row_idx, 0)
        c1 = meta_table.cell(row_idx, 1)
        c0.width = Inches(2.2)
        c1.width = Inches(4.3)
        set_cell_background(c0, "F1F5F9")
        set_cell_background(c1, "FFFFFF")
        set_cell_margins(c0, 60, 60, 100, 100)
        set_cell_margins(c1, 60, 60, 100, 100)
        
        p0 = c0.paragraphs[0]
        p0.paragraph_format.space_before = Pt(1)
        p0.paragraph_format.space_after = Pt(1)
        r0 = p0.add_run(k)
        r0.bold = True
        r0.font.size = Pt(9.5)
        r0.font.color.rgb = RGBColor(10, 37, 64)
        
        p1 = c1.paragraphs[0]
        p1.paragraph_format.space_before = Pt(1)
        p1.paragraph_format.space_after = Pt(1)
        r1 = p1.add_run(v)
        r1.font.size = Pt(9.5)
        r1.font.color.rgb = RGBColor(51, 65, 85)
        
    doc.add_paragraph().paragraph_format.space_after = Pt(8)
    
    # 1. Executive Summary
    h1 = doc.add_heading(level=1)
    r = h1.add_run("1. Executive Summary")
    r.font.name = "Arial"
    r.font.color.rgb = RGBColor(10, 37, 64)
    h1.paragraph_format.space_before = Pt(16)
    h1.paragraph_format.space_after = Pt(6)
    
    p = doc.add_paragraph(
        "GramSetu (ग्रामसेतू — \"Bridge to the Village\") is a state-of-the-art, multilingual e-Governance and Civic Tech "
        "platform purpose-built for rural Indian Gram Panchayats. In India's three-tier Panchayati Raj system, the Gram Panchayat "
        "is the primary constitutional body responsible for local public welfare, village infrastructure, and social justice. "
        "However, millions of rural citizens remain disconnected from their constitutional rights due to language barriers, low "
        "digital literacy, complex paperwork, and physical distance from administrative offices."
    )
    p.paragraph_format.line_spacing = 1.15
    p.paragraph_format.space_after = Pt(6)
    
    p = doc.add_paragraph(
        "GramSetu establishes a unified digital bridge connecting citizens and local administrators across two distinct interfaces:"
    )
    p.paragraph_format.line_spacing = 1.15
    p.paragraph_format.space_after = Pt(4)
    
    bp1 = doc.add_paragraph(style='List Bullet')
    r = bp1.add_run("Citizen Facing Portal: ")
    r.bold = True
    bp1.add_run(
        "A bilingual (Marathi, Hindi, English), voice-enabled web application providing instant welfare scheme eligibility checks, "
        "auto-filling official Annexure-1 applications, registering complaints with 12-character tracking IDs, and accessing proactive "
        "RTI Section 4(1)(b) public registers."
    )
    bp1.paragraph_format.space_after = Pt(3)
    
    bp2 = doc.add_paragraph(style='List Bullet')
    r = bp2.add_run("Panchayat Administrative MIS War Room: ")
    r.bold = True
    bp2.add_run(
        "A command center for Gram Sevaks, Sarpanchs, and Block Development Officers to triage civic grievances, analyze department "
        "bottlenecks through visual heatmaps, update resolution progress, and enforce strict 7-day Service Level Agreements (SLAs)."
    )
    bp2.paragraph_format.space_after = Pt(10)
    
    add_callout(
        doc,
        "The system is hyper-localized for Gram Panchayat Kopargaon (Taluka Kopargaon, District Ahilyanagar), "
        "featuring authentic local administrative terminology, ward allocations, Gram Sabha notices, and official government seals.",
        title="LOCALIZATION FOCUS"
    )
    
    # 2. Why Are We Developing It?
    h1 = doc.add_heading(level=1)
    r = h1.add_run("2. The Problem Statement & Motivation (Why GramSetu?)")
    r.font.name = "Arial"
    r.font.color.rgb = RGBColor(10, 37, 64)
    h1.paragraph_format.space_before = Pt(18)
    h1.paragraph_format.space_after = Pt(6)
    
    p = doc.add_paragraph(
        "Across India's 250,000+ Gram Panchayats, grassroots governance encounters four deep systemic bottlenecks that "
        "severely hinder citizen empowerment and administrative efficiency:"
    )
    p.paragraph_format.line_spacing = 1.15
    p.paragraph_format.space_after = Pt(8)
    
    p_table = doc.add_table(rows=5, cols=3)
    p_table.cell(0, 0).paragraphs[0].add_run("Core Pain Point in Rural India")
    p_table.cell(0, 1).paragraphs[0].add_run("Impact on Citizens & Officials")
    p_table.cell(0, 2).paragraphs[0].add_run("GramSetu Engineering Solution")
    
    data_points = [
        (
            "1. Welfare Scheme Exclusion & Drop-Off",
            "Eligible rural poor (widows, smallholder farmers, SC/ST students) miss life-changing schemes like PMAY-G (₹1.2 Lakh housing aid) or Old Age Pensions because eligibility rules are buried in complex government circulars.",
            "AST-based JSON Rule Engine that evaluates 5 simple profile parameters in < 1ms, identifies qualifying schemes, and auto-generates official Annexure-1 (प्रपत्र क्र. १) printable applications."
        ),
        (
            "2. Lost Complaints & Lack of Accountability",
            "Grievances submitted on paper notes get lost on desks with no formal acknowledgment, no tracking ID, and no time-bound consequence for administrative inaction.",
            "CPGRAMS/Aaple Sarkar-standard digital register issuing 12-character certified IDs (GS-2026-XXXXX), 4-stage live status tracking, and 7-day automated SLA escalation to the Block Development Officer (BDO)."
        ),
        (
            "3. Information Asymmetry & Opacity in Works",
            "Citizens rarely know when Gram Sabhas occur, what resolutions were passed, or how 15th Finance Commission funds were disbursed to contractors.",
            "Open Governance Register compliant with RTI Act Section 4(1)(b) proactive disclosure norms, showcasing audited fund vouchers, civil works progress cards, and printable certified resolutions."
        ),
        (
            "4. Language, Literacy & Connectivity Barriers",
            "Central government portals are built primarily in English with complex desktop drop-downs, excluding rural citizens who prefer regional dialects (Marathi/Hindi) and suffer from patchy 2G/3G connectivity.",
            "Voice-first Web Speech integration, GIGW 3.0 accessibility compliant design with font scaling (A-/A+), and an embedded zero-failure client-side engine that works smoothly even offline."
        )
    ]
    
    for row_idx, (c1, c2, c3) in enumerate(data_points, start=1):
        p_table.cell(row_idx, 0).paragraphs[0].add_run(c1).bold = True
        p_table.cell(row_idx, 1).paragraphs[0].add_run(c2)
        p_table.cell(row_idx, 2).paragraphs[0].add_run(c3)
        
    p_table.columns[0].width = Inches(2.0)
    p_table.columns[1].width = Inches(2.2)
    p_table.columns[2].width = Inches(2.3)
    style_table(p_table)
    
    doc.add_paragraph().paragraph_format.space_after = Pt(8)
    
    # 3. System Architecture & Tech Stack
    h1 = doc.add_heading(level=1)
    r = h1.add_run("3. System Architecture & Technical Specifications")
    r.font.name = "Arial"
    r.font.color.rgb = RGBColor(10, 37, 64)
    h1.paragraph_format.space_before = Pt(18)
    h1.paragraph_format.space_after = Pt(6)
    
    p = doc.add_paragraph(
        "GramSetu is engineered using a resilient, decoupled full-stack architecture featuring a hybrid zero-failure fallback "
        "that guarantees 100% operational uptime regardless of cloud server states or connectivity disruptions:"
    )
    p.paragraph_format.line_spacing = 1.15
    p.paragraph_format.space_after = Pt(8)
    
    tech_table = doc.add_table(rows=6, cols=3)
    tech_table.cell(0, 0).paragraphs[0].add_run("Component")
    tech_table.cell(0, 1).paragraphs[0].add_run("Technologies Used")
    tech_table.cell(0, 2).paragraphs[0].add_run("Key Architectural Responsibilities")
    
    tech_data = [
        ("Frontend Tier", "React 18, TypeScript, Vite, Tailwind CSS, Lucide Icons", "GIGW 3.0 compliant UI, state management, client-side NLU intent parsing, Web Speech voice capture, and print-ready Annexures."),
        ("Backend Services Tier", "Python 3.11, FastAPI, Pydantic v2, Uvicorn, ReportLab", "Asynchronous RESTful APIs, JWT authentication, automated SLA monitor daemons, and programmatic PDF seal generation."),
        ("Data Persistence Tier", "PostgreSQL / SQLite, SQLAlchemy 2.0 (Async), Alembic", "Async relational data model, seed data for users, welfare schemes, governance records, and persistent grievance logs."),
        ("Zero-Downtime Engine", "TypeScript AST Rule Evaluator in api.ts", "Evaluates multi-condition logic trees (and, or, >=, <=, in) directly in the browser when the cloud backend is in sleep mode."),
        ("Deployment Infrastructure", "Vercel (Edge CDN) + Render.com (Continuous Web Service)", "Global edge distribution for the static frontend coupled with continuous containerized execution for the FastAPI backend.")
    ]
    
    for row_idx, (c1, c2, c3) in enumerate(tech_data, start=1):
        tech_table.cell(row_idx, 0).paragraphs[0].add_run(c1).bold = True
        tech_table.cell(row_idx, 1).paragraphs[0].add_run(c2)
        tech_table.cell(row_idx, 2).paragraphs[0].add_run(c3)
        
    tech_table.columns[0].width = Inches(1.8)
    tech_table.columns[1].width = Inches(2.2)
    tech_table.columns[2].width = Inches(2.5)
    style_table(tech_table)
    
    doc.add_paragraph().paragraph_format.space_after = Pt(8)
    
    # 4. Citizen Workflows
    h1 = doc.add_heading(level=1)
    r = h1.add_run("4. Citizen / User Workflows (Step-by-Step Guide)")
    r.font.name = "Arial"
    r.font.color.rgb = RGBColor(10, 37, 64)
    h1.paragraph_format.space_before = Pt(18)
    h1.paragraph_format.space_after = Pt(6)
    
    p = doc.add_paragraph(
        "A citizen visiting the portal has immediate access to four foundational governance services without requiring "
        "complex paperwork or prior technical training:"
    )
    p.paragraph_format.line_spacing = 1.15
    p.paragraph_format.space_after = Pt(6)
    
    h2 = doc.add_heading(level=2)
    h2.add_run("4.1 GramSetu AI Sahayak (Multilingual Voice & Text Assistant)").font.color.rgb = RGBColor(10, 37, 64)
    p = doc.add_paragraph(
        "Citizens can ask natural language questions in Marathi, Hindi, or English regarding Gram Panchayat administration, "
        "such as drinking water timings, Gram Sabha dates, death/birth certificates, or property tax assessments. "
        "By tapping the microphone icon, low-literacy users can speak directly in Marathi (e.g. \"पुढील ग्रामसभा कधी आहे?\") "
        "and receive verified official guidelines instantly."
    )
    p.paragraph_format.line_spacing = 1.15
    p.paragraph_format.space_after = Pt(6)
    
    h2 = doc.add_heading(level=2)
    h2.add_run("4.2 Welfare Scheme Entitlement & 1-Click Application Generator").font.color.rgb = RGBColor(10, 37, 64)
    p = doc.add_paragraph(
        "Citizens enter 5 basic household parameters: Age, Annual Income, Landholding, Caste Category, and Occupation. "
        "The generic rule engine evaluates their profile against 5 major welfare schemes:"
    )
    p.paragraph_format.line_spacing = 1.15
    p.paragraph_format.space_after = Pt(4)
    
    schemes_list = [
        ("PMAY-G (घरकुल योजना): ", "₹1,20,000 direct financial grant for pucca house construction with toilet and electricity."),
        ("IGNOAPS (वृद्धावस्था निवृत्तीवेतन): ", "Monthly pension for BPL senior citizens aged 60 and above."),
        ("IGNWPS (विधवा निवृत्तीवेतन): ", "₹1,200 monthly pension for rural widows without family financial support."),
        ("MGNREGA (मनरेगा जॉब कार्ड): ", "100 days of legally guaranteed wage employment per financial year for rural adults."),
        ("Post-Matric Scholarship (शिष्यवृत्ती): ", "100% tuition reimbursement and maintenance allowance for SC/ST/OBC college students.")
    ]
    for s_title, s_desc in schemes_list:
        sp = doc.add_paragraph(style='List Bullet')
        sp.add_run(s_title).bold = True
        sp.add_run(s_desc)
        sp.paragraph_format.space_after = Pt(2)
        
    p = doc.add_paragraph(
        "Upon qualifying, the citizen clicks \"Generate Application Form\" to produce an official Annexure-1 (प्रपत्र क्र. १) "
        "pre-filled with their details, complete with the Gram Panchayat Kopargaon header, applicant photo box, and Gram Sevak signature stamp."
    )
    p.paragraph_format.line_spacing = 1.15
    p.paragraph_format.space_after = Pt(6)
    
    h2 = doc.add_heading(level=2)
    h2.add_run("4.3 Grievance Registration & 4-Stage Live Tracking").font.color.rgb = RGBColor(10, 37, 64)
    p = doc.add_paragraph(
        "Citizens register civic complaints (e.g. broken handpump, road pothole, irregular water valve) via voice or text. "
        "The system assigns a priority (Low, Medium, High, Emergency) and generates a certified tracking code (e.g. GS-2026-83491). "
        "Citizens can track their complaint along a transparent 4-stage verification timeline:"
    )
    p.paragraph_format.line_spacing = 1.15
    p.paragraph_format.space_after = Pt(4)
    
    steps = [
        ("Stage 1: Lodged & Categorized — ", "Complaint received in Panchayat register and routed to the concerned department."),
        ("Stage 2: Field Officer Assigned — ", "Designated officer (Junior Engineer / Waterman) notified with SLA deadline."),
        ("Stage 3: Physical Site Inspection — ", "On-site inspection conducted with photographic evidence and material procurement."),
        ("Stage 4: Certified & Closed — ", "Work completed, verified by Gram Sevak, and resolution certificate issued.")
    ]
    for st, sd in steps:
        stp = doc.add_paragraph(style='List Bullet')
        stp.add_run(st).bold = True
        stp.add_run(sd)
        stp.paragraph_format.space_after = Pt(2)
        
    p = doc.add_paragraph().paragraph_format.space_after = Pt(6)
    
    h2 = doc.add_heading(level=2)
    h2.add_run("4.4 Public Governance Register & RTI Section 4(1)(b) Disclosures").font.color.rgb = RGBColor(10, 37, 64)
    p = doc.add_paragraph(
        "Ensures total public transparency by displaying audited minutes of Gram Sabha meetings (ठराव क्र. GS/2025/XX), "
        "15th Finance Commission fund vouchers, and civil infrastructure cards with completion percentages and assigned contractors. "
        "Citizens can download or print certified government resolution orders with one click."
    )
    p.paragraph_format.line_spacing = 1.15
    p.paragraph_format.space_after = Pt(10)
    
    # 5. Administrative Workflows
    h1 = doc.add_heading(level=1)
    r = h1.add_run("5. Administrative / Official Workflows (Panchayat War Room)")
    r.font.name = "Arial"
    r.font.color.rgb = RGBColor(10, 37, 64)
    h1.paragraph_format.space_before = Pt(18)
    h1.paragraph_format.space_after = Pt(6)
    
    p = doc.add_paragraph(
        "Panchayat officials (Gram Sevak Rameshwar Patil, Sarpanch, Junior Engineer) access a specialized administrative "
        "MIS War Room by logging in with official credentials (Phone: 9822001122 | Password: Official@123):"
    )
    p.paragraph_format.line_spacing = 1.15
    p.paragraph_format.space_after = Pt(6)
    
    adm_points = [
        ("High-Command MIS Dashboard: ", "Monitors four real-time KPI counters: Total Grievances Lodged, Resolution Rate (%), Average Turnaround Time in days, and Active Overdue SLA Breaches."),
        ("Systemic Bottleneck Heatmap: ", "Categorizes citizen distress across Drinking Water, Street Lighting, Drainage & Roads, and Sanitation, enabling data-driven budget allocations during monthly Gram Sabhas."),
        ("Official Triage Register (प्रपत्र 'ब'): ", "Allows officers to transition grievance statuses (Submitted ➔ In Progress ➔ Resolved ➔ Escalated), assign field personnel, and log official inspection remarks."),
        ("Automated SLA Escalation Engine: ", "Enforces a mandatory 7-day citizen charter guarantee (3 days for emergency water/health). If unaddressed, grievances automatically escalate to the Block Development Officer (BDO) and District Collectorate.")
    ]
    for at, ad in adm_points:
        ap = doc.add_paragraph(style='List Bullet')
        ap.add_run(at).bold = True
        ap.add_run(ad)
        ap.paragraph_format.space_after = Pt(4)
        
    doc.add_paragraph().paragraph_format.space_after = Pt(8)
    
    # 6. Key Innovations
    h1 = doc.add_heading(level=1)
    r = h1.add_run("6. Key Innovations & Differentiators")
    r.font.name = "Arial"
    r.font.color.rgb = RGBColor(10, 37, 64)
    h1.paragraph_format.space_before = Pt(18)
    h1.paragraph_format.space_after = Pt(6)
    
    innovations = [
        ("GIGW 3.0 & Digital India Compliant UI", "Designed strictly in adherence with the Guidelines for Indian Government Websites (GIGW 3.0), featuring the national tricolor banner, Ashoka Lion emblem (सत्यमेव जयते), high-contrast accessibility toggles, and font scaling (A-, A, A+)."),
        ("Zero-Failure Client-Side Fallback Engine", "Unlike traditional web applications that crash when the server sleeps or is unreachable, GramSetu incorporates a complete TypeScript mirror of the rule evaluation and NLU intent matching engine inside the browser, guaranteeing 0ms failure-free operation."),
        ("Voice-First Design for Low Literacy", "Integrated with the HTML5 Web Speech Recognition and Synthesis API, enabling regional dialect speakers to voice complaints and listen to audible scheme breakdowns in Marathi and Hindi."),
        ("Kopargaon Hyper-Localization", "Every administrative reference, ward number, official designation (GS-KPG-104), and notice ticker specifically models the authentic ground reality of Gram Panchayat Kopargaon in Ahilyanagar District.")
    ]
    
    for in_title, in_desc in innovations:
        ip = doc.add_paragraph(style='List Bullet')
        ip.add_run(f"{in_title}: ").bold = True
        ip.add_run(in_desc)
        ip.paragraph_format.space_after = Pt(4)
        
    doc.add_paragraph().paragraph_format.space_after = Pt(8)
    
    # 7. Demo Personas
    h1 = doc.add_heading(level=1)
    r = h1.add_run("7. Verification & Ready-to-Use Demo Personas")
    r.font.name = "Arial"
    r.font.color.rgb = RGBColor(10, 37, 64)
    h1.paragraph_format.space_before = Pt(18)
    h1.paragraph_format.space_after = Pt(6)
    
    p = doc.add_paragraph(
        "For immediate evaluation, academic presentation, or viva examination, the portal contains pre-configured 1-click "
        "login personas directly embedded in the login modal:"
    )
    p.paragraph_format.line_spacing = 1.15
    p.paragraph_format.space_after = Pt(8)
    
    demo_table = doc.add_table(rows=5, cols=4)
    demo_table.cell(0, 0).paragraphs[0].add_run("User Role")
    demo_table.cell(0, 1).paragraphs[0].add_run("Phone Number")
    demo_table.cell(0, 2).paragraphs[0].add_run("Password")
    demo_table.cell(0, 3).paragraphs[0].add_run("Evaluation Profile & Testing Scope")
    
    demo_data = [
        ("Gram Sevak (Official)", "9822001122", "Official@123", "Rameshwar Patil (VDO). Grants access to MIS War Room, SLA Escalation triggers, and Triage Register."),
        ("Citizen (Widow Farmer)", "9876543210", "Citizen@123", "Sunita Shinde (Age 48, OBC, 1.5 acres). Qualifies for PMAY-G (घरकुल) & Widow Pension (IGNWPS)."),
        ("Citizen (Senior Citizen)", "9876543211", "Citizen@123", "Babu More (Age 66, SC, 0 acres). Qualifies for Old Age Pension (IGNOAPS)."),
        ("Citizen (Student)", "9876543212", "Citizen@123", "Aakash Kamble (Age 21, SC, Student). Qualifies for Post-Matric Scholarship & MGNREGA Job Card.")
    ]
    
    for row_idx, (c1, c2, c3, c4) in enumerate(demo_data, start=1):
        demo_table.cell(row_idx, 0).paragraphs[0].add_run(c1).bold = True
        demo_table.cell(row_idx, 1).paragraphs[0].add_run(c2)
        demo_table.cell(row_idx, 2).paragraphs[0].add_run(c3)
        demo_table.cell(row_idx, 3).paragraphs[0].add_run(c4)
        
    demo_table.columns[0].width = Inches(1.8)
    demo_table.columns[1].width = Inches(1.3)
    demo_table.columns[2].width = Inches(1.2)
    demo_table.columns[3].width = Inches(2.2)
    style_table(demo_table)
    
    doc.add_paragraph().paragraph_format.space_after = Pt(16)
    
    footer_p = doc.add_paragraph()
    footer_p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r_foot = footer_p.add_run(
        "— Official Technical Documentation: Gram Panchayat Kopargaon | Digital India Initiative —\n"
        "Portal: https://gramsetu-rural-governance-platform.vercel.app | API: https://gramsetu-rural-governance-platform.onrender.com"
    )
    r_foot.font.size = Pt(8.5)
    r_foot.font.italic = True
    r_foot.font.color.rgb = RGBColor(100, 116, 139)
    
    doc.save(output_path)
    print(f"Successfully generated: {output_path}")

if __name__ == "__main__":
    out = "/Users/omsaishdhokchaule/Downloads/GramSetu/GramSetu_Project_Overview_and_System_Guide.docx"
    build_gramsetu_document(out)
