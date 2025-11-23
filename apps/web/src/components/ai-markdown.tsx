'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import { cn } from '@/lib/utils';

interface AIMarkdownProps {
  content: string;
  className?: string;
  streaming?: boolean;
}

export default function AIMarkdown({ content, className, streaming = false }: AIMarkdownProps) {
  if (!content) {
    return <div className={cn('text-xs', className)}></div>;
  }

  return (
    <div className={cn('prose prose-xs max-w-full text-xs break-words', className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight]}
        components={{
          // 代码块
          code: (props: any) => {
            const { inline, className, children } = props;
            const match = /language-(\w+)/.exec(className || '');
            const language = match ? match[1] : '';
            
            if (!inline) {
              return (
                <div className="relative group not-prose max-w-full">
                  <pre className="bg-gray-900 text-gray-100 rounded p-2 overflow-x-auto my-2 max-w-full">
                    <code className={cn(className, 'text-xs block')}>
                      {children}
                    </code>
                  </pre>
                  <button
                    onClick={() => navigator.clipboard.writeText(String(children).replace(/\n$/, ''))}
                    className="absolute top-1 right-1 px-1 py-0.5 text-xs bg-gray-700 hover:bg-gray-600 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    复制
                  </button>
                </div>
              );
            }
            
            return (
              <code className="bg-red-100 text-red-800 px-1 py-0.5 rounded text-xs font-mono font-medium not-prose">
                {children}
              </code>
            );
          },
          
          // 表格
          table: (props: any) => (
            <div className="not-prose my-2 overflow-x-auto max-w-full">
              <table className="w-full max-w-full border-collapse border border-gray-300 rounded overflow-hidden table-fixed">
                {props.children}
              </table>
            </div>
          ),
          
          th: (props: any) => (
            <th className="border border-gray-300 px-2 py-1 text-left font-semibold text-gray-900 text-xs break-words">
              {props.children}
            </th>
          ),
          
          td: (props: any) => (
            <td className="border border-gray-300 px-2 py-1 text-gray-700 text-xs break-words">
              {props.children}
            </td>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}