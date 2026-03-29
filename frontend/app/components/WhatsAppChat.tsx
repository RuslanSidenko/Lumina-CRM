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

  if (loading) return <div className="p-4 text-center">Loading conversation...</div>;

  return (
    <div className="flex flex-col h-[500px] bg-slate-50 rounded-lg shadow-inner">
      {/* Header */}
      <div className="p-3 bg-white border-b flex justify-between items-center rounded-t-lg">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-white text-xs font-bold">
            {lead.name.charAt(0)}
          </div>
          <div>
            <h3 className="font-semibold text-sm">{lead.phone}</h3>
            <p className="text-[10px] text-gray-500">WhatsApp Business</p>
          </div>
        </div>
        <button 
          onClick={fetchMessages}
          className="text-xs text-blue-600 hover:underline"
        >
          Refresh
        </button>
      </div>

      {/* Messages */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#e5ddd5]"
        style={{ backgroundImage: 'url("https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png")' }}
      >
        {messages.length === 0 ? (
          <div className="text-center py-10 opacity-50 text-sm">No messages yet with this lead.</div>
        ) : (
          messages.map((m) => (
            <div 
              key={m.id} 
              className={`flex ${m.direction === 'outgoing' ? 'justify-end' : 'justify-start'}`}
            >
              <div 
                className={`max-w-[80%] rounded-lg p-3 shadow-sm ${
                  m.direction === 'outgoing' 
                    ? 'bg-[#dcf8c6] text-slate-800' 
                    : 'bg-white text-slate-800'
                }`}
              >
                {m.message_type === 'text' && <p className="text-sm whitespace-pre-wrap">{m.content}</p>}
                {m.message_type === 'image' && (
                  <div className="space-y-1">
                    <img src={m.content} alt="WhatsApp" className="rounded max-w-full cursor-pointer hover:opacity-90" onClick={() => window.open(m.content, '_blank')} />
                    {m.media_caption && <p className="text-sm border-t pt-1 border-black/5">{m.media_caption}</p>}
                  </div>
                )}
                {m.message_type === 'document' && (
                  <div className="flex items-center gap-2 p-2 bg-black/5 rounded cursor-pointer" onClick={() => window.open(m.content, '_blank')}>
                    <span className="text-xl">📄</span>
                    <div className="overflow-hidden">
                      <p className="text-sm font-medium truncate">{m.media_caption || 'Document'}</p>
                      <p className="text-[10px] opacity-50 uppercase">{m.content.split('.').pop()}</p>
                    </div>
                  </div>
                )}
                <div className="flex justify-end items-center gap-1 mt-1">
                   <span className="text-[10px] opacity-50 px-1">
                    {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                   </span>
                   {m.direction === 'outgoing' && (
                     <span className={`text-[10px] ${m.status === 'read' ? 'text-blue-500' : 'text-gray-400'}`}>
                        {m.status === 'read' ? '✓✓' : m.status === 'delivered' ? '✓✓' : '✓'}
                     </span>
                   )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Input */}
      <form onSubmit={handleSendMessage} className="p-3 bg-white border-t rounded-b-lg flex gap-2">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 px-4 py-2 bg-slate-100 rounded-full text-sm focus:outline-none focus:ring-1 focus:ring-green-500"
        />
        <button
          disabled={sending || !newMessage.trim()}
          className="bg-green-600 text-white p-2 rounded-full hover:bg-green-700 disabled:opacity-50 flex items-center justify-center w-10 h-10"
        >
          {sending ? '...' : (
            <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"></path>
            </svg>
          )}
        </button>
      </form>
    </div>
  );
}
