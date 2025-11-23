import { useState, useEffect, useRef } from 'react';
import EnhancedMarkdown from './enhanced-markdown';

interface TypewriterMarkdownProps {
  text: string;
  speed?: number;
  className?: string;
  onComplete?: () => void;
  isStreaming?: boolean;
}

export default function TypewriterMarkdown({
  text,
  speed = 20,
  className = '',
  onComplete,
  isStreaming = false
}: TypewriterMarkdownProps) {
  const [displayedText, setDisplayedText] = useState('');
  const [isComplete, setIsComplete] = useState(false);
  const currentIndexRef = useRef(0);
  const timeoutIdRef = useRef<NodeJS.Timeout | null>(null);
  const textRef = useRef('');
  const isInitializedRef = useRef(false);

  // 当文本变化时，重置或更新状态
  useEffect(() => {
    // 如果是新消息（文本长度变短或完全不同），重新开始
    if (text.length < textRef.current.length || 
        (textRef.current && !text.startsWith(textRef.current.substring(0, 10)))) {
      console.log('[Typewriter] New message detected, resetting');
      currentIndexRef.current = 0;
      setDisplayedText('');
      setIsComplete(false);
      isInitializedRef.current = false;
    }
    
    textRef.current = text;
    
    // 如果还没初始化，先显示空状态
    if (!isInitializedRef.current) {
      console.log('[Typewriter] Initializing with text:', text);
      isInitializedRef.current = true;
      setDisplayedText('');
      setIsComplete(false);
      currentIndexRef.current = 0;
    }
  }, [text]);

  // 打字效果
  useEffect(() => {
    if (timeoutIdRef.current) {
      clearTimeout(timeoutIdRef.current);
    }

    const typeNextChar = () => {
      if (currentIndexRef.current < textRef.current.length) {
        setDisplayedText(textRef.current.substring(0, currentIndexRef.current + 1));
        currentIndexRef.current++;
        
        // 动态调整延迟
        const char = textRef.current[currentIndexRef.current - 1];
        let delay = speed;
        
        if (char === '。' || char === '！' || char === '？' || char === '.') {
          delay = speed * 3;
        } else if (char === '，' || char === '、' || char === ',') {
          delay = speed * 1.5;
        } else if (char === '；' || char === '：' || char === ';' || char === ':') {
          delay = speed * 2;
        }
        
        timeoutIdRef.current = setTimeout(typeNextChar, delay);
      } else {
        setIsComplete(true);
        if (onComplete) onComplete();
      }
    };

    if (!isComplete && currentIndexRef.current < textRef.current.length) {
      timeoutIdRef.current = setTimeout(typeNextChar, 50);
    }

    return () => {
      if (timeoutIdRef.current) {
        clearTimeout(timeoutIdRef.current);
      }
    };
  }, [text, isComplete, speed, onComplete]);

  // 当流式结束时，确保显示完整文本
  useEffect(() => {
    if (!isStreaming && text && displayedText !== text) {
      setDisplayedText(text);
      setIsComplete(true);
      currentIndexRef.current = text.length;
    }
  }, [isStreaming, text, displayedText]);

  return (
    <div className={className}>
      <EnhancedMarkdown content={displayedText} className={className} />
      {!isComplete && (
        <span className="inline-block w-2 h-3.5 bg-gray-400 animate-pulse ml-0.5" />
      )}
    </div>
  );
}