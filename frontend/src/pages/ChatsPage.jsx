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

  // Simulated chat loop state for empty state onboarding mockup
  const [simulatedIndex, setSimulatedIndex] = useState(0);
  const [visibleSimulatedMsgs, setVisibleSimulatedMsgs] = useState([]);
  const [isSimulatedTyping, setIsSimulatedTyping] = useState(false);
  const [simulatedTypingSender, setSimulatedTypingSender] = useState('');

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

  // Simulated live chat mockup loop
  useEffect(() => {
    if (selectedChat) return;

    const chatSequence = [
      { sender: 'customer', text: 'Hello! Is my green Anarkali suit ready?' },
      { sender: 'tailor', text: 'Hi Lakshmi! Yes, it is fully stitched and ready for pickup tomorrow!' },
      { sender: 'customer', text: 'Perfect! Did you check the waist measurement from my last order?' },
      { sender: 'tailor', text: 'Yes, we matched it exactly to 32 inches as recorded in your profile. 👍' },
      { sender: 'customer', text: 'Thank you so much! See you tomorrow!' }
    ];

    setVisibleSimulatedMsgs([chatSequence[0]]);
    setSimulatedIndex(1);
    setIsSimulatedTyping(false);

    const interval = setInterval(() => {
      setSimulatedIndex(prevIndex => {
        const nextIndex = prevIndex % chatSequence.length;
        if (nextIndex === 0) {
          setVisibleSimulatedMsgs([chatSequence[0]]);
          return 1;
        } else {
          const nextMsg = chatSequence[nextIndex];
          setSimulatedTypingSender(nextMsg.sender === 'tailor' ? 'Tailor' : 'Customer');
          setIsSimulatedTyping(true);
          
          setTimeout(() => {
            setVisibleSimulatedMsgs(prev => [...prev, nextMsg]);
            setIsSimulatedTyping(false);
          }, 1500);

          return nextIndex + 1;
        }
      });
    }, 4500);

    return () => clearInterval(interval);
  }, [selectedChat]);

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

  const getCustomerStatus = () => {
    if (!selectedChat) return { text: 'Offline', isOnline: false };
    
    const customerMsgs = messages.filter(m => m.sender === 'customer');
    if (customerMsgs.length === 0) {
      return { text: 'Offline', isOnline: false };
    }
    
    const latestMsg = customerMsgs[customerMsgs.length - 1];
    const lastTime = new Date(latestMsg.timestamp).getTime();
    const now = new Date().getTime();
    const diffMins = (now - lastTime) / (1000 * 60);
    
    if (diffMins < 15) {
      return { text: 'Online', isOnline: true };
    }
    
    if (diffMins < 60) {
      return { text: `Active ${Math.max(1, Math.round(diffMins))}m ago`, isOnline: false };
    } else if (diffMins < 1440) {
      return { text: `Active ${Math.max(1, Math.round(diffMins / 60))}h ago`, isOnline: false };
    } else {
      return { text: `Active on ${new Date(latestMsg.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' })}`, isOnline: false };
    }
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
                    {(() => {
                      const status = getCustomerStatus();
                      return (
                        <span className={`text-[10px] font-extrabold flex items-center mt-0.5 ${
                          status.isOnline 
                            ? 'text-emerald-600 dark:text-emerald-500' 
                            : 'text-slate-450 dark:text-slate-500'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                            status.isOnline 
                              ? 'bg-emerald-500 animate-pulse' 
                              : 'bg-slate-400 dark:bg-slate-500'
                          }`}></span>
                          {status.text}
                        </span>
                      );
                    })()}
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
          <div className="flex flex-col items-center justify-center h-full select-none p-6 text-center animate-fade-in w-full max-w-5xl mx-auto">
            <div className="bg-white/40 dark:bg-slate-900/35 backdrop-blur-2xl border border-slate-200/50 dark:border-white/5 rounded-[2.5rem] p-8 md:p-10 w-full max-w-4xl shadow-2xl flex flex-col md:flex-row items-center gap-8 relative overflow-hidden transition-all duration-500 hover:shadow-purple-500/5">
              
              {/* Glow background effects */}
              <div className="absolute -right-20 -top-20 w-80 h-80 bg-purple-500/10 dark:bg-purple-500/5 rounded-full blur-3xl pointer-events-none"></div>
              <div className="absolute -left-20 -bottom-20 w-80 h-80 bg-pink-500/10 dark:bg-pink-500/5 rounded-full blur-3xl pointer-events-none"></div>
              
              {/* Left Side: Copy and Features list */}
              <div className="flex-1 text-left space-y-6 relative z-10">
                <div className="space-y-3">
                  <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-purple-500/10 to-indigo-500/10 dark:from-purple-500/20 dark:to-indigo-500/20 text-purple-650 dark:text-purple-300 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider border border-purple-500/10 shadow-sm">
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse"></span>
                    <span>AI Tailoring Suite</span>
                  </div>
                  <h4 className="text-2xl md:text-3xl font-black font-heading tracking-tight bg-gradient-to-r from-purple-650 via-indigo-650 to-pink-600 dark:from-purple-400 dark:via-indigo-300 dark:to-pink-400 bg-clip-text text-transparent leading-tight">
                    {t('selectChatTitle') || 'VastraSilai Workspace'}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-semibold max-w-md">
                    {t('selectChatDesc') || 'Select a customer conversation from the list to preview measurement history, active order logs, and exchange instant messages.'}
                  </p>
                </div>

                {/* Micro feature cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div className="bg-white/60 dark:bg-white/5 border border-slate-200/60 dark:border-white/10 p-3 rounded-2xl flex items-start space-x-3 shadow-xs hover:border-purple-500/30 transition-all duration-300 hover:scale-[1.02]">
                    <div className="p-2 bg-purple-500/10 text-purple-600 dark:text-purple-400 rounded-xl flex-shrink-0">
                      <Ruler className="w-4 h-4" />
                    </div>
                    <div>
                      <h5 className="text-xs font-black text-slate-800 dark:text-white">Profile & Measurements</h5>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold mt-0.5 leading-tight">View custom sleeve, length, and collar records instantly.</p>
                    </div>
                  </div>

                  <div className="bg-white/60 dark:bg-white/5 border border-slate-200/60 dark:border-white/10 p-3 rounded-2xl flex items-start space-x-3 shadow-xs hover:border-purple-500/30 transition-all duration-300 hover:scale-[1.02]">
                    <div className="p-2 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-xl flex-shrink-0">
                      <ShoppingBag className="w-4 h-4" />
                    </div>
                    <div>
                      <h5 className="text-xs font-black text-slate-800 dark:text-white">Active Order Status</h5>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold mt-0.5 leading-tight">Monitor stitching progress, delivery dates, and balances.</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Side: Simulated Phone Mockup */}
              <div className="w-full md:w-[320px] h-[380px] bg-slate-900/15 dark:bg-slate-950/40 border border-slate-200/60 dark:border-white/10 rounded-[2rem] p-3 shadow-2xl relative flex flex-col overflow-hidden backdrop-blur-md hover:scale-[1.02] transition-transform duration-300 select-none">
                {/* Phone Notch/Header bar */}
                <div className="flex justify-between items-center px-4 py-1 text-[9px] font-bold text-slate-500 dark:text-slate-400 border-b border-slate-200/30 dark:border-white/5 pb-2">
                  <span>9:41</span>
                  <div className="w-16 h-3.5 bg-slate-250 dark:bg-slate-900 rounded-full border border-slate-300/30 dark:border-white/10 flex items-center justify-center">
                    <span className="w-1 h-1 rounded-full bg-slate-400 mr-1"></span>
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-500"></span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <span className="w-2.5 h-1.5 bg-slate-450 dark:bg-slate-550 rounded-xs"></span>
                  </div>
                </div>

                {/* Mock Chat Header */}
                <div className="py-2.5 px-2 border-b border-slate-200/30 dark:border-white/5 flex items-center space-x-2 bg-slate-100/30 dark:bg-slate-950/20">
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white text-[9px] font-black shadow-xs">
                    VS
                  </div>
                  <div className="text-left flex-grow min-w-0">
                    <h6 className="text-[10px] font-black text-slate-800 dark:text-white truncate leading-none">VastraSilai Assistant</h6>
                    <span className="text-[8px] text-emerald-500 font-extrabold flex items-center mt-0.5">
                      <span className="w-1 h-1 rounded-full bg-emerald-500 mr-1 animate-pulse"></span>
                      Online
                    </span>
                  </div>
                </div>

                {/* Mock Message Feed */}
                <div className="flex-grow overflow-y-auto p-2.5 space-y-2 flex flex-col justify-end">
                  {visibleSimulatedMsgs.map((msg, idx) => {
                    const isTailor = msg.sender === 'tailor';
                    return (
                      <div key={idx} className={`flex ${isTailor ? 'justify-end' : 'justify-start'} animate-fade-in`}>
                        <div className={`max-w-[85%] px-3 py-2 rounded-xl text-[10px] font-semibold text-left shadow-xs ${
                          isTailor 
                            ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-tr-none' 
                            : 'bg-white dark:bg-white/5 border border-slate-200/60 dark:border-white/10 text-slate-800 dark:text-slate-250 rounded-tl-none'
                        }`}>
                          {msg.text}
                        </div>
                      </div>
                    );
                  })}

                  {/* Typing Indicator */}
                  {isSimulatedTyping && (
                    <div className="flex justify-start animate-fade-in">
                      <div className="bg-white dark:bg-white/5 border border-slate-200/60 dark:border-white/10 px-3 py-2 rounded-xl rounded-tl-none flex items-center space-x-1">
                        <span className="text-[8px] text-slate-400 dark:text-slate-500 font-bold mr-1">{simulatedTypingSender} typing</span>
                        <span className="w-1 h-1 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                        <span className="w-1 h-1 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                        <span className="w-1 h-1 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Mock Input footer */}
                <div className="p-2 border-t border-slate-200/30 dark:border-white/5 flex items-center space-x-1.5 bg-slate-100/10 dark:bg-slate-950/20">
                  <div className="flex-grow bg-white dark:bg-white/5 border border-slate-200/60 dark:border-white/10 rounded-xl px-2.5 py-1.5 text-[9px] text-slate-450 dark:text-slate-500 font-semibold text-left">
                    {isSimulatedTyping ? 'Typing reply...' : 'Type a message...'}
                  </div>
                  <div className="w-6.5 h-6.5 rounded-lg bg-purple-600 text-white flex items-center justify-center shadow-xs">
                    <Send className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}
      </div>

    </div>
  );
}
