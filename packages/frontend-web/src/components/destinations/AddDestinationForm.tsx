'use client';

import { useState } from 'react';
import { api } from '@/lib/api';

interface AddDestinationFormProps {
  streamId: string;
  onAdded: () => void;
}

export default function AddDestinationForm({ streamId, onAdded }: AddDestinationFormProps) {
  const [platform, setPlatform] = useState('youtube');
  const [rtmpUrl, setRtmpUrl] = useState('');
  const [streamKey, setStreamKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await api.post(`/streams/${streamId}/destinations`, {
        platform,
        rtmpUrl,
        streamKey,
      });
      
      setRtmpUrl('');
      setStreamKey('');
      setShowForm(false);
      onAdded();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to add destination');
    } finally {
      setLoading(false);
    }
  };

  const platformPresets: Record<string, { url: string; name: string }> = {
    youtube: { url: 'rtmp://a.rtmp.youtube.com/live2', name: 'YouTube Live' },
    facebook: { url: 'rtmps://live-api-s.facebook.com:443/rtmp/', name: 'Facebook Live' },
    twitch: { url: 'rtmp://live.twitch.tv/app', name: 'Twitch' },
    custom: { url: '', name: 'Custom RTMP' },
  };

  const handlePlatformChange = (newPlatform: string) => {
    setPlatform(newPlatform);
    setRtmpUrl(platformPresets[newPlatform]?.url || '');
  };

  if (!showForm) {
    return (
      <button
        onClick={() => setShowForm(true)}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 font-medium"
      >
        + Add Destination
      </button>
    );
  }

  return (
    <div className="border rounded-lg p-6 bg-gray-50">
      <h4 className="text-lg font-semibold mb-4">Add Streaming Destination</h4>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Platform</label>
          <select
            value={platform}
            onChange={(e) => handlePlatformChange(e.target.value)}
            className="w-full border rounded px-3 py-2"
            required
          >
            <option value="youtube">YouTube Live</option>
            <option value="facebook">Facebook Live</option>
            <option value="twitch">Twitch</option>
            <option value="custom">Custom RTMP</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">RTMP Server URL</label>
          <input
            type="text"
            value={rtmpUrl}
            onChange={(e) => setRtmpUrl(e.target.value)}
            placeholder="rtmp://live.example.com/live"
            className="w-full border rounded px-3 py-2"
            required
          />
          <p className="text-xs text-gray-500 mt-1">
            {platformPresets[platform]?.name} server URL
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Stream Key</label>
          <input
            type="password"
            value={streamKey}
            onChange={(e) => setStreamKey(e.target.value)}
            placeholder="Your stream key (kept secure)"
            className="w-full border rounded px-3 py-2"
            required
          />
          <p className="text-xs text-gray-500 mt-1">
            Get this from your {platformPresets[platform]?.name} dashboard
          </p>
        </div>

        <div className="flex space-x-3">
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
          >
            {loading ? 'Adding...' : 'Add Destination'}
          </button>
          <button
            type="button"
            onClick={() => setShowForm(false)}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
          >
            Cancel
          </button>
        </div>
      </form>

      {platform === 'youtube' && (
        <div className="mt-4 p-3 bg-blue-50 rounded text-sm">
          <strong>YouTube Setup:</strong>
          <ol className="list-decimal ml-4 mt-2 space-y-1">
            <li>Go to YouTube Studio → Go Live</li>
            <li>Select "Stream" tab</li>
            <li>Copy the Stream URL and Stream key</li>
            <li>Paste them above</li>
          </ol>
        </div>
      )}
    </div>
  );
}
