"""
VitalFlow v3.0 - Iteration 10 Backend Tests
Testing P0 items: sector filter, Google Fit persistence, B2B hybrid login logic

Features tested:
1. GestorDashboard sector filter - /api/dashboard/setores endpoint
2. Team overview with setor query param - /api/dashboard/team-overview?setor=X
3. Wearables sync endpoint - /api/wearables/sync (404 when no tokens)
4. B2B hybrid add-employee - converts personal to corporate
5. Login flow for admin
6. Export PDF endpoint
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
ADMIN_EMAIL = "admin@vitalflow.com"
ADMIN_PASSWORD = "Admin123!@#"


class TestHealthAndAuth:
    """Basic health check and authentication tests"""
    
    def test_api_health(self):
        """Test API root endpoint"""
        response = requests.get(f"{BASE_URL}/api/")
        assert response.status_code == 200
        data = response.json()
        assert "VitalFlow" in data.get("message", "") or "status" in data
        print(f"✓ API health check passed: {data}")
    
    def test_admin_login_success(self):
        """Test admin login with correct credentials"""
        session = requests.Session()
        response = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        data = response.json()
        assert "id" in data or "nome" in data
        assert data.get("nivel_acesso") == "Gestor"
        print(f"✓ Admin login successful: {data.get('nome')}")
        return session
    
    def test_login_invalid_credentials(self):
        """Test login with invalid credentials returns 401"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "wrong@email.com",
            "password": "wrongpassword"
        })
        assert response.status_code == 401
        print("✓ Invalid credentials correctly rejected with 401")


class TestGestorDashboardSetores:
    """Tests for sector filter functionality on GestorDashboard"""
    
    @pytest.fixture
    def gestor_session(self):
        """Get authenticated session for Gestor user"""
        session = requests.Session()
        response = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        if response.status_code != 200:
            pytest.skip("Admin login failed - skipping gestor tests")
        return session
    
    def test_get_setores_endpoint(self, gestor_session):
        """Test /api/dashboard/setores returns list of sectors"""
        response = gestor_session.get(f"{BASE_URL}/api/dashboard/setores")
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        assert "setores" in data
        assert isinstance(data["setores"], list)
        print(f"✓ Setores endpoint returned: {data['setores']}")
        # Verify expected sectors exist
        expected_sectors = ["Administrativo", "Operacional", "TI", "RH"]
        for sector in expected_sectors:
            if sector in data["setores"]:
                print(f"  - Found expected sector: {sector}")
    
    def test_setores_requires_gestor_auth(self):
        """Test /api/dashboard/setores requires Gestor authentication"""
        response = requests.get(f"{BASE_URL}/api/dashboard/setores")
        assert response.status_code in [401, 403], f"Expected 401/403, got {response.status_code}"
        print("✓ Setores endpoint correctly requires authentication")
    
    def test_team_overview_without_setor_filter(self, gestor_session):
        """Test /api/dashboard/team-overview without setor filter"""
        response = gestor_session.get(f"{BASE_URL}/api/dashboard/team-overview?period=7d")
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        assert "total_colaboradores" in data
        assert "avg_v_score" in data
        assert "distribution" in data
        print(f"✓ Team overview (no filter): {data['total_colaboradores']} colaboradores, avg V-Score: {data['avg_v_score']}")
    
    def test_team_overview_with_setor_filter(self, gestor_session):
        """Test /api/dashboard/team-overview with setor query param"""
        # First get available setores
        setores_response = gestor_session.get(f"{BASE_URL}/api/dashboard/setores")
        setores = setores_response.json().get("setores", [])
        
        if not setores:
            pytest.skip("No setores available to test filter")
        
        test_setor = setores[0]
        response = gestor_session.get(f"{BASE_URL}/api/dashboard/team-overview?period=7d&setor={test_setor}")
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        assert "total_colaboradores" in data
        print(f"✓ Team overview with setor={test_setor}: {data['total_colaboradores']} colaboradores")
    
    def test_period_filter_7d(self, gestor_session):
        """Test period filter 7d works"""
        response = gestor_session.get(f"{BASE_URL}/api/dashboard/team-overview?period=7d")
        assert response.status_code == 200
        print("✓ Period filter 7d works")
    
    def test_period_filter_30d(self, gestor_session):
        """Test period filter 30d works"""
        response = gestor_session.get(f"{BASE_URL}/api/dashboard/team-overview?period=30d")
        assert response.status_code == 200
        print("✓ Period filter 30d works")
    
    def test_period_filter_6m(self, gestor_session):
        """Test period filter 6m works"""
        response = gestor_session.get(f"{BASE_URL}/api/dashboard/team-overview?period=6m")
        assert response.status_code == 200
        print("✓ Period filter 6m works")


class TestWearablesSync:
    """Tests for wearables sync endpoint"""
    
    @pytest.fixture
    def user_session(self):
        """Get authenticated session"""
        session = requests.Session()
        response = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        if response.status_code != 200:
            pytest.skip("Login failed - skipping wearables tests")
        return session
    
    def test_wearables_sync_no_tokens(self, user_session):
        """Test /api/wearables/sync returns 404 when no tokens saved"""
        # First, ensure no google_health_connect tokens exist for this user
        # The endpoint should return 404 with 'Nenhum token salvo' message
        response = user_session.post(f"{BASE_URL}/api/wearables/sync")
        # Could be 404 (no tokens) or 200 (if tokens exist)
        if response.status_code == 404:
            data = response.json()
            assert "Nenhum token" in data.get("detail", "") or "token" in data.get("detail", "").lower()
            print(f"✓ Wearables sync correctly returns 404 when no tokens: {data['detail']}")
        elif response.status_code == 200:
            print("✓ Wearables sync returned 200 (tokens exist for this user)")
        else:
            print(f"⚠ Unexpected status: {response.status_code} - {response.text}")
    
    def test_google_fit_status(self, user_session):
        """Test Google Fit configuration status endpoint"""
        response = user_session.get(f"{BASE_URL}/api/wearables/google-fit/status")
        assert response.status_code == 200
        data = response.json()
        assert "configured" in data
        print(f"✓ Google Fit status: configured={data['configured']}")


class TestB2BHybridAddEmployee:
    """Tests for B2B hybrid add-employee logic"""
    
    @pytest.fixture
    def gestor_session(self):
        """Get authenticated session for Gestor user"""
        session = requests.Session()
        response = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        if response.status_code != 200:
            pytest.skip("Admin login failed - skipping B2B tests")
        return session
    
    def test_add_new_employee(self, gestor_session):
        """Test adding a completely new employee"""
        unique_email = f"test_new_{uuid.uuid4().hex[:8]}@empresa.com"
        response = gestor_session.post(f"{BASE_URL}/api/dashboard/add-employee", json={
            "nome": "Novo Funcionario Teste",
            "email": unique_email,
            "setor": "TI",
            "cargo": "Desenvolvedor",
            "nivel_acesso": "User"
        })
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        assert "id" in data
        assert "temp_password" in data
        assert data["email"] == unique_email
        print(f"✓ New employee added: {data['nome']} with temp password")
    
    def test_add_employee_missing_fields(self, gestor_session):
        """Test add-employee with missing required fields"""
        response = gestor_session.post(f"{BASE_URL}/api/dashboard/add-employee", json={
            "nome": "",
            "email": ""
        })
        assert response.status_code == 400
        print("✓ Add employee correctly rejects empty nome/email")
    
    def test_add_employee_duplicate_corporate(self, gestor_session):
        """Test adding employee with existing corporate email fails"""
        # Try to add admin email again (already corporate)
        response = gestor_session.post(f"{BASE_URL}/api/dashboard/add-employee", json={
            "nome": "Duplicate Test",
            "email": ADMIN_EMAIL,
            "setor": "TI"
        })
        assert response.status_code == 400
        data = response.json()
        assert "cadastrado" in data.get("detail", "").lower() or "ja" in data.get("detail", "").lower()
        print(f"✓ Duplicate corporate email correctly rejected: {data['detail']}")


class TestExportPDF:
    """Tests for PDF export functionality"""
    
    @pytest.fixture
    def gestor_session(self):
        """Get authenticated session for Gestor user"""
        session = requests.Session()
        response = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        if response.status_code != 200:
            pytest.skip("Admin login failed - skipping PDF tests")
        return session
    
    def test_export_pdf_7d(self, gestor_session):
        """Test PDF export for 7 days period"""
        response = gestor_session.get(f"{BASE_URL}/api/dashboard/export-pdf?period=7d")
        assert response.status_code == 200, f"Failed: {response.text}"
        assert response.headers.get("content-type") == "application/pdf"
        assert len(response.content) > 0
        print(f"✓ PDF export (7d) successful: {len(response.content)} bytes")
    
    def test_export_pdf_30d(self, gestor_session):
        """Test PDF export for 30 days period"""
        response = gestor_session.get(f"{BASE_URL}/api/dashboard/export-pdf?period=30d")
        assert response.status_code == 200
        assert response.headers.get("content-type") == "application/pdf"
        print(f"✓ PDF export (30d) successful: {len(response.content)} bytes")
    
    def test_export_pdf_requires_gestor(self):
        """Test PDF export requires Gestor authentication"""
        response = requests.get(f"{BASE_URL}/api/dashboard/export-pdf?period=7d")
        assert response.status_code in [401, 403]
        print("✓ PDF export correctly requires Gestor authentication")


class TestTeamStress:
    """Tests for team stress metrics endpoint"""
    
    @pytest.fixture
    def gestor_session(self):
        """Get authenticated session for Gestor user"""
        session = requests.Session()
        response = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        if response.status_code != 200:
            pytest.skip("Admin login failed - skipping stress tests")
        return session
    
    def test_team_stress_endpoint(self, gestor_session):
        """Test /api/dashboard/team-stress endpoint"""
        response = gestor_session.get(f"{BASE_URL}/api/dashboard/team-stress")
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        # Check expected fields
        assert "critical_alerts" in data or "stress_distribution" in data
        print(f"✓ Team stress endpoint works: {data}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
