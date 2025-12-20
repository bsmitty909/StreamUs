'use client';

import { useState } from 'react';
import { Layout, LayoutType, DEFAULT_LAYOUTS } from '@streamus/shared';
import CustomLayoutEditor from './CustomLayoutEditor';

interface LayoutSwitcherProps {
  currentLayout: Layout;
  onLayoutChange: (layout: Layout) => void;
}

const LAYOUT_ICONS: Record<LayoutType, string> = {
  [LayoutType.GRID]: '🔲',
  [LayoutType.SIDEBAR]: '📊',
  [LayoutType.SPOTLIGHT]: '⭐',
  [LayoutType.PICTURE_IN_PICTURE]: '🖼️',
  [LayoutType.FULLSCREEN]: '🖥️',
};

const LAYOUT_DESCRIPTIONS: Record<LayoutType, string> = {
  [LayoutType.GRID]: 'Equal sized participants in a grid',
  [LayoutType.SIDEBAR]: 'Main speaker with sidebar guests',
  [LayoutType.SPOTLIGHT]: 'Single speaker in center',
  [LayoutType.PICTURE_IN_PICTURE]: 'Main view with overlay',
  [LayoutType.FULLSCREEN]: 'Full screen single participant',
};

export default function LayoutSwitcher({ currentLayout, onLayoutChange }: LayoutSwitcherProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showCustomEditor, setShowCustomEditor] = useState(false);
  const [participants, setParticipants] = useState<string[]>(['p1', 'p2', 'p3', 'p4']);

  const handleLayoutSelect = (layoutType: LayoutType) => {
    const defaultLayout = DEFAULT_LAYOUTS[layoutType];
    const newLayout: Layout = {
      ...defaultLayout,
      id: `layout-${Date.now()}`,
      overlays: currentLayout.overlays,
    };
    onLayoutChange(newLayout);
    setIsExpanded(false);
  };

  const handleCustomLayoutSave = (customLayout: Layout) => {
    onLayoutChange({
      ...customLayout,
      overlays: currentLayout.overlays,
    });
    setShowCustomEditor(false);
    setIsExpanded(false);
  };

  return (
    <>
      {showCustomEditor && (
        <CustomLayoutEditor
          participants={participants}
          onSave={handleCustomLayoutSave}
          onCancel={() => setShowCustomEditor(false)}
        />
      )}
      
      <div className="fixed bottom-6 left-6 z-50">
        {!isExpanded ? (
          <button
            onClick={() => setIsExpanded(true)}
            className="bg-gray-800 text-white px-6 py-3 rounded-lg shadow-lg hover:bg-gray-700 transition flex items-center space-x-2"
            title="Change Layout"
          >
            <span className="text-2xl">{LAYOUT_ICONS[currentLayout.type]}</span>
            <span className="font-medium">{currentLayout.name}</span>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        ) : (
          <div className="bg-gray-800 rounded-lg shadow-2xl p-4 w-80 max-h-[600px] flex flex-col">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-white font-semibold">Select Layout</h3>
              <button
                onClick={() => setIsExpanded(false)}
                className="text-gray-400 hover:text-white transition"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-2 overflow-y-auto pr-2">
              {Object.values(LayoutType).map((layoutType) => {
                const isActive = currentLayout.type === layoutType;
                return (
                  <button
                    key={layoutType}
                    onClick={() => handleLayoutSelect(layoutType)}
                    className={`w-full text-left p-2 rounded-lg transition ${
                      isActive
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-700 text-gray-200 hover:bg-gray-600'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <span className="text-xl">{LAYOUT_ICONS[layoutType]}</span>
                      <div className="flex-1">
                        <div className="font-medium text-sm">{DEFAULT_LAYOUTS[layoutType].name}</div>
                      </div>
                      {isActive && (
                        <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                    <div className="mt-1.5 bg-gray-900 rounded p-1.5">
                      <LayoutPreview layoutType={layoutType} />
                    </div>
                  </button>
                );
              })}
              
              <button
                onClick={() => {
                  setShowCustomEditor(true);
                  setIsExpanded(false);
                }}
                className="w-full text-left p-2 rounded-lg transition bg-purple-600 text-white hover:bg-purple-700"
              >
                <div className="flex items-center space-x-2">
                  <span className="text-xl">✏️</span>
                  <div className="flex-1">
                    <div className="font-medium text-sm">Custom Layout</div>
                  </div>
                </div>
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

function LayoutPreview({ layoutType }: { layoutType: LayoutType }) {
  const layout = DEFAULT_LAYOUTS[layoutType];
  const maxWidth = 320;
  const maxHeight = 180;
  const scale = Math.min(maxWidth / layout.canvasWidth, maxHeight / layout.canvasHeight);

  return (
    <div 
      className="relative bg-black"
      style={{
        width: layout.canvasWidth * scale,
        height: layout.canvasHeight * scale,
      }}
    >
      {layout.slots.map((slot, index) => (
        <div
          key={index}
          className="absolute border border-blue-400 bg-blue-900 bg-opacity-30"
          style={{
            left: slot.position.x * scale,
            top: slot.position.y * scale,
            width: slot.position.width * scale,
            height: slot.position.height * scale,
          }}
        >
          <div className="absolute inset-0 flex items-center justify-center">
            <svg className="w-8 h-8 text-blue-400 opacity-50" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
            </svg>
          </div>
        </div>
      ))}
    </div>
  );
}
