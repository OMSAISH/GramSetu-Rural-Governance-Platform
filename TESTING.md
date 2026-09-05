# GramSetu — Testing & Quality Verification Guide

This guide describes how to verify the end-to-end functionality of GramSetu, covering automated testing and manual verification for all core citizen and official workflows.

---

## 1. Automated Backend Test Suite

The backend contains automated tests verifying authentication, scheme rule evaluation, PDF generation, grievance logging, SLA escalation, governance queries, and NLU intent classification.

Run the test suite:
```bash
cd backend
source venv/bin/activate
pytest tests/test_all.py -v
```

Expected output:
```
tests/test_all.py::test_health_and_root PASSED                           [ 12%]
tests/test_all.py::test_auth_login_official_and_citizen PASSED           [ 25%]
tests/test_all.py::test_schemes_and_rule_evaluator PASSED                [ 37%]
tests/test_all.py::test_pdf_generation PASSED                            [ 50%]
tests/test_all.py::test_grievance_workflow_and_sla PASSED                [ 62%]
tests/test_all.py::test_governance_records PASSED                        [ 75%]
tests/test_all.py::test_chat_nlu_routing PASSED                          [ 87%]
tests/test_all.py::test_official_dashboard_and_sla_escalation PASSED     [100%]
============================== 8 passed in 1.5s ===============================
```

---

## 2. Manual End-to-End Verification Steps

### Flow 1: Language Switching & Localization
1. Open the web application (`http://localhost:5173` or `http://localhost:3000`).
2. Click the language toggles in the top navbar: **मराठी**, **हिंदी**, and **English**.
3. **Verify:** All UI labels, tabs, navigation links, and initial bot greeting text dynamically update into the selected language without reloading the page.

### Flow 2: Citizen Conversational AI Sahayak (Chat)
1. In the **AI Sahayak** tab, test the quick prompt pills:
   - Click `"पाणी पुरवठ्याची समस्या"` or type `"The drinking water pipeline near Hanuman temple has broken"`.
   - **Verify:** The NLU identifies the `grievance` intent, auto-detects the category (`water`), department (`Rural Water Supply`), generates an official Tracking ID (`GS-2026-XXXXX`), and specifies the SLA deadline (3 days).
   - Click `"शासकीय योजनांसाठी माझी पात्रता तपासा"` or type `"Check my scheme eligibility"`.
   - **Verify:** The bot classifies the `scheme_check` intent and provides suggested next steps linking to the Scheme Entitlement tab.
   - Type `"पुढील ग्रामसभा बैठक कधी आहे?"` or `"When is the next meeting?"`.
   - **Verify:** The bot classifies the `governance_query` intent and returns upcoming Gram Sabha dates and agendas from the database.

### Flow 3: Scheme Entitlement Evaluation & PDF Auto-Fill
1. Navigate to the **Scheme Entitlements** tab.
2. In the citizen profile form on the left:
   - Set Age: `65`, Annual Income: `60000`, Category: `SC`, Occupation: `farmer`.
   - Click **Evaluate Eligibility Now**.
3. **Verify:**
   - The rule engine evaluates all schemes against the profile.
   - *Indira Gandhi National Old Age Pension Scheme (IGNOAPS)* and *MGNREGA* are marked **Eligible ✅**.
   - A plain-language reason explains why the applicant qualifies (e.g. *"Age 65 >= 60 and Income ₹60,000 <= ₹1,00,000"*).
   - Mandatory supporting documents checklist is displayed.
4. Click **Download Pre-filled PDF Form**:
   - **Verify:** A PDF file downloads (`Application_Indira_Gandhi_National_Old_Age_Pension_Scheme.pdf`).
   - Open the PDF and verify: official Gram Panchayat header, application reference ID, applicant's name, phone, age, income, and document checklist are pre-filled.

### Flow 4: Grievance Lodging & Live SLA Tracking
1. Navigate to the **Grievances & SLA** tab.
2. Under **File New Grievance**:
   - Type in Marathi or English: *"Street lights near the bus stop are not working, total darkness at night"*.
   - **Verify:** The live preview box auto-detects category as `electricity`, department as `Gram Panchayat Energy Cell`, and SLA target as `4 days`.
   - Click **Submit Grievance Officially**.
3. **Verify:**
   - A success card appears with a unique tracking code (e.g. `GS-2026-10530`).
   - Click **Copy ID** $\rightarrow$ verifies clipboard copy.
4. Switch to the **Track Existing Grievance** tab:
   - Enter `GS-2026-10481` (seeded sample overdue grievance) and click **Track Live Status**.
   - **Verify:** The tracking timeline highlights Step 3 with a prominent red **"SLA BREACHED: Priority Escalation Active"** alert banner.

### Flow 5: Public Governance Transparency
1. Navigate to the **Panchayat Works** tab.
2. Test the category chips: **All Records**, **Gram Sabha Meetings**, **Development Works**, **Fund Allocations**.
3. **Verify:**
   - Gram Sabha meetings display meeting agendas and dates.
   - Civil works display sanctioned budget amounts (e.g., *₹4,80,000* for Concrete Pavement).
   - Search bar filters records instantly (e.g. searching "drain" or "pipeline").

### Flow 6: Official Admin Dashboard & SLA Escalation
1. Click **Login** in the navbar $\rightarrow$ select **Panchayat Official Login** $\rightarrow$ click **Fill Official Demo** (`9822001122` / `Official@123`) $\rightarrow$ click **Sign In Securely**.
2. **Verify:**
   - The user is redirected to the **Official Dashboard**.
   - Official badge appears in the top navigation.
   - 6 KPI metric cards show Total Grievances, Pending Action, SLA Breaches, Resolution Rate %, and Citizen Scheme Checks.
   - Visual charts show systemic issue distribution (e.g. Water & Electricity complaint percentages) and scheme uptake rates.
   - The Grievance Triage table displays all logged grievances with category, status, and SLA breach indicators.
3. In the Grievance Table:
   - Click **Update** on a submitted grievance.
   - Change status to `in_progress` and enter notes: *"Field technician dispatched for pipe repair"*.
   - Click **Save & Publish** $\rightarrow$ table refreshes with updated status.
4. Click **Run SLA Auto-Escalation Check**:
   - **Verify:** The background routine checks all overdue grievances and escalates any breaches, displaying a confirmation message.
