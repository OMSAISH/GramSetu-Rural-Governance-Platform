import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app

@pytest.mark.asyncio
async def test_health_and_root():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        r1 = await ac.get("/")
        assert r1.status_code == 200
        assert r1.json()["app"] == "GramSetu API"

        r2 = await ac.get("/api/health")
        assert r2.status_code == 200
        assert r2.json()["status"] == "healthy"

@pytest.mark.asyncio
async def test_auth_login_official_and_citizen():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        # Official login
        resp = await ac.post("/api/auth/login", json={
            "phone_number": "9822001122",
            "password": "Official@123"
        })
        assert resp.status_code == 200
        data = resp.json()
        assert "access_token" in data
        assert data["user"]["role"] == "official"

        # Citizen login
        resp_c = await ac.post("/api/auth/login", json={
            "phone_number": "9876543210",
            "password": "Citizen@123"
        })
        assert resp_c.status_code == 200
        assert resp_c.json()["user"]["role"] == "citizen"

@pytest.mark.asyncio
async def test_schemes_and_rule_evaluator():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        # List schemes
        resp = await ac.get("/api/schemes?language=mr")
        assert resp.status_code == 200
        schemes = resp.json()
        assert len(schemes) >= 5

        # Check eligibility for elderly low income farmer
        eval_resp = await ac.post("/api/schemes/check-eligibility", json={
            "age": 68,
            "annual_income": 45000,
            "category": "SC",
            "occupation": "farmer",
            "land_owned_acres": 1.0,
            "preferred_language": "en"
        })
        assert eval_resp.status_code == 200
        res_data = eval_resp.json()
        assert res_data["total_schemes"] >= 5
        assert res_data["eligible_count"] >= 2

@pytest.mark.asyncio
async def test_pdf_generation():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        resp = await ac.get("/api/schemes/1/application?name=Sunita+Shinde&phone=9876543210&age=42&annual_income=75000&category=OBC")
        assert resp.status_code == 200
        assert resp.headers["content-type"] == "application/pdf"
        assert resp.content.startswith(b"%PDF")
        assert len(resp.content) > 1000

@pytest.mark.asyncio
async def test_grievance_workflow_and_sla():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        # Citizen submits grievance in Marathi
        g_resp = await ac.post("/api/grievances", json={
            "description": "पिण्याच्या पाण्याची पाईपलाईन फुटली आहे आणि पाणी गळती होत आहे",
            "language": "mr"
        })
        assert g_resp.status_code == 201
        g_data = g_resp.json()
        tracking_id = g_data["tracking_id"]
        assert tracking_id.startswith("GS-")
        assert g_data["category"] == "water"
        assert "Water" in g_data["department_assigned"]

        # Track grievance by tracking ID
        t_resp = await ac.get(f"/api/grievances/track/{tracking_id}")
        assert t_resp.status_code == 200
        assert t_resp.json()["tracking_id"] == tracking_id

@pytest.mark.asyncio
async def test_governance_records():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        resp = await ac.get("/api/governance/records?category=meeting&language=mr")
        assert resp.status_code == 200
        records = resp.json()
        assert len(records) >= 1
        assert "बैठक" in records[0]["title"] or "ग्रामसभा" in records[0]["title"] or "Meeting" in records[0]["title"]

@pytest.mark.asyncio
async def test_chat_nlu_routing():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        # Scheme query in Hindi
        c1 = await ac.post("/api/chat", json={
            "message": "मुझे सरकारी योजनाओं के बारे में बताएं और मेरी पात्रता क्या है",
            "language": "hi"
        })
        assert c1.status_code == 200
        assert c1.json()["intent_detected"] == "scheme_check"

        # Governance query
        c2 = await ac.post("/api/chat", json={
            "message": "When is the next Gram Sabha meeting?",
            "language": "en"
        })
        assert c2.status_code == 200
        assert c2.json()["intent_detected"] == "governance_query"

@pytest.mark.asyncio
async def test_official_dashboard_and_sla_escalation():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        # Login official
        login_res = await ac.post("/api/auth/login", json={
            "phone_number": "9822001122",
            "password": "Official@123"
        })
        token = login_res.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # Dashboard analytics
        dash_res = await ac.get("/api/analytics/dashboard", headers=headers)
        assert dash_res.status_code == 200
        dash_data = dash_res.json()
        assert dash_data["total_grievances"] >= 5
        assert len(dash_data["grievances_by_category"]) >= 3
        assert len(dash_data["scheme_uptake"]) >= 5

        # Trigger SLA escalation
        esc_res = await ac.post("/api/analytics/trigger-sla-escalation", headers=headers)
        assert esc_res.status_code == 200
        assert "escalated_count" in esc_res.json()
