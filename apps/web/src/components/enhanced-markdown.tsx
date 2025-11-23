'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import { cn } from '@/lib/utils';

interface EnhancedMarkdownProps {
  content: string;
  className?: string;
  streaming?: boolean;
}

export default function EnhancedMarkdown({ content, className, streaming = false }: EnhancedMarkdownProps) {
  // 调试信息
  console.log('EnhancedMarkdown content:', content);
  
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
          code: ({ inline, className, children, ...props }: any) => {
            const match = /language-(\w+)/.exec(className || '');
            const language = match ? match[1] : '';
            const content = String(children).replace(/\n$/, '');
            
            // 调试信息
            console.log('Code element:', { inline, className, content: content.substring(0, 20) });
            
            // 明确检查是否为行内代码
            if (inline === true) {
              console.log('Rendering inline code (inline=true)');
              return (
                <code className="bg-red-100 text-red-800 px-1 py-0.5 rounded text-xs font-mono font-medium not-prose" {...props}>
                  {children}
                </code>
              );
            }
            
            // 检查是否没有语言类名且内容不包含换行符（通常是行内代码）
            if (!className && !content.includes('\n')) {
              console.log('Rendering inline code (no class, no newline)');
              return (
                <code className="bg-red-100 text-red-800 px-1 py-0.5 rounded text-xs font-mono font-medium not-prose" {...props}>
                  {children}
                </code>
              );
            }
            
            // 代码块
            console.log('Rendering code block');
            return (
              <div className="relative group not-prose max-w-full">
                <pre className="bg-gray-900 text-gray-100 rounded p-2 overflow-x-auto my-2 max-w-full">
                  <code className={cn(className, 'text-xs block')} {...props}>
                    {children}
                  </code>
                </pre>
                <button
                  onClick={() => navigator.clipboard.writeText(content)}
                  className="absolute top-1 right-1 px-1 py-0.5 text-xs bg-gray-700 hover:bg-gray-600 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  复制
                </button>
              </div>
            );
          },
          
          // 表格
          table: ({ children }: any) => (
            <div className="not-prose my-2 overflow-x-auto max-w-full">
              <table className="w-full max-w-full border-collapse border border-gray-300 rounded overflow-hidden table-fixed">
                {children}
              </table>
            </div>
          ),
          
          th: ({ children }: any) => (
            <th className="border border-gray-300 px-2 py-1 text-left font-semibold text-gray-900 text-xs break-words">
              {children}
            </th>
          ),
          
          td: ({ children }: any) => (
            <td className="border border-gray-300 px-2 py-1 text-gray-700 text-xs break-words">
              {children}
            </td>
          ),
          
          // 标题
          h1: ({ children, ...props }: any) => (
            <h1 className="text-base font-bold text-gray-900 mt-3 mb-2 border-b border-gray-200 pb-1 break-words" {...props}>
              {children}
            </h1>
          ),
          
          h2: ({ children, ...props }: any) => (
            <h2 className="text-sm font-semibold text-gray-900 mt-2 mb-2 break-words" {...props}>
              {children}
            </h2>
          ),
          
          h3: ({ children, ...props }: any) => (
            <h3 className="text-sm font-semibold text-gray-900 mt-2 mb-1 break-words" {...props}>
              {children}
            </h3>
          ),
          
          h4: ({ children, ...props }: any) => (
            <h4 className="text-xs font-semibold text-gray-900 mt-1 mb-1 break-words" {...props}>
              {children}
            </h4>
          ),
          
          h5: ({ children, ...props }: any) => (
            <h5 className="text-xs font-semibold text-gray-900 mt-1 mb-1 break-words" {...props}>
              {children}
            </h5>
          ),
          
          h6: ({ children, ...props }: any) => (
            <h6 className="text-xs font-semibold text-gray-900 mt-1 mb-1 break-words" {...props}>
              {children}
            </h6>
          ),
          
          // 段落
          p: ({ children, ...props }: any) => (
            <p className="text-gray-700 mb-2 leading-tight text-xs break-words" {...props}>
              {children}
            </p>
          ),
          
          // 列表
          ul: ({ children, ...props }: any) => (
            <ul className="list-disc list-inside space-y-1 my-2 text-gray-700 break-words" {...props}>
              {children}
            </ul>
          ),
          
          ol: ({ children, ...props }: any) => (
            <ol className="list-decimal list-inside space-y-1 my-2 text-gray-700 break-words" {...props}>
              {children}
            </ol>
          ),
          
          li: ({ children, ...props }: any) => (
            <li className="text-gray-700 text-xs break-words" {...props}>
              {children}
            </li>
          ),
          
          // 引用
          blockquote: ({ children, ...props }: any) => (
            <blockquote className="border-l-2 border-blue-500 pl-2 py-1 my-2 bg-blue-50 italic text-gray-700 rounded text-xs break-words" {...props}>
              {children}
            </blockquote>
          ),
          
          // 链接
          a: ({ children, href, ...props }: any) => (
            <a 
              href={href} 
              className="text-blue-600 hover:text-blue-800 underline transition-colors inline-flex items-center gap-1 text-xs"
              target="_blank"
              rel="noopener noreferrer"
              {...props}
            >
              {children}
            </a>
          ),
          
          // 分隔线
          hr: ({ ...props }: any) => (
            <hr className="border-gray-300 my-3 border-t" {...props} />
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}