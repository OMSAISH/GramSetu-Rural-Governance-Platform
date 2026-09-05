import io
from datetime import datetime
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle

class PDFService:
    @staticmethod
    def generate_application_pdf(scheme: dict, user_profile: dict) -> bytes:
        """
        Generates a standardized pre-filled PDF application form
        using ReportLab with applicant details, scheme guidelines,
        document checklist, and Panchayat submission seal.
        """
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(
            buffer,
            pagesize=letter,
            rightMargin=36,
            leftMargin=36,
            topMargin=36,
            bottomMargin=36
        )

        styles = getSampleStyleSheet()
        
        # Custom typography
        title_style = ParagraphStyle(
            'TitleStyle',
            parent=styles['Heading1'],
            fontName='Helvetica-Bold',
            fontSize=18,
            leading=22,
            alignment=1, # Center
            textColor=colors.HexColor("#1e3a8a") # Deep Navy
        )

        subtitle_style = ParagraphStyle(
            'SubTitleStyle',
            parent=styles['Normal'],
            fontName='Helvetica-Bold',
            fontSize=11,
            leading=14,
            alignment=1,
            textColor=colors.HexColor("#475569")
        )

        section_heading = ParagraphStyle(
            'SectionHeading',
            parent=styles['Heading2'],
            fontName='Helvetica-Bold',
            fontSize=13,
            leading=16,
            textColor=colors.HexColor("#1e3a8a"),
            spaceBefore=10,
            spaceAfter=6
        )

        body_style = ParagraphStyle(
            'Body',
            parent=styles['Normal'],
            fontName='Helvetica',
            fontSize=10,
            leading=13,
            textColor=colors.HexColor("#1f2937")
        )

        table_label_style = ParagraphStyle(
            'TableLabel',
            parent=styles['Normal'],
            fontName='Helvetica-Bold',
            fontSize=9,
            leading=12,
            textColor=colors.HexColor("#334155")
        )

        table_value_style = ParagraphStyle(
            'TableVal',
            parent=styles['Normal'],
            fontName='Helvetica',
            fontSize=9,
            leading=12,
            textColor=colors.HexColor("#0f172a")
        )

        elements = []

        # Header Banner
        elements.append(Paragraph("GRAM PANCHAYAT GOVERNANCE & WELFARE PORTAL", subtitle_style))
        elements.append(Paragraph("GRAMSETU — CITIZEN APPLICATION FORM", title_style))
        elements.append(Paragraph(f"Department: {scheme.get('department', 'Rural Development')}", subtitle_style))
        elements.append(Spacer(1, 10))
        elements.append(HRFlowable(width="100%", thickness=2, color=colors.HexColor("#1e3a8a"), spaceAfter=12))

        # Application Reference Info Table
        app_ref = f"GS-APP-{scheme.get('id', 1):03d}-{int(datetime.utcnow().timestamp()) % 100000:05d}"
        ref_data = [
            [
                Paragraph("<b>Application Ref ID:</b>", table_label_style),
                Paragraph(app_ref, table_value_style),
                Paragraph("<b>Generated On:</b>", table_label_style),
                Paragraph(datetime.utcnow().strftime("%d-%B-%Y %H:%M UTC"), table_value_style)
            ],
            [
                Paragraph("<b>Target Scheme:</b>", table_label_style),
                Paragraph(f"<b>{scheme.get('name', 'N/A')}</b>", table_value_style),
                Paragraph("<b>Gram Panchayat:</b>", table_label_style),
                Paragraph("Shivajinagar GP (Code: 27042)", table_value_style)
            ]
        ]
        ref_table = Table(ref_data, colWidths=[1.5*inch, 2.2*inch, 1.3*inch, 2.0*inch])
        ref_table.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#f8fafc")),
            ('BOX', (0,0), (-1,-1), 1, colors.HexColor("#cbd5e1")),
            ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor("#e2e8f0")),
            ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
            ('TOPPADDING', (0,0), (-1,-1), 5),
            ('BOTTOMPADDING', (0,0), (-1,-1), 5),
        ]))
        elements.append(ref_table)
        elements.append(Spacer(1, 12))

        # Section 1: Applicant Profile Details
        elements.append(Paragraph("1. Pre-Filled Applicant Information", section_heading))
        
        income_display = f"INR {user_profile.get('annual_income', 0):,.2f}" if user_profile.get('annual_income') else user_profile.get('income_bracket', 'Not specified')
        land_display = f"{user_profile.get('land_owned_acres', 0.0)} Acres"

        applicant_data = [
            [
                Paragraph("Full Legal Name", table_label_style),
                Paragraph(str(user_profile.get("name", "N/A")), table_value_style),
                Paragraph("Mobile Phone", table_label_style),
                Paragraph(str(user_profile.get("phone_number", "N/A")), table_value_style)
            ],
            [
                Paragraph("Age / Gender", table_label_style),
                Paragraph(f"{user_profile.get('age', 'N/A')} yrs / {user_profile.get('gender', 'N/A')}", table_value_style),
                Paragraph("Social Category", table_label_style),
                Paragraph(str(user_profile.get("category", "General")).upper(), table_value_style)
            ],
            [
                Paragraph("Occupation", table_label_style),
                Paragraph(str(user_profile.get("occupation", "Agricultural / Rural Labor")).replace("_", " ").title(), table_value_style),
                Paragraph("Annual Income", table_label_style),
                Paragraph(income_display, table_value_style)
            ],
            [
                Paragraph("Agricultural Land", table_label_style),
                Paragraph(land_display, table_value_style),
                Paragraph("Persons with Disability", table_label_style),
                Paragraph(str(user_profile.get("has_disability", "No")).capitalize(), table_value_style)
            ]
        ]
        app_table = Table(applicant_data, colWidths=[1.5*inch, 2.0*inch, 1.5*inch, 2.0*inch])
        app_table.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,-1), colors.white),
            ('BOX', (0,0), (-1,-1), 1, colors.HexColor("#94a3b8")),
            ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor("#e2e8f0")),
            ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
            ('TOPPADDING', (0,0), (-1,-1), 6),
            ('BOTTOMPADDING', (0,0), (-1,-1), 6),
        ]))
        elements.append(app_table)
        elements.append(Spacer(1, 12))

        # Section 2: Scheme Eligibility & Objective
        elements.append(Paragraph("2. Scheme Objective & Eligibility Basis", section_heading))
        desc_text = scheme.get("description", "Government financial and welfare entitlement assistance.")
        elements.append(Paragraph(f"<b>Overview:</b> {desc_text}", body_style))
        elements.append(Spacer(1, 8))

        # Section 3: Required Supporting Documents Checklist
        elements.append(Paragraph("3. Mandatory Supporting Documents Checklist", section_heading))
        docs = scheme.get("required_documents", ["Aadhaar Card", "Bank Passbook", "Income Certificate"])
        doc_rows = []
        for i, doc_name in enumerate(docs, 1):
            doc_rows.append([
                Paragraph(f"[{'X' if i <= 2 else ' '}]", ParagraphStyle('Check', parent=styles['Normal'], alignment=1, fontName='Helvetica-Bold')),
                Paragraph(f"<b>{i}. {doc_name}</b>", table_value_style),
                Paragraph("Original + 2 self-attested copies required", table_label_style)
            ])
        doc_table = Table(doc_rows, colWidths=[0.5*inch, 3.5*inch, 3.0*inch])
        doc_table.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#f1f5f9")),
            ('BOX', (0,0), (-1,-1), 1, colors.HexColor("#cbd5e1")),
            ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor("#e2e8f0")),
            ('TOPPADDING', (0,0), (-1,-1), 4),
            ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ]))
        elements.append(doc_table)
        elements.append(Spacer(1, 14))

        # Section 4: Citizen Undertaking & Signatures
        elements.append(Paragraph("4. Citizen Declaration & Gram Panchayat Verification", section_heading))
        declaration_text = (
            "I hereby solemnly affirm that the information furnished above is true, complete, and accurate "
            "to the best of my knowledge. I understand that any false declaration will lead to disqualification "
            "and appropriate administrative/legal action under the relevant statutory provisions."
        )
        elements.append(Paragraph(declaration_text, ParagraphStyle('Dec', parent=styles['Italic'], fontSize=8, leading=11, textColor=colors.HexColor("#4b5563"))))
        elements.append(Spacer(1, 18))

        sig_data = [
            [
                Paragraph("__________________________<br/><b>Applicant Signature / Thumb Impression</b><br/>Date: _____________", body_style),
                Paragraph("__________________________<br/><b>Gram Sevak / VDO Verification</b><br/>Official Seal & Stamp", body_style)
            ]
        ]
        sig_table = Table(sig_data, colWidths=[3.5*inch, 3.5*inch])
        sig_table.setStyle(TableStyle([
            ('VALIGN', (0,0), (-1,-1), 'BOTTOM'),
            ('ALIGN', (1,0), (1,0), 'RIGHT'),
            ('BOTTOMPADDING', (0,0), (-1,-1), 8),
        ]))
        elements.append(sig_table)

        doc.build(elements)
        buffer.seek(0)
        return buffer.getvalue()

pdf_service = PDFService()
