'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { LiveKitRoom, VideoConference, RoomAudioRenderer, useParticipants } from '@livekit/components-react';
import '@livekit/components-styles';
import ProtectedRoute from '@/components/ProtectedRoute';
import StreamHealthMonitor from '@/components/monitoring/StreamHealthMonitor';
import VideoCompositor from '@/components/compositor/VideoCompositor';
import LayoutSwitcher from '@/components/compositor/LayoutSwitcher';
import LiveCommentFeed from '@/components/comments/LiveCommentFeed';
import CommentModerationPanel from '@/components/comments/CommentModerationPanel';
import { streamsApi } from '@/lib/api';
import { Layout, LayoutType, DEFAULT_LAYOUTS, DEFAULT_COMPOSITOR_CONFIG } from '@streamus/shared';

function StreamContent({ streamId }: { streamId: string }) {
  const participants = useParticipants();
  const [currentLayout, setCurrentLayout] = useState<Layout>({
    ...DEFAULT_LAYOUTS[LayoutType.GRID],
    id: 'default-grid',
  });
  const [showModeration, setShowModeration] = useState(false);

  const participantsMap = new Map(
    participants.map(p => [p.identity, p])
  );

  return (
    <>
      <VideoConference />
      <RoomAudioRenderer />
      <VideoCompositor
        layout={currentLayout}
        participants={participantsMap}
        config={DEFAULT_COMPOSITOR_CONFIG}
      />
      <LayoutSwitcher
        currentLayout={currentLayout}
        onLayoutChange={setCurrentLayout}
      />
      <LiveCommentFeed
        streamId={streamId}
        maxVisible={3}
        displayDuration={5000}
        position="bottom-left"
        showAuthorImage={true}
        showSource={true}
      />
      
      <button
        onClick={() => setShowModeration(!showModeration)}
        className="fixed bottom-4 right-4 z-40 bg-purple-600 text-white px-4 py-2 rounded-lg shadow-lg hover:bg-purple-700"
      >
        💬 {showModeration ? 'Hide' : 'Show'} Moderation
      </button>

      {showModeration && (
        <div className="fixed top-20 right-4 z-40 w-96">
          <CommentModerationPanel streamId={streamId} />
        </div>
      )}
    </>
  );
}

export default function StreamRoomPage() {
  const params = useParams();
  const router = useRouter();
  const streamId = params.id as string;
  const [token, setToken] = useState('');
  const [stream, setStream] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const livekitUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL || 'ws://localhost:7880';

  useEffect(() => {
    loadStreamAndToken();
  }, [streamId]);

  const loadStreamAndToken = async () => {
    try {
      const [streamResponse, tokenResponse] = await Promise.all([
        streamsApi.get(streamId),
        streamsApi.getToken(streamId),
      ]);

      setStream(streamResponse.data);
      setToken(tokenResponse.data.token);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load stream');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisconnect = () => {
    router.push('/dashboard');
  };

  if (isLoading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen flex items-center justify-center bg-gray-900">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
            <p className="mt-4 text-white">Loading stream...</p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  if (error || !token) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen flex items-center justify-center bg-gray-900">
          <div className="text-center">
            <p className="text-red-500 mb-4">{error || 'Failed to load stream'}</p>
            <button
              onClick={() => router.push('/dashboard')}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="h-screen bg-gray-900">
        <div className="h-full flex flex-col">
          <div className="bg-gray-800 px-4 py-3 flex justify-between items-center">
            <div>
              <h1 className="text-white text-lg font-semibold">{stream?.title}</h1>
              <p className="text-gray-400 text-sm">{stream?.description}</p>
            </div>
            <div className="flex space-x-3">
              <Link
                href={`/stream/${streamId}/destinations`}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
              >
                🔗 Manage Destinations
              </Link>
              <button
                onClick={handleDisconnect}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Leave Stream
              </button>
            </div>
          </div>

          <div className="flex-1">
            <LiveKitRoom
              serverUrl={livekitUrl}
              token={token}
              connect={true}
              onDisconnected={handleDisconnect}
              onError={(error) => {
                console.error('LiveKit error:', error);
                setError(error.message);
              }}
              options={{
                adaptiveStream: true,
                dynacast: true,
                publishDefaults: {
                  simulcast: false,
                },
              }}
              className="h-full"
            >
              <StreamContent streamId={streamId} />
            </LiveKitRoom>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
