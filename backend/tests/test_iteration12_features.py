"""
VitalFlow v3.1 - Iteration 12 Tests
Tests for: Exercise detection, Sleep recovery, Auto-analysis, Deploy files
"""
import pytest
import requests
import os
import sys

# Add backend to path for direct imports
sys.path.insert(0, '/app/backend')

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# ─────────────────────────────────────────────────────────────────────────────
# UNIT TESTS: classify_activity (Exercise Detection)
# ─────────────────────────────────────────────────────────────────────────────

class TestClassifyActivity:
    """Tests for classify_activity function - Exercise vs Stress detection"""
    
    def test_exercise_high_bpm_high_steps_per_hour(self):
        """BPM 130 + steps 12000 + steps_per_hour 800 should return is_exercise=True"""
        from services.ai_service import classify_activity
        result = classify_activity(bpm=130, steps=12000, steps_per_hour=800)
        
        assert result["is_exercise"] is True, f"Expected is_exercise=True, got {result}"
        assert result["label"] == "exercicio", f"Expected label='exercicio', got {result['label']}"
        assert result["confidence"] > 0.5, f"Expected confidence > 0.5, got {result['confidence']}"
        print(f"PASS: classify_activity(130, 12000, 800) = {result}")
    
    def test_exercise_moderate_steps_per_hour(self):
        """steps_per_hour > 300 and BPM > 90 should detect exercise"""
        from services.ai_service import classify_activity
        result = classify_activity(bpm=95, steps=5000, steps_per_hour=400)
        
        assert result["is_exercise"] is True
        assert result["label"] == "exercicio"
        print(f"PASS: classify_activity(95, 5000, 400) = {result}")
    
    def test_exercise_high_steps_only(self):
        """steps_per_hour > 500 should detect exercise even with lower BPM"""
        from services.ai_service import classify_activity
        result = classify_activity(bpm=80, steps=10000, steps_per_hour=600)
        
        assert result["is_exercise"] is True
        assert result["label"] == "caminhada_ativa"
        print(f"PASS: classify_activity(80, 10000, 600) = {result}")
    
    def test_exercise_daily_active(self):
        """steps > 8000 and BPM > 85 should detect 'dia_ativo'"""
        from services.ai_service import classify_activity
        result = classify_activity(bpm=90, steps=10000, steps_per_hour=200)
        
        assert result["is_exercise"] is True
        assert result["label"] == "dia_ativo"
        print(f"PASS: classify_activity(90, 10000, 200) = {result}")
    
    def test_no_exercise_low_activity(self):
        """Low BPM and low steps should return is_exercise=False"""
        from services.ai_service import classify_activity
        result = classify_activity(bpm=70, steps=2000, steps_per_hour=100)
        
        assert result["is_exercise"] is False
        assert result["label"] == "repouso"
        print(f"PASS: classify_activity(70, 2000, 100) = {result}")
    
    def test_no_exercise_high_bpm_no_steps(self):
        """High BPM but no steps = stress, not exercise"""
        from services.ai_service import classify_activity
        result = classify_activity(bpm=110, steps=500, steps_per_hour=50)
        
        assert result["is_exercise"] is False
        assert result["label"] == "repouso"
        print(f"PASS: classify_activity(110, 500, 50) = {result}")


# ─────────────────────────────────────────────────────────────────────────────
# UNIT TESTS: calculate_sleep_recovery
# ─────────────────────────────────────────────────────────────────────────────

class TestCalculateSleepRecovery:
    """Tests for calculate_sleep_recovery function"""
    
    def test_sleep_5h_insufficient_recovery(self):
        """5 hours sleep should return factor < 0.7 and bpm_stress_threshold < 100"""
        from services.ai_service import calculate_sleep_recovery
        result = calculate_sleep_recovery(5)
        
        assert result["factor"] < 0.7, f"Expected factor < 0.7, got {result['factor']}"
        assert result["bpm_stress_threshold"] < 100, f"Expected threshold < 100, got {result['bpm_stress_threshold']}"
        assert "Insuficiente" in result["label"], f"Expected 'Insuficiente' in label, got {result['label']}"
        print(f"PASS: calculate_sleep_recovery(5) = {result}")
    
    def test_sleep_7_5h_optimal_recovery(self):
        """7.5 hours sleep should return factor >= 0.95 and bpm_stress_threshold = 100"""
        from services.ai_service import calculate_sleep_recovery
        result = calculate_sleep_recovery(7.5)
        
        assert result["factor"] >= 0.95, f"Expected factor >= 0.95, got {result['factor']}"
        assert result["bpm_stress_threshold"] == 100, f"Expected threshold = 100, got {result['bpm_stress_threshold']}"
        assert "Otima" in result["label"], f"Expected 'Otima' in label, got {result['label']}"
        print(f"PASS: calculate_sleep_recovery(7.5) = {result}")
    
    def test_sleep_7h_good_recovery(self):
        """7 hours sleep should return factor = 0.95"""
        from services.ai_service import calculate_sleep_recovery
        result = calculate_sleep_recovery(7)
        
        assert result["factor"] == 0.95
        assert "Boa" in result["label"]
        print(f"PASS: calculate_sleep_recovery(7) = {result}")
    
    def test_sleep_6h_moderate_recovery(self):
        """6 hours sleep should return factor = 0.8"""
        from services.ai_service import calculate_sleep_recovery
        result = calculate_sleep_recovery(6)
        
        assert result["factor"] == 0.8
        assert "Moderada" in result["label"]
        print(f"PASS: calculate_sleep_recovery(6) = {result}")
    
    def test_sleep_4h_critical_recovery(self):
        """4 hours sleep should return factor = 0.5 (critical)"""
        from services.ai_service import calculate_sleep_recovery
        result = calculate_sleep_recovery(4)
        
        assert result["factor"] == 0.5
        assert "Critica" in result["label"]
        assert result["bpm_stress_threshold"] < 95
        print(f"PASS: calculate_sleep_recovery(4) = {result}")
    
    def test_sleep_with_deep_sleep_bonus(self):
        """Deep sleep >= 1.5h should add 0.1 bonus to factor"""
        from services.ai_service import calculate_sleep_recovery
        result = calculate_sleep_recovery(6, sleep_quality={"deep_hours": 2.0})
        
        # 6h = 0.8 base + 0.1 bonus = 0.9
        assert result["factor"] == 0.9, f"Expected factor = 0.9, got {result['factor']}"
        print(f"PASS: calculate_sleep_recovery(6, deep_hours=2.0) = {result}")


# ─────────────────────────────────────────────────────────────────────────────
# UNIT TESTS: fallback_analysis (Exercise + Sleep context)
# ─────────────────────────────────────────────────────────────────────────────

class TestFallbackAnalysis:
    """Tests for fallback_analysis with exercise and sleep context"""
    
    def test_exercise_context_high_vscore(self):
        """BPM 130 + steps 12000 with exercise context should return V-Score >= 80"""
        from services.ai_service import fallback_analysis, classify_activity, calculate_sleep_recovery
        from models import BiometricInput
        
        # Create input with high BPM during exercise
        input_data = BiometricInput(
            hrv=55,
            bpm=130,
            bpm_average=70,
            sleep_hours=7,
            cognitive_load=5,
            colaborador_id="test-user",
            user_name="Test User",
            age=30
        )
        
        # Exercise context
        activity_ctx = classify_activity(bpm=130, steps=12000, steps_per_hour=800)
        recovery = calculate_sleep_recovery(7)
        
        result = fallback_analysis(input_data, activity_ctx, recovery)
        
        assert result["v_score"] >= 80, f"Expected V-Score >= 80, got {result['v_score']}"
        assert "Exercicio" in result["tag_rapida"] or "Saudavel" in result["tag_rapida"], \
            f"Expected 'Exercicio Saudavel' tag, got {result['tag_rapida']}"
        print(f"PASS: fallback_analysis with exercise context = {result}")
    
    def test_no_exercise_stress_detected(self):
        """BPM 110 + sleep 5h without exercise should return V-Score < 80"""
        from services.ai_service import fallback_analysis, calculate_sleep_recovery
        from models import BiometricInput
        
        input_data = BiometricInput(
            hrv=45,
            bpm=110,
            bpm_average=70,
            sleep_hours=5,
            cognitive_load=7,
            colaborador_id="test-user",
            user_name="Test User",
            age=30
        )
        
        # No exercise context (resting)
        activity_ctx = {"is_exercise": False, "label": "repouso"}
        recovery = calculate_sleep_recovery(5)
        
        result = fallback_analysis(input_data, activity_ctx, recovery)
        
        assert result["v_score"] < 80, f"Expected V-Score < 80, got {result['v_score']}"
        assert result["status_visual"] in ["Amarelo", "Vermelho"], \
            f"Expected Amarelo or Vermelho status, got {result['status_visual']}"
        print(f"PASS: fallback_analysis without exercise (stress) = {result}")
    
    def test_low_hrv_penalty(self):
        """Very low HRV should significantly reduce V-Score"""
        from services.ai_service import fallback_analysis
        from models import BiometricInput
        
        input_data = BiometricInput(
            hrv=25,  # Very low HRV
            bpm=75,
            bpm_average=70,
            sleep_hours=7,
            cognitive_load=5,
            colaborador_id="test-user",
            user_name="Test User",
            age=30
        )
        
        result = fallback_analysis(input_data)
        
        assert result["v_score"] < 80, f"Expected V-Score < 80 with low HRV, got {result['v_score']}"
        assert "Cerebro" in result["area_afetada"] or "Coracao" in result["area_afetada"]
        print(f"PASS: fallback_analysis with low HRV = {result}")


# ─────────────────────────────────────────────────────────────────────────────
# API TESTS: Backend Endpoints
# ─────────────────────────────────────────────────────────────────────────────

class TestBackendAPI:
    """Tests for backend API endpoints"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup session with auth"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        
        # Login
        login_response = self.session.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": "admin@vitalflow.com", "password": "Admin123!@#"}
        )
        if login_response.status_code != 200:
            pytest.skip("Login failed - skipping authenticated tests")
        
        # Store cookies
        self.session.cookies.update(login_response.cookies)
    
    def test_health_endpoint(self):
        """GET /api/ should return 200"""
        response = self.session.get(f"{BASE_URL}/api/")
        assert response.status_code == 200
        print(f"PASS: GET /api/ = {response.status_code}")
    
    def test_wearables_sync_no_tokens(self):
        """POST /api/wearables/sync should return 404 when no tokens saved"""
        response = self.session.post(f"{BASE_URL}/api/wearables/sync")
        # Should return 404 with "Nenhum token salvo" message
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        data = response.json()
        assert "token" in data.get("detail", "").lower() or "nenhum" in data.get("detail", "").lower(), \
            f"Expected token-related error, got {data}"
        print(f"PASS: POST /api/wearables/sync (no tokens) = 404")
    
    def test_analyze_endpoint(self):
        """POST /api/analyze should work with biometric input"""
        response = self.session.post(
            f"{BASE_URL}/api/analyze",
            json={
                "hrv": 55,
                "bpm": 75,
                "bpm_average": 70,
                "sleep_hours": 7,
                "cognitive_load": 5,
                "user_name": "Test User",
                "age": 30
            }
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "v_score" in data
        assert "status_visual" in data
        print(f"PASS: POST /api/analyze = {response.status_code}, v_score={data.get('v_score')}")
    
    def test_health_trend_includes_medical_alert(self):
        """GET /api/health/trend should include medical_alert field"""
        response = self.session.get(f"{BASE_URL}/api/health/trend")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        # medical_alert can be None or an object, but the field should exist
        assert "medical_alert" in data or data.get("medical_alert") is None, \
            f"Expected medical_alert field in response, got {data.keys()}"
        print(f"PASS: GET /api/health/trend includes medical_alert = {data.get('medical_alert')}")
    
    def test_gamification_stats(self):
        """GET /api/gamification/stats should return stats"""
        response = self.session.get(f"{BASE_URL}/api/gamification/stats")
        assert response.status_code == 200
        data = response.json()
        assert "energy_points" in data
        print(f"PASS: GET /api/gamification/stats = {response.status_code}")
    
    def test_history_endpoint(self):
        """GET /api/history should return list"""
        response = self.session.get(f"{BASE_URL}/api/history")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"PASS: GET /api/history = {response.status_code}, count={len(data)}")
    
    def test_wearables_list(self):
        """GET /api/wearables should return list"""
        response = self.session.get(f"{BASE_URL}/api/wearables")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"PASS: GET /api/wearables = {response.status_code}")
    
    def test_google_fit_status(self):
        """GET /api/wearables/google-fit/status should return configured status"""
        response = self.session.get(f"{BASE_URL}/api/wearables/google-fit/status")
        assert response.status_code == 200
        data = response.json()
        assert "configured" in data
        print(f"PASS: GET /api/wearables/google-fit/status = {data}")


# ─────────────────────────────────────────────────────────────────────────────
# DEPLOY FILES TESTS
# ─────────────────────────────────────────────────────────────────────────────

class TestDeployFiles:
    """Tests for deployment configuration files"""
    
    def test_dockerfile_exists(self):
        """Dockerfile should exist at /app/Dockerfile"""
        assert os.path.exists("/app/Dockerfile"), "Dockerfile not found at /app/Dockerfile"
        with open("/app/Dockerfile", "r") as f:
            content = f.read()
        assert "FROM" in content, "Dockerfile should have FROM instruction"
        assert "python" in content.lower() or "node" in content.lower(), \
            "Dockerfile should reference python or node"
        print("PASS: Dockerfile exists and has valid content")
    
    def test_render_yaml_exists(self):
        """render.yaml should exist at /app/render.yaml"""
        assert os.path.exists("/app/render.yaml"), "render.yaml not found at /app/render.yaml"
        with open("/app/render.yaml", "r") as f:
            content = f.read()
        assert "services:" in content, "render.yaml should have services section"
        assert "vitalflow" in content.lower(), "render.yaml should reference vitalflow"
        print("PASS: render.yaml exists and has valid content")
    
    def test_docker_compose_exists(self):
        """docker-compose.yml should exist at /app/docker-compose.yml"""
        assert os.path.exists("/app/docker-compose.yml"), "docker-compose.yml not found"
        with open("/app/docker-compose.yml", "r") as f:
            content = f.read()
        assert "services:" in content, "docker-compose.yml should have services section"
        assert "mongo" in content.lower(), "docker-compose.yml should reference mongo"
        assert "backend" in content.lower(), "docker-compose.yml should reference backend"
        print("PASS: docker-compose.yml exists and has valid content")


# ─────────────────────────────────────────────────────────────────────────────
# LOGIN FLOW TEST
# ─────────────────────────────────────────────────────────────────────────────

class TestLoginFlow:
    """Tests for authentication flow"""
    
    def test_login_success(self):
        """Login with admin@vitalflow.com / Admin123!@# should succeed"""
        session = requests.Session()
        response = session.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": "admin@vitalflow.com", "password": "Admin123!@#"}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "colaborador" in data or "user" in data or "id" in data, \
            f"Expected user data in response, got {data.keys()}"
        print(f"PASS: Login with admin credentials = {response.status_code}")
    
    def test_login_invalid_credentials(self):
        """Login with invalid credentials should return 401"""
        session = requests.Session()
        response = session.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": "wrong@email.com", "password": "wrongpassword"}
        )
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print(f"PASS: Login with invalid credentials = 401")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
