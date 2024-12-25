'use client';

import { useEffect, useRef, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Send, Clock, Reply, Edit, Info } from 'lucide-react';

interface Message {
  id: string;
  content: string;
  userId: string;
  isReport?: boolean;
  replyToId?: string | null;
  replyTo?: Message | null;
  user: {
    firstName: string;
    lastName: string;
    role: string;
    imageUrl: string | null;
  };
  createdAt: string;
}

interface ContextMenu {
  x: number;
  y: number;
  messageId: string;
  isVisible: boolean;
}

export default function ChatPage() {
  const { data: session, status } = useSession();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportContent, setReportContent] = useState('');
  const [contextMenu, setContextMenu] = useState<ContextMenu>({ x: 0, y: 0, messageId: '', isVisible: false });
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [editingMessage, setEditingMessage] = useState<Message | null>(null);
  const [messageViews, setMessageViews] = useState<Record<string, any[]>>({});
  const [infoModalMessage, setInfoModalMessage] = useState<Message | null>(null);
  const [showPointsNotification, setShowPointsNotification] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Close context menu on any click outside
    const handleClick = () => setContextMenu(prev => ({ ...prev, isVisible: false }));
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  const handleContextMenu = (e: React.MouseEvent, message: Message) => {
    e.preventDefault();
    setContextMenu({
      x: e.pageX,
      y: e.pageY,
      messageId: message.id,
      isVisible: true,
    });
  };

  const handleReply = (message: Message) => {
    setReplyingTo(message);
    setContextMenu(prev => ({ ...prev, isVisible: false }));
  };

  const handleEdit = (message: Message) => {
    if (message.userId === session?.user?.id) {
      setEditingMessage(message);
      setNewMessage(message.content);
      setContextMenu(prev => ({ ...prev, isVisible: false }));
    }
  };

  const handleInfo = async (message: Message) => {
    try {
      // Record view
      await fetch(`/api/chat/messages/${message.id}/views`, {
        method: 'POST',
      });

      // Get views
      const response = await fetch(`/api/chat/messages/${message.id}/views`);
      const views = await response.json();

      if (!response.ok) {
        throw new Error('Failed to fetch message views');
      }

      setMessageViews(prev => ({
        ...prev,
        [message.id]: views
      }));

      // Show info modal
      setInfoModalMessage(message);
      setContextMenu(prev => ({ ...prev, isVisible: false }));
    } catch (error) {
      console.error('Error fetching message views:', error);
    }
  };

  const cancelReply = () => {
    setReplyingTo(null);
  };

  const cancelEdit = () => {
    setEditingMessage(null);
    setNewMessage('');
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (status === 'authenticated') {
      fetchMessages();
      const interval = setInterval(fetchMessages, 3000);
      return () => clearInterval(interval);
    }
  }, [status]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchMessages = async () => {
    try {
      const response = await fetch('/api/chat/messages');
      if (!response.ok) {
        throw new Error('Failed to fetch messages');
      }
      const data = await response.json();
      
      if (Array.isArray(data)) {
        setMessages(data);
        setError(null);
      } else {
        console.error('Invalid messages format:', data);
        setError('Invalid data format received');
        setMessages([]);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch messages');
      setMessages([]);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !session?.user) return;

    try {
      if (editingMessage) {
        // Handle edit
        const response = await fetch('/api/chat/messages', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messageId: editingMessage.id,
            content: newMessage,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to edit message');
        }

        setMessages(messages.map(msg => 
          msg.id === editingMessage.id ? data : msg
        ));
        setNewMessage('');
        setEditingMessage(null);
        setError(null);
      } else {
        // Handle new message or reply
        const response = await fetch('/api/chat/messages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content: newMessage,
            replyToId: replyingTo?.id,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to send message');
        }

        setNewMessage('');
        setReplyingTo(null);
        await fetchMessages();
        setError(null);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setError(error instanceof Error ? error.message : 'Failed to send message');
      return;
    }
  };

  const sendReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportContent.trim() || !session?.user) return;

    try {
      const response = await fetch('/api/chat/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          content: reportContent,
          isReport: true
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send report');
      }

      setReportContent('');
      setIsReportModalOpen(false);
      await fetchMessages();
      setError(null);
      
      // Show points notification
      if (session.user.role === 'STUDENT') {
        setShowPointsNotification(true);
        setTimeout(() => setShowPointsNotification(false), 3000);
      }
    } catch (error) {
      console.error('Error sending report:', error);
      setError(error instanceof Error ? error.message : 'Failed to send report');
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="p-8 bg-white rounded-lg shadow-lg">
          <div className="flex items-center space-x-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <p className="text-gray-600">Loading messages...</p>
          </div>
        </div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="p-8 bg-white rounded-lg shadow-lg text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </div>
          <h1 className="text-2xl font-semibold text-gray-800 mb-2">Access Denied</h1>
          <p className="text-gray-600">Please sign in to access the chat.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-4 h-[calc(100vh-5rem)]">
      <div className="bg-white rounded-xl shadow-lg h-full flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b bg-white shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold text-gray-800">IMT Chat Room</h1>
              <p className="text-sm text-gray-500 mt-0.5">Connect with students and admins</p>
            </div>
            {session?.user?.role === 'STUDENT' && (
              <button
                onClick={() => setIsReportModalOpen(true)}
                className="bg-blue-500 text-white rounded-full px-4 py-1.5 text-sm hover:bg-blue-600 transition-colors flex items-center gap-1.5"
              >
                <Clock className="w-4 h-4" />
                Report Progress
              </button>
            )}
          </div>
        </div>

        {error && (
          <div className="p-4 mx-4 mt-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2 text-red-700">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              <p className="text-sm font-medium">{error}</p>
            </div>
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6 bg-gray-50">
          {messages.length === 0 && !error ? (
            <div className="flex flex-col items-center justify-center h-full text-center text-gray-500 space-y-4">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
                </svg>
              </div>
              <div>
                <p className="font-medium">No messages yet</p>
                <p className="text-sm">Start the conversation!</p>
              </div>
            </div>
          ) : (
            messages.map((message) => {
              const isCurrentUser = message.userId === session?.user?.id;
              return (
                <div
                  key={message.id}
                  className={`flex items-start gap-2 ${isCurrentUser ? 'flex-row-reverse' : ''}`}
                  onContextMenu={(e) => handleContextMenu(e, message)}
                >
                  <div className={`flex flex-col ${isCurrentUser ? 'items-end' : 'items-start'} max-w-[45%]`}>
                    <div className="flex items-center gap-2 mb-0.5">
                      <div className="w-6 h-6 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center flex-shrink-0 overflow-hidden border-2 border-white shadow-sm">
                        {message.user.imageUrl ? (
                          <img
                            src={message.user.imageUrl}
                            alt={`${message.user.firstName} ${message.user.lastName}`}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-xs font-medium text-white">
                            {message.user.firstName[0]}
                          </span>
                        )}
                      </div>
                      <div className={`flex items-center gap-1.5 ${isCurrentUser ? 'flex-row-reverse' : ''}`}>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 font-medium">
                          {message.user.firstName} {message.user.lastName}
                        </span>
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                            message.user.role === 'ADMIN'
                              ? 'bg-purple-100 text-purple-700'
                              : 'bg-emerald-100 text-emerald-700'
                          }`}
                        >
                          {message.user.role.toLowerCase()}
                        </span>
                        {message.isReport && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700">
                            progress report
                          </span>
                        )}
                      </div>
                    </div>
                    {message.replyTo && (
                      <div className={`flex items-center gap-1 text-xs text-gray-500 mb-1 ${isCurrentUser ? 'self-end' : 'self-start'}`}>
                        <Reply className="w-3 h-3" />
                        <span>Replying to {message.replyTo.user.firstName}</span>
                      </div>
                    )}
                    <div
                      className={`rounded-xl px-2.5 py-1.5 ${
                        message.isReport
                          ? 'bg-emerald-500 text-white rounded-tr-none'
                          : isCurrentUser
                            ? 'bg-blue-500 text-white rounded-tr-none'
                            : 'bg-white shadow-sm border border-gray-100 rounded-tl-none'
                      }`}
                    >
                      <p className="text-xs leading-relaxed">{message.content}</p>
                      <span className={`text-[10px] mt-0.5 block ${message.isReport ? 'text-white/70' : isCurrentUser ? 'text-white/70' : 'text-gray-400'}`}>
                        {new Date(message.createdAt).toLocaleTimeString([], { 
                          hour: '2-digit', 
                          minute: '2-digit',
                          hour12: true 
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Context Menu */}
        {contextMenu.isVisible && (
          <div
            className="fixed bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-50"
            style={{ top: contextMenu.y, left: contextMenu.x }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => handleReply(messages.find(m => m.id === contextMenu.messageId)!)}
              className="w-full px-4 py-2 text-sm text-left hover:bg-gray-50 flex items-center gap-2"
            >
              <Reply className="w-4 h-4" />
              Reply
            </button>
            {messages.find(m => m.id === contextMenu.messageId)?.userId === session?.user?.id && (
              <button
                onClick={() => handleEdit(messages.find(m => m.id === contextMenu.messageId)!)}
                className="w-full px-4 py-2 text-sm text-left hover:bg-gray-50 flex items-center gap-2"
              >
                <Edit className="w-4 h-4" />
                Edit
              </button>
            )}
            <button
              onClick={() => handleInfo(messages.find(m => m.id === contextMenu.messageId)!)}
              className="w-full px-4 py-2 text-sm text-left hover:bg-gray-50 flex items-center gap-2"
            >
              <Info className="w-4 h-4" />
              Info
            </button>
          </div>
        )}

        {/* Input */}
        <div className="p-4 bg-white border-t">
          {replyingTo && (
            <div className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded-lg mb-2">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Reply className="w-4 h-4" />
                <span>Replying to {replyingTo.user.firstName}</span>
              </div>
              <button
                onClick={cancelReply}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>
            </div>
          )}
          {editingMessage && (
            <div className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded-lg mb-2">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Edit className="w-4 h-4" />
                <span>Editing message</span>
              </div>
              <button
                onClick={cancelEdit}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>
            </div>
          )}
          <form onSubmit={sendMessage} className="flex gap-3">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder={editingMessage ? "Edit your message..." : "Type your message..."}
              className="flex-1 rounded-xl border border-gray-200 px-4 py-2.5 text-[15px] focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
            />
            <button
              type="submit"
              disabled={!newMessage.trim()}
              className="bg-blue-500 text-white rounded-xl px-6 py-2.5 hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2 font-medium"
            >
              <Send className="w-4 h-4" />
              <span>{editingMessage ? 'Save' : 'Send'}</span>
            </button>
          </form>
        </div>
      </div>

      {/* Report Modal */}
      {isReportModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-800">Daily Progress Report</h2>
              <button
                onClick={() => setIsReportModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>
            </div>
            <form onSubmit={sendReport}>
              <textarea
                value={reportContent}
                onChange={(e) => setReportContent(e.target.value)}
                placeholder="Share your progress for today. What did you accomplish? What are you working on?"
                className="w-full h-32 rounded-lg border border-gray-200 p-3 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all resize-none mb-4"
              />
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsReportModalOpen(false)}
                  className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!reportContent.trim()}
                  className="bg-blue-500 text-white rounded-lg px-4 py-2 text-sm hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                >
                  <Clock className="w-4 h-4" />
                  Submit Report
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Points Notification */}
      {showPointsNotification && (
        <div className="fixed bottom-4 right-4 bg-emerald-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 animate-slide-up">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v13m0-13V6a4 4 0 00-4-4H5.52a2.5 2.5 0 01-2.5-2.5v0a2.5 2.5 0 012.5-2.5H12"></path>
          </svg>
          <span className="font-medium">+1 point awarded for your report!</span>
        </div>
      )}

      {/* Info Modal */}
      {infoModalMessage && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-800">Message Info</h2>
              <button
                onClick={() => setInfoModalMessage(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <h3 className="font-medium text-gray-700">Message Details</h3>
                <p className="text-sm text-gray-500 mt-1">
                  Sent by {infoModalMessage.user.firstName} {infoModalMessage.user.lastName} at{' '}
                  {new Date(infoModalMessage.createdAt).toLocaleString()}
                </p>
              </div>
              <div>
                <h3 className="font-medium text-gray-700 mb-3">Views ({messageViews[infoModalMessage.id]?.length || 0})</h3>
                <div className="space-y-3">
                  {messageViews[infoModalMessage.id]?.map((view: any) => (
                    <div key={view.id} className="flex items-center justify-between bg-gray-50 p-2 rounded-lg">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center flex-shrink-0">
                          <span className="text-sm font-medium text-white">
                            {view.user.firstName[0]}
                          </span>
                        </div>
                        <div className="flex flex-col">
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 font-medium">
                              {view.user.firstName} {view.user.lastName}
                            </span>
                            <span
                              className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                                view.user.role === 'ADMIN'
                                  ? 'bg-purple-100 text-purple-700'
                                  : 'bg-emerald-100 text-emerald-700'
                              }`}
                            >
                              {view.user.role.toLowerCase()}
                            </span>
                          </div>
                          <span className="text-xs text-gray-500 mt-0.5">
                            {new Date(view.viewedAt).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                  {messageViews[infoModalMessage.id]?.length === 0 && (
                    <div className="text-center py-4 text-gray-500">
                      <p className="text-sm">No views yet</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes slide-up {
          0% {
            transform: translateY(100%);
            opacity: 0;
          }
          100% {
            transform: translateY(0);
            opacity: 1;
          }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
