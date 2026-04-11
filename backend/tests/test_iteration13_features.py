"""
VitalFlow v3.2 - Iteration 13 Tests
Features to test:
1. Navbar toggle (Gestao <-> Meus Dados based on route) - Frontend only
2. Stripe real integration (POST /api/billing/create-checkout, GET /api/billing/checkout-status/{session_id}, POST /api/webhook/stripe)
3. Morning Report endpoint (GET /api/health/morning-report)
4. Stress Heatmap endpoint (GET /api/dashboard/heatmap)
5. Login flow verification
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
ADMIN_EMAIL = "admin@vitalflow.com"
ADMIN_PASSWORD = "Admin123!@#"


class TestHealthCheck:
    """Basic health check tests"""
    
    def test_api_root_returns_200(self):
        """Test that API root is accessible"""
        response = requests.get(f"{BASE_URL}/api/")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        print("PASS: API root returns 200")


class TestAuthentication:
    """Authentication flow tests"""
    
    def test_login_with_valid_credentials(self):
        """Test login with admin credentials"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}
        )
        assert response.status_code == 200, f"Login failed: {response.status_code} - {response.text}"
        data = response.json()
        assert "colaborador" in data, "Response should contain 'colaborador'"
        assert data["colaborador"]["email"] == ADMIN_EMAIL
        print(f"PASS: Login successful for {ADMIN_EMAIL}")
        return response.cookies
    
    def test_login_with_invalid_credentials(self):
        """Test login with wrong password"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": ADMIN_EMAIL, "password": "wrongpassword"}
        )
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("PASS: Invalid credentials return 401")


class TestBillingEndpoints:
    """Stripe billing integration tests"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login and get session cookies"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}
        )
        assert response.status_code == 200, "Login failed in setup"
        self.cookies = response.cookies
        self.session = requests.Session()
        self.session.cookies.update(self.cookies)
    
    def test_create_checkout_endpoint_exists(self):
        """Test POST /api/billing/create-checkout endpoint exists"""
        # Admin is already premium, so should return 400 with 'Voce ja e Premium'
        response = self.session.post(
            f"{BASE_URL}/api/billing/create-checkout",
            json={"plan_id": "premium_monthly", "origin_url": "https://example.com"}
        )
        # Premium user should get 400 with specific message
        if response.status_code == 400:
            data = response.json()
            assert "Premium" in data.get("detail", ""), f"Expected 'Premium' in error message, got: {data}"
            print("PASS: create-checkout returns 400 'Voce ja e Premium' for premium user")
        elif response.status_code == 200:
            data = response.json()
            assert "url" in data or "session_id" in data, "Response should contain url or session_id"
            print("PASS: create-checkout returns checkout URL")
        else:
            pytest.fail(f"Unexpected status code: {response.status_code} - {response.text}")
    
    def test_checkout_status_endpoint_exists(self):
        """Test GET /api/billing/checkout-status/{session_id} endpoint exists"""
        # Use a fake session_id - should return error but endpoint should exist
        response = self.session.get(f"{BASE_URL}/api/billing/checkout-status/fake_session_123")
        # Endpoint should exist (not 404), may return 500 or error for invalid session
        assert response.status_code != 404, f"Endpoint should exist, got 404"
        print(f"PASS: checkout-status endpoint exists (status: {response.status_code})")
    
    def test_stripe_webhook_endpoint_exists(self):
        """Test POST /api/webhook/stripe endpoint exists"""
        response = requests.post(
            f"{BASE_URL}/api/webhook/stripe",
            data=b"test",
            headers={"Content-Type": "application/json"}
        )
        # Webhook should exist and return something (even error for invalid payload)
        assert response.status_code != 404, f"Webhook endpoint should exist, got 404"
        # Should return {status: ok} or {status: error}
        data = response.json()
        assert "status" in data, f"Response should contain 'status', got: {data}"
        print(f"PASS: stripe webhook endpoint exists and returns status: {data.get('status')}")


class TestMorningReportEndpoint:
    """Morning Report endpoint tests"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login and get session cookies"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}
        )
        assert response.status_code == 200, "Login failed in setup"
        self.cookies = response.cookies
        self.session = requests.Session()
        self.session.cookies.update(self.cookies)
    
    def test_morning_report_endpoint_returns_200(self):
        """Test GET /api/health/morning-report returns 200"""
        response = self.session.get(f"{BASE_URL}/api/health/morning-report")
        assert response.status_code == 200, f"Expected 200, got {response.status_code} - {response.text}"
        data = response.json()
        
        # Should have 'available' field
        assert "available" in data, f"Response should contain 'available', got: {data}"
        
        if data["available"]:
            # If available, should have sleep data
            assert "sleep_hours" in data, "Should have sleep_hours when available"
            assert "greeting" in data, "Should have greeting when available"
            assert "recovery_factor" in data, "Should have recovery_factor when available"
            assert "bpm_stress_threshold" in data, "Should have bpm_stress_threshold when available"
            print(f"PASS: morning-report returns available=True with sleep data: {data['sleep_hours']}h")
        else:
            # If not available, should have message
            assert "message" in data, "Should have message when not available"
            print(f"PASS: morning-report returns available=False with message: {data['message']}")


class TestHeatmapEndpoint:
    """Stress Heatmap endpoint tests"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login and get session cookies"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}
        )
        assert response.status_code == 200, "Login failed in setup"
        self.cookies = response.cookies
        self.session = requests.Session()
        self.session.cookies.update(self.cookies)
    
    def test_heatmap_endpoint_returns_200(self):
        """Test GET /api/dashboard/heatmap returns 200 with correct structure"""
        response = self.session.get(f"{BASE_URL}/api/dashboard/heatmap?period=7d")
        assert response.status_code == 200, f"Expected 200, got {response.status_code} - {response.text}"
        data = response.json()
        
        # Verify required fields
        assert "hourly_heatmap" in data, f"Response should contain 'hourly_heatmap', got: {list(data.keys())}"
        assert "daily_heatmap" in data, f"Response should contain 'daily_heatmap'"
        assert "peak_stress" in data, f"Response should contain 'peak_stress'"
        assert "setores" in data, f"Response should contain 'setores'"
        assert "hours" in data, f"Response should contain 'hours'"
        assert "weekdays" in data, f"Response should contain 'weekdays'"
        
        # Verify hours are 08:00-19:00
        hours = data["hours"]
        assert len(hours) == 12, f"Expected 12 hours (08:00-19:00), got {len(hours)}"
        assert hours[0] == "08:00", f"First hour should be 08:00, got {hours[0]}"
        assert hours[-1] == "19:00", f"Last hour should be 19:00, got {hours[-1]}"
        
        # Verify weekdays
        weekdays = data["weekdays"]
        assert len(weekdays) == 7, f"Expected 7 weekdays, got {len(weekdays)}"
        assert weekdays[0] == "Seg", f"First weekday should be 'Seg', got {weekdays[0]}"
        
        # Verify peak_stress structure
        peak = data["peak_stress"]
        assert "setor" in peak, "peak_stress should have 'setor'"
        assert "hour" in peak, "peak_stress should have 'hour'"
        assert "stress" in peak, "peak_stress should have 'stress'"
        
        print(f"PASS: heatmap endpoint returns correct structure with {len(data['setores'])} setores")
        print(f"  - Peak stress: {peak['setor']} at {peak['hour']} ({peak['stress']}%)")
    
    def test_heatmap_with_different_periods(self):
        """Test heatmap with 30d and 6m periods"""
        for period in ["30d", "6m"]:
            response = self.session.get(f"{BASE_URL}/api/dashboard/heatmap?period={period}")
            assert response.status_code == 200, f"Expected 200 for period={period}, got {response.status_code}"
            data = response.json()
            assert data["period"] == period, f"Period should be {period}, got {data.get('period')}"
            print(f"PASS: heatmap works with period={period}")


class TestExistingEndpoints:
    """Verify existing endpoints still work (regression tests)"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login and get session cookies"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}
        )
        assert response.status_code == 200, "Login failed in setup"
        self.cookies = response.cookies
        self.session = requests.Session()
        self.session.cookies.update(self.cookies)
    
    def test_dashboard_metrics_endpoint(self):
        """Test GET /api/dashboard/metrics (Gestor only)"""
        response = self.session.get(f"{BASE_URL}/api/dashboard/metrics")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert "total_colaboradores" in data
        print(f"PASS: dashboard/metrics returns {data['total_colaboradores']} colaboradores")
    
    def test_dashboard_setores_endpoint(self):
        """Test GET /api/dashboard/setores"""
        response = self.session.get(f"{BASE_URL}/api/dashboard/setores")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert "setores" in data
        print(f"PASS: dashboard/setores returns {len(data['setores'])} setores")
    
    def test_team_overview_endpoint(self):
        """Test GET /api/dashboard/team-overview"""
        response = self.session.get(f"{BASE_URL}/api/dashboard/team-overview?period=7d")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert "avg_v_score" in data
        assert "distribution" in data
        print(f"PASS: team-overview returns avg_v_score={data['avg_v_score']}")
    
    def test_team_overview_with_setor_filter(self):
        """Test GET /api/dashboard/team-overview with setor filter"""
        # First get available setores
        setores_response = self.session.get(f"{BASE_URL}/api/dashboard/setores")
        setores = setores_response.json().get("setores", [])
        
        if setores:
            setor = setores[0]
            response = self.session.get(f"{BASE_URL}/api/dashboard/team-overview?period=7d&setor={setor}")
            assert response.status_code == 200, f"Expected 200, got {response.status_code}"
            print(f"PASS: team-overview with setor={setor} filter works")
        else:
            print("SKIP: No setores available for filter test")
    
    def test_health_trend_endpoint(self):
        """Test GET /api/health/trend"""
        response = self.session.get(f"{BASE_URL}/api/health/trend")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert "trend" in data
        print(f"PASS: health/trend returns trend={data['trend']}")
    
    def test_gamification_stats_endpoint(self):
        """Test GET /api/gamification/stats"""
        response = self.session.get(f"{BASE_URL}/api/gamification/stats")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert "energy_points" in data
        print(f"PASS: gamification/stats returns energy_points={data['energy_points']}")
    
    def test_history_endpoint(self):
        """Test GET /api/history"""
        response = self.session.get(f"{BASE_URL}/api/history?limit=10")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert isinstance(data, list)
        print(f"PASS: history returns {len(data)} analyses")
    
    def test_wearables_endpoint(self):
        """Test GET /api/wearables"""
        response = self.session.get(f"{BASE_URL}/api/wearables")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert isinstance(data, list)
        print(f"PASS: wearables returns {len(data)} devices")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
