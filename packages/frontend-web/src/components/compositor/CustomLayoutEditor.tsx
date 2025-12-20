'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { Layout, ParticipantSlot, Position, LayoutType } from '@streamus/shared';

interface CustomLayoutEditorProps {
  participants: string[];
  onSave: (layout: Layout) => void;
  onCancel: () => void;
}

const CANVAS_WIDTH = 1920;
const CANVAS_HEIGHT = 1080;
const MIN_SLOT_SIZE = 100;

type ResizeHandle = 'n' | 's' | 'e' | 'w' | 'nw' | 'ne' | 'sw' | 'se' | null;

export default function CustomLayoutEditor({
  participants,
  onSave,
  onCancel,
}: CustomLayoutEditorProps) {
  const [slots, setSlots] = useState<ParticipantSlot[]>(
    participants.map((participantId, index) => ({
      participantId,
      position: {
        x: (index % 2) * 960,
        y: Math.floor(index / 2) * 540,
        width: 960,
        height: 540,
      },
      zIndex: index + 1,
    }))
  );
  
  const [selectedSlotIndex, setSelectedSlotIndex] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [resizeHandle, setResizeHandle] = useState<ResizeHandle>(null);
  const [dragStart, setDragStart] = useState<{x: number; y: number; slot: ParticipantSlot} | null>(null);
  const editorRef = useRef<HTMLDivElement>(null);

  const getScaledPosition = (clientX: number, clientY: number) => {
    if (!editorRef.current) return { x: 0, y: 0 };
    
    const rect = editorRef.current.getBoundingClientRect();
    const scaleX = CANVAS_WIDTH / rect.width;
    const scaleY = CANVAS_HEIGHT / rect.height;
    
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  };

  const handleMouseDown = (index: number, e: React.MouseEvent, handle: ResizeHandle = null) => {
    e.stopPropagation();
    setSelectedSlotIndex(index);
    const pos = getScaledPosition(e.clientX, e.clientY);
    setDragStart({ x: pos.x, y: pos.y, slot: { ...slots[index] } });
    
    if (handle) {
      setResizeHandle(handle);
    } else {
      setIsDragging(true);
    }
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging && !resizeHandle) return;
    if (selectedSlotIndex === null || !dragStart) return;

    const currentPos = getScaledPosition(e.clientX, e.clientY);
    const deltaX = currentPos.x - dragStart.x;
    const deltaY = currentPos.y - dragStart.y;

    setSlots(prevSlots => {
      const newSlots = [...prevSlots];
      const slot = newSlots[selectedSlotIndex];
      const originalSlot = dragStart.slot;

      if (isDragging) {
        slot.position = {
          ...slot.position,
          x: Math.max(0, Math.min(CANVAS_WIDTH - slot.position.width, originalSlot.position.x + deltaX)),
          y: Math.max(0, Math.min(CANVAS_HEIGHT - slot.position.height, originalSlot.position.y + deltaY)),
        };
      } else if (resizeHandle) {
        let newX = originalSlot.position.x;
        let newY = originalSlot.position.y;
        let newWidth = originalSlot.position.width;
        let newHeight = originalSlot.position.height;

        if (resizeHandle.includes('n')) {
          newY = Math.max(0, originalSlot.position.y + deltaY);
          newHeight = Math.max(MIN_SLOT_SIZE, originalSlot.position.height - deltaY);
          if (newY + newHeight > CANVAS_HEIGHT) {
            newHeight = CANVAS_HEIGHT - newY;
          }
        }
        if (resizeHandle.includes('s')) {
          newHeight = Math.max(MIN_SLOT_SIZE, originalSlot.position.height + deltaY);
          if (originalSlot.position.y + newHeight > CANVAS_HEIGHT) {
            newHeight = CANVAS_HEIGHT - originalSlot.position.y;
          }
        }
        if (resizeHandle.includes('w')) {
          newX = Math.max(0, originalSlot.position.x + deltaX);
          newWidth = Math.max(MIN_SLOT_SIZE, originalSlot.position.width - deltaX);
          if (newX + newWidth > CANVAS_WIDTH) {
            newWidth = CANVAS_WIDTH - newX;
          }
        }
        if (resizeHandle.includes('e')) {
          newWidth = Math.max(MIN_SLOT_SIZE, originalSlot.position.width + deltaX);
          if (originalSlot.position.x + newWidth > CANVAS_WIDTH) {
            newWidth = CANVAS_WIDTH - originalSlot.position.x;
          }
        }

        slot.position = { x: newX, y: newY, width: newWidth, height: newHeight };
      }

      return newSlots;
    });
  }, [isDragging, resizeHandle, selectedSlotIndex, dragStart]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setResizeHandle(null);
    setDragStart(null);
  }, []);

  useEffect(() => {
    if (isDragging || resizeHandle) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, resizeHandle, handleMouseMove, handleMouseUp]);

  const handleSave = () => {
    const customLayout: Layout = {
      id: `custom-${Date.now()}`,
      name: 'Custom Layout',
      type: LayoutType.GRID,
      canvasWidth: CANVAS_WIDTH,
      canvasHeight: CANVAS_HEIGHT,
      slots,
      overlays: [],
    };
    onSave(customLayout);
  };

  const handleAddSlot = () => {
    const newSlot: ParticipantSlot = {
      position: {
        x: 100,
        y: 100,
        width: 480,
        height: 360,
      },
      zIndex: slots.length + 1,
    };
    setSlots([...slots, newSlot]);
  };

  const handleDeleteSlot = (index: number) => {
    setSlots(slots.filter((_, i) => i !== index));
    setSelectedSlotIndex(null);
  };

  const ResizeHandles = ({ index }: { index: number }) => {
    const handles: { handle: ResizeHandle; className: string; cursor: string }[] = [
      { handle: 'nw', className: 'top-0 left-0 -translate-x-1/2 -translate-y-1/2', cursor: 'cursor-nw-resize' },
      { handle: 'n', className: 'top-0 left-1/2 -translate-x-1/2 -translate-y-1/2', cursor: 'cursor-n-resize' },
      { handle: 'ne', className: 'top-0 right-0 translate-x-1/2 -translate-y-1/2', cursor: 'cursor-ne-resize' },
      { handle: 'e', className: 'top-1/2 right-0 translate-x-1/2 -translate-y-1/2', cursor: 'cursor-e-resize' },
      { handle: 'se', className: 'bottom-0 right-0 translate-x-1/2 translate-y-1/2', cursor: 'cursor-se-resize' },
      { handle: 's', className: 'bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2', cursor: 'cursor-s-resize' },
      { handle: 'sw', className: 'bottom-0 left-0 -translate-x-1/2 translate-y-1/2', cursor: 'cursor-sw-resize' },
      { handle: 'w', className: 'top-1/2 left-0 -translate-x-1/2 -translate-y-1/2', cursor: 'cursor-w-resize' },
    ];

    return (
      <>
        {handles.map(({ handle, className, cursor }) => (
          <div
            key={handle}
            className={`absolute w-3 h-3 bg-blue-500 rounded-full hover:bg-blue-400 ${className} ${cursor}`}
            onMouseDown={(e) => handleMouseDown(index, e, handle)}
          />
        ))}
      </>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 z-[60] flex items-center justify-center" onClick={onCancel}>
      <div className="bg-gray-800 rounded-lg p-6 max-w-6xl w-full max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-white text-xl font-semibold">Custom Layout Editor</h2>
          <button onClick={onCancel} className="text-gray-400 hover:text-white">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 flex gap-4 overflow-hidden">
          <div className="flex-1 flex flex-col">
            <div className="text-white text-sm mb-2">
              💡 Drag to move • Drag edges/corners to resize • Click slot to select
            </div>
            <div
              ref={editorRef}
              className="flex-1 bg-black relative rounded-lg overflow-hidden"
              style={{ aspectRatio: '16/9' }}
            >
              {slots.map((slot, index) => {
                const isSelected = selectedSlotIndex === index;
                const editorRect = editorRef.current?.getBoundingClientRect();
                if (!editorRect) return null;
                
                const scaleX = editorRect.width / CANVAS_WIDTH;
                const scaleY = editorRect.height / CANVAS_HEIGHT;
                
                return (
                  <div
                    key={index}
                    className={`absolute border-2 ${
                      isSelected ? 'border-blue-500' : 'border-gray-500'
                    } bg-gray-700 bg-opacity-50 cursor-move hover:border-blue-400 transition`}
                    style={{
                      left: slot.position.x * scaleX,
                      top: slot.position.y * scaleY,
                      width: slot.position.width * scaleX,
                      height: slot.position.height * scaleY,
                    }}
                    onMouseDown={(e) => handleMouseDown(index, e)}
                  >
                    <div className="absolute inset-0 flex items-center justify-center text-white text-sm pointer-events-none">
                      <div className="bg-black bg-opacity-60 px-2 py-1 rounded">
                        {slot.participantId ? `Participant ${index + 1}` : `Slot ${index + 1}`}
                      </div>
                    </div>
                    
                    {isSelected && (
                      <>
                        <ResizeHandles index={index} />
                        <button
                          onClick={() => handleDeleteSlot(index)}
                          className="absolute top-1 right-1 w-5 h-5 bg-red-600 rounded hover:bg-red-700 flex items-center justify-center text-white text-xs z-10"
                        >
                          ×
                        </button>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="w-64 flex flex-col gap-4">
            <div className="bg-gray-700 rounded-lg p-4">
              <h3 className="text-white font-medium mb-3">Controls</h3>
              <div className="space-y-2">
                <button
                  onClick={handleAddSlot}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                >
                  + Add Slot
                </button>
                <button
                  onClick={handleSave}
                  className="w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
                  disabled={slots.length === 0}
                >
                  Save Layout
                </button>
                <button
                  onClick={onCancel}
                  className="w-full px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-500 text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>

            {selectedSlotIndex !== null && (
              <div className="bg-gray-700 rounded-lg p-4">
                <h3 className="text-white font-medium mb-3">Selected Slot</h3>
                <div className="text-white text-xs space-y-2">
                  <div>
                    <span className="text-gray-400">X:</span> {Math.round(slots[selectedSlotIndex].position.x)}px
                  </div>
                  <div>
                    <span className="text-gray-400">Y:</span> {Math.round(slots[selectedSlotIndex].position.y)}px
                  </div>
                  <div>
                    <span className="text-gray-400">Width:</span> {Math.round(slots[selectedSlotIndex].position.width)}px
                  </div>
                  <div>
                    <span className="text-gray-400">Height:</span> {Math.round(slots[selectedSlotIndex].position.height)}px
                  </div>
                </div>
              </div>
            )}

            <div className="bg-gray-700 rounded-lg p-4">
              <h3 className="text-white font-medium mb-2">Tips</h3>
              <ul className="text-gray-300 text-xs space-y-1">
                <li>• Click to select a slot</li>
                <li>• Drag center to move</li>
                <li>• Drag edges to resize</li>
                <li>• Drag corners for diagonal resize</li>
                <li>• Click × to remove</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
