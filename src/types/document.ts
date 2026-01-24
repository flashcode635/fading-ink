export interface AgeStain {
  id: string;
  x: number; // percentage
  y: number; // percentage
  size: number; // pixels
  opacity: number;
  type: 'stain' | 'coffee' | 'bruise';
  rotation: number;
}

export interface TextBlock {
  id: string;
  content: string;
  originalContent: string;
  createdAt: number;
  lastEditedAt: number;
  decayLevel: number; // 0-100
  position: number;
  ageStains: AgeStain[];
  permanentDecayFloor: number; // minimum decay after failed restoration
  isBeingRestored: boolean;
}

export interface Bruise {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  opacity: number;
  rotation: number;
}

export interface DocumentState {
  id: string;
  title: string;
  blocks: TextBlock[];
  totalEdits: number;
  documentAge: number; // milliseconds since creation
  createdAt: number;
  globalDecayMultiplier: number;
  backgroundYellowing: number; // 0-100
  bruises: Bruise[];
  lastSavedAt: number;
  hasSeenWelcome: boolean;
}

export interface DecayParticle {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  opacity: number;
  size: number;
}

// Character corruption mappings
export const CORRUPTION_MAP: Record<string, string[]> = {
  'o': ['0', 'ø', 'ó', 'ò'],
  'O': ['0', 'Ø', 'Ó'],
  'l': ['1', 'I', '|', 'ł', '!'],
  'i': ['!', '1', '¡', 'ı'],
  'a': ['@', 'á', 'à', 'ä'],
  'e': ['3', 'é', 'è', 'ë'],
  's': ['$', '5', 'š', 'ś'],
  't': ['+', '†', 'ť'],
  'n': ['ñ', 'ń', 'η'],
  'c': ['ç', '(', '¢'],
  'u': ['ú', 'ù', 'ü', 'µ'],
  'A': ['Á', 'À', 'Ä', '@'],
  'E': ['É', 'È', 'Ë', '3'],
  'S': ['$', '5', 'Š'],
  'T': ['+', '†', 'Ť'],
};

export const DECAY_CONFIG = {
  BASE_DECAY_RATE: 0.5, // per second
  LENGTH_MULTIPLIER: 0.15, // additional decay per block
  EDIT_ACCELERATION: 4, // decay added to other blocks when one is edited
  YELLOWING_INCREMENT: 0.5, // background yellowing per edit
  DECAY_INTERVAL: 2000, // ms between decay calculations
  SAVE_INTERVAL: 5000, // ms between localStorage saves
  CRITICAL_THRESHOLD: 85, // decay level that triggers mini-game
  RESTORATION_TIME: 30, // seconds for mini-game
  RESTORATION_ACCURACY_THRESHOLD: 0.8, // 80% match required
  RESTORATION_BONUS_SECONDS: 5,
  FAILED_RESTORATION_PENALTY_MIN: 5,
  FAILED_RESTORATION_PENALTY_MAX: 10,
  MAX_OPACITY_REDUCTION: 0.007, // per decay level
  BLUR_THRESHOLD: 60, // decay level where blur starts
  BLUR_DIVISOR: 20, // controls blur intensity
};
