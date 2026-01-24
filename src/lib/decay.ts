import { CORRUPTION_MAP, DECAY_CONFIG, TextBlock, AgeStain, Bruise, DocumentPage } from '@/types/document';

// Memoization cache for corruption results
const corruptionCache = new Map<string, string>();

export function generateId(): string {
  return Math.random().toString(36).substring(2, 11);
}

export function corruptText(text: string, decayLevel: number): string {
  if (decayLevel < 15) return text;
  
  const cacheKey = `${text}-${Math.floor(decayLevel / 5)}`; // Cache in 5% buckets
  if (corruptionCache.has(cacheKey)) {
    return corruptionCache.get(cacheKey)!;
  }

  const corruptionProbability = Math.min(decayLevel / 100, 0.6);
  
  const corrupted = text.split('').map(char => {
    if (CORRUPTION_MAP[char] && Math.random() < corruptionProbability * 0.25) {
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
  // Never go below MIN_OPACITY (45%)
  const reduction = decayLevel * DECAY_CONFIG.MAX_OPACITY_REDUCTION;
  return Math.max(DECAY_CONFIG.MIN_OPACITY, 1 - reduction);
}

export function calculateBlur(decayLevel: number): number {
  if (decayLevel <= DECAY_CONFIG.BLUR_THRESHOLD) return 0;
  const progress = (decayLevel - DECAY_CONFIG.BLUR_THRESHOLD) / (100 - DECAY_CONFIG.BLUR_THRESHOLD);
  return progress * DECAY_CONFIG.BLUR_MAX;
}

export function calculateTextColor(decayLevel: number): string {
  // Shift from ink-black to brownish faded, but keep readable
  const lightness = 13 + (decayLevel * 0.2); // 13% to 33%
  const saturation = 30 - (decayLevel * 0.1); // 30% to 20%
  return `hsl(36, ${saturation}%, ${lightness}%)`;
}

export function generateRandomStain(blockId: string): AgeStain {
  const types: AgeStain['type'][] = ['stain', 'coffee', 'bruise'];
  return {
    id: generateId(),
    x: Math.random() * 80 + 10, // 10-90%
    y: Math.random() * 80 + 10,
    size: Math.random() * 40 + 20, // 20-60px
    opacity: Math.random() * 0.25 + 0.08, // 0.08-0.33
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
    opacity: Math.random() * 0.12 + 0.04,
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

export function createNewPage(pageNumber: number): DocumentPage {
  return {
    id: generateId(),
    pageNumber,
    blocks: [createNewBlock(0)],
    bruises: [],
    backgroundYellowing: 0,
    createdAt: Date.now(),
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

export function exportDocumentToText(title: string, pages: DocumentPage[]): string {
  let content = `${title}\n${'='.repeat(title.length)}\n\n`;
  
  pages.forEach((page, index) => {
    content += `--- Page ${index + 1} ---\n\n`;
    page.blocks.forEach(block => {
      if (block.content.trim()) {
        content += `${block.content}\n\n`;
      }
    });
  });
  
  return content;
}

export function downloadDocument(title: string, pages: DocumentPage[]) {
  const content = exportDocumentToText(title, pages);
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${title.replace(/[^a-z0-9]/gi, '_')}_aged_document.txt`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
