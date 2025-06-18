import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import remarkGfm from 'remark-gfm';
import { FileContent } from '../types';

interface FileViewerProps {
  path: string;
  content: FileContent;
}

export const FileViewer: React.FC<FileViewerProps> = ({ path, content }) => {
  const getFileType = (filePath: string) => {
    const extension = filePath.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'md':
        return 'markdown';
      case 'json':
        return 'json';
      case 'js':
      case 'jsx':
      case 'ts':
      case 'tsx':
      case 'py':
      case 'html':
      case 'css':
      case 'xml':
      case 'yaml':
      case 'yml':
      case 'sql':
      case 'sh':
        return 'code';
      case 'csv':
        return 'csv';
      case 'txt':
      case 'log':
        return 'text';
      default:
        return 'text';
    }
  };

  const renderMarkdown = () => (
    <div className="prose prose-invert max-w-none p-6">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          code({ node, inline, className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || '');
            return !inline && match ? (
              <SyntaxHighlighter
                style={vscDarkPlus}
                language={match[1]}
                PreTag="div"
                {...props}
              >
                {String(children).replace(/\n$/, '')}
              </SyntaxHighlighter>
            ) : (
              <code className="bg-gray-700 px-1 py-0.5 rounded text-sm" {...props}>
                {children}
              </code>
            );
          },
          table({ children }) {
            return (
              <div className="overflow-x-auto">
                <table className="min-w-full border border-gray-600 rounded-lg">
                  {children}
                </table>
              </div>
            );
          },
          th({ children }) {
            return (
              <th className="border border-gray-600 px-4 py-2 bg-gray-700 text-left">
                {children}
              </th>
            );
          },
          td({ children }) {
            return (
              <td className="border border-gray-600 px-4 py-2">
                {children}
              </td>
            );
          },
          blockquote({ children }) {
            return (
              <blockquote className="border-l-4 border-blue-500 pl-4 italic text-gray-300">
                {children}
              </blockquote>
            );
          },
          a({ href, children }) {
            return (
              <a 
                href={href} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 underline"
              >
                {children}
              </a>
            );
          }
        }}
      >
        {content.content}
      </ReactMarkdown>
    </div>
  );

  const renderCode = () => {
    const language = path.split('.').pop()?.toLowerCase() || 'text';
    return (
      <SyntaxHighlighter
        language={language}
        style={vscDarkPlus}
        customStyle={{
          margin: 0,
          padding: '1.5rem',
          background: 'transparent',
          fontSize: '14px',
          lineHeight: '1.5'
        }}
        showLineNumbers
        wrapLines
      >
        {content.content}
      </SyntaxHighlighter>
    );
  };

  const renderCSV = () => {
    const lines = content.content.split('\n').filter(line => line.trim());
    if (lines.length === 0) return <div className="p-6 text-gray-400">Empty CSV file</div>;

    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    const rows = lines.slice(1).map(line => 
      line.split(',').map(cell => cell.trim().replace(/"/g, ''))
    );

    return (
      <div className="p-6">
        <div className="overflow-x-auto">
          <table className="min-w-full border border-gray-600 rounded-lg">
            <thead>
              <tr className="bg-gray-700">
                {headers.map((header, index) => (
                  <th key={index} className="border border-gray-600 px-4 py-2 text-left text-white">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, rowIndex) => (
                <tr key={rowIndex} className={rowIndex % 2 === 0 ? 'bg-gray-800' : 'bg-gray-750'}>
                  {row.map((cell, cellIndex) => (
                    <td key={cellIndex} className="border border-gray-600 px-4 py-2 text-gray-300">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-4 text-sm text-gray-400">
          {rows.length} rows × {headers.length} columns
        </div>
      </div>
    );
  };

  const renderJSON = () => {
    try {
      const parsed = JSON.parse(content.content);
      return (
        <SyntaxHighlighter
          language="json"
          style={vscDarkPlus}
          customStyle={{
            margin: 0,
            padding: '1.5rem',
            background: 'transparent',
            fontSize: '14px',
            lineHeight: '1.5'
          }}
          showLineNumbers
        >
          {JSON.stringify(parsed, null, 2)}
        </SyntaxHighlighter>
      );
    } catch (error) {
      return (
        <div className="p-6">
          <div className="bg-red-900 border border-red-700 rounded-lg p-4 mb-4">
            <h3 className="text-red-300 font-medium mb-2">Invalid JSON</h3>
            <p className="text-red-200 text-sm">{(error as Error).message}</p>
          </div>
          <pre className="bg-gray-800 p-4 rounded-lg text-gray-300 text-sm overflow-x-auto">
            {content.content}
          </pre>
        </div>
      );
    }
  };

  const renderText = () => (
    <pre className="p-6 text-gray-300 text-sm leading-relaxed whitespace-pre-wrap font-mono">
      {content.content}
    </pre>
  );

  const renderContent = () => {
    const fileType = getFileType(path);
    
    switch (fileType) {
      case 'markdown':
        return renderMarkdown();
      case 'code':
        return renderCode();
      case 'csv':
        return renderCSV();
      case 'json':
        return renderJSON();
      default:
        return renderText();
    }
  };

  return (
    <div className="h-full flex flex-col bg-gray-900">
      {/* Viewer Header */}
      <div className="flex items-center justify-between p-3 bg-gray-800 border-b border-gray-700">
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-300">
            {path.split('/').pop()}
          </span>
          <span className="text-xs text-gray-500 bg-gray-700 px-2 py-1 rounded">
            {getFileType(path).toUpperCase()}
          </span>
        </div>
        
        <div className="flex items-center space-x-4 text-xs text-gray-400">
          <span>Size: {new Blob([content.content]).size} bytes</span>
          <span>Lines: {content.content.split('\n').length}</span>
          <span>Modified: {content.modified.toLocaleDateString()}</span>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        {content.content.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center text-gray-400">
              <p>This file is empty</p>
            </div>
          </div>
        ) : (
          renderContent()
        )}
      </div>
    </div>
  );
};