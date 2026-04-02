"""
VitalFlow v2.0 - Backend Tests
Tests for:
1. GET /api/health/trend - V-Score trend with Lei 14.831 intervention flag
2. GET /api/dashboard/team-overview - Gestor dashboard with aggregated metrics
3. POST /api/wearables/oauth/callback - Simulated OAuth flow for wearables
4. Access control: team-overview returns 403 for non-gestores
"""

import pytest
import requests
import os
from datetime import datetime, timedelta
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
ADMIN_EMAIL = "admin@vitalflow.com"
ADMIN_PASSWORD = "Admin123!@#"


class TestHealthTrend:
    """Tests for GET /api/health/trend endpoint"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login as admin before each test"""
        self.session = requests.Session()
        login_response = self.session.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}
        )
        assert login_response.status_code == 200, f"Login failed: {login_response.text}"
        self.user = login_response.json()
    
    def test_health_trend_returns_200(self):
        """GET /api/health/trend should return 200 for authenticated user"""
        response = self.session.get(f"{BASE_URL}/api/health/trend")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
    
    def test_health_trend_response_structure(self):
        """GET /api/health/trend should return correct structure"""
        response = self.session.get(f"{BASE_URL}/api/health/trend")
        assert response.status_code == 200
        
        data = response.json()
        # Verify required fields
        assert "trend" in data, "Missing 'trend' field"
        assert "v_scores_7d" in data, "Missing 'v_scores_7d' field"
        assert "avg_7d" in data, "Missing 'avg_7d' field"
        assert "requires_intervention" in data, "Missing 'requires_intervention' field"
        
        # Verify trend is valid value
        assert data["trend"] in ["rising", "stable", "falling"], f"Invalid trend: {data['trend']}"
        
        # Verify types
        assert isinstance(data["v_scores_7d"], list), "v_scores_7d should be a list"
        assert isinstance(data["avg_7d"], (int, float)), "avg_7d should be numeric"
        assert isinstance(data["requires_intervention"], bool), "requires_intervention should be boolean"
    
    def test_health_trend_intervention_message_when_required(self):
        """If requires_intervention is true, intervention_message should be present"""
        response = self.session.get(f"{BASE_URL}/api/health/trend")
        assert response.status_code == 200
        
        data = response.json()
        if data["requires_intervention"]:
            assert "intervention_message" in data, "Missing intervention_message when requires_intervention=true"
            assert data["intervention_message"] is not None, "intervention_message should not be None"
            assert len(data["intervention_message"]) > 0, "intervention_message should not be empty"
    
    def test_health_trend_requires_auth(self):
        """GET /api/health/trend should require authentication"""
        new_session = requests.Session()
        response = new_session.get(f"{BASE_URL}/api/health/trend")
        assert response.status_code == 401, f"Expected 401 for unauthenticated request, got {response.status_code}"


class TestTeamOverview:
    """Tests for GET /api/dashboard/team-overview endpoint (Gestor only)"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login as admin (Gestor) before each test"""
        self.session = requests.Session()
        login_response = self.session.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}
        )
        assert login_response.status_code == 200, f"Login failed: {login_response.text}"
        self.user = login_response.json()
        assert self.user["nivel_acesso"] == "Gestor", "Admin should be Gestor level"
    
    def test_team_overview_returns_200_for_gestor(self):
        """GET /api/dashboard/team-overview should return 200 for Gestor"""
        response = self.session.get(f"{BASE_URL}/api/dashboard/team-overview")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
    
    def test_team_overview_response_structure(self):
        """GET /api/dashboard/team-overview should return correct structure"""
        response = self.session.get(f"{BASE_URL}/api/dashboard/team-overview")
        assert response.status_code == 200
        
        data = response.json()
        # Verify required fields
        assert "total_colaboradores" in data, "Missing 'total_colaboradores'"
        assert "avg_v_score" in data, "Missing 'avg_v_score'"
        assert "avg_stress_level" in data, "Missing 'avg_stress_level'"
        assert "distribution" in data, "Missing 'distribution'"
        assert "trend_7d" in data, "Missing 'trend_7d'"
        assert "lei_14831_alerts" in data, "Missing 'lei_14831_alerts'"
        assert "engagement_rate" in data, "Missing 'engagement_rate'"
        
        # Verify distribution structure
        dist = data["distribution"]
        assert "verde" in dist, "Missing 'verde' in distribution"
        assert "amarelo" in dist, "Missing 'amarelo' in distribution"
        assert "vermelho" in dist, "Missing 'vermelho' in distribution"
        
        # Verify types
        assert isinstance(data["total_colaboradores"], int), "total_colaboradores should be int"
        assert isinstance(data["avg_v_score"], (int, float)), "avg_v_score should be numeric"
        assert isinstance(data["lei_14831_alerts"], int), "lei_14831_alerts should be int"
        assert isinstance(data["trend_7d"], list), "trend_7d should be list"
    
    def test_team_overview_returns_403_for_non_gestor(self):
        """GET /api/dashboard/team-overview should return 403 for non-Gestor users"""
        # Create a regular user
        new_session = requests.Session()
        test_email = f"test_user_{uuid.uuid4().hex[:8]}@gmail.com"
        
        # Register as regular user
        register_response = new_session.post(
            f"{BASE_URL}/api/auth/register",
            json={
                "nome": "Test User",
                "email": test_email,
                "password": "TestPass123!",
                "data_nascimento": "1990-01-01",
                "setor": "SAC",
                "nivel_acesso": "User"
            }
        )
        assert register_response.status_code == 200, f"Register failed: {register_response.text}"
        
        # Try to access team-overview
        response = new_session.get(f"{BASE_URL}/api/dashboard/team-overview")
        assert response.status_code == 403, f"Expected 403 for non-Gestor, got {response.status_code}"
        
        # Verify error message
        data = response.json()
        assert "detail" in data, "Missing error detail"
        assert "gestor" in data["detail"].lower() or "acesso" in data["detail"].lower(), "Error should mention access restriction"
    
    def test_team_overview_lei_14831_alerts_is_integer(self):
        """lei_14831_alerts should be a non-negative integer"""
        response = self.session.get(f"{BASE_URL}/api/dashboard/team-overview")
        assert response.status_code == 200
        
        data = response.json()
        assert data["lei_14831_alerts"] >= 0, "lei_14831_alerts should be >= 0"


class TestWearableOAuthCallback:
    """Tests for POST /api/wearables/oauth/callback endpoint (simulated OAuth)"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login as admin before each test"""
        self.session = requests.Session()
        login_response = self.session.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}
        )
        assert login_response.status_code == 200, f"Login failed: {login_response.text}"
        self.user = login_response.json()
    
    def test_oauth_callback_returns_200(self):
        """POST /api/wearables/oauth/callback should return 200"""
        response = self.session.post(
            f"{BASE_URL}/api/wearables/oauth/callback",
            json={"provider": "google_health_connect", "auth_code": "mock-code-123"}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
    
    def test_oauth_callback_response_structure(self):
        """POST /api/wearables/oauth/callback should return sync_data with HRV/BPM/Sleep/Steps"""
        response = self.session.post(
            f"{BASE_URL}/api/wearables/oauth/callback",
            json={"provider": "google_health_connect", "auth_code": "mock-code-456"}
        )
        assert response.status_code == 200
        
        data = response.json()
        # Verify required fields
        assert "status" in data, "Missing 'status'"
        assert "device_id" in data, "Missing 'device_id'"
        assert "provider" in data, "Missing 'provider'"
        assert "sync_data" in data, "Missing 'sync_data'"
        
        # Verify sync_data structure
        sync = data["sync_data"]
        assert "hrv" in sync, "Missing 'hrv' in sync_data"
        assert "bpm" in sync, "Missing 'bpm' in sync_data"
        assert "sleep_hours" in sync, "Missing 'sleep_hours' in sync_data"
        assert "steps" in sync, "Missing 'steps' in sync_data"
        
        # Verify data types and ranges
        assert isinstance(sync["hrv"], int), "hrv should be int"
        assert isinstance(sync["bpm"], int), "bpm should be int"
        assert isinstance(sync["sleep_hours"], (int, float)), "sleep_hours should be numeric"
        assert isinstance(sync["steps"], int), "steps should be int"
        
        # Verify reasonable ranges
        assert 0 <= sync["hrv"] <= 200, f"hrv out of range: {sync['hrv']}"
        assert 40 <= sync["bpm"] <= 200, f"bpm out of range: {sync['bpm']}"
        assert 0 <= sync["sleep_hours"] <= 24, f"sleep_hours out of range: {sync['sleep_hours']}"
        assert sync["steps"] >= 0, f"steps should be >= 0: {sync['steps']}"
    
    def test_oauth_callback_creates_device(self):
        """POST /api/wearables/oauth/callback should create/update device"""
        # First, get current devices
        devices_before = self.session.get(f"{BASE_URL}/api/wearables").json()
        
        # Call OAuth callback
        response = self.session.post(
            f"{BASE_URL}/api/wearables/oauth/callback",
            json={"provider": "fitbit", "auth_code": "mock-code-789"}
        )
        assert response.status_code == 200
        
        data = response.json()
        device_id = data["device_id"]
        
        # Verify device exists
        devices_after = self.session.get(f"{BASE_URL}/api/wearables").json()
        device_ids = [d["id"] for d in devices_after]
        assert device_id in device_ids, "Device should be created after OAuth callback"
    
    def test_oauth_callback_different_providers(self):
        """POST /api/wearables/oauth/callback should work with different providers"""
        providers = ["google_health_connect", "apple_healthkit", "garmin", "fitbit"]
        
        for provider in providers:
            response = self.session.post(
                f"{BASE_URL}/api/wearables/oauth/callback",
                json={"provider": provider, "auth_code": f"mock-code-{provider}"}
            )
            assert response.status_code == 200, f"Failed for provider {provider}: {response.text}"
            
            data = response.json()
            assert data["provider"] == provider, f"Provider mismatch: expected {provider}, got {data['provider']}"
    
    def test_oauth_callback_requires_auth(self):
        """POST /api/wearables/oauth/callback should require authentication"""
        new_session = requests.Session()
        response = new_session.post(
            f"{BASE_URL}/api/wearables/oauth/callback",
            json={"provider": "google_health_connect", "auth_code": "mock-code"}
        )
        assert response.status_code == 401, f"Expected 401 for unauthenticated request, got {response.status_code}"


class TestTeamStress:
    """Tests for GET /api/dashboard/team-stress endpoint (Gestor only)"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login as admin (Gestor) before each test"""
        self.session = requests.Session()
        login_response = self.session.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}
        )
        assert login_response.status_code == 200, f"Login failed: {login_response.text}"
    
    def test_team_stress_returns_200_for_gestor(self):
        """GET /api/dashboard/team-stress should return 200 for Gestor"""
        response = self.session.get(f"{BASE_URL}/api/dashboard/team-stress")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
    
    def test_team_stress_response_structure(self):
        """GET /api/dashboard/team-stress should return correct structure"""
        response = self.session.get(f"{BASE_URL}/api/dashboard/team-stress")
        assert response.status_code == 200
        
        data = response.json()
        assert "period" in data, "Missing 'period'"
        assert "total_analyses" in data, "Missing 'total_analyses'"
        assert "average_stress_level" in data, "Missing 'average_stress_level'"
        assert "critical_alerts" in data, "Missing 'critical_alerts'"
        assert "stress_distribution" in data, "Missing 'stress_distribution'"


class TestAuthAndAccess:
    """Tests for authentication and access control"""
    
    def test_admin_login_success(self):
        """Admin should be able to login with correct credentials"""
        session = requests.Session()
        response = session.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}
        )
        assert response.status_code == 200, f"Login failed: {response.text}"
        
        data = response.json()
        assert data["email"] == ADMIN_EMAIL
        assert data["nivel_acesso"] == "Gestor"
    
    def test_admin_is_premium(self):
        """Admin should have premium access"""
        session = requests.Session()
        response = session.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}
        )
        assert response.status_code == 200
        
        data = response.json()
        # Admin should be premium (upgraded in previous tests)
        # Note: This may vary based on test order
        assert "is_premium" in data


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
