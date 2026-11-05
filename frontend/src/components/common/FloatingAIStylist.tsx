import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Sparkles, X, Send, Bot, User, ArrowRight } from 'lucide-react';
import { stylistService } from '@/services/stylistService';
import { Product } from '@/types';
import { Link } from 'react-router-dom';

interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  products?: Product[];
  timestamp: string;
}

export const FloatingAIStylist: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'ai',
      text: 'Xin chào! Mình là Trợ lý AI Stylist của SMARTBUY. Bạn cần tư vấn phong cách, gợi ý phối đồ dạo phố, đi học hay theo ngân sách nào hôm nay?',
      timestamp: 'Vừa xong',
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const quickPrompts = [
    'Tìm áo sơ mi nam đi làm dưới 500k',
    'Phối set dạo phố Y2K nữ',
    'Outfit Korean Casual đi học',
  ];

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen, messages]);

  const messageCounterRef = useRef(0);

  const handleSendMessage = useCallback(async (textToSend?: string) => {
    const text = (textToSend || inputMessage).trim();
    if (!text || isLoading) return;

    messageCounterRef.current += 1;
    const userMsg: ChatMessage = {
      id: `usr-${messageCounterRef.current}`,
      sender: 'user',
      text,
      timestamp: 'Vừa xong',
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const response = await stylistService.consult(text);
      messageCounterRef.current += 1;
      const aiMsg: ChatMessage = {
        id: `ai-${messageCounterRef.current}`,
        sender: 'ai',
        text: response.text || response.explanation || 'Đã phân tích xong phong cách phù hợp cho bạn.',
        products: response.recommendedProducts,
        timestamp: 'Vừa xong',
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch {
      messageCounterRef.current += 1;
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${messageCounterRef.current}`,
          sender: 'ai',
          text: 'Xin lỗi, AI Stylist tạm thời chưa thể phản hồi. Bạn vui lòng thử lại sau nhé!',
          timestamp: 'Vừa xong',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }, [inputMessage, isLoading]);

  return (
    <>
      {/* V4.2 - Floating Trigger Button: Background #7C3AED, Text #FFFFFF, Hover #6D28D9 */}
      <div className="fixed bottom-20 right-4 sm:bottom-6 sm:right-6 z-40 pb-[env(safe-area-inset-bottom)] pr-[env(safe-area-inset-right)]">
        {!isOpen && (
          <button
            onClick={() => setIsOpen(true)}
            className="group flex items-center justify-center gap-2 w-11 h-11 sm:w-auto sm:h-auto sm:px-4 sm:py-2.5 rounded-full bg-[#7C3AED] hover:bg-[#6D28D9] text-white shadow-elevated hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer"
            aria-label="Mở Trợ lý AI Stylist"
            title="Chat với Trợ lý AI Stylist"
          >
            <Sparkles className="w-4 h-4 text-white shrink-0" />
            <span className="hidden sm:inline text-xs font-semibold tracking-wide">AI Stylist</span>
          </button>
        )}
      </div>

      {/* Floating Chat Modal */}
      {isOpen && (
        <div className="fixed bottom-4 sm:bottom-6 right-4 sm:right-6 z-50 w-[calc(100vw-32px)] sm:w-[380px] md:w-[420px] h-[540px] max-h-[82vh] bg-white rounded-2xl shadow-modal border border-[#ECEAE7] flex flex-col overflow-hidden animate-fade-in">
          {/* Header */}
          <div className="bg-[#18181B] text-white p-4 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-full bg-[#7C3AED] flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-white">SMARTBUY AI Stylist</h3>
                <div className="flex items-center gap-1.5 text-[10px] text-[#A8A29E]">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span>Sẵn sàng tư vấn phong cách</span>
                </div>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 rounded-full hover:bg-white/10 text-[#A8A29E] hover:text-white transition-colors cursor-pointer"
              aria-label="Đóng cửa sổ chat"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Quick Prompts */}
          <div className="p-2.5 bg-[#F7F7F6] border-b border-[#ECEAE7] flex items-center gap-1.5 overflow-x-auto text-[11px] shrink-0">
            <span className="text-[#A8A29E] text-[10px] uppercase font-bold shrink-0 pl-1">Gợi ý:</span>
            {quickPrompts.map((p) => (
              <button
                key={p}
                onClick={() => handleSendMessage(p)}
                className="px-2.5 py-1 rounded-full bg-white hover:bg-[#F0EFED] text-[#18181B] border border-[#ECEAE7] shrink-0 transition-colors cursor-pointer truncate max-w-[200px]"
              >
                {p}
              </button>
            ))}
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-[#F7F7F6]">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-2.5 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.sender === 'ai' && (
                  <div className="w-6 h-6 rounded-full bg-[#7C3AED] text-white flex items-center justify-center shrink-0 mt-0.5">
                    <Bot className="w-3.5 h-3.5" />
                  </div>
                )}

                <div className="max-w-[85%] space-y-2">
                  <div
                    className={`p-3 rounded-xl text-xs leading-relaxed ${
                      msg.sender === 'user'
                        ? 'bg-[#18181B] text-white rounded-br-none'
                        : 'bg-white text-[#18181B] border border-[#ECEAE7] rounded-bl-none shadow-subtle'
                    }`}
                  >
                    <div className="whitespace-pre-line">{msg.text}</div>
                  </div>

                  {/* Recommended Products inside Chat */}
                  {msg.products && msg.products.length > 0 && (
                    <div className="space-y-1.5 pt-1">
                      {msg.products.map((p) => (
                        <Link
                          key={p.id}
                          to={`/products/${p.slug}`}
                          onClick={() => setIsOpen(false)}
                          className="flex items-center gap-2.5 p-2 rounded-lg bg-white border border-[#ECEAE7] hover:border-[#18181B] transition-colors group"
                        >
                          <img
                            src={p.images[0]}
                            alt={p.name}
                            className="w-10 h-12 object-cover rounded bg-[#F0EFED] shrink-0"
                          />
                          <div className="min-w-0 flex-1">
                            <div className="text-[11px] font-bold text-[#18181B] truncate group-hover:text-[#7C3AED]">
                              {p.name}
                            </div>
                            <div className="text-[10px] text-[#78716C] truncate">{p.categorySlug || p.brand}</div>
                          </div>
                          <ArrowRight className="w-3.5 h-3.5 text-[#A8A29E] group-hover:text-[#18181B] shrink-0" />
                        </Link>
                      ))}
                    </div>
                  )}
                </div>

                {msg.sender === 'user' && (
                  <div className="w-6 h-6 rounded-full bg-[#18181B] text-white flex items-center justify-center shrink-0 mt-0.5">
                    <User className="w-3.5 h-3.5" />
                  </div>
                )}
              </div>
            ))}

            {isLoading && (
              <div className="flex gap-2.5 items-center text-xs text-[#78716C]">
                <div className="w-6 h-6 rounded-full bg-[#7C3AED] text-white flex items-center justify-center shrink-0">
                  <Bot className="w-3.5 h-3.5" />
                </div>
                <div className="bg-white border border-[#ECEAE7] px-3 py-2 rounded-xl rounded-bl-none shadow-subtle flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#7C3AED] animate-bounce" />
                  <div className="w-1.5 h-1.5 rounded-full bg-[#7C3AED] animate-bounce [animation-delay:0.2s]" />
                  <div className="w-1.5 h-1.5 rounded-full bg-[#7C3AED] animate-bounce [animation-delay:0.4s]" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="p-3 bg-white border-t border-[#ECEAE7] flex items-center gap-2 shrink-0"
          >
            <input
              ref={inputRef}
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Nhập yêu cầu phối đồ của bạn..."
              className="flex-1 bg-[#F7F7F6] border border-[#ECEAE7] focus:border-[#18181B] rounded-full px-3.5 py-2 text-xs text-[#18181B] focus:outline-none placeholder:text-[#A8A29E]"
            />
            <button
              type="submit"
              disabled={!inputMessage.trim() || isLoading}
              className="w-8 h-8 rounded-full bg-[#18181B] disabled:opacity-40 text-white flex items-center justify-center hover:bg-[#27272A] transition-colors shrink-0 cursor-pointer"
              aria-label="Gửi tin nhắn"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      )}
    </>
  );
};
