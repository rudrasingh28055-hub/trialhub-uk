export interface VideoEditState {
  // Filters
  brightness: number;
  contrast: number;
  saturation: number;
  selectedFilter: 'none' | 'grayscale' | 'sepia' | 'invert' | 'blur';
  
  // Transforms
  rotation: number;
  flipH: boolean;
  flipV: boolean;
  
  // Trim
  trimStart: number;
  trimEnd: number;
  currentTime: number;
  duration: number;
  isTrimming: boolean;
  
  // UI State
  activeTab: 'adjust' | 'filters' | 'transform' | 'trim';
  isPlaying: boolean;
  isExporting: boolean;
  showControls: boolean;
}

export interface VideoEditorProps {
  mediaUrl: string;
  mediaBucket?: string;
  mediaPath?: string;
  onClose: () => void;
  onSave: (editedUrl?: string) => void;
}
