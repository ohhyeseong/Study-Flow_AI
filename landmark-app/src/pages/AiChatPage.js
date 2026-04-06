import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import apiClient from '../api';
import Header from '../components/Header';
import { useNavigate } from 'react-router-dom';

const AiChatPage = () => {
    const navigate = useNavigate();
    const [messages, setMessages] = useState([]);
    const [inputMessage, setInputMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const fileInputRef = useRef(null);
    const messagesEndRef = useRef(null);

    // 퀴즈 관련 상태
    const [activeQuiz, setActiveQuiz] = useState(null);
    const [showQuizModal, setShowQuizModal] = useState(false);
    const [isSubmittingQuiz, setIsSubmittingQuiz] = useState(false);
    const [quizResult, setQuizResult] = useState(null); // { isCorrect: boolean }

    useEffect(() => {
        const fetchHistory = async () => {
            const welcomeMessage = {
                role: 'ai',
                content: "안녕하세요! 저는 당신의 스마트 학습 튜터 Flow입니다. 궁금한 점을 텍스트로 물어보시거나 자료(이미지)를 업로드하여 분석을 요청해보세요! ✨"
            };

            try {
                const response = await apiClient.get('/api/ai/history');
                const historyData = response.data.data || response.data;

                if (Array.isArray(historyData) && historyData.length > 0) {
                    const formattedHistory = [];
                    historyData.forEach(item => {
                        const userText = item.prompt || item.userPrompt || item.question || "";
                        const aiText = item.answer || item.description || item.aiResponse || "";
                        
                        if (userText) formattedHistory.push({ role: 'user', content: userText });
                        if (aiText) formattedHistory.push({ 
                            role: 'ai', 
                            content: aiText,
                            quiz: item.quiz_dto
                        });
                    });

                    setMessages([welcomeMessage, ...formattedHistory]);
                } else {
                    setMessages([welcomeMessage]);
                }
            } catch (error) {
                setMessages([welcomeMessage]);
            }
        };

        fetchHistory();
    }, []);

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            setSelectedFile(e.target.files[0]);
        }
        e.target.value = null;
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();

        if (!inputMessage.trim() && !selectedFile) return;

        const currentMessage = inputMessage;
        let displayMessage = currentMessage;

        if (selectedFile) {
            displayMessage = currentMessage
                ? `[이미지 첨부됨] ${currentMessage}`
                : "[이미지 첨부됨] 이 이미지를 분석해 주세요.";
        }

        const userMsg = { role: 'user', content: displayMessage };
        setMessages(prev => [...prev, userMsg]);

        setInputMessage('');
        const fileToSend = selectedFile;
        setSelectedFile(null);
        setIsLoading(true);

        try {
            const formData = new FormData();

            if (currentMessage.trim()) {
                formData.append('prompt', currentMessage);
            } else if (fileToSend) {
                formData.append('prompt', '첨부된 이미지를 분석해 주세요.');
            }

            if (fileToSend) {
                formData.append('file', fileToSend);
            }

            const response = await apiClient.post('/api/ai/analyze', formData);
            const responseData = response.data?.data || response.data;

            const aiMsg = {
                role: 'ai',
                content: responseData.description || "결과를 가져오지 못했습니다.",
                quiz: responseData.quiz_dto
            };
            setMessages(prev => [...prev, aiMsg]);
        } catch (error) {
            setMessages(prev => [...prev, { role: 'ai', content: "죄송합니다. 서버 연결 또는 분석 중 문제가 발생했습니다." }]);
        } finally {
            setIsLoading(false);
        }
    };

    const openQuizModal = (quiz) => {
        setActiveQuiz(quiz);
        setQuizResult(null);
        setShowQuizModal(true);
    };

    const handleQuizSubmit = async (selectedOption) => {
        if (quizResult !== null || isSubmittingQuiz) return;
        
        setIsSubmittingQuiz(true);
        try {
            const isCorrect = selectedOption === activeQuiz.answer;
            
            await apiClient.post('/api/ai/quiz/submit', {
                quiz_id: activeQuiz.quiz_id,
                user_answer: selectedOption
            });

            setQuizResult({ isCorrect, selected: selectedOption });
            
            if (isCorrect) {
                setTimeout(() => {
                    setShowQuizModal(false);
                }, 2000);
            }
        } catch (error) {
            alert("퀴즈 제출 중 오류가 발생했습니다.");
        } finally {
            setIsSubmittingQuiz(false);
        }
    };

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isLoading]);

    return (
        <div className="ai-layout">
            <Header />
            <div className="ai-content">
                <div className="ai-chat-card">
                    <div className="ai-chat-header">
                        <div className="ai-badge">🤖</div>
                        <div className="ai-chat-title-block">
                            <h3 className="ai-chat-title">스마트 AI 튜터</h3>
                            <span className="ai-chat-status">{isLoading ? '데이터를 분석하는 중...' : '대기 중'}</span>
                        </div>
                    </div>

                    <div className="ai-chat-window">
                        {messages.map((msg, index) => (
                            <div key={index} className={msg.role === 'user' ? 'ai-my-msg-row' : 'ai-ai-msg-row'}>
                                {msg.role === 'ai' && (
                                    <div className="ai-avatar">Flow</div>
                                )}
                                <div className="ai-msg-column">
                                    <div className={msg.role === 'user' ? 'ai-my-bubble' : 'ai-ai-bubble'}>
                                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                            {msg.content}
                                        </ReactMarkdown>
                                    </div>
                                    {msg.role === 'ai' && msg.quiz && (
                                        <div className="ai-quiz-wrapper">
                                            <button 
                                                className="ai-quiz-start-btn"
                                                onClick={() => openQuizModal(msg.quiz)}
                                            >
                                                📝 연관 퀴즈 풀기
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}

                        {isLoading && (
                            <div className="ai-ai-msg-row">
                                <div className="ai-avatar">Flow</div>
                                <div className="ai-ai-bubble">
                                    <div className="typing-dots">
                                        <span></span>
                                        <span></span>
                                        <span></span>
                                    </div>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    <div className="ai-input-wrapper">
                        {selectedFile && (
                            <div className="ai-file-preview">
                                <span className="ai-file-name">🖼️ {selectedFile.name}</span>
                                <button type="button" onClick={() => setSelectedFile(null)} className="ai-file-remove-btn">✕</button>
                            </div>
                        )}

                        <form onSubmit={handleSendMessage} className="ai-input-area">
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
                                className="ai-attach-btn"
                                title="이미지 첨부"
                            >
                                📷
                            </button>

                            <input
                                type="text"
                                value={inputMessage}
                                onChange={(e) => setInputMessage(e.target.value)}
                                placeholder="무엇이든 물어보세요! (이미지 분석도 가능해요)"
                                className="ai-chat-input"
                            />
                            <button type="submit" disabled={isLoading || (!inputMessage.trim() && !selectedFile)} className="ai-send-btn">
                                {isLoading ? "..." : "보내기"}
                            </button>
                        </form>
                    </div>
                </div>
            </div>

            {/* 퀴즈 모달 Overlay */}
            {showQuizModal && activeQuiz && (
                <div className="ai-modal-overlay">
                    <div className="ai-modal-content">
                        <div className="ai-modal-header">
                            <h3 className="ai-modal-title">🧠 챌린지 퀴즈</h3>
                            <button className="ai-modal-close" onClick={() => setShowQuizModal(false)}>✕</button>
                        </div>
                        
                        <div className="ai-modal-body">
                            <p className="ai-quiz-question">{activeQuiz.question}</p>
                            
                            <div className="ai-quiz-options">
                                {activeQuiz.options.map((opt, idx) => (
                                    <button 
                                        key={idx}
                                        className={`ai-quiz-option-btn ${quizResult && opt === activeQuiz.answer ? 'correct' : ''} ${quizResult && !quizResult.isCorrect && quizResult.selected === opt ? 'wrong' : ''}`}
                                        onClick={() => handleQuizSubmit(opt)}
                                        disabled={quizResult !== null}
                                    >
                                        <span className="ai-option-num">{idx + 1}</span> {opt}
                                    </button>
                                ))}
                            </div>

                            {quizResult && (
                                <div className={`ai-quiz-feedback ${quizResult.isCorrect ? 'correct' : 'wrong'}`}>
                                    {quizResult.isCorrect ? '✨ 정답입니다! 훌륭해요!' : '🤔 아쉽네요! 오답 노트에서 확인해보세요.'}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const cssParams = `
.ai-layout { width: 100vw; height: 100vh; display: flex; flex-direction: column; background-color: #f8fafc; overflow: hidden; position: relative; }
.ai-content { flex: 1; display: flex; justify-content: center; align-items: center; padding: 30px 20px; min-height: 0; }
.ai-chat-card { width: 100%; max-width: 850px; height: 95%; background-color: #fff; border-radius: 32px; border: 1px solid #e2e8f0; box-shadow: 0 20px 40px -10px rgba(0,0,0,0.05); display: flex; flex-direction: column; overflow: hidden; }
.ai-chat-header { padding: 24px 30px; border-bottom: 1px solid #f1f5f9; display: flex; gap: 15px; align-items: center; background-color: #fff; }
.ai-badge { font-size: 24px; background-color: #f0fdf4; width: 50px; height: 50px; border-radius: 16px; display: flex; align-items: center; justify-content: center; }
.ai-chat-title-block { display: flex; flex-direction: column; gap: 4px; }
.ai-chat-title { margin: 0; font-size: 18px; font-weight: 800; color: #1e293b; }
.ai-chat-status { font-size: 12px; color: #22c55e; font-weight: bold; }
.ai-chat-window { flex: 1; padding: 30px; overflow-y: auto; display: flex; flex-direction: column; gap: 20px; background-color: #fcfcfc; min-height: 0; }
.ai-my-msg-row { align-self: flex-end; display: flex; align-items: flex-end; max-width: 80%; }
.ai-ai-msg-row { align-self: flex-start; display: flex; align-items: flex-start; gap: 10px; max-width: 80%; }
.ai-avatar { width: 36px; height: 36px; border-radius: 18px; background-color: #1e293b; color: #fff; font-size: 12px; font-weight: bold; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.ai-msg-column { display: flex; flex-direction: column; gap: 8px; }
.ai-my-bubble { padding: 16px 20px; border-radius: 24px 24px 0 24px; background-color: #4285F4; color: #fff; font-size: 15px; line-height: 1.6; box-shadow: 0 4px 6px rgba(66, 133, 244, 0.2); word-break: break-word; }
.ai-ai-bubble { padding: 16px 20px; border-radius: 24px 24px 24px 0; background-color: #fff; color: #334155; font-size: 15px; line-height: 1.6; box-shadow: 0 4px 6px rgba(0,0,0,0.03); border: 1px solid #f1f5f9; word-break: break-word; overflow-x: auto; }

.ai-quiz-wrapper { padding-left: 5px; }
.ai-quiz-start-btn { padding: 8px 16px; border-radius: 12px; background: linear-gradient(135deg, #1e293b 0%, #334155 100%); color: #fff; border: none; font-size: 13px; font-weight: bold; cursor: pointer; box-shadow: 0 4px 10px rgba(0,0,0,0.1); transition: 0.2s; }
.ai-quiz-start-btn:hover { transform: translateY(-2px); box-shadow: 0 6px 12px rgba(0,0,0,0.15); }

.ai-modal-overlay { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(15, 23, 42, 0.4); backdrop-filter: blur(8px); display: flex; justify-content: center; align-items: center; z-index: 1000; animation: fadeIn 0.3s; }
.ai-modal-content { width: 90%; max-width: 480px; background: #fff; border-radius: 32px; padding: 35px; box-shadow: 0 30px 60px -12px rgba(0,0,0,0.25); position: relative; animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
.ai-modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px; }
.ai-modal-title { margin: 0; font-size: 20px; font-weight: 800; color: #1e293b; }
.ai-modal-close { background: #f1f5f9; border: none; width: 32px; height: 32px; border-radius: 50%; font-size: 14px; color: #64748b; cursor: pointer; transition: 0.2s; }
.ai-modal-close:hover { background: #e2e8f0; color: #1e293b; }
.ai-quiz-question { font-size: 18px; font-weight: 700; color: #0f172a; line-height: 1.5; margin-bottom: 25px; }
.ai-quiz-options { display: flex; flex-direction: column; gap: 12px; }
.ai-quiz-option-btn { padding: 18px 24px; border-radius: 18px; border: 2px solid #e2e8f0; background: #fff; text-align: left; font-size: 15px; font-weight: 600; color: #334155; cursor: pointer; transition: all 0.2s; display: flex; align-items: center; gap: 12px; }
.ai-quiz-option-btn:hover:not(:disabled) { border-color: #4285F4; background: #f8faff; }
.ai-option-num { width: 24px; height: 24px; border-radius: 50%; background: #f1f5f9; display: flex; align-items: center; justify-content: center; font-size: 12px; color: #64748b; font-weight: 800; }
.ai-quiz-option-btn.correct { border-color: #22c55e; background: #f0fdf4; color: #166534; }
.ai-quiz-option-btn.wrong { border-color: #ef4444; background: #fef2f2; color: #991b1b; }
.ai-quiz-feedback { margin-top: 25px; padding: 16px; border-radius: 16px; text-align: center; font-weight: 800; font-size: 15px; animation: bounceIn 0.5s; }
.ai-quiz-feedback.correct { background: #f0fdf4; color: #166534; }
.ai-quiz-feedback.wrong { background: #fef2f2; color: #991b1b; }

@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
@keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
@keyframes bounceIn { 0% { transform: scale(0.9); } 50% { transform: scale(1.05); } 100% { transform: scale(1); } }

.ai-input-wrapper { display: flex; flex-direction: column; border-top: 1px solid #f1f5f9; background-color: #fff; }
.ai-file-preview { display: flex; align-items: center; gap: 10px; padding: 10px 30px; background-color: #f8fafc; border-bottom: 1px solid #e2e8f0; }
.ai-file-name { font-size: 13px; color: #475569; font-weight: 600; display: flex; align-items: center; }
.ai-file-remove-btn { background: none; border: none; color: #ef4444; font-size: 14px; cursor: pointer; font-weight: bold; padding: 2px 6px; }
.ai-input-area { padding: 15px 30px; display: flex; gap: 12px; align-items: center; }
.ai-attach-btn { width: 45px; height: 45px; border-radius: 50%; border: 1px solid #e2e8f0; background-color: #f8fafc; color: #64748b; font-size: 20px; display: flex; justify-content: center; align-items: center; cursor: pointer; transition: 0.2s; flex-shrink: 0; }
.ai-chat-input { flex: 1; padding: 16px 24px; border-radius: 30px; border: 1px solid #e2e8f0; background-color: #f8fafc; outline: none; font-size: 15px; transition: border 0.2s; min-width: 0; }
.ai-send-btn { padding: 0 28px; height: 48px; background-color: #1e293b; color: #fff; border: none; border-radius: 30px; font-weight: bold; font-size: 15px; cursor: pointer; transition: 0.2s; flex-shrink: 0; }
.typing-dots span { width: 8px; height: 8px; background: #94a3b8; border-radius: 50%; opacity: 0.3; display: inline-block; animation: typing 1.2s infinite; margin: 0 2px; }
.typing-dots span:nth-child(2) { animation-delay: 0.2s; }
.typing-dots span:nth-child(3) { animation-delay: 0.4s; }
@keyframes typing { 0% { opacity: 0.3; } 50% { opacity: 1; } 100% { opacity: 0.3; } }

@media screen and (max-width: 768px) {
    .ai-content { padding: 10px; }
    .ai-chat-card { border-radius: 20px; height: 100%; }
    .ai-chat-header { padding: 15px 20px; }
    .ai-chat-title { font-size: 16px; }
    .ai-chat-window { padding: 15px; gap: 15px; }
    .ai-input-area { padding: 12px 15px; gap: 8px; }
    .ai-my-msg-row, .ai-ai-msg-row { max-width: 90%; }
    .ai-my-bubble, .ai-ai-bubble { font-size: 14px; padding: 12px 16px; }
    .ai-attach-btn { width: 40px; height: 40px; font-size: 18px; }
    .ai-chat-input { padding: 12px 16px; font-size: 14px; }
    .ai-send-btn { padding: 0 20px; height: 40px; font-size: 14px; }
    .ai-file-preview { padding: 8px 20px; }
}
`;

const AiChatStyle = () => <style>{cssParams}</style>;

export default () => <><AiChatStyle/><AiChatPage/></>;