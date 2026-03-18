import React, { useState, useEffect } from 'react';
import apiClient from '../api';
import Header from '../components/Header';
import '../App.css';

const WrongNotePage = () => {
    const [wrongNotes, setWrongNotes] = useState([]);
    const [loading, setLoading] = useState(true);

    // 다시 풀기 모달 상태 관리
    const [retryQuiz, setRetryQuiz] = useState(null);
    const [retryAnswer, setRetryAnswer] = useState(null);
    const [isRetryCorrect, setIsRetryCorrect] = useState(null);

    useEffect(() => {
        fetchWrongNotes();
    }, []);

    const fetchWrongNotes = async () => {
        try {
            const response = await apiClient.get('/api/ai/notes/wrong');
            setWrongNotes(response.data.data);
            setLoading(false);
        } catch (error) {
            console.error("오답노트 로딩 실패:", error);
            if (error.response?.status === 401 || error.response?.status === 403) {
                alert("로그인이 만료되었거나 권한이 없습니다.");
            } else {
                alert("오답노트를 불러오지 못했습니다.");
            }
            setLoading(false);
        }
    };

    // 다시 풀기 모달 열기
    const openRetryModal = (note) => {
        setRetryQuiz(note);
        setRetryAnswer(null);
        setIsRetryCorrect(null);
    };

    const handleRetrySubmit = async (opt) => {
            if (isRetryCorrect !== null) return;

            setRetryAnswer(opt);
            const isCorrect = opt === retryQuiz.correctAnswer;
            setIsRetryCorrect(isCorrect);

            if (isCorrect) {
                try {
                    await apiClient.delete(`/api/ai/notes/wrong/${retryQuiz.quizId}`);

                    setWrongNotes(prevNotes => prevNotes.filter(note => note.quizId !== retryQuiz.quizId));
                } catch (error) {
                    console.error("오답노트 삭제 실패:", error);
                }
            }
        };

    return (
        <div style={styles.layout}>
            <Header />
            <div style={styles.content}>
                <div style={styles.headerArea}>
                    <h2 style={styles.title}>📝 나의 오답노트</h2>
                    <p style={styles.subtitle}>틀린 문제를 복습하고 완벽하게 내 것으로 만들어보세요!</p>
                </div>

                {loading ? (
                    <div style={styles.emptyState}>로딩 중... ⏳</div>
                ) : wrongNotes.length === 0 ? (
                    <div style={styles.emptyState}>
                        <h3 style={{ color: '#4285F4' }}>아직 틀린 문제가 없습니다!</h3>
                        <p>완벽하시네요! 계속해서 화이팅입니다 👍</p>
                    </div>
                ) : (
                    <div style={styles.listContainer}>
                        {wrongNotes.map((note) => (
                            <div key={note.quizId} style={styles.card}>
                                <div style={styles.cardHeader}>
                                    <span style={styles.badge}>오답</span>
                                    {/* DTO에 맞춰 note.createdAt 으로 수정 */}
                                    <span style={styles.date}>{new Date(note.createdAt).toLocaleDateString()}</span>
                                </div>

                                <div style={styles.questionArea}>
                                    <span style={styles.qMark}>Q.</span> {note.question}
                                </div>

                                <div style={styles.answerGrid}>
                                    <div style={styles.wrongAnswerBox}>
                                        <div style={styles.answerLabel}>❌ 내가 쓴 답</div>
                                        {/* DTO에 맞춰 note.userWrongAnswer 로 수정 */}
                                        <div style={styles.answerTextWrong}>{note.userWrongAnswer}</div>
                                    </div>
                                    <div style={styles.correctAnswerBox}>
                                        <div style={styles.answerLabel}>✅ 정답</div>
                                        <div style={styles.answerTextCorrect}>{note.correctAnswer}</div>
                                    </div>
                                </div>

                                {/* 다시 풀기 버튼 추가 */}
                                <div style={{ textAlign: 'right', marginTop: '10px' }}>
                                    <button
                                        onClick={() => openRetryModal(note)}
                                        style={styles.retryBtn}
                                    >
                                        🔄 다시 풀기
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* 다시 풀기 모달 창 */}
                {retryQuiz && (
                    <div style={styles.modalOverlay}>
                        <div style={styles.modalContent}>
                            <h3 style={{ color: '#4285F4' }}>🔄 다시 풀기</h3>
                            <p style={{ fontWeight: 'bold', fontSize: '17px', margin: '20px 0' }}>
                                {retryQuiz.question}
                            </p>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                {retryQuiz.options && retryQuiz.options.map((opt, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => handleRetrySubmit(opt)}
                                        style={styles.modalOptionBtn(
                                            retryAnswer === opt,
                                            isRetryCorrect,
                                            opt === retryQuiz.correctAnswer
                                        )}
                                    >
                                        {opt}
                                    </button>
                                ))}
                            </div>

                            {isRetryCorrect !== null && (
                                <p style={{
                                    marginTop: '15px',
                                    color: isRetryCorrect ? '#28a745' : '#dc3545',
                                    fontWeight: 'bold'
                                }}>
                                    {isRetryCorrect ? "정답입니다! 완벽히 이해하셨네요 👏" : "다시 한 번 고민해 볼까요? 🤔"}
                                </p>
                            )}

                            <button
                                onClick={() => setRetryQuiz(null)}
                                style={styles.modalCloseBtn}
                            >
                                닫기
                            </button>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
};

const styles = {
    layout: { width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#f5f7fb' },
    content: { flex: 1, overflowY: 'auto', padding: '30px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center' },
    headerArea: { textAlign: 'center', marginBottom: '30px' },
    title: { fontSize: '28px', color: '#333', marginBottom: '10px', fontWeight: '800' },
    subtitle: { fontSize: '15px', color: '#666' },
    listContainer: { width: '100%', maxWidth: '800px', display: 'flex', flexDirection: 'column', gap: '20px', paddingBottom: '40px' },
    card: { backgroundColor: '#fff', borderRadius: '16px', padding: '25px', boxShadow: '0 4px 15px rgba(0,0,0,0.03)', display: 'flex', flexDirection: 'column', gap: '15px', border: '1px solid #eef2f6' },
    cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f3f5', paddingBottom: '10px' },
    badge: { backgroundColor: '#ffeaea', color: '#dc3545', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold' },
    date: { fontSize: '13px', color: '#999' },
    questionArea: { fontSize: '18px', fontWeight: 'bold', color: '#2c3e50', lineHeight: '1.5', marginTop: '5px' },
    qMark: { color: '#4285F4', marginRight: '5px', fontSize: '20px' },
    answerGrid: { display: 'flex', gap: '15px', marginTop: '10px' },
    wrongAnswerBox: { flex: 1, backgroundColor: '#fff5f5', border: '1px solid #ffc9c9', borderRadius: '10px', padding: '15px' },
    correctAnswerBox: { flex: 1, backgroundColor: '#f0fdf4', border: '1px solid #c3e6cb', borderRadius: '10px', padding: '15px' },
    answerLabel: { fontSize: '13px', marginBottom: '8px', color: '#555', fontWeight: 'bold' },
    answerTextWrong: { fontSize: '16px', color: '#dc3545', fontWeight: 'bold', wordBreak: 'break-all' },
    answerTextCorrect: { fontSize: '16px', color: '#28a745', fontWeight: 'bold', wordBreak: 'break-all' },
    emptyState: { textAlign: 'center', marginTop: '50px', color: '#888', padding: '40px', backgroundColor: '#fff', borderRadius: '16px', border: '1px dashed #ddd' },

    // 버튼 스타일
    retryBtn: { padding: '8px 16px', backgroundColor: '#fff', color: '#4285F4', border: '1px solid #4285F4', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px', transition: 'all 0.2s' },

    // 모달 스타일
    modalOverlay: { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.4)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
    modalContent: { backgroundColor: '#fff', padding: '30px', borderRadius: '20px', width: '400px', textAlign: 'center', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' },
    modalOptionBtn: (isSelected, isCorrect, isAnswer) => ({
        padding: '12px', borderRadius: '10px', border: '1px solid #ddd', cursor: 'pointer', width: '100%', marginBottom: '5px', fontSize: '15px',
        backgroundColor: isSelected ? (isCorrect ? '#d4edda' : '#f8d7da') : (isCorrect !== null && isAnswer ? '#d4edda' : '#fff'),
        borderColor: isSelected ? (isCorrect ? '#28a745' : '#dc3545') : '#ddd'
    }),
    modalCloseBtn: { marginTop: '20px', padding: '10px 25px', backgroundColor: '#6c757d', color: '#fff', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold' }
};

export default WrongNotePage;