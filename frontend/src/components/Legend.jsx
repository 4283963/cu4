export default function Legend({ coverage }) {
  return (
    <div className="bg-slate-900/90 backdrop-blur-md rounded-xl p-4 shadow-2xl border border-slate-700/50">
      <h3 className="text-sm font-semibold text-white mb-3">水质覆盖率图例</h3>
      
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-blue-500/60" />
          <span className="text-xs text-slate-300">低浓度（未覆盖）</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-green-500/60" />
          <span className="text-xs text-slate-300">中低浓度</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-yellow-500/60" />
          <span className="text-xs text-slate-300">中浓度</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-red-500/60" />
          <span className="text-xs text-slate-300">高浓度（覆盖中心）</span>
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-slate-700/50">
        <div className="text-xs text-slate-400 mb-1">整体覆盖率</div>
        <div className="flex items-center gap-2">
          <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-cyan-500 to-green-500 rounded-full transition-all duration-1000"
              style={{ width: `${coverage}%` }}
            />
          </div>
          <span className="text-sm font-bold text-green-400 font-mono">
            {coverage.toFixed(1)}%
          </span>
        </div>
      </div>
    </div>
  );
}
