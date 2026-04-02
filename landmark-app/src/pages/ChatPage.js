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
    const subscription = useRef(null);
    const messagesEndRef = useRef(null);
    const myUsername = localStorage.getItem('username');

    useEffect(() => {
        fetchRooms();
        connectStomp();
        return () => {
            if (subscription.current) subscription.current.unsubscribe();
            if (stompClient.current) stompClient.current.disconnect();
        };
    }, []);

    const fetchRooms = async () => {
        try {
            const response = await apiClient.get('/api/chat/rooms');
            setRooms(response.data.data || response.data);
        } catch (error) {
            console.error(error);
        }
    };

    const handleCreateRoom = async () => {
        if (!newRoomTitle.trim()) return;
        try {
            await apiClient.post('/api/chat/rooms', { title: newRoomTitle });
            setNewRoomTitle('');
            fetchRooms(); // 방 생성 후 목록 새로고침
        } catch (error) {
            console.error(error);
        }
    };

    const handleEnterRoom = async (room) => {
        try {
            if (currentRoom?.id === room.id) return; // 이미 들어온 방이면 무시

            await apiClient.post(`/api/chat/rooms/${room.id}/enter`);
            const response = await apiClient.get(`/api/chat/rooms/${room.id}/messages`);
            setMessages(response.data.data || []);
            setCurrentRoom(room);

            if (stompClient.current?.connected) {
                subscribeRoom(room.id);
            }
        } catch (error) {
            console.error(error);
        }
    };

    const handleExitRoom = async () => {
        if (!currentRoom) return;
        if (window.confirm("이 채팅방에서 나가시겠습니까?")) {
            try {
                if (subscription.current) {
                    subscription.current.unsubscribe();
                    subscription.current = null;
                }
                await apiClient.post(`/api/chat/rooms/${currentRoom.id}/exit`);
                setCurrentRoom(null);
                setMessages([]);
                fetchRooms();
            } catch (error) {
                console.error(error);
            }
        }
    };

    const connectStomp = () => {
        const token = localStorage.getItem('token');
        const socket = new SockJS('http://localhost:8090/ws');
        stompClient.current = Stomp.over(socket);
        stompClient.current.debug = () => {};

        stompClient.current.connect({ 'Authorization': `Bearer ${token}` }, () => {
            stompClient.current.subscribe('/sub/chat/rooms', (message) => {
                setRooms(JSON.parse(message.body));
            });
        });
    };

    const subscribeRoom = (roomId) => {
        if (subscription.current) {
            subscription.current.unsubscribe();
        }
        subscription.current = stompClient.current.subscribe(`/sub/chat/room/${roomId}`, (message) => {
            const receivedMessage = JSON.parse(message.body);
            setMessages((prev) => [...prev, receivedMessage]);
        });
    };

    const handleSendMessage = () => {
        if (!newMessage.trim() || !stompClient.current?.connected || !currentRoom) return;
        const token = localStorage.getItem('token');
        stompClient.current.send(
            "/pub/chat/message",
            { Authorization: `Bearer ${token}` },
            JSON.stringify({ roomId: currentRoom.id, content: newMessage, type: 'TALK' })
        );
        setNewMessage('');
    };

    const formatTime = (dateTimeString) => {
        if (!dateTimeString) return '';
        const date = new Date(dateTimeString);
        return date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
    };

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    return (
        <div style={styles.layout}>
            <Header />
            <div style={styles.container}>

                {/* 좌측: 채팅방 목록 패널 (Sidebar) */}
                <div style={styles.sidebar}>
                    <div style={styles.sidebarHeader}>
                        <h2 style={styles.title}>💬 스터디 채팅</h2>
                        <div style={styles.createArea}>
                            <input type="text" placeholder="새 방 제목" value={newRoomTitle} onChange={(e) => setNewRoomTitle(e.target.value)} style={styles.createInput} onKeyDown={(e) => e.key === 'Enter' && handleCreateRoom()} />
                            <button onClick={handleCreateRoom} style={styles.createBtn}>+</button>
                        </div>
                    </div>
                    <div style={styles.roomList}>
                        {rooms.map(room => (
                            <div key={room.id} style={currentRoom?.id === room.id ? styles.roomCardActive : styles.roomCard} onClick={() => handleEnterRoom(room)}>
                                <div style={styles.roomInfo}>
                                    <div style={styles.roomTitle}>{room.title}</div>
                                    <div style={styles.roomMeta}>참여 {room.userCount || 0}명</div>
                                </div>
                            </div>
                        ))}
                        {rooms.length === 0 && <div style={styles.emptyRooms}>생성된 방이 없습니다.</div>}
                    </div>
                </div>

                {/* 우측: 실제 채팅창 패널 (Main) */}
                <div style={styles.mainChat}>
                    {!currentRoom ? (
                        <div style={styles.emptyChat}>
                            <div style={{ fontSize: '40px', marginBottom: '15px' }}>👈</div>
                            <h3>참여할 스터디 방을 선택해주세요</h3>
                        </div>
                    ) : (
                        <>
                            <div style={styles.chatHeader}>
                                <div>
                                    <h3 style={styles.chatHeaderTitle}>{currentRoom.title}</h3>
                                    <span style={styles.chatHeaderMeta}>참여자 {currentRoom.userCount || 0}명</span>
                                </div>
                                <button onClick={handleExitRoom} style={styles.exitBtn}>나가기</button>
                            </div>

                            <div style={styles.chatWindow}>
                                {messages.map((msg, index) => {
                                    const isSystem = !msg.senderName || msg.senderName === "시스템" || msg.senderName === "알 수 없음" || msg.senderName.trim() === "";
                                    const isMe = msg.senderName === myUsername;

                                    if (isSystem) {
                                        return (
                                            <div key={index} style={styles.sysMsgWrapper}>
                                                <span style={styles.sysMsg}>{msg.content}</span>
                                            </div>
                                        );
                                    }

                                    return (
                                        <div key={index} style={isMe ? styles.myMsgRow : styles.otherMsgRow}>
                                            {!isMe && (
                                                <div style={styles.avatar}>{msg.senderName.charAt(0)}</div>
                                            )}
                                            <div style={styles.msgContentBlock(isMe)}>
                                                {!isMe && <div style={styles.authorName}>{msg.senderName}</div>}
                                                <div style={{ display: 'flex', alignItems: 'flex-end', flexDirection: isMe ? 'row' : 'row-reverse', gap: '8px' }}>
                                                    <span style={styles.timeLabel}>{formatTime(msg.createdAt)}</span>
                                                    <div style={isMe ? styles.myBubble : styles.otherBubble}>{msg.content}</div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                                <div ref={messagesEndRef} />
                            </div>

                            <div style={styles.inputArea}>
                                <input type="text" value={newMessage} onChange={(e) => setNewMessage(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()} style={styles.chatInput} placeholder="메시지를 입력하세요..." />
                                <button onClick={handleSendMessage} style={styles.sendBtn}>전송</button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

const styles = {
    layout: { height: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#e2e8f0', overflow: 'hidden' },
    container: { flex: 1, display: 'flex', maxWidth: '1200px', margin: '20px auto', width: '95%', backgroundColor: '#fff', borderRadius: '24px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', overflow: 'hidden' },

    // Sidebar (방 목록)
    sidebar: { width: '320px', backgroundColor: '#f8fafc', borderRight: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column' },
    sidebarHeader: { padding: '24px 20px', borderBottom: '1px solid #e2e8f0' },
    title: { margin: '0 0 20px 0', fontSize: '22px', fontWeight: '800', color: '#0f172a' },
    createArea: { display: 'flex', gap: '8px' },
    createInput: { flex: 1, padding: '12px 16px', borderRadius: '12px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '14px' },
    createBtn: { padding: '0 16px', backgroundColor: '#4285F4', color: '#fff', border: 'none', borderRadius: '12px', cursor: 'pointer', fontSize: '20px', fontWeight: 'bold' },
    roomList: { flex: 1, overflowY: 'auto', padding: '12px' },
    emptyRooms: { textAlign: 'center', color: '#94a3b8', marginTop: '40px', fontSize: '14px' },
    roomCard: { padding: '16px', borderRadius: '16px', cursor: 'pointer', marginBottom: '8px', transition: 'background 0.2s', backgroundColor: 'transparent' },
    roomCardActive: { padding: '16px', borderRadius: '16px', cursor: 'pointer', marginBottom: '8px', backgroundColor: '#e0e7ff', borderLeft: '4px solid #4338ca' },
    roomTitle: { fontWeight: '700', fontSize: '15px', color: '#1e293b', marginBottom: '6px' },
    roomMeta: { fontSize: '12px', color: '#64748b' },

    // Main Chat (채팅창)
    mainChat: { flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: '#fff' },
    emptyChat: { flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', color: '#94a3b8' },
    chatHeader: { padding: '20px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff' },
    chatHeaderTitle: { margin: '0 0 4px 0', fontSize: '18px', fontWeight: '800', color: '#0f172a' },
    chatHeaderMeta: { fontSize: '13px', color: '#64748b' },
    exitBtn: { padding: '8px 16px', backgroundColor: '#fef2f2', color: '#ef4444', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px' },
    chatWindow: { flex: 1, padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '20px', backgroundColor: '#f1f5f9' },

    // Message Styles
    sysMsgWrapper: { display: 'flex', justifyContent: 'center', margin: '10px 0' },
    sysMsg: { backgroundColor: '#e2e8f0', color: '#475569', padding: '6px 16px', borderRadius: '20px', fontSize: '12px', fontWeight: '600' },
    myMsgRow: { alignSelf: 'flex-end', display: 'flex', alignItems: 'flex-end' },
    otherMsgRow: { alignSelf: 'flex-start', display: 'flex', alignItems: 'flex-start', gap: '10px' },
    avatar: { width: '36px', height: '36px', borderRadius: '18px', backgroundColor: '#cbd5e1', color: '#fff', display: 'flex', justifyContent: 'center', alignItems: 'center', fontWeight: 'bold', fontSize: '14px' },
    msgContentBlock: (isMe) => ({ display: 'flex', flexDirection: 'column', alignItems: isMe ? 'flex-end' : 'flex-start' }),
    authorName: { fontSize: '13px', color: '#475569', marginBottom: '6px', fontWeight: '600', marginLeft: '4px' },
    timeLabel: { fontSize: '11px', color: '#94a3b8', marginBottom: '4px' },
    myBubble: { padding: '12px 18px', borderRadius: '20px 20px 0 20px', backgroundColor: '#4285F4', color: '#fff', maxWidth: '400px', fontSize: '15px', lineHeight: '1.5', boxShadow: '0 4px 6px -1px rgba(66, 133, 244, 0.2)' },
    otherBubble: { padding: '12px 18px', borderRadius: '20px 20px 20px 0', backgroundColor: '#fff', color: '#1e293b', maxWidth: '400px', fontSize: '15px', lineHeight: '1.5', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' },

    // Input Area
    inputArea: { padding: '20px 24px', borderTop: '1px solid #e2e8f0', display: 'flex', gap: '12px', backgroundColor: '#fff' },
    chatInput: { flex: 1, padding: '16px 20px', borderRadius: '30px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '15px', backgroundColor: '#f8fafc' },
    sendBtn: { padding: '0 28px', backgroundColor: '#4285F4', color: '#fff', border: 'none', borderRadius: '30px', cursor: 'pointer', fontWeight: 'bold', fontSize: '15px', boxShadow: '0 4px 6px -1px rgba(66, 133, 244, 0.3)' }
};

export default ChatPage;