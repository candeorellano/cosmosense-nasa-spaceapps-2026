from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from datetime import datetime
import sqlite3
import json
import random
import math
import time

app = FastAPI(title="CosmoSense Telemetry Service", version="3.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DB_PATH = "cosmosense.sqlite3"

PROTOCOLS = {
    "TACHYCARDIA": {
        "title": "Protocolo de Taquicardia Severa",
        "nasa_hazard": "Campos de Gravedad (Microgravedad)",
        "explanation": "El corazón late demasiado rápido (>115 BPM). En microgravedad, el desplazamiento de fluidos hacia el torso y el desacondicionamiento cardiovascular pueden disparar el pulso.",
        "steps": [
            "Detener de inmediato cualquier actividad física o EVA.",
            "Adoptar postura de reposo y realizar respiración controlada (inhalar 4s, exhalar 6s).",
            "Ingerir 250 ml de agua con electrolitos para estabilizar el volumen sanguíneo.",
            "Repetir la medición en 5 minutos; si supera 120 BPM, preparar ECG portátil."
        ],
        "contact_ground": True,
        "ground_label": "CONTACTO INMEDIATO: Notificar al Cirujano de Vuelo en Tierra."
    },
    "HYPOXIA": {
        "title": "Protocolo de Hipoxia Crítica",
        "nasa_hazard": "Ambientes Cerrados Hostiles",
        "explanation": "La saturación de oxígeno en sangre es peligrosamente baja (<92%). Puede deberse a una falla en el sistema de soporte vital (ECLSS) o acumulación de CO2 en cabina.",
        "steps": [
            "Colocarse mascarilla de oxígeno suplementario de emergencia de inmediato.",
            "Verificar niveles de O2 y CO2 en el panel ambiental del módulo.",
            "Avisar al resto de la tripulación para comprobar si presentan síntomas similares.",
            "Si el nivel ambiental es anómalo, evacuar al módulo adyacente y sellar escotilla."
        ],
        "contact_ground": True,
        "ground_label": "EMERGENCIA CRÍTICA: Enlace prioritario con Control de Misión."
    },
    "FEVER": {
        "title": "Protocolo de Hipertermia / Fiebre",
        "nasa_hazard": "Radiación Espacial y Sistema Inmune",
        "explanation": "Temperatura corporal elevada (>38.0 °C). Los vuelos espaciales alteran la respuesta inmune y pueden reactivar infecciones latentes o provocar sobrecalentamiento en el traje.",
        "steps": [
            "Activar enfriamiento corporal (paños fríos o ajuste de refrigeración del módulo).",
            "Hidratación constante con agua y sales minerales.",
            "Administrar antipirético del botiquín médico (ej. paracetamol) según dosis estándar.",
            "Aislamiento preventivo del resto de la tripulación si hay síntomas respiratorios."
        ],
        "contact_ground": False,
        "ground_label": "MONITOREO A BORDO: Reportar en el próximo enlace programado (escalar si supera 39.5 °C)."
    },
    "HYPOGLYCEMIA": {
        "title": "Protocolo de Hipoglucemia",
        "nasa_hazard": "Ambientes Cerrados y Nutrición Espacial",
        "explanation": "Azúcar en sangre por debajo de 70 mg/dL. Puede causar mareos, confusión y pérdida de destreza motriz durante maniobras.",
        "steps": [
            "Consumir inmediatamente 15 g de carbohidratos rápidos (gel de glucosa o bebida azucarada).",
            "Permanecer en reposo y no operar controles críticos durante 15 minutos.",
            "Volver a medir la glucosa; si sigue debajo de 70 mg/dL, repetir la ingesta."
        ],
        "contact_ground": True,
        "ground_label": "AVISO PRIORITARIO: Informar al Cirujano de Vuelo si no remonta tras 15 min."
    },
    "HYPERGLYCEMIA": {
        "title": "Protocolo de Glucosa Elevada",
        "nasa_hazard": "Campos de Gravedad y Metabolismo",
        "explanation": "Azúcar en sangre superior a 140 mg/dL. La microgravedad y el estrés metabólico pueden reducir temporalmente la sensibilidad a la insulina.",
        "steps": [
            "Beber agua abundante para favorecer la regulación metabólica.",
            "Evitar carbohidratos simples en la siguiente comida de la misión.",
            "Repetir la medición de glucosa en 2 horas."
        ],
        "contact_ground": False,
        "ground_label": "SEGUIMIENTO RUTINARIO: Registrar en el reporte médico diario."
    },
    "SLEEP_DEFICIT": {
        "title": "Protocolo de Fatiga y Déficit de Sueño",
        "nasa_hazard": "Aislamiento y Confinamiento",
        "explanation": "Dormir menos de 6 horas altera el ritmo circadiano (sin ciclo natural día/noche en órbita) y aumenta el riesgo de errores operativos.",
        "steps": [
            "Posponer tareas de alta precisión o maniobras críticas si es posible.",
            "Programar un bloque de descanso de recuperación de al menos 90 minutos.",
            "Reducir exposición a luz azul de pantallas 1 hora antes del próximo turno de sueño."
        ],
        "contact_ground": False,
        "ground_label": "AJUSTE DE RUTINA: Informar al comandante para reorganizar turnos."
    },
    "LOW_MOOD": {
        "title": "Protocolo de Soporte Conductual y Estrés",
        "nasa_hazard": "Aislamiento, Confinamiento y Distancia de la Tierra",
        "explanation": "El confinamiento prolongado y el retraso en las comunicaciones con la Tierra impactan directamente en la salud mental y cohesión del equipo.",
        "steps": [
            "Tomar una pausa de 20 minutos en un área privada del módulo.",
            "Realizar sesión guiada de relajación o ejercicio aeróbico ligero.",
            "Programar una videollamada o mensaje privado con familia o equipo de psicología."
        ],
        "contact_ground": True,
        "ground_label": "SOPORTE PSICOLÓGICO: Solicitar sesión privada con el equipo de salud conductual en Tierra."
    }
}

class CheckInData(BaseModel):
    astronaut_id: str
    heart_rate_bpm: int
    spo2_percent: float
    core_temp_c: float
    glucose_mg_dl: float
    sleep_hours: float
    mood_score: int

class RoutineToggleData(BaseModel):
    astronaut_id: str
    task_id: str
    task_label: str
    points: int

# --- Funciones de Base de Datos (SQLite) ---

def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS checkins (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp TEXT NOT NULL,
            astronaut_id TEXT NOT NULL,
            heart_rate_bpm INTEGER NOT NULL,
            spo2_percent REAL NOT NULL,
            core_temp_c REAL NOT NULL,
            glucose_mg_dl REAL NOT NULL,
            sleep_hours REAL NOT NULL,
            mood_score INTEGER NOT NULL,
            status TEXT NOT NULL,
            protocols_json TEXT NOT NULL
        )
    """)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS routine_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp TEXT NOT NULL,
            date_key TEXT NOT NULL,
            astronaut_id TEXT NOT NULL,
            task_id TEXT NOT NULL,
            task_label TEXT NOT NULL,
            points INTEGER NOT NULL
        )
    """)
    conn.commit()
    conn.close()

def fetch_crew_history(astronaut_id: str):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        "SELECT * FROM checkins WHERE astronaut_id = ? ORDER BY id DESC",
        (astronaut_id,)
    )
    rows = cursor.fetchall()
    conn.close()

    history = []
    for row in rows:
        history.append({
            "id": row["id"],
            "timestamp": row["timestamp"],
            "astronaut_id": row["astronaut_id"],
            "heart_rate_bpm": row["heart_rate_bpm"],
            "spo2_percent": row["spo2_percent"],
            "core_temp_c": row["core_temp_c"],
            "glucose_mg_dl": row["glucose_mg_dl"],
            "sleep_hours": row["sleep_hours"],
            "mood_score": row["mood_score"],
            "status": row["status"],
            "protocols": json.loads(row["protocols_json"]),
        })
    return history

def save_checkin_record(record: dict):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO checkins (
            timestamp, astronaut_id, heart_rate_bpm, spo2_percent,
            core_temp_c, glucose_mg_dl, sleep_hours, mood_score,
            status, protocols_json
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        record["timestamp"],
        record["astronaut_id"],
        record["heart_rate_bpm"],
        record["spo2_percent"],
        record["core_temp_c"],
        record["glucose_mg_dl"],
        record["sleep_hours"],
        record["mood_score"],
        record["status"],
        json.dumps(record["protocols"], ensure_ascii=False),
    ))
    conn.commit()
    conn.close()

# Crear la tabla automáticamente al iniciar el servidor
init_db()

# --- Endpoints ---

@app.get("/api/checkin/history/{astronaut_id}")
def get_checkin_history(astronaut_id: str):
    return fetch_crew_history(astronaut_id)

@app.post("/api/checkin")
def submit_checkin(data: CheckInData):
    status = "NOMINAL"
    protocols = []

    if data.heart_rate_bpm > 115:
        status = "CRITICAL"
        protocols.append(PROTOCOLS["TACHYCARDIA"])

    if data.spo2_percent < 92.0:
        status = "CRITICAL"
        protocols.append(PROTOCOLS["HYPOXIA"])

    if data.core_temp_c > 38.0:
        if status == "NOMINAL":
            status = "WARNING"
        protocols.append(PROTOCOLS["FEVER"])

    if data.glucose_mg_dl < 70:
        status = "CRITICAL"
        protocols.append(PROTOCOLS["HYPOGLYCEMIA"])
    elif data.glucose_mg_dl > 140:
        if status == "NOMINAL":
            status = "WARNING"
        protocols.append(PROTOCOLS["HYPERGLYCEMIA"])

    if data.sleep_hours < 6.0:
        if status == "NOMINAL":
            status = "WARNING"
        protocols.append(PROTOCOLS["SLEEP_DEFICIT"])

    if data.mood_score <= 2:
        if status == "NOMINAL":
            status = "WARNING"
        protocols.append(PROTOCOLS["LOW_MOOD"])

    record = {
        "timestamp": datetime.now().strftime("%d/%m %H:%M:%S"),
        "astronaut_id": data.astronaut_id,
        "heart_rate_bpm": data.heart_rate_bpm,
        "spo2_percent": data.spo2_percent,
        "core_temp_c": data.core_temp_c,
        "glucose_mg_dl": data.glucose_mg_dl,
        "sleep_hours": data.sleep_hours,
        "mood_score": data.mood_score,
        "status": status,
        "protocols": protocols,
    }

    save_checkin_record(record)
    updated_history = fetch_crew_history(data.astronaut_id)

    return {
        "latest": updated_history[0],
        "history": updated_history
    }

@app.get("/api/vitals")
def get_astronaut_vitals(astronaut_id: str = "ASTRO-01"):
    current_time = time.time()
    crew_records = fetch_crew_history(astronaut_id)
    latest_record = crew_records[0] if crew_records else None

    if latest_record:
        base_bpm = latest_record["heart_rate_bpm"] + int(3 * math.sin(current_time / 5))
        heart_rate = max(40, base_bpm + random.randint(-2, 2))
        spo2 = round(min(100.0, max(70.0, latest_record["spo2_percent"] + random.uniform(-0.3, 0.3))), 1)
        core_temp = round(latest_record["core_temp_c"] + random.uniform(-0.1, 0.1), 1)
        systolic = random.randint(135, 150) if latest_record["heart_rate_bpm"] > 115 else random.randint(114, 122)
        diastolic = random.randint(82, 92) if latest_record["heart_rate_bpm"] > 115 else random.randint(72, 80)
        overall_status = latest_record["status"]
    else:
        base_bpm = 72 + int(6 * math.sin(current_time / 5))
        heart_rate = base_bpm + random.randint(-2, 2)
        spo2 = round(98.2 + random.uniform(-0.8, 0.8), 1)
        systolic = random.randint(114, 122)
        diastolic = random.randint(72, 80)
        core_temp = round(36.6 + random.uniform(-0.2, 0.2), 1)
        overall_status = "NOMINAL"

    return {
        "timestamp": int(current_time),
        "astronaut_id": astronaut_id,
        "heart_rate_bpm": heart_rate,
        "spo2_percent": spo2,
        "systolic_bp": systolic,
        "diastolic_bp": diastolic,
        "core_temp_c": core_temp,
        "status": overall_status,
        "checkin": latest_record
    }

def fetch_routine_data(astronaut_id: str):
    today_key = datetime.now().strftime("%d/%m/%Y")
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute(
        "SELECT task_id FROM routine_logs WHERE astronaut_id = ? AND date_key = ?",
        (astronaut_id, today_key)
    )
    today_completed = [row["task_id"] for row in cursor.fetchall()]

    cursor.execute(
        "SELECT id, timestamp, task_id, task_label, points FROM routine_logs WHERE astronaut_id = ? ORDER BY id DESC LIMIT 30",
        (astronaut_id,)
    )
    history = [dict(row) for row in cursor.fetchall()]
    conn.close()

    return {
        "today_completed": today_completed,
        "history": history
    }

@app.get("/api/routine/{astronaut_id}")
def get_routine(astronaut_id: str):
    return fetch_routine_data(astronaut_id)

@app.post("/api/routine/toggle")
def toggle_routine_task(data: RoutineToggleData):
    now = datetime.now()
    timestamp = now.strftime("%d/%m/%Y %H:%M:%S")
    today_key = now.strftime("%d/%m/%Y")

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        "SELECT id FROM routine_logs WHERE astronaut_id = ? AND task_id = ? AND date_key = ?",
        (data.astronaut_id, data.task_id, today_key)
    )
    existing = cursor.fetchone()

    if existing:
        cursor.execute("DELETE FROM routine_logs WHERE id = ?", (existing["id"],))
    else:
        cursor.execute("""
            INSERT INTO routine_logs (timestamp, date_key, astronaut_id, task_id, task_label, points)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (timestamp, today_key, data.astronaut_id, data.task_id, data.task_label, data.points))

    conn.commit()
    conn.close()

    return fetch_routine_data(data.astronaut_id)