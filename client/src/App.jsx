import { useEffect, useState } from 'react';
import { Activity, Heart, Thermometer, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

export default function App() {
  const [vitals, setVitals] = useState(null);
  const [connected, setConnected] = useState(false);
  const [history, setHistory] = useState([]);

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
    const fetchTelemetry = async () => {
      try {
        const res = await fetch('http://localhost:8000/api/vitals');
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

    fetchTelemetry();
    const interval = setInterval(fetchTelemetry, 1500);
    return () => clearInterval(interval);
  }, []);

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
          <div className="flex items-center justify-between bg-slate-900 border border-slate-800 p-4 rounded-xl">
            <span className="text-sm text-slate-400">ID de Misión: <strong className="text-slate-200">{vitals.astronaut_id}</strong></span>
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
                  <YAxis domain={[50, 120]} stroke="#64748b" fontSize={12} />
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
        </main>
      ) : (
        <div className="text-slate-500 text-sm mt-12 animate-pulse">
          Sincronizando con telemetría de soporte vital...
        </div>
      )}
    </div>
  );
}