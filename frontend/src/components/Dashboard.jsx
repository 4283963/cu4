export default function Dashboard({ waterQuality, connected, timestamp }) {
  const getDOLabel = (value) => {
    if (value >= 7) return { text: '优良', color: 'text-green-400' };
    if (value >= 5) return { text: '正常', color: 'text-yellow-400' };
    return { text: '偏低', color: 'text-red-400' };
  };

  const getTempLabel = (value) => {
    if (value >= 26 && value <= 30) return { text: '适宜', color: 'text-green-400' };
    return { text: '偏离', color: 'text-yellow-400' };
  };

  return (
    <div className="bg-slate-900/90 backdrop-blur-md rounded-xl p-5 shadow-2xl border border-slate-700/50">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-white">水质监测</h2>
        <div className="flex items-center gap-2">
          <span
            className={`w-2.5 h-2.5 rounded-full ${
              connected ? 'bg-green-400 animate-pulse' : 'bg-red-400'
            }`}
          />
          <span className="text-xs text-slate-400">
            {connected ? '实时连接' : '连接中断'}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <MetricCard
          label="溶氧度"
          value={waterQuality?.dissolvedOxygen.toFixed(2) || '--'}
          unit="mg/L"
          icon="💧"
          status={waterQuality ? getDOLabel(waterQuality.dissolvedOxygen) : undefined}
          progress={waterQuality ? (waterQuality.dissolvedOxygen / 10) * 100 : 0}
          progressColor="from-cyan-500 to-blue-500"
        />

        <MetricCard
          label="水温"
          value={waterQuality?.temperature.toFixed(1) || '--'}
          unit="°C"
          icon="🌡️"
          status={waterQuality ? getTempLabel(waterQuality.temperature) : undefined}
          progress={waterQuality ? ((waterQuality.temperature - 20) / 15) * 100 : 0}
          progressColor="from-orange-500 to-red-500"
        />

        <MetricCard
          label="pH值"
          value={waterQuality?.ph.toFixed(2) || '--'}
          unit=""
          icon="⚗️"
          progress={waterQuality ? ((waterQuality.ph - 6.5) / 2.5) * 100 : 0}
          progressColor="from-emerald-500 to-teal-500"
        />

        <MetricCard
          label="盐度"
          value={waterQuality?.salinity.toFixed(1) || '--'}
          unit="‰"
          icon="🧂"
          progress={waterQuality ? (waterQuality.salinity / 35) * 100 : 0}
          progressColor="from-sky-500 to-indigo-500"
        />
      </div>

      <div className="mt-4 pt-3 border-t border-slate-700/50">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span>水流速度</span>
          <span className="text-cyan-400 font-mono">
            {waterQuality?.flowSpeed.toFixed(2) || '--'} m/s
          </span>
        </div>
        <div className="mt-1.5 h-1.5 bg-slate-700/50 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full transition-all duration-300"
            style={{ width: `${waterQuality ? waterQuality.flowSpeed * 50 : 0}%` }}
          />
        </div>
      </div>

      {timestamp && (
        <div className="mt-3 text-xs text-slate-500 text-center font-mono">
          更新时间: {new Date(timestamp).toLocaleTimeString('zh-CN')}
        </div>
      )}
    </div>
  );
}

function MetricCard({ label, value, unit, icon, status, progress, progressColor }) {
  return (
    <div className="bg-slate-800/60 rounded-lg p-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-slate-400">{label}</span>
        <span className="text-lg">{icon}</span>
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-2xl font-bold text-white font-mono">{value}</span>
        <span className="text-xs text-slate-400">{unit}</span>
      </div>
      {status && (
        <div className="mt-1">
          <span className={`text-xs font-medium ${status.color}`}>{status.text}</span>
        </div>
      )}
      <div className="mt-2 h-1 bg-slate-700/50 rounded-full overflow-hidden">
        <div
          className={`h-full bg-gradient-to-r ${progressColor} rounded-full transition-all duration-500`}
          style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
        />
      </div>
    </div>
  );
}
