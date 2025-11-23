import { useEffect, useState } from 'react';
import EnhancedMarkdown from './enhanced-markdown';

interface StreamingTextProps {
  text: string;
  isStreaming: boolean;
  className?: string;
}

export default function StreamingText({ text, isStreaming, className }: StreamingTextProps) {
  // 流式传输时直接显示累积的文本，完成后使用 EnhancedMarkdown 渲染
  return (
    <EnhancedMarkdown 
      content={text} 
      className={className}
      streaming={isStreaming}
    />
  );
}