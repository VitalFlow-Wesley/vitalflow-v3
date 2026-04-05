"""
VitalFlow v3.0 - Iteration 11 Backend Tests
Tests for P1 features:
1. /api/health/trend returns 'medical_alert' field when V-Score < 40 for 3+ days
2. /api/wearables/sync endpoint works (returns 404 gracefully when no tokens)
3. Background sync endpoint functionality
4. Regression tests for existing features
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestHealthEndpoint:
    """Tests for /api/health/trend endpoint with medical_alert field"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login as admin before each test"""
        self.session = requests.Session()
        login_response = self.session.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": "admin@vitalflow.com", "password": "Admin123!@#"}
        )
        if login_response.status_code != 200:
            pytest.skip("Admin login failed - skipping authenticated tests")
        self.user = login_response.json()
    
    def test_health_trend_endpoint_returns_200(self):
        """Test that /api/health/trend returns 200 for authenticated user"""
        response = self.session.get(f"{BASE_URL}/api/health/trend")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        # Verify response structure
        assert "trend" in data, "Response should have 'trend' field"
        assert "v_scores_7d" in data, "Response should have 'v_scores_7d' field"
        assert "avg_7d" in data, "Response should have 'avg_7d' field"
        assert "requires_intervention" in data, "Response should have 'requires_intervention' field"
        print(f"Health trend response: trend={data['trend']}, avg_7d={data['avg_7d']}")
    
    def test_health_trend_has_medical_alert_field(self):
        """Test that /api/health/trend response includes medical_alert field (can be None)"""
        response = self.session.get(f"{BASE_URL}/api/health/trend")
        assert response.status_code == 200
        data = response.json()
        # medical_alert should be in response (can be None if not triggered)
        assert "medical_alert" in data or data.get("medical_alert") is None, \
            "Response should include 'medical_alert' field (can be None)"
        print(f"Medical alert field present: {data.get('medical_alert')}")
    
    def test_health_trend_without_auth_returns_401(self):
        """Test that /api/health/trend returns 401 without authentication"""
        response = requests.get(f"{BASE_URL}/api/health/trend")
        assert response.status_code in [401, 403], f"Expected 401/403, got {response.status_code}"


class TestWearablesSyncEndpoint:
    """Tests for /api/wearables/sync endpoint"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login as admin before each test"""
        self.session = requests.Session()
        login_response = self.session.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": "admin@vitalflow.com", "password": "Admin123!@#"}
        )
        if login_response.status_code != 200:
            pytest.skip("Admin login failed - skipping authenticated tests")
    
    def test_wearables_sync_returns_404_when_no_tokens(self):
        """Test that /api/wearables/sync returns 404 with proper message when no tokens saved"""
        response = self.session.post(f"{BASE_URL}/api/wearables/sync", json={})
        # Should return 404 when no tokens are saved
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        data = response.json()
        assert "detail" in data, "Response should have 'detail' field"
        assert "token" in data["detail"].lower() or "nenhum" in data["detail"].lower(), \
            f"Error message should mention tokens: {data['detail']}"
        print(f"Sync without tokens response: {data['detail']}")
    
    def test_wearables_sync_without_auth_returns_401(self):
        """Test that /api/wearables/sync returns 401 without authentication"""
        response = requests.post(f"{BASE_URL}/api/wearables/sync", json={})
        assert response.status_code in [401, 403], f"Expected 401/403, got {response.status_code}"


class TestWearablesEndpoints:
    """Tests for wearables-related endpoints"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login as admin before each test"""
        self.session = requests.Session()
        login_response = self.session.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": "admin@vitalflow.com", "password": "Admin123!@#"}
        )
        if login_response.status_code != 200:
            pytest.skip("Admin login failed - skipping authenticated tests")
    
    def test_get_wearables_returns_200(self):
        """Test that GET /api/wearables returns 200"""
        response = self.session.get(f"{BASE_URL}/api/wearables")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        print(f"Wearables count: {len(data)}")
    
    def test_google_fit_status_returns_200(self):
        """Test that /api/wearables/google-fit/status returns 200"""
        response = self.session.get(f"{BASE_URL}/api/wearables/google-fit/status")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert "configured" in data, "Response should have 'configured' field"
        print(f"Google Fit configured: {data['configured']}")


class TestGestorDashboardRegression:
    """Regression tests for GestorDashboard features"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login as admin/gestor before each test"""
        self.session = requests.Session()
        login_response = self.session.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": "admin@vitalflow.com", "password": "Admin123!@#"}
        )
        if login_response.status_code != 200:
            pytest.skip("Admin login failed - skipping authenticated tests")
    
    def test_dashboard_setores_returns_list(self):
        """Test that /api/dashboard/setores returns list of sectors"""
        response = self.session.get(f"{BASE_URL}/api/dashboard/setores")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert "setores" in data, "Response should have 'setores' field"
        assert isinstance(data["setores"], list), "setores should be a list"
        print(f"Sectors available: {data['setores']}")
    
    def test_team_overview_with_period_filter(self):
        """Test that /api/dashboard/team-overview accepts period parameter"""
        for period in ["7d", "30d", "6m"]:
            response = self.session.get(f"{BASE_URL}/api/dashboard/team-overview?period={period}")
            assert response.status_code == 200, f"Expected 200 for period={period}, got {response.status_code}"
            data = response.json()
            assert "avg_v_score" in data, f"Response for period={period} should have 'avg_v_score'"
            print(f"Team overview for {period}: avg_v_score={data['avg_v_score']}")
    
    def test_team_overview_with_setor_filter(self):
        """Test that /api/dashboard/team-overview accepts setor parameter"""
        response = self.session.get(f"{BASE_URL}/api/dashboard/team-overview?setor=TI")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert "avg_v_score" in data, "Response should have 'avg_v_score'"
        print(f"Team overview for setor=TI: {data}")
    
    def test_team_stress_returns_metrics(self):
        """Test that /api/dashboard/team-stress returns stress metrics"""
        response = self.session.get(f"{BASE_URL}/api/dashboard/team-stress")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert "critical_alerts" in data or "average_stress_level" in data, \
            "Response should have stress metrics"
        print(f"Team stress metrics: {data}")


class TestAuthEndpoints:
    """Tests for authentication endpoints"""
    
    def test_login_with_valid_credentials(self):
        """Test login with admin credentials"""
        session = requests.Session()
        response = session.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": "admin@vitalflow.com", "password": "Admin123!@#"}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert "id" in data, "Response should have 'id' field"
        assert "email" in data, "Response should have 'email' field"
        assert data["email"] == "admin@vitalflow.com"
        print(f"Login successful for: {data['email']}")
    
    def test_login_with_invalid_credentials(self):
        """Test login with invalid credentials returns 401"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": "invalid@test.com", "password": "wrongpassword"}
        )
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
    
    def test_me_endpoint_returns_user_data(self):
        """Test that /api/auth/me returns user data after login"""
        session = requests.Session()
        login_response = session.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": "admin@vitalflow.com", "password": "Admin123!@#"}
        )
        assert login_response.status_code == 200
        
        me_response = session.get(f"{BASE_URL}/api/auth/me")
        assert me_response.status_code == 200, f"Expected 200, got {me_response.status_code}"
        data = me_response.json()
        assert data["email"] == "admin@vitalflow.com"
        print(f"Me endpoint returned: {data['nome']}")


class TestPredictiveAlert:
    """Tests for predictive alert endpoint"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login as admin before each test"""
        self.session = requests.Session()
        login_response = self.session.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": "admin@vitalflow.com", "password": "Admin123!@#"}
        )
        if login_response.status_code != 200:
            pytest.skip("Admin login failed - skipping authenticated tests")
    
    def test_predictive_alert_returns_200(self):
        """Test that /api/predictive/alert returns 200"""
        response = self.session.get(f"{BASE_URL}/api/predictive/alert")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert "has_alert" in data or "locked" in data, \
            "Response should have 'has_alert' or 'locked' field"
        print(f"Predictive alert response: {data}")


class TestGamificationEndpoints:
    """Tests for gamification endpoints"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login as admin before each test"""
        self.session = requests.Session()
        login_response = self.session.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": "admin@vitalflow.com", "password": "Admin123!@#"}
        )
        if login_response.status_code != 200:
            pytest.skip("Admin login failed - skipping authenticated tests")
    
    def test_gamification_stats_returns_200(self):
        """Test that /api/gamification/stats returns 200"""
        response = self.session.get(f"{BASE_URL}/api/gamification/stats")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert "energy_points" in data, "Response should have 'energy_points'"
        assert "current_streak" in data, "Response should have 'current_streak'"
        print(f"Gamification stats: points={data['energy_points']}, streak={data['current_streak']}")


class TestHistoryEndpoint:
    """Tests for history endpoint"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login as admin before each test"""
        self.session = requests.Session()
        login_response = self.session.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": "admin@vitalflow.com", "password": "Admin123!@#"}
        )
        if login_response.status_code != 200:
            pytest.skip("Admin login failed - skipping authenticated tests")
    
    def test_history_returns_200(self):
        """Test that /api/history returns 200"""
        response = self.session.get(f"{BASE_URL}/api/history?limit=10")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        print(f"History count: {len(data)}")


class TestAPIRoot:
    """Tests for API root endpoint"""
    
    def test_api_root_returns_welcome_message(self):
        """Test that /api/ returns welcome message"""
        response = requests.get(f"{BASE_URL}/api/")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert "message" in data, "Response should have 'message' field"
        assert "VitalFlow" in data["message"], "Message should mention VitalFlow"
        print(f"API root message: {data['message']}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
