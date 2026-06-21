import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Search, Send, MessageSquare, Phone, Check, CheckCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { API_URL } from '../context/AuthContext';

export default function ChatsPage() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [conversations, setConversations] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null); // ConversationListItem
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const messagesEndRef = useRef(null);

  // Poll intervals
  const conversationsPollRef = useRef(null);
  const messagesPollRef = useRef(null);

  const fetchConversations = async () => {
    try {
      const res = await axios.get(`${API_URL}/chats/conversations?tailor_id=${user.id}`);
      setConversations(res.data);
    } catch (err) {
      console.error("Error fetching conversations:", err);
    }
  };

  const fetchMessages = async (chat) => {
    if (!chat) return;
    try {
      const res = await axios.get(`${API_URL}/chats/history?tailor_id=${user.id}&customer_phone=${chat.phone}`);
      setMessages(res.data);
      // Mark read
      await axios.post(`${API_URL}/chats/read?tailor_id=${user.id}&customer_phone=${chat.phone}&reader=tailor`);
    } catch (err) {
      console.error("Error fetching messages:", err);
    }
  };

  // Initial load and polling for conversations
  useEffect(() => {
    fetchConversations();
    conversationsPollRef.current = setInterval(fetchConversations, 3000);
    return () => {
      if (conversationsPollRef.current) clearInterval(conversationsPollRef.current);
    };
  }, []);

  // Polling for selected chat messages
  useEffect(() => {
    if (selectedChat) {
      fetchMessages(selectedChat);
      if (messagesPollRef.current) clearInterval(messagesPollRef.current);
      messagesPollRef.current = setInterval(() => fetchMessages(selectedChat), 2500);
    } else {
      setMessages([]);
      if (messagesPollRef.current) clearInterval(messagesPollRef.current);
    }
    return () => {
      if (messagesPollRef.current) clearInterval(messagesPollRef.current);
    };
  }, [selectedChat]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!inputText.trim() || !selectedChat) return;

    const text = inputText.trim();
    setInputText('');

    try {
      const res = await axios.post(`${API_URL}/chats/send`, {
        tailor_id: user.id,
        customer_phone: selectedChat.phone,
        sender: 'tailor',
        message_text: text
      });
      // Append message instantly for responsiveness
      setMessages(prev => [...prev, res.data]);
      // Update conversations last message snippet locally
      setConversations(prev => prev.map(c => {
        if (c.phone === selectedChat.phone) {
          return {
            ...c,
            last_message: text,
            last_message_timestamp: new Date().toISOString(),
            last_message_sender: 'tailor'
          };
        }
        return c;
      }));
    } catch (err) {
      console.error("Error sending message:", err);
    }
  };

  // Filter conversations
  const filteredConversations = conversations.filter(c => {
    const name = c.name.toLowerCase();
    const phone = c.phone.toLowerCase();
    const query = searchQuery.toLowerCase();
    return name.includes(query) || phone.includes(query);
  });

  const getInitials = (name) => {
    const parts = name.trim().split(/\s+/);
    return parts.length > 1
      ? `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
      : parts[0][0]?.toUpperCase() || 'C';
  };

  const formatTime = (isoString) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex h-[calc(100vh-6.5rem)] rounded-3xl border border-white/5 overflow-hidden glass-panel text-left animate-fade-in relative z-10">
      
      {/* LEFT PANEL: CONVERSATIONS LIST */}
      <div className="w-80 border-r border-white/5 flex flex-col h-full bg-slate-955/20">
        {/* Search header */}
        <div className="p-4 border-b border-white/5 space-y-3">
          <h3 className="text-lg font-black text-white font-heading tracking-wide flex items-center">
            <MessageSquare className="w-5 h-5 mr-2 text-purple-400" />
            {t('chats') || 'Chats'}
          </h3>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('chatSearchPlaceholder') || 'Search customers...'}
              className="w-full bg-white/5 border border-white/5 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50"
            />
          </div>
        </div>

        {/* List */}
        <div className="flex-grow overflow-y-auto divide-y divide-white/5">
          {filteredConversations.length === 0 ? (
            <div className="p-8 text-center text-xs text-gray-505">
              No conversations found.
            </div>
          ) : (
            filteredConversations.map(chat => {
              const isSelected = selectedChat?.phone === chat.phone;
              return (
                <div
                  key={chat.phone}
                  onClick={() => setSelectedChat(chat)}
                  className={`p-3.5 flex items-center space-x-3.5 cursor-pointer transition ${
                    isSelected 
                      ? 'bg-purple-600/10 border-l-3 border-purple-500' 
                      : 'hover:bg-white/5'
                  }`}
                >
                  <div className="w-10 h-10 rounded-full bg-purple-600/20 text-purple-400 flex items-center justify-center font-bold text-xs flex-shrink-0 shadow-inner">
                    {getInitials(chat.name)}
                  </div>
                  
                  <div className="flex-grow min-w-0">
                    <div className="flex justify-between items-center">
                      <h4 className="text-xs font-black text-white truncate leading-none mb-1">
                        {chat.name}
                      </h4>
                      <span className="text-[10px] text-gray-500 flex-shrink-0">
                        {chat.last_message_timestamp ? formatTime(chat.last_message_timestamp) : ''}
                      </span>
                    </div>
                    
                    <p className="text-[11px] text-gray-400 truncate font-semibold leading-normal">
                      {chat.last_message_sender === 'tailor' && <span className="text-purple-400 mr-0.5">You: </span>}
                      {chat.last_message || 'Start chatting...'}
                    </p>
                  </div>

                  {chat.unread_count > 0 && !isSelected && (
                    <span className="bg-purple-600 text-white font-black text-[9px] w-4.5 h-4.5 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm shadow-purple-600/20">
                      {chat.unread_count}
                    </span>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* RIGHT PANEL: CHAT WINDOW */}
      <div className="flex-grow flex flex-col h-full bg-slate-955/10">
        {selectedChat ? (
          <>
            {/* Header */}
            <div className="p-4 border-b border-white/5 flex items-center justify-between bg-slate-955/20 shadow-sm">
              <div className="flex items-center space-x-3 text-left">
                <div className="w-10 h-10 rounded-full bg-purple-600 text-white flex items-center justify-center font-bold text-xs shadow-inner">
                  {getInitials(selectedChat.name)}
                </div>
                <div>
                  <h4 className="text-sm font-black text-white font-heading leading-tight">{selectedChat.name}</h4>
                  <span className="text-[10px] text-emerald-500 font-extrabold flex items-center mt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse"></span>
                    {t('online') || 'Active Now'}
                  </span>
                </div>
              </div>

              <div className="flex items-center space-x-2 text-xs text-gray-405 font-bold bg-white/5 border border-white/5 py-1.5 px-3 rounded-lg">
                <Phone className="w-3.5 h-3.5 text-purple-400 mr-1" />
                <span>{selectedChat.phone}</span>
              </div>
            </div>

            {/* Message Feed */}
            <div className="flex-grow overflow-y-auto p-4 space-y-3 bg-slate-955/30">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-500 space-y-2 select-none">
                  <MessageSquare className="w-8 h-8 text-gray-655" />
                  <p className="text-xs">{t('noMessagesYet')}</p>
                </div>
              ) : (
                messages.map(msg => {
                  const isTailor = msg.sender === 'tailor';
                  return (
                    <div 
                      key={msg.id} 
                      className={`flex ${isTailor ? 'justify-end' : 'justify-start'}`}
                    >
                      <div 
                        className={`max-w-[70%] px-3.5 py-2 rounded-2xl shadow-sm text-xs font-semibold text-left relative group ${
                          isTailor 
                            ? 'bg-purple-600 text-white rounded-tr-none' 
                            : 'bg-white/10 text-gray-200 rounded-tl-none border border-white/5'
                        }`}
                      >
                        <p className="pr-12 whitespace-pre-wrap break-words leading-relaxed">
                          {msg.message_text}
                        </p>
                        
                        <div className="absolute right-2 bottom-1.5 flex items-center space-x-1 text-[9px] text-white/50 group-hover:text-white/70 transition-colors select-none">
                          <span>{formatTime(msg.timestamp)}</span>
                          {isTailor && (
                            msg.is_read 
                              ? <CheckCheck className="w-3 h-3 text-emerald-450" /> 
                              : <Check className="w-3 h-3 text-white/40" />
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Footer */}
            <form onSubmit={handleSend} className="p-4 border-t border-white/5 bg-slate-955/20 flex items-center space-x-3">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={t('typeMessage') || 'Type a message...'}
                className="flex-grow bg-white/5 border border-white/5 rounded-2xl px-4 py-3 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50"
              />
              <button
                type="submit"
                className="w-10 h-10 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white flex items-center justify-center transition-all shadow-md shadow-purple-600/10 cursor-pointer active:scale-95 shrink-0"
              >
                <Send className="w-4.5 h-4.5" />
              </button>
            </form>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-gray-500 space-y-3 select-none">
            <div className="w-16 h-16 rounded-full bg-purple-600/10 border border-purple-500/10 text-purple-400 flex items-center justify-center shadow-inner">
              <MessageSquare className="w-8 h-8" />
            </div>
            <h4 className="text-sm font-bold text-white">Select a customer chat</h4>
            <p className="text-xs max-w-xs text-center">Choose a customer conversation from the list on the left to review metrics and start messaging directly.</p>
          </div>
        )}
      </div>

    </div>
  );
}
