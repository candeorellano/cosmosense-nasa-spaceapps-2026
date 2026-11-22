import { useState } from 'react';
import { Brain, Heart, Wind, Flame, Info } from 'lucide-react';

export default function BodyMap({ vitals, latestCheckin }) {
  const [selectedPart, setSelectedPart] = useState('heart');

  const getHeadStatus = () => {
    if (!latestCheckin) return 'NOMINAL';
    if (latestCheckin.sleep_hours < 6 || latestCheckin.mood_score <= 2) return 'WARNING';
    return 'NOMINAL';
  };

  const getHeartStatus = () => {
    if (vitals.heart_rate_bpm > 115) return 'CRITICAL';
    if (vitals.heart_rate_bpm > 100 || vitals.systolic_bp > 135) return 'WARNING';
    return 'NOMINAL';
  };

  const getLungsStatus = () => {
    if (vitals.spo2_percent < 92) return 'CRITICAL';
    if (vitals.spo2_percent < 95) return 'WARNING';
    return 'NOMINAL';
  };

  const getMetabolicStatus = () => {
    if (latestCheckin && latestCheckin.glucose_mg_dl < 70) return 'CRITICAL';
    if (vitals.core_temp_c > 38.0 || (latestCheckin && latestCheckin.glucose_mg_dl > 140)) return 'WARNING';
    return 'NOMINAL';
  };

  const statusColors = {
    NOMINAL: { fill: '#10b981', stroke: '#34d399', badge: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' },
    WARNING: { fill: '#f59e0b', stroke: '#fbbf24', badge: 'bg-amber-500/15 text-amber-300 border-amber-500/30' },
    CRITICAL: { fill: '#f43f5e', stroke: '#fb7185', badge: 'bg-rose-500/15 text-rose-300 border-rose-500/40' },
  };

  const bodyParts = {
    head: {
      name: 'Cabeza — Neuro-Conductual',
      icon: Brain,
      status: getHeadStatus(),
      metrics: latestCheckin
        ? `Sueño: ${latestCheckin.sleep_hours} h | Ánimo: ${latestCheckin.mood_score}/5`
        : 'Sin autoevaluación registrada',
      hazard: 'Aislamiento y Confinamiento',
      functionDesc: 'Regula el ritmo circadiano, la toma de decisiones críticas y el equilibrio emocional en misiones largas.',
    },
    lungs: {
      name: 'Pulmones — Respiratorio',
      icon: Wind,
      status: getLungsStatus(),
      metrics: `SpO2: ${vitals.spo2_percent}%`,
      hazard: 'Ambientes Cerrados Hostiles',
      functionDesc: 'Intercambio de oxígeno y CO2 en cabinas presurizadas.',
    },
    heart: {
      name: 'Corazón — Cardiovascular',
      icon: Heart,
      status: getHeartStatus(),
      metrics: `Pulso: ${vitals.heart_rate_bpm} BPM | Presión: ${vitals.systolic_bp}/${vitals.diastolic_bp}`,
      hazard: 'Campos de Gravedad (Microgravedad)',
      functionDesc: 'Bombea sangre; en microgravedad los fluidos se redistribuyen hacia el tórax.',
    },
    metabolic: {
      name: 'Sistema Metabólico',
      icon: Flame,
      status: getMetabolicStatus(),
      metrics: `Temp: ${vitals.core_temp_c} °C | Glucosa: ${latestCheckin ? `${latestCheckin.glucose_mg_dl} mg/dL` : 'Pendiente'}`,
      hazard: 'Radiación y Nutrición en Vuelo',
      functionDesc: 'Controla la energía celular, temperatura corporal y respuesta inmunológica.',
    },
  };

  const activeInfo = bodyParts[selectedPart];
  const ActiveIcon = activeInfo.icon;

  return (
    <div className="glass-panel p-6 rounded-2xl space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-[11px] uppercase tracking-widest text-cyan-300/80 font-semibold">
          Mapa Corporal Interactivo
        </h2>
        <div className="flex items-center gap-3 text-[11px] text-slate-400">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-400" /> Nominal</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400" /> Alerta</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-rose-400" /> Crítico</span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
        <div className="flex justify-center glass-inner rounded-xl p-3">
          <svg viewBox="0 0 240 380" className="h-64 w-auto select-none">
            <g fill="#090e1d" stroke="#334155" strokeWidth="2.5" strokeLinejoin="round">
              <circle cx="120" cy="48" r="28" />
              <rect x="110" y="76" width="20" height="14" rx="4" />
              <path d="M 75 94 C 75 88, 165 88, 165 94 L 158 220 C 158 228, 82 228, 82 220 Z" />
              <path d="M 74 96 L 44 195 C 42 203, 56 207, 60 198 L 80 125" />
              <path d="M 166 96 L 196 195 C 198 203, 184 207, 180 198 L 160 125" />
              <path d="M 86 225 L 78 355 C 78 364, 98 364, 100 355 L 114 230" />
              <path d="M 154 225 L 162 355 C 162 364, 142 364, 140 355 L 126 230" />
            </g>

            <g onClick={() => setSelectedPart('head')} className="cursor-pointer" opacity={selectedPart === 'head' ? 1 : 0.7}>
              <circle cx="120" cy="48" r="18" fill={statusColors[bodyParts.head.status].fill} fillOpacity="0.35" stroke={statusColors[bodyParts.head.status].stroke} strokeWidth={selectedPart === 'head' ? '3' : '1.5'} />
              <circle cx="120" cy="48" r="5" fill={statusColors[bodyParts.head.status].stroke} />
            </g>

            <g onClick={() => setSelectedPart('lungs')} className="cursor-pointer" opacity={selectedPart === 'lungs' ? 1 : 0.7}>
              <ellipse cx="102" cy="132" rx="13" ry="24" fill={statusColors[bodyParts.lungs.status].fill} fillOpacity="0.3" stroke={statusColors[bodyParts.lungs.status].stroke} strokeWidth={selectedPart === 'lungs' ? '3' : '1.5'} />
              <ellipse cx="138" cy="132" rx="13" ry="24" fill={statusColors[bodyParts.lungs.status].fill} fillOpacity="0.3" stroke={statusColors[bodyParts.lungs.status].stroke} strokeWidth={selectedPart === 'lungs' ? '3' : '1.5'} />
            </g>

            <g onClick={() => setSelectedPart('heart')} className="cursor-pointer" opacity={selectedPart === 'heart' ? 1 : 0.85}>
              <circle cx="128" cy="142" r="13" fill={statusColors[bodyParts.heart.status].fill} fillOpacity="0.55" stroke={statusColors[bodyParts.heart.status].stroke} strokeWidth={selectedPart === 'heart' ? '3' : '1.5'} />
              <circle cx="128" cy="142" r="4" fill="#ffffff" />
            </g>

            <g onClick={() => setSelectedPart('metabolic')} className="cursor-pointer" opacity={selectedPart === 'metabolic' ? 1 : 0.7}>
              <rect x="96" y="174" width="48" height="34" rx="12" fill={statusColors[bodyParts.metabolic.status].fill} fillOpacity="0.35" stroke={statusColors[bodyParts.metabolic.status].stroke} strokeWidth={selectedPart === 'metabolic' ? '3' : '1.5'} />
              <circle cx="120" cy="191" r="5" fill={statusColors[bodyParts.metabolic.status].stroke} />
            </g>
          </svg>
        </div>

        <div className="glass-inner rounded-xl p-4 space-y-3.5">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2 text-cyan-300">
              <ActiveIcon size={18} />
              <h3 className="font-bold text-sm text-slate-100">{activeInfo.name}</h3>
            </div>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${statusColors[activeInfo.status].badge}`}>
              {activeInfo.status}
            </span>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-2.5">
            <span className="block text-[10px] uppercase tracking-wider text-slate-500 mb-0.5">Lectura actual</span>
            <span className="text-xs font-mono font-semibold text-white">{activeInfo.metrics}</span>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-violet-300">
              <Info size={13} />
              <span>{activeInfo.hazard}</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">{activeInfo.functionDesc}</p>
          </div>

          <div className="flex flex-wrap gap-1.5 pt-2 border-t border-slate-800/80">
            {Object.keys(bodyParts).map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => setSelectedPart(key)}
                className={`px-2 py-1 rounded-lg text-[11px] font-semibold border cursor-pointer transition ${
                  selectedPart === key
                    ? 'bg-cyan-400 text-slate-950 border-cyan-300'
                    : 'bg-slate-900/70 text-slate-400 border-slate-800 hover:border-cyan-500/40'
                }`}
              >
                {key === 'head' ? 'Cabeza' : key === 'lungs' ? 'Pulmones' : key === 'heart' ? 'Corazón' : 'Metabólico'}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}