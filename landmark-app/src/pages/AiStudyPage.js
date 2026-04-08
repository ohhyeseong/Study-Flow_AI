import React, { useState, useEffect } from 'react';
import apiClient from '../api';

function AIStudyPage() {
    const [file, setFile] = useState(null);
    const [prompt, setPrompt] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [history, setHistory] = useState([]);
    const [wrongNotes, setWrongNotes] = useState([]);
    const [activeTab, setActiveTab] = useState("analyze");

    const [currentQuiz, setCurrentQuiz] = useState(null);
    const [userAnswer, setUserAnswer] = useState("");

    useEffect(() => {
        if (activeTab === "history") fetchHistory();
        if (activeTab === "notes") fetchWrongNotes();
    }, [activeTab]);

    const handleAnalyze = async () => {
        if (!prompt) return alert("질문을 입력해주세요!");
        setIsLoading(true);

        const formData = new FormData();
        if (file) formData.append("file", file);
        formData.append("prompt", prompt);

        try {
            const response = await apiClient.post('/api/ai/analyze', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            alert("분석 완료!");
            processAiResponse(response.data.aiResponse);
            fetchHistory();
        } catch (err) {
            alert("분석 실패: " + err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const processAiResponse = (fullText) => {
        if (fullText.includes("###QUIZ###")) {
            const [desc, quizPart] = fullText.split("###QUIZ###");
            try {
                const quizData = JSON.parse(quizPart.trim());
                setCurrentQuiz(quizData);
            } catch (e) { console.error("퀴즈 파싱 실패"); }
        }
    };

    const handleQuizSubmit = async (quizId) => {
        try {
            const response = await api.post('/quiz/submit', {
                quizId: quizId,
                userAnswer: userAnswer
            });
            alert("제출되었습니다!");
            setHistory(response.data);
            setCurrentQuiz(null);
            setUserAnswer("");
        } catch (err) { alert("제출 실패"); }
    };

    const fetchHistory = async () => {
        const res = await api.get('/history');
        setHistory(res.data);
    };

    const fetchWrongNotes = async () => {
        const res = await api.get('/notes/wrong');
        setWrongNotes(res.data);
    };

    return (
        <div style={containerStyle}>
            <h2 style={{ textAlign: 'center', color: '#4A90E2' }}>🎓 AI Study Flow Tutor</h2>

            {/* 탭 메뉴 */}
            <div style={tabContainerStyle}>
                <button onClick={() => setActiveTab("analyze")} style={tabStyle(activeTab === "analyze")}>이미지 분석</button>
                <button onClick={() => setActiveTab("history")} style={tabStyle(activeTab === "history")}>학습 기록</button>
                <button onClick={() => setActiveTab("notes")} style={tabStyle(activeTab === "notes")}>오답 노트</button>
            </div>

            {/* 분석 탭 */}
            {activeTab === "analyze" && (
                <div style={cardStyle}>
                    <h3>📘 새로운 개념 공부하기</h3>
                    <input type="file" onChange={(e) => setFile(e.target.files[0])} style={inputStyle} />
                    <textarea
                        placeholder="공부하고 싶은 내용을 적거나 이미지에 대해 질문하세요."
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        style={{ ...inputStyle, height: '100px', resize: 'none' }}
                    />
                    <button
                        onClick={handleAnalyze}
                        disabled={isLoading}
                        style={analyzeButtonStyle}
                    >
                        {isLoading ? "AI가 분석 중..." : "AI 선생님께 물어보기 ✨"}
                    </button>
                </div>
            )}

            {/* 히스토리 탭 */}
            {activeTab === "history" && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    {history.map(item => (
                        <div key={item.id} style={cardStyle}>
                            <small>{new Date(item.createdAt).toLocaleString()}</small>
                            <h4 style={{ margin: '10px 0' }}>Q: {item.userPrompt}</h4>
                            <p style={responseTextStyle}>{item.aiResponse}</p>
                            {/* 여기서 퀴즈가 있는 경우 풀기 버튼 등을 추가할 수 있습니다 */}
                        </div>
                    ))}
                </div>
            )}

            {/* 오답 노트 탭 */}
            {activeTab === "notes" && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    {wrongNotes.length === 0 && <p style={{textAlign:'center'}}>아직 틀린 문제가 없어요! 훌륭합니다. 👍</p>}
                    {wrongNotes.map((note, idx) => (
                        <div key={idx} style={{ ...cardStyle, borderLeft: '5px solid #ff4d4f' }}>
                            <h4 style={{color: '#d32f2f'}}>틀린 문제: {note.question}</h4>
                            <ul style={{ listStyle: 'none', padding: 0 }}>
                                {note.options.map((opt, i) => (
                                    <li key={i} style={{ padding: '5px', color: opt === note.correctAnswer ? 'green' : 'inherit' }}>
                                        {i + 1}. {opt} {opt === note.correctAnswer && " (정답)"}
                                        {opt === note.userWrongAnswer && <span style={{color:'red'}}> ← 내가 고른 답</span>}
                                    </li>
                                ))}
                            </ul>
                            <p style={{fontSize: '12px', color: '#666'}}>학습일: {new Date(note.createdAt).toLocaleDateString()}</p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

// --- Styles ---
const containerStyle = { padding: '80px 20px', maxWidth: '800px', margin: '0 auto', fontFamily: 'sans-serif' };
const tabContainerStyle = { display: 'flex', justifyContent: 'center', gap: '10px', marginBottom: '20px' };
const tabStyle = (active) => ({
    padding: '10px 20px', borderRadius: '20px', border: 'none', cursor: 'pointer',
    backgroundColor: active ? '#4A90E2' : '#f0f0f0', color: active ? 'white' : '#333', fontWeight: 'bold', transition: '0.3s'
});
const cardStyle = { backgroundColor: 'white', padding: '20px', borderRadius: '15px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', marginBottom: '20px' };
const inputStyle = { width: '100%', padding: '12px', marginBottom: '10px', borderRadius: '8px', border: '1px solid #ddd', boxSizing: 'border-box' };
const analyzeButtonStyle = { width: '100%', padding: '15px', backgroundColor: '#4A90E2', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' };
const responseTextStyle = { backgroundColor: '#f9f9f9', padding: '15px', borderRadius: '8px', whiteSpace: 'pre-wrap', lineHeight: '1.6', fontSize: '14px' };

export default AIStudyPage;