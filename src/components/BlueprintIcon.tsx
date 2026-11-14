import React from 'react';
import { Icon } from '@iconify/react';
import {
  Terminal,
  Cpu,
  Search,
  FolderTree,
  FileCode,
  Bot,
  BrainCircuit,
  Wrench,
  Boxes,
  Workflow,
  ShieldCheck,
  FileText,
  CornerDownRight,
  GitBranch,
  RefreshCw,
  Database,
  Layers,
  Code2,
} from 'lucide-react';

export type BlueprintIconName =
  | 'terminal'
  | 'cpu'
  | 'search'
  | 'folder-tree'
  | 'file-code'
  | 'bot'
  | 'brain'
  | 'wrench'
  | 'boxes'
  | 'workflow'
  | 'shield'
  | 'file-text'
  | 'corner-down'
  | 'git-branch'
  | 'refresh'
  | 'database'
  | 'layers'
  | 'code';

export interface IconStyleDef {
  color: string;
  bg: string;
  border: string;
  glow: string;
}

export const BLUEPRINT_ICON_STYLES: Record<string, IconStyleDef> = {
  'terminal': {
    color: 'text-sky-400',
    bg: 'bg-sky-500/15',
    border: 'border-sky-500/40',
    glow: 'rgba(56, 189, 248, 0.4)',
  },
  'cpu': {
    color: 'text-cyan-400',
    bg: 'bg-cyan-500/15',
    border: 'border-cyan-500/40',
    glow: 'rgba(34, 211, 238, 0.4)',
  },
  'search': {
    color: 'text-teal-400',
    bg: 'bg-teal-500/15',
    border: 'border-teal-500/40',
    glow: 'rgba(45, 212, 191, 0.4)',
  },
  'folder-tree': {
    color: 'text-amber-400',
    bg: 'bg-amber-500/15',
    border: 'border-amber-500/40',
    glow: 'rgba(251, 191, 36, 0.4)',
  },
  'file-code': {
    color: 'text-fuchsia-400',
    bg: 'bg-fuchsia-500/15',
    border: 'border-fuchsia-500/40',
    glow: 'rgba(232, 121, 249, 0.4)',
  },
  'bot': {
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/15',
    border: 'border-emerald-500/40',
    glow: 'rgba(52, 211, 153, 0.4)',
  },
  'brain': {
    color: 'text-purple-400',
    bg: 'bg-purple-500/15',
    border: 'border-purple-500/40',
    glow: 'rgba(192, 132, 252, 0.4)',
  },
  'wrench': {
    color: 'text-amber-400',
    bg: 'bg-amber-500/15',
    border: 'border-amber-500/40',
    glow: 'rgba(251, 191, 36, 0.45)',
  },
  'shield': {
    color: 'text-rose-400',
    bg: 'bg-rose-500/15',
    border: 'border-rose-500/40',
    glow: 'rgba(244, 63, 94, 0.45)',
  },
  'workflow': {
    color: 'text-blue-400',
    bg: 'bg-blue-500/15',
    border: 'border-blue-500/40',
    glow: 'rgba(96, 165, 250, 0.45)',
  },
  'file-text': {
    color: 'text-teal-400',
    bg: 'bg-teal-500/15',
    border: 'border-teal-500/40',
    glow: 'rgba(45, 212, 191, 0.45)',
  },
  'corner-down': {
    color: 'text-pink-400',
    bg: 'bg-pink-500/15',
    border: 'border-pink-500/40',
    glow: 'rgba(244, 114, 182, 0.45)',
  },
  'git-branch': {
    color: 'text-yellow-400',
    bg: 'bg-yellow-500/15',
    border: 'border-yellow-500/40',
    glow: 'rgba(250, 204, 21, 0.45)',
  },
  'refresh': {
    color: 'text-cyan-400',
    bg: 'bg-cyan-500/15',
    border: 'border-cyan-500/40',
    glow: 'rgba(34, 211, 238, 0.45)',
  },
  'database': {
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/15',
    border: 'border-emerald-500/40',
    glow: 'rgba(52, 211, 153, 0.45)',
  },
  'layers': {
    color: 'text-violet-400',
    bg: 'bg-violet-500/15',
    border: 'border-violet-500/40',
    glow: 'rgba(167, 139, 250, 0.45)',
  },
  'boxes': {
    color: 'text-indigo-400',
    bg: 'bg-indigo-500/15',
    border: 'border-indigo-500/40',
    glow: 'rgba(129, 140, 248, 0.45)',
  },
  'code': {
    color: 'text-sky-300',
    bg: 'bg-sky-500/15',
    border: 'border-sky-500/40',
    glow: 'rgba(56, 189, 248, 0.35)',
  },
};

export const BLUEPRINT_ICONIFY_MAP: Record<string, string> = {
  'terminal': 'flat-color-icons:command-line',
  'cpu': 'flat-color-icons:electronics',
  'search': 'flat-color-icons:search',
  'folder-tree': 'vscode-icons:default-folder',
  'file-code': 'vscode-icons:file-type-python',
  'bot': 'flat-color-icons:assistant',
  'brain': 'flat-color-icons:idea',
  'wrench': 'flat-color-icons:support',
  'shield': 'flat-color-icons:privacy',
  'workflow': 'flat-color-icons:flow-chart',
  'file-text': 'flat-color-icons:rules',
  'corner-down': 'flat-color-icons:right-up',
  'git-branch': 'flat-color-icons:org-unit',
  'refresh': 'flat-color-icons:synchronize',
  'database': 'flat-color-icons:database',
  'layers': 'flat-color-icons:stack',
  'boxes': 'flat-color-icons:package',
  'code': 'flat-color-icons:source-code',
};

const DEFAULT_STYLE: IconStyleDef = {
  color: 'text-blue-400',
  bg: 'bg-blue-500/15',
  border: 'border-blue-500/40',
  glow: 'rgba(96, 165, 250, 0.4)',
};

interface BlueprintIconProps {
  name: string;
  className?: string;
  withContainer?: boolean;
  preferLucide?: boolean;
}

export const BlueprintIcon: React.FC<BlueprintIconProps> = ({
  name,
  className = 'w-3.5 h-3.5',
  withContainer = false,
  preferLucide = false,
}) => {
  const style = BLUEPRINT_ICON_STYLES[name] || DEFAULT_STYLE;
  const iconifyName = BLUEPRINT_ICONIFY_MAP[name];

  const renderLucideFallback = () => {
    switch (name) {
      case 'terminal':
        return <Terminal className={className} strokeWidth={2.2} />;
      case 'cpu':
        return <Cpu className={className} strokeWidth={2.2} />;
      case 'search':
        return <Search className={className} strokeWidth={2.2} />;
      case 'folder-tree':
        return <FolderTree className={className} strokeWidth={2.2} />;
      case 'file-code':
        return <FileCode className={className} strokeWidth={2.2} />;
      case 'bot':
        return <Bot className={className} strokeWidth={2.2} />;
      case 'brain':
        return <BrainCircuit className={className} strokeWidth={2.2} />;
      case 'wrench':
        return <Wrench className={className} strokeWidth={2.2} />;
      case 'boxes':
        return <Boxes className={className} strokeWidth={2.2} />;
      case 'workflow':
        return <Workflow className={className} strokeWidth={2.2} />;
      case 'shield':
        return <ShieldCheck className={className} strokeWidth={2.2} />;
      case 'file-text':
        return <FileText className={className} strokeWidth={2.2} />;
      case 'corner-down':
        return <CornerDownRight className={className} strokeWidth={2.2} />;
      case 'git-branch':
        return <GitBranch className={className} strokeWidth={2.2} />;
      case 'refresh':
        return <RefreshCw className={className} strokeWidth={2.2} />;
      case 'database':
        return <Database className={className} strokeWidth={2.2} />;
      case 'layers':
        return <Layers className={className} strokeWidth={2.2} />;
      case 'code':
      default:
        return <Code2 className={className} strokeWidth={2.2} />;
    }
  };

  const renderIcon = () => {
    if (!preferLucide && iconifyName) {
      const size = className.includes('w-4') || className.includes('w-5') ? 18 : 15;
      return (
        <Icon
          icon={iconifyName}
          width={size}
          height={size}
          className="shrink-0"
        />
      );
    }
    return renderLucideFallback();
  };

  if (withContainer) {
    return (
      <span
        className={`inline-flex items-center justify-center p-1 rounded-[4px] border shrink-0 transition-transform ${style.bg} ${style.border} ${style.color}`}
        style={{
          boxShadow: `0 0 8px ${style.glow}`,
        }}
      >
        {renderIcon()}
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center shrink-0 ${style.color}`}>
      {renderIcon()}
    </span>
  );
};
