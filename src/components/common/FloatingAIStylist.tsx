import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, X, Send, Bot, RefreshCw, ChevronRight, Loader2, ArrowRight } from 'lucide-react';
import { stylistService } from '@/services/stylistService';
import { AIStylistMessage, Product } from '@/types';
import { formatPrice } from '@/lib/utils';
import { Button } from '@/components/ui/button';

const INITIAL_GREETING: AIStylistMessage = {
  id: 'greeting-default',
  sender: 'stylist',
  text: 'Xin chào! Mình là Stylist AI của SMARTBUY AI. Bạn muốn tìm trang phục theo dịp nào (đi học, dạo phố, hẹn hò) hay cần phối trọn bộ theo ngân sách?',
  timestamp: new Date().toISOString(),
};

const SUGGESTED_PROMPTS = [
  'Phối set streetwear nam đi chơi cá tính',
  'Gợi ý váy đầm nữ đi tiệc Y2K nổi bật',
  'Outfit đi học thoải mái phong cách tối giản',
  'Set đồ đôi nam nữ đồng điệu',
  'Áo khoác ấm mùa lạnh trong tầm giá',
];

export const FloatingAIStylist: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputQuery, setInputQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<AIStylistMessage[]>([INITIAL_GREETING]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto scroll to bottom of chat when new message arrives
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading, isOpen]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 150);
    }
  }, [isOpen]);

  // Listen to global open_ai_stylist custom event & URL param
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('open_stylist') === '1') {
      setIsOpen(true);
    }

    const handleOpenEvent = (e: any) => {
      setIsOpen(true);
      if (e?.detail?.prompt) {
        handleSendMessage(e.detail.prompt);
      }
    };

    window.addEventListener('open_ai_stylist' as any, handleOpenEvent);
    return () => {
      window.removeEventListener('open_ai_stylist' as any, handleOpenEvent);
    };
  }, []);

  // Listen to Escape key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || inputQuery).trim();
    if (!query || isLoading) return;

    const userMessage: AIStylistMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputQuery('');
    setIsLoading(true);

    try {
      const response = await stylistService.consult(query);
      setMessages((prev) => [...prev, response]);
    } catch (error) {
      const errorMessage: AIStylistMessage = {
        id: `err-${Date.now()}`,
        sender: 'stylist',
        text: 'Xin lỗi bạn, kết nối tư vấn AI tạm thời bị gián đoạn. Vui lòng thử lại sau ít giây nhé!',
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetChat = () => {
    setMessages([INITIAL_GREETING]);
    setInputQuery('');
  };

  return (
    <>
      {/* ============================================================ */}
      {/* 1. CHATBOT WINDOW (CỬA SỔ TRÒ CHUYỆN NỔI PHÍA TRÊN BONG BÓNG) */}
      {/* ============================================================ */}
      {isOpen && (
        <div
          role="dialog"
          aria-label="Cửa sổ AI Stylist"
          className="fixed bottom-24 right-4 sm:right-6 z-50 w-[calc(100vw-2rem)] sm:w-[410px] h-[560px] max-h-[calc(100vh-7.5rem)] bg-white rounded-3xl border border-[#E4E4E7] shadow-2xl flex flex-col overflow-hidden animate-fade-in transition-all"
        >
          {/* Header */}
          <div className="bg-[#18181B] text-white px-5 py-4 flex items-center justify-between shrink-0 border-b border-[#27272A]">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-[#8B5CF6] to-[#18F4FC] p-0.5 flex items-center justify-center shadow-xs">
                <div className="w-full h-full bg-[#18181B] rounded-[14px] flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-[#18F4FC]" />
                </div>
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="text-xs font-black uppercase tracking-wider text-white">
                    SMARTBUY AI STYLIST
                  </h3>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" title="Trực tuyến" />
                </div>
                <p className="text-[10px] text-[#A1A1AA]">Trợ lý phối đồ thông minh thế hệ mới</p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              {messages.length > 1 && (
                <button
                  type="button"
                  onClick={handleResetChat}
                  className="p-2 text-[#A1A1AA] hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
                  title="Làm mới cuộc trò chuyện"
                  aria-label="Làm mới trò chuyện"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-2 text-[#A1A1AA] hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
                title="Đóng cửa sổ chat (Escape)"
                aria-label="Đóng cửa sổ chat"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-[#FAFAF9] scrollbar-thin">
            {messages.map((msg) => (
              <div key={msg.id} className="space-y-2 animate-fade-in text-left">
                {msg.sender === 'user' ? (
                  <div className="flex justify-end">
                    <div className="bg-[#18181B] text-white text-xs py-2.5 px-4 rounded-2xl rounded-tr-xs max-w-[85%] leading-relaxed shadow-xs">
                      {msg.text}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="bg-white border border-[#E4E4E7] text-[#18181B] text-xs p-3.5 rounded-2xl rounded-tl-xs leading-relaxed space-y-2 shadow-xs">
                      <div className="flex items-center gap-1.5 font-bold text-[#8B5CF6] text-[11px]">
                        <Bot className="w-3.5 h-3.5" />
                        <span>AI Stylist</span>
                      </div>
                      <p className="text-[#3F3F46] whitespace-pre-line">{msg.text}</p>
                    </div>

                    {/* Recommended Products Carousel / List */}
                    {msg.recommendedProducts && msg.recommendedProducts.length > 0 && (
                      <div className="space-y-2 pt-1 pl-1">
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#71717A] flex items-center gap-1">
                          <Sparkles className="w-3 h-3 text-[#8B5CF6]" />
                          <span>GỢI Ý OUTFIT PHÙ HỢP:</span>
                        </span>
                        <div className="space-y-2">
                          {msg.recommendedProducts.map((product: Product) => (
                            <Link
                              key={product.id}
                              to={`/products/${product.slug}`}
                              onClick={() => setIsOpen(false)}
                              className="flex items-center gap-3 p-2.5 rounded-xl bg-white border border-[#E4E4E7] hover:border-[#8B5CF6] hover:shadow-subtle transition-all group"
                            >
                              <div className="w-12 h-14 rounded-lg overflow-hidden bg-[#F2F3F5] shrink-0">
                                <img
                                  src={product.images?.[0] || ''}
                                  alt={product.name}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                  loading="lazy"
                                />
                              </div>
                              <div className="flex-1 min-w-0">
                                <span className="text-[10px] font-bold uppercase text-[#8B5CF6] tracking-wider truncate block">
                                  {product.brand || 'SMARTBUY AI'}
                                </span>
                                <h4 className="text-xs font-bold text-[#18181B] truncate mt-0.5">
                                  {product.name}
                                </h4>
                                <div className="text-xs font-black text-[#18181B] mt-1">
                                  {formatPrice(product.price)}
                                </div>
                              </div>
                              <div className="p-1.5 text-[#A1A1AA] group-hover:text-[#8B5CF6] group-hover:translate-x-0.5 transition-all">
                                <ChevronRight className="w-4 h-4" />
                              </div>
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}

            {/* AI Typing Loading Indicator */}
            {isLoading && (
              <div className="flex items-center gap-2 text-xs text-[#8B5CF6] bg-white p-3 rounded-2xl border border-[#E4E4E7] w-fit shadow-xs">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span className="font-semibold text-[11px]">AI Stylist đang phân tích phong cách...</span>
              </div>
            )}

            {/* Quick Suggestion Chips (when only greeting is present) */}
            {messages.length === 1 && !isLoading && (
              <div className="pt-2 space-y-1.5 text-left">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#71717A] block">
                  GỢI Ý CÂU HỎI NHANH:
                </span>
                <div className="flex flex-col gap-1.5">
                  {SUGGESTED_PROMPTS.map((prompt, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSendMessage(prompt)}
                      className="text-left px-3 py-2 rounded-xl bg-white border border-[#E4E4E7] hover:border-[#8B5CF6] hover:bg-[#F3E8FF]/40 text-xs text-[#18181B] font-medium transition-all flex items-center justify-between group cursor-pointer shadow-2xs"
                    >
                      <span className="line-clamp-1">{prompt}</span>
                      <ChevronRight className="w-3.5 h-3.5 text-[#A1A1AA] group-hover:text-[#8B5CF6] shrink-0 ml-1" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Footer */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="p-3 bg-white border-t border-[#E4E4E7] shrink-0"
          >
            <div className="flex items-center gap-2 bg-[#F4F4F5] rounded-2xl p-1.5 border border-[#E4E4E7] focus-within:border-[#8B5CF6] focus-within:bg-white transition-all">
              <input
                ref={inputRef}
                type="text"
                value={inputQuery}
                onChange={(e) => setInputQuery(e.target.value)}
                placeholder="Nhập yêu cầu phối đồ (vd: đi chơi, dự tiệc...)"
                disabled={isLoading}
                className="flex-1 bg-transparent px-3 py-2 text-xs text-[#18181B] focus:outline-none placeholder:text-[#A1A1AA]"
              />
              <Button
                type="submit"
                variant="accent"
                size="sm"
                disabled={!inputQuery.trim() || isLoading}
                className="h-9 w-9 p-0 rounded-xl bg-[#8B5CF6] hover:bg-[#7C3AED] text-white flex items-center justify-center shrink-0 cursor-pointer disabled:opacity-40"
                aria-label="Gửi tin nhắn"
              >
                <Send className="w-3.5 h-3.5" />
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* ============================================================ */}
      {/* 2. FLOATING CHAT BUBBLE (BONG BÓNG CHAT NỔI Ở GÓC DƯỚI BÊN PHẢI)*/}
      {/* ============================================================ */}
      <div className="fixed bottom-6 right-6 z-40 group select-none">
        {/* Tooltip */}
        {!isOpen && (
          <div className="absolute right-full mr-3 top-1/2 -translate-y-1/2 hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#18181B] text-white text-xs font-bold whitespace-nowrap shadow-modal opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
            <Sparkles className="w-3.5 h-3.5 text-[#18F4FC]" />
            <span>Chat với SMARTBUY AI</span>
            <div className="absolute right-[-4px] top-1/2 -translate-y-1/2 w-2 h-2 bg-[#18181B] rotate-45" />
          </div>
        )}

        {/* Circular Bubble Button */}
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          aria-expanded={isOpen}
          aria-label={isOpen ? 'Đóng chatbot AI Stylist' : 'Mở chatbot AI Stylist'}
          className={`relative w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 cursor-pointer hover:scale-108 active:scale-95 border-2 border-white/40 ${
            isOpen
              ? 'bg-[#18181B] text-white ring-4 ring-[#8B5CF6]/30'
              : 'bg-gradient-to-tr from-[#7C3AED] via-[#8B5CF6] to-[#06B6D4] text-white ring-4 ring-[#8B5CF6]/20'
          }`}
        >
          {/* Subtle Ambient Glowing Pulse when closed */}
          {!isOpen && (
            <span className="absolute inset-0 rounded-full bg-[#8B5CF6] opacity-30 animate-ping -z-10" />
          )}

          {isOpen ? (
            <X className="w-6 h-6 text-white transition-transform duration-300" />
          ) : (
            <div className="flex flex-col items-center justify-center">
              <Sparkles className="w-6 h-6 text-white drop-shadow-sm" />
              <span className="text-[8px] font-black tracking-widest text-[#18F4FC] uppercase mt-0.5 font-mono">
                AI
              </span>
            </div>
          )}

          {/* Active online dot */}
          {!isOpen && (
            <span className="absolute top-1 right-1 w-3.5 h-3.5 bg-emerald-400 border-2 border-white rounded-full shadow-xs" />
          )}
        </button>
      </div>
    </>
  );
};
