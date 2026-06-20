import { useState, useEffect, useRef, useMemo } from 'react';
import wsService from '../services/websocket';

export function useSensorData() {
  const [data, setData] = useState(null);
  const [connected, setConnected] = useState(false);
  const lastTimeRef = useRef(0);

  useEffect(() => {
    const unsubscribe = wsService.subscribe((newData) => {
      const now = Date.now();
      if (now - lastTimeRef.current > 50) {
        setData(newData);
        setConnected(true);
        lastTimeRef.current = now;
      }
    });

    const checkConnection = setInterval(() => {
      if (!data) {
        setConnected(false);
      }
    }, 5000);

    return () => {
      unsubscribe();
      clearInterval(checkConnection);
    };
  }, [data]);

  const feeders = useMemo(() => data?.feeders || [], [data]);
  const waterQuality = useMemo(() => data?.waterQuality, [data]);
  const coverage = useMemo(() => data?.coverage, [data]);
  const poolConfig = useMemo(() => data?.poolConfig, [data]);
  const timestamp = useMemo(() => data?.timestamp, [data]);

  return {
    data,
    connected,
    feeders,
    waterQuality,
    coverage,
    poolConfig,
    timestamp,
  };
}

export default useSensorData;
