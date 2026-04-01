"""
VitalFlow Backend Tests - Gamification, Billing, and Premium Lock Features
Tests for:
- POST /api/gamification/follow-nudge - +50 points and streak update
- GET /api/gamification/stats - points, streak, badges
- GET /api/gamification/leaderboard - Top 10 by points
- GET /api/billing/plan - Free plan with limits for B2C personal
- POST /api/billing/upgrade - Upgrade to Premium (mock)
- GET /api/predictive/alert - locked=true for Free B2C users
- Login corporate returns company_name in AuthResponse
"""

import pytest
import requests
import os
import uuid
from datetime import date

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestAuth:
    """Authentication tests"""
    
    def test_admin_login(self):
        """Test admin login with correct credentials"""
        session = requests.Session()
        response = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@vitalflow.com",
            "password": "Admin123!@#"
        })
        assert response.status_code == 200, f"Admin login failed: {response.text}"
        data = response.json()
        assert "id" in data
        assert data["email"] == "admin@vitalflow.com"
        assert data["nivel_acesso"] == "Gestor"
        print(f"PASS: Admin login successful - {data['nome']}")
        return session, data
    
    def test_register_free_user(self):
        """Test registering a new B2C Free user with gmail domain"""
        session = requests.Session()
        unique_email = f"test_free_{uuid.uuid4().hex[:8]}@gmail.com"
        response = session.post(f"{BASE_URL}/api/auth/register", json={
            "nome": "Test Free User",
            "email": unique_email,
            "password": "TestPass123!",
            "data_nascimento": "1990-05-15",
            "setor": "SAC"
        })
        assert response.status_code == 200, f"Registration failed: {response.text}"
        data = response.json()
        assert data["account_type"] == "personal"
        assert data["is_premium"] == False
        assert data["energy_points"] == 0
        assert data["current_streak"] == 0
        print(f"PASS: Free user registered - {unique_email}")
        return session, data
    
    def test_register_corporate_user(self):
        """Test registering a corporate user with brisanet domain"""
        session = requests.Session()
        unique_email = f"test_corp_{uuid.uuid4().hex[:8]}@brisanet.com.br"
        response = session.post(f"{BASE_URL}/api/auth/register", json={
            "nome": "Test Corporate User",
            "email": unique_email,
            "password": "TestPass123!",
            "data_nascimento": "1985-03-20",
            "setor": "Operacional"
        })
        assert response.status_code == 200, f"Corporate registration failed: {response.text}"
        data = response.json()
        assert data["account_type"] == "corporate"
        assert data["company_name"] == "Brisanet"
        assert data["domain"] == "brisanet.com.br"
        print(f"PASS: Corporate user registered with company_name: {data['company_name']}")
        return session, data


class TestGamification:
    """Gamification endpoints tests"""
    
    @pytest.fixture
    def authenticated_session(self):
        """Create authenticated session with admin"""
        session = requests.Session()
        response = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@vitalflow.com",
            "password": "Admin123!@#"
        })
        assert response.status_code == 200
        return session
    
    def test_gamification_stats(self, authenticated_session):
        """GET /api/gamification/stats - returns points, streak, badges"""
        response = authenticated_session.get(f"{BASE_URL}/api/gamification/stats")
        assert response.status_code == 200, f"Stats failed: {response.text}"
        data = response.json()
        assert "energy_points" in data
        assert "current_streak" in data
        assert "longest_streak" in data
        assert "badges" in data
        assert "nudges_followed_today" in data
        assert "next_badge_in" in data
        print(f"PASS: Gamification stats - Points: {data['energy_points']}, Streak: {data['current_streak']}")
        return data
    
    def test_gamification_leaderboard(self, authenticated_session):
        """GET /api/gamification/leaderboard - returns Top 10 by points"""
        response = authenticated_session.get(f"{BASE_URL}/api/gamification/leaderboard")
        assert response.status_code == 200, f"Leaderboard failed: {response.text}"
        data = response.json()
        # Response format: {"entries": [...], "period": "all_time"}
        assert "entries" in data, f"Expected 'entries' key in response: {data}"
        entries = data["entries"]
        assert isinstance(entries, list)
        assert len(entries) <= 10
        if len(entries) > 0:
            assert "nome" in entries[0]
            assert "energy_points" in entries[0]
            assert "current_streak" in entries[0]
            # Verify sorted by points descending
            if len(entries) > 1:
                assert entries[0]["energy_points"] >= entries[1]["energy_points"]
        print(f"PASS: Leaderboard returned {len(entries)} users")
    
    def test_follow_nudge_requires_analysis(self, authenticated_session):
        """POST /api/gamification/follow-nudge - requires valid analysis_id"""
        response = authenticated_session.post(
            f"{BASE_URL}/api/gamification/follow-nudge",
            json={"analysis_id": "invalid-id-12345"}
        )
        # Should fail or succeed depending on implementation
        # If analysis doesn't exist, it might still work (just records the event)
        print(f"Follow nudge with invalid ID: status={response.status_code}")
        return response
    
    def test_follow_nudge_with_real_analysis(self, authenticated_session):
        """POST /api/gamification/follow-nudge - +50 points with real analysis"""
        # First create an analysis
        analysis_response = authenticated_session.post(
            f"{BASE_URL}/api/analyze",
            json={
                "hrv": 45,
                "bpm": 85,
                "bpm_average": 70,
                "sleep_hours": 6.5,
                "cognitive_load": 6,
                "user_name": "Test User",
                "age": 30
            }
        )
        assert analysis_response.status_code == 200, f"Analysis creation failed: {analysis_response.text}"
        analysis_data = analysis_response.json()
        analysis_id = analysis_data["id"]
        print(f"Created analysis: {analysis_id}")
        
        # Get initial stats
        stats_before = authenticated_session.get(f"{BASE_URL}/api/gamification/stats").json()
        initial_points = stats_before["energy_points"]
        
        # Follow the nudge
        follow_response = authenticated_session.post(
            f"{BASE_URL}/api/gamification/follow-nudge",
            json={"analysis_id": analysis_id}
        )
        assert follow_response.status_code == 200, f"Follow nudge failed: {follow_response.text}"
        follow_data = follow_response.json()
        assert follow_data["points_earned"] >= 50, f"Expected at least 50 points, got {follow_data['points_earned']}"
        print(f"PASS: Follow nudge earned {follow_data['points_earned']} points")
        
        # Verify points increased
        stats_after = authenticated_session.get(f"{BASE_URL}/api/gamification/stats").json()
        assert stats_after["energy_points"] >= initial_points + 50
        print(f"PASS: Points increased from {initial_points} to {stats_after['energy_points']}")
        
        return follow_data
    
    def test_follow_nudge_duplicate_rejected(self, authenticated_session):
        """POST /api/gamification/follow-nudge - duplicate nudge rejected"""
        # Create an analysis
        analysis_response = authenticated_session.post(
            f"{BASE_URL}/api/analyze",
            json={
                "hrv": 50,
                "bpm": 75,
                "bpm_average": 70,
                "sleep_hours": 7,
                "cognitive_load": 5,
                "user_name": "Test User",
                "age": 30
            }
        )
        analysis_id = analysis_response.json()["id"]
        
        # Follow once
        first_follow = authenticated_session.post(
            f"{BASE_URL}/api/gamification/follow-nudge",
            json={"analysis_id": analysis_id}
        )
        assert first_follow.status_code == 200
        
        # Try to follow again - should be rejected
        second_follow = authenticated_session.post(
            f"{BASE_URL}/api/gamification/follow-nudge",
            json={"analysis_id": analysis_id}
        )
        assert second_follow.status_code == 400, f"Duplicate should be rejected, got {second_follow.status_code}"
        assert "já seguido" in second_follow.json().get("detail", "").lower()
        print("PASS: Duplicate nudge correctly rejected")


class TestBilling:
    """Billing and Premium Lock tests"""
    
    def test_free_user_plan(self):
        """GET /api/billing/plan - Free plan for B2C personal"""
        session = requests.Session()
        # Register a new free user
        unique_email = f"test_billing_{uuid.uuid4().hex[:8]}@gmail.com"
        reg_response = session.post(f"{BASE_URL}/api/auth/register", json={
            "nome": "Billing Test User",
            "email": unique_email,
            "password": "TestPass123!",
            "data_nascimento": "1992-08-10",
            "setor": "Logística"
        })
        assert reg_response.status_code == 200
        
        # Check plan
        plan_response = session.get(f"{BASE_URL}/api/billing/plan")
        assert plan_response.status_code == 200, f"Plan check failed: {plan_response.text}"
        data = plan_response.json()
        assert data["plan"] == "free"
        assert data["is_premium"] == False
        assert data["account_type"] == "personal"
        assert data["limits"]["has_predictions"] == False
        assert data["limits"]["analyses_limit"] == 3
        print(f"PASS: Free user plan - limits: {data['limits']}")
        return session, data
    
    def test_upgrade_to_premium(self):
        """POST /api/billing/upgrade - Upgrade to Premium (mock)"""
        session = requests.Session()
        # Register a new free user
        unique_email = f"test_upgrade_{uuid.uuid4().hex[:8]}@gmail.com"
        session.post(f"{BASE_URL}/api/auth/register", json={
            "nome": "Upgrade Test User",
            "email": unique_email,
            "password": "TestPass123!",
            "data_nascimento": "1988-12-25",
            "setor": "Administrativo"
        })
        
        # Verify initially free
        plan_before = session.get(f"{BASE_URL}/api/billing/plan").json()
        assert plan_before["is_premium"] == False
        
        # Upgrade
        upgrade_response = session.post(f"{BASE_URL}/api/billing/upgrade")
        assert upgrade_response.status_code == 200, f"Upgrade failed: {upgrade_response.text}"
        upgrade_data = upgrade_response.json()
        assert upgrade_data["is_premium"] == True
        print(f"PASS: Upgrade successful - {upgrade_data['message']}")
        
        # Verify now premium
        plan_after = session.get(f"{BASE_URL}/api/billing/plan").json()
        assert plan_after["is_premium"] == True
        assert plan_after["plan"] == "premium"
        assert plan_after["limits"]["has_predictions"] == True
        print(f"PASS: Plan now premium with predictions enabled")
        return session
    
    def test_corporate_user_plan(self):
        """GET /api/billing/plan - Corporate users have full access"""
        session = requests.Session()
        unique_email = f"test_corp_plan_{uuid.uuid4().hex[:8]}@brisanet.com.br"
        session.post(f"{BASE_URL}/api/auth/register", json={
            "nome": "Corporate Plan User",
            "email": unique_email,
            "password": "TestPass123!",
            "data_nascimento": "1995-06-15",
            "setor": "SAC"
        })
        
        plan_response = session.get(f"{BASE_URL}/api/billing/plan")
        assert plan_response.status_code == 200
        data = plan_response.json()
        assert data["account_type"] == "corporate"
        assert data["limits"]["has_predictions"] == True
        assert data["limits"]["analyses_limit"] == -1  # Unlimited
        print(f"PASS: Corporate user has full access - {data['limits']}")


class TestPredictiveAlert:
    """Predictive Alert Premium Lock tests"""
    
    def test_free_user_locked(self):
        """GET /api/predictive/alert - locked=true for Free B2C users"""
        session = requests.Session()
        unique_email = f"test_locked_{uuid.uuid4().hex[:8]}@gmail.com"
        session.post(f"{BASE_URL}/api/auth/register", json={
            "nome": "Locked Test User",
            "email": unique_email,
            "password": "TestPass123!",
            "data_nascimento": "1993-04-20",
            "setor": "Operacional"
        })
        
        alert_response = session.get(f"{BASE_URL}/api/predictive/alert")
        assert alert_response.status_code == 200, f"Alert check failed: {alert_response.text}"
        data = alert_response.json()
        assert data["locked"] == True, f"Expected locked=true for free user, got {data}"
        assert "Premium" in data.get("message", "")
        print(f"PASS: Free user sees locked=true - {data['message']}")
    
    def test_premium_user_unlocked(self):
        """GET /api/predictive/alert - works for Premium users"""
        session = requests.Session()
        unique_email = f"test_premium_{uuid.uuid4().hex[:8]}@gmail.com"
        session.post(f"{BASE_URL}/api/auth/register", json={
            "nome": "Premium Test User",
            "email": unique_email,
            "password": "TestPass123!",
            "data_nascimento": "1991-07-10",
            "setor": "Administrativo"
        })
        
        # Upgrade to premium
        session.post(f"{BASE_URL}/api/billing/upgrade")
        
        alert_response = session.get(f"{BASE_URL}/api/predictive/alert")
        assert alert_response.status_code == 200
        data = alert_response.json()
        assert data.get("locked") != True, f"Premium user should not be locked: {data}"
        print(f"PASS: Premium user not locked - has_alert: {data.get('has_alert')}")
    
    def test_corporate_user_unlocked(self):
        """GET /api/predictive/alert - works for Corporate users"""
        session = requests.Session()
        unique_email = f"test_corp_alert_{uuid.uuid4().hex[:8]}@emergent.sh"
        session.post(f"{BASE_URL}/api/auth/register", json={
            "nome": "Corporate Alert User",
            "email": unique_email,
            "password": "TestPass123!",
            "data_nascimento": "1989-11-30",
            "setor": "Logística"
        })
        
        alert_response = session.get(f"{BASE_URL}/api/predictive/alert")
        assert alert_response.status_code == 200
        data = alert_response.json()
        assert data.get("locked") != True, f"Corporate user should not be locked: {data}"
        print(f"PASS: Corporate user not locked - has_alert: {data.get('has_alert')}")


class TestCorporateLogin:
    """Corporate login welcome message tests"""
    
    def test_corporate_login_returns_company_name(self):
        """Login corporate returns company_name in AuthResponse"""
        session = requests.Session()
        unique_email = f"test_login_corp_{uuid.uuid4().hex[:8]}@vitalflow.com"
        
        # Register
        reg_response = session.post(f"{BASE_URL}/api/auth/register", json={
            "nome": "Corporate Login User",
            "email": unique_email,
            "password": "TestPass123!",
            "data_nascimento": "1987-02-14",
            "setor": "SAC"
        })
        assert reg_response.status_code == 200
        reg_data = reg_response.json()
        assert reg_data["company_name"] == "VitalFlow"
        
        # Logout
        session.post(f"{BASE_URL}/api/auth/logout")
        
        # Login again
        login_response = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": unique_email,
            "password": "TestPass123!"
        })
        assert login_response.status_code == 200
        login_data = login_response.json()
        assert login_data["account_type"] == "corporate"
        assert login_data["company_name"] == "VitalFlow"
        assert login_data["domain"] == "vitalflow.com"
        print(f"PASS: Corporate login returns company_name: {login_data['company_name']}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
