'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuthStore } from '@/store/auth.store';
import { streamsApi } from '@/lib/api';

export default function DashboardPage() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [streams, setStreams] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    loadStreams();
  }, []);

  const loadStreams = async () => {
    try {
      const response = await streamsApi.list();
      setStreams(response.data);
    } catch (error) {
      console.error('Failed to load streams:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateStream = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);

    try {
      const response = await streamsApi.create({ title, description });
      router.push(`/stream/${response.data.id}`);
    } catch (error: any) {
      console.error('Failed to create stream:', error);
      alert(error.response?.data?.message || 'Failed to create stream');
    } finally {
      setIsCreating(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    router.push('/auth/login');
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <nav className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center space-x-8">
                <h1 className="text-2xl font-bold text-blue-600">StreamUs</h1>
                <div className="hidden md:flex space-x-4">
                  <Link href="/dashboard" className="text-gray-700 hover:text-gray-900 px-3 py-2">
                    Streams
                  </Link>
                  <Link href="/settings/branding" className="text-gray-700 hover:text-gray-900 px-3 py-2">
                    Branding
                  </Link>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <span className="text-gray-700">Welcome, {user?.username}</span>
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 text-sm text-gray-700 hover:text-gray-900"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </nav>

        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Your Streams</h2>
              <button
                onClick={() => setShowCreateForm(!showCreateForm)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
              >
                {showCreateForm ? 'Cancel' : 'Create Stream'}
              </button>
            </div>

            {showCreateForm && (
              <div className="mb-6 p-6 bg-white rounded-lg shadow-md">
                <h3 className="text-lg font-medium mb-4">Create New Stream</h3>
                <form onSubmit={handleCreateStream} className="space-y-4">
                  <div>
                    <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                      Stream Title
                    </label>
                    <input
                      type="text"
                      id="title"
                      required
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="My awesome stream"
                    />
                  </div>
                  <div>
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                      Description (optional)
                    </label>
                    <textarea
                      id="description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={3}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Tell viewers what your stream is about"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isCreating}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isCreating ? 'Creating...' : 'Create & Join Stream'}
                  </button>
                </form>
              </div>
            )}

            {isLoading ? (
              <div className="text-center py-12">
                <p className="text-gray-600">Loading streams...</p>
              </div>
            ) : streams.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-lg shadow-md">
                <p className="text-gray-600 mb-4">You haven't created any streams yet</p>
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Create your first stream
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {streams.map((stream) => (
                  <Link
                    key={stream.id}
                    href={`/stream/${stream.id}`}
                    className="block p-6 bg-white rounded-lg shadow-md hover:shadow-lg transition"
                  >
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{stream.title}</h3>
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                      {stream.description || 'No description'}
                    </p>
                    <div className="flex justify-between items-center">
                      <span className="text-xs px-2 py-1 rounded-full bg-gray-200 text-gray-700">
                        {stream.status}
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(stream.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
