from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import random
import math
import time

app = FastAPI(title="CosmoSense Telemetry Service", version="1.0.0")

#Habilitar CORS para permitir peticiones desde Vite (http://localhost:5173)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Estado actual del simulador en memoria
current_mode = "NOMINAL"

@app.post("/api/simulate/{mode}")
def set_simulation_mode(mode: str):
    global current_mode
    valid_modes = ["NOMINAL", "TACHYCARDIA", "HYPOXIA", "FEVER"]
    mode_upper = mode.upper()
    if mode_upper in valid_modes:
        current_mode = mode_upper
    return {"mode": current_mode}

@app.get("/api/vitals")
def get_astronaut_vitals():
    current_time = time.time()

    # 1. Valores base (normales) 
    base_bpm = 72 + int(6 * math.sin(current_time / 5))
    heart_rate = base_bpm + random.randint(-2,2)
    spo2 = round(98.2 + random.uniform(-0.8, 0.8), 1)
    systolic = random.randint(114, 122)
    diastolic = random.randint(72, 80)
    core_temp = round(36.6 + random.uniform(-0.2, 0.2), 1)

    # 2. Alterar valores segun la emergencia activa
    if current_mode == "TACHYCARDIA":
        heart_rate = random.randint(130, 155)
        systolic = random.randint(135, 150)
    elif current_mode == "HYPOXIA":
        spo2 = round(random.uniform(84.0, 90.0), 1)
        heart_rate = random.randint(105, 120)
    elif current_mode == "FEVER":
        core_temp = round(random.uniform(38.6, 39.8), 1)
        heart_rate = random.randint(95, 110)

    # 3. Evaluación automática de alertas
    status = "NOMINAL"
    alert_message = "Todos los parámetros dentro de rangos normales."

    if heart_rate > 115:
        status = "CRITICAL"
        alert_message = "ALERTA: Taquicardia severa detectada."
    elif spo2 < 92.0:
        status = "CRITICAL"
        alert_message = "ALERTA: Hipoxia crítica (bajo nivel de oxígeno)."
    elif core_temp > 38.0:
        status = "WARNING"
        alert_message = "ADVERTENCIA: Hipertermia / fiebre detectada."

    return {
        "timestamp": int(current_time),
        "astronaut_id": "ASTRO-01",
        "heart_rate_bpm": heart_rate,
        "spo2_percent": spo2,
        "systolic_bp": systolic,
        "diastolic_bp": diastolic,
        "core_temp_c": core_temp,
        "status": status,
        "alert_message": alert_message,
        "simulation_mode": current_mode
    }
