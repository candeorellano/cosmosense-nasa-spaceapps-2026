import { useEffect, useState } from 'react';
import { Globe, CheckCircle2, Circle, Trophy, AlertTriangle, Radio, Clock } from 'lucide-react';

const ENVIRONMENTS = {
  ISS: {
    name: 'Estación Espacial (ISS)',
    gravity: '0g (Microgravedad)',
    signalDelay: '< 1 segundo',
    primaryRisk: 'Desacondicionamiento cardiovascular y pérdida de densidad ósea.',
    badgeColor: 'text-cyan-300 border-cyan-500/30 bg-cyan-500/10',
  },
  ARTEMIS: {
    name: 'Base Lunar Artemis',
    gravity: '0.16g (1/6 Tierra)',
    signalDelay: '~2.6 segundos',
    primaryRisk: 'Exposición a polvo lunar (regolito), radiación solar y fatiga en caminatas (EVA).',
    badgeColor: 'text-violet-300 border-violet-500/30 bg-violet-500/10',
  },
  MARS: {
    name: 'Tránsito a Marte',
    gravity: '0g / 0.38g',
    signalDelay: 'Hasta 22 minutos',
    primaryRisk: 'Aislamiento extremo, radiación cósmica galáctica y autonomía médica total.',
    badgeColor: 'text-amber-300 border-amber-500/30 bg-amber-500/10',
  },
};

const DAILY_TASKS = [
  { id: 'checkin', label: 'Completar autoevaluación diaria', points: 25 },
  { id: 'exercise', label: 'Ejercicio de resistencia en microgravedad (2 h)', points: 25 },
  { id: 'hydration', label: 'Hidratación y balance de electrolitos (2.5 L)', points: 20 },
  { id: 'radiation', label: 'Verificar dosímetro de radiación personal', points: 15 },
  { id: 'wellness', label: 'Pausa de salud conductual / enlace con Tierra', points: 15 },
];

export default function MissionRoutine({ selectedCrew }) {
  const [environment, setEnvironment] = useState('ISS');
  const [todayCompleted, setTodayCompleted] = useState([]);
  const [routineHistory, setRoutineHistory] = useState([]);

  const currentEnv = ENVIRONMENTS[environment];

  useEffect(() => {
    const fetchRoutine = async () => {
      try {
        const res = await fetch(`http://localhost:8000/api/routine/${selectedCrew}`);
        if (!res.ok) throw new Error('Error al cargar rutina');
        const data = await res.json();
        setTodayCompleted(data.today_completed || []);
        setRoutineHistory(data.history || []);
      } catch (err) {
        console.error('Error al cargar rutina diaria:', err);
      }
    };

    fetchRoutine();
  }, [selectedCrew]);

  const toggleTask = async (task) => {
    try {
      const res = await fetch('http://localhost:8000/api/routine/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          astronaut_id: selectedCrew,
          task_id: task.id,
          task_label: task.label,
          points: task.points,
        }),
      });
      const data = await res.json();
      setTodayCompleted(data.today_completed || []);
      setRoutineHistory(data.history || []);
    } catch (err) {
      console.error('Error al actualizar tarea:', err);
    }
  };

  const totalPoints = DAILY_TASKS.reduce((acc, t) => acc + t.points, 0);
  const earnedPoints = DAILY_TASKS.filter((t) => todayCompleted.includes(t.id)).reduce(
    (acc, t) => acc + t.points,
    0
  );
  const progressPercent = Math.round((earnedPoints / totalPoints) * 100);

  return (
    <section className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
      {/* Entorno de Misión */}
      <div className="glass-panel p-5 rounded-2xl flex flex-col justify-between space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-cyan-300/80">
            <Globe size={15} />
            <h2 className="text-[11px] uppercase tracking-widest font-semibold">Entorno de Misión</h2>
          </div>
          <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${currentEnv.badgeColor}`}>
            {currentEnv.gravity}
          </span>
        </div>

        <div className="flex gap-2">
          {Object.keys(ENVIRONMENTS).map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setEnvironment(key)}
              className={`flex-1 py-2 px-2 rounded-xl text-xs font-bold border cursor-pointer transition ${
                environment === key
                  ? 'bg-gradient-to-r from-cyan-400 to-violet-400 text-slate-950 border-transparent'
                  : 'glass-inner text-slate-400 hover:border-cyan-500/40'
              }`}
            >
              {key === 'ISS' ? 'Estación ISS' : key === 'ARTEMIS' ? 'Base Lunar' : 'Marte'}
            </button>
          ))}
        </div>

        <div className="glass-inner rounded-xl p-3.5 space-y-2 text-xs">
          <div className="flex items-center justify-between text-slate-400">
            <span className="flex items-center gap-1.5">
              <Radio size={13} className="text-violet-400" />
              Retraso de comunicación:
            </span>
            <strong className="font-mono text-slate-200">{currentEnv.signalDelay}</strong>
          </div>
          <div className="flex items-start gap-2 pt-2 border-t border-slate-800/80 text-slate-300">
            <AlertTriangle size={14} className="text-amber-400 shrink-0 mt-0.5" />
            <span>
              <strong className="text-amber-300">Riesgo principal:</strong> {currentEnv.primaryRisk}
            </span>
          </div>
        </div>
      </div>

      {/* Rutina Diaria + Historial */}
      <div className="glass-panel p-5 rounded-2xl flex flex-col justify-between space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-cyan-300/80">
            <Trophy size={15} className={progressPercent === 100 ? 'text-amber-400' : 'text-cyan-400'} />
            <h2 className="text-[11px] uppercase tracking-widest font-semibold">
              Rutina Diaria — {selectedCrew}
            </h2>
          </div>
          <span className="text-xs font-mono font-bold text-cyan-300">
            {earnedPoints}/{totalPoints} PTS ({progressPercent}%)
          </span>
        </div>

        <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
          <div
            className={`h-full transition-all duration-300 ${
              progressPercent === 100
                ? 'bg-gradient-to-r from-emerald-400 to-cyan-300'
                : 'bg-gradient-to-r from-cyan-400 to-violet-500'
            }`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        <div className="space-y-1.5">
          {DAILY_TASKS.map((task) => {
            const isDone = todayCompleted.includes(task.id);
            return (
              <button
                key={task.id}
                type="button"
                onClick={() => toggleTask(task)}
                className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl text-xs border text-left cursor-pointer transition ${
                  isDone
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                    : 'glass-inner text-slate-300 hover:border-cyan-500/35'
                }`}
              >
                <span className="flex items-center gap-2">
                  {isDone ? (
                    <CheckCircle2 size={15} className="text-emerald-400 shrink-0" />
                  ) : (
                    <Circle size={15} className="text-slate-600 shrink-0" />
                  )}
                  <span className={isDone ? 'line-through opacity-75' : ''}>{task.label}</span>
                </span>
                <span className="text-[11px] font-mono text-slate-400 shrink-0">+{task.points}</span>
              </button>
            );
          })}
        </div>

        {/* Historial de rutina con fecha y hora */}
        <div className="pt-3 border-t border-slate-800/80">
          <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-slate-400 mb-2">
            <Clock size={12} className="text-cyan-400" />
            <h3>Historial de rutina — {selectedCrew}</h3>
          </div>

          {routineHistory.length === 0 ? (
            <p className="text-xs text-slate-500">
              Aún no hay tareas completadas para este tripulante.
            </p>
          ) : (
            <div className="overflow-x-auto max-h-36 overflow-y-auto">
              <table className="w-full text-left text-[11px] text-slate-300">
                <thead className="text-slate-500 uppercase border-b border-slate-800/80">
                  <tr>
                    <th className="py-1.5 pr-2">Fecha y Hora</th>
                    <th className="py-1.5 pr-2">Tarea</th>
                    <th className="py-1.5 text-right">Pts</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {routineHistory.map((item) => (
                    <tr key={item.id}>
                      <td className="py-1.5 pr-2 font-mono text-slate-400 whitespace-nowrap">
                        {item.timestamp}
                      </td>
                      <td className="py-1.5 pr-2">{item.task_label}</td>
                      <td className="py-1.5 text-right font-mono text-emerald-300">+{item.points}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}