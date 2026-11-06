import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  X,
  Send,
  Bot,
  RefreshCw,
  Loader2,
  RotateCcw,
  Layers,
  ChevronRight,
} from 'lucide-react';
import { stylistService } from '@/services/stylistService';
import { AIStylistMessage } from '@/types';
import { formatPrice } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ChatProductCard } from '@/components/chat/ChatProductCard';

const INITIAL_GREETING: AIStylistMessage = {
  id: 'greeting-default',
  sender: 'stylist',
  text: 'Dạ xin chào! Em là AI Stylist của SMARTBUY AI. Em có thể tư vấn trang phục theo dịp (dự tiệc, đi cưới, sinh nhật, đi học, đi chơi), định hình phong cách (Lịch sự, Streetwear, Y2K) hoặc chọn size và phối trọn bộ theo ngân sách của mình. Bạn đang quan tâm phong cách hay trang phục nào hôm nay ạ?',
  timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
  quickReplies: [
    'Tôi muốn đồ đi dự tiệc',
    'Tôi là nam có 500k muốn mặc streetwear đi chơi',
    'Tư vấn phối áo sơ mi với quần gì đẹp?',
    'Cao 1m70 nặng 65kg mặc size nào vừa?',
  ],
};

export const FloatingAIStylist: React.FC = () => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [inputQuery, setInputQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<AIStylistMessage[]>([INITIAL_GREETING]);
  const [engineStatus, setEngineStatus] = useState<string>('Online');

  const chatContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Cuộn nội bộ trong container chat mà KHÔNG làm cuộn cả cửa sổ trình duyệt
  const scrollToBottom = useCallback(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isLoading, isOpen, scrollToBottom]);

  // Tự động focus input khi mở
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 150);
      stylistService.getStatus().then((st) => {
        if (st?.status) setEngineStatus(st.status);
      });
    }
  }, [isOpen]);

  // Lắng nghe sự kiện toàn cục open_ai_stylist & param ?open_stylist=1
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

  // Lắng nghe Escape để đóng
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
      timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
    };

    // Tạo lịch sử đối thoại gửi kèm lên backend để duy trì ngữ cảnh nhiều lượt
    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setInputQuery('');
    setIsLoading(true);

    const historyPayload = messages.map((m) => ({
      sender: m.sender,
      text: m.text,
    }));

    try {
      const response = await stylistService.consult(query, historyPayload);
      setMessages((prev) => [...prev, response]);
    } catch (error) {
      const errorMessage: AIStylistMessage = {
        id: `err-${Date.now()}`,
        sender: 'stylist',
        text: 'Xin lỗi bạn, kết nối máy chủ AI tạm thời bị gián đoạn. Bạn vui lòng bấm nút "Thử lại" bên dưới nhé!',
        timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
        isError: true,
        retryPrompt: query,
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetry = (prompt: string) => {
    handleSendMessage(prompt);
  };

  const handleResetChat = async () => {
    await stylistService.resetSession();
    setMessages([INITIAL_GREETING]);
    setInputQuery('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <>
      {/* ============================================================ */}
      {/* 1. CỬA SỔ CHATBOT THÔNG MINH */}
      {/* ============================================================ */}
      {isOpen && (
        <div
          role="dialog"
          aria-label="Cửa sổ Trợ lý AI Stylist"
          className="fixed bottom-24 right-4 sm:right-6 z-50 w-[calc(100vw-2rem)] sm:w-[440px] h-[600px] max-h-[calc(100vh-7.5rem)] bg-white rounded-3xl border border-[#E4E4E7] shadow-2xl flex flex-col overflow-hidden animate-fade-in transition-all"
        >
          {/* Header */}
          <div className="bg-[#18181B] text-white px-5 py-3.5 flex items-center justify-between shrink-0 border-b border-[#27272A]">
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
                  <span
                    className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"
                    title={`Trực tuyến (${engineStatus})`}
                  />
                </div>
                <p className="text-[10px] text-[#A1A1AA]">Trợ lý tư vấn thời trang đa lượt & phối đồ thông minh</p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleResetChat}
                className="p-2 text-[#A1A1AA] hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
                title="Bắt đầu cuộc trò chuyện mới"
                aria-label="Làm mới trò chuyện"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
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

          {/* Messages Area (Scoping Cuộn Nội Bộ) */}
          <div
            ref={chatContainerRef}
            className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#FAFAF9] scrollbar-thin"
          >
            {messages.map((msg, index) => (
              <div key={msg.id} className="space-y-2.5 animate-fade-in text-left">
                {msg.sender === 'user' ? (
                  <div className="flex justify-end">
                    <div className="bg-[#18181B] text-white text-xs py-2.5 px-4 rounded-2xl rounded-tr-xs max-w-[85%] leading-relaxed shadow-xs">
                      {msg.text}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {/* Hộp trả lời của AI */}
                    <div className="bg-white border border-[#E4E4E7] text-[#18181B] text-xs p-3.5 rounded-2xl rounded-tl-xs leading-relaxed space-y-2 shadow-xs">
                      <div className="flex items-center justify-between gap-1 text-[11px] text-[#8B5CF6] font-bold">
                        <div className="flex items-center gap-1.5">
                          <Bot className="w-3.5 h-3.5" />
                          <span>AI Stylist</span>
                        </div>
                        {msg.provider && (
                          <span className="text-[9px] font-normal text-[#A1A1AA]">
                            {msg.provider.includes('gemini')
                              ? 'Gemini Brain'
                              : msg.provider.includes('openai')
                              ? 'GPT Brain'
                              : 'Native RAG'}
                          </span>
                        )}
                      </div>
                      <p className="text-[#3F3F46] whitespace-pre-line leading-relaxed">{msg.text}</p>
                    </div>

                    {/* HIỂN THỊ OUTFIT BREAKDOWN NẾU CÓ */}
                    {msg.outfitBreakdown && (
                      <div className="bg-gradient-to-br from-[#FAF5FF] to-[#F3E8FF] border border-[#DDD6FE] rounded-2xl p-3.5 space-y-3 text-left shadow-xs">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#6D28D9] flex items-center gap-1">
                            <Layers className="w-3.5 h-3.5" />
                            <span>SET OUTFIT THÔNG MINH</span>
                          </span>
                          <span className="text-xs font-black text-[#18181B]">
                            Tổng: {formatPrice(msg.outfitBreakdown.totalPrice || 0)}
                          </span>
                        </div>

                        {msg.outfitBreakdown.stylingRationale && (
                          <p className="text-[11px] text-[#5B21B6] italic bg-white/70 p-2 rounded-xl border border-[#DDD6FE]/60">
                            💡 {msg.outfitBreakdown.stylingRationale}
                          </p>
                        )}

                        {/* Nút Thử Cả Bộ Bằng AI */}
                        <div className="pt-1">
                          <button
                            type="button"
                            onClick={() => {
                              setIsOpen(false);
                              const p = new URLSearchParams();
                              if (msg.outfitBreakdown?.top?.id) p.set('topId', msg.outfitBreakdown.top.id);
                              if (msg.outfitBreakdown?.bottom?.id) p.set('bottomId', msg.outfitBreakdown.bottom.id);
                              if (msg.outfitBreakdown?.accessory?.id) p.set('accId', msg.outfitBreakdown.accessory.id);
                              navigate(`/virtual-try-on?${p.toString()}`);
                            }}
                            className="w-full inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-[#8B5CF6] hover:bg-[#7C3AED] active:scale-98 text-white text-xs font-bold uppercase tracking-wider shadow-xs transition-all cursor-pointer"
                          >
                            <Sparkles className="w-3.5 h-3.5 text-amber-200" />
                            <span>Thử cả set này trong Phòng Thử Đồ AI</span>
                          </button>
                        </div>
                      </div>
                    )}

                    {/* DANH SÁCH THẺ SẢN PHẨM KHỚP TRONG CSDL */}
                    {msg.recommendedProducts && msg.recommendedProducts.length > 0 && (
                      <div className="space-y-2 pt-1">
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#71717A] flex items-center gap-1">
                          <Sparkles className="w-3 h-3 text-[#8B5CF6]" />
                          <span>SẢN PHẨM GỢI Ý ({msg.recommendedProducts.length}):</span>
                        </span>
                        <div className="space-y-2">
                          {msg.recommendedProducts.map((prod) => (
                            <ChatProductCard
                              key={prod.id}
                              product={prod}
                              onItemClick={() => setIsOpen(false)}
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    {/* NÚT THỬ LẠI NẾU LỖI */}
                    {msg.isError && msg.retryPrompt && (
                      <button
                        type="button"
                        onClick={() => handleRetry(msg.retryPrompt!)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 text-xs font-semibold cursor-pointer transition-colors"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Thử lại câu hỏi</span>
                      </button>
                    )}

                    {/* GỢI Ý CÂU HỎI TIẾP THEO: CHỈ HIỂN THỊ DƯỚI TIN NHẮN MỚI NHẤT CỦA AI */}
                    {index === messages.length - 1 && !isLoading && msg.quickReplies && msg.quickReplies.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {msg.quickReplies.map((qr, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => handleSendMessage(qr)}
                            className="text-left text-[11px] font-medium px-2.5 py-1 rounded-xl bg-white hover:bg-[#F3E8FF] hover:text-[#7C3AED] border border-[#E4E4E7] text-[#3F3F46] transition-all cursor-pointer shadow-2xs"
                          >
                            {qr}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}

            {/* AI Typing Loading Indicator — Thông báo nhẹ nhàng theo Master Prompt V23 */}
            {isLoading && (
              <div className="flex items-center gap-2 text-xs text-[#8B5CF6] bg-white p-3 rounded-2xl border border-[#E4E4E7] w-fit shadow-xs animate-pulse">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span className="font-semibold text-[11px]">SMARTBUY AI đang tìm mẫu phù hợp với bạn...</span>
              </div>
            )}
          </div>

          {/* Ô Nhập Tin Nhắn Hỗ Trợ Enter & Shift+Enter */}
          <div className="p-3 bg-white border-t border-[#E4E4E7] shrink-0">
            <div className="flex items-end gap-2 bg-[#F4F4F5] rounded-2xl p-1.5 border border-[#E4E4E7] focus-within:border-[#8B5CF6] focus-within:bg-white transition-all">
              <textarea
                ref={textareaRef}
                value={inputQuery}
                onChange={(e) => setInputQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                rows={1}
                placeholder="Hỏi về phong cách, size, phối đồ hoặc giá..."
                disabled={isLoading}
                className="flex-1 bg-transparent px-3 py-2 text-xs text-[#18181B] focus:outline-none placeholder:text-[#A1A1AA] resize-none max-h-24 leading-normal"
              />
              <Button
                type="button"
                onClick={() => handleSendMessage()}
                variant="accent"
                size="sm"
                disabled={!inputQuery.trim() || isLoading}
                className="h-9 w-9 p-0 rounded-xl bg-[#8B5CF6] hover:bg-[#7C3AED] text-white flex items-center justify-center shrink-0 cursor-pointer disabled:opacity-40"
                aria-label="Gửi tin nhắn"
              >
                <Send className="w-3.5 h-3.5" />
              </Button>
            </div>
            <div className="flex items-center justify-between text-[10px] text-[#A1A1AA] px-2 pt-1.5">
              <span>Nhấn Enter để gửi • Shift+Enter xuống dòng</span>
              <button
                type="button"
                onClick={handleResetChat}
                className="text-[#8B5CF6] hover:underline cursor-pointer"
              >
                Làm mới phiên
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 2. BONG BÓNG CHAT NỔI Ở GÓC PHẢI DƯỚI */}
      {/* ============================================================ */}
      <div className="fixed bottom-6 right-6 z-40 group select-none">
        {/* Tooltip */}
        {!isOpen && (
          <div className="absolute right-full mr-3 top-1/2 -translate-y-1/2 hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#18181B] text-white text-xs font-bold whitespace-nowrap shadow-modal opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
            <Sparkles className="w-3.5 h-3.5 text-[#18F4FC]" />
            <span>Chat với Trợ lý AI Stylist</span>
            <div className="absolute right-[-4px] top-1/2 -translate-y-1/2 w-2 h-2 bg-[#18181B] rotate-45" />
          </div>
        )}

        {/* Nút bấm tròn */}
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

          {!isOpen && (
            <span className="absolute top-1 right-1 w-3.5 h-3.5 bg-emerald-400 border-2 border-white rounded-full shadow-xs" />
          )}
        </button>
      </div>
    </>
  );
};
