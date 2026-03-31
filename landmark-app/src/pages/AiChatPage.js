import React, { useEffect, useState, useRef, useCallback } from 'react';
import apiClient from '../api';
import { useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import Header from '../components/Header';

function AiChatPage() {
  const [chatHistory, setChatHistory] = useState([]);
  const [customPrompt, setCustomPrompt] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [showQuiz, setShowQuiz] = useState(false);
  const [currentQuiz, setCurrentQuiz] = useState(null);
  const [userAnswer, setUserAnswer] = useState(null);
  const [isCorrect, setIsCorrect] = useState(null);

  const navigate = useNavigate();
  const chatEndRef = useRef(null);
  const fileInputRef = useRef(null);

  const fetchChatHistory = useCallback(async () => {
    try {
      const response = await apiClient.get('/api/ai/history');
      const data = response.data.data || [];
      setChatHistory(data);
    } catch (err) {
      if (err.response?.status === 401) navigate('/login');
    }
  }, [navigate]);

  useEffect(() => {
    fetchChatHistory();
  }, [fetchChatHistory]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory]);

  const handleAIChat = async () => {
    if (!selectedFile && !customPrompt) return;
    if (isLoading) return;

    const tempFile = selectedFile;
    const tempPrompt = customPrompt;
    const tempPreview = previewUrl;

    setCustomPrompt("");
    setSelectedFile(null);
    setPreviewUrl(null);

    setChatHistory(prev => [...prev, { userPrompt: tempPrompt, imageUrl: tempPreview, aiResponse: null, isNew: true }]);
    setIsLoading(true);

    const formData = new FormData();
    if (tempFile) formData.append('file', tempFile);
    formData.append('prompt', tempPrompt || "이 문제를 설명해줘.");

    try {
      const res = await apiClient.post(`/api/ai/analyze`, formData);
      const data = res.data.data;

      setChatHistory(prev => {
        const updated = [...prev];
        const lastIndex = updated.length - 1;
        updated[lastIndex] = { ...updated[lastIndex], ...data, aiResponse: data.description, isNew: false };
        return updated;
      });
    } catch (err) {
      alert("분석 실패");
      setChatHistory(prev => prev.slice(0, -1));
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuizSubmit = async (option) => {
    if (!currentQuiz || isCorrect !== null) return;
    setUserAnswer(option);
    const correct = option === currentQuiz.answer;
    setIsCorrect(correct);

    try {
      await apiClient.post(`/api/ai/quiz/submit`, {
        quizId: currentQuiz.quizId || currentQuiz.id,
        userAnswer: option
      });
      fetchChatHistory();
    } catch (err) { console.error(err); }
  };

  const lastAiResponse = [...chatHistory].reverse().find(c => c.aiResponse);

  return (
    <div style={styles.layout}>
      <Header />
      <div style={styles.contentSplit}>
        {/* 왼쪽: 학습 자료 분석 (프로그래머스 스타일) */}
        <div style={styles.leftSection}>
          <div style={styles.sectionHeader}>
            <span style={styles.statusBadge}>Analysis View</span>
            <h2 style={styles.sectionTitle}>학습 리포트</h2>
          </div>
          <div style={styles.scrollArea}>
            {lastAiResponse?.imageUrl ? (
              <div style={styles.imageContainer}><img src={lastAiResponse.imageUrl} alt="Target" style={styles.mainImage} /></div>
            ) : (
              <div style={styles.emptyNotice}>자료를 업로드하면 분석 리포트가 여기에 표시됩니다.</div>
            )}
            {lastAiResponse && (
              <div style={styles.markdownWrapper} className="markdown-body">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{lastAiResponse.aiResponse}</ReactMarkdown>
              </div>
            )}
          </div>
        </div>

        {/* 오른쪽: AI 튜터 채팅 (인터랙션 레이어) */}
        <div style={styles.rightSection}>
          <div style={styles.chatHeader}>
            <strong>AI 튜터와 대화</strong>
            <div style={styles.onlineDot} />
          </div>
          <div style={styles.chatList}>
            {chatHistory.map((chat, i) => (
              <div key={i} style={styles.messageRow(chat.userPrompt)}>
                {chat.userPrompt && <div style={styles.userBubble}>{chat.userPrompt}</div>}
                {chat.aiResponse && (
                  <div style={styles.aiBubble}>
                    <div>분석이 완료되었습니다. 이해도를 체크해볼까요?</div>
                    {chat.quizDto && (
                      <button onClick={() => { setCurrentQuiz(chat.quizDto); setShowQuiz(true); setIsCorrect(null); }} style={styles.quizBtn}>
                        📝 퀴즈 풀기
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
            {isLoading && <div style={styles.messageRow(false)}><div style={styles.aiBubble}>자료를 분석하고 있습니다... ⏳</div></div>}
            <div ref={chatEndRef} />
          </div>
          <div style={styles.inputBar}>
            <div style={styles.inputInner}>
              <button onClick={() => fileInputRef.current.click()} style={styles.attachBtn}>📎</button>
              <input type="file" ref={fileInputRef} hidden onChange={(e) => {
                const file = e.target.files[0];
                if(file) { setSelectedFile(file); setPreviewUrl(URL.createObjectURL(file)); }
              }} />
              <input style={styles.textInput} value={customPrompt} onChange={(e) => setCustomPrompt(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAIChat()} placeholder="질문을 입력하세요..." />
              <button onClick={handleAIChat} style={styles.sendBtn} disabled={isLoading}>전송</button>
            </div>
          </div>
        </div>
      </div>

      {/* 퀴즈 모달 (MainPage와 동일 로직 유지) */}
      {showQuiz && currentQuiz && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <h3 style={{color: '#4285F4', marginBottom: '20px'}}>🎯 실력 확인 퀴즈</h3>
            <p style={styles.quizText}>{currentQuiz.question}</p>
            <div style={styles.quizOptions}>
              {currentQuiz.options.map((opt, idx) => (
                <button key={idx} onClick={() => handleQuizSubmit(opt)} style={styles.optBtn(userAnswer === opt, isCorrect, opt === currentQuiz.answer)}>
                  {opt}
                </button>
              ))}
            </div>
            {isCorrect === false && (
              <button onClick={() => navigate('/wrong-notes')} style={styles.wrongNoteLink}>📖 오답노트 보러가기</button>
            )}
            <button onClick={() => {setShowQuiz(false); setIsCorrect(null);}} style={styles.closeBtn}>
              {isCorrect === false ? "나중에 하기" : "닫기"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  layout: { width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#fff', overflow: 'hidden' },
  contentSplit: { display: 'grid', gridTemplateColumns: '55% 45%', height: 'calc(100vh - 64px)' },
  leftSection: { borderRight: '1px solid #e5e7eb', display: 'flex', flexDirection: 'column', padding: '32px', backgroundColor: '#f9fafb' },
  sectionHeader: { marginBottom: '24px' },
  statusBadge: { fontSize: '12px', fontWeight: 'bold', color: '#4285F4', backgroundColor: '#e8f0fe', padding: '4px 12px', borderRadius: '20px' },
  sectionTitle: { fontSize: '24px', fontWeight: '800', marginTop: '12px', color: '#111827' },
  scrollArea: { flex: 1, overflowY: 'auto', paddingRight: '10px' },
  imageContainer: { width: '100%', borderRadius: '16px', overflow: 'hidden', border: '1px solid #e5e7eb', marginBottom: '24px', backgroundColor: '#fff' },
  mainImage: { width: '100%', display: 'block' },
  markdownWrapper: { backgroundColor: '#fff', padding: '24px', borderRadius: '16px', border: '1px solid #e5e7eb', lineHeight: '1.7' },
  emptyNotice: { height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px dashed #d1d5db', borderRadius: '16px', color: '#6b7280' },
  rightSection: { display: 'flex', flexDirection: 'column', backgroundColor: '#fff' },
  chatHeader: { padding: '20px 32px', borderBottom: '1px solid #f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  onlineDot: { width: '10px', height: '10px', backgroundColor: '#10b981', borderRadius: '50%' },
  chatList: { flex: 1, overflowY: 'auto', padding: '24px 32px', display: 'flex', flexDirection: 'column', gap: '16px' },
  messageRow: (isUser) => ({ display: 'flex', justifyContent: isUser ? 'flex-end' : 'flex-start' }),
  userBubble: { backgroundColor: '#4285F4', color: '#fff', padding: '12px 18px', borderRadius: '20px 20px 0 20px', maxWidth: '80%', fontWeight: '500' },
  aiBubble: { backgroundColor: '#f3f4f6', color: '#1f2937', padding: '12px 18px', borderRadius: '20px 20px 20px 0', maxWidth: '80%', border: '1px solid #e5e7eb' },
  quizBtn: { marginTop: '12px', width: '100%', padding: '10px', backgroundColor: '#fff', border: '1px solid #4285F4', color: '#4285F4', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold' },
  inputBar: { padding: '24px 32px', borderTop: '1px solid #f3f4f6' },
  inputInner: { display: 'flex', alignItems: 'center', gap: '12px', backgroundColor: '#f9fafb', padding: '8px 16px', borderRadius: '30px', border: '1px solid #e5e7eb' },
  attachBtn: { background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#6b7280' },
  textInput: { flex: 1, border: 'none', outline: 'none', backgroundColor: 'transparent', fontSize: '16px' },
  sendBtn: { backgroundColor: '#4285F4', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '20px', fontWeight: 'bold', cursor: 'pointer' },
  modalOverlay: { position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
  modalContent: { backgroundColor: '#fff', padding: '40px', borderRadius: '24px', width: '450px', textAlign: 'center', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' },
  quizText: { fontSize: '18px', fontWeight: 'bold', marginBottom: '24px', color: '#1f2937' },
  quizOptions: { display: 'flex', flexDirection: 'column', gap: '10px' },
  optBtn: (isSelected, isCorrect, isAnswer) => ({
    padding: '14px', borderRadius: '12px', border: '1px solid #e5e7eb', cursor: 'pointer', textAlign: 'left', transition: '0.2s',
    backgroundColor: isSelected ? (isCorrect ? '#d1fae5' : '#fee2e2') : (isCorrect !== null && isAnswer ? '#d1fae5' : '#fff'),
    borderColor: isSelected ? (isCorrect ? '#10b981' : '#ef4444') : '#e5e7eb'
  }),
  wrongNoteLink: { marginTop: '20px', padding: '12px', backgroundColor: '#f59e0b', color: '#fff', border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: 'bold', width: '100%' },
  closeBtn: { marginTop: '12px', backgroundColor: '#6b7280', color: '#fff', border: 'none', padding: '12px', borderRadius: '12px', width: '100%', cursor: 'pointer' }
};

export default AiChatPage;