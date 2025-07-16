import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useInView } from 'react-intersection-observer';
import { FiSend, FiLoader, FiX, FiRefreshCw } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import { aiService } from '../services/aiService';

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: number;
  isStreaming?: boolean;
  error?: boolean;
  retryCount?: number;
}

const AiAssistant: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { ref: loadMoreRef } = useInView({
    threshold: 0.5,
    onChange: (visible) => {
      if (visible && !isLoading) {
        // Load more messages if needed
        // This functionality can be implemented later
      }
    }
  });

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: input.trim(),
      role: 'user',
      timestamp: Date.now(),
    };

    const assistantMessage: Message = {
      id: (Date.now() + 1).toString(),
      content: '',
      role: 'assistant',
      timestamp: Date.now(),
      isStreaming: true,
      retryCount: 0,
    };

    setMessages(prev => [...prev, userMessage, assistantMessage]);
    setInput('');
    setIsLoading(true);

    try {
      await aiService.streamAIResponse(
        input.trim(),
        {
          onData: (chunk) => {
            setMessages(prev => prev.map(msg => 
              msg.id === assistantMessage.id
                ? { ...msg, content: msg.content + chunk }
                : msg
            ));
          },
          onError: (error) => {
            console.error('AI response error:', error);
            setMessages(prev => prev.map(msg => 
              msg.id === assistantMessage.id
                ? { 
                    ...msg, 
                    content: msg.content + '\n\nError: ' + error.message,
                    isStreaming: false,
                    error: true
                  }
                : msg
            ));
            toast.error(error.message || 'Failed to get AI response. Please try again.');
          },
          onComplete: () => {
            setMessages(prev => prev.map(msg => 
              msg.id === assistantMessage.id
                ? { ...msg, isStreaming: false }
                : msg
            ));
            setIsLoading(false);
          },
          onRetry: (attempt) => {
            toast.loading(`Retrying... (${attempt}/3)`, { id: 'retry-toast' });
          },
        },
        {
          chunkSize: 15,
          chunkDelay: 30,
          maxRetries: 3,
          retryDelay: 1000,
        }
      );
    } catch (error) {
      toast.error('Failed to get AI response. Please try again.');
      console.error('AI response error:', error);
      setIsLoading(false);
    }
  }, [input, isLoading]);

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  }, [handleSubmit]);

  const cancelStream = useCallback(() => {
    aiService.cancelStream();
    setIsLoading(false);
    setMessages(prev => prev.map(msg => 
      msg.isStreaming ? { ...msg, isStreaming: false } : msg
    ));
    toast.dismiss('retry-toast');
  }, []);

  const retryMessage = useCallback((messageId: string) => {
    const message = messages.find(m => m.id === messageId);
    if (!message) return;

    setMessages(prev => prev.map(msg => 
      msg.id === messageId
        ? { ...msg, isStreaming: true, error: false, retryCount: (msg.retryCount || 0) + 1 }
        : msg
    ));

    aiService.streamAIResponse(
      message.content,
      {
        onData: (chunk) => {
          setMessages(prev => prev.map(msg => 
            msg.id === messageId
              ? { ...msg, content: msg.content + chunk }
              : msg
          ));
        },
        onError: (error) => {
          console.error('AI response error:', error);
          setMessages(prev => prev.map(msg => 
            msg.id === messageId
              ? { 
                  ...msg, 
                  content: msg.content + '\n\nError: ' + error.message,
                  isStreaming: false,
                  error: true
                }
              : msg
          ));
          toast.error(error.message || 'Failed to get AI response. Please try again.');
        },
        onComplete: () => {
          setMessages(prev => prev.map(msg => 
            msg.id === messageId
              ? { ...msg, isStreaming: false }
              : msg
          ));
        },
      },
      {
        chunkSize: 15,
        chunkDelay: 30,
        maxRetries: 3,
        retryDelay: 1000,
      }
    );
  }, [messages]);

  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${
              message.role === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            <div
              className={`max-w-[80%] rounded-lg p-4 ${
                message.role === 'user'
                  ? 'bg-primary-500 text-white'
                  : message.error
                  ? 'bg-red-50 dark:bg-red-900/20'
                  : 'bg-gray-100 dark:bg-gray-800'
              }`}
            >
              <p className="whitespace-pre-wrap">{message.content}</p>
              {message.isStreaming && (
                <div className="flex items-center mt-2">
                  <FiLoader className="animate-spin h-4 w-4 mr-2" />
                  <span className="text-xs opacity-70">AI is typing...</span>
                  <button
                    onClick={cancelStream}
                    className="ml-2 p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full"
                  >
                    <FiX className="h-4 w-4" />
                  </button>
                </div>
              )}
              {message.error && (
                <div className="flex items-center mt-2">
                  <button
                    onClick={() => retryMessage(message.id)}
                    className="flex items-center text-xs text-red-500 hover:text-red-600"
                  >
                    <FiRefreshCw className="h-4 w-4 mr-1" />
                    Retry
                  </button>
                </div>
              )}
              <span className="text-xs opacity-70 mt-1 block">
                {new Date(message.timestamp).toLocaleTimeString()}
              </span>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
        <div ref={loadMoreRef} />
      </div>

      <form onSubmit={handleSubmit} className="p-4 border-t dark:border-gray-700">
        <div className="flex space-x-4">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message..."
            className="flex-1 p-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
            rows={1}
            style={{ resize: 'none' }}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FiSend className="h-5 w-5" />
          </button>
        </div>
      </form>
    </div>
  );
};

export default React.memo(AiAssistant); 
