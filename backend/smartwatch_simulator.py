#!/usr/bin/env python3
"""
VitalFlow - Simulador de Smartwatch
Script para simular dados de smartwatch e testar o sistema de detecção
"""

import requests
import json
import time
from datetime import datetime

# Configuração
API_URL = "https://biohack-vitals.preview.emergentagent.com/api"
# Para testar localmente: API_URL = "http://localhost:8001/api"

def simulate_normal_state():
    """Simula estado normal - sem alertas"""
    return {
        "bpm": 75,
        "hrv": 65,
        "movement_data": {
            "accelerometer_x": 0.5,
            "accelerometer_y": 0.3,
            "accelerometer_z": 0.2,
            "gyroscope_x": 0.1,
            "gyroscope_y": 0.2,
            "gyroscope_z": 0.1
        }
    }

def simulate_stress_alert():
    """Simula alerta de estresse: BPM > 100 e HRV baixo"""
    return {
        "bpm": 115,
        "hrv": 35,
        "movement_data": {
            "accelerometer_x": 0.3,
            "accelerometer_y": 0.2,
            "accelerometer_z": 0.1,
            "gyroscope_x": 0.15,
            "gyroscope_y": 0.1,
            "gyroscope_z": 0.05
        }
    }

def simulate_fatigue_signal():
    """Simula sinal de fadiga: parado por mais de 1 hora"""
    return {
        "bpm": 68,
        "hrv": 55,
        "movement_data": {
            "accelerometer_x": 0.0,
            "accelerometer_y": 0.0,
            "accelerometer_z": 0.0,
            "gyroscope_x": 0.0,
            "gyroscope_y": 0.0,
            "gyroscope_z": 0.0
        }
    }

def simulate_critical_alert():
    """Simula alerta crítico: estresse + fadiga"""
    return {
        "bpm": 110,
        "hrv": 30,
        "movement_data": {
            "accelerometer_x": 0.0,
            "accelerometer_y": 0.0,
            "accelerometer_z": 0.0,
            "gyroscope_x": 0.0,
            "gyroscope_y": 0.0,
            "gyroscope_z": 0.0
        }
    }

def test_smartwatch_analysis(scenario_name, data, token=None):
    """
    Testa o endpoint de análise do smartwatch
    """
    print(f"\n{'='*60}")
    print(f"🔬 Testando: {scenario_name}")
    print(f"{'='*60}")
    
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    
    print(f"\n📤 Enviando dados:")
    print(f"   BPM: {data['bpm']}")
    print(f"   HRV: {data['hrv']}ms")
    print(f"   Movimento: {'Parado' if all(v == 0.0 for v in data['movement_data'].values()) else 'Em movimento'}")
    
    try:
        # Para teste sem autenticação, use o webhook endpoint
        response = requests.post(
            f"{API_URL}/smartwatch/webhook",
            params={"device_token": "test_device_123"},
            json=data,
            headers=headers,
            timeout=30
        )
        
        print(f"\n📥 Resposta do servidor ({response.status_code}):")
        result = response.json()
        print(json.dumps(result, indent=2, ensure_ascii=False))
        
        if response.status_code == 200:
            print("\n✅ Teste bem-sucedido!")
        else:
            print(f"\n⚠️  Status {response.status_code}")
            
    except requests.exceptions.ConnectionError:
        print("\n❌ Erro: Não foi possível conectar ao servidor")
        print("   Verifique se o backend está rodando")
    except Exception as e:
        print(f"\n❌ Erro: {str(e)}")

def run_simulation():
    """
    Executa simulação completa de todos os cenários
    """
    print("\n" + "="*60)
    print("🏥 VitalFlow - Simulador de Smartwatch")
    print("="*60)
    print("\nEste script simula 4 cenários de dados de smartwatch:")
    print("1. Normal - Sem alertas")
    print("2. Alerta de Estresse - BPM > 100 e HRV baixo")
    print("3. Sinal de Fadiga - Parado por mais de 1 hora")
    print("4. Alerta Crítico - Estresse + Fadiga combinados")
    
    scenarios = [
        ("Cenário 1: Estado Normal", simulate_normal_state()),
        ("Cenário 2: Alerta de Estresse", simulate_stress_alert()),
        ("Cenário 3: Sinal de Fadiga", simulate_fatigue_signal()),
        ("Cenário 4: Alerta Crítico", simulate_critical_alert()),
    ]
    
    for scenario_name, data in scenarios:
        test_smartwatch_analysis(scenario_name, data)
        time.sleep(1)  # Pequena pausa entre testes
    
    print("\n" + "="*60)
    print("✨ Simulação concluída!")
    print("="*60)
    print("\nPara testar com autenticação real:")
    print("1. Faça login via /api/auth/login")
    print("2. Use o token retornado no header Authorization")
    print("3. Chame POST /api/smartwatch/analyze (em vez do webhook)")

if __name__ == "__main__":
    run_simulation()
