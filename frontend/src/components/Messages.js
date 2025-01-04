import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Send, MessageSquare, Search, User, Loader2 } from 'lucide-react';
import io from 'socket.io-client';
import axios from 'axios';

export default function Messages() {
    const [conversations, setConversations] = useState([]);
    const [selectedProspect, setSelectedProspect] = useState(null);
    const [messages, setMessages] = useState([]);
    const [message, setMessage] = useState('');
    const [showTemplates, setShowTemplates] = useState(false);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [initialLoading, setInitialLoading] = useState(true);
    const messagesEndRef = useRef(null);

    const messageTemplates = [
        {
            id: 1,
            title: "Invitation",
            content: `Bonjour {{firstName}}, Je vois que nous évoluons dans le même secteur. Je souhaiterais échanger avec vous sur nos expériences respectives. Cordialement`
        },
        {
            id: 2,
            title: "Suivi",
            content: `Bonjour {{firstName}}, Merci d'avoir accepté ma connexion ! Je souhaiterais échanger avec vous sur vos enjeux chez {{company}}.`
        },
        {
            id: 3,
            title: "Proposition",
            content: `Bonjour {{firstName}}, Notre solution pourrait vous intéresser pour {{company}}. Seriez-vous disponible pour un échange rapide ?`
        }
    ];

    // Fetch LinkedIn conversations
    const fetchConversations = async () => {
        try {
            const response = await axios.get('http://localhost:5001/api/linkedin/conversations', {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });

            if (response.data.success) {
                setConversations(response.data.conversations);
            }
        } catch (error) {
            console.error('Error fetching conversations:', error);
        } finally {
            setInitialLoading(false);
        }
    };

    useEffect(() => {
        fetchConversations();
    }, []);

    const scrollToBottom = useCallback(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, []);

    useEffect(() => {
        const socket = io('http://localhost:5001', {
            auth: { token: localStorage.getItem('token') },
            reconnection: true,
            reconnectionAttempts: 5
        });

        socket.on('messages', (newMessages) => {
            setMessages(newMessages);
            scrollToBottom();
        });

        socket.on('newMessage', (newMessage) => {
            setMessages(prev => [...prev, newMessage]);
            scrollToBottom();
        });

        return () => socket.disconnect();
    }, [scrollToBottom]);

    const fetchMessages = async (prospectId) => {
        try {
            setLoading(true);
            const response = await axios.get(
                `http://localhost:5001/api/linkedin/conversations/${prospectId}`,
                {
                    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                }
            );

            if (response.data.success) {
                setMessages(response.data.messages);
                scrollToBottom();
            }
        } catch (error) {
            console.error('Error fetching messages:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (selectedProspect) {
            fetchMessages(selectedProspect._id);
        }
    }, [selectedProspect]);

    const handleSendMessage = async (e) => {
        if (e) e.preventDefault();
        if (!message.trim() || !selectedProspect) return;

        try {
            const response = await axios.post(
                'http://localhost:5001/api/linkedin/send-message',
                {
                    prospectId: selectedProspect._id,
                    content: message
                },
                {
                    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                }
            );

            if (response.data.success) {
                setMessages(prev => [...prev, response.data.message]);
                setMessage('');
                scrollToBottom();
            }
        } catch (error) {
            console.error('Error sending message:', error);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    const applyTemplate = (template) => {
        let content = template.content;
        content = content.replace('{{firstName}}', selectedProspect?.prenom || '');
        content = content.replace('{{company}}', selectedProspect?.societe || '');
        setMessage(content);
        setShowTemplates(false);
    };

    const filteredConversations = conversations.filter(conversation =>
        `${conversation.prospect.prenom} ${conversation.prospect.nom} ${conversation.prospect.societe}`
            .toLowerCase()
            .includes(searchTerm.toLowerCase())
    );

    if (initialLoading) {
        return (
            <div className="flex items-center justify-center h-screen dark:bg-gray-900">
                <div className="text-center">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-500 mx-auto" />
                    <p className="mt-2 text-gray-600 dark:text-gray-400">Chargement des conversations...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
            {/* Left sidebar - Conversations list */}
            <div className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
                <div className="p-4">
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Rechercher..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white dark:placeholder-gray-400"
                        />
                        <Search className="absolute right-3 top-2.5 text-gray-400" size={20} />
                    </div>
                </div>

                <div className="overflow-y-auto h-[calc(100vh-88px)]">
                    {filteredConversations.map((conversation) => (
                        <div
                            key={conversation._id}
                            onClick={() => setSelectedProspect(conversation.prospect)}
                            className={`flex items-center px-4 py-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 ${
                                selectedProspect?._id === conversation.prospect._id ? 'bg-blue-50 dark:bg-gray-700' : ''
                            }`}
                        >
                            <div className="w-10 h-10 bg-gray-200 dark:bg-gray-600 rounded-full flex items-center justify-center">
                                <User className="text-gray-500 dark:text-gray-400" size={20} />
                            </div>
                            <div className="ml-3">
                                <p className="font-medium text-gray-900 dark:text-white">
                                    {`${conversation.prospect.prenom} ${conversation.prospect.nom}`}
                                </p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    {conversation.prospect.societe}
                                </p>
                                {conversation.unreadCount > 0 && (
                                    <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-blue-500 rounded-full ml-2">
                    {conversation.unreadCount}
                  </span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Main content - Messages */}
            <div className="flex-1 flex flex-col">
                {selectedProspect ? (
                    <>
                        {/* Header */}
                        <div className="px-6 py-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                            <div className="flex items-center">
                                <div className="w-10 h-10 bg-gray-200 dark:bg-gray-600 rounded-full flex items-center justify-center">
                                    <User className="text-gray-500 dark:text-gray-400" size={20} />
                                </div>
                                <div className="ml-3">
                                    <h2 className="text-lg font-medium text-gray-900 dark:text-white">
                                        {`${selectedProspect.prenom} ${selectedProspect.nom}`}
                                    </h2>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                        {selectedProspect.societe}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto px-6 py-4 bg-white dark:bg-gray-800">
                            {loading ? (
                                <div className="flex items-center justify-center h-full">
                                    <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
                                </div>
                            ) : (
                                messages.map((msg) => (
                                    <div
                                        key={msg._id}
                                        className={`flex mb-4 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                                    >
                                        <div
                                            className={`max-w-md px-4 py-2 rounded-lg ${
                                                msg.sender === 'user'
                                                    ? 'bg-blue-500 text-white'
                                                    : 'bg-gray-100 dark:bg-gray-700 dark:text-white'
                                            }`}
                                        >
                                            <p>{msg.content}</p>
                                            <p className="text-xs mt-1 opacity-75">
                                                {new Date(msg.timestamp || msg.createdAt).toLocaleTimeString()}
                                            </p>
                                        </div>
                                    </div>
                                ))
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Message input */}
                        <div className="px-6 py-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
                            <div className="relative">
                                <div className="flex space-x-2 mb-2">
                                    <button
                                        onClick={() => setShowTemplates(!showTemplates)}
                                        className="px-4 py-2 text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-gray-700 rounded"
                                    >
                                        Templates
                                    </button>

                                    {showTemplates && (
                                        <div className="absolute bottom-full left-0 mb-2 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
                                            {messageTemplates.map(template => (
                                                <button
                                                    key={template.id}
                                                    onClick={() => applyTemplate(template)}
                                                    className="block w-full text-left px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 dark:text-white"
                                                >
                                                    {template.title}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div className="flex items-center space-x-2">
                  <textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Écrivez votre message..."
                      className="flex-1 px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white dark:placeholder-gray-400"
                      rows="3"
                  />
                                    <button
                                        onClick={handleSendMessage}
                                        disabled={!message.trim()}
                                        className="p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <Send size={20} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-gray-800">
                        <div className="text-center">
                            <MessageSquare size={48} className="mx-auto text-gray-400 dark:text-gray-600 mb-4" />
                            <p className="text-gray-500 dark:text-gray-400">
                                Sélectionnez une conversation pour commencer
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}