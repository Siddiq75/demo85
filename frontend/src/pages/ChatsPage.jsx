import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Search, Send, MessageSquare, Phone, Check, CheckCheck, Ruler, ShoppingBag, Clock, ChevronRight, X, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { API_URL, getMediaUrl } from '../context/AuthContext';

export default function ChatsPage() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [conversations, setConversations] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null); // ConversationListItem
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const feedRef = useRef(null);

  // CRM & Insights state
  const [customerMeasurements, setCustomerMeasurements] = useState(null);
  const [customerOrders, setCustomerOrders] = useState([]);
  const [loadingCustomerInfo, setLoadingCustomerInfo] = useState(false);
  const [showCustomerInfo, setShowCustomerInfo] = useState(false);

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

  const fetchCustomerCRMData = async (chat) => {
    if (!chat) return;
    setLoadingCustomerInfo(true);
    try {
      // 1. Fetch customer measurements using customer_id
      const measRes = await axios.get(`${API_URL}/customers/${chat.customer_id}/measurements`);
      setCustomerMeasurements(measRes.data);
      
      // 2. Fetch customer orders using customer_id
      const ordersRes = await axios.get(`${API_URL}/orders?customer_id=${chat.customer_id}`);
      setCustomerOrders(ordersRes.data);
    } catch (err) {
      console.error("Error fetching customer CRM info for chats page:", err);
    } finally {
      setLoadingCustomerInfo(false);
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

  // Polling for selected chat messages and loading CRM insights
  useEffect(() => {
    if (selectedChat) {
      fetchMessages(selectedChat);
      fetchCustomerCRMData(selectedChat);
      if (messagesPollRef.current) clearInterval(messagesPollRef.current);
      messagesPollRef.current = setInterval(() => fetchMessages(selectedChat), 2500);
    } else {
      setMessages([]);
      setCustomerMeasurements(null);
      setCustomerOrders([]);
      setShowCustomerInfo(false);
      if (messagesPollRef.current) clearInterval(messagesPollRef.current);
    }
    return () => {
      if (messagesPollRef.current) clearInterval(messagesPollRef.current);
    };
  }, [selectedChat]);

  // Scroll to bottom on new messages using direct container scrolling to avoid window scroll shifts
  useEffect(() => {
    if (feedRef.current) {
      feedRef.current.scrollTop = feedRef.current.scrollHeight;
    }
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
    <div className="flex h-[calc(100vh-10rem)] rounded-3xl border border-slate-200/80 dark:border-white/5 overflow-hidden glass-panel text-left animate-fade-in relative z-10">
      
      {/* LEFT PANEL: CONVERSATIONS LIST */}
      <div className="w-80 border-r border-slate-200/80 dark:border-white/5 flex flex-col h-full bg-slate-50/50 dark:bg-slate-950/20">
        {/* Search header */}
        <div className="p-4 border-b border-slate-200/80 dark:border-white/5 space-y-3 bg-slate-100/30 dark:bg-transparent">
          <h3 className="text-lg font-black text-slate-800 dark:text-white font-heading tracking-wide flex items-center justify-between">
            <span className="flex items-center">
              <MessageSquare className="w-5 h-5 mr-2 text-purple-500 animate-pulse" />
              {t('chats') || 'Chats'}
            </span>
            <span className="text-[10px] font-black bg-purple-500/10 text-purple-650 dark:text-purple-400 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              {filteredConversations.length} Active
            </span>
          </h3>
          <div className="relative group">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-550 dark:text-slate-400 group-focus-within:text-purple-500 transition-colors" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('chatSearchPlaceholder') || 'Search customers...'}
              className="w-full bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/25 transition-all duration-300 shadow-sm"
            />
          </div>
        </div>

        {/* List */}
        <div className="flex-grow overflow-y-auto p-2 space-y-2 animate-fade-in">
          {filteredConversations.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-455 dark:text-gray-500">
              No conversations found.
            </div>
          ) : (
            filteredConversations.map(chat => {
              const isSelected = selectedChat?.phone === chat.phone;
              return (
                <div
                  key={chat.phone}
                  onClick={() => setSelectedChat(chat)}
                  className={`p-3 flex items-center space-x-3 cursor-pointer rounded-2xl border transition-all duration-350 hover:scale-[1.01] ${
                    isSelected 
                      ? 'bg-gradient-to-r from-purple-500/15 to-indigo-500/15 border-purple-500/50 shadow-md shadow-purple-500/10' 
                      : 'hover:bg-slate-100/50 dark:hover:bg-white/5 border-transparent hover:border-slate-250 dark:hover:border-white/5'
                  }`}
                >
                  <div 
                    className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs flex-shrink-0 shadow-md border transition-all duration-300 ${
                      isSelected 
                        ? 'bg-gradient-to-br from-purple-500 to-indigo-600 border-purple-400/30' 
                        : 'bg-gradient-to-br from-purple-500/15 to-indigo-500/15 text-purple-600 dark:text-purple-400 border-purple-500/10'
                    }`}
                    style={isSelected ? { color: '#ffffff' } : {}}
                  >
                    {getInitials(chat.name)}
                  </div>
                  
                  <div className="flex-grow min-w-0">
                    <div className="flex justify-between items-center">
                      <h4 className="text-xs font-black text-slate-850 dark:text-white truncate leading-none mb-1">
                        {chat.name}
                      </h4>
                      <span className="text-[9px] text-slate-450 dark:text-slate-550 flex-shrink-0 font-medium">
                        {chat.last_message_timestamp ? formatTime(chat.last_message_timestamp) : ''}
                      </span>
                    </div>
                    
                    <p className="text-[11px] text-slate-505 dark:text-slate-400 truncate font-semibold leading-normal">
                      {chat.last_message_sender === 'tailor' && <span className="text-purple-500 mr-0.5">You: </span>}
                      {chat.last_message || 'Start chatting...'}
                    </p>
                  </div>

                  {chat.unread_count > 0 && !isSelected && (
                    <span className="bg-gradient-to-r from-purple-500 to-pink-500 text-white font-black text-[9px] w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 shadow-md shadow-purple-500/25 animate-bounce">
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
      <div className="flex-grow flex h-full relative overflow-hidden bg-slate-50/30 dark:bg-slate-950/10">
        {selectedChat ? (
          <>
            <div className="flex-grow flex flex-col h-full min-w-0 relative z-10">
              {/* Decorative wallpaper patterns */}
              <div className="absolute inset-0 bg-stitch-grid pointer-events-none opacity-40 dark:opacity-30 -z-10"></div>
              
              {/* Header */}
              <div className="p-4 border-b border-slate-200/80 dark:border-white/5 flex items-center justify-between bg-slate-100/90 dark:bg-slate-900/40 backdrop-blur-md shadow-sm">
                <div className="flex items-center space-x-3 text-left">
                  <div 
                    className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-650 flex items-center justify-center font-bold text-xs shadow-md border border-purple-400/20"
                    style={{ color: '#ffffff' }}
                  >
                    {getInitials(selectedChat.name)}
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-slate-800 dark:text-white font-heading leading-tight">{selectedChat.name}</h4>
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-500 font-extrabold flex items-center mt-0.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse"></span>
                      {t('online') || 'Active Now'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <div className="flex items-center space-x-1.5 text-xs text-slate-650 dark:text-slate-300 font-bold bg-slate-200/50 dark:bg-white/5 border border-slate-300/30 dark:border-white/5 py-1.5 px-3 rounded-xl shadow-inner">
                    <Phone className="w-3.5 h-3.5 text-purple-500 mr-1" />
                    <span>{selectedChat.phone}</span>
                  </div>
                  
                  {/* Toggle Collapsible CRM insights */}
                  <button 
                    onClick={() => setShowCustomerInfo(!showCustomerInfo)}
                    className={`p-2 rounded-xl transition duration-300 border flex items-center justify-center hover:scale-105 active:scale-95 cursor-pointer ${
                      showCustomerInfo 
                        ? 'bg-purple-650 text-white border-purple-500 shadow-md shadow-purple-500/20' 
                        : 'bg-slate-200/50 dark:bg-white/5 text-slate-700 dark:text-purple-405 border-slate-350/20 dark:border-white/5 hover:border-purple-500/30'
                    }`}
                    title="Customer Info & Measurements"
                  >
                    <Ruler className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Message Feed */}
              <div ref={feedRef} className="flex-grow overflow-y-auto p-5 space-y-4 bg-slate-100/10 dark:bg-slate-950/25">
                {messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-slate-450 dark:text-gray-550 space-y-2 select-none">
                    <MessageSquare className="w-8 h-8 text-slate-400 dark:text-slate-600" />
                    <p className="text-xs">{t('noMessagesYet')}</p>
                  </div>
                ) : (
                  messages.map(msg => {
                    const isTailor = msg.sender === 'tailor';
                    return (
                      <div 
                        key={msg.id} 
                        className={`flex ${isTailor ? 'justify-end' : 'justify-start'} animate-fade-in`}
                      >
                        <div 
                          className={`max-w-[70%] min-w-[125px] px-4 py-3 rounded-2xl text-xs font-semibold text-left relative transition-all duration-350 shadow-md group ${
                            isTailor 
                              ? 'rounded-tr-none chat-bubble-tailor hover:shadow-purple-500/30' 
                              : 'rounded-tl-none chat-bubble-customer hover:shadow-slate-400/20'
                          }`}
                          style={isTailor ? { color: '#ffffff' } : {}}
                        >
                          <div 
                            className="whitespace-pre-wrap break-words leading-relaxed font-sans pr-2"
                            style={isTailor ? { color: '#ffffff' } : {}}
                          >
                            {msg.message_text}
                          </div>
                          
                          <div 
                            className="mt-2.5 flex items-center justify-end space-x-1 text-[9px] select-none opacity-70 group-hover:opacity-95 transition-opacity"
                            style={isTailor ? { color: 'rgba(255, 255, 255, 0.7)' } : {}}
                          >
                            <small className="font-semibold" style={isTailor ? { color: 'rgba(255, 255, 255, 0.7)' } : {}}>{formatTime(msg.timestamp)}</small>
                            {isTailor && (
                              msg.is_read 
                                ? <CheckCheck className="w-3.5 h-3.5 text-emerald-400 animate-pulse" /> 
                                : <Check className="w-3.5 h-3.5" style={{ color: 'rgba(255, 255, 255, 0.7)' }} />
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>


              {/* Input Footer */}
              <form onSubmit={handleSend} className="p-4 border-t border-slate-200/80 dark:border-white/5 bg-slate-55/70 dark:bg-slate-950/20 flex items-center space-x-3">
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder={t('typeMessage') || 'Type a message...'}
                  className="flex-grow bg-slate-100/70 dark:bg-white/5 border border-slate-200/50 dark:border-white/5 rounded-2xl px-4 py-3.5 text-xs text-slate-800 dark:text-white placeholder-slate-455 dark:placeholder-slate-550 focus:outline-none focus:border-purple-500/50 focus:bg-white dark:focus:bg-slate-950/20 transition-all shadow-inner"
                />
                <button
                  type="submit"
                  className="w-12 h-12 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-550 text-white flex items-center justify-center transition-all shadow-md shadow-purple-500/15 cursor-pointer active:scale-95 shrink-0"
                >
                  <Send className="w-4.5 h-4.5" />
                </button>
              </form>
            </div>

            {/* CRM & ORDER INSIGHTS SIDEBAR */}
            {showCustomerInfo && (
              <div className="w-80 border-l border-slate-200/80 dark:border-white/5 h-full flex flex-col overflow-hidden bg-slate-100/90 dark:bg-slate-955/80 backdrop-blur-md animate-fade-in relative z-20 shadow-2xl">
                <div className="p-4 border-b border-slate-200/80 dark:border-white/5 flex justify-between items-center bg-slate-200/50 dark:bg-white/5">
                  <h4 className="text-xs font-black text-slate-800 dark:text-white font-heading uppercase tracking-wider flex items-center">
                    <User className="w-3.5 h-3.5 mr-1.5 text-purple-500" />
                    Customer Insights
                  </h4>
                  <button 
                    onClick={() => setShowCustomerInfo(false)}
                    className="text-slate-500 hover:text-slate-800 dark:text-gray-400 dark:hover:text-white font-bold p-1 bg-slate-200/60 dark:bg-white/5 rounded-lg transition border border-transparent hover:border-slate-300 dark:hover:border-white/5"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex-grow overflow-y-auto p-4 space-y-6">
                  {/* Measurements */}
                  <div className="space-y-3">
                    <div className="flex items-center space-x-1.5 text-xs font-black text-slate-700 dark:text-gray-450 uppercase tracking-wider">
                      <Ruler className="w-4 h-4 text-purple-500" />
                      <span>Measurement Profile</span>
                    </div>

                    {loadingCustomerInfo ? (
                      <div className="text-center py-4 text-slate-400 text-xs">Loading profile measurements...</div>
                    ) : customerMeasurements ? (
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          {[
                          {
                            key: 'chest', label: 'Chest'
                          }, {
                            key: 'waist', label: 'Waist'
                          }, {
                            key: 'shoulder', label: 'Shoulder'
                          }, {
                            key: 'sleeve', label: 'Sleeve'
                          }, {
                            key: 'length', label: 'Length'
                          }, {
                            key: 'neck', label: 'Neck'
                          }, {
                            key: 'hip', label: 'Hip'
                          }].map(field => (
                            <div key={field.key} className="bg-white dark:bg-white/5 border border-slate-200/60 dark:border-white/10 hover:border-purple-500/30 dark:hover:border-purple-500/30 p-2.5 rounded-xl text-center shadow-sm hover:shadow-md transition-all duration-300 hover:scale-102">
                              <span className="block text-[9px] uppercase font-extrabold text-slate-450 dark:text-slate-500">{field.label}</span>
                              <strong className="text-xs font-black text-slate-800 dark:text-white block mt-0.5">
                                {customerMeasurements[field.key] ? `${customerMeasurements[field.key]}"` : '-'}
                              </strong>
                            </div>
                          ))}
                        </div>

                        {customerMeasurements.notes && (
                          <div className="bg-white dark:bg-white/5 border border-slate-200/60 dark:border-white/10 p-3.5 rounded-xl text-left text-[11px] text-slate-700 dark:text-gray-300 shadow-sm">
                            <span className="text-[9px] font-black uppercase text-slate-450 dark:text-slate-500 block mb-1">Tailor Notes</span>
                            <p className="leading-relaxed font-semibold italic">{customerMeasurements.notes}</p>
                          </div>
                        )}

                        {customerMeasurements.reference_image_url && (
                          <div className="space-y-1.5 text-left">
                            <span className="text-[9px] font-black uppercase text-slate-450 dark:text-slate-500 block">Reference Sketch</span>
                            <div className="bg-white dark:bg-white/5 border border-slate-200/60 dark:border-white/10 rounded-xl p-2 h-28 flex items-center justify-center overflow-hidden shadow-sm hover:shadow-md transition-all duration-300">
                              <img
                                src={getMediaUrl(customerMeasurements.reference_image_url)}
                                alt="Reference Sketch"
                                className="max-h-full object-contain rounded-lg"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-4 text-slate-450 text-xs italic">No measurements recorded.</div>
                    )}
                  </div>

                  {/* Active Orders */}
                  <div className="space-y-3">
                    <div className="flex items-center space-x-1.5 text-xs font-black text-slate-700 dark:text-gray-450 uppercase tracking-wider">
                      <ShoppingBag className="w-4 h-4 text-purple-500" />
                      <span>Orders List ({customerOrders.length})</span>
                    </div>

                    {loadingCustomerInfo ? (
                      <div className="text-center py-4 text-slate-400 text-xs">Loading active orders...</div>
                    ) : customerOrders.length > 0 ? (
                      <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                        {customerOrders.map(order => (
                          <div key={order.id} className="bg-white dark:bg-white/5 border border-slate-200/60 dark:border-white/10 hover:border-purple-500/20 dark:hover:border-purple-500/20 p-3 rounded-xl text-left relative overflow-hidden shadow-sm hover:shadow-md transition-all duration-300">
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-[10px] font-black uppercase text-purple-650 dark:text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-md">
                                {order.cloth_type}
                              </span>
                              <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full ${
                                order.status === 'Ready' ? 'bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400' :
                                order.status === 'In Progress' ? 'bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400' :
                                'bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400'
                              }`}>
                                {order.status}
                              </span>
                            </div>
                            <div className="flex justify-between text-[10px] text-slate-550 dark:text-slate-400 font-bold mt-2">
                              <span>Bal: <strong className={order.balance_amount > 0 ? "text-amber-650 dark:text-amber-450" : "text-slate-750 dark:text-slate-350"}>₹{order.balance_amount}</strong></span>
                              <span>Due: {order.delivery_date}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-4 text-slate-455 text-xs italic">No active orders found.</div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-slate-500 space-y-6 select-none p-8 text-center animate-fade-in">
            {/* Animated Sewing SVG composition */}
            <div className="relative w-48 h-48 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border border-dashed border-purple-500/20 animate-[spin_60s_linear_infinite]"></div>
              <div className="absolute inset-4 rounded-full border border-dashed border-pink-500/15 animate-[spin_40s_linear_infinite_reverse]"></div>
              
              <svg className="w-32 h-32 text-purple-550/40 dark:text-purple-400/20" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path 
                  d="M 15 50 C 30 20, 70 80, 85 50" 
                  stroke="currentColor" 
                  strokeWidth="2.5" 
                  strokeLinecap="round"
                  strokeDasharray="5 5" 
                  className="animate-slow-dash text-purple-500/60 dark:text-purple-400/30"
                />
                <path 
                  d="M 82 25 L 68 39 M 68 39 L 15 85 L 12 88 L 15 85 L 25 82 Z" 
                  stroke="url(#needleGrad)" 
                  strokeWidth="2.5" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                />
                <circle cx="80" cy="27" r="1.5" fill="currentColor" />
                <path 
                  d="M 80 27 C 88 18, 92 35, 84 38 C 76 41, 62 30, 68 39" 
                  stroke="#a855f7" 
                  strokeWidth="1.5" 
                  fill="none" 
                />
                <defs>
                  <linearGradient id="needleGrad" x1="0" y1="1" x2="1" y2="0">
                    <stop offset="0%" stopColor="#ec4899" />
                    <stop offset="100%" stopColor="#8b5cf6" />
                  </linearGradient>
                </defs>
              </svg>
              
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 p-4 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl shadow-xl shadow-purple-500/5">
                <MessageSquare className="w-8 h-8 text-purple-650 dark:text-purple-400 animate-bounce" strokeWidth={2.2} />
              </div>
            </div>

            <div className="space-y-2 max-w-sm">
              <h4 className="text-lg font-black text-slate-800 dark:text-white font-heading tracking-tight">{t('selectChatTitle') || 'Select a customer chat'}</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-semibold">
                {t('selectChatDesc') || 'Choose a customer conversation from the list on the left to review measurement history, active order logs, and exchange instant messages.'}
              </p>
            </div>
            
            <div className="flex items-center space-x-2 bg-purple-500/5 dark:bg-white/5 border border-purple-500/10 dark:border-white/5 px-4 py-2 rounded-2xl max-w-xs text-[11px] text-slate-650 dark:text-slate-400 font-bold leading-normal">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse flex-shrink-0"></span>
              <span>CRM metrics and billing balances update in real-time.</span>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
