"""
VitalFlow Iteration 8 - New Features Tests
Tests for:
1. Navbar button renamed to 'Gestao' (frontend test)
2. Onboarding Tour (frontend test)
3. Sync Feedback empty states (frontend test)
4. Google Fit architecture endpoints
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestGoogleFitEndpoints:
    """Google Fit architecture endpoints tests"""
    
    def test_google_fit_status_returns_configured_false(self):
        """GET /api/wearables/google-fit/status should return configured=false when no credentials"""
        response = requests.get(f"{BASE_URL}/api/wearables/google-fit/status")
        assert response.status_code == 200
        data = response.json()
        assert "configured" in data
        assert data["configured"] == False
        assert "message" in data
        print(f"Google Fit status: {data}")
    
    def test_google_fit_auth_returns_501_when_not_configured(self):
        """GET /api/wearables/google-fit/auth should return 501 when not configured"""
        # First login to get session
        session = requests.Session()
        login_response = session.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": "admin@vitalflow.com", "password": "Admin123!@#"}
        )
        assert login_response.status_code == 200
        
        # Try to get auth URL
        response = session.get(f"{BASE_URL}/api/wearables/google-fit/auth")
        assert response.status_code == 501
        data = response.json()
        assert "detail" in data
        assert "nao configurado" in data["detail"].lower() or "not configured" in data["detail"].lower()
        print(f"Google Fit auth response: {data}")


class TestAuthEndpoints:
    """Auth endpoints still work after changes"""
    
    def test_login_with_admin_credentials(self):
        """POST /api/auth/login with admin credentials should work"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": "admin@vitalflow.com", "password": "Admin123!@#"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["email"] == "admin@vitalflow.com"
        assert data["nivel_acesso"] == "Gestor"
        print(f"Login successful: {data['nome']}")
    
    def test_login_with_invalid_credentials(self):
        """POST /api/auth/login with invalid credentials should return 401"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": "wrong@email.com", "password": "wrongpassword"}
        )
        assert response.status_code == 401


class TestWearablesEndpoints:
    """Wearables endpoints tests"""
    
    @pytest.fixture
    def authenticated_session(self):
        """Get authenticated session"""
        session = requests.Session()
        response = session.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": "admin@vitalflow.com", "password": "Admin123!@#"}
        )
        assert response.status_code == 200
        return session
    
    def test_get_wearables_list(self, authenticated_session):
        """GET /api/wearables should return list of devices"""
        response = authenticated_session.get(f"{BASE_URL}/api/wearables")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"Wearables count: {len(data)}")


class TestHistoryEndpoints:
    """History endpoints tests"""
    
    @pytest.fixture
    def authenticated_session(self):
        """Get authenticated session"""
        session = requests.Session()
        response = session.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": "admin@vitalflow.com", "password": "Admin123!@#"}
        )
        assert response.status_code == 200
        return session
    
    def test_get_history(self, authenticated_session):
        """GET /api/history should return analysis history"""
        response = authenticated_session.get(f"{BASE_URL}/api/history?limit=30")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"History count: {len(data)}")
        if len(data) > 0:
            # Verify structure of first item
            first = data[0]
            assert "id" in first
            assert "v_score" in first
            assert "status_visual" in first


class TestGamificationEndpoints:
    """Gamification endpoints tests"""
    
    @pytest.fixture
    def authenticated_session(self):
        """Get authenticated session"""
        session = requests.Session()
        response = session.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": "admin@vitalflow.com", "password": "Admin123!@#"}
        )
        assert response.status_code == 200
        return session
    
    def test_get_gamification_stats(self, authenticated_session):
        """GET /api/gamification/stats should return stats"""
        response = authenticated_session.get(f"{BASE_URL}/api/gamification/stats")
        assert response.status_code == 200
        data = response.json()
        assert "energy_points" in data
        assert "current_streak" in data
        print(f"Energy points: {data['energy_points']}, Streak: {data['current_streak']}")


class TestRootEndpoint:
    """Root endpoint test"""
    
    def test_api_root(self):
        """GET /api/ should return welcome message"""
        response = requests.get(f"{BASE_URL}/api/")
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        assert "VitalFlow" in data["message"]
        print(f"API root: {data['message']}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
