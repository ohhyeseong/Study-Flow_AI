import React, { useEffect, useState, useRef, useCallback } from 'react';
import apiClient from '../api';
import { useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import Header from '../components/Header';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

function MainPage() {
  const [chatHistory, setChatHistory] = useState([]);
  const [customPrompt, setCustomPrompt] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [showQuiz, setShowQuiz] = useState(false);
  const [currentQuiz, setCurrentQuiz] = useState(null);
  const [userAnswer, setUserAnswer] = useState(null);
  const [isCorrect, setIsCorrect] = useState(null);
  const [performanceData, setPerformanceData] = useState([
    { name: '이전 평균', time: 11.5, color: '#94a3b8' },
    { name: '현재 응답', time: 0, color: '#4285F4' }
  ]);

  const navigate = useNavigate();
  const chatEndRef = useRef(null);
  const fileInputRef = useRef(null);

  const fetchChatHistory = useCallback(async () => {
    try {
      const response = await apiClient.get('/api/ai/history');
      const data = response.data.data || response.data || [];
      if (Array.isArray(data)) {
        setChatHistory(data);
      }
    } catch (err) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        localStorage.removeItem('token');
        navigate('/login');
      }
    }
  }, [navigate]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
    } else {
      fetchChatHistory();
    }
  }, [navigate, fetchChatHistory]);

  const handleAIChat = async () => {
    if (!selectedFile && !customPrompt) {
      alert("이미지나 질문을 입력해주세요.");
      return;
    }
    if (isLoading) return;

    const tempFile = selectedFile;
    const tempPrompt = customPrompt;
    const tempPreview = previewUrl;

    setCustomPrompt("");
    setSelectedFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";

    setChatHistory(prev => [...prev, {
        userPrompt: tempPrompt,
        imageUrl: tempPreview,
        aiResponse: null,
        isNew: true
    }]);
    setIsLoading(true);

    const formData = new FormData();
    if (tempFile) formData.append('file', tempFile);
    formData.append('prompt', tempPrompt || "이 문제를 설명해줘.");

    try {
      const startTime = performance.now();
      const res = await apiClient.post(`/api/ai/analyze`, formData);
      const endTime = performance.now();
      const duration = parseFloat(((endTime - startTime) / 1000).toFixed(2));

      const data = res.data.data || res.data;

      setPerformanceData([
        { name: '이전 평균', time: 11.5, color: '#94a3b8' },
        { name: '현재 응답', time: duration, color: duration > 1 ? '#ef4444' : '#22c55e' }
      ]);

      setChatHistory(prev => {
        const updated = [...prev];
        const lastIndex = updated.length - 1;
        if (updated[lastIndex].isNew) {
            updated[lastIndex] = {
                ...updated[lastIndex],
                ...data,
                aiResponse: data.description,
                responseTime: duration,
                isNew: false
            };
        }
        return updated;
      });
    } catch (err) {
      alert("분석 실패");
      setChatHistory(prev => prev.slice(0, prev.length - 1));
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuizSubmit = async (option) => {
      if (!currentQuiz || isCorrect !== null) return;

      setUserAnswer(option);
      const correct = (option === currentQuiz.answer);
      setIsCorrect(correct);

      const idToSend = currentQuiz.quizId || currentQuiz.id || 0;

      try {
        await apiClient.post(`/api/ai/quiz/submit`, {
          quizId: idToSend,
          userAnswer: option
        });
        // 성공 시 데이터 갱신 (오답노트 데이터 반영을 위해)
        fetchChatHistory();
      } catch (err) {
        console.error("퀴즈 제출 오류:", err);
      }
    };

  const lastAiResponse = [...chatHistory].reverse().find(c => c.aiResponse);

  return (
    <div style={styles.layout}>
      <Header />
      <div style={styles.splitContent}>
        <div style={styles.leftPanel}>
          <div style={styles.panelHeader}>
            <span style={styles.badge}>PERFORMANCE</span>
            <h2 style={styles.panelTitle}>응답 속도 실시간 모니터링</h2>
          </div>

          <div style={styles.chartContainer}>
            <ResponsiveContainer width="100%" height={150}>
              <BarChart data={performanceData} layout="vertical" margin={{left: 30, right: 30}}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" width={80} style={{fontSize: '12px'}} />
                <Tooltip />
                <Bar dataKey="time" radius={[0, 4, 4, 0]} barSize={20}>
                  {performanceData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div style={styles.timeInfo}>
              현재 응답 시간: <strong>{performanceData[1].time}초</strong>
            </div>
          </div>

          <div style={styles.contentScroll}>
            {lastAiResponse?.imageUrl ? (
              <img src={lastAiResponse.imageUrl} alt="Target" style={styles.mainImage} />
            ) : previewUrl ? (
              <img src={previewUrl} alt="Preview" style={styles.mainImage} />
            ) : (
              <div style={styles.emptyCard}>📎 학습 자료를 업로드하세요.</div>
            )}
            <div style={styles.analysisCard}>
              <div className="markdown-body">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {lastAiResponse?.aiResponse || "분석 결과가 여기에 표시됩니다."}
                </ReactMarkdown>
              </div>
            </div>
          </div>
        </div>

        <div style={styles.rightPanel}>
          <div style={styles.chatHeader}>
            <span style={styles.statusDot}></span>
            <strong>AI 튜터와 대화하기</strong>
          </div>
          <div style={styles.chatBox}>
            {chatHistory.map((chat, i) => (
              <React.Fragment key={i}>
                {chat?.userPrompt && (
                  <div style={styles.chatRow(true)}>
                    <div style={styles.bubble(true)}>{chat.userPrompt}</div>
                  </div>
                )}
                {chat.aiResponse && (
                  <div style={styles.chatRow(false)}>
                    <div style={styles.bubble(false)}>
                      <div>분석 완료! 퀴즈를 풀어보세요.</div>
                      {chat.quizDto && (
                        <button onClick={() => {
                          setCurrentQuiz(chat.quizDto);
                          setShowQuiz(true);
                          setIsCorrect(null);
                          setUserAnswer(null);
                        }} style={styles.quizOpenBtn}>📝 퀴즈 풀기</button>
                      )}
                    </div>
                  </div>
                )}
              </React.Fragment>
            ))}
            {isLoading && <div style={styles.chatRow(false)}><div style={styles.bubble(false)}>분석 중... ⏳</div></div>}
            <div ref={chatEndRef} />
          </div>
          <div style={styles.inputWrapper}>
            <div style={styles.inputArea}>
              <input type="file" ref={fileInputRef} onChange={(e) => {
                const file = e.target.files[0];
                if(file) { setSelectedFile(file); setPreviewUrl(URL.createObjectURL(file)); }
              }} style={{display:'none'}} />
              <button onClick={() => fileInputRef.current.click()} style={styles.iconBtn}>📎</button>
              <input style={styles.input} value={customPrompt} onChange={(e) => setCustomPrompt(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && !isLoading && handleAIChat()} placeholder="질문을 입력하세요..." />
              <button onClick={handleAIChat} style={styles.sendBtn} disabled={isLoading}>전송</button>
            </div>
          </div>
        </div>
      </div>

      {showQuiz && currentQuiz && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <h3 style={{color: '#4285F4'}}>🎯 실력 확인 퀴즈</h3>
            <p style={styles.quizQuestion}>{currentQuiz.question}</p>
            <div style={styles.optionList}>
              {currentQuiz.options.map((opt, idx) => (
                <button
                  key={idx}
                  onClick={() => handleQuizSubmit(opt)}
                  style={styles.optionBtn(userAnswer === opt, isCorrect, opt === currentQuiz.answer)}
                >
                  {opt}
                </button>
              ))}
            </div>
            {isCorrect !== null && (
              <p style={styles.resultText(isCorrect)}>
                {isCorrect ? "정답입니다! 👏" : `아쉽네요! 정답은 [${currentQuiz.answer}] 입니다. 오답노트에 추가됩니다!`}
              </p>
            )}
            <button onClick={() => setShowQuiz(false)} style={styles.modalCloseBtn}>닫기</button>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  layout: { width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#f8fafc', overflow: 'hidden' },
  splitContent: { display: 'grid', gridTemplateColumns: '55% 45%', height: 'calc(100vh - 64px)', overflow: 'hidden' },
  leftPanel: { backgroundColor: '#ffffff', borderRight: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', padding: '24px', overflowY: 'auto' },
  panelHeader: { display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '15px' },
  badge: { backgroundColor: '#f59e0b', color: '#fff', padding: '4px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 'bold' },
  panelTitle: { fontSize: '18px', fontWeight: 'bold', color: '#1e293b', margin: 0 },
  chartContainer: { backgroundColor: '#f8fafc', padding: '15px', borderRadius: '12px', marginBottom: '20px', border: '1px solid #e2e8f0' },
  timeInfo: { textAlign: 'center', marginTop: '10px', fontSize: '14px', color: '#475569' },
  contentScroll: { flex: 1 },
  mainImage: { width: '100%', maxHeight: '350px', objectFit: 'contain', borderRadius: '12px', marginBottom: '20px', backgroundColor: '#f1f5f9' },
  emptyCard: { height: '150px', backgroundColor: '#f1f5f9', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', border: '2px dashed #cbd5e1' },
  analysisCard: { backgroundColor: '#fff', borderRadius: '12px', color: '#334155', paddingBottom: '40px' },
  rightPanel: { display: 'flex', flexDirection: 'column', backgroundColor: '#f1f5f9', height: '100%', overflow: 'hidden' },
  chatHeader: { padding: '16px 20px', backgroundColor: '#fff', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '8px' },
  statusDot: { width: '8px', height: '8px', backgroundColor: '#22c55e', borderRadius: '50%' },
  chatBox: { flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' },
  chatRow: (isUser) => ({ display: 'flex', justifyContent: isUser ? 'flex-end' : 'flex-start' }),
  bubble: (isUser) => ({ padding: '12px 16px', borderRadius: isUser ? '16px 16px 0 16px' : '16px 16px 16px 0', maxWidth: '85%', backgroundColor: isUser ? '#4285F4' : '#fff', color: isUser ? '#fff' : '#1e293b', boxShadow: '0 2px 4px rgba(0,0,0,0.02)', border: isUser ? 'none' : '1px solid #e2e8f0' }),
  inputWrapper: { padding: '16px 20px', backgroundColor: '#fff', borderTop: '1px solid #e2e8f0' },
  inputArea: { display: 'flex', alignItems: 'center', gap: '12px', backgroundColor: '#f8fafc', padding: '8px 16px', borderRadius: '24px', border: '1px solid #e2e8f0' },
  input: { flex: 1, border: 'none', outline: 'none', backgroundColor: 'transparent', fontSize: '15px' },
  sendBtn: { backgroundColor: '#4285F4', color: '#fff', border: 'none', padding: '8px 20px', borderRadius: '18px', fontWeight: 'bold', cursor: 'pointer' },
  iconBtn: { background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#64748b' },
  quizOpenBtn: { marginTop: '10px', width: '100%', padding: '10px', backgroundColor: '#f0f7ff', border: '1px solid #4285F4', color: '#4285F4', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' },
  modalOverlay: { position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0, 0, 0, 0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999 },
  modalContent: { backgroundColor: '#fff', padding: '32px', borderRadius: '16px', width: '450px', textAlign: 'center', boxShadow: '0 10px 25px rgba(0,0,0,0.2)', position: 'relative', zIndex: 10000 },
  quizQuestion: { fontWeight: 'bold', fontSize: '18px', margin: '24px 0', color: '#1e293b' },
  optionList: { display: 'flex', flexDirection: 'column', gap: '10px' },
  optionBtn: (isSelected, isCorrect, isAnswer) => ({
    padding: '14px', borderRadius: '10px', border: '1px solid #e2e8f0', cursor: 'pointer', width: '100%', fontSize: '15px', textAlign: 'left', transition: 'all 0.2s ease',
    backgroundColor: isSelected ? (isCorrect ? '#dcfce7' : '#fee2e2') : (isCorrect !== null && isAnswer ? '#dcfce7' : '#fff'),
    borderColor: isSelected ? (isCorrect ? '#22c55e' : '#ef4444') : '#e2e8f0',
    pointerEvents: isCorrect !== null ? 'none' : 'auto'
  }),
  resultText: (isCorrect) => ({ marginTop: '15px', color: isCorrect ? '#22c55e' : '#ef4444', fontWeight: 'bold' }),
  modalCloseBtn: { marginTop: '24px', padding: '10px 24px', backgroundColor: '#64748b', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }
};

export default MainPage;