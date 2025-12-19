'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';

interface Destination {
  id: string;
  platform: string;
  rtmpUrl: string;
  streamKey: string;
  status: string;
  createdAt: string;
}

interface DestinationListProps {
  streamId: string;
}

export default function DestinationList({ streamId }: DestinationListProps) {
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDestinations();
  }, [streamId]);

  const loadDestinations = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/streams/${streamId}/destinations`);
      setDestinations(response.data);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load destinations');
    } finally {
      setLoading(false);
    }
  };

  const startStreaming = async (destinationId: string) => {
    try {
      await api.post(`/streams/${streamId}/destinations/${destinationId}/start`);
      await loadDestinations();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to start streaming');
    }
  };

  const stopStreaming = async (destinationId: string) => {
    try {
      await api.post(`/streams/${streamId}/destinations/${destinationId}/stop`);
      await loadDestinations();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to stop streaming');
    }
  };

  const deleteDestination = async (destinationId: string) => {
    if (!confirm('Are you sure you want to delete this destination?')) return;
    
    try {
      await api.delete(`/streams/${streamId}/destinations/${destinationId}`);
      await loadDestinations();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete destination');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected': return 'bg-green-500';
      case 'pending': return 'bg-yellow-500';
      case 'disconnected': return 'bg-gray-500';
      case 'error': return 'bg-red-500';
      default: return 'bg-gray-400';
    }
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'youtube': return '📺';
      case 'facebook': return '👤';
      case 'twitch': return '🎮';
      default: return '🔗';
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading destinations...</div>;
  }

  if (error) {
    return <div className="text-red-500 py-8">{error}</div>;
  }

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold">Streaming Destinations</h3>
      
      {destinations.length === 0 ? (
        <div className="text-gray-500 py-8 text-center">
          No destinations added yet. Add a destination to start streaming.
        </div>
      ) : (
        <div className="grid gap-4">
          {destinations.map((dest) => (
            <div
              key={dest.id}
              className="border rounded-lg p-4 flex items-center justify-between bg-white shadow-sm"
            >
              <div className="flex items-center space-x-4">
                <div className="text-3xl">{getPlatformIcon(dest.platform)}</div>
                <div>
                  <div className="font-medium capitalize">{dest.platform}</div>
                  <div className="text-sm text-gray-500">
                    {dest.rtmpUrl.length > 50 
                      ? dest.rtmpUrl.substring(0, 50) + '...' 
                      : dest.rtmpUrl}
                  </div>
                  <div className="flex items-center mt-1">
                    <div className={`w-2 h-2 rounded-full ${getStatusColor(dest.status)} mr-2`}></div>
                    <span className="text-xs capitalize">{dest.status}</span>
                  </div>
                </div>
              </div>
              
              <div className="flex space-x-2">
                {dest.status === 'connected' ? (
                  <button
                    onClick={() => stopStreaming(dest.id)}
                    className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                  >
                    Stop
                  </button>
                ) : (
                  <button
                    onClick={() => startStreaming(dest.id)}
                    className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                    disabled={dest.status === 'error'}
                  >
                    Start
                  </button>
                )}
                
                <button
                  onClick={() => deleteDestination(dest.id)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
