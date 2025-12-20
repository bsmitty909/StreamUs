'use client';

import { useState, useEffect } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuthStore } from '@/store/auth.store';
import { api } from '@/lib/api';

interface ConnectedAccount {
  provider: string;
  displayName: string;
  profileImage?: string;
  connected: boolean;
  connectedAt?: string;
}

export default function ConnectionsPage() {
  const { token } = useAuthStore();
  const [connections, setConnections] = useState<ConnectedAccount[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadConnections();
  }, []);

  const loadConnections = async () => {
    try {
      const response = await api.get('/oauth/connections');
      setConnections(response.data);
    } catch (error) {
      console.error('Failed to load connections:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = (provider: string) => {
    window.location.href = `http://localhost:3000/oauth/${provider}`;
  };

  const handleDisconnect = async (provider: string) => {
    if (!confirm(`Disconnect ${provider}?`)) return;
    
    try {
      await api.get(`/oauth/disconnect/${provider}`);
      await loadConnections();
    } catch (error) {
      console.error('Failed to disconnect:', error);
    }
  };

  const platforms = [
    {
      id: 'youtube',
      name: 'YouTube',
      icon: '📺',
      color: 'bg-red-600 hover:bg-red-700',
      description: 'Stream to your YouTube channel',
    },
    {
      id: 'twitch',
      name: 'Twitch',
      icon: '🎮',
      color: 'bg-purple-600 hover:bg-purple-700',
      description: 'Stream to your Twitch channel',
    },
    {
      id: 'facebook',
      name: 'Facebook',
      icon: '👤',
      color: 'bg-blue-600 hover:bg-blue-700',
      description: 'Stream to your Facebook page',
    },
  ];

  return (
    <ProtectedRoute>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Connected Accounts</h1>
          <p className="text-gray-600">
            Connect your streaming platforms for easier RTMP setup
          </p>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-600">Loading connections...</p>
          </div>
        ) : (
          <div className="space-y-4">
            {platforms.map((platform) => {
              const connection = connections.find(c => c.provider === platform.id);
              const isConnected = !!connection;

              return (
                <div
                  key={platform.id}
                  className="bg-white rounded-lg shadow-md p-6 flex items-center justify-between"
                >
                  <div className="flex items-center space-x-4">
                    <div className="text-4xl">{platform.icon}</div>
                    <div>
                      <h3 className="font-semibold text-lg">{platform.name}</h3>
                      <p className="text-sm text-gray-600">{platform.description}</p>
                      {isConnected && (
                        <p className="text-xs text-green-600 mt-1">
                          ✓ Connected as {connection.displayName}
                        </p>
                      )}
                    </div>
                  </div>

                  <div>
                    {isConnected ? (
                      <button
                        onClick={() => handleDisconnect(platform.id)}
                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition"
                      >
                        Disconnect
                      </button>
                    ) : (
                      <button
                        onClick={() => handleConnect(platform.id)}
                        className={`px-4 py-2 text-white rounded-md transition ${platform.color}`}
                      >
                        Connect {platform.name}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-8 p-4 bg-blue-50 rounded-lg">
          <h3 className="font-semibold mb-2">💡 Why Connect?</h3>
          <ul className="list-disc ml-5 space-y-1 text-sm text-gray-700">
            <li>Skip manual RTMP URL and stream key entry</li>
            <li>One-click add streaming destinations</li>
            <li>Automatic token refresh - no reconnection needed</li>
            <li>Securely stored credentials</li>
          </ul>
        </div>

        <div className="mt-6 p-4 bg-yellow-50 rounded-lg">
          <h3 className="font-semibold mb-2">⚠️ Setup Required</h3>
          <p className="text-sm text-gray-700">
            To use OAuth, you need to configure OAuth credentials in your `.env` file. 
            See <a href="/oauth-testing-guide" className="text-blue-600 hover:underline">OAUTH_TESTING_GUIDE.md</a> for instructions.
          </p>
        </div>
      </div>
    </ProtectedRoute>
  );
}
