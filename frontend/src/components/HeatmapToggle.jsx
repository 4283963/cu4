export default function HeatmapToggle({ enabled, onChange }) {
  return (
    <button
      onClick={() => onChange(!enabled)}
      className={`flex items-center gap-3 px-4 py-2.5 rounded-xl border transition-all duration-300
        backdrop-blur-md shadow-lg hover:scale-105 active:scale-95 ${
          enabled
            ? 'bg-gradient-to-r from-cyan-600/80 to-blue-600/80 border-cyan-400/60 text-white'
            : 'bg-slate-900/70 border-slate-600/50 text-slate-300 hover:border-slate-400/60'
        }`}
    >
      <div className="relative">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-red-500 via-yellow-400 to-cyan-500
          flex items-center justify-center shadow-inner">
          <span className="text-white text-sm">🔥</span>
        </div>
        {enabled && (
          <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-green-400 rounded-full animate-pulse" />
        )}
      </div>
      <div className="text-left">
        <div className="text-sm font-semibold">投喂热力图</div>
        <div className="text-xs opacity-75">{enabled ? '已开启 · 累积频次' : '已关闭 · 点击开启'}</div>
      </div>
      <div
        className={`w-10 h-6 rounded-full p-0.5 transition-colors duration-300 ${
          enabled ? 'bg-green-400/30' : 'bg-slate-600/50'
        }`}
      >
        <div
          className={`w-5 h-5 rounded-full bg-white shadow-md transition-transform duration-300
            ${enabled ? 'translate-x-4' : 'translate-x-0'}`}
        />
      </div>
    </button>
  );
}
