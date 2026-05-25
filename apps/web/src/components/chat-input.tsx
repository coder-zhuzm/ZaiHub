import { useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (message: string) => void;
  selectedModelsCount: number;
  disabled?: boolean;
}

export default function ChatInput({
  value,
  onChange,
  onSubmit,
  selectedModelsCount,
  disabled = false
}: ChatInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  // 页面加载后聚焦
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // 可用状态恢复时聚焦（输出完成、重试完成）
  useEffect(() => {
    if (!disabled && selectedModelsCount > 0) {
      inputRef.current?.focus();
    }
  }, [disabled, selectedModelsCount]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (value.trim() && selectedModelsCount > 0) {
      onSubmit(value);
    }
  };

  return (
    <div className="border-t bg-white p-4 shadow-sm shrink-0">
      <div className="max-w-7xl mx-auto">
        <form onSubmit={handleSubmit} className="flex gap-3">
          <Input
            ref={inputRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={
              selectedModelsCount > 0
                ? "输入消息，所有窗口将收到相同的消息..."
                : "请先选择AI模型"
            }
            className="flex-1"
            disabled={selectedModelsCount === 0 || disabled}
          />
          <Button
            type="submit"
            disabled={selectedModelsCount === 0 || !value.trim() || disabled}
            className="px-6"
          >
            发送
          </Button>
        </form>
      </div>
    </div>
  );
}