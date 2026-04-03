"""
VitalFlow Iteration 9 - Backend Tests
Features to test:
1. Premium Trial 7 days: new registration gets is_premium=true and premium_expires_at 7 days in future
2. GET /api/auth/me returns premium_expires_at field
3. GET /api/billing/plan returns correct premium status
4. POST /api/auth/login works with admin credentials
"""

import pytest
import requests
import os
from datetime import datetime, timezone, timedelta

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
ADMIN_EMAIL = "admin@vitalflow.com"
ADMIN_PASSWORD = "Admin123!@#"
TRIAL_USER_EMAIL = "trial@gmail.com"
TRIAL_USER_PASSWORD = "Test123!"


class TestAuthLogin:
    """Test authentication login endpoint"""
    
    def test_login_admin_success(self):
        """POST /api/auth/login with admin credentials should succeed"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "id" in data
        assert data["email"] == ADMIN_EMAIL.lower()
        assert data["nivel_acesso"] == "Gestor"
        print(f"✓ Admin login successful: {data['nome']}")
    
    def test_login_trial_user_success(self):
        """POST /api/auth/login with trial user credentials should succeed"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": TRIAL_USER_EMAIL, "password": TRIAL_USER_PASSWORD}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "id" in data
        assert data["email"] == TRIAL_USER_EMAIL.lower()
        print(f"✓ Trial user login successful: {data['nome']}")
    
    def test_login_invalid_credentials(self):
        """POST /api/auth/login with invalid credentials should return 401"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": "invalid@test.com", "password": "wrongpassword"}
        )
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("✓ Invalid credentials correctly rejected")


class TestPremiumTrialRegistration:
    """Test that new registrations get 7-day premium trial"""
    
    def test_register_new_user_gets_premium_trial(self):
        """POST /api/auth/register should create user with is_premium=true and premium_expires_at"""
        import uuid
        unique_email = f"test_trial_{uuid.uuid4().hex[:8]}@gmail.com"
        
        response = requests.post(
            f"{BASE_URL}/api/auth/register",
            json={
                "nome": "Test Trial User",
                "email": unique_email,
                "password": "Test123!@#",
                "data_nascimento": "1990-01-15",
                "setor": "Tecnologia",
                "nivel_acesso": "User"
            }
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        
        # Verify premium trial fields
        assert data.get("is_premium") == True, f"Expected is_premium=True, got {data.get('is_premium')}"
        assert "premium_expires_at" in data, "premium_expires_at field missing"
        assert data["premium_expires_at"] is not None, "premium_expires_at should not be None"
        
        # Verify expiration is approximately 7 days from now
        expires_at = datetime.fromisoformat(data["premium_expires_at"])
        now = datetime.now(timezone.utc)
        days_until_expiry = (expires_at - now).days
        
        assert 6 <= days_until_expiry <= 7, f"Expected 6-7 days until expiry, got {days_until_expiry}"
        
        print(f"✓ New user registered with premium trial: is_premium={data['is_premium']}, expires_at={data['premium_expires_at']}")
        print(f"  Days until expiry: {days_until_expiry}")


class TestAuthMeEndpoint:
    """Test GET /api/auth/me returns premium_expires_at field"""
    
    @pytest.fixture
    def admin_session(self):
        """Get authenticated session for admin"""
        session = requests.Session()
        response = session.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}
        )
        assert response.status_code == 200
        return session
    
    @pytest.fixture
    def trial_session(self):
        """Get authenticated session for trial user"""
        session = requests.Session()
        response = session.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": TRIAL_USER_EMAIL, "password": TRIAL_USER_PASSWORD}
        )
        assert response.status_code == 200
        return session
    
    def test_auth_me_returns_premium_expires_at_for_admin(self, admin_session):
        """GET /api/auth/me should return premium_expires_at field for admin"""
        response = admin_session.get(f"{BASE_URL}/api/auth/me")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "premium_expires_at" in data, "premium_expires_at field missing from /api/auth/me response"
        assert "is_premium" in data, "is_premium field missing"
        
        # Admin with corporate account should always be premium
        print(f"✓ Admin /api/auth/me: is_premium={data['is_premium']}, premium_expires_at={data.get('premium_expires_at')}")
    
    def test_auth_me_returns_premium_expires_at_for_trial_user(self, trial_session):
        """GET /api/auth/me should return premium_expires_at field for trial user"""
        response = trial_session.get(f"{BASE_URL}/api/auth/me")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "premium_expires_at" in data, "premium_expires_at field missing from /api/auth/me response"
        assert "is_premium" in data, "is_premium field missing"
        
        print(f"✓ Trial user /api/auth/me: is_premium={data['is_premium']}, premium_expires_at={data.get('premium_expires_at')}")


class TestBillingPlan:
    """Test GET /api/billing/plan returns correct premium status"""
    
    @pytest.fixture
    def admin_session(self):
        """Get authenticated session for admin"""
        session = requests.Session()
        response = session.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}
        )
        assert response.status_code == 200
        return session
    
    @pytest.fixture
    def trial_session(self):
        """Get authenticated session for trial user"""
        session = requests.Session()
        response = session.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": TRIAL_USER_EMAIL, "password": TRIAL_USER_PASSWORD}
        )
        assert response.status_code == 200
        return session
    
    def test_billing_plan_for_corporate_admin(self, admin_session):
        """GET /api/billing/plan for corporate admin should return corporate plan"""
        response = admin_session.get(f"{BASE_URL}/api/billing/plan")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "plan" in data
        assert "is_premium" in data
        assert "account_type" in data
        assert "limits" in data
        
        # Admin with corporate account should have corporate plan
        print(f"✓ Admin billing plan: plan={data['plan']}, is_premium={data['is_premium']}, account_type={data['account_type']}")
    
    def test_billing_plan_for_trial_user(self, trial_session):
        """GET /api/billing/plan for trial user should return premium plan (during trial)"""
        response = trial_session.get(f"{BASE_URL}/api/billing/plan")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "plan" in data
        assert "is_premium" in data
        assert "account_type" in data
        assert "limits" in data
        
        # Trial user should have premium plan during trial period
        print(f"✓ Trial user billing plan: plan={data['plan']}, is_premium={data['is_premium']}, account_type={data['account_type']}")


class TestHealthCheck:
    """Basic health check tests"""
    
    def test_api_root(self):
        """GET /api/ should return welcome message"""
        response = requests.get(f"{BASE_URL}/api/")
        assert response.status_code == 200
        print("✓ API root endpoint working")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
