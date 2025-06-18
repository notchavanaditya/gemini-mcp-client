import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Send, 
  Paperclip, 
  Mic, 
  Square, 
  RotateCcw,
  Sparkles,
  User,
  Bot,
  Copy,
  ThumbsUp,
  ThumbsDown
} from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { geminiAPI } from '../services/api';
import toast from 'react-hot-toast';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

const Chat = () => {
  const { state, actions } = useApp();
  const [message, setMessage] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingMessage, setStreamingMessage] = useState('');
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [state.chatHistory, streamingMessage]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim() || !state.apiKey) {
      if (!state.apiKey) {
        toast.error('Please set your API key first');
      }
      return;
    }

    const userMessage = actions.addChatMessage({
      role: 'user',
      content: message,
      timestamp: new Date().toISOString(),
    });

    const assistantMessage = actions.addChatMessage({
      role: 'assistant',
      content: '',
      timestamp: new Date().toISOString(),
      isLoading: true,
    });

    setMessage('');
    setIsStreaming(true);
    setStreamingMessage('');

    try {
      await geminiAPI.stream(
        message,
        state.apiKey,
        state.chatHistory.slice(-10).map(msg => ({
          role: msg.role,
          content: msg.content
        })),
        (chunk) => {
          setStreamingMessage(prev => prev + chunk);
        }
      );

      actions.updateChatMessage(assistantMessage.id, {
        content: streamingMessage,
        isLoading: false,
      });
    } catch (error) {
      console.error('Chat error:', error);
      actions.updateChatMessage(assistantMessage.id, {
        content: 'Sorry, I encountered an error while processing your request.',
        isLoading: false,
        isError: true,
      });
      toast.error('Failed to get response from AI');
    } finally {
      setIsStreaming(false);
      setStreamingMessage('');
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const regenerateResponse = (messageId) => {
    // Find the user message before this assistant message
    const messageIndex = state.chatHistory.findIndex(msg => msg.id === messageId);
    if (messageIndex > 0) {
      const userMessage = state.chatHistory[messageIndex - 1];
      if (userMessage.role === 'user') {
        setMessage(userMessage.content);
        handleSubmit({ preventDefault: () => {} });
      }
    }
  };

  const MessageComponent = ({ msg, isStreaming: msgIsStreaming, streamContent }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`flex space-x-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
    >
      {msg.role === 'assistant' && (
        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
          <Bot className="w-4 h-4 text-white" />
        </div>
      )}
      
      <div className={`max-w-3xl ${msg.role === 'user' ? 'order-first' : ''}`}>
        <div className={`rounded-lg px-4 py-3 ${
          msg.role === 'user'
            ? 'bg-blue-600 text-white ml-auto'
            : 'bg-gray-100 dark:bg-dark-700 text-gray-900 dark:text-white'
        }`}>
          {msg.role === 'user' ? (
            <p className="whitespace-pre-wrap">{msg.content}</p>
          ) : (
            <div className="prose dark:prose-invert max-w-none">
              {msgIsStreaming ? (
                <div className="flex items-center space-x-2">
                  <div className="typing-animation">
                    {streamContent}
                  </div>
                  <div className="w-2 h-4 bg-blue-500 animate-pulse" />
                </div>
              ) : msg.isLoading ? (
                <div className="flex items-center space-x-2">
                  <div className="spinner" />
                  <span>Thinking...</span>
                </div>
              ) : (
                <ReactMarkdown
                  components={{
                    code({ node, inline, className, children, ...props }) {
                      const match = /language-(\w+)/.exec(className || '');
                      return !inline && match ? (
                        <SyntaxHighlighter
                          style={oneDark}
                          language={match[1]}
                          PreTag="div"
                          {...props}
                        >
                          {String(children).replace(/\n$/, '')}
                        </SyntaxHighlighter>
                      ) : (
                        <code className={className} {...props}>
                          {children}
                        </code>
                      );
                    },
                  }}
                >
                  {msg.content}
                </ReactMarkdown>
              )}
            </div>
          )}
        </div>
        
        {msg.role === 'assistant' && !msg.isLoading && !msgIsStreaming && (
          <div className="flex items-center space-x-2 mt-2">
            <button
              onClick={() => copyToClipboard(msg.content)}
              className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              title="Copy"
            >
              <Copy className="w-4 h-4" />
            </button>
            <button
              onClick={() => regenerateResponse(msg.id)}
              className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              title="Regenerate"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              className="p-1 text-gray-400 hover:text-green-600 transition-colors"
              title="Good response"
            >
              <ThumbsUp className="w-4 h-4" />
            </button>
            <button
              className="p-1 text-gray-400 hover:text-red-600 transition-colors"
              title="Bad response"
            >
              <ThumbsDown className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
      
      {msg.role === 'user' && (
        <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
          <User className="w-4 h-4 text-white" />
        </div>
      )}
    </motion.div>
  );

  if (!state.apiKey) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <Sparkles className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Welcome to Gemini Chat
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Please set your API key to start chatting
          </p>
          <button
            onClick={() => {
              // This would open the API key modal
              toast.info('Click the API key button in the header to set your key');
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
          >
            Set API Key
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Chat Header */}
      <div className="border-b border-gray-200 dark:border-dark-700 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
                Gemini Assistant
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                AI-powered assistant with MCP capabilities
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => actions.setChatHistory([])}
              className="px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white border border-gray-300 dark:border-dark-600 rounded-lg hover:bg-gray-50 dark:hover:bg-dark-700 transition-colors"
            >
              Clear Chat
            </button>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        <AnimatePresence>
          {state.chatHistory.length === 0 ? (
            <div className="text-center py-12">
              <Sparkles className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Start a conversation
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Ask me anything! I can help with coding, analysis, file management, and more.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto">
                {[
                  'Analyze this Excel file for trends',
                  'Help me refactor this code',
                  'Create a data visualization',
                  'Explain this complex concept'
                ].map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => setMessage(suggestion)}
                    className="p-3 text-left bg-gray-50 dark:bg-dark-700 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-600 transition-colors border border-gray-200 dark:border-dark-600"
                  >
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      {suggestion}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            state.chatHistory.map((msg) => (
              <MessageComponent key={msg.id} msg={msg} />
            ))
          )}
          
          {isStreaming && streamingMessage && (
            <MessageComponent
              msg={{
                id: 'streaming',
                role: 'assistant',
                content: streamingMessage,
                timestamp: new Date().toISOString(),
              }}
              isStreaming={true}
              streamContent={streamingMessage}
            />
          )}
        </AnimatePresence>
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-gray-200 dark:border-dark-700 p-4">
        <form onSubmit={handleSubmit} className="flex items-end space-x-3">
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your message... (Shift+Enter for new line)"
              className="w-full px-4 py-3 pr-12 bg-gray-50 dark:bg-dark-700 border border-gray-200 dark:border-dark-600 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={1}
              style={{
                minHeight: '48px',
                maxHeight: '120px',
                height: 'auto',
              }}
              onInput={(e) => {
                e.target.style.height = 'auto';
                e.target.style.height = e.target.scrollHeight + 'px';
              }}
            />
            
            <button
              type="button"
              className="absolute right-3 bottom-3 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              <Paperclip className="w-4 h-4" />
            </button>
          </div>
          
          <div className="flex space-x-2">
            <button
              type="button"
              className="p-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 border border-gray-200 dark:border-dark-600 rounded-lg hover:bg-gray-50 dark:hover:bg-dark-700 transition-colors"
            >
              <Mic className="w-5 h-5" />
            </button>
            
            <button
              type="submit"
              disabled={!message.trim() || isStreaming}
              className="p-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg transition-colors flex items-center justify-center"
            >
              {isStreaming ? (
                <Square className="w-5 h-5" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </button>
          </div>
        </form>
        
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
          Gemini can make mistakes. Consider checking important information.
        </p>
      </div>
    </div>
  );
};

export default Chat;