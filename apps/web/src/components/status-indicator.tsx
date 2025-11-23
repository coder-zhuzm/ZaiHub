/*
 * @Description: 
 * @Author: zhuzm
 * @Date: 2025-11-23 17:59:02
 * @LastEditors: zhuzm
 * @LastEditTime: 2025-11-23 20:24:56
 */
import { cn } from '@/lib/utils';

interface StatusIndicatorProps {
  selectedModels: string[];
  windowModels: string[];
  chatSessions: Record<string, any>;
  activeWindows: number;
}

export default function StatusIndicator({
  selectedModels,
  windowModels,
  chatSessions,
  activeWindows
}: StatusIndicatorProps) {
  if (selectedModels.length === 0) return null;

  return (
    <div className="border-t bg-gray-50 px-4 py-2 shadow-sm shrink-0">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-4 text-xs">
          <span className="text-gray-600">窗口状态：</span>
          <div className="flex items-center gap-1">
            {[...Array(activeWindows)].map((_, index) => {
              const modelId = windowModels[index];
              const session = modelId ? chatSessions[modelId] : null;
              const status = session?.status || 'ready';
              
              return (
                <div
                  key={index}
                  className={cn(
                    "w-3 h-3 rounded-full border-2 border-white",
                    status === 'loading' || status === 'streaming' ? "bg-blue-500 animate-pulse" :
                    status === 'error' ? "bg-red-500" :
                    status === 'ready' ? "bg-green-500" :
                    "bg-gray-400"
                  )}
                  title={`窗口 ${index + 1}: ${status === 'loading' ? '加载中' : status === 'streaming' ? '思考中' : status === 'error' ? '错误' : status === 'ready' ? '就绪' : '未知'}`}
                />
              );
            })}
          </div>
          <span className="text-gray-500">
            {(() => {
              const loadingCount = selectedModels.filter(id => {
                const session = chatSessions[id];
                return session?.status === 'loading' || session?.status === 'streaming';
              }).length;
              const errorCount = selectedModels.filter(id => {
                const session = chatSessions[id];
                return session?.status === 'error';
              }).length;
              const readyCount = selectedModels.filter(id => {
                const session = chatSessions[id];
                return session?.status === 'ready';
              }).length;
              
              if (loadingCount > 0) {
                return `${loadingCount}个窗口正在加载...`;
              } else if (errorCount > 0) {
                return `${errorCount}个窗口出现错误`;
              } else if (readyCount > 0) {
                return `${readyCount}个窗口就绪`;
              }
              return '等待用户输入';
            })()}
          </span>
        </div>
      </div>
    </div>
  );
}