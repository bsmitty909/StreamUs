'use client';

import { use } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import DestinationList from '@/components/destinations/DestinationList';
import AddDestinationForm from '@/components/destinations/AddDestinationForm';
import { useState } from 'react';

export default function StreamDestinationsPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  const { id: streamId } = use(params);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleDestinationAdded = () => {
    setRefreshKey(prev => prev + 1);
  };

  return (
    <ProtectedRoute>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Stream Destinations</h1>
          <p className="text-gray-600">
            Manage where your stream is broadcast to
          </p>
        </div>

        <div className="max-w-4xl space-y-6">
          <AddDestinationForm 
            streamId={streamId} 
            onAdded={handleDestinationAdded}
          />
          
          <DestinationList key={refreshKey} streamId={streamId} />
        </div>

        <div className="mt-8 p-4 bg-blue-50 rounded-lg">
          <h3 className="font-semibold mb-2">💡 Tips</h3>
          <ul className="list-disc ml-5 space-y-1 text-sm text-gray-700">
            <li>Add multiple destinations to stream simultaneously to YouTube, Facebook, and Twitch</li>
            <li>Start streaming to a destination only when your LiveKit room is active</li>
            <li>Stream keys are stored securely and never displayed after adding</li>
            <li>Monitor the status indicator to ensure your stream is connected</li>
          </ul>
        </div>
      </div>
    </ProtectedRoute>
  );
}
