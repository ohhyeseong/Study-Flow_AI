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
    const [isPrivateRoom, setIsPrivateRoom] = useState(false);
    const [currentRoomCode, setCurrentRoomCode] = useState('');

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
            await apiClient.post('/api/chat/rooms', { title: newRoomTitle, isPrivate: isPrivateRoom });
            setNewRoomTitle('');
            setIsPrivateRoom(false);
            fetchRooms();
        } catch (error) {
            console.error(error);
            alert("방 생성에 실패했습니다.");
        }
    };

    const handleEnterRoom = async (room) => {
        try {
            if (currentRoom?.id === room.id) return;

            let isEntered = false;
            try {
                await apiClient.post(`/api/chat/rooms/${room.id}/enter`);
                isEntered = true;
            } catch (error) {
                if (room.isPrivate) {
                    const code = prompt("🔒 비공개 방입니다. 6자리 입장 코드를 입력하세요.");
                    if (code === null) return;
                    try {
                        await apiClient.post(`/api/chat/rooms/${room.id}/enter?roomCode=${encodeURIComponent(code)}`);
                        isEntered = true;
                    } catch (e) {
                        alert("입장 코드가 일치하지 않습니다.");
                        return;
                    }
                } else {
                    alert("입장에 실패했습니다.");
                    return;
                }
            }

            if (!isEntered) return;

            const response = await apiClient.get(`/api/chat/rooms/${room.id}/messages`);
            setMessages(response.data.data || []);
            setCurrentRoom(room);

            if (room.isPrivate) {
                try {
                    const codeRes = await apiClient.get(`/api/chat/rooms/${room.id}/code`);
                    setCurrentRoomCode(codeRes.data.data.code);
                } catch (e) { console.error(e); }
            } else {
                setCurrentRoomCode('');
            }

            if (stompClient.current?.connected) {
                subscribeRoom(room.id);
            }
        } catch (error) {
            console.error(error);
            alert("입장에 실패했습니다. 코드를 다시 확인해주세요.");
        }
    };

    const handleInvite = async () => {
        const targetEmail = prompt("초대할 분의 이메일 주소를 입력하세요.");
        if (!targetEmail || !targetEmail.trim()) return;

        try {
            await apiClient.post(`/api/chat/rooms/${currentRoom.id}/invite`, { email: targetEmail });
            alert("✅ 초대장이 성공적으로 발송되었습니다!");
        } catch (error) {
            console.error(error);
            alert("초대장 발송에 실패했습니다.");
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
        const token = localStorage.getItem('accessToken');
        const socket = new SockJS('http://54.180.155.22:8080/ws');
        stompClient.current = Stomp.over(socket);
        stompClient.current.debug = () => { };

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
        const token = localStorage.getItem('accessToken');
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
            <div style={styles.container} className="chat-container-inner">

                {/* 좌측: 채팅방 목록 패널 (Sidebar) */}
                <div 
                    style={{...styles.sidebar, display: currentRoom ? (window.innerWidth <= 768 ? 'none' : 'flex') : 'flex'}}
                    className="room-sidebar"
                >
                    <div style={styles.sidebarHeader}>
                        <h2 style={styles.title}>💬 스터디 채팅</h2>
                        <div style={styles.createArea}>
                            <input type="text" placeholder="새 방 제목" value={newRoomTitle} onChange={(e) => setNewRoomTitle(e.target.value)} style={styles.createInput} onKeyDown={(e) => e.key === 'Enter' && handleCreateRoom()} />
                            <label style={styles.privateLabel}>
                                <input type="checkbox" checked={isPrivateRoom} onChange={(e) => setIsPrivateRoom(e.target.checked)} />
                                🔒 비공개
                            </label>
                            <button onClick={handleCreateRoom} style={styles.createBtn}>+</button>
                        </div>
                    </div>
                    <div style={styles.roomList}>
                        {rooms.map(room => (
                            <div key={room.id} style={currentRoom?.id === room.id ? styles.roomCardActive : styles.roomCard} onClick={() => handleEnterRoom(room)}>
                                <div style={styles.roomInfo}>
                                    <div style={styles.roomTitle}>
                                        {room.isPrivate && <span style={{ marginRight: '6px' }}>🔒</span>}
                                        {room.title}
                                    </div>
                                    <div style={styles.roomMeta}>참여 {room.userCount || 0}명</div>
                                </div>
                            </div>
                        ))}
                        {rooms.length === 0 && <div style={styles.emptyRooms}>생성된 방이 없습니다.</div>}
                    </div>
                </div>

                {/* 우측: 실제 채팅창 패널 (Main) */}
                <div 
                    style={{...styles.mainChat, display: !currentRoom && window.innerWidth <= 768 ? 'none' : 'flex'}}
                    className="chat-main"
                >
                    {!currentRoom ? (
                        <div style={styles.emptyChat}>
                            <div style={{ fontSize: '40px', marginBottom: '15px' }}>👈</div>
                            <h3>참여할 스터디 방을 선택해주세요</h3>
                        </div>
                    ) : (
                        <>
                            <div style={styles.chatHeader}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <button onClick={() => setCurrentRoom(null)} style={styles.listBtnMobile} className="list-btn-mobile">
                                        ⬅️ 목록
                                    </button>
                                    <div>
                                        <h3 style={styles.chatHeaderTitle}>
                                            {currentRoom.isPrivate && <span style={{ marginRight: '8px' }}>🔒</span>}
                                            {currentRoom.title}
                                        </h3>
                                        <span style={styles.chatHeaderMeta}>참여자 {currentRoom.userCount || 0}명</span>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    {currentRoom.isPrivate && (
                                        <>
                                            <div style={styles.inviteCodeBadge}>
                                                🔑 코드: {currentRoomCode}
                                            </div>
                                            <button onClick={handleInvite} style={styles.inviteBtn}>이메일 초대</button>
                                        </>
                                    )}
                                    <button onClick={handleExitRoom} style={styles.exitBtn}>나가기</button>
                                </div>
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
                                                msg.senderProfileImageUrl ? (
                                                    <img src={msg.senderProfileImageUrl} alt="profile" style={{ width: '36px', height: '36px', borderRadius: '18px', objectFit: 'cover' }} />
                                                ) : (
                                                    <div style={styles.avatar}>{msg.senderName.charAt(0)}</div>
                                                )
                                            )}
                                            <div style={styles.msgContentBlock(isMe)}>
                                                {!isMe && <div style={styles.authorName}>{msg.senderName}</div>}
                                                <div style={{ display: 'flex', alignItems: 'flex-end', flexDirection: isMe ? 'row' : 'row-reverse', gap: '8px' }}>
                                                    <span style={styles.timeLabel} className="time-label-mobile">{formatTime(msg.createdAt)}</span>
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
            <style>{`
                @media screen and (max-width: 768px) {
                    .room-sidebar { 
                        display: ${currentRoom ? 'none' : 'flex'} !important; 
                        width: 100% !important; 
                        border: none !important;
                    }
                    .chat-main { 
                        display: ${currentRoom ? 'flex' : 'none'} !important; 
                        width: 100% !important; 
                    }
                    .chat-container-inner {
                        margin: 0 !important;
                        width: 100% !important;
                        height: 100% !important;
                        border-radius: 0 !important;
                    }
                    .list-btn-mobile {
                        display: flex !important;
                    }
                    .time-label-mobile { display: none !important; }
                }
            `}</style>
        </div>
    );
};

const styles = {
    layout: { height: '100vh', height: '100dvh', display: 'flex', flexDirection: 'column', backgroundColor: '#f1f5f9', overflow: 'hidden' },
    container: { flex: 1, display: 'flex', maxWidth: '1200px', margin: '20px auto', width: '95%', backgroundColor: '#fff', borderRadius: '24px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', overflow: 'hidden' },

    // Sidebar (방 목록)
    sidebar: { width: '320px', backgroundColor: '#f8fafc', borderRight: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column' },
    sidebarHeader: { padding: '24px 20px', borderBottom: '1px solid #e2e8f0', flexShrink: 0 },
    title: { margin: '0 0 20px 0', fontSize: '22px', fontWeight: '800', color: '#0f172a' },
    createArea: { display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' },
    createInput: { flex: 1, padding: '12px 16px', borderRadius: '12px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '14px', minWidth: '150px' },
    privateLabel: { fontSize: '13px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', fontWeight: '600' },
    createBtn: { padding: '0 16px', height: '40px', backgroundColor: '#4285F4', color: '#fff', border: 'none', borderRadius: '12px', cursor: 'pointer', fontSize: '20px', fontWeight: 'bold' },
    roomList: { flex: 1, overflowY: 'auto', padding: '10px' },
    emptyRooms: { textAlign: 'center', color: '#94a3b8', marginTop: '40px', fontSize: '14px' },
    roomCard: { padding: '14px 16px', borderRadius: '16px', cursor: 'pointer', marginBottom: '8px', transition: 'all 0.2s', backgroundColor: 'transparent' },
    roomCardActive: { padding: '14px 16px', borderRadius: '16px', cursor: 'pointer', marginBottom: '8px', backgroundColor: '#eef2ff', borderLeft: '4px solid #4f46e5' },
    roomInfo: { display: 'flex', flexDirection: 'column', gap: '4px' },
    roomTitle: { fontWeight: '700', fontSize: '15px', color: '#1e293b' },
    roomMeta: { fontSize: '12px', color: '#64748b' },

    // Main Chat (채팅창)
    mainChat: { flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: '#fff', minWidth: 0 },
    emptyChat: { flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', color: '#94a3b8', backgroundColor: '#fcfcfc' },
    chatHeader: { padding: '12px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', flexShrink: 0 },
    listBtnMobile: { display: 'none', padding: '8px 12px', backgroundColor: '#f1f5f9', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: 'bold', cursor: 'pointer', alignItems: 'center', gap: '5px' },
    chatHeaderTitle: { margin: 0, fontSize: '17px', fontWeight: '800', color: '#0f172a', display: 'flex', alignItems: 'center' },
    chatHeaderMeta: { fontSize: '12px', color: '#64748b' },
    inviteCodeBadge: { padding: '6px 14px', backgroundColor: '#f8fafc', color: '#475569', border: '1px solid #e2e8f0', borderRadius: '20px', fontSize: '13px', fontWeight: '700' },
    inviteBtn: { padding: '8px 16px', backgroundColor: '#eef2ff', color: '#4f46e5', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' },
    exitBtn: { padding: '8px 16px', backgroundColor: '#fef2f2', color: '#ef4444', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' },
    chatWindow: { flex: 1, padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px', backgroundColor: '#fcfcfc' },

    // Message Styles
    sysMsgWrapper: { display: 'flex', justifyContent: 'center', margin: '8px 0' },
    sysMsg: { backgroundColor: '#f1f5f9', color: '#64748b', padding: '5px 14px', borderRadius: '15px', fontSize: '11px', fontWeight: '700' },
    myMsgRow: { alignSelf: 'flex-end', display: 'flex', alignItems: 'flex-end', maxWidth: '85%' },
    otherMsgRow: { alignSelf: 'flex-start', display: 'flex', alignItems: 'flex-start', gap: '8px', maxWidth: '85%' },
    avatar: { width: '34px', height: '34px', borderRadius: '50%', backgroundColor: '#cbd5e1', color: '#fff', display: 'flex', justifyContent: 'center', alignItems: 'center', fontWeight: 'bold', fontSize: '12px', flexShrink: 0 },
    msgContentBlock: (isMe) => ({ display: 'flex', flexDirection: 'column', alignItems: isMe ? 'flex-end' : 'flex-start', minWidth: 0 }),
    authorName: { fontSize: '12px', color: '#475569', marginBottom: '4px', fontWeight: '700', marginLeft: '2px' },
    timeLabel: { fontSize: '10px', color: '#94a3b8', flexShrink: 0 },
    myBubble: { padding: '10px 16px', borderRadius: '18px 18px 0 18px', backgroundColor: '#4285F4', color: '#fff', fontSize: '15px', lineHeight: '1.5', boxShadow: '0 4px 6px -1px rgba(66, 133, 244, 0.2)', wordBreak: 'break-word' },
    otherBubble: { padding: '10px 16px', borderRadius: '18px 18px 18px 0', backgroundColor: '#fff', color: '#1e293b', fontSize: '15px', lineHeight: '1.5', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', border: '1px solid #f1f5f9', wordBreak: 'break-word' },

    // Input Area
    inputArea: { padding: '16px 20px', borderTop: '1px solid #e2e8f0', display: 'flex', gap: '10px', backgroundColor: '#fff', flexShrink: 0, paddingBottom: 'calc(16px + env(safe-area-inset-bottom))' },
    chatInput: { flex: 1, padding: '12px 20px', borderRadius: '25px', border: '1px solid #e2e8f0', outline: 'none', fontSize: '15px', backgroundColor: '#f8fafc' },
    sendBtn: { padding: '0 24px', height: '42px', backgroundColor: '#4285F4', color: '#fff', border: 'none', borderRadius: '25px', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px', boxShadow: '0 4px 10px rgba(66, 133, 244, 0.3)' }
};

export default ChatPage;