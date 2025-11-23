import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface Model {
  id: string;
  name: string;
  platform: string;
}

interface WindowControlsProps {
  models: Model[];
  activeWindows: number;
  onQuickSelect: (count: number) => void;
  selectedModelsCount: number;
  onRefreshModels?: () => void;
}

export default function WindowControls({
  models,
  activeWindows,
  onQuickSelect,
  selectedModelsCount,
  onRefreshModels
}: WindowControlsProps) {
  if (models.length === 0) return null;

  const handleQuickSelect = (count: number) => {
    if (count > models.length) {
      alert(`可用模型数量不足！当前只有 ${models.length} 个模型，无法开启 ${count} 个窗口。`);
      return;
    }
    onQuickSelect(count);
  };

  return (
    <div className="bg-white border-b p-4 shadow-sm flex-shrink-0">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold">AI模型对比</h2>
            <p className="text-xs text-gray-500 mt-1">
              支持同时对比最多3个AI模型，每个窗口可独立选择不同模型
              {models.length < 3 && (
                <span className="text-amber-600 ml-1">
                  （当前可用模型：{models.length}个）
                </span>
              )}
            </p>
          </div>
          {onRefreshModels && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRefreshModels}
              className="text-xs"
            >
              刷新模型
            </Button>
          )}
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-600">快速选择：</span>
            {[1, 2, 3].map(count => (
              <Button
                key={count}
                variant={activeWindows === count ? "default" : "outline"}
                size="sm"
                onClick={() => handleQuickSelect(count)}
                disabled={count > models.length}
                className={cn(
                  "flex items-center gap-2 h-10 px-3",
                  activeWindows === count ? "bg-blue-500 hover:bg-blue-600" : "hover:bg-gray-50",
                  count > models.length && "opacity-50 cursor-not-allowed"
                )}
              >
                <div className="flex gap-0.5">
                  {[...Array(count)].map((_, index) => (
                    <div
                      key={index}
                      className={cn(
                        "w-2 h-2 border rounded-sm",
                        activeWindows === count 
                          ? "bg-white border-white/30" 
                          : count > models.length
                            ? "bg-gray-300 border-gray-400"
                            : "bg-gray-200 border-gray-300"
                      )}
                    />
                  ))}
                </div>
                <span className="text-xs font-medium">
                  {count}窗口
                </span>
              </Button>
            ))}
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">当前激活：</span>
            <div className="flex items-center gap-1">
              {[...Array(3)].map((_, index) => (
                <div
                  key={index}
                  className={cn(
                    "w-2 h-2 rounded-full transition-colors",
                    index < activeWindows ? "bg-green-500" : "bg-gray-300"
                  )}
                />
              ))}
            </div>
            <span className="text-sm text-gray-600">{activeWindows}个窗口</span>
          </div>
          
          {selectedModelsCount > 0 && (
            <div className="text-sm text-gray-600">
              {selectedModelsCount}个模型已选择
            </div>
          )}
        </div>
      </div>
    </div>
  );
}