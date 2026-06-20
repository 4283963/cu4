import { useMemo, useCallback, useState, useEffect } from 'react';
import Scene from './components/Scene';
import Dashboard from './components/Dashboard';
import FeederPanel from './components/FeederPanel';
import Legend from './components/Legend';
import useSensorData from './hooks/useSensorData';

export default function App() {
  const { feeders, waterQuality, coverage, connected, timestamp, data } = useSensorData();
  const [showControl, setShowControl] = useState(true);

  const coveragePercent = useMemo(() => {
    if (!coverage?.points) return 0;
    const covered = coverage.points.filter((p) => p.covered).length;
    const total = coverage.points.length;
    return total > 0 ? (covered / total) * 100 : 0;
  }, [coverage]);

  const handleControl = useCallback(async (feederId, parameter, value) => {
    try {
      const response = await fetch('/api/control', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'feeder',
          feederId,
          parameter,
          value,
        }),
      });

      if (!response.ok) {
        console.error('Control command failed');
      }
    } catch (e) {
      console.error('Control error:', e);
    }
  }, []);

  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.key === 'c' || e.key === 'C') {
        setShowControl((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  return (
    <div className="w-screen h-screen bg-slate-950 relative overflow-hidden">
      {/* 头部标题栏 */}
      <header className="absolute top-0 left-0 right-0 z-10 px-6 py-4 bg-gradient-to-b from-slate-950/90 to-transparent">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-wide">
              🌊 工厂化循环水养虾数字孪生系统
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              圆形养殖池 · 智能投喂 · 水质监测
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-xs text-slate-500">圆形养殖池 R1</div>
              <div className="text-sm font-mono text-cyan-400">
                {data?.poolConfig.radius.toFixed(1) || '15.0'}m 直径
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* 3D 场景 */}
      <Scene sensorData={data} />

      {/* 左侧面板 - 水质监测 */}
      <div className="absolute left-5 top-24 z-10 w-72 space-y-4">
        <Dashboard
          waterQuality={waterQuality}
          connected={connected}
          timestamp={timestamp}
        />
        <Legend coverage={coveragePercent} />
      </div>

      {/* 右侧面板 - 投喂设备 */}
      {showControl && (
        <div className="absolute right-5 top-24 z-10 w-72">
          <FeederPanel feeders={feeders} onControl={handleControl} />
        </div>
      )}

      {/* 底部信息栏 */}
      <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-10">
        <div className="bg-slate-900/80 backdrop-blur-md rounded-full px-6 py-2 border border-slate-700/50
          flex items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">投喂设备:</span>
            <span className="text-sm font-mono text-green-400">
              {feeders.filter((f) => f.isActive).length}/{feeders.length} 运行
            </span>
          </div>
          <div className="w-px h-4 bg-slate-700" />
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">覆盖率:</span>
            <span className="text-sm font-mono text-cyan-400">
              {coveragePercent.toFixed(1)}%
            </span>
          </div>
          <div className="w-px h-4 bg-slate-700" />
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">溶氧:</span>
            <span className="text-sm font-mono text-emerald-400">
              {waterQuality?.dissolvedOxygen.toFixed(2) || '--'} mg/L
            </span>
          </div>
          <div className="w-px h-4 bg-slate-700" />
          <div className="text-xs text-slate-500">
            按 <kbd className="px-1.5 py-0.5 bg-slate-700 rounded text-slate-300">C</kbd> 切换控制面板
          </div>
        </div>
      </div>

      {/* 操作提示 */}
      <div className="absolute bottom-5 right-5 z-10">
        <div className="bg-slate-900/60 backdrop-blur-md rounded-lg px-4 py-2 border border-slate-700/50
          text-xs text-slate-400">
          <div>🖱️ 左键拖动旋转</div>
          <div>🖱️ 右键拖动平移</div>
          <div>🖱️ 滚轮缩放</div>
        </div>
      </div>
    </div>
  );
}
