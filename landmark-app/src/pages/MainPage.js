import React, { useEffect, useState, useRef, useCallback } from 'react';
import apiClient from '../api';
import { useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import Header from '../components/Header';

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

  const navigate = useNavigate();
  const chatEndRef = useRef(null);
  const fileInputRef = useRef(null);

  const fetchChatHistory = useCallback(async () => {
    try {
      const response = await apiClient.get('/api/ai/history');
      const data = response.data.data || response.data || [];

      if (Array.isArray(data)) {
        setChatHistory(data);
      } else {
        setChatHistory([]);
      }
    } catch (err) {
      console.error(err);
      setChatHistory([]);
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
    if (!token || token === "undefined") {
      navigate('/login');
    } else {
      fetchChatHistory();
    }
  }, [navigate, fetchChatHistory]);

  const handleAIChat = async () => {
    if (!selectedFile && !customPrompt) {
      alert("이미지를 선택하거나 질문을 입력해주세요.");
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
    if (tempFile) {
        formData.append('file', tempFile);
    }
    formData.append('prompt', tempPrompt || "이 문제를 설명해줘.");

    try {
      const res = await apiClient.post(`/api/ai/analyze`, formData);
      const data = res.data.data || res.data;

      setChatHistory(prev => {
        const updated = [...prev];
        const lastIndex = updated.length - 1;
        if (updated[lastIndex].isNew) {
            updated[lastIndex] = {
                ...updated[lastIndex],
                ...data,
                aiResponse: data.description,
                quizDto: data.quizDto,
                isNew: false
            };
        }
        return updated;
      });

    } catch (err) {
      console.error(err);
      alert("AI 분석 중 오류가 발생했습니다.");
      setChatHistory(prev => prev.slice(0, prev.length - 1));
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuizSubmit = async (option) => {
    if (!currentQuiz || !currentQuiz.quizId) {
      alert("퀴즈 정보를 찾을 수 없습니다.");
      return;
    }
    if (isCorrect !== null) return;

    setUserAnswer(option);

    const correct = option === currentQuiz.answer;
    setIsCorrect(correct);

    try {
      const response = await apiClient.post(`/api/ai/quiz/submit`, {
        quizId: currentQuiz.quizId,
        userAnswer: option
      });

      const updatedHistory = response.data.data;
      setChatHistory(updatedHistory);
    } catch (err) {
      console.error(err);
      alert("퀴즈 제출 중 오류가 발생했습니다.");
    }
  };

  return (
    <div style={styles.layout}>
      <Header />
      <div style={styles.content}>
        <div style={styles.chatWrapper}>
          <div style={styles.chatBox}>
            {chatHistory.map((chat, i) => (
              <React.Fragment key={i}>
                {chat?.userPrompt && (
                  <div style={styles.chatRow(true)}>
                    <div style={styles.bubble(true)}>
                      {chat.imageUrl && <img src={chat.imageUrl} alt="upload" style={styles.image} />}
                      <div>{chat.userPrompt}</div>
                    </div>
                  </div>
                )}

                {chat.aiResponse && (
                  <div style={styles.chatRow(false)}>
                    <div style={styles.bubble(false)}>
                      <div className="markdown-body">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {chat.aiResponse}
                        </ReactMarkdown>
                      </div>
                      {chat.quizDto && (
                        <button
                          onClick={() => {
                            setCurrentQuiz(chat.quizDto);
                            setShowQuiz(true);
                            setIsCorrect(null);
                            setUserAnswer(null);
                          }}
                          style={styles.quizOpenBtn}
                        >
                          📝 관련 퀴즈 풀기
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </React.Fragment>
            ))}
            {isLoading && (
              <div style={styles.chatRow(false)}>
                <div style={styles.bubble(false)}>AI가 분석 중입니다... ⏳</div>
              </div>
            )}
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

        {showQuiz && currentQuiz && (
          <div style={styles.modalOverlay}>
            <div style={styles.modalContent}>
              <h3 style={{color: '#4285F4'}}>🎯 AI 학습 퀴즈</h3>
              <p style={{fontWeight:'bold', fontSize:'17px', margin:'20px 0'}}>{currentQuiz.question}</p>
              <div style={{display:'flex', flexDirection:'column', gap:'10px'}}>
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
                <p style={{marginTop:'15px', color: isCorrect ? '#28a745' : '#dc3545', fontWeight:'bold'}}>
                  {isCorrect ? "정답입니다! 👏" : "틀렸습니다. 오답노트에 추가되었습니다."}
                </p>
              )}
              <button onClick={() => setShowQuiz(false)} style={styles.modalCloseBtn}>닫기</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  layout: { width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#f5f7fb' },
  content: { flex: 1, position: 'relative', overflow: 'hidden' },
  chatWrapper: { display: 'flex', flexDirection: 'column', height: '100%', maxWidth: '900px', margin: '0 auto', padding: '10px 20px 20px 20px' },
  chatBox: { flex: 1, overflowY: 'auto', padding: '20px', backgroundColor: '#fff', borderRadius: '20px', border: '1px solid #eef2f6', marginBottom: '10px', display: 'flex', flexDirection: 'column' },
  chatRow: (isUser) => ({ display: 'flex', justifyContent: isUser ? 'flex-end' : 'flex-start', marginBottom: '15px', width: '100%' }),
  bubble: (isUser) => ({ padding: '12px 18px', borderRadius: isUser ? '20px 20px 0 20px' : '20px 20px 20px 0', maxWidth: '80%', backgroundColor: isUser ? '#4285F4' : '#f1f3f5', color: isUser ? '#fff' : '#333', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', lineHeight: '1.6' }),
  image: { maxWidth: '100%', maxHeight: '300px', borderRadius: '10px', marginBottom: '10px', display: 'block' },
  quizOpenBtn: { marginTop: '10px', padding: '8px 12px', backgroundColor: '#fff', border: '1px solid #4285F4', color: '#4285F4', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' },
  inputArea: { display: 'flex', gap: '10px', backgroundColor: '#fff', padding: '10px 25px', borderRadius: '35px', boxShadow: '0 4px 15px rgba(0,0,0,0.08)', alignItems: 'center' },
  input: { flex: 1, border: 'none', outline: 'none', fontSize: '15px' },
  sendBtn: { padding: '10px 25px', backgroundColor: '#4285F4', color: '#fff', border: 'none', borderRadius: '25px', cursor: 'pointer', fontWeight: 'bold' },
  iconBtn: { background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer' },
  previewContainer: { position: 'relative', width: '60px', height: '60px', marginBottom: '10px', marginLeft: '10px' },
  smallPreview: { width: '100%', height: '100%', borderRadius: '8px', objectFit: 'cover', border: '2px solid #4285F4' },
  previewClose: { position: 'absolute', top: '-5px', right: '-5px', backgroundColor: '#ff4d4f', color: '#fff', border: 'none', borderRadius: '50%', width: '18px', height: '18px', fontSize: '12px', cursor: 'pointer' },
  modalOverlay: { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.4)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
  modalContent: { backgroundColor: '#fff', padding: '30px', borderRadius: '20px', width: '400px', textAlign: 'center' },
  optionBtn: (isSelected, isCorrect, isAnswer) => ({
    padding: '12px', borderRadius: '10px', border: '1px solid #ddd', cursor: 'pointer', width: '100%', marginBottom: '5px',
    backgroundColor: isSelected ? (isCorrect ? '#d4edda' : '#f8d7da') : (isCorrect !== null && isAnswer ? '#d4edda' : '#fff'),
    borderColor: isSelected ? (isCorrect ? '#28a745' : '#dc3545') : '#ddd'
  }),
  modalCloseBtn: { marginTop: '20px', padding: '8px 20px', backgroundColor: '#6c757d', color: '#fff', border: 'none', borderRadius: '10px', cursor: 'pointer' }
};

export default MainPage;