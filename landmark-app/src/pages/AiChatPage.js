import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import apiClient from '../api';
import Header from '../components/Header';

const AiChatPage = () => {
    const [messages, setMessages] = useState([]);
    const [inputMessage, setInputMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const [selectedFile, setSelectedFile] = useState(null);
    const fileInputRef = useRef(null);

    const messagesEndRef = useRef(null);

    // 대화 내역 불러오기
    useEffect(() => {
        const fetchHistory = async () => {
            const welcomeMessage = {
                role: 'ai',
                content: "안녕하세요! 저는 당신의 스마트 학습 튜터 Flow입니다. 궁금한 점을 텍스트로 물어보시거나 자료(이미지)를 업로드하여 분석을 요청해보세요! ✨"
            };

            try {
                const response = await apiClient.get('/api/ai/history');
                const historyData = response.data.data || response.data;

                if (historyData && historyData.length > 0) {
                    const formattedHistory = [];
                    historyData.forEach(item => {
                        const userText = item.prompt || item.question || "";
                        const aiText = item.answer || "";

                        if (userText) formattedHistory.push({ role: 'user', content: userText });
                        if (aiText) formattedHistory.push({ role: 'ai', content: aiText });
                    });

                    setMessages([welcomeMessage, ...formattedHistory]);
                } else {
                    setMessages([welcomeMessage]);
                }
            } catch (error) {
                console.error("이전 대화 내역 불러오기 실패:", error);
                setMessages([welcomeMessage]);
            }
        };

        fetchHistory();
    }, []);

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            setSelectedFile(e.target.files[0]);
        }
        e.target.value = null; // 같은 파일 재선택 가능하게 처리
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();

        // 텍스트도 없고 파일도 없으면 무시
        if (!inputMessage.trim() && !selectedFile) return;

        const currentMessage = inputMessage;
        let displayMessage = currentMessage;

        // 화면에 보여줄 내 메시지 포맷팅
        if (selectedFile) {
            displayMessage = currentMessage
                ? `[이미지 첨부됨] ${currentMessage}`
                : "[이미지 첨부됨] 이 이미지를 분석해 주세요.";
        }

        const userMsg = { role: 'user', content: displayMessage };
        setMessages(prev => [...prev, userMsg]);

        // 전송 직전 상태 초기화
        setInputMessage('');
        const fileToSend = selectedFile;
        setSelectedFile(null);
        setIsLoading(true);

        try {
            const formData = new FormData();

            // 💡 [핵심] 텍스트와 이미지 분기 처리
            if (currentMessage.trim()) {
                // 1. 텍스트가 있을 경우 프롬프트에 추가
                formData.append('prompt', currentMessage);
            } else if (fileToSend) {
                // 2. 텍스트 없이 이미지만 보낼 경우 (AI가 분석하려면 기본 문구가 필요함)
                formData.append('prompt', '첨부된 이미지를 분석해 주세요.');
            }

            if (fileToSend) {
                // 3. 파일이 있을 경우에만 파일 데이터 추가
                formData.append('file', fileToSend);
            }

            // 💡 [핵심] Axios에서는 multipart/form-data 헤더를 수동으로 넣으면 안 됩니다! (자동으로 Boundary가 생성됨)
            const response = await apiClient.post('/api/ai/analyze', formData);

            const aiMsg = {
                role: 'ai',
                content: response.data?.data?.answer || response.data?.answer || "결과를 가져오지 못했습니다."
            };
            setMessages(prev => [...prev, aiMsg]);
        } catch (error) {
            console.error("AI 튜터 통신 에러:", error);
            setMessages(prev => [...prev, { role: 'ai', content: "죄송합니다. 서버 연결 또는 분석 중 문제가 발생했습니다." }]);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isLoading]);

    return (
        <div style={styles.layout}>
            <Header />
            <div style={styles.content}>
                <div style={styles.chatCard}>
                    <div style={styles.chatHeader}>
                        <div style={styles.aiBadge}>🤖</div>
                        <div style={styles.chatTitleBlock}>
                            <h3 style={styles.chatTitle}>스마트 AI 튜터</h3>
                            <span style={styles.chatStatus}>{isLoading ? '데이터를 분석하는 중...' : '대기 중'}</span>
                        </div>
                    </div>

                    <div style={styles.chatWindow}>
                        {messages.map((msg, index) => (
                            <div key={index} style={msg.role === 'user' ? styles.myMsgRow : styles.aiMsgRow}>
                                {msg.role === 'ai' && (
                                    <div style={styles.aiAvatar}>Flow</div>
                                )}
                                <div style={msg.role === 'user' ? styles.myBubble : styles.aiBubble}>
                                    <ReactMarkdown remarkPlugins={[remarkGfm]} style={styles.markdownContent}>
                                        {msg.content}
                                    </ReactMarkdown>
                                </div>
                            </div>
                        ))}

                        {isLoading && (
                            <div style={styles.aiMsgRow}>
                                <div style={styles.aiAvatar}>Flow</div>
                                <div style={styles.aiBubble}>
                                    <div style={styles.typingIndicator} className="typing-dots">
                                        <span></span>
                                        <span></span>
                                        <span></span>
                                    </div>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    <div style={styles.inputWrapper}>
                        {selectedFile && (
                            <div style={styles.filePreview}>
                                <span style={styles.fileName}>🖼️ {selectedFile.name}</span>
                                <button type="button" onClick={() => setSelectedFile(null)} style={styles.fileRemoveBtn}>✕</button>
                            </div>
                        )}

                        <form onSubmit={handleSendMessage} style={styles.inputArea}>
                            <input
                                type="file"
                                accept="image/*"
                                style={{ display: 'none' }}
                                ref={fileInputRef}
                                onChange={handleFileChange}
                            />

                            <button
                                type="button"
                                onClick={() => fileInputRef.current.click()}
                                style={styles.attachBtn}
                                title="이미지 첨부"
                            >
                                📷
                            </button>

                            <input
                                type="text"
                                value={inputMessage}
                                onChange={(e) => setInputMessage(e.target.value)}
                                placeholder="무엇이든 물어보세요! (이미지 분석도 가능해요)"
                                style={styles.chatInput}
                            />
                            <button type="submit" disabled={isLoading || (!inputMessage.trim() && !selectedFile)} style={styles.sendBtn}>
                                {isLoading ? "..." : "보내기"}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

const styles = {
    layout: { width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#f8fafc', overflow: 'hidden' },
    content: { flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '30px 20px' },
    chatCard: { width: '100%', maxWidth: '850px', height: '95%', backgroundColor: '#fff', borderRadius: '32px', border: '1px solid #e2e8f0', boxShadow: '0 20px 40px -10px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', overflow: 'hidden' },
    chatHeader: { padding: '24px 30px', borderBottom: '1px solid #f1f5f9', display: 'flex', gap: '15px', alignItems: 'center', backgroundColor: '#fff' },
    aiBadge: { fontSize: '24px', backgroundColor: '#f0fdf4', width: '50px', height: '50px', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
    chatTitleBlock: { display: 'flex', flexDirection: 'column', gap: '4px' },
    chatTitle: { margin: 0, fontSize: '18px', fontWeight: '800', color: '#1e293b' },
    chatStatus: { fontSize: '12px', color: '#22c55e', fontWeight: 'bold' },
    chatWindow: { flex: 1, padding: '30px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '20px', backgroundColor: '#fcfcfc' },
    myMsgRow: { alignSelf: 'flex-end', display: 'flex', alignItems: 'flex-end', maxWidth: '80%' },
    aiMsgRow: { alignSelf: 'flex-start', display: 'flex', alignItems: 'flex-start', gap: '10px', maxWidth: '80%' },
    aiAvatar: { width: '36px', height: '36px', borderRadius: '18px', backgroundColor: '#1e293b', color: '#fff', fontSize: '12px', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
    myBubble: { padding: '16px 20px', borderRadius: '24px 24px 0 24px', backgroundColor: '#4285F4', color: '#fff', fontSize: '15px', lineHeight: '1.6', boxShadow: '0 4px 6px rgba(66, 133, 244, 0.2)', wordBreak: 'break-word' },
    aiBubble: { padding: '16px 20px', borderRadius: '24px 24px 24px 0', backgroundColor: '#fff', color: '#334155', fontSize: '15px', lineHeight: '1.6', boxShadow: '0 4px 6px rgba(0,0,0,0.03)', border: '1px solid #f1f5f9', wordBreak: 'break-word', overflowX: 'auto' },
    markdownContent: { color: 'inherit', fontSize: 'inherit' },

    inputWrapper: { display: 'flex', flexDirection: 'column', borderTop: '1px solid #f1f5f9', backgroundColor: '#fff' },
    filePreview: { display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 30px', backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' },
    fileName: { fontSize: '13px', color: '#475569', fontWeight: '600', display: 'flex', alignItems: 'center' },
    fileRemoveBtn: { background: 'none', border: 'none', color: '#ef4444', fontSize: '14px', cursor: 'pointer', fontWeight: 'bold', padding: '2px 6px' },
    inputArea: { padding: '15px 30px', display: 'flex', gap: '12px', alignItems: 'center' },
    attachBtn: { width: '45px', height: '45px', borderRadius: '50%', border: '1px solid #e2e8f0', backgroundColor: '#f8fafc', color: '#64748b', fontSize: '20px', display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'pointer', transition: '0.2s', flexShrink: 0 },
    chatInput: { flex: 1, padding: '16px 24px', borderRadius: '30px', border: '1px solid #e2e8f0', backgroundColor: '#f8fafc', outline: 'none', fontSize: '15px', transition: 'border 0.2s' },
    sendBtn: { padding: '0 28px', height: '48px', backgroundColor: '#1e293b', color: '#fff', border: 'none', borderRadius: '30px', fontWeight: 'bold', fontSize: '15px', cursor: 'pointer', transition: '0.2s', flexShrink: 0 },

    typingIndicator: { display: 'flex', gap: '4px', padding: '6px 0' },
};

const cssParams = `
@keyframes typing { 0% { opacity: 0.3; } 50% { opacity: 1; } 100% { opacity: 0.3; } }
.typing-dots span {
    width: 8px; height: 8px; background: #94a3b8; border-radius: 50%;
    opacity: 0.3; display: inline-block; animation: typing 1.2s infinite;
}
.typing-dots span:nth-child(2) { animation-delay: 0.2s; }
.typing-dots span:nth-child(3) { animation-delay: 0.4s; }
`;

const TypingStyle = () => <style>{cssParams}</style>;

export default () => <><TypingStyle/><AiChatPage/></>;