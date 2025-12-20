'use client';

import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { CommentSource, CommentStatus } from '@streamus/shared';
import { api } from '@/lib/api';

interface Comment {
  id: string;
  streamId: string;
  source: CommentSource;
  externalId: string;
  authorName: string;
  authorImage?: string;
  text: string;
  status: CommentStatus;
  timestamp: Date;
  metadata?: Record<string, any>;
}

interface CommentModerationPanelProps {
  streamId: string;
}

const SOURCE_ICONS = {
  youtube: '▶️',
  twitch: '📺',
  facebook: '👤',
};

export default function CommentModerationPanel({
  streamId,
}: CommentModerationPanelProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [filter, setFilter] = useState<CommentStatus | 'all'>('all');
  const [socket, setSocket] = useState<Socket | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadComments();
    setupWebSocket();

    return () => {
      socket?.disconnect();
    };
  }, [streamId]);

  useEffect(() => {
    loadComments();
  }, [filter]);

  const setupWebSocket = () => {
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000';
    const ws = io(`${backendUrl}/comments`, {
      transports: ['websocket'],
      withCredentials: true,
    });

    ws.on('connect', () => {
      console.log('Connected to moderation WebSocket');
      ws.emit('joinStream', { streamId });
    });

    ws.on('newComment', (comment: Comment) => {
      setComments((prev) => [comment, ...prev]);
    });

    ws.on('commentModerated', (comment: Comment) => {
      setComments((prev) =>
        prev.map((c) => (c.id === comment.id ? comment : c))
      );
    });

    ws.on('commentDeleted', ({ commentId }: { commentId: string }) => {
      setComments((prev) => prev.filter((c) => c.id !== commentId));
    });

    setSocket(ws);
  };

  const loadComments = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filter !== 'all') {
        params.set('status', filter);
      }
      params.set('limit', '50');

      const response = await api.get(`/streams/${streamId}/comments?${params}`);
      setComments(response.data);
    } catch (error) {
      console.error('Failed to load comments:', error);
    } finally {
      setLoading(false);
    }
  };

  const moderateComment = async (commentId: string, status: CommentStatus) => {
    try {
      await api.patch(`/streams/${streamId}/comments/${commentId}/status`, {
        status,
      });
      
      socket?.emit('moderateComment', { commentId, status });
    } catch (error) {
      console.error('Failed to moderate comment:', error);
    }
  };

  const deleteComment = async (commentId: string) => {
    try {
      await api.delete(`/streams/${streamId}/comments/${commentId}`);
    } catch (error) {
      console.error('Failed to delete comment:', error);
    }
  };

  const bulkApprove = async () => {
    const pendingIds = comments
      .filter((c) => c.status === CommentStatus.PENDING)
      .map((c) => c.id);

    if (pendingIds.length === 0) return;

    try {
      await api.post(`/streams/${streamId}/comments/bulk-update`, {
        commentIds: pendingIds,
        status: CommentStatus.APPROVED,
      });
      loadComments();
    } catch (error) {
      console.error('Failed to bulk approve:', error);
    }
  };

  const getStatusColor = (status: CommentStatus) => {
    switch (status) {
      case CommentStatus.APPROVED:
        return 'text-green-600 bg-green-50';
      case CommentStatus.REJECTED:
        return 'text-red-600 bg-red-50';
      case CommentStatus.FLAGGED:
        return 'text-yellow-600 bg-yellow-50';
      case CommentStatus.PENDING:
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Comment Moderation</h2>
        <div className="flex gap-2">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as CommentStatus | 'all')}
            className="border rounded px-3 py-1 text-sm"
          >
            <option value="all">All Comments</option>
            <option value={CommentStatus.PENDING}>Pending</option>
            <option value={CommentStatus.APPROVED}>Approved</option>
            <option value={CommentStatus.REJECTED}>Rejected</option>
            <option value={CommentStatus.FLAGGED}>Flagged</option>
          </select>
          <button
            onClick={bulkApprove}
            className="bg-green-600 text-white px-4 py-1 rounded text-sm hover:bg-green-700"
          >
            Approve All Pending
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8 text-gray-500">Loading comments...</div>
      ) : comments.length === 0 ? (
        <div className="text-center py-8 text-gray-500">No comments yet</div>
      ) : (
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {comments.map((comment) => (
            <div
              key={comment.id}
              className="border rounded-lg p-3 hover:bg-gray-50 transition"
            >
              <div className="flex items-start gap-3">
                {comment.authorImage && (
                  <img
                    src={comment.authorImage}
                    alt={comment.authorName}
                    className="w-10 h-10 rounded-full flex-shrink-0"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-sm">
                      {comment.authorName}
                    </span>
                    <span className="text-xs text-gray-500">
                      {SOURCE_ICONS[comment.source]} {comment.source}
                    </span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded ${getStatusColor(comment.status)}`}
                    >
                      {comment.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 mb-2">{comment.text}</p>
                  <div className="flex gap-2">
                    {comment.status !== CommentStatus.APPROVED && (
                      <button
                        onClick={() =>
                          moderateComment(comment.id, CommentStatus.APPROVED)
                        }
                        className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded hover:bg-green-200"
                      >
                        Approve
                      </button>
                    )}
                    {comment.status !== CommentStatus.REJECTED && (
                      <button
                        onClick={() =>
                          moderateComment(comment.id, CommentStatus.REJECTED)
                        }
                        className="text-xs bg-red-100 text-red-700 px-3 py-1 rounded hover:bg-red-200"
                      >
                        Reject
                      </button>
                    )}
                    {comment.status !== CommentStatus.FLAGGED && (
                      <button
                        onClick={() =>
                          moderateComment(comment.id, CommentStatus.FLAGGED)
                        }
                        className="text-xs bg-yellow-100 text-yellow-700 px-3 py-1 rounded hover:bg-yellow-200"
                      >
                        Flag
                      </button>
                    )}
                    <button
                      onClick={() => deleteComment(comment.id)}
                      className="text-xs bg-gray-100 text-gray-700 px-3 py-1 rounded hover:bg-gray-200"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
