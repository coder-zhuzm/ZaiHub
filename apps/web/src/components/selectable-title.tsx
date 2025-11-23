'use client';

import { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

interface Model {
  id: string;
  name: string;
  platform: string;
}

interface SelectableTitleProps {
  model: Model | null;
  windowIndex: number;
  models: Model[];
  isActive: boolean;
  onModelSelect: (windowIndex: number, modelId: string) => void;
  className?: string;
}

export default function SelectableTitle({ 
  model, 
  windowIndex, 
  models, 
  isActive, 
  onModelSelect,
  className 
}: SelectableTitleProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleSelect = (modelId: string) => {
    onModelSelect(windowIndex, modelId);
    setIsOpen(false);
  };

  // 点击外部关闭下拉菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      {/* 可点击的标题 */}
      <button
        onClick={() => isActive && setIsOpen(!isOpen)}
        className={cn(
          'text-xs font-medium text-left hover:bg-gray-50 rounded px-1 py-0.5 transition-colors truncate',
          isActive ? 'cursor-pointer' : 'cursor-default'
        )}
        disabled={!isActive}
      >
        <div className="flex items-center gap-1">
          <span>
            {model ? `${model.platform}:${model.name}` : `窗口 ${windowIndex + 1}`}
          </span>
          {isActive && (
            <svg 
              className={cn(
                'w-3 h-3 transition-transform',
                isOpen ? 'rotate-180' : ''
              )} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          )}
        </div>
      </button>

      {/* 下拉选择器 */}
      {isOpen && isActive && (
        <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded shadow-lg z-50 min-w-[150px] max-h-48 overflow-y-auto">
          <div className="py-1">
            {models.map(modelOption => (
              <button
                key={modelOption.id}
                onClick={() => handleSelect(modelOption.id)}
                className={cn(
                  'w-full text-left px-3 py-1.5 text-xs hover:bg-gray-50 transition-colors',
                  model?.id === modelOption.id ? 'bg-blue-50 text-blue-600' : 'text-gray-700'
                )}
              >
                <div className="flex items-center justify-between">
                  <span>{modelOption.name}</span>
                  <span className="text-gray-400 text-xs">{modelOption.platform}</span>
                </div>
              </button>
            ))}
            {models.length === 0 && (
              <div className="px-3 py-2 text-xs text-gray-500">
                暂无可用模型
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}