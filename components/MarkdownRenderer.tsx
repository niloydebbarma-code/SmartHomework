import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

interface Props {
  content: string;
  className?: string;
  highContrast?: boolean;
}

export const MarkdownRenderer: React.FC<Props> = ({ content, className = '', highContrast = false }) => {
  return (
    <div className={`markdown-content ${highContrast ? 'high-contrast' : ''} ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={{
          a: ({node, ...props}) => (
            <a 
              {...props} 
              target="_blank" 
              rel="noopener noreferrer" 
              className={`${highContrast ? 'text-yellow-300' : 'text-blue-600'} underline hover:opacity-80`}
            />
          )
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};