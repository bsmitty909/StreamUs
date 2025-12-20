'use client';

import { useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { CommentSource, CommentStatus } from '@streamus/shared';

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

interface LiveCommentFeedProps {
  streamId: string;
  maxVisible?: number;
  displayDuration?: number;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  showAuthorImage?: boolean;
  showSource?: boolean;
}

const SOURCE_COLORS = {
  youtube: 'bg-red-500',
  twitch: 'bg-purple-500',
  facebook: 'bg-blue-500',
};

export default function LiveCommentFeed({
  streamId,
  maxVisible = 3,
  displayDuration = 5000,
  position = 'bottom-left',
  showAuthorImage = true,
  showSource = true,
}: LiveCommentFeedProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000';
    const socket = io(`${backendUrl}/comments`, {
      transports: ['websocket'],
      withCredentials: true,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('Connected to comments WebSocket');
      socket.emit('joinStream', { streamId });
    });

    socket.on('newComment', (comment: Comment) => {
      if (comment.status === CommentStatus.APPROVED) {
        setComments((prev) => {
          const newComments = [...prev, comment];
          if (newComments.length > maxVisible) {
            newComments.shift();
          }
          return newComments;
        });

        setTimeout(() => {
          setComments((prev) => prev.filter((c) => c.id !== comment.id));
        }, displayDuration);
      }
    });

    socket.on('commentModerated', (comment: Comment) => {
      if (comment.status === CommentStatus.APPROVED) {
        setComments((prev) => {
          const exists = prev.find((c) => c.id === comment.id);
          if (!exists) {
            const newComments = [...prev, comment];
            if (newComments.length > maxVisible) {
              newComments.shift();
            }
            return newComments;
          }
          return prev;
        });
      } else {
        setComments((prev) => prev.filter((c) => c.id !== comment.id));
      }
    });

    socket.on('commentDeleted', ({ commentId }: { commentId: string }) => {
      setComments((prev) => prev.filter((c) => c.id !== commentId));
    });

    return () => {
      socket.emit('leaveStream', { streamId });
      socket.disconnect();
    };
  }, [streamId, maxVisible, displayDuration]);

  const positionClasses = {
    'top-left': 'top-4 left-4',
    'top-right': 'top-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'bottom-right': 'bottom-4 right-4',
  };

  return (
    <div
      className={`fixed ${positionClasses[position]} z-50 space-y-2 max-w-md`}
    >
      {comments.map((comment) => (
        <div
          key={comment.id}
          className="bg-black/80 text-white rounded-lg p-3 shadow-lg animate-slide-in-left backdrop-blur-sm"
        >
          <div className="flex items-start gap-3">
            {showAuthorImage && comment.authorImage && (
              <img
                src={comment.authorImage}
                alt={comment.authorName}
                className="w-10 h-10 rounded-full flex-shrink-0"
              />
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-semibold text-sm truncate">
                  {comment.authorName}
                </span>
                {showSource && (
                  <span
                    className={`text-xs px-2 py-0.5 rounded ${SOURCE_COLORS[comment.source]} uppercase font-medium`}
                  >
                    {comment.source}
                  </span>
                )}
              </div>
              <p className="text-sm leading-relaxed break-words">
                {comment.text}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
