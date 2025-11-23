import { useState, useEffect } from 'react';
import EnhancedMarkdown from './enhanced-markdown';

interface SimpleTypewriterProps {
  text: string;
  speed?: number;
  className?: string;
}

export default function SimpleTypewriter({
  text,
  speed = 10,
  className = ''
}: SimpleTypewriterProps) {
  const [displayedText, setDisplayedText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    setDisplayedText('');
    setCurrentIndex(0);
  }, [text]);

  useEffect(() => {
    if (currentIndex < text.length) {
      const timer = setTimeout(() => {
        setDisplayedText(prev => prev + text[currentIndex]);
        setCurrentIndex(prev => prev + 1);
      }, speed);
      return () => clearTimeout(timer);
    }
  }, [currentIndex, text, speed]);

  return (
    <div className={className}>
      <EnhancedMarkdown content={displayedText} className={className} />
      {currentIndex < text.length && (
        <span className="inline-block w-2 h-3.5 bg-gray-400 animate-pulse ml-0.5" />
      )}
    </div>
  );
}