export enum LayoutType {
  GRID = 'grid',
  SIDEBAR = 'sidebar',
  SPOTLIGHT = 'spotlight',
  PICTURE_IN_PICTURE = 'picture-in-picture',
  FULLSCREEN = 'fullscreen',
}

export interface Position {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ParticipantSlot {
  participantId?: string;
  position: Position;
  zIndex: number;
  isSpeaker?: boolean;
}

export interface OverlayElement {
  id: string;
  type: 'logo' | 'text' | 'image' | 'lower-third';
  position: Position;
  zIndex: number;
  url?: string;
  text?: string;
  style?: {
    fontSize?: number;
    fontFamily?: string;
    color?: string;
    backgroundColor?: string;
    opacity?: number;
    borderRadius?: number;
  };
  animation?: {
    type: 'fade' | 'slide' | 'none';
    duration?: number;
  };
}

export interface Layout {
  id: string;
  name: string;
  type: LayoutType;
  canvasWidth: number;
  canvasHeight: number;
  slots: ParticipantSlot[];
  overlays: OverlayElement[];
  backgroundColor?: string;
}

export interface Scene {
  id: string;
  name: string;
  layoutId: string;
  overlays: OverlayElement[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CompositorConfig {
  width: number;
  height: number;
  framerate: number;
  bitrate: number;
  enableAudio: boolean;
}

export const DEFAULT_LAYOUTS: Record<LayoutType, Omit<Layout, 'id'>> = {
  [LayoutType.GRID]: {
    name: 'Grid',
    type: LayoutType.GRID,
    canvasWidth: 1920,
    canvasHeight: 1080,
    slots: [
      { position: { x: 0, y: 0, width: 960, height: 540 }, zIndex: 1 },
      { position: { x: 960, y: 0, width: 960, height: 540 }, zIndex: 1 },
      { position: { x: 0, y: 540, width: 960, height: 540 }, zIndex: 1 },
      { position: { x: 960, y: 540, width: 960, height: 540 }, zIndex: 1 },
    ],
    overlays: [],
  },
  [LayoutType.SIDEBAR]: {
    name: 'Sidebar',
    type: LayoutType.SIDEBAR,
    canvasWidth: 1920,
    canvasHeight: 1080,
    slots: [
      { position: { x: 0, y: 0, width: 1440, height: 1080 }, zIndex: 1, isSpeaker: true },
      { position: { x: 1440, y: 0, width: 480, height: 360 }, zIndex: 2 },
      { position: { x: 1440, y: 360, width: 480, height: 360 }, zIndex: 2 },
      { position: { x: 1440, y: 720, width: 480, height: 360 }, zIndex: 2 },
    ],
    overlays: [],
  },
  [LayoutType.SPOTLIGHT]: {
    name: 'Spotlight',
    type: LayoutType.SPOTLIGHT,
    canvasWidth: 1920,
    canvasHeight: 1080,
    slots: [
      { position: { x: 240, y: 90, width: 1440, height: 900 }, zIndex: 1, isSpeaker: true },
    ],
    overlays: [],
  },
  [LayoutType.PICTURE_IN_PICTURE]: {
    name: 'Picture in Picture',
    type: LayoutType.PICTURE_IN_PICTURE,
    canvasWidth: 1920,
    canvasHeight: 1080,
    slots: [
      { position: { x: 0, y: 0, width: 1920, height: 1080 }, zIndex: 1, isSpeaker: true },
      { position: { x: 1440, y: 720, width: 400, height: 300 }, zIndex: 2 },
    ],
    overlays: [],
  },
  [LayoutType.FULLSCREEN]: {
    name: 'Fullscreen',
    type: LayoutType.FULLSCREEN,
    canvasWidth: 1920,
    canvasHeight: 1080,
    slots: [
      { position: { x: 0, y: 0, width: 1920, height: 1080 }, zIndex: 1, isSpeaker: true },
    ],
    overlays: [],
  },
};

export const DEFAULT_COMPOSITOR_CONFIG: CompositorConfig = {
  width: 1920,
  height: 1080,
  framerate: 30,
  bitrate: 2500000, // 2.5 Mbps
  enableAudio: true,
};
