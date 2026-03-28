import requests
import sys
import json
from datetime import datetime

class VitalFlowAPITester:
    def __init__(self, base_url="https://biohack-vitals.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

    def log_test(self, name, success, details=""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name} - PASSED")
        else:
            print(f"❌ {name} - FAILED: {details}")
        
        self.test_results.append({
            "test": name,
            "success": success,
            "details": details
        })

    def test_health_check(self):
        """Test API health check endpoint"""
        try:
            response = requests.get(f"{self.api_url}/", timeout=10)
            success = response.status_code == 200
            details = f"Status: {response.status_code}, Response: {response.text[:100]}"
            self.log_test("Health Check", success, details)
            return success
        except Exception as e:
            self.log_test("Health Check", False, str(e))
            return False

    def test_analyze_critical_scenario(self):
        """Test analyze endpoint with critical scenario (Wesley)"""
        data = {
            "user_name": "Wesley",
            "age": 37,
            "hrv": 45,
            "bpm": 95,
            "bpm_average": 65,
            "sleep_hours": 5.0,
            "cognitive_load": 8
        }
        
        try:
            response = requests.post(f"{self.api_url}/analyze", json=data, timeout=30)
            success = response.status_code == 200
            
            if success:
                result = response.json()
                # Validate response structure
                required_fields = ["id", "v_score", "area_afetada", "status_visual", "tag_rapida", "causa_provavel", "nudge_acao", "timestamp"]
                missing_fields = [field for field in required_fields if field not in result]
                
                if missing_fields:
                    success = False
                    details = f"Missing fields: {missing_fields}"
                else:
                    # Check if it's likely a critical scenario (should be red/low score)
                    v_score = result.get("v_score", 0)
                    status = result.get("status_visual", "")
                    details = f"V-Score: {v_score}, Status: {status}, Areas: {result.get('area_afetada', [])}"
                    
                    if v_score > 70:  # This should be a critical scenario
                        print(f"⚠️  Warning: Critical scenario returned high score ({v_score})")
            else:
                details = f"Status: {response.status_code}, Response: {response.text[:200]}"
            
            self.log_test("Analyze Critical Scenario (Wesley)", success, details)
            return success, result if success else None
            
        except Exception as e:
            self.log_test("Analyze Critical Scenario (Wesley)", False, str(e))
            return False, None

    def test_analyze_optimal_scenario(self):
        """Test analyze endpoint with optimal scenario (João)"""
        data = {
            "user_name": "João",
            "age": 28,
            "hrv": 85,
            "bpm": 68,
            "bpm_average": 65,
            "sleep_hours": 8.0,
            "cognitive_load": 3
        }
        
        try:
            response = requests.post(f"{self.api_url}/analyze", json=data, timeout=30)
            success = response.status_code == 200
            
            if success:
                result = response.json()
                v_score = result.get("v_score", 0)
                status = result.get("status_visual", "")
                details = f"V-Score: {v_score}, Status: {status}, Areas: {result.get('area_afetada', [])}"
                
                if v_score < 50:  # This should be an optimal scenario
                    print(f"⚠️  Warning: Optimal scenario returned low score ({v_score})")
            else:
                details = f"Status: {response.status_code}, Response: {response.text[:200]}"
            
            self.log_test("Analyze Optimal Scenario (João)", success, details)
            return success, result if success else None
            
        except Exception as e:
            self.log_test("Analyze Optimal Scenario (João)", False, str(e))
            return False, None

    def test_analyze_warning_scenario(self):
        """Test analyze endpoint with warning scenario (Maria)"""
        data = {
            "user_name": "Maria",
            "age": 30,
            "hrv": 55,
            "bpm": 75,
            "bpm_average": 65,
            "sleep_hours": 6.5,
            "cognitive_load": 6
        }
        
        try:
            response = requests.post(f"{self.api_url}/analyze", json=data, timeout=30)
            success = response.status_code == 200
            
            if success:
                result = response.json()
                v_score = result.get("v_score", 0)
                status = result.get("status_visual", "")
                details = f"V-Score: {v_score}, Status: {status}, Areas: {result.get('area_afetada', [])}"
            else:
                details = f"Status: {response.status_code}, Response: {response.text[:200]}"
            
            self.log_test("Analyze Warning Scenario (Maria)", success, details)
            return success, result if success else None
            
        except Exception as e:
            self.log_test("Analyze Warning Scenario (Maria)", False, str(e))
            return False, None

    def test_history_endpoint(self):
        """Test history endpoint"""
        try:
            response = requests.get(f"{self.api_url}/history?limit=10", timeout=10)
            success = response.status_code == 200
            
            if success:
                result = response.json()
                details = f"Returned {len(result)} analyses"
                if len(result) > 0:
                    # Check structure of first item
                    first_item = result[0]
                    required_fields = ["id", "v_score", "area_afetada", "status_visual", "tag_rapida", "causa_provavel", "nudge_acao", "timestamp"]
                    missing_fields = [field for field in required_fields if field not in first_item]
                    if missing_fields:
                        details += f", Missing fields in first item: {missing_fields}"
            else:
                details = f"Status: {response.status_code}, Response: {response.text[:200]}"
            
            self.log_test("History Endpoint", success, details)
            return success, result if success else None
            
        except Exception as e:
            self.log_test("History Endpoint", False, str(e))
            return False, None

    def test_get_specific_analysis(self, analysis_id):
        """Test getting a specific analysis by ID"""
        if not analysis_id:
            self.log_test("Get Specific Analysis", False, "No analysis ID provided")
            return False
            
        try:
            response = requests.get(f"{self.api_url}/analysis/{analysis_id}", timeout=10)
            success = response.status_code == 200
            
            if success:
                result = response.json()
                details = f"Retrieved analysis for ID: {analysis_id}"
            else:
                details = f"Status: {response.status_code}, Response: {response.text[:200]}"
            
            self.log_test("Get Specific Analysis", success, details)
            return success
            
        except Exception as e:
            self.log_test("Get Specific Analysis", False, str(e))
            return False

    def test_invalid_data_handling(self):
        """Test API with invalid data"""
        invalid_data = {
            "user_name": "Test",
            "age": 25,
            "hrv": -10,  # Invalid negative value
            "bpm": 300,  # Invalid high value
            "bpm_average": 65,
            "sleep_hours": 25,  # Invalid high value
            "cognitive_load": 15  # Invalid high value
        }
        
        try:
            response = requests.post(f"{self.api_url}/analyze", json=invalid_data, timeout=10)
            # Should return 422 for validation error
            success = response.status_code == 422
            details = f"Status: {response.status_code} (expected 422 for validation error)"
            
            self.log_test("Invalid Data Handling", success, details)
            return success
            
        except Exception as e:
            self.log_test("Invalid Data Handling", False, str(e))
            return False

    def run_all_tests(self):
        """Run all API tests"""
        print("🧪 Starting VitalFlow API Tests...")
        print(f"🌐 Testing against: {self.base_url}")
        print("=" * 60)
        
        # Test health check first
        if not self.test_health_check():
            print("❌ Health check failed - stopping tests")
            return False
        
        # Test all three scenarios
        critical_success, critical_result = self.test_analyze_critical_scenario()
        optimal_success, optimal_result = self.test_analyze_optimal_scenario()
        warning_success, warning_result = self.test_analyze_warning_scenario()
        
        # Test history endpoint
        history_success, history_result = self.test_history_endpoint()
        
        # Test specific analysis if we have an ID
        analysis_id = None
        if critical_result and 'id' in critical_result:
            analysis_id = critical_result['id']
        elif history_result and len(history_result) > 0:
            analysis_id = history_result[0]['id']
        
        if analysis_id:
            self.test_get_specific_analysis(analysis_id)
        
        # Test invalid data handling
        self.test_invalid_data_handling()
        
        # Print summary
        print("=" * 60)
        print(f"📊 Test Summary: {self.tests_passed}/{self.tests_run} tests passed")
        
        if self.tests_passed == self.tests_run:
            print("🎉 All tests passed!")
            return True
        else:
            print("⚠️  Some tests failed. Check details above.")
            return False

def main():
    tester = VitalFlowAPITester()
    success = tester.run_all_tests()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())