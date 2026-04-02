import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api';
import Header from '../components/Header';

const PostWritePage = () => {
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!title.trim() || !content.trim()) {
            alert("제목과 내용을 모두 입력해주세요.");
            return;
        }

        setSubmitting(true);
        try {
            await apiClient.post('/api/posts/create', { title, content });
            alert("게시글이 등록되었습니다! 🎉");
            navigate('/board');
        } catch (error) {
            console.error("글 등록 실패:", error);
            alert("게시글 등록에 실패했습니다.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div style={styles.layout}>
            <Header />
            <div style={styles.content}>
                <div style={styles.formContainer}>
                    <div style={styles.headerArea}>
                        <h2 style={styles.title}>✍️ 새 글 작성하기</h2>
                        <p style={styles.subtitle}>학습 질문이나 지식을 자유롭게 공유해보세요.</p>
                    </div>

                    <form onSubmit={handleSubmit} style={styles.form}>
                        <div style={styles.inputGroup}>
                            <label style={styles.label}>제목</label>
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="제목을 입력하세요"
                                style={styles.input}
                            />
                        </div>

                        <div style={styles.inputGroup}>
                            <label style={styles.label}>내용</label>
                            <textarea
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                placeholder="동료들과 나누고 싶은 내용을 입력하세요..."
                                style={styles.textarea}
                            />
                        </div>

                        <div style={styles.btnGroup}>
                            <button
                                type="button"
                                onClick={() => navigate('/board')}
                                style={styles.cancelBtn}
                            >
                                취소
                            </button>
                            <button
                                type="submit"
                                disabled={submitting}
                                style={styles.submitBtn}
                            >
                                {submitting ? "등록 중..." : "등록하기"}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

const styles = {
    layout: { width: '100vw', minHeight: '100vh', backgroundColor: '#f8fafc' },
    content: { maxWidth: '800px', margin: '0 auto', padding: '40px 20px' },
    formContainer: {
        backgroundColor: '#fff',
        padding: '40px',
        borderRadius: '24px',
        boxShadow: '0 10px 25px -5px rgba(0,0,0,0.05)',
        border: '1px solid #e2e8f0'
    },
    headerArea: { marginBottom: '32px' },
    title: { fontSize: '26px', fontWeight: '800', color: '#1e293b' },
    subtitle: { color: '#64748b', marginTop: '8px', fontSize: '15px' },
    form: { display: 'flex', flexDirection: 'column', gap: '24px' },
    inputGroup: { display: 'flex', flexDirection: 'column', gap: '8px' },
    label: { fontSize: '14px', fontWeight: '700', color: '#475569', marginLeft: '4px' },
    input: {
        padding: '14px 18px',
        borderRadius: '12px',
        border: '1px solid #e2e8f0',
        fontSize: '16px',
        outline: 'none',
        backgroundColor: '#f9fafb',
        transition: 'border 0.2s',
        ":focus": { border: '1px solid #4285F4' }
    },
    textarea: {
        padding: '18px',
        borderRadius: '12px',
        border: '1px solid #e2e8f0',
        fontSize: '16px',
        minHeight: '300px',
        resize: 'vertical',
        outline: 'none',
        backgroundColor: '#f9fafb',
        lineHeight: '1.6'
    },
    btnGroup: { display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '10px' },
    cancelBtn: {
        padding: '12px 24px',
        backgroundColor: '#fff',
        color: '#64748b',
        border: '1px solid #e2e8f0',
        borderRadius: '10px',
        fontWeight: 'bold',
        cursor: 'pointer'
    },
    submitBtn: {
        padding: '12px 32px',
        backgroundColor: '#4285F4',
        color: '#fff',
        border: 'none',
        borderRadius: '10px',
        fontWeight: 'bold',
        cursor: 'pointer',
        boxShadow: '0 4px 6px -1px rgba(66, 133, 244, 0.3)'
    }
};

export default PostWritePage;