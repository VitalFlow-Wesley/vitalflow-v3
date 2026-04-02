"""
VitalFlow Iteration 6 - New Features Tests
Tests for:
1. Forgot Password endpoint (POST /api/auth/forgot-password)
2. Add Employee with nivel_acesso (POST /api/dashboard/add-employee)
3. Profile lock icons for corporate users (account_type=corporate)
4. Register page simplified (no Setor/Nivel de Acesso fields - frontend only)
"""

import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
ADMIN_EMAIL = "admin@vitalflow.com"
ADMIN_PASSWORD = "Admin123!@#"


def seed_admin():
    """Re-seed admin with correct password and account_type"""
    resp = requests.post(f"{BASE_URL}/api/seed-admin")
    return resp.status_code == 200


class TestForgotPassword:
    """Tests for POST /api/auth/forgot-password endpoint"""
    
    def test_forgot_password_valid_email(self):
        """Test forgot password with valid registered email - uses a test user, not admin"""
        # Create a test user first
        test_email = f"test_forgot_{uuid.uuid4().hex[:8]}@test.com"
        
        # Register a test user
        register_resp = requests.post(f"{BASE_URL}/api/auth/register", json={
            "nome": "Test Forgot User",
            "email": test_email,
            "password": "TestPass123!",
            "data_nascimento": "1990-01-01",
            "setor": "Geral",
            "nivel_acesso": "User"
        })
        assert register_resp.status_code == 200, f"Register failed: {register_resp.text}"
        
        # Now test forgot password
        response = requests.post(f"{BASE_URL}/api/auth/forgot-password", json={
            "email": test_email
        })
        
        assert response.status_code == 200, f"Forgot password failed: {response.text}"
        data = response.json()
        
        # Verify response structure
        assert "message" in data, "Response should contain 'message'"
        assert "temp_password" in data, "Response should contain 'temp_password'"
        assert len(data["temp_password"]) > 0, "Temp password should not be empty"
        
        # Verify temp password format (starts with 'Reset')
        assert data["temp_password"].startswith("Reset"), f"Temp password should start with 'Reset', got: {data['temp_password']}"
        
        print(f"SUCCESS: Forgot password generated temp_password: {data['temp_password'][:10]}...")
        
        # Verify temp password works for login
        login_with_temp = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": test_email,
            "password": data["temp_password"]
        })
        assert login_with_temp.status_code == 200, f"Login with temp password failed: {login_with_temp.text}"
        print("SUCCESS: Login with temp password works")
        
    def test_forgot_password_unknown_email(self):
        """Test forgot password with non-existent email returns 404"""
        response = requests.post(f"{BASE_URL}/api/auth/forgot-password", json={
            "email": f"nonexistent_{uuid.uuid4().hex[:8]}@test.com"
        })
        
        assert response.status_code == 404, f"Expected 404 for unknown email, got {response.status_code}: {response.text}"
        data = response.json()
        assert "detail" in data, "Response should contain 'detail' error message"
        print(f"SUCCESS: Unknown email returns 404 with message: {data['detail']}")
        
    def test_forgot_password_invalid_email_format(self):
        """Test forgot password with invalid email format returns 422"""
        response = requests.post(f"{BASE_URL}/api/auth/forgot-password", json={
            "email": "not-an-email"
        })
        
        # Pydantic validation should return 422
        assert response.status_code == 422, f"Expected 422 for invalid email format, got {response.status_code}"
        print("SUCCESS: Invalid email format returns 422")


class TestAddEmployeeWithNivelAcesso:
    """Tests for add-employee endpoint with nivel_acesso parameter"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login as admin/gestor before each test"""
        # First ensure admin is seeded with correct password
        seed_admin()
        
        self.session = requests.Session()
        login_resp = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        
        assert login_resp.status_code == 200, f"Admin login failed: {login_resp.text}"
        self.cookies = login_resp.cookies
        
    def test_add_employee_with_nivel_user(self):
        """Test adding employee with nivel_acesso=User"""
        test_email = f"test_user_{uuid.uuid4().hex[:8]}@test.com"
        
        response = self.session.post(f"{BASE_URL}/api/dashboard/add-employee", json={
            "nome": "Test User Employee",
            "email": test_email,
            "setor": "Operacional",
            "cargo": "Analista",
            "nivel_acesso": "User"
        }, cookies=self.cookies)
        
        assert response.status_code == 200, f"Add employee failed: {response.text}"
        data = response.json()
        
        assert "temp_password" in data, "Response should contain temp_password"
        assert data["nome"] == "Test User Employee"
        assert data["email"] == test_email
        print(f"SUCCESS: Added employee with nivel_acesso=User, temp_password: {data['temp_password'][:10]}...")
        
        # Verify the employee can login and has User nivel
        login_resp = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": test_email,
            "password": data["temp_password"]
        })
        assert login_resp.status_code == 200, f"New employee login failed: {login_resp.text}"
        user_data = login_resp.json()
        assert user_data["nivel_acesso"] == "User", f"Expected nivel_acesso=User, got {user_data['nivel_acesso']}"
        print("SUCCESS: New employee has nivel_acesso=User")
        
    def test_add_employee_with_nivel_gestor(self):
        """Test adding employee with nivel_acesso=Gestor"""
        test_email = f"test_gestor_{uuid.uuid4().hex[:8]}@test.com"
        
        response = self.session.post(f"{BASE_URL}/api/dashboard/add-employee", json={
            "nome": "Test Gestor Employee",
            "email": test_email,
            "setor": "RH",
            "cargo": "Gerente",
            "nivel_acesso": "Gestor"
        }, cookies=self.cookies)
        
        assert response.status_code == 200, f"Add employee failed: {response.text}"
        data = response.json()
        
        assert "temp_password" in data, "Response should contain temp_password"
        print(f"SUCCESS: Added employee with nivel_acesso=Gestor")
        
        # Verify the employee can login and has Gestor nivel
        login_resp = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": test_email,
            "password": data["temp_password"]
        })
        assert login_resp.status_code == 200, f"New gestor login failed: {login_resp.text}"
        user_data = login_resp.json()
        assert user_data["nivel_acesso"] == "Gestor", f"Expected nivel_acesso=Gestor, got {user_data['nivel_acesso']}"
        print("SUCCESS: New employee has nivel_acesso=Gestor")
        
    def test_add_employee_invalid_nivel_defaults_to_user(self):
        """Test that invalid nivel_acesso defaults to User"""
        test_email = f"test_invalid_{uuid.uuid4().hex[:8]}@test.com"
        
        response = self.session.post(f"{BASE_URL}/api/dashboard/add-employee", json={
            "nome": "Test Invalid Nivel",
            "email": test_email,
            "setor": "TI",
            "cargo": "Dev",
            "nivel_acesso": "InvalidLevel"
        }, cookies=self.cookies)
        
        assert response.status_code == 200, f"Add employee failed: {response.text}"
        data = response.json()
        
        # Verify the employee has User nivel (default)
        login_resp = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": test_email,
            "password": data["temp_password"]
        })
        assert login_resp.status_code == 200
        user_data = login_resp.json()
        assert user_data["nivel_acesso"] == "User", f"Invalid nivel should default to User, got {user_data['nivel_acesso']}"
        print("SUCCESS: Invalid nivel_acesso defaults to User")


class TestCorporateUserProfile:
    """Tests for corporate user profile with locked fields"""
    
    def test_admin_is_corporate_user(self):
        """Verify admin user has account_type=corporate"""
        # Ensure admin is seeded
        seed_admin()
        
        session = requests.Session()
        login_resp = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        
        assert login_resp.status_code == 200, f"Admin login failed: {login_resp.text}"
        data = login_resp.json()
        
        assert data["account_type"] == "corporate", f"Admin should be corporate, got {data['account_type']}"
        assert data["nivel_acesso"] == "Gestor", f"Admin should be Gestor, got {data['nivel_acesso']}"
        print(f"SUCCESS: Admin is corporate user with account_type={data['account_type']}, nivel_acesso={data['nivel_acesso']}")
        
    def test_profile_update_only_allows_nome_and_data_nascimento(self):
        """Test that profile update only allows nome and data_nascimento for corporate users"""
        # Ensure admin is seeded
        seed_admin()
        
        session = requests.Session()
        login_resp = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        
        assert login_resp.status_code == 200
        original_data = login_resp.json()
        
        # Try to update profile with nome and data_nascimento
        update_resp = session.put(f"{BASE_URL}/api/auth/profile", json={
            "nome": "Admin Updated Name",
            "data_nascimento": "1990-05-15"
        }, cookies=login_resp.cookies)
        
        assert update_resp.status_code == 200, f"Profile update failed: {update_resp.text}"
        updated_data = update_resp.json()
        
        # Verify nome was updated
        assert updated_data["nome"] == "Admin Updated Name", f"Nome should be updated, got {updated_data['nome']}"
        assert updated_data["data_nascimento"] == "1990-05-15", f"Data nascimento should be updated"
        
        # Verify setor, cargo, nivel_acesso remain unchanged (locked for corporate)
        assert updated_data["setor"] == original_data["setor"], "Setor should remain unchanged"
        assert updated_data["nivel_acesso"] == original_data["nivel_acesso"], "Nivel acesso should remain unchanged"
        
        print("SUCCESS: Profile update works for nome and data_nascimento, locked fields unchanged")
        
        # Restore original name
        session.put(f"{BASE_URL}/api/auth/profile", json={
            "nome": original_data["nome"]
        }, cookies=login_resp.cookies)


class TestAuthLogin:
    """Test that auth login still works with admin credentials"""
    
    def test_login_with_admin_credentials(self):
        """Test login with admin@vitalflow.com / Admin123!@#"""
        # First ensure admin is seeded
        seed_admin()
        
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        
        assert response.status_code == 200, f"Admin login failed: {response.text}"
        data = response.json()
        
        assert data["email"] == ADMIN_EMAIL
        assert data["nivel_acesso"] == "Gestor"
        assert "id" in data
        print(f"SUCCESS: Admin login works, user_id={data['id']}, nivel_acesso={data['nivel_acesso']}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
