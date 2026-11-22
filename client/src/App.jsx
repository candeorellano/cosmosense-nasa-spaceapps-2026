import { useEffect, useState } from 'react';
import { Activity, Heart, Thermometer, ShieldAlert, CheckCircle2, Radio, ClipboardList, Sparkles } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import BodyMap from './BodyMap';
import MissionRoutine from './MissionRoutine';

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

  // Campos de autoevaluación completa
  const [heartRate, setHeartRate] = useState(74);
  const [spo2, setSpo2] = useState(98);
  const [coreTemp, setCoreTemp] = useState(36.6);
  const [glucose, setGlucose] = useState(95);
  const [sleepHours, setSleepHours] = useState(7.5);
  const [moodScore, setMoodScore] = useState(4);

  const [checkinHistory, setCheckinHistory] = useState([]);
  const [savedNotice, setSavedNotice] = useState(false);

  const handleCheckInSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('http://localhost:8000/api/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          astronaut_id: selectedCrew,
          heart_rate_bpm: parseInt(heartRate, 10),
          spo2_percent: parseFloat(spo2),
          core_temp_c: parseFloat(coreTemp),
          glucose_mg_dl: parseFloat(glucose),
          sleep_hours: parseFloat(sleepHours),
          mood_score: moodScore,
        }),
      });
      const data = await res.json();
      setCheckinHistory(data.history);
      setSavedNotice(true);
      setTimeout(() => setSavedNotice(false), 3000);
    } catch (err) {
      console.error("Error al enviar autoevaluación:", err);
    }
  };

  useEffect(() => {
    setHistory([]);
    setSavedNotice(false);

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

  const latestCheckin = checkinHistory[0] || null;
  const activeProtocols = latestCheckin?.protocols || [];
  const overallStatus = latestCheckin?.status || 'NOMINAL';

  return (
    <div className="min-h-screen text-slate-100 p-4 md:p-6 flex flex-col items-center font-sans">
      {/* 1. BARRA SUPERIOR UNIFICADA */}
      <header className="w-full max-w-6xl glass-panel rounded-2xl px-5 py-4 mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-400 to-violet-500 flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <Sparkles size={18} className="text-slate-950" />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-widest bg-gradient-to-r from-cyan-300 via-sky-200 to-violet-300 bg-clip-text text-transparent">
              COSMOSENSE
            </h1>
            <p className="text-[10px] text-slate-400 uppercase tracking-[0.2em]">
              Bio-Telemetry &amp; Crew Health HUD
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <select
            value={selectedCrew}
            onChange={(e) => setSelectedCrew(e.target.value)}
            className="glass-inner text-slate-100 text-xs font-semibold rounded-xl px-3 py-2 focus:outline-none focus:border-cyan-400 cursor-pointer"
          >
            {CREW_MEMBERS.map((member) => (
              <option key={member.id} value={member.id} className="bg-slate-950">
                {member.id} — {member.name} ({member.role})
              </option>
            ))}
          </select>

          <span
            className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl border ${
              overallStatus === 'NOMINAL'
                ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                : overallStatus === 'WARNING'
                ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                : 'bg-rose-500/15 text-rose-300 border-rose-500/40 animate-pulse'
            }`}
          >
            {overallStatus === 'NOMINAL' ? <CheckCircle2 size={14} /> : <ShieldAlert size={14} />}
            {overallStatus}
          </span>

          <div className="flex items-center gap-1.5 pl-2 border-l border-slate-800">
            <span className={`inline-block w-2.5 h-2.5 rounded-full ${connected ? 'bg-emerald-400 shadow-[0_0_8px_#34d399]' : 'bg-rose-500'}`} />
            <span className="text-[11px] font-mono text-slate-400">{connected ? 'LIVE' : 'OFFLINE'}</span>
          </div>
        </div>
      </header>

      {vitals ? (
        <main className="w-full max-w-6xl space-y-6">
          {/* TELEMETRÍA EN VIVO */}
          <section className="space-y-4">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="glass-panel p-4 rounded-2xl flex flex-col justify-between">
                <div className="flex justify-between items-center text-slate-400 mb-2">
                  <span className="text-[11px] uppercase tracking-wider">Ritmo Cardíaco</span>
                  <Heart size={16} className="text-rose-400" />
                </div>
                <div className="text-2xl md:text-3xl font-black font-mono text-white">
                  {vitals.heart_rate_bpm} <span className="text-xs font-sans font-normal text-slate-400">BPM</span>
                </div>
              </div>

              <div className="glass-panel p-4 rounded-2xl flex flex-col justify-between">
                <div className="flex justify-between items-center text-slate-400 mb-2">
                  <span className="text-[11px] uppercase tracking-wider">Oxígeno (SpO2)</span>
                  <Activity size={16} className="text-cyan-400" />
                </div>
                <div className="text-2xl md:text-3xl font-black font-mono text-white">
                  {vitals.spo2_percent} <span className="text-xs font-sans font-normal text-slate-400">%</span>
                </div>
              </div>

              <div className="glass-panel p-4 rounded-2xl flex flex-col justify-between">
                <div className="flex justify-between items-center text-slate-400 mb-2">
                  <span className="text-[11px] uppercase tracking-wider">Presión Arterial</span>
                  <Activity size={16} className="text-violet-400" />
                </div>
                <div className="text-2xl md:text-3xl font-black font-mono text-white">
                  {vitals.systolic_bp}/{vitals.diastolic_bp} <span className="text-xs font-sans font-normal text-slate-400">mmHg</span>
                </div>
              </div>

              <div className="glass-panel p-4 rounded-2xl flex flex-col justify-between">
                <div className="flex justify-between items-center text-slate-400 mb-2">
                  <span className="text-[11px] uppercase tracking-wider">Temp. Corporal</span>
                  <Thermometer size={16} className="text-amber-400" />
                </div>
                <div className="text-2xl md:text-3xl font-black font-mono text-white">
                  {vitals.core_temp_c} <span className="text-xs font-sans font-normal text-slate-400">°C</span>
                </div>
              </div>
            </div>

            <div className="glass-panel p-5 rounded-2xl">
              <h2 className="text-[11px] uppercase tracking-widest text-cyan-300/80 font-semibold mb-4">
                Monitor de Ritmo Cardíaco (Tiempo Real)
              </h2>
              <div className="h-52 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={history}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.12)" />
                    <XAxis dataKey="time" stroke="#64748b" fontSize={11} />
                    <YAxis domain={[50, 170]} stroke="#64748b" fontSize={11} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#090e1d',
                        borderColor: 'rgba(56,189,248,0.3)',
                        borderRadius: '10px',
                        color: '#f8fafc',
                        fontSize: '12px',
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="bpm"
                      stroke="#22d3ee"
                      strokeWidth={2.5}
                      dot={false}
                      isAnimationActive={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </section>

          {/* 4. AUTOEVALUACIÓN COMPLETA + MAPA CORPORAL */}
          <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-6 glass-panel p-6 rounded-2xl space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-[11px] uppercase tracking-widest text-cyan-300/80 font-semibold">
                  Autoevaluación Diaria Completa
                </h2>
                {savedNotice && overallStatus === 'NOMINAL' && (
                  <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 size={14} /> Registro óptimo guardado
                  </span>
                )}
              </div>

              <form onSubmit={handleCheckInSubmit} className="space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] text-slate-400">Pulso (BPM)</label>
                    <input
                      type="number"
                      step="1"
                      min="30"
                      max="220"
                      value={heartRate}
                      onChange={(e) => setHeartRate(e.target.value)}
                      className="glass-inner rounded-xl px-3 py-2 text-white font-mono text-sm focus:outline-none focus:border-cyan-400"
                      required
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] text-slate-400">Oxígeno SpO2 (%)</label>
                    <input
                      type="number"
                      step="0.5"
                      min="60"
                      max="100"
                      value={spo2}
                      onChange={(e) => setSpo2(e.target.value)}
                      className="glass-inner rounded-xl px-3 py-2 text-white font-mono text-sm focus:outline-none focus:border-cyan-400"
                      required
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] text-slate-400">Temp. (°C)</label>
                    <input
                      type="number"
                      step="0.1"
                      min="34"
                      max="42"
                      value={coreTemp}
                      onChange={(e) => setCoreTemp(e.target.value)}
                      className="glass-inner rounded-xl px-3 py-2 text-white font-mono text-sm focus:outline-none focus:border-cyan-400"
                      required
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] text-slate-400">Glucosa (mg/dL)</label>
                    <input
                      type="number"
                      step="1"
                      value={glucose}
                      onChange={(e) => setGlucose(e.target.value)}
                      className="glass-inner rounded-xl px-3 py-2 text-white font-mono text-sm focus:outline-none focus:border-cyan-400"
                      required
                    />
                  </div>

                  <div className="flex flex-col gap-1.5 col-span-2">
                    <label className="text-[11px] text-slate-400">Horas de sueño (últimas 24 h)</label>
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      max="24"
                      value={sleepHours}
                      onChange={(e) => setSleepHours(e.target.value)}
                      className="glass-inner rounded-xl px-3 py-2 text-white font-mono text-sm focus:outline-none focus:border-cyan-400"
                      required
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] text-slate-400">Estado de ánimo / Estrés (1 = Crítico, 5 = Óptimo)</label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => setMoodScore(num)}
                        className={`flex-1 py-2 rounded-xl text-sm font-bold font-mono border cursor-pointer transition ${
                          moodScore === num
                            ? 'bg-gradient-to-r from-cyan-400 to-violet-400 text-slate-950 border-transparent shadow-md shadow-cyan-500/20'
                            : 'glass-inner text-slate-400 hover:border-cyan-500/40'
                        }`}
                      >
                        {num}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl text-sm font-bold bg-gradient-to-r from-cyan-400 to-violet-500 text-slate-950 hover:opacity-90 cursor-pointer transition shadow-lg shadow-cyan-500/15"
                >
                  Registrar Autoevaluación
                </button>
              </form>

              <div className="pt-4 border-t border-slate-800/80">
                <h3 className="text-[11px] uppercase tracking-wider text-slate-400 mb-3">
                  Historial reciente — {selectedCrew}
                </h3>

                {checkinHistory.length === 0 ? (
                  <p className="text-xs text-slate-500">
                    Aún no hay registros para este tripulante.
                  </p>
                ) : (
                  <div className="overflow-x-auto max-h-48 overflow-y-auto">
                    <table className="w-full text-left text-[11px] text-slate-300">
                      <thead className="text-slate-500 uppercase border-b border-slate-800/80">
                        <tr>
                          <th className="py-2 pr-2">Hora</th>
                          <th className="py-2 pr-2">BPM</th>
                          <th className="py-2 pr-2">SpO2</th>
                          <th className="py-2 pr-2">Temp</th>
                          <th className="py-2 pr-2">Gluc</th>
                          <th className="py-2">Estado</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/50 font-mono">
                        {checkinHistory.map((item, idx) => (
                          <tr key={idx}>
                            <td className="py-2 pr-2 text-slate-400">{item.timestamp.split(' ')[1]}</td>
                            <td className="py-2 pr-2">{item.heart_rate_bpm}</td>
                            <td className="py-2 pr-2">{item.spo2_percent}%</td>
                            <td className="py-2 pr-2">{item.core_temp_c}°</td>
                            <td className="py-2 pr-2">{item.glucose_mg_dl}</td>
                            <td className="py-2 font-sans">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  item.status === 'NOMINAL'
                                    ? 'bg-emerald-500/15 text-emerald-300'
                                    : item.status === 'WARNING'
                                    ? 'bg-amber-500/15 text-amber-300'
                                    : 'bg-rose-500/15 text-rose-300'
                                }`}
                              >
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

            <div className="lg:col-span-6">
              <BodyMap vitals={vitals} latestCheckin={latestCheckin} />
            </div>
          </section>

          {/* PROTOCOLOS ACTIVOS */}
          {activeProtocols.length > 0 && (
            <section className="space-y-4">
              {activeProtocols.map((proto, index) => (
                <div
                  key={index}
                  className="glass-panel border-rose-500/40 p-5 rounded-2xl space-y-4 relative overflow-hidden"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
                    <div className="flex items-center gap-2 text-rose-300">
                      <ClipboardList size={19} />
                      <h3 className="font-bold text-sm md:text-base">{proto.title}</h3>
                    </div>
                    <span className="text-[11px] font-semibold px-3 py-1 rounded-full bg-violet-500/15 text-violet-300 border border-violet-500/30">
                      Peligro NASA: {proto.nasa_hazard}
                    </span>
                  </div>

                  <p className="text-xs md:text-sm text-slate-300 leading-relaxed">
                    {proto.explanation}
                  </p>

                  <div>
                    <h4 className="text-[11px] uppercase tracking-wider text-cyan-300/80 mb-2 font-semibold">
                      Pasos inmediatos para el tripulante
                    </h4>
                    <ol className="list-decimal list-inside space-y-1 text-xs md:text-sm text-slate-200">
                      {proto.steps.map((step, i) => (
                        <li key={i}>{step}</li>
                      ))}
                    </ol>
                  </div>

                  <div
                    className={`flex items-center gap-2.5 p-3 rounded-xl text-xs font-semibold border ${
                      proto.contact_ground
                        ? 'bg-rose-500/15 border-rose-500/40 text-rose-200'
                        : 'bg-cyan-500/10 border-cyan-500/25 text-cyan-200'
                    }`}
                  >
                    <Radio size={15} className={proto.contact_ground ? 'text-rose-400 animate-pulse' : 'text-cyan-400'} />
                    <span>{proto.ground_label}</span>
                  </div>
                </div>
              ))}
            </section>
          )}

          {/* ENTORNO Y RUTINA DE MISIÓN */}
          <MissionRoutine selectedCrew={selectedCrew} />
        </main>
      ) : (
        <div className="text-cyan-400/80 text-sm font-mono mt-16 animate-pulse">
          Sincronizando con telemetría de soporte vital...
        </div>
      )}
    </div>
  );
}