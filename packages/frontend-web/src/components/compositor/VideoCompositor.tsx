'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Layout, OverlayElement, CompositorConfig } from '@streamus/shared';
import { Participant, Track } from 'livekit-client';

interface VideoCompositorProps {
  layout: Layout;
  participants: Map<string, Participant>;
  config: CompositorConfig;
  onStreamReady?: (stream: MediaStream) => void;
}

export default function VideoCompositor({
  layout,
  participants,
  config,
  onStreamReady,
}: VideoCompositorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>();
  const videoElementsRef = useRef<Map<string, HTMLVideoElement>>(new Map());
  const overlayImagesRef = useRef<Map<string, HTMLImageElement>>(new Map());
  const composedStreamRef = useRef<MediaStream | null>(null);

  const drawVideoSlot = useCallback((
    ctx: CanvasRenderingContext2D,
    video: HTMLVideoElement,
    x: number,
    y: number,
    width: number,
    height: number
  ) => {
    if (video.readyState >= video.HAVE_CURRENT_DATA) {
      ctx.save();
      
      const aspectRatio = video.videoWidth / video.videoHeight;
      const targetAspect = width / height;
      
      let sx = 0, sy = 0, sw = video.videoWidth, sh = video.videoHeight;
      
      if (aspectRatio > targetAspect) {
        sw = video.videoHeight * targetAspect;
        sx = (video.videoWidth - sw) / 2;
      } else {
        sh = video.videoWidth / targetAspect;
        sy = (video.videoHeight - sh) / 2;
      }
      
      ctx.drawImage(video, sx, sy, sw, sh, x, y, width, height);
      ctx.restore();
    }
  }, []);

  const drawOverlay = useCallback((
    ctx: CanvasRenderingContext2D,
    overlay: OverlayElement
  ) => {
    ctx.save();
    
    if (overlay.style?.opacity !== undefined) {
      ctx.globalAlpha = overlay.style.opacity;
    }
    
    const { x, y, width, height } = overlay.position;
    
    switch (overlay.type) {
      case 'logo':
      case 'image':
        if (overlay.url) {
          const img = overlayImagesRef.current.get(overlay.id);
          if (img && img.complete) {
            ctx.drawImage(img, x, y, width, height);
          }
        }
        break;
        
      case 'text':
        if (overlay.text) {
          const style = overlay.style || {};
          
          if (style.backgroundColor) {
            ctx.fillStyle = style.backgroundColor;
            const radius = style.borderRadius || 0;
            
            if (radius > 0) {
              ctx.beginPath();
              ctx.roundRect(x, y, width, height, radius);
              ctx.fill();
            } else {
              ctx.fillRect(x, y, width, height);
            }
          }
          
          ctx.fillStyle = style.color || '#ffffff';
          ctx.font = `${style.fontSize || 24}px ${style.fontFamily || 'Arial'}`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(overlay.text, x + width / 2, y + height / 2);
        }
        break;
        
      case 'lower-third':
        if (overlay.text) {
          const style = overlay.style || {};
          ctx.fillStyle = style.backgroundColor || 'rgba(0, 0, 0, 0.7)';
          ctx.fillRect(x, y, width, height);
          
          ctx.fillStyle = style.color || '#ffffff';
          ctx.font = `${style.fontSize || 32}px ${style.fontFamily || 'Arial'}`;
          ctx.textAlign = 'left';
          ctx.textBaseline = 'middle';
          ctx.fillText(overlay.text, x + 20, y + height / 2);
        }
        break;
    }
    
    ctx.restore();
  }, []);

  const renderFrame = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.fillStyle = layout.backgroundColor || '#000000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    const participantArray = Array.from(participants.values());
    
    layout.slots.forEach((slot, index) => {
      if (slot.participantId) {
        const participant = participants.get(slot.participantId);
        if (participant) {
          const videoElement = videoElementsRef.current.get(slot.participantId);
          if (videoElement) {
            drawVideoSlot(
              ctx,
              videoElement,
              slot.position.x,
              slot.position.y,
              slot.position.width,
              slot.position.height
            );
          }
        }
      } else if (participantArray[index]) {
        const participant = participantArray[index];
        const videoElement = videoElementsRef.current.get(participant.identity);
        if (videoElement) {
          drawVideoSlot(
            ctx,
            videoElement,
            slot.position.x,
            slot.position.y,
            slot.position.width,
            slot.position.height
          );
        }
      }
    });
    
    const sortedOverlays = [...layout.overlays].sort((a, b) => a.zIndex - b.zIndex);
    sortedOverlays.forEach(overlay => {
      drawOverlay(ctx, overlay);
    });
    
    animationFrameRef.current = requestAnimationFrame(renderFrame);
  }, [layout, participants, drawVideoSlot, drawOverlay]);

  useEffect(() => {
    participants.forEach((participant) => {
      const existingVideo = videoElementsRef.current.get(participant.identity);
      if (existingVideo) return;
      
      const videoTrack = participant.videoTrackPublications.values().next().value?.track;
      if (videoTrack && videoTrack instanceof Track) {
        const videoElement = videoTrack.attach();
        videoElement.style.display = 'none';
        document.body.appendChild(videoElement);
        videoElementsRef.current.set(participant.identity, videoElement);
      }
    });
    
    videoElementsRef.current.forEach((videoElement, identity) => {
      if (!participants.has(identity)) {
        videoElement.remove();
        videoElementsRef.current.delete(identity);
      }
    });
  }, [participants]);

  useEffect(() => {
    layout.overlays.forEach((overlay) => {
      if ((overlay.type === 'logo' || overlay.type === 'image') && overlay.url) {
        if (!overlayImagesRef.current.has(overlay.id)) {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.src = overlay.url;
          overlayImagesRef.current.set(overlay.id, img);
        }
      }
    });
    
    overlayImagesRef.current.forEach((img, id) => {
      if (!layout.overlays.find(o => o.id === id)) {
        overlayImagesRef.current.delete(id);
      }
    });
  }, [layout.overlays]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    canvas.width = config.width;
    canvas.height = config.height;
    
    animationFrameRef.current = requestAnimationFrame(renderFrame);
    
    if (onStreamReady && !composedStreamRef.current) {
      const stream = canvas.captureStream(config.framerate);
      composedStreamRef.current = stream;
      onStreamReady(stream);
    }
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [config, renderFrame, onStreamReady]);

  useEffect(() => {
    return () => {
      videoElementsRef.current.forEach((video) => video.remove());
      videoElementsRef.current.clear();
      
      if (composedStreamRef.current) {
        composedStreamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="hidden"
      width={config.width}
      height={config.height}
    />
  );
}
