from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from datetime import datetime
import random
import math
import time

app = FastAPI(title="CosmoSense Telemetry Service", version="1.0.0")

# Habilitar CORS para permitir peticiones desde Vite (http://localhost:5173)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Estado actual del simulador en memoria
current_mode = "NOMINAL"

class CheckInData(BaseModel):
    astronaut_id: str
    glucose_mg_dl: float
    sleep_hours: float
    mood_score: int  # 1 (muy mal / alto estrés) a 5 (óptimo)

# Historial separado por ID de tripulante
checkin_history = {
    "ASTRO-01": [],
    "ASTRO-02": [],
    "ASTRO-03": [],
    "ASTRO-04": [],
}

@app.get("/api/checkin/history/{astronaut_id}")
def get_checkin_history(astronaut_id: str):
    return checkin_history.get(astronaut_id, [])

@app.post("/api/checkin")
def submit_checkin(data: CheckInData):
    issues = []
    status = "NOMINAL"

    # Evaluación de glucosa en sangre (rango normal: 70 - 140 mg/dL)
    if data.glucose_mg_dl < 70:
        status = "CRITICAL"
        issues.append("Hipoglucemia detectada (< 70 mg/dL): ingerir carbohidratos rápidos.")
    elif data.glucose_mg_dl > 140:
        status = "WARNING"
        issues.append("Glucosa elevada (> 140 mg/dL): hidratarse y repetir medición en 2 h.")

    # Evaluación de sueño (clave en entornos sin ciclo día/noche)
    if data.sleep_hours < 6.0:
        if status == "NOMINAL":
            status = "WARNING"
        issues.append("Déficit de sueño (< 6 h): riesgo de fatiga cognitiva en operaciones.")

    # Evaluación de estado de ánimo / aislamiento
    if data.mood_score <= 2:
        if status == "NOMINAL":
            status = "WARNING"
        issues.append("Estrés elevado o bajo ánimo: programar pausa y contacto con soporte psicológico.")

    feedback = " | ".join(issues) if issues else "Autoevaluación óptima. Parámetros metabólicos y conductuales en rango."

    record = {
        "timestamp": datetime.now().strftime("%d/%m %H:%M:%S"),
        "astronaut_id": data.astronaut_id,
        "glucose_mg_dl": data.glucose_mg_dl,
        "sleep_hours": data.sleep_hours,
        "mood_score": data.mood_score,
        "status": status,
        "feedback": feedback,
    }

    if data.astronaut_id not in checkin_history:
        checkin_history[data.astronaut_id] = []

    # Guardamos el registro nuevo al principio de la lista (más reciente arriba)
    checkin_history[data.astronaut_id].insert(0, record)

    return {
        "latest": record,
        "history": checkin_history[data.astronaut_id]
    }

@app.post("/api/simulate/{mode}")
def set_simulation_mode(mode: str):
    global current_mode
    valid_modes = ["NOMINAL", "TACHYCARDIA", "HYPOXIA", "FEVER"]
    mode_upper = mode.upper()
    if mode_upper in valid_modes:
        current_mode = mode_upper
    return {"mode": current_mode}

@app.get("/api/vitals")
def get_astronaut_vitals(astronaut_id: str = "ASTRO-01"):
    current_time = time.time()

    # 1. Valores base (normales)
    base_bpm = 72 + int(6 * math.sin(current_time / 5))
    heart_rate = base_bpm + random.randint(-2, 2)
    spo2 = round(98.2 + random.uniform(-0.8, 0.8), 1)
    systolic = random.randint(114, 122)
    diastolic = random.randint(72, 80)
    core_temp = round(36.6 + random.uniform(-0.2, 0.2), 1)

    # 2. Alterar valores según la emergencia activa
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

    crew_records = checkin_history.get(astronaut_id, [])
    latest_record = crew_records[0] if crew_records else None

    return {
        "timestamp": int(current_time),
        "astronaut_id": astronaut_id,
        "heart_rate_bpm": heart_rate,
        "spo2_percent": spo2,
        "systolic_bp": systolic,
        "diastolic_bp": diastolic,
        "core_temp_c": core_temp,
        "status": status,
        "alert_message": alert_message,
        "simulation_mode": current_mode,
        "checkin": latest_record
    }