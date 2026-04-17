import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, Send, Users, User, Shield, Search, MoreVertical, Phone, Video, Paperclip, Smile, X, Eye, EyeOff } from 'lucide-react';
import { getCollection, addDocument, deleteDocument, query, where, orderBy, onSnapshot, collection } from '../firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../context/AuthContext';
import { format } from 'date-fns';

const Chat = () => {
  const { role, user, displayName } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const MAX_MESSAGE_LENGTH = 2000;
  const [sending, setSending] = useState(false);
  const [members, setMembers] = useState([]);
  const [showNewChat, setShowNewChat] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [anonymous, setAnonymous] = useState(false);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);
  const [chatType, setChatType] = useState('individual'); // 'individual', 'admin', 'group'
  const [groupName, setGroupName] = useState('');
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [showSidebar, setShowSidebar] = useState(true);

  // Load members and conversations
  useEffect(() => {
    loadMembers();
    const unsubscribe = subscribeToConversations();
    return () => unsubscribe();
  }, [user]);

  // Subscribe to messages for selected chat
  useEffect(() => {
    if (!selectedChat) return;

    const messagesQuery = query(
      collection(db, 'messages'),
      where('chatId', '==', selectedChat.id),
      orderBy('createdAt', 'asc')
    );

    const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setMessages(msgs);
      scrollToBottom();
    });

    return () => unsubscribe();
  }, [selectedChat]);

  const loadMembers = async () => {
    const result = await getCollection('members');
    if (result.success) {
      setMembers(result.data.filter(m => m.email !== user.email));
    }
  };

  const loadConversations = async () => {
    // Get all chats where current user is a participant
    const result = await getCollection('chats');
    if (result.success) {
      const userChats = result.data.filter(chat => 
        chat.participants && chat.participants.includes(user.email)
      );
      setConversations(userChats);
    }
    setLoading(false);
  };

  // Real-time subscription for conversations
  const subscribeToConversations = () => {
    const chatsQuery = query(collection(db, 'chats'));
    return onSnapshot(chatsQuery, (snapshot) => {
      const chats = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })).filter(chat => chat.participants && chat.participants.includes(user.email));
      setConversations(chats);
    });
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const startNewChat = async () => {
    let participants = [user.email];
    let chatData = {
      type: chatType,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      participants: participants
    };

    if (chatType === 'individual' && selectedMembers.length === 1) {
      participants.push(selectedMembers[0].email);
      chatData.participants = participants;
      chatData.name = selectedMembers[0].name;
      chatData.otherUser = selectedMembers[0].email;
    } else if (chatType === 'admin' && role !== 'Admin') {
      // Find admin emails
      const adminMembers = members.filter(m => m.role === 'Admin' || m.email === 'denismwg4@gmail.com');
      participants = [...participants, ...adminMembers.map(m => m.email)];
      chatData.participants = participants;
      chatData.name = 'Admin Support';
    } else if (chatType === 'group') {
      participants = [...participants, ...selectedMembers.map(m => m.email)];
      chatData.participants = participants;
      chatData.name = groupName || 'Group Chat';
    }

    // Check if chat already exists
    const existingChat = conversations.find(c =>
      c.type === chatType &&
      JSON.stringify([...c.participants].sort()) === JSON.stringify([...participants].sort())
    );

    if (existingChat) {
      setSelectedChat(existingChat);
    } else {
      const result = await addDocument('chats', chatData);
      if (result.success) {
        const newChat = { id: result.id, ...chatData };
        setConversations([newChat, ...conversations]);
        setSelectedChat(newChat);
      }
    }

    setShowNewChat(false);
    setSelectedMembers([]);
    setGroupName('');
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedChat || sending) return;
    
    setSending(true);

    const messageData = {
      chatId: selectedChat.id,
      sender: user.email,
      senderName: anonymous ? 'Anonymous' : displayName,
      content: newMessage.trim(),
      anonymous: anonymous,
      createdAt: new Date().toISOString(),
      read: false
    };

    await addDocument('messages', messageData);
    setNewMessage('');
    setAnonymous(false);
    setSending(false);

    // Update chat last message
    // await updateDocument('chats', selectedChat.id, {
    //   lastMessage: messageData.content,
    //   lastMessageTime: messageData.createdAt,
    //   updatedAt: messageData.createdAt
    // });
  };

  const toggleMemberSelection = (member) => {
    if (selectedMembers.find(m => m.email === member.email)) {
      setSelectedMembers(selectedMembers.filter(m => m.email !== member.email));
    } else {
      setSelectedMembers([...selectedMembers, member]);
    }
  };

  const filteredMembers = members.filter(m => 
    m.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getChatDisplayName = (chat) => {
    if (chat.name) return chat.name;
    if (chat.type === 'admin') return 'Admin Support';
    const otherParticipant = chat.participants?.find(p => p !== user.email);
    const otherMember = members.find(m => m.email === otherParticipant);
    return otherMember?.name || otherParticipant?.split('@')[0] || 'Unknown';
  };

  const getChatAvatar = (chat) => {
    if (chat.type === 'admin') return <Shield size={20} className="text-primary-600" />;
    if (chat.type === 'group') return <Users size={20} className="text-primary-600" />;
    return <User size={20} className="text-primary-600" />;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="h-[calc(100vh-64px)] md:max-w-7xl md:mx-auto md:px-4 md:py-4">
        <div className="flex h-full md:h-[calc(100vh-120px)] bg-white md:rounded-lg md:shadow-lg overflow-hidden">
          {/* Sidebar - Conversations List */}
          <div className={`${showSidebar ? 'flex' : 'hidden'} md:flex w-full md:w-80 bg-gray-50 border-r border-gray-200 flex-col absolute md:relative z-10 h-full`}>
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">Messages</h2>
                <button
                  onClick={() => setShowNewChat(true)}
                  className="p-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                >
                  <MessageCircle size={20} />
                </button>
              </div>
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search conversations..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {conversations.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  <p>No conversations yet.</p>
                  <button
                    onClick={() => setShowNewChat(true)}
                    className="text-primary-600 text-sm mt-2"
                  >
                    Start a new chat
                  </button>
                </div>
              ) : (
                conversations.map(chat => (
                  <button
                    key={chat.id}
                    onClick={() => {
                      setSelectedChat(chat);
                      setShowSidebar(false);
                    }}
                    className={`w-full p-4 flex items-center gap-3 hover:bg-gray-100 transition-colors ${
                      selectedChat?.id === chat.id ? 'bg-primary-50 border-l-4 border-primary-600' : ''
                    }`}
                  >
                    <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                      {getChatAvatar(chat)}
                    </div>
                    <div className="flex-1 text-left">
                      <h3 className="font-medium text-gray-900 truncate">
                        {getChatDisplayName(chat)}
                      </h3>
                      <p className="text-xs text-gray-500 truncate">
                        {chat.type === 'group' ? 'Group chat' : 
                         chat.type === 'admin' ? 'Admin support' : 'Direct message'}
                      </p>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Chat Area */}
          <div className={`flex-1 flex flex-col ${!showSidebar && selectedChat ? 'flex' : 'hidden md:flex'}`}>
            {selectedChat ? (
              <>
                {/* Chat Header */}
                <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setShowSidebar(true)}
                      className="md:hidden p-2 text-gray-500 hover:bg-gray-100 rounded-lg"
                      title="Back to conversations"
                    >
                      <MessageCircle size={20} />
                    </button>
                    <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                      {getChatAvatar(selectedChat)}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {getChatDisplayName(selectedChat)}
                      </h3>
                      <p className="text-xs text-gray-500">
                        {selectedChat.participants?.length} participants
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg hidden sm:block">
                      <Phone size={20} />
                    </button>
                    <button className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg hidden sm:block">
                      <Video size={20} />
                    </button>
                    <button className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg">
                      <MoreVertical size={20} />
                    </button>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {messages.length === 0 ? (
                    <div className="text-center text-gray-500 py-8">
                      <MessageCircle size={48} className="mx-auto mb-4 text-gray-300" />
                      <p>No messages yet. Start the conversation!</p>
                    </div>
                  ) : (
                    messages.map((msg, idx) => {
                      const isMe = msg.sender === user.email;
                      const showSender = idx === 0 || messages[idx - 1].sender !== msg.sender;
                      
                      return (
                        <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[85%] sm:max-w-[70%] ${isMe ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-800'} rounded-lg px-3 sm:px-4 py-2`}>
                            {showSender && !isMe && (
                              <p className="text-xs font-medium mb-1 opacity-75">
                                {msg.anonymous ? (
                                  <span className="flex items-center gap-1">
                                    <EyeOff size={12} /> Anonymous
                                  </span>
                                ) : (
                                  msg.senderName
                                )}
                              </p>
                            )}
                            <p className="text-sm sm:text-base leading-relaxed whitespace-pre-wrap break-words">{msg.content}</p>
                            <p className={`text-xs mt-1 ${isMe ? 'text-primary-200' : 'text-gray-500'}`}>
                              {format(new Date(msg.createdAt), 'h:mm a')}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Message Input */}
                <div className="p-2 sm:p-4 border-t border-gray-200">
                  <form onSubmit={sendMessage} className="flex flex-col gap-2">
                    <div className="flex items-center gap-1 sm:gap-2">
                      <button type="button" className="hidden sm:block p-2 text-gray-500 hover:bg-gray-100 rounded-lg">
                        <Paperclip size={20} />
                      </button>
                      <textarea
                        value={newMessage}
                        onChange={(e) => {
                          if (e.target.value.length <= MAX_MESSAGE_LENGTH) {
                            setNewMessage(e.target.value);
                          }
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            if (newMessage.trim()) {
                              sendMessage(e);
                            }
                          }
                        }}
                        placeholder="Type a message..."
                        className="flex-1 p-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none min-h-[40px] sm:min-h-[44px] max-h-[100px] sm:max-h-[120px]"
                        rows={1}
                      />
                      <button type="button" className="hidden sm:block p-2 text-gray-500 hover:bg-gray-100 rounded-lg">
                        <Smile size={20} />
                      </button>
                      <button
                        type="submit"
                        disabled={!newMessage.trim() || sending}
                        className="p-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 flex-shrink-0"
                      >
                        {sending ? (
                          <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Send size={18} className="sm:w-5 sm:h-5" />
                        )}
                      </button>
                    </div>
                    <div className="flex items-center justify-between text-xs sm:text-sm">
                      <label className="flex items-center gap-1 sm:gap-2 text-gray-600 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={anonymous}
                          onChange={(e) => setAnonymous(e.target.checked)}
                          className="w-3 h-3 sm:w-4 sm:h-4 text-primary-600 rounded"
                        />
                        {anonymous ? (
                          <span className="flex items-center gap-1">
                            <EyeOff size={12} className="sm:w-4 sm:h-4" /> <span className="hidden sm:inline">Send anonymously</span><span className="sm:hidden">Anonymous</span>
                          </span>
                        ) : (
                          <span className="flex items-center gap-1">
                            <Eye size={12} className="sm:w-4 sm:h-4" /> <span className="hidden sm:inline">Show my identity</span><span className="sm:hidden">Visible</span>
                          </span>
                        )}
                      </label>
                      <span className={`${newMessage.length > MAX_MESSAGE_LENGTH * 0.9 ? 'text-orange-500' : 'text-gray-400'}`}>
                        {newMessage.length}/{MAX_MESSAGE_LENGTH}
                        <span className="hidden sm:inline"> • Shift+Enter for new line • Enter to send</span>
                      </span>
                    </div>
                  </form>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center px-4">
                  <MessageCircle size={48} className="mx-auto mb-4 text-gray-300 md:w-16 md:h-16" />
                  <h3 className="text-lg md:text-xl font-semibold text-gray-900 mb-2">
                    Select a conversation
                  </h3>
                  <p className="text-sm md:text-base text-gray-500 mb-4">
                    Choose a chat from the sidebar or start a new one
                  </p>
                  <button
                    onClick={() => setShowNewChat(true)}
                    className="btn-primary text-sm md:text-base"
                  >
                    Start New Chat
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* New Chat Modal */}
      {showNewChat && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">New Conversation</h3>
              <button
                onClick={() => {
                  setShowNewChat(false);
                  setSelectedMembers([]);
                  setGroupName('');
                }}
                className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>

            {/* Chat Type Selection */}
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setChatType('individual')}
                className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium ${
                  chatType === 'individual' 
                    ? 'bg-primary-600 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <User size={16} className="inline mr-1" /> Individual
              </button>
              <button
                onClick={() => setChatType('admin')}
                className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium ${
                  chatType === 'admin' 
                    ? 'bg-primary-600 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Shield size={16} className="inline mr-1" /> Admin
              </button>
              <button
                onClick={() => setChatType('group')}
                className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium ${
                  chatType === 'group' 
                    ? 'bg-primary-600 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Users size={16} className="inline mr-1" /> Group
              </button>
            </div>

            {/* Group Name Input (for group chats) */}
            {chatType === 'group' && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Group Name
                </label>
                <input
                  type="text"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  placeholder="Enter group name..."
                  className="w-full p-2 border border-gray-300 rounded-lg"
                />
              </div>
            )}

            {/* Member Selection (for individual and group) */}
            {chatType !== 'admin' && (
              <>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {chatType === 'individual' ? 'Select Member' : 'Select Members'}
                  </label>
                  <div className="relative">
                    <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search members..."
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                </div>

                {/* Selected Members */}
                {selectedMembers.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {selectedMembers.map(member => (
                      <span
                        key={member.email}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm"
                      >
                        {member.name || member.email.split('@')[0]}
                        <button
                          onClick={() => toggleMemberSelection(member)}
                          className="hover:text-primary-900"
                        >
                          <X size={14} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                {/* Member List */}
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {filteredMembers.map(member => (
                    <button
                      key={member.email}
                      onClick={() => {
                        if (chatType === 'individual') {
                          setSelectedMembers([member]);
                        } else {
                          toggleMemberSelection(member);
                        }
                      }}
                      className={`w-full p-3 flex items-center gap-3 rounded-lg transition-colors ${
                        selectedMembers.find(m => m.email === member.email)
                          ? 'bg-primary-50 border-2 border-primary-600'
                          : 'hover:bg-gray-50 border-2 border-transparent'
                      }`}
                    >
                      <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                        <User size={16} className="text-gray-600" />
                      </div>
                      <div className="text-left">
                        <p className="font-medium text-gray-900">{member.name || member.email.split('@')[0]}</p>
                        <p className="text-xs text-gray-500">{member.email}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </>
            )}

            {/* Admin Chat Info */}
            {chatType === 'admin' && (
              <div className="p-4 bg-blue-50 rounded-lg mb-4">
                <p className="text-sm text-blue-800">
                  This will start a conversation with the Admin team. 
                  You can send messages anonymously if needed.
                </p>
              </div>
            )}

            <button
              onClick={startNewChat}
              disabled={
                (chatType === 'individual' && selectedMembers.length !== 1) ||
                (chatType === 'group' && selectedMembers.length < 2)
              }
              className="w-full btn-primary mt-4 disabled:opacity-50"
            >
              Start Conversation
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Chat;
