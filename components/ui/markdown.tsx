import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";

interface MarkdownProps {
  content: string;
  className?: string;
}

export function Markdown({ content, className }: MarkdownProps) {
  return (
    <div
      className={cn(
        "prose prose-sm max-w-none dark:prose-invert",
        "prose-headings:text-foreground prose-p:text-foreground prose-li:text-foreground",
        "prose-strong:text-foreground prose-code:text-foreground",
        "prose-h1:text-xl prose-h1:font-semibold prose-h1:mb-4 prose-h1:mt-6",
        "prose-h2:text-lg prose-h2:font-medium prose-h2:mb-3 prose-h2:mt-5",
        "prose-h3:text-base prose-h3:font-medium prose-h3:mb-2 prose-h3:mt-4",
        "prose-ul:my-2 prose-ol:my-2 prose-li:my-1",
        "prose-p:my-2 prose-p:leading-relaxed",
        "prose-code:bg-muted prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-xs",
        "prose-pre:bg-muted prose-pre:border prose-pre:border-border prose-pre:rounded-lg",
        "prose-blockquote:border-l-border prose-blockquote:bg-muted/30 prose-blockquote:pl-4 prose-blockquote:py-2",
        "prose-table:border prose-table:border-border prose-table:rounded-lg",
        "prose-th:bg-muted prose-th:border prose-th:border-border prose-th:px-3 prose-th:py-2",
        "prose-td:border prose-td:border-border prose-td:px-3 prose-td:py-2",
        className
      )}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // Custom component overrides for better dark mode support
          h1: ({ children, ...props }) => (
            <h1
              className="text-xl font-semibold mb-4 mt-6 text-foreground"
              {...props}
            >
              {children}
            </h1>
          ),
          h2: ({ children, ...props }) => (
            <h2
              className="text-lg font-medium mb-3 mt-5 text-foreground"
              {...props}
            >
              {children}
            </h2>
          ),
          h3: ({ children, ...props }) => (
            <h3
              className="text-base font-medium mb-2 mt-4 text-foreground"
              {...props}
            >
              {children}
            </h3>
          ),
          p: ({ children, ...props }) => (
            <p className="my-2 leading-relaxed text-foreground" {...props}>
              {children}
            </p>
          ),
          ul: ({ children, ...props }) => (
            <ul className="my-2 list-disc list-inside space-y-1" {...props}>
              {children}
            </ul>
          ),
          ol: ({ children, ...props }) => (
            <ol className="my-2 list-decimal list-inside space-y-1" {...props}>
              {children}
            </ol>
          ),
          li: ({ children, ...props }) => (
            <li className="my-1 text-foreground" {...props}>
              {children}
            </li>
          ),
          strong: ({ children, ...props }) => (
            <strong className="font-semibold text-foreground" {...props}>
              {children}
            </strong>
          ),
          code: ({ children, ...props }) => (
            <code
              className="bg-muted px-1 py-0.5 rounded text-xs font-mono text-foreground"
              {...props}
            >
              {children}
            </code>
          ),
          pre: ({ children, ...props }) => (
            <pre
              className="bg-muted border border-border rounded-lg p-4 overflow-x-auto"
              {...props}
            >
              {children}
            </pre>
          ),
          blockquote: ({ children, ...props }) => (
            <blockquote
              className="border-l-4 border-l-border bg-muted/30 pl-4 py-2 italic my-4"
              {...props}
            >
              {children}
            </blockquote>
          ),
          table: ({ children, ...props }) => (
            <div className="overflow-x-auto my-4">
              <table
                className="min-w-full border border-border rounded-lg"
                {...props}
              >
                {children}
              </table>
            </div>
          ),
          th: ({ children, ...props }) => (
            <th
              className="bg-muted border border-border px-3 py-2 text-left font-medium text-foreground"
              {...props}
            >
              {children}
            </th>
          ),
          td: ({ children, ...props }) => (
            <td
              className="border border-border px-3 py-2 text-foreground"
              {...props}
            >
              {children}
            </td>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
