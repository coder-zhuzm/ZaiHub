import { Button } from '@/components/ui/button';

interface EmptyStateProps {
  onLoginClick: () => void;
}

export default function EmptyState({ onLoginClick }: EmptyStateProps) {
  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="text-center text-gray-500">
        <div className="text-4xl mb-4">🤖</div>
        <h3 className="text-xl font-semibold mb-2">等待用户认证</h3>
        <p className="text-sm mb-4">请先登录以加载AI模型和开始对话</p>
        <Button 
          onClick={onLoginClick}
          variant="outline"
          size="sm"
        >
          立即登录
        </Button>
      </div>
    </div>
  );
}