import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api';
import Header from '../components/Header';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const PostWritePage = () => {
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [imageUrls, setImageUrls] = useState([]);
    const [viewMode, setViewMode] = useState('edit'); // 'edit' or 'preview'
    const navigate = useNavigate();
    const fileInputRef = React.useRef(null);

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);

        setUploading(true);
        try {
            const response = await apiClient.post('/api/posts/upload-image', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            const imageUrl = response.data.data;

            const markdownImage = `\n![이미지](${imageUrl})\n`;
            setContent(prev => prev + markdownImage);
            setImageUrls(prev => [...prev, imageUrl]);

            alert("이미지가 업로드되었습니다!");
        } catch (error) {
            console.error("이미지 업로드 실패:", error);
            alert("이미지 업로드에 실패했습니다.");
        } finally {
            setUploading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!title.trim() || !content.trim()) {
            alert("제목과 내용을 모두 입력해주세요.");
            return;
        }

        setSubmitting(true);
        try {
            await apiClient.post('/api/posts/create', { title, content, imageUrls });
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
                            <div style={styles.labelRow}>
                                <label style={styles.label}>내용</label>
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current.click()}
                                    disabled={uploading}
                                    style={styles.imageBtn}
                                >
                                    {uploading ? "업로드 중..." : "📷 이미지 추가"}
                                </button>
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleImageUpload}
                                    style={{ display: 'none' }}
                                    accept="image/*"
                                />
                            </div>
                            <div style={styles.tabGroup}>
                                <button
                                    type="button"
                                    onClick={() => setViewMode('edit')}
                                    style={viewMode === 'edit' ? styles.activeTab : styles.tab}
                                >
                                    ✍️ 작성하기
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setViewMode('preview')}
                                    style={viewMode === 'preview' ? styles.activeTab : styles.tab}
                                >
                                    👁️ 미리보기
                                </button>
                            </div>

                            <div style={styles.editorContainer}>
                                {viewMode === 'edit' ? (
                                    <textarea
                                        value={content}
                                        onChange={(e) => setContent(e.target.value)}
                                        placeholder="동료들과 나누고 싶은 내용을 입력하세요... (마크다운 지원)"
                                        style={styles.textarea}
                                    />
                                ) : (
                                    <div style={styles.previewContainer}>
                                        <div style={styles.previewContent}>
                                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                                {content ? content.replace(/\n/g, '  \n') : "*내용을 입력하면 여기에 미리보기가 표시됩니다.*"}
                                            </ReactMarkdown>
                                        </div>
                                    </div>
                                )}
                            </div>
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
    layout: {
        width: '100%',
        minHeight: '100vh',
        backgroundColor: '#f8fafc'
    },
    content: {
        maxWidth: '800px',
        margin: '0 auto',
        padding: '40px 20px 100px 20px',
        width: '100%',
        boxSizing: 'border-box'
    },
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
    labelRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingRight: '4px' },
    label: { fontSize: '14px', fontWeight: '700', color: '#475569', marginLeft: '4px' },
    imageBtn: {
        padding: '6px 12px',
        fontSize: '13px',
        backgroundColor: '#f1f5f9',
        color: '#475569',
        border: '1px solid #e2e8f0',
        borderRadius: '8px',
        cursor: 'pointer',
        fontWeight: 'bold',
        transition: 'all 0.2s',
        ":hover": { backgroundColor: '#e2e8f0' }
    },
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
    editorContainer: {
        display: 'flex',
        flexDirection: 'column',
        minHeight: '400px'
    },
    tabGroup: {
        display: 'flex',
        gap: '10px',
        borderBottom: '1px solid #e2e8f0',
        marginBottom: '10px'
    },
    tab: {
        padding: '10px 20px',
        cursor: 'pointer',
        fontSize: '14px',
        fontWeight: 'bold',
        color: '#64748b',
        background: 'none',
        border: 'none',
        borderBottom: '2px solid transparent',
        transition: 'all 0.2s'
    },
    activeTab: {
        padding: '10px 20px',
        cursor: 'pointer',
        fontSize: '14px',
        fontWeight: 'bold',
        color: '#4285F4',
        background: 'none',
        border: 'none',
        borderBottom: '2px solid #4285F4'
    },
    textarea: {
        padding: '18px',
        borderRadius: '12px',
        border: '1px solid #e2e8f0',
        fontSize: '16px',
        minHeight: '400px',
        resize: 'none',
        outline: 'none',
        backgroundColor: '#f9fafb',
        lineHeight: '1.6',
        fontFamily: 'inherit'
    },
    previewContainer: {
        padding: '18px',
        borderRadius: '12px',
        border: '1px solid #e2e8f0',
        backgroundColor: '#fff',
        minHeight: '400px'
    },
    previewLabel: {
        fontSize: '12px',
        fontWeight: 'bold',
        color: '#94a3b8',
        marginBottom: '10px',
        textTransform: 'uppercase',
        letterSpacing: '0.05em'
    },
    previewContent: {
        fontSize: '16px',
        lineHeight: '1.6',
        color: '#334155',
        '& img': { maxWidth: '100%', borderRadius: '8px' }
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