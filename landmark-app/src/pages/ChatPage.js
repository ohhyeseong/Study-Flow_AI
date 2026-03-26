import React, { useState, useEffect, useRef } from 'react';
import apiClient from '../api';
import SockJS from 'sockjs-client';
import { Stomp } from '@stomp/stompjs';
import Header from '../components/Header';

const ChatPage = () => {
    const [rooms, setRooms] = useState([]);
    const [currentRoom, setCurrentRoom] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [newRoomTitle, setNewRoomTitle] = useState('');

    const stompClient = useRef(null);
    const messagesEndRef = useRef(null);

    const myUsername = localStorage.getItem('username');

    useEffect(() => {
        fetchRooms();
        connectStomp();

        return () => {
            if (stompClient.current) stompClient.current.disconnect();
        };
    }, []);

    const fetchRooms = async () => {
        try {
            const response = await apiClient.get('/api/chat/rooms');
            setRooms(response.data.data || response.data);
        } catch (error) {
            console.error('채팅방 목록 불러오기 실패:', error);
        }
    };

    const handleCreateRoom = async () => {
        if (!newRoomTitle) return;
        try {
            await apiClient.post('/api/chat/rooms', { title: newRoomTitle });
            setNewRoomTitle('');
        } catch (error) {
            console.error('채팅방 생성 실패:', error);
        }
    };

    const handleEnterRoom = async (room) => {
        try {
            await apiClient.post(`/api/chat/rooms/${room.id}/enter`);

            const response = await apiClient.get(`/api/chat/rooms/${room.id}/messages`);
            setMessages(response.data.data || []);

            setCurrentRoom(room);

            if (stompClient.current?.connected) {
                subscribeRoom(room.id);
            }
        } catch (error) {
            console.error('채팅방 입장 실패:', error);
        }
    };

    const handleExitRoom = async () => {
        if (!currentRoom) return;

        if (window.confirm("이 채팅방에서 나가시겠습니까? 참여자 목록에서 제외됩니다.")) {
            try {
                await apiClient.post(`/api/chat/rooms/${currentRoom.id}/exit`);

                setCurrentRoom(null);
                setMessages([]);
            } catch (error) {
                console.error('방 나가기 실패:', error);
                alert('퇴장 처리 중 오류가 발생했습니다.');
            }
        }
    };

    const connectStomp = () => {
        const token = localStorage.getItem('token');
        const socket = new SockJS('http://localhost:8090/ws');
        stompClient.current = Stomp.over(socket);

            stompClient.current.debug = () => {};

            const connectHeaders = token ? { 'Authorization': `Bearer ${token}` } : {};

        stompClient.current.connect(connectHeaders, () => {
            console.log('STOMP Connected');

            stompClient.current.subscribe('/sub/chat/rooms', (message) => {
                const updatedRooms = JSON.parse(message.body);
                setRooms(updatedRooms);
            });
        }, (error) => {
            console.error('STOMP Connection Error:', error);
        });
    };

    const subscribeRoom = (roomId) => {
        stompClient.current.subscribe(`/sub/chat/room/${roomId}`, (message) => {
            const receivedMessage = JSON.parse(message.body);
            setMessages((prev) => [...prev, receivedMessage]);
        });
    };

    const handleSendMessage = () => {
        if (!newMessage || !stompClient.current?.connected || !currentRoom) return;

        const token = localStorage.getItem('token');
        const message = {
            roomId: currentRoom.id,
            content: newMessage,
            type: 'TALK'
        };

        stompClient.current.send(
            "/pub/chat/message",
            { Authorization: `Bearer ${token}` },
            JSON.stringify(message)
        );
        setNewMessage('');
    };

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    return (
        <div style={styles.layout}>
            <Header />

            <div style={styles.container}>
                {!currentRoom ? (
                    <>
                        <div style={styles.listHeader}>
                            <h2 style={styles.title}>💬 채팅방 목록</h2>
                            <div style={styles.createRoomArea}>
                                <input
                                    type="text"
                                    placeholder="새로운 방 제목 입력"
                                    value={newRoomTitle}
                                    onChange={(e) => setNewRoomTitle(e.target.value)}
                                    style={styles.input}
                                />
                                <button onClick={handleCreateRoom} style={styles.button}>방 만들기</button>
                            </div>
                        </div>

                        <div style={styles.scrollArea}>
                            <div style={styles.roomGrid}>
                                {rooms.map(room => (
                                    <div key={room.id} style={styles.roomCard} onClick={() => handleEnterRoom(room)}>
                                        <div style={styles.roomTitle}>{room.title}</div>
                                        <div style={styles.roomMeta}>참여자: {room.userCount || 0}명</div>
                                    </div>
                                ))}
                                {rooms.length === 0 && <p style={styles.emptyText}>참여 가능한 방이 없습니다.</p>}
                            </div>
                        </div>
                    </>
                ) : (
                    <div style={styles.chatWrapper}>
                        <div style={styles.chatHeader}>
                            <h3 style={styles.chatTitle}>{currentRoom.title}</h3>
                            <button onClick={handleExitRoom} style={styles.exitButton}>방 나가기</button>
                        </div>

                        <div style={styles.chatWindow}>
                            {messages.map((msg, index) => {
                                const isMe = msg.senderName === myUsername;
                                return (
                                    <div key={index} style={isMe ? styles.myMsgRow : styles.otherMsgRow}>
                                        {!isMe && <div style={styles.author}>{msg.senderName}</div>}
                                        <div style={isMe ? styles.myBubble : styles.otherBubble}>
                                            {msg.content}
                                        </div>
                                    </div>
                                );
                            })}
                            <div ref={messagesEndRef} />
                        </div>

                        <div style={styles.inputArea}>
                            <input
                                type="text"
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                                style={styles.chatInput}
                                placeholder="메시지를 입력하세요..."
                            />
                            <button onClick={handleSendMessage} style={styles.sendButton}>전송</button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

const styles = {
    layout: { height: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#f5f7fb' },
    container: { flex: 1, display: 'flex', flexDirection: 'column', maxWidth: '850px', margin: '0 auto', width: '100%', backgroundColor: '#fff', overflow: 'hidden' },
    listHeader: { padding: '20px', borderBottom: '1px solid #eee' },
    title: { margin: '0 0 15px 0', fontSize: '20px', color: '#333' },
    createRoomArea: { display: 'flex', gap: '10px' },
    input: { flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid #ddd', outline: 'none' },
    button: { padding: '10px 20px', backgroundColor: '#4285F4', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' },
    scrollArea: { flex: 1, overflowY: 'auto', padding: '20px' },
    roomGrid: { display: 'flex', flexDirection: 'column', gap: '12px' },
    roomCard: { padding: '18px', border: '1px solid #f0f0f0', borderRadius: '12px', cursor: 'pointer', backgroundColor: '#fff', boxShadow: '0 2px 5px rgba(0,0,0,0.02)' },
    roomTitle: { fontWeight: 'bold', fontSize: '16px', color: '#2c3e50', marginBottom: '5px' },
    roomMeta: { fontSize: '13px', color: '#94a3b8' },
    emptyText: { textAlign: 'center', color: '#94a3b8', marginTop: '40px' },
    chatWrapper: { flex: 1, display: 'flex', flexDirection: 'column', height: '100%' },
    chatHeader: { padding: '15px 20px', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff' },
    chatTitle: { margin: 0, fontSize: '18px' },
    exitButton: { padding: '8px 16px', backgroundColor: '#fff', color: '#ff4d4f', border: '1px solid #ff4d4f', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' },
    chatWindow: { flex: 1, padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '15px', backgroundColor: '#f8fafc' },
    myMsgRow: { alignSelf: 'flex-end', display: 'flex', flexDirection: 'column', alignItems: 'flex-end' },
    otherMsgRow: { alignSelf: 'flex-start', display: 'flex', flexDirection: 'column', alignItems: 'flex-start' },
    author: { fontSize: '12px', color: '#64748b', marginBottom: '4px', padding: '0 5px' },
    myBubble: { padding: '10px 16px', borderRadius: '18px 18px 0 18px', backgroundColor: '#4285F4', color: '#fff', maxWidth: '80%', fontSize: '14px', boxShadow: '0 2px 4px rgba(66,133,244,0.2)' },
    otherBubble: { padding: '10px 16px', borderRadius: '18px 18px 18px 0', backgroundColor: '#fff', color: '#333', maxWidth: '80%', fontSize: '14px', border: '1px solid #e2e8f0' },
    inputArea: { padding: '15px 20px', borderTop: '1px solid #eee', display: 'flex', gap: '10px', backgroundColor: '#fff' },
    chatInput: { flex: 1, padding: '12px 15px', borderRadius: '25px', border: '1px solid #e2e8f0', outline: 'none', fontSize: '14px' },
    sendButton: { padding: '10px 20px', backgroundColor: '#4285F4', color: 'white', border: 'none', borderRadius: '25px', cursor: 'pointer', fontWeight: 'bold' }
};

export default ChatPage;