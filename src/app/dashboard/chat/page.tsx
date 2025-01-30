'use client';

import { useEffect, useRef, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Send, Clock, Reply, Edit, Info, FileText } from 'lucide-react';
import ReportDialog from '@/components/ReportDialog';
import ReportNotification from '@/components/ReportNotification';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow } from 'date-fns';
import { useToast } from "@/components/ui/use-toast";

interface Message {
  id: string;
  content: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
  isReport: boolean;
  approved: boolean | null;
  replyToId?: string;
  replyTo?: {
    id: string;
    content: string;
    user: {
      id: string;
      firstName: string;
      lastName: string;
    };
  };
  user: {
    id: string;
    firstName: string;
    lastName: string;
    role: string;
    imageUrl?: string;
    supervisorId?: string;
  };
  tasks?: {
    id: string;
    title: string;
    status: string;
  }[];
}

interface ContextMenu {
  x: number;
  y: number;
  messageId: string;
  isVisible: boolean;
}

interface Task {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  status: 'PENDING' | 'COMPLETED';
  userId: string;
}

export default function ChatPage() {
  const { data: session, status } = useSession();
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isReportDialogOpen, setIsReportDialogOpen] = useState(false);
  const [pendingReports, setPendingReports] = useState<Message[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedTasks, setSelectedTasks] = useState<string[]>([]);
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
    if (session?.user?.role === 'SUPERVISOR') {
      // Filter pending reports for supervisor's students
      const supervisorPendingReports = messages.filter(
        (msg) => msg.isReport && msg.approved === null && 
        msg.user.supervisorId === session.user.id
      );
      setPendingReports(supervisorPendingReports);
    }
  }, [messages, session?.user]);

  useEffect(() => {
    if (isReportDialogOpen && session?.user?.id) {
      fetchTasks();
    }
  }, [isReportDialogOpen, session?.user?.id]);

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

  const fetchTasks = async () => {
    try {
      const response = await fetch('/api/tasks', {
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch tasks');
      }

      const data = await response.json();
      setTasks(data);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    }
  };

  const handleTaskSelect = (taskId: string) => {
    setSelectedTasks(prev => {
      const isSelected = prev.includes(taskId);
      if (isSelected) {
        return prev.filter(id => id !== taskId);
      } else {
        return [...prev, taskId];
      }
    });
  };

  const handleSubmitReport = async (content: string) => {
    try {
      const response = await fetch('/api/chat/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content,
          isReport: true,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send report');
      }

      await fetchMessages();
    } catch (error) {
      console.error('Error sending report:', error);
      throw error;
    }
  };

  const handleApproveReport = async (reportId: string) => {
    try {
      const response = await fetch(`/api/chat/messages/${reportId}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(errorData || 'Failed to approve report');
      }

      const updatedMessage = await response.json();

      // Update the message in the UI
      setMessages(messages.map(msg => 
        msg.id === reportId ? { ...msg, ...updatedMessage } : msg
      ));

      toast({
        title: "Report Approved",
        description: "The report has been approved successfully.",
        variant: "default",
      });
    } catch (error) {
      console.error('Error approving report:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to approve report. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleRejectReport = async (reportId: string) => {
    try {
      const response = await fetch(`/api/chat/messages/${reportId}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(errorData || 'Failed to reject report');
      }

      const updatedMessage = await response.json();

      // Update the message in the UI
      setMessages(messages.map(msg => 
        msg.id === reportId ? { ...msg, ...updatedMessage } : msg
      ));

      toast({
        title: "Report Rejected",
        description: "The report has been rejected.",
        variant: "default",
      });
    } catch (error) {
      console.error('Error rejecting report:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to reject report. Please try again.",
        variant: "destructive",
      });
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
            {/* Show report button for students and supervisors */}
            {(session?.user?.role === 'STUDENT' || session?.user?.role === 'SUPERVISOR') && (
              <Button
                variant="outline"
                size="sm"
                className="mb-2"
                onClick={() => setIsReportDialogOpen(true)}
              >
                <FileText className="w-4 h-4 mr-2" />
                Submit Report
              </Button>
            )}
          </div>
        </div>

        {/* Pending Reports for Supervisors */}
        {session?.user?.role === 'SUPERVISOR' && pendingReports.length > 0 && (
          <div className="bg-orange-50 border-b border-orange-100 p-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-medium text-orange-800">
                Pending Reports ({pendingReports.length})
              </h2>
            </div>
            <div className="space-y-2">
              {pendingReports.map((report) => (
                <div
                  key={report.id}
                  className="bg-white rounded-lg border border-orange-200 p-3 shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-900">
                          {report.user.firstName} {report.user.lastName}
                        </span>
                        <span className="text-xs text-gray-500">
                          {formatDistanceToNow(new Date(report.createdAt), { addSuffix: true })}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">{report.content}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleRejectReport(report.id)}
                      >
                        Reject
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleApproveReport(report.id)}
                      >
                        Approve
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

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
        <div className="flex-1 overflow-y-auto p-4 space-y-4" ref={messagesEndRef}>
          {messages.length === 0 && !error ? (
            <div className="flex flex-col items-center justify-center h-full text-center text-gray-500 space-y-4">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
                </svg>
              </div>
              <div>
                <p className="text-lg font-medium">No messages yet</p>
                <p className="text-sm">Be the first to start the conversation!</p>
              </div>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.userId === session?.user?.id ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex max-w-[80%] ${message.userId === session?.user?.id ? 'flex-row-reverse' : 'flex-row'} items-start gap-2 group`}>
                  {/* User Avatar */}
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 flex-shrink-0 flex items-center justify-center">
                    <span className="text-sm font-medium text-white">
                      {message.user.firstName[0]}
                    </span>
                  </div>

                  {/* Message Content */}
                  <div className={`flex flex-col ${message.userId === session?.user?.id ? 'items-end' : 'items-start'}`}>
                    {/* User Name and Time */}
                    <div className={`flex items-center gap-2 mb-1 ${message.userId === session?.user?.id ? 'flex-row-reverse' : 'flex-row'}`}>
                      <span className="text-sm font-medium text-gray-900">
                        {message.user.firstName} {message.user.lastName}
                      </span>
                      <span className="text-xs text-gray-500">
                        {formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}
                      </span>
                    </div>

                    {/* Message Bubble */}
                    <div
                      className={`relative group ${
                        message.isReport
                          ? 'bg-white border-2 rounded-lg shadow-sm'
                          : message.userId === session?.user?.id
                          ? 'bg-blue-500 text-white rounded-2xl rounded-tr-sm'
                          : 'bg-gray-100 rounded-2xl rounded-tl-sm'
                      } ${
                        message.isReport && message.approved === true
                          ? 'border-green-500'
                          : message.isReport && message.approved === false
                          ? 'border-red-500'
                          : message.isReport
                          ? 'border-orange-500'
                          : ''
                      } px-4 py-2`}
                    >
                      {/* Report Status Badge */}
                      {message.isReport && (
                        <div className="absolute -top-2 -right-2">
                          {message.approved === true ? (
                            <span className="inline-flex items-center rounded-full bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
                              Approved
                            </span>
                          ) : message.approved === false ? (
                            <span className="inline-flex items-center rounded-full bg-red-50 px-2 py-1 text-xs font-medium text-red-700 ring-1 ring-inset ring-red-600/20">
                              Rejected
                            </span>
                          ) : (
                            <span className="inline-flex items-center rounded-full bg-orange-50 px-2 py-1 text-xs font-medium text-orange-700 ring-1 ring-inset ring-orange-600/20">
                              Pending
                            </span>
                          )}
                        </div>
                      )}

                      {/* Reply Reference */}
                      {message.replyTo && (
                        <div className="mb-1 text-sm">
                          <div className={`flex items-center gap-1 ${
                            message.userId === session?.user?.id ? 'text-blue-100' : 'text-gray-500'
                          }`}>
                            <Reply className="w-3 h-3" />
                            <span>Replying to {message.replyTo.user.firstName}</span>
                          </div>
                          <div className={`mt-1 pl-3 border-l-2 ${
                            message.userId === session?.user?.id ? 'border-blue-400 text-blue-100' : 'border-gray-300 text-gray-500'
                          }`}>
                            {message.replyTo.content.length > 50
                              ? message.replyTo.content.substring(0, 50) + '...'
                              : message.replyTo.content}
                          </div>
                        </div>
                      )}

                      {/* Message Text */}
                      <div className={message.isReport ? 'text-gray-900' : ''}>
                        {message.content}
                      </div>
                    </div>
                  </div>

                  {/* Message Actions */}
                  <div className={`opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 ${
                    message.userId === session?.user?.id ? 'mr-2' : 'ml-2'
                  }`}>
                    {/* Show approve/reject buttons for supervisors on pending reports */}
                    {session?.user?.role === 'SUPERVISOR' && message.isReport && message.approved === null && (
                      <>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleApproveReport(message.id);
                          }}
                          className="inline-flex items-center px-2 py-1 text-xs font-medium text-white bg-green-500 rounded hover:bg-green-600"
                        >
                          Approve
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRejectReport(message.id);
                          }}
                          className="inline-flex items-center px-2 py-1 text-xs font-medium text-white bg-red-500 rounded hover:bg-red-600"
                        >
                          Reject
                        </button>
                      </>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleReply(message);
                      }}
                      className="p-1 hover:bg-gray-100 rounded-full"
                    >
                      <Reply className="w-4 h-4 text-gray-500" />
                    </button>
                    {message.userId === session?.user?.id && !message.isReport && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEdit(message);
                        }}
                        className="p-1 hover:bg-gray-100 rounded-full"
                      >
                        <Edit className="w-4 h-4 text-gray-500" />
                      </button>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleInfo(message);
                      }}
                      className="p-1 hover:bg-gray-100 rounded-full"
                    >
                      <Info className="w-4 h-4 text-gray-500" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
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
            {session?.user?.role === 'SUPERVISOR' && messages.find(m => m.id === contextMenu.messageId)?.isReport && (
              <button
                onClick={() => handleApproveReport(messages.find(m => m.id === contextMenu.messageId)!.id)}
                className="w-full px-4 py-2 text-sm text-left hover:bg-gray-50 flex items-center gap-2"
              >
                <FileText className="w-4 h-4" />
                Approve Report
              </button>
            )}
            {session?.user?.role === 'SUPERVISOR' && messages.find(m => m.id === contextMenu.messageId)?.isReport && (
              <button
                onClick={() => handleRejectReport(messages.find(m => m.id === contextMenu.messageId)!.id)}
                className="w-full px-4 py-2 text-sm text-left hover:bg-gray-50 flex items-center gap-2"
              >
                <FileText className="w-4 h-4" />
                Reject Report
              </button>
            )}
          </div>
        )}

        {/* Input */}
        <div className="border-t p-4 bg-white">
          {(session?.user?.role === 'STUDENT' || session?.user?.role === 'SUPERVISOR') && (
            <Button
              variant="outline"
              size="sm"
              className="mb-2"
              onClick={() => setIsReportDialogOpen(true)}
            >
              <FileText className="w-4 h-4 mr-2" />
              Submit Report
            </Button>
          )}
          <form onSubmit={sendMessage} className="flex gap-2">
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

        {/* Report Dialog */}
        <ReportDialog
          isOpen={isReportDialogOpen}
          onClose={() => setIsReportDialogOpen(false)}
          onSubmit={handleSubmitReport}
        />

        {/* Report Notifications for Supervisors */}
        {pendingReports.map((report) => (
          <ReportNotification
            key={report.id}
            report={report}
            onApprove={handleApproveReport}
            onReject={handleRejectReport}
          />
        ))}
      </div>

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
                        <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center">
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
                                  : view.user.role === 'SUPERVISOR'
                                    ? 'bg-orange-100 text-orange-700'
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
