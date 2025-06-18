import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import remarkGfm from 'remark-gfm';
import { 
  ClipboardIcon, 
  CheckIcon,
  UserIcon,
  CpuChipIcon
} from '@heroicons/react/24/outline';
import { Message } from '../types';

interface ChatMessageProps {
  message: Message;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedCode(id);
      setTimeout(() => setCopiedCode(null), 2000);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  };

  const formatTimestamp = (timestamp: Date) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const isUser = message.role === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      <div className={`flex max-w-[80%] ${isUser ? 'flex-row-reverse' : 'flex-row'} items-start space-x-3`}>
        {/* Avatar */}
        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
          isUser 
            ? 'bg-blue-600' 
            : 'bg-gradient-to-br from-purple-500 to-pink-500'
        }`}>
          {isUser ? (
            <UserIcon className="w-5 h-5 text-white" />
          ) : (
            <CpuChipIcon className="w-5 h-5 text-white" />
          )}
        </div>

        {/* Message Content */}
        <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
          {/* Message Bubble */}
          <div className={`rounded-lg px-4 py-2 ${
            isUser 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-800 text-gray-100 border border-gray-700'
          }`}>
            {isUser ? (
              <div className="whitespace-pre-wrap">{message.content}</div>
            ) : (
              <div className="prose prose-invert max-w-none">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    code({ node, inline, className, children, ...props }) {
                      const match = /language-(\w+)/.exec(className || '');
                      const codeId = `code-${Math.random().toString(36).substr(2, 9)}`;
                      
                      if (!inline && match) {
                        return (
                          <div className="relative">
                            <div className="flex items-center justify-between bg-gray-900 px-4 py-2 rounded-t-lg">
                              <span className="text-sm text-gray-400">{match[1]}</span>
                              <button
                                onClick={() => copyToClipboard(String(children).replace(/\n$/, ''), codeId)}
                                className="flex items-center space-x-1 text-gray-400 hover:text-white transition-colors"
                              >
                                {copiedCode === codeId ? (
                                  <>
                                    <CheckIcon className="w-4 h-4" />
                                    <span className="text-xs">Copied!</span>
                                  </>
                                ) : (
                                  <>
                                    <ClipboardIcon className="w-4 h-4" />
                                    <span className="text-xs">Copy</span>
                                  </>
                                )}
                              </button>
                            </div>
                            <SyntaxHighlighter
                              style={vscDarkPlus}
                              language={match[1]}
                              PreTag="div"
                              className="!mt-0 !rounded-t-none"
                              {...props}
                            >
                              {String(children).replace(/\n$/, '')}
                            </SyntaxHighlighter>
                          </div>
                        );
                      }
                      
                      return (
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
                  {message.content}
                </ReactMarkdown>
              </div>
            )}
          </div>

          {/* Metadata */}
          <div className={`flex items-center space-x-2 mt-1 text-xs text-gray-500 ${
            isUser ? 'flex-row-reverse space-x-reverse' : 'flex-row'
          }`}>
            <span>{formatTimestamp(message.timestamp)}</span>
            {message.metadata?.tokens && (
              <span>• {message.metadata.tokens} tokens</span>
            )}
            {message.metadata?.executionTime && (
              <span>• {message.metadata.executionTime}ms</span>
            )}
            {message.metadata?.model && (
              <span>• {message.metadata.model}</span>
            )}
          </div>

          {/* Tool Calls */}
          {message.metadata?.tools && message.metadata.tools.length > 0 && (
            <div className="mt-2 space-y-2">
              {message.metadata.tools.map((tool, index) => (
                <div key={index} className="bg-gray-700 rounded-lg p-3 text-sm">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="text-blue-400 font-medium">🔧 {tool.name}</span>
                    <span className="text-gray-400">
                      {formatTimestamp(tool.timestamp)}
                    </span>
                  </div>
                  {tool.arguments && Object.keys(tool.arguments).length > 0 && (
                    <div className="mb-2">
                      <div className="text-gray-400 text-xs mb-1">Arguments:</div>
                      <pre className="bg-gray-800 p-2 rounded text-xs overflow-x-auto">
                        {JSON.stringify(tool.arguments, null, 2)}
                      </pre>
                    </div>
                  )}
                  {tool.result && (
                    <div>
                      <div className="text-gray-400 text-xs mb-1">Result:</div>
                      <pre className="bg-gray-800 p-2 rounded text-xs overflow-x-auto">
                        {typeof tool.result === 'string' 
                          ? tool.result 
                          : JSON.stringify(tool.result, null, 2)
                        }
                      </pre>
                    </div>
                  )}
                  {tool.error && (
                    <div className="text-red-400 text-xs">
                      Error: {tool.error}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};