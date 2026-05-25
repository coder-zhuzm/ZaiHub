import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import EnhancedMarkdown from '@/components/enhanced-markdown';
import SelectableTitle from '@/components/selectable-title';
import StreamingText from '@/components/streaming-text';
import type { UIMessage } from 'ai';

interface Model {
  id: string;
  modelId: string;
  name: string;
  platform: string;
}

interface ChatSession {
  messages: UIMessage[];
  status: string;
  ref: React.RefObject<HTMLDivElement>;
}

interface ChatWindowProps {
  windowIndex: number;
  model: Model | null;
  session: ChatSession | null;
  isActive: boolean;
  models: Model[];
  onModelSelect: (windowIndex: number, modelId: string) => void;
  onRetry?: (windowIndex: number) => void;
}

export default function ChatWindow({
  windowIndex,
  model,
  session,
  isActive,
  models,
  onModelSelect,
  onRetry
}: ChatWindowProps) {
  return (
    <Card className={cn(
      "flex flex-col h-full min-h-0 transition-all duration-300",
      isActive ? "opacity-100" : "opacity-50"
    )}>
      {/* 窗口标题栏 - 包含模型选择 */}
      <CardHeader className="pb-2 border-b">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className={cn(
              "w-2 h-2 rounded-full flex-shrink-0",
              !isActive ? "bg-gray-300" :
                session?.status === 'loading' || session?.status === 'streaming' ? "bg-blue-500 animate-pulse" :
                  session?.status === 'error' ? "bg-red-500" :
                    "bg-green-500"
            )} />

            <SelectableTitle
              model={model}
              windowIndex={windowIndex}
              models={models}
              isActive={isActive}
              onModelSelect={onModelSelect}
              className="flex-1 min-w-0"
            />

            {session?.status === 'loading' && (
              <span className="text-xs text-blue-500 flex-shrink-0">加载中...</span>
            )}
            {session?.status === 'error' && (
              <span className="text-xs text-red-500 flex-shrink-0">错误</span>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
        {isActive ? (
          model && session ? (
            <ScrollArea
              ref={session.ref}
              className="flex-1 h-full px-3"
              scrollHideDelay={0}
            >
              <div className="space-y-3 py-3 min-h-full">
                {session.messages.length === 0 ? (
                  <div className="text-center text-gray-500 text-xs py-8">
                    开始与 {model.name} 对话吧！
                  </div>
                ) : (
                  session.messages.map((message: UIMessage) => {
                    const content = message.parts.map((p) => (p.type === 'text' ? p.text : '')).join('');
                    const isLastMessage = session.messages[session.messages.length - 1].id === message.id;
                    const isStreaming = session.status === 'streaming' && isLastMessage;
                    // 流式消息内容为空时不渲染，由"正在回复..."气泡代替
                    if (isStreaming && !content) return null;
                    return (
                    <div
                      key={message.id}
                      className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`flex items-start gap-1 max-w-[85%] ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                        <Avatar className="w-5 h-5 shrink-0">
                          <AvatarFallback className="text-xs">
                            {message.role === 'user' ? 'U' : model.name.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div
                          className={cn(
                            "px-2 py-1 rounded-lg text-xs wrap-break-word",
                            message.role === 'user'
                              ? 'bg-blue-500 text-white'
                              : 'bg-gray-100 text-gray-800 border'
                          )}
                        >
                          {message.role === 'user' ? (
                            content
                          ) : (
                            isStreaming ? (
                              <StreamingText
                                text={content}
                                isStreaming={true}
                                className="text-xs"
                              />
                            ) : (
                              <EnhancedMarkdown
                                content={content}
                                className="text-xs"
                              />
                            )
                          )}
                        </div>
                      </div>
                    </div>
                    );
                  })
                )}

                {session.status === 'loading' && (
                  <div className="flex justify-start">
                    <div className="bg-gray-100 text-gray-600 px-2 py-1 rounded-lg text-xs">
                      <div className="flex items-center gap-1">
                        <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse"></div>
                        <span>正在思考...</span>
                      </div>
                    </div>
                  </div>
                )}
                
                {session.status === 'streaming' && session.messages.length > 0 && (
                  <div className="flex justify-start">
                    <div className="bg-gray-100 text-gray-600 px-2 py-1 rounded-lg text-xs">
                      <div className="flex items-center gap-1">
                        <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse"></div>
                        <span>正在回复...</span>
                      </div>
                    </div>
                  </div>
                )}

                {session.status === 'error' && (
                  <div className="flex justify-start">
                    <div className="bg-red-50 text-red-600 px-2 py-1 rounded-lg text-xs border border-red-200">
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1">
                          <div className="w-1.5 h-1.5 bg-red-400 rounded-full"></div>
                          <span>连接失败</span>
                        </div>
                        {onRetry && (
                          <button
                            onClick={() => onRetry(windowIndex)}
                            className="text-xs bg-red-100 hover:bg-red-200 text-red-700 px-2 py-0.5 rounded transition-colors"
                          >
                            重试
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
              请在上方选择模型
            </div>
          )
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
            窗口 {windowIndex + 1} 已停用
          </div>
        )}
      </CardContent>
    </Card>
  );
}