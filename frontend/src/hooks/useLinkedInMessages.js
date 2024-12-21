import { useEffect, useState } from 'react';
import io from 'socket.io-client';
import axios from 'axios';

const useLinkedInMessages = (selectedProspect) => {
    const [messages, setMessages] = useState([]);
    const [socket, setSocket] = useState(null);

    useEffect(() => {
        const socket = io('http://localhost:5001', {
            auth: {
                token: localStorage.getItem('token')
            }
        });

        socket.on('newMessage', (message) => {
            setMessages(prev => [...prev, message]);
        });

        socket.on('messageSent', (message) => {
            setMessages(prev => prev.map(m =>
                m._id === message._id ? message : m
            ));
        });

        setSocket(socket);

        return () => socket.disconnect();
    }, []);

    useEffect(() => {
        if (selectedProspect) {
            fetchMessages(selectedProspect._id);
        }
    }, [selectedProspect]);

    const fetchMessages = async (prospectId) => {
        try {
            const response = await axios.get(
                `/api/linkedin-messages/conversations/${prospectId}`,
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('token')}`
                    }
                }
            );
            setMessages(response.data.messages);
        } catch (error) {
            console.error('Error fetching messages:', error);
        }
    };

    const sendMessage = async (content, type = 'message') => {
        try {
            await axios.post(
                '/api/linkedin-messages/send',
                {
                    prospectId: selectedProspect._id,
                    content,
                    type
                },
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('token')}`
                    }
                }
            );
        } catch (error) {
            console.error('Error sending message:', error);
            throw error;
        }
    };

    return { messages, sendMessage };
};

export default useLinkedInMessages;