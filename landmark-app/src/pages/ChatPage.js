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

    useEffect(() => {
        fetchRooms();
    }, []);

    const fetchRooms = async () => {
        try {
            const response = await apiClient.get('/api/chat/rooms');
            setChatHistory(response.data);
            setRooms(response.data);
        } catch (error) {
            console.error('채팅방 목록 불러오기 실패:', error);
        }
    };

    const handleCreateRoom = async () => {
        if (!newRoomTitle) return;
        try {
            await apiClient.post('/api/chat/rooms', { title: newRoomTitle });
            setNewRoomTitle('');
            fetchRooms();
        } catch (error) {
            console.error('채팅방 생성 실패:', error);
            alert('채팅방 생성에 실패했습니다.');
        }
    };

    const handleEnterRoom = (room) => {
        setCurrentRoom(room);
        setMessages([]);
        connectStomp(room.id);
    };

    const handleLeaveRoom = () => {
        if (stompClient.current) {
            stompClient.current.disconnect();
        }
        setCurrentRoom(null);
        fetchRooms();
    };

    const connectStomp = (roomId) => {
        const token = localStorage.getItem('token'); // 로컬 스토리지에서 토큰 가져오기

        // 백엔드 포트 및 엔드포인트 확인 필요 (8090/ws-chat)
        const socket = new SockJS('http://localhost:8090/ws-chat');
        stompClient.current = Stomp.over(socket);

        const connectHeaders = {};
            if (token) {
                connectHeaders['Authorization'] = `Bearer ${token}`; // 토큰이 있으면 헤더에 추가
            }

        stompClient.current.connect(connectHeaders, () => {
            stompClient.current.subscribe(`/sub/chat/room/${roomId}`, (message) => {
                const receivedMessage = JSON.parse(message.body);
                setMessages((prev) => [...prev, receivedMessage]);
            });
        }, (error) => {
            console.error('STOMP Connection Error:', error);
        });
    };

    const handleSendMessage = () => {
        if (!newMessage || !stompClient.current || !currentRoom) return;

        const message = {
            roomId: currentRoom.id,
            content: newMessage,
            sender: localStorage.getItem('username') || 'Anonymous',
            type: 'TALK'
        };

        stompClient.current.send("/pub/chat/message", {}, JSON.stringify(message));
        setNewMessage('');
    };

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    return (
        <div style={styles.layout}>
            <Header /> {/* 🔵 공통 헤더 추가 */}

            <div style={styles.container}>
                {!currentRoom ? (
                    /* 🟢 채팅방 목록 화면 */
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
                    /* 🟡 실제 채팅 화면 */
                    <div style={styles.chatWrapper}>
                        <div style={styles.chatHeader}>
                            <h3 style={styles.chatTitle}>{currentRoom.title}</h3>
                            <button onClick={handleLeaveRoom} style={styles.leaveButton}>나가기</button>
                        </div>

                        <div style={styles.chatWindow}>
                            {messages.map((msg, index) => (
                                <div key={index} style={msg.sender === localStorage.getItem('username') ? styles.myMsgRow : styles.otherMsgRow}>
                                    <div style={styles.author}>{msg.sender}</div>
                                    <div style={msg.sender === localStorage.getItem('username') ? styles.myBubble : styles.otherBubble}>
                                        {msg.content}
                                    </div>
                                </div>
                            ))}
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

    // 목록 상단
    listHeader: { padding: '20px', borderBottom: '1px solid #eee' },
    title: { margin: '0 0 15px 0', fontSize: '20px', color: '#333' },
    createRoomArea: { display: 'flex', gap: '10px' },
    input: { flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid #ddd', outline: 'none' },
    button: { padding: '10px 20px', backgroundColor: '#4285F4', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' },

    // 목록 스크롤
    scrollArea: { flex: 1, overflowY: 'auto', padding: '20px' },
    roomGrid: { display: 'flex', flexDirection: 'column', gap: '12px' },
    roomCard: { padding: '18px', border: '1px solid #f0f0f0', borderRadius: '12px', cursor: 'pointer', backgroundColor: '#fff', boxShadow: '0 2px 5px rgba(0,0,0,0.02)', transition: 'all 0.2s' },
    roomTitle: { fontWeight: 'bold', fontSize: '16px', color: '#2c3e50', marginBottom: '5px' },
    roomMeta: { fontSize: '13px', color: '#94a3b8' },
    emptyText: { textAlign: 'center', color: '#94a3b8', marginTop: '40px' },

    // 채팅창 화면
    chatWrapper: { flex: 1, display: 'flex', flexDirection: 'column', height: '100%' },
    chatHeader: { padding: '15px 20px', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff' },
    chatTitle: { margin: 0, fontSize: '18px' },
    leaveButton: { padding: '6px 12px', backgroundColor: '#fff', color: '#ff4d4f', border: '1px solid #ff4d4f', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' },

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