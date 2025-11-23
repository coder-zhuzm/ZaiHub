import { useState, useEffect, useRef } from 'react';

interface TypewriterTextProps {
  text: string;
  speed?: number;
  className?: string;
  onComplete?: () => void;
}

export default function TypewriterText({
  text,
  speed = 30,
  className = '',
  onComplete
}: TypewriterTextProps) {
  const [displayedText, setDisplayedText] = useState('');
  const [isComplete, setIsComplete] = useState(false);
  const textRef = useRef(text);
  const speedRef = useRef(speed);
  const onCompleteRef = useRef(onComplete);

  // 更新refs当props改变时
  useEffect(() => {
    textRef.current = text;
  }, [text]);

  useEffect(() => {
    speedRef.current = speed;
  }, [speed]);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    // 如果文本为空，直接返回
    if (!text) {
      setDisplayedText('');
      setIsComplete(true);
      return;
    }

    // 如果文本没有变化，不需要重新开始
    if (text === displayedText && displayedText !== '') {
      return;
    }

    let currentIndex = 0;
    let timeoutId: NodeJS.Timeout;

    // 重置状态
    setDisplayedText('');
    setIsComplete(false);

    const typeNextChar = () => {
      if (currentIndex < textRef.current.length) {
        setDisplayedText(prev => prev + textRef.current[currentIndex]);
        currentIndex++;
        
        // 动态调整延迟：标点符号后稍作停顿
        const char = textRef.current[currentIndex - 1];
        let delay = speedRef.current;
        
        if (char === '。' || char === '！' || char == '？' || char === '.') {
          delay = speedRef.current * 3; // 句号后停顿更久
        } else if (char === '，' || char === '、' || char === ',') {
          delay = speedRef.current * 1.5; // 逗号后稍作停顿
        } else if (char === '；' || char === '：' || char === ';' || char === ':') {
          delay = speedRef.current * 2; // 分号冒号后停顿
        }
        
        timeoutId = setTimeout(typeNextChar, delay);
      } else {
        setIsComplete(true);
        if (onCompleteRef.current) {
          onCompleteRef.current();
        }
      }
    };

    // 开始打字
    timeoutId = setTimeout(typeNextChar, 100); // 初始延迟

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [text]);

  return (
    <span className={className}>
      {displayedText}
      {!isComplete && (
        <span className="inline-block w-2 h-3.5 bg-gray-400 animate-pulse ml-0.5" />
      )}
    </span>
  );
}