"""
VitalFlow API Tests - Post-Refactoring Verification
Tests all endpoints after server.py was split into 13 modular files.
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
ADMIN_EMAIL = "admin@vitalflow.com"
ADMIN_PASSWORD = "Admin123!@#"


class TestRootEndpoint:
    """Test root API endpoint"""
    
    def test_root_endpoint_works(self):
        """GET /api/ returns correct message"""
        response = requests.get(f"{BASE_URL}/api/")
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        assert "VitalFlow" in data["message"]
        print("PASS: Root endpoint works")


class TestAuthEndpoints:
    """Test authentication endpoints from routes/auth.py"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Reset admin password before auth tests"""
        requests.post(f"{BASE_URL}/api/seed-admin")
    
    def test_login_with_admin_credentials(self):
        """POST /api/auth/login with admin credentials"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["email"] == ADMIN_EMAIL
        assert data["nivel_acesso"] == "Gestor"
        assert data["account_type"] == "corporate"
        assert "id" in data
        print(f"PASS: Login works - user: {data['nome']}, nivel: {data['nivel_acesso']}")
        return response.cookies
    
    def test_login_invalid_credentials(self):
        """POST /api/auth/login with wrong password"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": ADMIN_EMAIL, "password": "wrongpassword"}
        )
        assert response.status_code == 401
        print("PASS: Invalid credentials returns 401")
    
    def test_logout(self):
        """POST /api/auth/logout works"""
        session = requests.Session()
        # Login first
        session.post(f"{BASE_URL}/api/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
        # Logout
        response = session.post(f"{BASE_URL}/api/auth/logout")
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        print("PASS: Logout works")
    
    def test_get_me_authenticated(self):
        """GET /api/auth/me returns user info when authenticated"""
        session = requests.Session()
        session.post(f"{BASE_URL}/api/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
        response = session.get(f"{BASE_URL}/api/auth/me")
        assert response.status_code == 200
        data = response.json()
        assert data["email"] == ADMIN_EMAIL
        assert data["nivel_acesso"] == "Gestor"
        print(f"PASS: GET /me returns user: {data['nome']}")
    
    def test_update_profile_nome(self):
        """PUT /api/auth/profile updates nome successfully"""
        session = requests.Session()
        session.post(f"{BASE_URL}/api/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
        
        new_name = f"Admin Test {uuid.uuid4().hex[:4]}"
        response = session.put(f"{BASE_URL}/api/auth/profile", json={"nome": new_name})
        assert response.status_code == 200
        data = response.json()
        assert data["nome"] == new_name
        print(f"PASS: Profile update works - new name: {new_name}")
        
        # Restore original name
        session.put(f"{BASE_URL}/api/auth/profile", json={"nome": "Administrador"})
    
    def test_forgot_password_valid_email(self):
        """POST /api/auth/forgot-password generates temp password"""
        # First create a test user
        test_email = f"test_forgot_{uuid.uuid4().hex[:6]}@test.com"
        session = requests.Session()
        session.post(f"{BASE_URL}/api/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
        session.post(f"{BASE_URL}/api/dashboard/add-employee", json={
            "nome": "Test Forgot User",
            "email": test_email,
            "setor": "TI"
        })
        
        # Test forgot password
        response = requests.post(f"{BASE_URL}/api/auth/forgot-password", json={"email": test_email})
        assert response.status_code == 200
        data = response.json()
        assert "temp_password" in data
        assert data["temp_password"].startswith("Reset")
        print(f"PASS: Forgot password generates temp: {data['temp_password'][:10]}...")
    
    def test_forgot_password_unknown_email(self):
        """POST /api/auth/forgot-password returns 404 for unknown email"""
        response = requests.post(
            f"{BASE_URL}/api/auth/forgot-password",
            json={"email": "nonexistent@nowhere.com"}
        )
        assert response.status_code == 404
        print("PASS: Forgot password returns 404 for unknown email")
    
    def test_register_new_personal_user(self):
        """POST /api/auth/register creates new personal user"""
        test_email = f"test_reg_{uuid.uuid4().hex[:6]}@personal.com"
        response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "nome": "Test Personal User",
            "email": test_email,
            "password": "TestPass123!",
            "data_nascimento": "1995-05-15",
            "setor": "Geral",
            "nivel_acesso": "User"
        })
        assert response.status_code == 200
        data = response.json()
        assert data["email"] == test_email
        assert data["account_type"] == "personal"
        print(f"PASS: Register creates personal user: {test_email}")
    
    def test_check_domain_corporate(self):
        """GET /api/auth/check-domain returns corporate for vitalflow.com"""
        response = requests.get(f"{BASE_URL}/api/auth/check-domain?email=test@vitalflow.com")
        assert response.status_code == 200
        data = response.json()
        assert data["is_corporate"] == True
        assert data["account_type"] == "corporate"
        print(f"PASS: Domain check returns corporate for vitalflow.com")
    
    def test_check_domain_personal(self):
        """GET /api/auth/check-domain returns personal for unknown domain"""
        response = requests.get(f"{BASE_URL}/api/auth/check-domain?email=test@randomdomain.xyz")
        assert response.status_code == 200
        data = response.json()
        assert data["is_corporate"] == False
        assert data["account_type"] == "personal"
        print("PASS: Domain check returns personal for unknown domain")


class TestDashboardEndpoints:
    """Test dashboard endpoints from routes/dashboard.py"""
    
    @pytest.fixture
    def gestor_session(self):
        """Get authenticated session as Gestor"""
        requests.post(f"{BASE_URL}/api/seed-admin")
        session = requests.Session()
        session.post(f"{BASE_URL}/api/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
        return session
    
    def test_dashboard_metrics_requires_gestor(self, gestor_session):
        """GET /api/dashboard/metrics requires Gestor access"""
        response = gestor_session.get(f"{BASE_URL}/api/dashboard/metrics")
        assert response.status_code == 200
        data = response.json()
        assert "total_colaboradores" in data
        assert "total_analises" in data
        assert "media_v_score" in data
        print(f"PASS: Dashboard metrics - {data['total_colaboradores']} colaboradores")
    
    def test_add_employee_creates_user(self, gestor_session):
        """POST /api/dashboard/add-employee creates employee with nivel_acesso"""
        test_email = f"test_emp_{uuid.uuid4().hex[:6]}@vitalflow.com"
        response = gestor_session.post(f"{BASE_URL}/api/dashboard/add-employee", json={
            "nome": "Test Employee",
            "email": test_email,
            "setor": "Operacional",
            "cargo": "Analista",
            "nivel_acesso": "User"
        })
        assert response.status_code == 200
        data = response.json()
        assert data["email"] == test_email
        assert "temp_password" in data
        assert data["account_type"] == "corporate"
        print(f"PASS: Add employee works - {test_email}")
    
    def test_add_employee_gestor_level(self, gestor_session):
        """POST /api/dashboard/add-employee with nivel_acesso=Gestor"""
        test_email = f"test_gestor_{uuid.uuid4().hex[:6]}@vitalflow.com"
        response = gestor_session.post(f"{BASE_URL}/api/dashboard/add-employee", json={
            "nome": "Test Gestor",
            "email": test_email,
            "setor": "RH",
            "nivel_acesso": "Gestor"
        })
        assert response.status_code == 200
        data = response.json()
        assert data["email"] == test_email
        print(f"PASS: Add employee with Gestor level works")
    
    def test_team_overview(self, gestor_session):
        """GET /api/dashboard/team-overview returns team data"""
        response = gestor_session.get(f"{BASE_URL}/api/dashboard/team-overview")
        assert response.status_code == 200
        data = response.json()
        assert "total_colaboradores" in data
        assert "avg_v_score" in data
        assert "distribution" in data
        print(f"PASS: Team overview - {data['total_colaboradores']} colaboradores")
    
    def test_export_pdf(self, gestor_session):
        """GET /api/dashboard/export-pdf returns PDF"""
        response = gestor_session.get(f"{BASE_URL}/api/dashboard/export-pdf")
        assert response.status_code == 200
        assert response.headers.get("content-type") == "application/pdf"
        assert len(response.content) > 0
        print(f"PASS: Export PDF works - {len(response.content)} bytes")


class TestGamificationEndpoints:
    """Test gamification endpoints from routes/gamification.py"""
    
    @pytest.fixture
    def auth_session(self):
        """Get authenticated session"""
        requests.post(f"{BASE_URL}/api/seed-admin")
        session = requests.Session()
        session.post(f"{BASE_URL}/api/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
        return session
    
    def test_gamification_stats(self, auth_session):
        """GET /api/gamification/stats returns gamification data"""
        response = auth_session.get(f"{BASE_URL}/api/gamification/stats")
        assert response.status_code == 200
        data = response.json()
        assert "energy_points" in data
        assert "current_streak" in data
        assert "badges" in data
        print(f"PASS: Gamification stats - {data['energy_points']} points")
    
    def test_gamification_leaderboard(self, auth_session):
        """GET /api/gamification/leaderboard returns leaderboard"""
        response = auth_session.get(f"{BASE_URL}/api/gamification/leaderboard")
        assert response.status_code == 200
        data = response.json()
        assert "entries" in data
        assert "period" in data
        print(f"PASS: Leaderboard - {len(data['entries'])} entries")


class TestBillingEndpoints:
    """Test billing endpoints from routes/gamification.py"""
    
    @pytest.fixture
    def auth_session(self):
        """Get authenticated session"""
        requests.post(f"{BASE_URL}/api/seed-admin")
        session = requests.Session()
        session.post(f"{BASE_URL}/api/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
        return session
    
    def test_billing_plan(self, auth_session):
        """GET /api/billing/plan returns plan info"""
        response = auth_session.get(f"{BASE_URL}/api/billing/plan")
        assert response.status_code == 200
        data = response.json()
        assert "plan" in data
        assert "is_premium" in data
        assert "limits" in data
        print(f"PASS: Billing plan - {data['plan']}")
    
    def test_billing_upgrade(self, auth_session):
        """POST /api/billing/upgrade works (MOCKED)"""
        response = auth_session.post(f"{BASE_URL}/api/billing/upgrade")
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        print(f"PASS: Billing upgrade (MOCKED) - {data['message']}")


class TestHealthEndpoints:
    """Test health endpoints from routes/health.py"""
    
    @pytest.fixture
    def auth_session(self):
        """Get authenticated session"""
        requests.post(f"{BASE_URL}/api/seed-admin")
        session = requests.Session()
        session.post(f"{BASE_URL}/api/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
        return session
    
    def test_predictive_alert_corporate(self, auth_session):
        """GET /api/predictive/alert works for corporate user"""
        response = auth_session.get(f"{BASE_URL}/api/predictive/alert")
        assert response.status_code == 200
        data = response.json()
        # Corporate users have access
        assert "has_alert" in data or "locked" in data
        print(f"PASS: Predictive alert - has_alert: {data.get('has_alert', 'N/A')}")
    
    def test_health_trend(self, auth_session):
        """GET /api/health/trend returns trend data"""
        response = auth_session.get(f"{BASE_URL}/api/health/trend")
        assert response.status_code == 200
        data = response.json()
        assert "trend" in data
        assert "v_scores_7d" in data
        assert "avg_7d" in data
        print(f"PASS: Health trend - {data['trend']}")


class TestSmartwatchEndpoints:
    """Test smartwatch endpoints from routes/smartwatch.py"""
    
    @pytest.fixture
    def auth_session(self):
        """Get authenticated session"""
        requests.post(f"{BASE_URL}/api/seed-admin")
        session = requests.Session()
        session.post(f"{BASE_URL}/api/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
        return session
    
    def test_energy_status(self, auth_session):
        """GET /api/status/energy returns energy status"""
        response = auth_session.get(f"{BASE_URL}/api/status/energy")
        assert response.status_code == 200
        data = response.json()
        assert "status" in data
        assert "color_code" in data
        assert "label" in data
        print(f"PASS: Energy status - {data['status']}")


class TestWearablesEndpoints:
    """Test wearables endpoints from routes/wearables.py"""
    
    @pytest.fixture
    def auth_session(self):
        """Get authenticated session"""
        requests.post(f"{BASE_URL}/api/seed-admin")
        session = requests.Session()
        session.post(f"{BASE_URL}/api/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
        return session
    
    def test_get_wearables(self, auth_session):
        """GET /api/wearables returns list"""
        response = auth_session.get(f"{BASE_URL}/api/wearables")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"PASS: Get wearables - {len(data)} devices")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
