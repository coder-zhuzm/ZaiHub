import type { UIMessage } from 'ai';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import EnhancedMarkdown from '@/components/enhanced-markdown';
import StreamingText from '@/components/streaming-text';
import { cn } from '@/lib/utils';
import type { ChatStatus } from '@/hooks/useChatSessions';
import type { ModelSummary } from '@/lib/chat-api';

type MessageListProps = {
  messages: UIMessage[];
  model: ModelSummary;
  status: ChatStatus;
};

export default function MessageList({ messages, model, status }: MessageListProps) {
  if (messages.length === 0) {
    return (
      <div className="text-center text-gray-500 text-xs py-8">
        开始与 {model.name} 对话吧！
      </div>
    );
  }

  return messages.map((message) => {
    const content = message.parts.map((p) => (p.type === 'text' ? p.text : '')).join('');
    const isLastMessage = messages[messages.length - 1].id === message.id;
    const isStreaming = status === 'streaming' && isLastMessage;

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
              'px-2 py-1 rounded-lg text-xs wrap-break-word',
              message.role === 'user'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-800 border',
            )}
          >
            {message.role === 'user' ? (
              content
            ) : isStreaming ? (
              <StreamingText text={content} isStreaming className="text-xs" />
            ) : (
              <EnhancedMarkdown content={content} className="text-xs" />
            )}
          </div>
        </div>
      </div>
    );
  });
}
