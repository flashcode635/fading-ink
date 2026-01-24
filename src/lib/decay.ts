import { CORRUPTION_MAP, DECAY_CONFIG, TextBlock, AgeStain, Bruise } from '@/types/document';

// Memoization cache for corruption results
const corruptionCache = new Map<string, string>();

export function generateId(): string {
  return Math.random().toString(36).substring(2, 11);
}

export function corruptText(text: string, decayLevel: number): string {
  if (decayLevel < 10) return text;
  
  const cacheKey = `${text}-${Math.floor(decayLevel / 5)}`; // Cache in 5% buckets
  if (corruptionCache.has(cacheKey)) {
    return corruptionCache.get(cacheKey)!;
  }

  const corruptionProbability = Math.min(decayLevel / 100, 0.7);
  
  const corrupted = text.split('').map(char => {
    if (CORRUPTION_MAP[char] && Math.random() < corruptionProbability * 0.3) {
      const options = CORRUPTION_MAP[char];
      return options[Math.floor(Math.random() * options.length)];
    }
    return char;
  }).join('');

  // Limit cache size
  if (corruptionCache.size > 500) {
    const firstKey = corruptionCache.keys().next().value;
    if (firstKey) corruptionCache.delete(firstKey);
  }
  
  corruptionCache.set(cacheKey, corrupted);
  return corrupted;
}

export function calculateDecayRate(totalBlocks: number): number {
  return DECAY_CONFIG.BASE_DECAY_RATE * (1 + totalBlocks * DECAY_CONFIG.LENGTH_MULTIPLIER);
}

export function calculateOpacity(decayLevel: number): number {
  return Math.max(0.3, 1 - decayLevel * DECAY_CONFIG.MAX_OPACITY_REDUCTION);
}

export function calculateBlur(decayLevel: number): number {
  if (decayLevel <= DECAY_CONFIG.BLUR_THRESHOLD) return 0;
  return ((decayLevel - DECAY_CONFIG.BLUR_THRESHOLD) / DECAY_CONFIG.BLUR_DIVISOR) * 2;
}

export function calculateTextColor(decayLevel: number): string {
  // Shift from ink-black to brownish faded
  const lightness = 13 + (decayLevel * 0.25); // 13% to 38%
  const saturation = 30 - (decayLevel * 0.15); // 30% to 15%
  return `hsl(36, ${saturation}%, ${lightness}%)`;
}

export function generateRandomStain(blockId: string): AgeStain {
  const types: AgeStain['type'][] = ['stain', 'coffee', 'bruise'];
  return {
    id: generateId(),
    x: Math.random() * 80 + 10, // 10-90%
    y: Math.random() * 80 + 10,
    size: Math.random() * 40 + 20, // 20-60px
    opacity: Math.random() * 0.3 + 0.1, // 0.1-0.4
    type: types[Math.floor(Math.random() * types.length)],
    rotation: Math.random() * 360,
  };
}

export function generateRandomBruise(): Bruise {
  return {
    id: generateId(),
    x: Math.random() * 90 + 5,
    y: Math.random() * 90 + 5,
    width: Math.random() * 60 + 30,
    height: Math.random() * 40 + 20,
    opacity: Math.random() * 0.15 + 0.05,
    rotation: Math.random() * 180,
  };
}

export function createNewBlock(position: number, content: string = ''): TextBlock {
  const now = Date.now();
  return {
    id: generateId(),
    content,
    originalContent: content,
    createdAt: now,
    lastEditedAt: now,
    decayLevel: 0,
    position,
    ageStains: [],
    permanentDecayFloor: 0,
    isBeingRestored: false,
  };
}

// Levenshtein distance for accuracy calculation
export function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

export function calculateAccuracy(input: string, original: string): number {
  if (original.length === 0) return input.length === 0 ? 1 : 0;
  
  const distance = levenshteinDistance(
    input.toLowerCase().trim(),
    original.toLowerCase().trim()
  );
  const maxLength = Math.max(input.length, original.length);
  return Math.max(0, 1 - distance / maxLength);
}

export function getDecayLevelColor(decayLevel: number): string {
  if (decayLevel < 30) return 'hsl(120, 60%, 45%)'; // Green
  if (decayLevel < 60) return 'hsl(45, 90%, 50%)'; // Yellow
  if (decayLevel < 85) return 'hsl(25, 80%, 50%)'; // Orange
  return 'hsl(0, 70%, 45%)'; // Red
}

export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function formatAge(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ${hours % 24}h`;
  if (hours > 0) return `${hours}h ${minutes % 60}m`;
  if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
  return `${seconds}s`;
}
