import React, { useEffect, useState, useRef } from 'react';
import apiClient from '../api';
import { useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

function MainPage() {
  const [viewMode, setViewMode] = useState('ai');
  const [chatHistory, setChatHistory] = useState([]);
  const [customPrompt, setCustomPrompt] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [mapObj, setMapObj] = useState(null);

  // 퀴즈 상태
  const [showQuiz, setShowQuiz] = useState(false);
  const [currentQuiz, setCurrentQuiz] = useState(null);
  const [userAnswer, setUserAnswer] = useState(null);
  const [isCorrect, setIsCorrect] = useState(null);

  const navigate = useNavigate();
  const chatEndRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token || token === "undefined") {
      navigate('/login');
    } else {
      fetchChatHistory(token);
    }
  }, [navigate]);

  const fetchChatHistory = async (token) => {
    try {
      const cleanToken = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
      const response = await apiClient.get('/api/ai/history', {
        headers: { Authorization: cleanToken }
      });
      setChatHistory(response.data);
    } catch (err) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        localStorage.removeItem('token');
        navigate('/login');
      }
    }
  };

  const parseQuiz = (text) => {
    if (!text) return null;
    try {
      const quizMatch = text.match(/###QUIZ###\s*({.*})\s*###QUIZ###/s);
      return quizMatch ? JSON.parse(quizMatch[1]) : null;
    } catch (e) { return null; }
  };

  const handleAIChat = async () => {
    if (!selectedFile || isLoading) {
      alert("이미지를 선택하고 질문을 입력해주세요.");
      return;
    }

    const token = localStorage.getItem('token');
    const cleanToken = token.startsWith('Bearer ') ? token : `Bearer ${token}`;

    // 전송 전 데이터 백업
    const tempFile = selectedFile;
    const tempPrompt = customPrompt;
    const tempPreview = previewUrl;

    // 1. 🟢 전송 즉시 UI 초기화
    setCustomPrompt("");
    setSelectedFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";

    setChatHistory(prev => [...prev, { role: 'user', content: tempPrompt, image: tempPreview }]);
    setIsLoading(true);

    const formData = new FormData();
    formData.append('file', tempFile);
    formData.append('prompt', tempPrompt || "이 문제를 설명해줘.");

    try {
      const res = await apiClient.post(`/api/ai/analyze`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      // 백엔드 로그 기반 키값 매칭
      const aiContent = res.data.ai_response || res.data.aiResponse || res.data.content;
      if (aiContent) {
        setChatHistory(prev => [...prev, { role: 'ai', content: aiContent }]);
      }
    } catch (err) {
      console.error("분석 실패 상세:", err);
      if (err.response?.status === 403) {
        alert("보안 정책(403)으로 응답을 읽을 수 없습니다. 로그아웃 후 다시 시도하거나 서버 CORS 설정을 확인하세요.");
      } else {
        alert("AI 분석 중 오류가 발생했습니다.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={styles.layout}>
      {/* 상단바 */}
      <div style={styles.navBar}>
        <div style={styles.logo}>StudyFlow AI</div>
        <div style={styles.navRight}>
          <button onClick={() => setViewMode('ai')} style={styles.tabBtn(viewMode === 'ai')}>💬 AI 채팅</button>
          <button onClick={() => setViewMode('map')} style={styles.tabBtn(viewMode === 'map')}>🗺️ 스터디 맵</button>
          <button onClick={() => { localStorage.removeItem('token'); navigate('/login'); }} style={styles.logoutBtn}>로그아웃</button>
        </div>
      </div>

      <div style={styles.content}>
        {viewMode === 'ai' && (
          <div style={styles.chatWrapper}>
            <div style={styles.chatBox}>
              {chatHistory.map((chat, i) => {
                const rawContent = chat.content || chat.ai_response || chat.aiResponse;
                const quizData = parseQuiz(rawContent);
                return (
                  <div key={i} style={styles.chatRow(chat.role || (chat.userId ? 'ai' : 'user'))}>
                    <div style={styles.bubble(chat.role || (chat.userId ? 'ai' : 'user'))}>
                      {chat.image && <img src={chat.image} alt="upload" style={styles.image} />}
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {rawContent?.replace(/###QUIZ###.*###QUIZ###/s, '')}
                      </ReactMarkdown>
                      {quizData && (
                        <button
                          onClick={() => { setCurrentQuiz(quizData); setShowQuiz(true); setIsCorrect(null); setUserAnswer(null); }}
                          style={styles.quizOpenBtn}
                        >
                          📝 관련 퀴즈 풀기
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
              <div ref={chatEndRef} />
            </div>

            {previewUrl && (
              <div style={styles.previewContainer}>
                <img src={previewUrl} alt="preview" style={styles.smallPreview} />
                <button onClick={() => {setSelectedFile(null); setPreviewUrl(null);}} style={styles.previewClose}>×</button>
              </div>
            )}

            <div style={styles.inputArea}>
              <input type="file" ref={fileInputRef} onChange={(e) => {
                const file = e.target.files[0];
                if(file) { setSelectedFile(file); setPreviewUrl(URL.createObjectURL(file)); }
              }} style={{display:'none'}} />
              <button onClick={() => fileInputRef.current.click()} style={styles.iconBtn}>📎</button>
              <input style={styles.input} value={customPrompt} onChange={(e) => setCustomPrompt(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && !isLoading && handleAIChat()} placeholder="질문을 입력하세요..." />
              <button onClick={handleAIChat} style={styles.sendBtn} disabled={isLoading}>{isLoading ? "..." : "전송"}</button>
            </div>
          </div>
        )}

        {/* 퀴즈 모달 */}
        {showQuiz && currentQuiz && (
          <div style={styles.modalOverlay}>
            <div style={styles.modalContent}>
              <h3 style={{color: '#4285F4'}}>🎯 AI 학습 퀴즈</h3>
              <p style={{fontWeight:'bold', fontSize:'17px', margin:'20px 0'}}>{currentQuiz.question}</p>
              <div style={{display:'flex', flexDirection:'column', gap:'10px'}}>
                {currentQuiz.options.map((opt, idx) => (
                  <button
                    key={idx}
                    onClick={() => { setUserAnswer(opt); setIsCorrect(opt === currentQuiz.answer); }}
                    style={styles.optionBtn(userAnswer === opt, isCorrect, opt === currentQuiz.answer)}
                  >
                    {opt}
                  </button>
                ))}
              </div>
              {isCorrect !== null && (
                <p style={{marginTop:'15px', color: isCorrect ? '#28a745' : '#dc3545', fontWeight:'bold'}}>
                  {isCorrect ? "정답입니다! 👏" : `틀렸습니다. 정답: ${currentQuiz.answer}`}
                </p>
              )}
              <button onClick={() => setShowQuiz(false)} style={styles.modalCloseBtn}>닫기</button>
            </div>
          </div>
        )}

        <div id="map" style={{ width: '100%', height: '100%', display: viewMode === 'map' ? 'block' : 'none' }}></div>
      </div>
    </div>
  );
}

const styles = {
  layout: { width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#f5f7fb' },
  navBar: { display: 'flex', justifyContent: 'space-between', padding: '15px 40px', backgroundColor: '#fff', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', zIndex: 100 },
  logo: { fontSize: '22px', fontWeight: 'bold', color: '#4285F4' },
  navRight: { display: 'flex', gap: '15px' },
  content: { flex: 1, position: 'relative', overflow: 'hidden' },
  chatWrapper: { display: 'flex', flexDirection: 'column', height: '100%', maxWidth: '850px', margin: '0 auto', padding: '20px' },
  chatBox: { flex: 1, overflowY: 'auto', padding: '20px', backgroundColor: '#fff', borderRadius: '20px', border: '1px solid #eef2f6', marginBottom: '10px' },
  chatRow: (role) => ({ display: 'flex', justifyContent: role === 'user' ? 'flex-end' : 'flex-start', marginBottom: '15px' }),
  bubble: (role) => ({ padding: '12px 18px', borderRadius: '18px', maxWidth: '80%', backgroundColor: role === 'user' ? '#4285F4' : '#f1f3f5', color: role === 'user' ? '#fff' : '#333' }),
  quizOpenBtn: { marginTop: '10px', padding: '8px 12px', backgroundColor: '#fff', border: '1px solid #4285F4', color: '#4285F4', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' },
  inputArea: { display: 'flex', gap: '10px', backgroundColor: '#fff', padding: '10px 20px', borderRadius: '35px', boxShadow: '0 4px 15px rgba(0,0,0,0.08)' },
  input: { flex: 1, border: 'none', outline: 'none' },
  sendBtn: { padding: '8px 20px', backgroundColor: '#4285F4', color: '#fff', border: 'none', borderRadius: '20px', cursor: 'pointer' },
  previewContainer: { position: 'relative', width: '60px', height: '60px', marginBottom: '10px', marginLeft: '10px' },
  smallPreview: { width: '100%', height: '100%', borderRadius: '8px', objectFit: 'cover', border: '2px solid #4285F4' },
  previewClose: { position: 'absolute', top: '-5px', right: '-5px', backgroundColor: '#ff4d4f', color: '#fff', border: 'none', borderRadius: '50%', width: '18px', height: '18px', fontSize: '12px', cursor: 'pointer' },
  tabBtn: (active) => ({ padding: '10px 15px', backgroundColor: active ? '#4285F4' : 'transparent', color: active ? '#fff' : '#555', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold' }),
  logoutBtn: { padding: '8px 15px', backgroundColor: '#ff4d4f', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer' },
  image: { maxWidth: '100%', borderRadius: '10px', marginBottom: '10px' },
  iconBtn: { background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer' },
  // 모달 스타일
  modalOverlay: { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.4)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
  modalContent: { backgroundColor: '#fff', padding: '30px', borderRadius: '20px', width: '400px', textAlign: 'center', boxShadow: '0 10px 25px rgba(0,0,0,0.2)' },
  optionBtn: (isSelected, isCorrect, isAnswer) => ({
    padding: '12px', borderRadius: '10px', border: '1px solid #ddd', cursor: 'pointer',
    backgroundColor: isSelected ? (isCorrect ? '#d4edda' : '#f8d7da') : (isCorrect !== null && isAnswer ? '#d4edda' : '#fff'),
    borderColor: isSelected ? (isCorrect ? '#28a745' : '#dc3545') : '#ddd'
  }),
  modalCloseBtn: { marginTop: '20px', padding: '8px 20px', backgroundColor: '#6c757d', color: '#fff', border: 'none', borderRadius: '10px', cursor: 'pointer' }
};

export default MainPage;