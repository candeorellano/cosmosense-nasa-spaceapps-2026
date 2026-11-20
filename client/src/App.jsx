import { useEffect, useState } from 'react';
import { Activity, Heart, Thermometer, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

const CREW_MEMBERS = [
  { id: 'ASTRO-01', name: 'Cmdte. Elena Vance', role: 'Comandante' },
  { id: 'ASTRO-02', name: 'Ing. Marcus Chen', role: 'Ingeniero de Vuelo' },
  { id: 'ASTRO-03', name: 'Dra. Sofía Navarro', role: 'Especialista Médica' },
  { id: 'ASTRO-04', name: 'Esp. Liam O’Connor', role: 'Especialista de Misión' },
];

export default function App() {
  const [selectedCrew, setSelectedCrew] = useState('ASTRO-01');
  const [vitals, setVitals] = useState(null);
  const [connected, setConnected] = useState(false);
  const [history, setHistory] = useState([]);

  const [glucose, setGlucose] = useState(95);
  const [sleepHours, setSleepHours] = useState(7.5);
  const [moodScore, setMoodScore] = useState(4);
  const [checkinResult, setCheckinResult] = useState(null);
  const [checkinHistory, setCheckinHistory] = useState([]);

  const handleCheckInSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('http://localhost:8000/api/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          astronaut_id: selectedCrew,
          glucose_mg_dl: parseFloat(glucose),
          sleep_hours: parseFloat(sleepHours),
          mood_score: moodScore,
        }),
      });
      const data = await res.json();
      setCheckinResult(data.latest);
      setCheckinHistory(data.history);
    } catch (err) {
      console.error("Error al enviar autoevaluación:", err);
    }
  };

  const triggerSimulation = async (mode) => {
    try {
      await fetch(`http://localhost:8000/api/simulate/${mode}`, {
        method: 'POST',
      });
    } catch (err) {
      console.error("Error al cambiar modo de simulación:", err);
    }
  };

  useEffect(() => {
    setHistory([]);
    setCheckinResult(null);

    const fetchCheckinHistory = async () => {
      try {
        const res = await fetch(`http://localhost:8000/api/checkin/history/${selectedCrew}`);
        if (!res.ok) throw new Error('Error al cargar historial');
        const data = await res.json();
        setCheckinHistory(data);
      } catch (err) {
        console.error("Error al cargar historial:", err);
      }
    };

    const fetchTelemetry = async () => {
      try {
        const res = await fetch(`http://localhost:8000/api/vitals?astronaut_id=${selectedCrew}`);
        if (!res.ok) throw new Error('Error en la respuesta');
        const data = await res.json();
        setVitals(data);
        const timeLabel = new Date().toLocaleTimeString('es-AR', {
          hour12: false,
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        });
        setHistory((prev) => [
          ...prev.slice(-19),
          { time: timeLabel, bpm: data.heart_rate_bpm, spo2: data.spo2_percent }
        ]);
        setConnected(true);
      } catch (err) {
        setConnected(false);
      }
    };

    fetchCheckinHistory();
    fetchTelemetry();
    const interval = setInterval(fetchTelemetry, 1500);
    return () => clearInterval(interval);
  }, [selectedCrew]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 flex flex-col items-center font-sans">
      <header className="w-full max-w-5xl flex justify-between items-center py-4 border-b border-slate-800 mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-wider text-cyan-400">COSMOSENSE</h1>
          <p className="text-xs text-slate-500 uppercase tracking-widest">Astronaut Health Telemetry Module</p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`inline-block w-3 h-3 rounded-full ${connected ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
          <span className="text-xs text-slate-400">{connected ? 'ONLINE' : 'OFFLINE'}</span>
        </div>
      </header>

      {vitals ? (
        <main className="w-full max-w-5xl space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-4 rounded-xl">
            <div className="flex items-center gap-3">
              <label className="text-sm text-slate-400">Tripulante activo:</label>
              <select
                value={selectedCrew}
                onChange={(e) => setSelectedCrew(e.target.value)}
                className="bg-slate-950 border border-slate-700 text-slate-100 text-sm font-semibold rounded-lg px-3 py-1.5 focus:outline-none focus:border-cyan-400 cursor-pointer"
              >
                {CREW_MEMBERS.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.id} — {member.name} ({member.role})
                  </option>
                ))}
              </select>
            </div>
            <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full ${
              vitals.status === 'NOMINAL' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-rose-950 text-rose-400 border border-rose-800'
            }`}>
              {vitals.status === 'NOMINAL' ? <CheckCircle2 size={14} /> : <ShieldAlert size={14} />}
              ESTADO {vitals.status}
            </span>
          </div>

          {vitals.status !== 'NOMINAL' && (
            <div className="bg-rose-950/80 border border-rose-500 text-rose-200 p-4 rounded-xl flex items-center gap-3 animate-pulse">
              <ShieldAlert size={22} className="text-rose-400 shrink-0" />
              <span className="font-semibold text-sm">{vitals.alert_message}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl flex flex-col justify-between">
              <div className="flex justify-between text-slate-400 mb-2">
                <span className="text-xs uppercase tracking-wider">Ritmo Cardíaco</span>
                <Heart size={18} className="text-rose-500" />
              </div>
              <div className="text-3xl font-extrabold text-white">
                {vitals.heart_rate_bpm} <span className="text-xs font-normal text-slate-500">BPM</span>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl flex flex-col justify-between">
              <div className="flex justify-between text-slate-400 mb-2">
                <span className="text-xs uppercase tracking-wider">Oxígeno (SpO2)</span>
                <Activity size={18} className="text-cyan-400" />
              </div>
              <div className="text-3xl font-extrabold text-white">
                {vitals.spo2_percent} <span className="text-xs font-normal text-slate-500">%</span>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl flex flex-col justify-between">
              <div className="flex justify-between text-slate-400 mb-2">
                <span className="text-xs uppercase tracking-wider">Presión Arterial</span>
                <Activity size={18} className="text-indigo-400" />
              </div>
              <div className="text-3xl font-extrabold text-white">
                {vitals.systolic_bp}/{vitals.diastolic_bp} <span className="text-xs font-normal text-slate-500">mmHg</span>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl flex flex-col justify-between">
              <div className="flex justify-between text-slate-400 mb-2">
                <span className="text-xs uppercase tracking-wider">Temp. Corporal</span>
                <Thermometer size={18} className="text-amber-400" />
              </div>
              <div className="text-3xl font-extrabold text-white">
                {vitals.core_temp_c} <span className="text-xs font-normal text-slate-500">°C</span>
              </div>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl">
            <h2 className="text-xs uppercase tracking-wider text-slate-400 mb-4">
              Monitor de Ritmo Cardíaco (Tiempo Real)
            </h2>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={history}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="time" stroke="#64748b" fontSize={12} />
                  <YAxis domain={[50, 170]} stroke="#64748b" fontSize={12} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#f8fafc' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="bpm"
                    stroke="#f43f5e"
                    strokeWidth={2}
                    dot={false}
                    isAnimationActive={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl">
            <h2 className="text-xs uppercase tracking-wider text-slate-400 mb-4">
              Panel de Simulación de Emergencias
            </h2>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => triggerSimulation('NOMINAL')}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-emerald-950 text-emerald-400 border border-emerald-800 hover:bg-emerald-900 cursor-pointer"
              >
                Restaurar Nominal
              </button>
              <button
                onClick={() => triggerSimulation('TACHYCARDIA')}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-rose-950 text-rose-400 border border-rose-800 hover:bg-rose-900 cursor-pointer"
              >
                Simular Taquicardia
              </button>
              <button
                onClick={() => triggerSimulation('HYPOXIA')}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-cyan-950 text-cyan-400 border border-cyan-800 hover:bg-cyan-900 cursor-pointer"
              >
                Simular Hipoxia
              </button>
              <button
                onClick={() => triggerSimulation('FEVER')}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-amber-950 text-amber-400 border border-amber-800 hover:bg-amber-900 cursor-pointer"
              >
                Simular Fiebre
              </button>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl">
            <h2 className="text-xs uppercase tracking-wider text-slate-400 mb-4">
              Autoevaluación Diaria (Salud Metabólica y Conductual)
            </h2>

            <form onSubmit={handleCheckInSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* 1. Glucosa */}
              <div className="flex flex-col gap-2">
                <label className="text-xs text-slate-400">Glucosa en sangre (mg/dL)</label>
                <input
                  type="number"
                  step="1"
                  value={glucose}
                  onChange={(e) => setGlucose(e.target.value)}
                  className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-cyan-400"
                  required
                />
              </div>

              {/* 2. Horas de sueño */}
              <div className="flex flex-col gap-2">
                <label className="text-xs text-slate-400">Horas de sueño (últimas 24 h)</label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  max="24"
                  value={sleepHours}
                  onChange={(e) => setSleepHours(e.target.value)}
                  className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-cyan-400"
                  required
                />
              </div>

              {/* 3. Estado de ánimo (1 al 5) */}
              <div className="flex flex-col gap-2">
                <label className="text-xs text-slate-400">Estado de ánimo / Estrés (1 = Crítico, 5 = Óptimo)</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setMoodScore(num)}
                      className={`flex-1 py-2 rounded-lg text-sm font-bold border cursor-pointer transition ${
                        moodScore === num
                          ? 'bg-cyan-500 text-slate-950 border-cyan-400'
                          : 'bg-slate-950 text-slate-400 border-slate-700 hover:border-slate-500'
                      }`}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>

              {/* Botón de envío */}
              <div className="md:col-span-3 flex justify-end">
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-lg text-sm font-semibold bg-cyan-500 text-slate-950 hover:bg-cyan-400 cursor-pointer"
                >
                  Registrar Autoevaluación
                </button>
              </div>
            </form>

            {/* Resultado / Feedback del backend */}
            {checkinResult && (
              <div
                className={`mt-5 p-4 rounded-xl border text-sm ${
                  checkinResult.status === 'NOMINAL'
                    ? 'bg-emerald-950/60 border-emerald-800 text-emerald-300'
                    : checkinResult.status === 'WARNING'
                    ? 'bg-amber-950/60 border-amber-700 text-amber-300'
                    : 'bg-rose-950/60 border-rose-600 text-rose-200'
                }`}
              >
                <strong className="uppercase mr-2">[{checkinResult.status}]</strong>
                {checkinResult.feedback}
              </div>
            )}

            {/* Tabla de historial por tripulante */}
            <div className="mt-6 pt-5 border-t border-slate-800">
              <h3 className="text-xs uppercase tracking-wider text-slate-400 mb-3">
                Historial de registros — {selectedCrew}
              </h3>

              {checkinHistory.length === 0 ? (
                <p className="text-xs text-slate-500">
                  Aún no hay autoevaluaciones registradas para este tripulante.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-300">
                    <thead className="text-slate-500 uppercase border-b border-slate-800">
                      <tr>
                        <th className="py-2 pr-4">Fecha / Hora</th>
                        <th className="py-2 pr-4">Glucosa</th>
                        <th className="py-2 pr-4">Sueño</th>
                        <th className="py-2 pr-4">Ánimo</th>
                        <th className="py-2">Estado</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {checkinHistory.map((item, idx) => (
                        <tr key={idx}>
                          <td className="py-2.5 pr-4 text-slate-400">{item.timestamp}</td>
                          <td className="py-2.5 pr-4">{item.glucose_mg_dl} mg/dL</td>
                          <td className="py-2.5 pr-4">{item.sleep_hours} h</td>
                          <td className="py-2.5 pr-4">{item.mood_score}/5</td>
                          <td className="py-2.5">
                            <span className={`px-2 py-0.5 rounded-full font-semibold ${
                              item.status === 'NOMINAL'
                                ? 'bg-emerald-950 text-emerald-400'
                                : item.status === 'WARNING'
                                ? 'bg-amber-950 text-amber-400'
                                : 'bg-rose-950 text-rose-400'
                            }`}>
                              {item.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </main>
      ) : (
        <div className="text-slate-500 text-sm mt-12 animate-pulse">
          Sincronizando con telemetría de soporte vital...
        </div>
      )}
    </div>
  );
}