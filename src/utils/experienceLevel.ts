// ============================================================================
// Experience levels: Beginner / Intermediate / Senior
// Levels only change what is *shown by default*. Nothing is ever deleted —
// switching to Senior always shows the complete workspace.
// ============================================================================

export type ExperienceLevel = 'beginner' | 'intermediate' | 'senior';

export type BlueprintModeKey = 'aligned' | 'blocks' | 'code' | 'flowchart' | 'deep' | 'variables' | '3d';

export interface LevelFeatures {
  /** Blueprint view tabs shown in the right pane header */
  blueprintModes: BlueprintModeKey[];
  /** Multi-file "Module Imports" section in the side menu */
  showModuleImports: boolean;
  /** "Convert Code" tool (sidebar + AI Insights tab) */
  showConvertTools: boolean;
  /** KB / LITERAL source badges on explanation rows */
  showSourceBadges: boolean;
  /** How much the friendly error card explains */
  friendlyErrors: 'full' | 'summary' | 'compact';
  /** Step-by-step narration bar detail */
  narrator: 'full' | 'compact';
  /** Show the Lessons button prominently in the toolbar */
  emphasizeLessons: boolean;
  /** Show text labels next to toolbar icons */
  toolbarLabels: boolean;
}

export const LEVEL_FEATURES: Record<ExperienceLevel, LevelFeatures> = {
  beginner: {
    blueprintModes: ['aligned', '3d', 'flowchart', 'variables', 'deep'],
    showModuleImports: false,
    showConvertTools: false,
    showSourceBadges: false,
    friendlyErrors: 'full',
    narrator: 'full',
    emphasizeLessons: true,
    toolbarLabels: true,
  },
  intermediate: {
    blueprintModes: ['aligned', 'blocks', 'code', 'flowchart', 'deep', 'variables', '3d'],
    showModuleImports: true,
    showConvertTools: true,
    showSourceBadges: false,
    friendlyErrors: 'summary',
    narrator: 'full',
    emphasizeLessons: true,
    toolbarLabels: false,
  },
  senior: {
    blueprintModes: ['aligned', 'blocks', 'code', 'flowchart', 'deep', 'variables', '3d'],
    showModuleImports: true,
    showConvertTools: true,
    showSourceBadges: true,
    friendlyErrors: 'compact',
    narrator: 'compact',
    emphasizeLessons: false,
    toolbarLabels: false,
  },
};

export interface LevelMeta {
  key: ExperienceLevel;
  label: string;
  tagline: string;
  description: string;
}

export const LEVEL_META: LevelMeta[] = [
  {
    key: 'beginner',
    label: 'Beginner',
    tagline: 'New to coding',
    description: 'A focused workspace: write code, run it, and read plain-English explanations. Errors are explained step by step.',
  },
  {
    key: 'intermediate',
    label: 'Intermediate',
    tagline: 'Know the basics',
    description: 'Adds architecture blocks, pseudocode, multi-file imports and code conversion, with short error summaries.',
  },
  {
    key: 'senior',
    label: 'Senior',
    tagline: 'Experienced developer',
    description: 'The complete workspace with every tool and badge visible, compact errors and raw tracebacks first.',
  },
];

const LEVEL_KEY = 'nexus_experience_level';
const TOUR_KEY = 'nexus_tour_completed';

export function loadExperienceLevel(): ExperienceLevel | null {
  try {
    const v = localStorage.getItem(LEVEL_KEY);
    return v === 'beginner' || v === 'intermediate' || v === 'senior' ? v : null;
  } catch {
    return null;
  }
}

export function saveExperienceLevel(level: ExperienceLevel) {
  try {
    localStorage.setItem(LEVEL_KEY, level);
  } catch {}
}

export function isTourCompleted(): boolean {
  try {
    return localStorage.getItem(TOUR_KEY) === 'true';
  } catch {
    return true; // storage blocked: don't nag on every visit
  }
}

export function markTourCompleted() {
  try {
    localStorage.setItem(TOUR_KEY, 'true');
  } catch {}
}
