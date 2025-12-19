'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';

interface HealthData {
  destinationId: string;
  platform: string;
  status: string;
  startedAt?: bigint;
  error?: string;
}

interface StreamHealthMonitorProps {
  streamId: string;
}

export default function StreamHealthMonitor({ streamId }: StreamHealthMonitorProps) {
  const [healthData, setHealthData] = useState<HealthData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHealthData();
    const interval = setInterval(loadHealthData, 5000);
    return () => clearInterval(interval);
  }, [streamId]);

  const loadHealthData = async () => {
    try {
      const response = await api.get(`/streams/${streamId}/destinations`);
      const destinations = response.data;
      
      const healthPromises = destinations.map(async (dest: any) => {
        try {
          const healthResponse = await api.get(
            `/streams/${streamId}/destinations/${dest.id}/health`
          );
          return {
            destinationId: dest.id,
            platform: dest.platform,
            ...healthResponse.data,
          };
        } catch (err) {
          return {
            destinationId: dest.id,
            platform: dest.platform,
            status: dest.status,
          };
        }
      });

      const health = await Promise.all(healthPromises);
      setHealthData(health);
      setLoading(false);
    } catch (err) {
      console.error('Failed to load health data:', err);
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { bg: string; text: string; label: string }> = {
      connected: { bg: 'bg-green-100', text: 'text-green-800', label: '🟢 Streaming' },
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: '🟡 Pending' },
      disconnected: { bg: 'bg-gray-100', text: 'text-gray-800', label: '⚪ Offline' },
      error: { bg: 'bg-red-100', text: 'text-red-800', label: '🔴 Error' },
    };

    const badge = badges[status] || badges.disconnected;
    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${badge.bg} ${badge.text}`}>
        {badge.label}
      </span>
    );
  };

  const formatDuration = (startedAt?: bigint) => {
    if (!startedAt) return 'N/A';
    const start = Number(startedAt) / 1000000;
    const now = Date.now();
    const seconds = Math.floor((now - start) / 1000);
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="border rounded-lg p-6 bg-white">
        <h3 className="text-lg font-semibold mb-4">Stream Health</h3>
        <div className="text-gray-500">Loading health data...</div>
      </div>
    );
  }

  return (
    <div className="border rounded-lg p-6 bg-white shadow-sm">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Stream Health Monitor</h3>
        <div className="text-xs text-gray-500">Auto-refreshes every 5s</div>
      </div>

      {healthData.length === 0 ? (
        <div className="text-gray-500 text-center py-8">
          No destinations configured. Add a destination to monitor stream health.
        </div>
      ) : (
        <div className="space-y-3">
          {healthData.map((health) => (
            <div
              key={health.destinationId}
              className="border rounded p-4 flex justify-between items-center"
            >
              <div>
                <div className="font-medium capitalize mb-1">{health.platform}</div>
                {health.error && (
                  <div className="text-sm text-red-600 mt-1">{health.error}</div>
                )}
              </div>
              
              <div className="text-right space-y-1">
                {getStatusBadge(health.status)}
                {health.status === 'connected' && health.startedAt && (
                  <div className="text-xs text-gray-500">
                    Duration: {formatDuration(health.startedAt)}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-4 pt-4 border-t">
        <div className="grid grid-cols-3 gap-4 text-center text-sm">
          <div>
            <div className="text-2xl font-bold text-green-600">
              {healthData.filter(h => h.status === 'connected').length}
            </div>
            <div className="text-gray-600">Active</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-yellow-600">
              {healthData.filter(h => h.status === 'pending').length}
            </div>
            <div className="text-gray-600">Pending</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-red-600">
              {healthData.filter(h => h.status === 'error').length}
            </div>
            <div className="text-gray-600">Errors</div>
          </div>
        </div>
      </div>
    </div>
  );
}
