import React, { useState, useEffect } from 'react';
import apiClient from '../api';
import Header from '../components/Header';

const WrongNotePage = () => {
    const [wrongNotes, setWrongNotes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [retryQuiz, setRetryQuiz] = useState(null);
    const [retryAnswer, setRetryAnswer] = useState(null);
    const [isRetryCorrect, setIsRetryCorrect] = useState(null);

    useEffect(() => {
        fetchWrongNotes();
    }, []);

    const fetchWrongNotes = async () => {
        try {
            const response = await apiClient.get('/api/ai/notes/wrong');
            setWrongNotes(response.data.data || []);
        } catch (error) {
            if (error.response?.status === 401 || error.response?.status === 403) {
                alert("로그인이 만료되었거나 권한이 없습니다.");
            }
        } finally {
            setLoading(false);
        }
    };

    const openRetryModal = (note) => {
        setRetryQuiz(note);
        setRetryAnswer(null);
        setIsRetryCorrect(null);
    };

    const handleRetrySubmit = async (opt) => {
        if (isRetryCorrect !== null) return;
        setRetryAnswer(opt);
        const isCorrect = opt === retryQuiz.answer;
        setIsRetryCorrect(isCorrect);

        if (isCorrect) {
            try {
                await apiClient.delete(`/api/ai/notes/wrong/${retryQuiz.quiz_id}`);
                setWrongNotes(prevNotes => prevNotes.filter(note => note.quiz_id !== retryQuiz.quiz_id));
            } catch (error) {
                console.error("오답노트 삭제 실패:", error);
            }
        }
    };

    return (
        <div style={styles.layout}>
            <Header />
            <div style={styles.content}>
                <div style={styles.dashboard} className="dashboard-mobile">
                    <div style={styles.headerArea} className="header-area-mobile">
                        <h2 style={styles.title}>📝 나의 오답노트</h2>
                        <p style={styles.subtitle}>틀린 문제를 복습하고 완벽하게 내 것으로 만들어보세요!</p>
                    </div>
                    {!loading && (
                        <div style={styles.statBox} className="stat-box-mobile">
                            <span style={styles.statLabel}>현재 복습이 필요한 문제</span>
                            <span style={styles.statNumber}>{wrongNotes.length}개</span>
                        </div>
                    )}
                </div>

                {loading ? (
                    <div style={styles.emptyState}>데이터를 불러오는 중입니다... ⏳</div>
                ) : wrongNotes.length === 0 ? (
                    <div style={styles.emptyState}>
                        <div style={{ fontSize: '50px', marginBottom: '15px' }}>🎉</div>
                        <h3 style={{ color: '#1e293b', marginBottom: '10px' }}>복습할 문제가 없습니다!</h3>
                        <p style={{ color: '#64748b' }}>모든 문제를 완벽하게 이해하셨네요. 계속해서 화이팅입니다!</p>
                    </div>
                ) : (
                    <div style={styles.listContainer} className="list-container-mobile">
                        {wrongNotes.map((note, index) => (
                            <div key={`${note.quiz_id}-${index}`} style={styles.card} className="card-mobile">
                                <div style={styles.cardHeader}>
                                    <div style={styles.badgeGroup}>
                                        <span style={styles.badgeWrong}>오답</span>
                                        <span style={styles.date}>{note.created_at ? new Date(note.created_at).toLocaleDateString() : '날짜 없음'}</span>
                                    </div>
                                    <button onClick={() => openRetryModal(note)} style={styles.retryBtn}>🔄 다시 풀기</button>
                                </div>

                                <div style={styles.questionArea}>
                                    <span style={styles.qMark}>Q.</span> {note.question}
                                </div>

                                <div style={styles.answerGrid} className="answer-grid-mobile">
                                    <div style={styles.wrongAnswerBox}>
                                        <div style={styles.answerLabel}>❌ 내가 선택한 답</div>
                                        <div style={styles.answerTextWrong}>{note.user_wrong_answer}</div>
                                    </div>
                                    <div style={styles.correctAnswerBox}>
                                        <div style={styles.answerLabel}>✅ 올바른 정답</div>
                                        <div style={styles.answerTextCorrect}>{note.answer}</div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {retryQuiz && (
                    <div style={styles.modalOverlay}>
                        <div style={styles.modalContent}>
                            <div style={styles.modalHeader}>
                                <h3 style={{ margin: 0, color: '#1e293b' }}>🔄 복습 퀴즈</h3>
                                <button onClick={() => setRetryQuiz(null)} style={styles.closeIcon}>✕</button>
                            </div>


                            {retryQuiz.description && (
                                <div style={styles.descriptionSection}>
                                    <div style={styles.sectionLabel}>💡 학습 내용 다시보기</div>
                                    <div style={styles.descriptionText}>{retryQuiz.description}</div>
                                </div>
                            )}

                            <p style={styles.modalQuestion}>{retryQuiz.question}</p>
                            <div style={styles.optionList}>
                                {retryQuiz.options && retryQuiz.options.map((opt, idx) => (
                                    <button
                                        key={`option-${idx}`}
                                        onClick={() => handleRetrySubmit(opt)}
                                        style={styles.modalOptionBtn(retryAnswer === opt, isRetryCorrect, opt === retryQuiz.answer)}
                                    >
                                        {opt}
                                    </button>
                                ))}
                            </div>


                            {isRetryCorrect !== null && (
                                <div style={styles.feedbackBox(isRetryCorrect)}>
                                    <div style={{ marginBottom: '10px', fontSize: '16px' }}>
                                        {isRetryCorrect ? "✨ 완벽합니다! 정답을 맞혀 오답노트에서 제외됩니다." : "🤔 아쉽네요! 정답과 해설을 다시 확인해 보세요."}
                                    </div>
                                    {retryQuiz.explanation && (
                                        <div style={styles.explanationContent}>
                                            <div style={{ fontWeight: '800', marginBottom: '8px', color: isRetryCorrect ? '#15803d' : '#b91c1c' }}>📝 AI 해설</div>
                                            <div style={{ fontWeight: '500', lineHeight: '1.5', fontSize: '14px' }}>{retryQuiz.explanation}</div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
            <style>{`
                @media screen and (max-width: 768px) {
                    .dashboard-mobile {
                        flex-direction: column !important;
                        align-items: center !important;
                        text-align: center !important;
                        gap: 20px !important;
                    }
                    .header-area-mobile {
                        text-align: center !important;
                    }
                    .stat-box-mobile {
                        width: 100% !important;
                        align-items: center !important;
                        padding: 15px !important;
                    }
                    .list-container-mobile {
                        padding: 0 10px 50px 10px !important;
                    }
                    .card-mobile {
                        padding: 20px !important;
                        border-radius: 20px !important;
                    }
                    .answer-grid-mobile {
                        grid-template-columns: 1fr !important;
                        gap: 12px !important;
                    }
                }
            `}</style>
        </div>
    );
};

const styles = {
    layout: { width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#f8fafc' },
    content: { flex: 1, overflowY: 'auto', padding: '40px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center' },
    dashboard: { width: '100%', maxWidth: '850px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', flexWrap: 'wrap', gap: '20px' },
    headerArea: { textAlign: 'left' },
    title: { fontSize: '32px', color: '#1e293b', marginBottom: '8px', fontWeight: '900', letterSpacing: '-0.5px' },
    subtitle: { fontSize: '15px', color: '#64748b' },
    statBox: { backgroundColor: '#fff', padding: '20px 30px', borderRadius: '20px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.05)', border: '1px solid #f1f5f9', display: 'flex', flexDirection: 'column', alignItems: 'flex-end' },
    statLabel: { fontSize: '13px', color: '#94a3b8', fontWeight: 'bold', marginBottom: '4px' },
    statNumber: { fontSize: '28px', color: '#ef4444', fontWeight: '900' },
    listContainer: { width: '100%', maxWidth: '850px', display: 'flex', flexDirection: 'column', gap: '24px', paddingBottom: '50px' },
    card: { backgroundColor: '#fff', borderRadius: '24px', padding: '30px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' },
    cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9', paddingBottom: '16px', marginBottom: '20px' },
    badgeGroup: { display: 'flex', alignItems: 'center', gap: '12px' },
    badgeWrong: { backgroundColor: '#fef2f2', color: '#ef4444', padding: '6px 14px', borderRadius: '8px', fontSize: '13px', fontWeight: 'bold' },
    date: { fontSize: '13px', color: '#94a3b8', fontWeight: '500' },
    retryBtn: { padding: '8px 16px', backgroundColor: '#eff6ff', color: '#4285F4', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px', transition: 'background 0.2s' },
    questionArea: { fontSize: '18px', fontWeight: '700', color: '#0f172a', lineHeight: '1.6', marginBottom: '24px' },
    qMark: { color: '#4285F4', marginRight: '8px', fontSize: '22px' },
    answerGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' },
    wrongAnswerBox: { backgroundColor: '#fff', border: '1px solid #fca5a5', borderRadius: '16px', padding: '20px', borderLeft: '4px solid #ef4444' },
    correctAnswerBox: { backgroundColor: '#fff', border: '1px solid #86efac', borderRadius: '16px', padding: '20px', borderLeft: '4px solid #22c55e' },
    answerLabel: { fontSize: '13px', marginBottom: '12px', color: '#64748b', fontWeight: 'bold' },
    answerTextWrong: { fontSize: '15px', color: '#ef4444', fontWeight: '700', wordBreak: 'break-all', lineHeight: '1.5' },
    answerTextCorrect: { fontSize: '15px', color: '#22c55e', fontWeight: '700', wordBreak: 'break-all', lineHeight: '1.5' },
    emptyState: { textAlign: 'center', marginTop: '60px', padding: '60px', backgroundColor: '#fff', borderRadius: '24px', border: '1px dashed #cbd5e1', width: '100%', maxWidth: '850px' },

    modalOverlay: { position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999 },
    modalContent: { backgroundColor: '#fff', padding: '32px', borderRadius: '24px', width: '90%', maxWidth: '500px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', maxHeight: '90vh', overflowY: 'auto' },
    modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' },
    closeIcon: { background: 'none', border: 'none', fontSize: '20px', color: '#94a3b8', cursor: 'pointer' },
    descriptionSection: { backgroundColor: '#f1f5f9', padding: '16px', borderRadius: '16px', marginBottom: '24px', border: '1px solid #e2e8f0' },
    sectionLabel: { fontSize: '12px', fontWeight: '800', color: '#4285F4', marginBottom: '8px', textTransform: 'uppercase' },
    descriptionText: { fontSize: '14px', color: '#334155', lineHeight: '1.6', maxHeight: '120px', overflowY: 'auto', whiteSpace: 'pre-wrap' },
    modalQuestion: { fontWeight: '700', fontSize: '18px', color: '#1e293b', lineHeight: '1.5', marginBottom: '24px' },
    optionList: { display: 'flex', flexDirection: 'column', gap: '10px' },
    modalOptionBtn: (isSelected, isCorrect, isAnswer) => ({
        padding: '16px', borderRadius: '14px', border: '1px solid', cursor: 'pointer', fontSize: '15px', textAlign: 'left', fontWeight: '600', transition: 'all 0.2s',
        backgroundColor: isSelected ? (isCorrect ? '#f0fdf4' : '#fef2f2') : (isCorrect !== null && isAnswer ? '#f0fdf4' : '#fff'),
        borderColor: isSelected ? (isCorrect ? '#22c55e' : '#ef4444') : (isCorrect !== null && isAnswer ? '#22c55e' : '#e2e8f0'),
        color: isSelected ? (isCorrect ? '#166534' : '#991b1b') : '#334155'
    }),
    feedbackBox: (isCorrect) => ({ marginTop: '20px', padding: '20px', borderRadius: '20px', fontWeight: '500', fontSize: '14px', textAlign: 'left', backgroundColor: isCorrect ? '#f0fdf4' : '#fef2f2', border: `1px solid ${isCorrect ? '#86efac' : '#fca5a5'}` }),
    explanationContent: { marginTop: '12px', padding: '16px', backgroundColor: 'rgba(255, 255, 255, 0.5)', borderRadius: '12px', border: '1px dashed rgba(0, 0, 0, 0.1)' }
};

export default WrongNotePage;