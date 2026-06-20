export default function FeederPanel({ feeders, onControl }) {
  const handleSpeedChange = (feederId, speed) => {
    onControl?.(feederId, 'speed', speed);
  };

  const handleFeedRateChange = (feederId, rate) => {
    onControl?.(feederId, 'feedRate', rate);
  };

  const toggleActive = (feederId, isActive) => {
    onControl?.(feederId, 'active', isActive ? 1 : 0);
  };

  return (
    <div className="bg-slate-900/90 backdrop-blur-md rounded-xl p-5 shadow-2xl border border-slate-700/50">
      <h2 className="text-lg font-bold text-white mb-4">投喂设备</h2>
      
      <div className="space-y-4">
        {feeders.map((feeder) => (
          <div
            key={feeder.id}
            className={`p-3 rounded-lg border transition-all ${
              feeder.isActive
                ? 'bg-slate-800/60 border-green-500/30'
                : 'bg-slate-800/30 border-slate-700/50 opacity-60'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div
                  className={`w-2.5 h-2.5 rounded-full ${
                    feeder.isActive ? 'bg-green-400 animate-pulse' : 'bg-slate-500'
                  }`}
                />
                <span className="font-medium text-white text-sm">{feeder.name}</span>
              </div>
              <button
                onClick={() => toggleActive(feeder.id, !feeder.isActive)}
                className={`px-2 py-0.5 text-xs rounded-full transition-colors ${
                  feeder.isActive
                    ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                    : 'bg-slate-700/50 text-slate-400 border border-slate-600/50'
                }`}
              >
                {feeder.isActive ? '运行中' : '已停止'}
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs mb-3">
              <div className="text-slate-400">
                位置:
                <span className="ml-1 text-cyan-400 font-mono">
                  ({feeder.position.x.toFixed(1)}, {feeder.position.z.toFixed(1)})
                </span>
              </div>
              <div className="text-slate-400">
                半径:
                <span className="ml-1 text-cyan-400 font-mono">
                  {feeder.radius.toFixed(1)}m
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-400">移动速度</span>
                  <span className="text-white font-mono">{feeder.speed.toFixed(2)} m/s</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="2"
                  step="0.1"
                  value={feeder.speed}
                  onChange={(e) => handleSpeedChange(feeder.id, parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-slate-700 rounded-full appearance-none cursor-pointer
                    [&::-webkit-slider-thumb]:appearance-none
                    [&::-webkit-slider-thumb]:w-3
                    [&::-webkit-slider-thumb]:h-3
                    [&::-webkit-slider-thumb]:rounded-full
                    [&::-webkit-slider-thumb]:bg-cyan-400
                    [&::-webkit-slider-thumb]:shadow-lg
                    [&::-webkit-slider-thumb]:cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-400">投喂速率</span>
                  <span className="text-white font-mono">{(feeder.feedRate * 100).toFixed(0)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={feeder.feedRate}
                  onChange={(e) => handleFeedRateChange(feeder.id, parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-slate-700 rounded-full appearance-none cursor-pointer
                    [&::-webkit-slider-thumb]:appearance-none
                    [&::-webkit-slider-thumb]:w-3
                    [&::-webkit-slider-thumb]:h-3
                    [&::-webkit-slider-thumb]:rounded-full
                    [&::-webkit-slider-thumb]:bg-amber-400
                    [&::-webkit-slider-thumb]:shadow-lg
                    [&::-webkit-slider-thumb]:cursor-pointer"
                />
              </div>
            </div>
          </div>
        ))}

        {feeders.length === 0 && (
          <div className="text-center text-slate-500 py-6 text-sm">
            等待设备数据...
          </div>
        )}
      </div>
    </div>
  );
}
