'use client';

import React, { useState, useEffect, useRef } from 'react';
import { WhatsAppMessage, Lead } from '../types';
import { API_BASE } from '../config';

interface WhatsAppChatProps {
  lead: Lead;
}

export default function WhatsAppChat({ lead }: WhatsAppChatProps) {
  const [messages, setMessages] = useState<WhatsAppMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 10000); // Poll every 10s
    return () => clearInterval(interval);
  }, [lead.id]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const fetchMessages = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/api/v1/whatsapp/chats/${lead.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setMessages(data || []);
      }
    } catch (err) {
      console.error('Failed to fetch WhatsApp chats:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;

    setSending(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/api/v1/whatsapp/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          lead_id: lead.id,
          message_type: 'text',
          content: newMessage,
        }),
      });

      if (response.ok) {
        setNewMessage('');
        fetchMessages();
      }
    } catch (err) {
      console.error('Failed to send message:', err);
    } finally {
      setSending(false);
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center p-12 space-y-3 opacity-50">
      <div className="w-6 h-6 border-2 border-accent-500/30 border-t-accent-500 rounded-full animate-spin"></div>
      <p className="text-xs font-medium tracking-wide uppercase">Syncing conversation...</p>
    </div>
  );

  return (
    <div className="flex flex-col h-[600px] border border-n-500/40 rounded-2xl bg-n-900/20 overflow-hidden backdrop-blur-sm">
      {/* Header */}
      <div className="shrink-0 p-4 border-b border-n-500/40 bg-n-800/40 flex justify-between items-center group">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-xl bg-accent-500/10 border border-accent-500/20 flex items-center justify-center text-accent-400 font-bold">
              {lead.name.charAt(0)}
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-n-900"></div>
          </div>
          <div>
            <h3 className="font-bold text-n-50 text-sm tracking-tight">{lead.phone}</h3>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-[10px] font-bold text-n-400 uppercase tracking-widest">Connected via WhatsApp</span>
            </div>
          </div>
        </div>
        <button 
          onClick={fetchMessages}
          className="btn-ghost p-2 opacity-0 group-hover:opacity-100 transition-opacity"
          title="Refresh messages"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </div>

      {/* Messages Area */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide bg-gradient-to-b from-transparent to-n-900/10"
      >
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center space-y-3 opacity-30">
            <div className="w-12 h-12 rounded-full border-2 border-dashed border-n-500 flex items-center justify-center">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <p className="text-xs font-medium uppercase tracking-widest">No conversation history yet</p>
          </div>
        ) : (
          messages.map((m) => (
            <div 
              key={m.id} 
              className={`flex flex-col ${m.direction === 'outgoing' ? 'items-end' : 'items-start'} animate-fadeIn`}
            >
              <div 
                className={`max-w-[75%] px-4 py-3 rounded-2xl text-sm shadow-xl transition-all hover:scale-[1.01] ${
                  m.direction === 'outgoing' 
                    ? 'bg-accent-500/10 border border-accent-500/30 text-accent-100 rounded-tr-none' 
                    : 'bg-n-800/60 border border-n-500/40 text-n-100 rounded-tl-none'
                }`}
              >
                {m.message_type === 'text' && <p className="leading-relaxed whitespace-pre-wrap">{m.content}</p>}
                {m.message_type === 'image' && (
                  <div className="space-y-2 py-1">
                    <img src={m.content} alt="WhatsApp" className="rounded-xl border border-n-500/20 max-w-full cursor-zoom-in hover:brightness-110 transition-all" onClick={() => window.open(m.content, '_blank')} />
                    {m.media_caption && <p className="text-[13px] opacity-80 border-t border-n-500/20 pt-2">{m.media_caption}</p>}
                  </div>
                )}
                {m.message_type === 'document' && (
                  <div className="flex items-center gap-3 p-3 bg-n-900/50 rounded-xl border border-n-500/20 cursor-pointer group/doc" onClick={() => window.open(m.content, '_blank')}>
                    <div className="w-10 h-10 rounded-lg bg-n-700 flex items-center justify-center text-xl group-hover/doc:bg-accent-500/20 transition-colors">
                      📄
                    </div>
                    <div className="min-w-0 pr-2">
                      <p className="font-semibold truncate text-[13px]">{m.media_caption || 'Document'}</p>
                      <p className="text-[10px] uppercase font-bold text-n-500 tracking-tighter opacity-70">{m.content.split('.').pop()} file</p>
                    </div>
                  </div>
                )}
                
                <div className={`mt-2 flex items-center gap-1.5 opacity-40 text-[9px] font-bold tracking-widest uppercase ${m.direction === 'outgoing' ? 'justify-end' : 'justify-start'}`}>
                   <span>{new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                   {m.direction === 'outgoing' && (
                     <div className="flex -space-x-1 ml-0.5">
                        <span className={m.status === 'read' ? 'text-accent-400' : 'text-n-400'}>
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" />
                          </svg>
                        </span>
                        {(m.status === 'delivered' || m.status === 'read') && (
                          <span className={m.status === 'read' ? 'text-accent-400' : 'text-n-400'}>
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" />
                            </svg>
                          </span>
                        )}
                     </div>
                   )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Input Area */}
      <div className="shrink-0 p-5 bg-n-800/40 border-t border-n-500/40">
        <form onSubmit={handleSendMessage} className="flex gap-3 items-center">
          <div className="relative flex-1">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type your message..."
              className="input-field pr-12 h-11"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-n-500 bg-n-900 px-1.5 py-0.5 rounded uppercase tracking-tighter border border-n-500/20">
              Shift + Enter
            </div>
          </div>
          <button
            disabled={sending || !newMessage.trim()}
            className="btn-primary w-11 h-11 !rounded-xl !p-0 shadow-lg shadow-accent-500/20 hover:shadow-accent-500/40 active:scale-95 transition-all flex items-center justify-center shrink-0"
          >
            {sending ? (
              <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
            ) : (
              <svg className="w-5 h-5 translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
