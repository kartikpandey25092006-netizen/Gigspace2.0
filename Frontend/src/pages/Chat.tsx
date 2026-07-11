import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import type { RootState } from '../store';
import { api } from '../services/api';
import { getSocket } from '../services/socket';
import { Send, User as UserIcon, MessageSquare, Loader2 } from 'lucide-react';
import type { IMessage } from '../../../Shared/src/types';

export const Chat: React.FC = () => {
  const location = useLocation();
  const { user } = useSelector((state: RootState) => state.auth);

  const [conversations, setConversations] = useState<any[]>([]);
  const [activePartner, setActivePartner] = useState<any>(null);
  const [messages, setMessages] = useState<IMessage[]>([]);
  
  const [text, setText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [partnerTyping, setPartnerTyping] = useState(false);
  const typingTimeoutRef = useRef<any>(null);
  const messageEndRef = useRef<HTMLDivElement>(null);

  // Load conversations
  const fetchConversations = async () => {
    try {
      const res = await api.get('/chats/conversations');
      setConversations(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchHistory = async (partnerId: string) => {
    try {
      const res = await api.get(`/chats/history/${partnerId}`);
      setMessages(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchConversations();
  }, []);

  // Listen to incoming chats via Socket.io
  useEffect(() => {
    const socket = getSocket();
    if (!socket || !user) return;

    socket.on('new_message', (msg: any) => {
      // If message is from our active chat partner, append it
      if (activePartner && (msg.senderId._id === activePartner._id || msg.senderId === activePartner._id)) {
        setMessages((prev) => [...prev, msg]);
        // Auto mark as read
        api.get(`/chats/history/${activePartner._id}`);
      }
      fetchConversations();
    });

    socket.on('typing_status', (data: { senderId: string; isTyping: boolean }) => {
      if (activePartner && data.senderId === activePartner._id) {
        setPartnerTyping(data.isTyping);
      }
    });

    return () => {
      socket.off('new_message');
      socket.off('typing_status');
    };
  }, [activePartner, user]);

  // Handle passed location state from ListingDetail details ("Chat" button)
  useEffect(() => {
    if (location.state && (location.state as any).recipient) {
      const target = (location.state as any).recipient;
      setActivePartner(target);
      fetchHistory(target._id);
    }
  }, [location.state]);

  useEffect(() => {
    if (activePartner) {
      fetchHistory(activePartner._id);
      setPartnerTyping(false);
    }
  }, [activePartner]);

  // Auto scroll to bottom
  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, partnerTyping]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || !activePartner) return;

    const bodyText = text;
    setText('');

    // Emit stop typing
    const socket = getSocket();
    if (socket) {
      socket.emit('typing', { senderId: user?.id, receiverId: activePartner._id, isTyping: false });
    }

    try {
      const res = await api.post('/chats', {
        receiverId: activePartner._id,
        body: bodyText
      });
      setMessages((prev) => [...prev, res.data]);
      fetchConversations();
    } catch (err) {
      console.error(err);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setText(e.target.value);
    const socket = getSocket();
    if (!socket || !activePartner || !user) return;

    // Send typing notification
    socket.emit('typing', { senderId: user.id, receiverId: activePartner._id, isTyping: true });

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('typing', { senderId: user.id, receiverId: activePartner._id, isTyping: false });
    }, 2000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 h-[calc(100vh-8rem)]">
      <div className="glass-panel rounded-2xl overflow-hidden h-full flex">
        
        {/* Left Side: Conversations */}
        <div className="w-80 border-r border-slate-800 flex flex-col bg-slate-900/30">
          <div className="p-4 border-b border-slate-800 flex items-center space-x-2">
            <MessageSquare className="w-5 h-5 text-blue-400" />
            <h2 className="font-bold text-white text-base">Conversations</h2>
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-slate-800/40">
            {conversations.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-500">
                No active conversations. Reach out to peers from the listing pages!
              </div>
            ) : (
              conversations.map((c) => (
                <div
                  key={c.partner._id}
                  onClick={() => setActivePartner(c.partner)}
                  className={`p-4 cursor-pointer hover:bg-slate-800/20 transition flex items-center space-x-3 ${
                    activePartner?._id === c.partner._id ? 'bg-slate-800/40 border-l-4 border-blue-500' : ''
                  }`}
                >
                  <div className="p-2 bg-slate-800 rounded-full text-slate-400">
                    <UserIcon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline">
                      <p className="text-xs font-semibold text-slate-200 truncate">{c.partner.name}</p>
                      <span className="text-[10px] text-slate-500">
                        {new Date(c.lastMessage.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 truncate mt-1">{c.lastMessage.body}</p>
                  </div>
                  {!c.lastMessage.read && c.lastMessage.senderId !== user?.id && (
                    <span className="h-2 w-2 rounded-full bg-blue-500" />
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Side: Message Stream */}
        <div className="flex-1 flex flex-col bg-slate-900/10">
          {activePartner ? (
            <>
              {/* Active Conversation Header */}
              <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center bg-slate-900/30">
                <div className="flex items-center space-x-3">
                  <div className="p-2.5 bg-slate-800 rounded-full text-slate-400">
                    <UserIcon className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-200">{activePartner.name}</h3>
                    <p className="text-[10px] text-slate-400">{activePartner.college}</p>
                  </div>
                </div>
                {partnerTyping && (
                  <span className="text-xs text-blue-400 italic flex items-center">
                    <Loader2 className="w-3 h-3 animate-spin mr-1" /> typing...
                  </span>
                )}
              </div>

              {/* Message History Feed */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {messages.map((m) => {
                  const isOwn = (m.senderId._id || m.senderId) === user?.id;

                  return (
                    <div key={m._id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                      <div className="max-w-[70%]">
                        <div className={`p-3.5 rounded-xl text-sm ${
                          isOwn 
                            ? 'bg-blue-600 text-white rounded-br-none' 
                            : 'bg-slate-800 text-slate-200 rounded-bl-none'
                        }`}>
                          <p className="leading-relaxed whitespace-pre-wrap">{m.body}</p>
                        </div>
                        <span className="text-[9px] text-slate-500 mt-1 block text-right px-1">
                          {new Date(m.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          {isOwn && (
                            <span className="ml-1 text-blue-400 font-semibold">
                              {m.read ? '• Read' : '• Sent'}
                            </span>
                          )}
                        </span>
                      </div>
                    </div>
                  );
                })}
                <div ref={messageEndRef} />
              </div>

              {/* Message Input Bar */}
              <div className="p-4 border-t border-slate-800 bg-slate-900/30">
                <form onSubmit={handleSend} className="flex gap-3">
                  <input
                    type="text"
                    required
                    placeholder={`Write message to ${activePartner.name}...`}
                    value={text}
                    onChange={handleInputChange}
                    className="flex-1 px-4 py-3 bg-slate-950 border border-slate-850 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                  />
                  <button
                    type="submit"
                    className="px-5 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col justify-center items-center text-slate-500">
              <MessageSquare className="w-12 h-12 mb-3 text-slate-600" />
              <p className="text-base font-semibold">No Active Conversation Selected</p>
              <p className="text-xs text-slate-600 mt-1">Select a student from the sidebar to start chat sync.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
