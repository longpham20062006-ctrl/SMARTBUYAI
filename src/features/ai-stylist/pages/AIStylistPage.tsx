import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { stylistService } from '@/services/stylistService';
import { AIStylistMessage } from '@/types';
import { formatPrice } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { BackButton } from '@/components/common/BackButton';
import { ChatProductCard } from '@/components/chat/ChatProductCard';
import {
  Sparkles,
  Send,
  Bot,
  User,
  SlidersHorizontal,
  Flame,
  RefreshCw,
  Layers,
} from 'lucide-react';

const INITIAL_WELCOME: AIStylistMessage = {
  id: 'welcome',
  sender: 'stylist',
  text: 'Yo! Chào bạn! Tôi là SMARTBUY AI Stylist — trợ lý định hình phong cách thời trang Streetwear, Y2K & Korean Casual theo dáng người và ngân sách học sinh sinh viên. Bạn muốn tìm trang phục theo dịp nào (đi học, dạo phố, hẹn hò, dự tiệc) hay cần phối trọn bộ outfit theo mức giá?',
  timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
  quickReplies: [
    'Tôi muốn đồ đi dự tiệc',
    'Tôi là nam, 20 tuổi, có 500k, muốn mặc streetwear đi chơi',
    'Tư vấn phối áo sơ mi với quần gì đẹp?',
    'Phối set Y2K nữ xinh xắn dưới 350.000đ',
    'Cao 1m70 nặng 65kg nên mặc size nào?',
  ],
};

export const AIStylistPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialPrompt = searchParams.get('prompt');

  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<AIStylistMessage[]>([INITIAL_WELCOME]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const isFirstRender = useRef(true);

  // Cuộn nội bộ trong container tin nhắn, TUYỆT ĐỐI không dùng scrollIntoView() vì sẽ kéo cả window xuống Footer
  const scrollToBottom = useCallback(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTo({
        top: messagesContainerRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, []);

  // Đảm bảo khi mới vào trang AI Stylist, trang luôn bắt đầu từ đỉnh (y = 0)
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, []);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    scrollToBottom();
  }, [messages, isLoading, scrollToBottom]);

  const handleSendMessage = useCallback(
    async (text: string) => {
      const clean = text.trim();
      if (!clean || isLoading) return;

      const userMsg: AIStylistMessage = {
        id: `user_${Date.now()}`,
        sender: 'user',
        text: clean,
        timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, userMsg]);
      setInputMessage('');
      setIsLoading(true);

      const historyPayload = messages.map((m) => ({
        sender: m.sender,
        text: m.text,
      }));

      try {
        const response = await stylistService.consult(clean, historyPayload);
        setMessages((prev) => [...prev, response]);
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    },
    [isLoading, messages]
  );

  const handleResetChat = async () => {
    await stylistService.resetSession();
    setMessages([INITIAL_WELCOME]);
    setInputMessage('');
  };

  const initialPromptProcessed = useRef(false);
  useEffect(() => {
    if (initialPrompt && initialPrompt.trim() && !initialPromptProcessed.current) {
      initialPromptProcessed.current = true;
      const promptText = initialPrompt.trim();
      const timer = setTimeout(() => {
        handleSendMessage(promptText);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [initialPrompt, handleSendMessage]);

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSendMessage(inputMessage);
  };

  return (
    <div className="bg-brand-bg min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-6">
        {/* Top Header Row with Back Button */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <BackButton to="/shop" label="Quay lại Shop" />
          <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs uppercase tracking-wider text-brand-secondary">
            <Link to="/" className="hover:text-brand-primary">Trang chủ</Link>
            <span>/</span>
            <span className="text-brand-primary font-bold">Chatbot AI Tư Vấn Bán Hàng</span>
          </nav>
        </div>

        {/* Header */}
        <div className="text-center space-y-2 border-b border-brand-border pb-6 relative">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-accent-light text-brand-accent text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI CONVERSATIONAL FASHION ASSISTANT (RAG + OUTFIT BUILDER)</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-brand-primary uppercase tracking-tight">
            SMARTBUY AI STYLIST
          </h1>
          <p className="text-xs sm:text-sm text-brand-secondary max-w-lg mx-auto leading-relaxed">
            Hệ thống tư vấn thông minh đối thoại nhiều lượt: ghi nhớ ngữ cảnh, phân tích ngân sách học sinh sinh viên, kiểm tra tồn kho theo màu/size và phối trọn bộ <strong>Áo + Quần + Phụ kiện</strong>.
          </p>

          <button
            type="button"
            onClick={handleResetChat}
            className="absolute top-0 right-0 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs text-brand-secondary hover:text-brand-primary hover:bg-brand-surface rounded-xl border border-brand-border transition-colors cursor-pointer"
            title="Xóa ngữ cảnh & bắt đầu trò chuyện mới"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Làm mới hội thoại</span>
          </button>
        </div>

        {/* Khung chat */}
        <div className="bg-brand-surface rounded-2xl border border-brand-border shadow-xs flex flex-col min-h-[580px] overflow-hidden">
          {/* Messages list */}
          <div
            ref={messagesContainerRef}
            data-testid="ai-stylist-chat-container"
            className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-6 bg-brand-subtle/40 max-h-[650px] scrollbar-thin"
          >
            {messages.map((msg, index) => (
              <div
                key={msg.id}
                className={`flex gap-3 sm:gap-4 items-start ${
                  msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'
                }`}
              >
                {/* Avatar */}
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold shadow-2xs ${
                    msg.sender === 'user'
                      ? 'bg-brand-primary text-white'
                      : 'bg-brand-accent text-white'
                  }`}
                >
                  {msg.sender === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>

                {/* Message bubble */}
                <div
                  className={`space-y-3 max-w-2xl flex-1 ${
                    msg.sender === 'user' ? 'text-right' : 'text-left'
                  }`}
                >
                  <div
                    className={`inline-block p-4 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                      msg.sender === 'user'
                        ? 'bg-brand-primary text-white font-medium rounded-tr-xs'
                        : 'bg-brand-surface border border-brand-border text-brand-primary shadow-xs rounded-tl-xs'
                    }`}
                  >
                    <p className="whitespace-pre-line">{msg.text}</p>
                  </div>

                  {/* Tiêu chí nhận diện */}
                  {msg.explanation && (
                    <div className="flex items-center gap-2 text-[11px] text-brand-secondary">
                      <SlidersHorizontal className="w-3 h-3 text-brand-primary" />
                      <span>Tiêu chí phân tích: <strong>{msg.explanation}</strong></span>
                    </div>
                  )}

                  {/* HIỂN THỊ OUTFIT BREAKDOWN NẾU CÓ */}
                  {msg.outfitBreakdown && (
                    <div className="bg-gradient-to-br from-[#FAF5FF] to-[#F3E8FF] border border-[#DDD6FE] rounded-2xl p-4 space-y-3 text-left shadow-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black uppercase tracking-wider text-[#6D28D9] flex items-center gap-1.5">
                          <Layers className="w-4 h-4" />
                          <span>OUTFIT THÔNG MINH PHỐI TRỌN BỘ</span>
                        </span>
                        <span className="text-sm font-black text-[#18181B]">
                          Tổng: {formatPrice(msg.outfitBreakdown.totalPrice || 0)}
                        </span>
                      </div>

                      {msg.outfitBreakdown.stylingRationale && (
                        <p className="text-xs text-[#5B21B6] italic bg-white/80 p-2.5 rounded-xl border border-[#DDD6FE]">
                          💡 {msg.outfitBreakdown.stylingRationale}
                        </p>
                      )}

                      <div className="pt-1">
                        <Button
                          variant="accent"
                          size="sm"
                          onClick={() => {
                            const p = new URLSearchParams();
                            if (msg.outfitBreakdown?.top?.id) p.set('topId', msg.outfitBreakdown.top.id);
                            if (msg.outfitBreakdown?.bottom?.id) p.set('bottomId', msg.outfitBreakdown.bottom.id);
                            if (msg.outfitBreakdown?.accessory?.id) p.set('accId', msg.outfitBreakdown.accessory.id);
                            navigate(`/virtual-try-on?${p.toString()}`);
                          }}
                          className="h-10 px-5 text-xs font-bold uppercase tracking-wider bg-[#8B5CF6] hover:bg-[#7C3AED] text-white flex items-center gap-2 rounded-xl shadow-xs cursor-pointer"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>✨ Thử toàn bộ outfit này trong Phòng Thử Đồ AI</span>
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Sản phẩm đề xuất sử dụng ChatProductCard đồng bộ */}
                  {msg.recommendedProducts && msg.recommendedProducts.length > 0 && (
                    <div className="pt-2 space-y-2">
                      <div className="text-xs font-bold uppercase tracking-wider text-brand-primary mb-2 flex items-center gap-1.5">
                        <Flame className="w-3.5 h-3.5 text-brand-accent" />
                        <span>Sản phẩm trong gợi ý ({msg.recommendedProducts.length}):</span>
                      </div>
                      <div className="space-y-2">
                        {msg.recommendedProducts.map((prod) => (
                          <ChatProductCard key={prod.id} product={prod} />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Quick replies chỉ hiển thị ở tin nhắn mới nhất và khi bot đã phản hồi xong */}
                  {msg.quickReplies && msg.quickReplies.length > 0 && index === messages.length - 1 && !isLoading && (
                    <div className="flex flex-wrap gap-1.5 pt-2">
                      {msg.quickReplies.map((reply, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleSendMessage(reply)}
                          className="text-xs px-3 py-1.5 rounded-full bg-brand-surface hover:bg-brand-accent-light hover:text-brand-accent text-brand-primary transition-all border border-brand-border cursor-pointer font-medium shadow-2xs"
                        >
                          {reply}
                        </button>
                      ))}
                    </div>
                  )}

                  <div className="text-[10px] text-brand-secondary">{msg.timestamp}</div>
                </div>
              </div>
            ))}

            {/* Typing state */}
            {isLoading && (
              <div className="flex items-center gap-3 text-xs text-brand-secondary">
                <div className="w-8 h-8 rounded-full bg-brand-accent text-white flex items-center justify-center shadow-xs">
                  <Bot className="w-4 h-4 animate-spin" />
                </div>
                <div className="bg-brand-surface border border-brand-border px-4 py-2.5 rounded-xl shadow-xs">
                  <span>SMARTBUY AI đang tìm mẫu phù hợp với bạn...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input box */}
          <div className="p-4 bg-brand-surface border-t border-brand-border">
            <form onSubmit={handleFormSubmit} className="flex gap-2">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Ví dụ: Tôi là nam có 500k muốn phối đồ đi chơi, hoặc Hỏi size/tồn kho..."
                disabled={isLoading}
                className="flex-1 px-4 py-3 text-xs sm:text-sm bg-brand-subtle rounded-xl border border-brand-border focus:outline-none focus:border-brand-accent focus:ring-1 focus:ring-brand-accent text-brand-primary transition-all"
              />
              <Button
                type="submit"
                variant="accent"
                disabled={!inputMessage.trim() || isLoading}
                className="h-11 px-6 text-xs font-bold uppercase shadow-sm cursor-pointer"
              >
                <Send className="w-4 h-4 mr-1.5" />
                Gửi
              </Button>
            </form>
            <div className="flex justify-between items-center text-[11px] text-brand-secondary mt-2 px-1">
              <span>Đề xuất: Nhập ngân sách, dịp sử dụng hoặc vóc dáng để được gợi ý chuẩn nhất</span>
              <Link to="/shop" className="text-brand-accent hover:underline font-semibold">
                Xem toàn bộ sản phẩm →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
