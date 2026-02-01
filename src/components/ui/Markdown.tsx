import ReactMarkdown from 'react-markdown';

interface MarkdownProps {
  children: string;
  className?: string;
}

export function Markdown({ children, className = '' }: MarkdownProps) {
  return (
    <div
      className={`
        prose prose-sm max-w-none
        text-[var(--text-main)]
        prose-headings:text-[var(--text-main)]
        prose-headings:font-bold
        prose-h1:text-2xl prose-h1:mb-4
        prose-h2:text-xl prose-h2:mb-3 prose-h2:mt-6
        prose-h3:text-lg prose-h3:mb-2 prose-h3:mt-4
        prose-p:mb-3 prose-p:leading-relaxed
        prose-ul:my-3 prose-ul:pl-6
        prose-ol:my-3 prose-ol:pl-6
        prose-li:mb-1
        prose-a:text-[var(--accent-orange)] prose-a:no-underline hover:prose-a:underline
        prose-strong:text-[var(--text-main)] prose-strong:font-bold
        prose-code:text-[var(--accent-purple)] prose-code:bg-[var(--accent-purple-light)]
        prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm
        prose-code:before:content-none prose-code:after:content-none
        prose-pre:bg-[var(--text-sub)] prose-pre:text-white prose-pre:rounded-lg prose-pre:p-4
        prose-blockquote:border-l-4 prose-blockquote:border-[var(--accent-orange)]
        prose-blockquote:pl-4 prose-blockquote:italic prose-blockquote:text-[var(--text-sub)]
        ${className}
      `}
    >
      <ReactMarkdown>{children}</ReactMarkdown>
    </div>
  );
}
