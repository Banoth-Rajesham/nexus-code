import React from 'react';
import { Icon } from '@iconify/react';
import { FileCode } from 'lucide-react';

interface FileIconProps {
  filename: string;
  className?: string;
  width?: number | string;
  height?: number | string;
}

export function getFileIconName(filename: string): string {
  const lower = filename.toLowerCase();
  if (lower.endsWith('.py')) return 'vscode-icons:file-type-python';
  if (lower.endsWith('.js') || lower.endsWith('.jsx')) return 'vscode-icons:file-type-js';
  if (lower.endsWith('.ts') || lower.endsWith('.tsx')) return 'vscode-icons:file-type-typescript';
  if (
    lower.endsWith('.cpp') ||
    lower.endsWith('.cc') ||
    lower.endsWith('.cxx') ||
    lower.endsWith('.c') ||
    lower.endsWith('.h') ||
    lower.endsWith('.hpp')
  ) {
    return 'vscode-icons:file-type-cpp';
  }
  if (lower.endsWith('.java')) return 'vscode-icons:file-type-java';
  if (lower.endsWith('.go')) return 'vscode-icons:file-type-go';
  if (lower.endsWith('.rs')) return 'vscode-icons:file-type-rust';
  if (lower.endsWith('.json')) return 'vscode-icons:file-type-json';
  if (lower.endsWith('.html')) return 'vscode-icons:file-type-html';
  if (lower.endsWith('.css')) return 'vscode-icons:file-type-css';
  if (lower.endsWith('.md')) return 'vscode-icons:file-type-markdown';
  return 'vscode-icons:default-file';
}

export const FileIcon: React.FC<FileIconProps> = ({
  filename,
  className = '',
  width = 16,
  height = 16,
}) => {
  const icon = getFileIconName(filename);
  return (
    <span className={`inline-flex items-center justify-center shrink-0 ${className}`}>
      <Icon
        icon={icon}
        width={width}
        height={height}
        className="shrink-0"
      />
    </span>
  );
};

export function getLanguageDevicon(langKey: string): string {
  switch (langKey.toLowerCase()) {
    case 'python':
      return 'devicon:python';
    case 'javascript':
    case 'js':
      return 'devicon:javascript';
    case 'typescript':
    case 'ts':
      return 'devicon:typescript';
    case 'cpp':
    case 'c++':
      return 'devicon:cplusplus';
    case 'java':
      return 'devicon:java';
    case 'go':
    case 'golang':
      return 'devicon:go';
    case 'rust':
      return 'devicon:rust';
    default:
      return 'vscode-icons:default-file';
  }
}

export const LanguageIcon: React.FC<{
  language: string;
  className?: string;
  width?: number | string;
  height?: number | string;
}> = ({ language, className = '', width = 16, height = 16 }) => {
  const icon = getLanguageDevicon(language);
  return (
    <span className={`inline-flex items-center justify-center shrink-0 ${className}`}>
      <Icon icon={icon} width={width} height={height} className="shrink-0" />
    </span>
  );
};

