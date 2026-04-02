"""
VitalFlow B2B Panel Tests - Iteration 5
Tests for:
- POST /api/dashboard/add-employee (Gestor only, returns temp_password)
- GET /api/dashboard/export-pdf (real PDF with reportlab)
- GET /api/dashboard/team-overview (with period filter)
- Security: non-Gestor users get 403 on Gestor endpoints
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestB2BPanelEndpoints:
    """B2B Panel endpoint tests for Gestor features"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test session with credentials"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        # Admin/Gestor credentials
        self.admin_email = "admin@vitalflow.com"
        self.admin_password = "Admin123!@#"
        # Non-Gestor test user
        self.test_user_email = f"test_user_{uuid.uuid4().hex[:6]}@gmail.com"
        self.test_user_password = "TestUser123!"
    
    def login_as_gestor(self):
        """Login as Gestor user and return session"""
        response = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": self.admin_email,
            "password": self.admin_password
        })
        assert response.status_code == 200, f"Gestor login failed: {response.text}"
        return response.json()
    
    def register_non_gestor_user(self):
        """Register a non-Gestor user for security tests"""
        response = self.session.post(f"{BASE_URL}/api/auth/register", json={
            "nome": "Test User",
            "email": self.test_user_email,
            "password": self.test_user_password,
            "data_nascimento": "1990-01-01",
            "setor": "Operacional",
            "nivel_acesso": "User"
        })
        return response
    
    # ==================== ADD EMPLOYEE TESTS ====================
    
    def test_add_employee_success_gestor(self):
        """POST /api/dashboard/add-employee - Gestor can add employee"""
        self.login_as_gestor()
        
        new_employee = {
            "nome": f"TEST_Employee_{uuid.uuid4().hex[:6]}",
            "email": f"test_emp_{uuid.uuid4().hex[:6]}@empresa.com.br",
            "setor": "TI",
            "cargo": "Desenvolvedor"
        }
        
        response = self.session.post(
            f"{BASE_URL}/api/dashboard/add-employee",
            json=new_employee
        )
        
        # Status assertion
        assert response.status_code == 200, f"Add employee failed: {response.text}"
        
        # Data assertions
        data = response.json()
        assert "id" in data, "Response should contain employee id"
        assert data["nome"] == new_employee["nome"], "Employee name should match"
        assert data["email"] == new_employee["email"].lower(), "Employee email should match (lowercase)"
        assert data["setor"] == new_employee["setor"], "Employee setor should match"
        assert data["cargo"] == new_employee["cargo"], "Employee cargo should match"
        assert "temp_password" in data, "Response should contain temp_password"
        assert len(data["temp_password"]) >= 8, "Temp password should be at least 8 chars"
        assert "message" in data, "Response should contain success message"
        
        print(f"✓ Add employee success: {data['nome']} with temp_password: {data['temp_password'][:4]}***")
    
    def test_add_employee_missing_fields(self):
        """POST /api/dashboard/add-employee - Returns 400 for missing required fields"""
        self.login_as_gestor()
        
        # Missing nome
        response = self.session.post(
            f"{BASE_URL}/api/dashboard/add-employee",
            json={"email": "test@test.com"}
        )
        assert response.status_code == 400, "Should return 400 for missing nome"
        
        # Missing email
        response = self.session.post(
            f"{BASE_URL}/api/dashboard/add-employee",
            json={"nome": "Test Name"}
        )
        assert response.status_code == 400, "Should return 400 for missing email"
        
        print("✓ Add employee validation works for missing fields")
    
    def test_add_employee_duplicate_email(self):
        """POST /api/dashboard/add-employee - Returns 400 for duplicate email"""
        self.login_as_gestor()
        
        # Try to add employee with existing admin email
        response = self.session.post(
            f"{BASE_URL}/api/dashboard/add-employee",
            json={
                "nome": "Duplicate Test",
                "email": self.admin_email,
                "setor": "TI"
            }
        )
        
        assert response.status_code == 400, f"Should return 400 for duplicate email: {response.text}"
        assert "cadastrado" in response.json().get("detail", "").lower(), "Error should mention email already registered"
        
        print("✓ Add employee rejects duplicate email")
    
    def test_add_employee_forbidden_non_gestor(self):
        """POST /api/dashboard/add-employee - Returns 403 for non-Gestor users"""
        # Register and login as non-Gestor
        reg_response = self.register_non_gestor_user()
        if reg_response.status_code != 200:
            pytest.skip("Could not register test user")
        
        # Try to add employee as non-Gestor
        response = self.session.post(
            f"{BASE_URL}/api/dashboard/add-employee",
            json={
                "nome": "Should Fail",
                "email": "shouldfail@test.com",
                "setor": "TI"
            }
        )
        
        assert response.status_code == 403, f"Non-Gestor should get 403: {response.status_code}"
        
        print("✓ Add employee returns 403 for non-Gestor users")
    
    # ==================== EXPORT PDF TESTS ====================
    
    def test_export_pdf_success_7d(self):
        """GET /api/dashboard/export-pdf?period=7d - Returns real PDF"""
        self.login_as_gestor()
        
        response = self.session.get(f"{BASE_URL}/api/dashboard/export-pdf?period=7d")
        
        # Status assertion
        assert response.status_code == 200, f"Export PDF failed: {response.text}"
        
        # Content-Type assertion - must be application/pdf
        content_type = response.headers.get("Content-Type", "")
        assert "application/pdf" in content_type, f"Content-Type should be application/pdf, got: {content_type}"
        
        # PDF content assertion - PDF files start with %PDF
        assert response.content[:4] == b'%PDF', "Response should be a valid PDF file"
        
        # Content-Disposition header check
        content_disp = response.headers.get("Content-Disposition", "")
        assert "attachment" in content_disp, "Should have attachment disposition"
        assert ".pdf" in content_disp, "Filename should have .pdf extension"
        
        print(f"✓ Export PDF (7d) success: {len(response.content)} bytes, Content-Type: {content_type}")
    
    def test_export_pdf_success_30d(self):
        """GET /api/dashboard/export-pdf?period=30d - Accepts 30d period"""
        self.login_as_gestor()
        
        response = self.session.get(f"{BASE_URL}/api/dashboard/export-pdf?period=30d")
        
        assert response.status_code == 200, f"Export PDF 30d failed: {response.text}"
        assert "application/pdf" in response.headers.get("Content-Type", "")
        assert response.content[:4] == b'%PDF'
        
        print("✓ Export PDF (30d) success")
    
    def test_export_pdf_success_6m(self):
        """GET /api/dashboard/export-pdf?period=6m - Accepts 6m period"""
        self.login_as_gestor()
        
        response = self.session.get(f"{BASE_URL}/api/dashboard/export-pdf?period=6m")
        
        assert response.status_code == 200, f"Export PDF 6m failed: {response.text}"
        assert "application/pdf" in response.headers.get("Content-Type", "")
        assert response.content[:4] == b'%PDF'
        
        print("✓ Export PDF (6m) success")
    
    def test_export_pdf_forbidden_non_gestor(self):
        """GET /api/dashboard/export-pdf - Returns 403 for non-Gestor users"""
        # Register and login as non-Gestor
        reg_response = self.register_non_gestor_user()
        if reg_response.status_code != 200:
            pytest.skip("Could not register test user")
        
        response = self.session.get(f"{BASE_URL}/api/dashboard/export-pdf?period=7d")
        
        assert response.status_code == 403, f"Non-Gestor should get 403: {response.status_code}"
        
        print("✓ Export PDF returns 403 for non-Gestor users")
    
    # ==================== TEAM OVERVIEW TESTS ====================
    
    def test_team_overview_success_default(self):
        """GET /api/dashboard/team-overview - Returns team overview data"""
        self.login_as_gestor()
        
        response = self.session.get(f"{BASE_URL}/api/dashboard/team-overview")
        
        assert response.status_code == 200, f"Team overview failed: {response.text}"
        
        data = response.json()
        # Validate response structure
        assert "total_colaboradores" in data, "Should have total_colaboradores"
        assert "avg_v_score" in data, "Should have avg_v_score"
        assert "avg_stress_level" in data, "Should have avg_stress_level"
        assert "distribution" in data, "Should have distribution"
        assert "trend_7d" in data, "Should have trend_7d"
        assert "lei_14831_alerts" in data, "Should have lei_14831_alerts"
        assert "engagement_rate" in data, "Should have engagement_rate"
        
        # Validate distribution structure
        dist = data["distribution"]
        assert "verde" in dist, "Distribution should have verde"
        assert "amarelo" in dist, "Distribution should have amarelo"
        assert "vermelho" in dist, "Distribution should have vermelho"
        
        print(f"✓ Team overview success: {data['total_colaboradores']} colaboradores, avg V-Score: {data['avg_v_score']}")
    
    def test_team_overview_with_period_7d(self):
        """GET /api/dashboard/team-overview?period=7d - Accepts period param"""
        self.login_as_gestor()
        
        response = self.session.get(f"{BASE_URL}/api/dashboard/team-overview?period=7d")
        
        assert response.status_code == 200, f"Team overview 7d failed: {response.text}"
        data = response.json()
        assert "trend_7d" in data
        
        print("✓ Team overview (7d) success")
    
    def test_team_overview_with_period_30d(self):
        """GET /api/dashboard/team-overview?period=30d - Accepts 30d period"""
        self.login_as_gestor()
        
        response = self.session.get(f"{BASE_URL}/api/dashboard/team-overview?period=30d")
        
        assert response.status_code == 200, f"Team overview 30d failed: {response.text}"
        
        print("✓ Team overview (30d) success")
    
    def test_team_overview_with_period_6m(self):
        """GET /api/dashboard/team-overview?period=6m - Accepts 6m period"""
        self.login_as_gestor()
        
        response = self.session.get(f"{BASE_URL}/api/dashboard/team-overview?period=6m")
        
        assert response.status_code == 200, f"Team overview 6m failed: {response.text}"
        
        print("✓ Team overview (6m) success")
    
    def test_team_overview_forbidden_non_gestor(self):
        """GET /api/dashboard/team-overview - Returns 403 for non-Gestor users"""
        # Register and login as non-Gestor
        reg_response = self.register_non_gestor_user()
        if reg_response.status_code != 200:
            pytest.skip("Could not register test user")
        
        response = self.session.get(f"{BASE_URL}/api/dashboard/team-overview")
        
        assert response.status_code == 403, f"Non-Gestor should get 403: {response.status_code}"
        
        print("✓ Team overview returns 403 for non-Gestor users")
    
    # ==================== AUTHENTICATION TESTS ====================
    
    def test_endpoints_require_auth(self):
        """All B2B endpoints require authentication"""
        # Fresh session without login
        fresh_session = requests.Session()
        
        endpoints = [
            ("POST", "/api/dashboard/add-employee"),
            ("GET", "/api/dashboard/export-pdf"),
            ("GET", "/api/dashboard/team-overview"),
        ]
        
        for method, endpoint in endpoints:
            if method == "POST":
                response = fresh_session.post(f"{BASE_URL}{endpoint}", json={})
            else:
                response = fresh_session.get(f"{BASE_URL}{endpoint}")
            
            assert response.status_code == 401, f"{endpoint} should require auth, got {response.status_code}"
        
        print("✓ All B2B endpoints require authentication (401 without token)")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
