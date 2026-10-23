import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { stylistService } from '@/services/stylistService';
import { AIStylistMessage } from '@/types';
import { Button } from '@/components/ui/button';
import {
  Sparkles,
  Send,
  Bot,
  User,
  SlidersHorizontal,
  Flame,
} from 'lucide-react';

export const AIStylistPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialPrompt = searchParams.get('prompt');

  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<AIStylistMessage[]>([
    {
      id: 'welcome',
      sender: 'stylist',
      text: 'Yo! Chào bạn! Tôi là SMARTBUY AI Stylist — chuyên gia định hình Outfit Streetwear & Y2K theo ngân sách sinh viên. Bạn đang cần phối set đi đâu, ngân sách khoảng bao nhiêu (ví dụ: "Có 400k phối đồ nam streetwear đi chơi", "Set Y2K nữ dưới 350k")?',
      timestamp: 'Vừa xong',
      quickReplies: [
        'Tôi có 400.000đ, muốn phối đồ streetwear nam đi chơi',
        'Phối set Y2K nữ xinh xắn dưới 350.000đ',
        'Outfit Korean Casual đi học thanh lịch 500k',
        'Tìm áo thun graphic dưới 199k',
      ],
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMsg: AIStylistMessage = {
      id: `user_${Date.now()}`,
      sender: 'user',
      text: text.trim(),
      timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const response = await stylistService.consult(text.trim());
      setMessages((prev) => [...prev, response]);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

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
        {/* Header */}
        <div className="text-center space-y-2 border-b border-brand-border pb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-accent-light text-brand-accent text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI OUTFIT COORDINATOR (130+ SẢN PHẨM THẬT)</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-brand-primary uppercase tracking-tight">
            SMARTBUY AI STYLIST
          </h1>
          <p className="text-xs sm:text-sm text-brand-secondary max-w-lg mx-auto leading-relaxed">
            Hệ thống phân tích ngân sách học sinh sinh viên, phom dáng và phong cách để phối trọn set: <strong>Áo + Quần + Phụ kiện</strong> hoàn hảo.
          </p>
          <div className="text-[11px] text-brand-secondary">
            * Hoạt động theo quy tắc khớp catalog thông minh nội bộ, đối soát ngân sách thực tế.
          </div>
        </div>

        {/* Khung chat */}
        <div className="bg-brand-surface rounded-2xl border border-brand-border shadow-xs flex flex-col min-h-[580px] overflow-hidden">
          {/* Messages list */}
          <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-6 bg-brand-subtle/40">
            {messages.map((msg) => (
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
                  className={`space-y-3 max-w-2xl ${
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

                  {/* Sản phẩm đề xuất */}
                  {msg.recommendedProducts && msg.recommendedProducts.length > 0 && (
                    <div className="pt-2">
                      <div className="text-xs font-bold uppercase tracking-wider text-brand-primary mb-3 flex items-center gap-1.5">
                        <Flame className="w-3.5 h-3.5 text-brand-accent" />
                        <span>Sản phẩm trong gợi ý ({msg.recommendedProducts.length}):</span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {msg.recommendedProducts.map((prod) => (
                          <div key={prod.id} className="bg-brand-surface rounded-xl border border-brand-border p-2.5 flex flex-col justify-between shadow-xs text-left group hover:border-brand-accent transition-all">
                            <Link to={`/products/${prod.slug}`} className="block aspect-[3/4] rounded-lg overflow-hidden bg-brand-subtle mb-2">
                              <img src={prod.images[0]} alt="" className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                            </Link>
                            <div>
                              <span className="text-[10px] uppercase font-bold text-brand-secondary">{prod.brand}</span>
                              <Link to={`/products/${prod.slug}`} className="block text-xs font-bold text-brand-primary hover:text-brand-accent line-clamp-1 transition-colors">
                                {prod.name}
                              </Link>
                              <span className="text-[10px] text-brand-secondary block">{prod.fit}</span>
                            </div>
                            <div className="pt-2 flex items-center justify-between border-t border-brand-border mt-2">
                              <span className="text-xs font-bold text-brand-primary">
                                {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(prod.price)}
                              </span>
                              <Link to={`/products/${prod.slug}`} className="text-[10px] font-bold text-brand-accent bg-brand-accent-light px-2.5 py-0.5 rounded-full hover:bg-brand-accent hover:text-white transition-colors">
                                Xem
                              </Link>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Nút Thử outfit này bằng AI */}
                      <div className="pt-3">
                        <Button
                          variant="accent"
                          size="sm"
                          onClick={() => {
                            const top = msg.recommendedProducts?.find((p) =>
                              ['ao-thun', 'hoodie-sweater', 'so-mi-polo', 'ao-khoac'].includes(p.categorySlug)
                            );
                            const bottom = msg.recommendedProducts?.find((p) =>
                              ['quan-jeans', 'quan-cargo-ong-rong', 'chan-vay-dam'].includes(p.categorySlug)
                            );
                            const accessory = msg.recommendedProducts?.find((p) => p.categorySlug === 'phu-kien');
                            const params = new URLSearchParams();
                            if (top) params.set('topId', top.id);
                            if (bottom) params.set('bottomId', bottom.id);
                            if (accessory) params.set('accId', accessory.id);
                            navigate(`/virtual-try-on?${params.toString()}`);
                          }}
                          className="h-10 px-5 text-xs font-bold uppercase tracking-wider bg-[#8B5CF6] hover:bg-[#7C3AED] text-white flex items-center gap-2 rounded-xl shadow-xs cursor-pointer"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>✨ Thử outfit này bằng AI</span>
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Quick replies */}
                  {msg.quickReplies && msg.quickReplies.length > 0 && (
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
                  <span>AI Stylist đang quét 130+ sản phẩm và tối ưu ngân sách...</span>
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
                placeholder="Ví dụ: Tôi có 400.000đ, muốn phối đồ streetwear nam đi chơi..."
                disabled={isLoading}
                className="flex-1 px-4 py-3 text-xs sm:text-sm bg-brand-subtle rounded-xl border border-brand-border focus:outline-none focus:border-brand-accent focus:ring-1 focus:ring-brand-accent text-brand-primary transition-all"
              />
              <Button
                type="submit"
                variant="accent"
                disabled={!inputMessage.trim() || isLoading}
                className="h-11 px-6 text-xs font-bold uppercase shadow-sm"
              >
                <Send className="w-4 h-4 mr-1.5" />
                Gửi
              </Button>
            </form>
            <div className="flex justify-between items-center text-[11px] text-brand-secondary mt-2 px-1">
              <span>Đề xuất: Nhập ngân sách cụ thể để AI tính toán khớp ví tiền</span>
              <Link to="/products" className="text-brand-accent hover:underline font-semibold">
                Xem toàn bộ catalog →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
