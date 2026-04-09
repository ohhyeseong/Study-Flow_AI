import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import apiClient from '../api';
import Header from '../components/Header';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const PostDetailPage = () => {
    const { postId } = useParams();
    const navigate = useNavigate();
    const currentUsername = localStorage.getItem('username');
    const location = useLocation();

    const checkAuthAndRedirect = () => {
        const token = localStorage.getItem('accessToken');
        if (!token) {
            alert("로그인이 필요한 서비스입니다.");
            navigate('/login', { state: { from: location } });
            return false;
        }
        return true;
    };

    const [post, setPost] = useState(null);
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState('');
    const [loading, setLoading] = useState(true);

    const [isEditingPost, setIsEditingPost] = useState(false);
    const [editTitle, setEditTitle] = useState('');
    const [editContent, setEditContent] = useState('');

    const [replyingTo, setReplyingTo] = useState(null);
    const [replyText, setReplyText] = useState('');
    const [editingCommentId, setEditingCommentId] = useState(null);
    const [editCommentText, setEditCommentText] = useState('');

    const fetchData = useCallback(async () => {
        try {
            const pRes = await apiClient.get(`/api/posts/${postId}`);
            const postData = pRes.data.data;
            setPost(postData);

            setComments(postData.comments || []);

            setEditTitle(postData.title);
            setEditContent(postData.content);
            setLoading(false);
        } catch (e) {
            navigate('/board');
        }
    }, [postId, navigate]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleUpdatePost = async () => {
        try {
            await apiClient.patch(`/api/posts/${postId}`, { title: editTitle, content: editContent });
            setIsEditingPost(false);
            fetchData();
        } catch (e) { alert("수정 실패"); }
    };

    const handleDeletePost = async () => {
        if (!window.confirm("정말 삭제하시겠습니까?")) return;
        try {
            await apiClient.delete(`/api/posts/${postId}`);
            navigate('/board');
        } catch (e) { alert("삭제 실패"); }
    };

    const handleToggleLike = async () => {
        if (!checkAuthAndRedirect()) return;
        try {
            const res = await apiClient.post(`/api/posts/${postId}/like`);
            const isNowLiked = res.data.data;
            setPost(prev => ({
                ...prev,
                isLiked: isNowLiked,
                likeCount: isNowLiked ? prev.likeCount + 1 : prev.likeCount - 1
            }));
        } catch (error) {
            alert("좋아요 처리에 실패했습니다.");
        }
    };

    const handleCommentSubmit = async (e) => {
        e.preventDefault();
        if (!newComment.trim()) return;
        try {
            await apiClient.post(`/api/posts/${postId}/comments`, { content: newComment });
            setNewComment('');
            fetchData();
        } catch (e) { alert("댓글 등록 실패"); }
    };

    const handleReplySubmit = async (parentId) => {
        if (!replyText.trim()) return;
        try {
            await apiClient.post(`/api/posts/${postId}/comments`, {
                content: replyText,
                parentId: parentId
            });
            setReplyText('');
            setReplyingTo(null);
            fetchData();
        } catch (e) { alert("대댓글 등록 실패"); }
    };

    const handleUpdateComment = async (commentId) => {
        try {
            await apiClient.patch(`/api/posts/${postId}/comments/${commentId}`, { content: editCommentText });
            setEditingCommentId(null);
            fetchData();
        } catch (e) { alert("수정 실패"); }
    };

    const handleDeleteComment = async (commentId) => {
        if (!window.confirm("삭제하시겠습니까?")) return;
        try {
            await apiClient.delete(`/api/posts/${postId}/comments/${commentId}`);
            fetchData();
        } catch (e) { alert("삭제 실패"); }
    };

    if (loading) return <div style={styles.loading}>로딩 중...</div>;

    return (
        <div style={styles.layout}>
            <Header />
            <div style={styles.content}>
                <div style={styles.postCard}>
                    <button onClick={() => navigate('/board')} style={styles.backBtn}>← 목록으로</button>
                    {isEditingPost ? (
                        <div style={styles.editForm}>
                            <input style={styles.editInput} value={editTitle} onChange={e => setEditTitle(e.target.value)} />
                            <textarea style={{ ...styles.editTextarea, minHeight: '200px' }} value={editContent} onChange={e => setEditContent(e.target.value)} />
                            <div style={styles.btnGroup}>
                                <button onClick={handleUpdatePost} style={styles.saveBtn}>저장</button>
                                <button onClick={() => setIsEditingPost(false)} style={styles.cancelBtn}>취소</button>
                            </div>
                        </div>
                    ) : (
                        <>
                            <div style={styles.postHeader} className="post-detail-header">
                                <h2 style={styles.postTitle} className="post-detail-title">{post.title}</h2>
                                {currentUsername === post.authorUsername && (
                                    <div style={styles.actionGroup} className="post-detail-actions">
                                        <button onClick={() => setIsEditingPost(true)} style={styles.textBtn}>수정</button>
                                        <button onClick={handleDeletePost} style={{ ...styles.textBtn, color: '#ef4444' }}>삭제</button>
                                    </div>
                                )}
                            </div>
                            <div style={styles.postMeta}>
                                <span>👤 {post.authorName}</span>
                                <span>📅 {new Date(post.createdAt).toLocaleString()}</span>
                            </div>
                            <hr style={styles.hr} />
                            <div style={styles.postBody}>
                                <ReactMarkdown 
                                    remarkPlugins={[remarkGfm]}
                                    components={{
                                        img: ({node, ...props}) => (
                                            <img {...props} style={{ maxWidth: '100%', height: 'auto', borderRadius: '8px', marginTop: '10px' }} alt="" />
                                        )
                                    }}
                                >
                                    {post.content.replace(/\n/g, '  \n')}
                                </ReactMarkdown>
                            </div>

                            <div style={styles.reactionArea}>
                                <button
                                    onClick={handleToggleLike}
                                    style={{
                                        ...styles.likeBtn,
                                        backgroundColor: post.isLiked ? '#fee2e2' : '#f1f5f9',
                                        color: post.isLiked ? '#ef4444' : '#64748b',
                                        borderColor: post.isLiked ? '#fecaca' : '#e2e8f0'
                                    }}
                                >
                                    {post.isLiked ? '❤️' : '🤍'} 찜하기 ({post.likeCount || 0})
                                </button>
                            </div>
                        </>
                    )}
                </div>

                <div style={styles.commentSection} className="post-detail-comments">
                    <h3 style={styles.commentCount}>💬 댓글 {comments.length}개</h3>
                    <form onSubmit={handleCommentSubmit} style={styles.commentForm}>
                        <textarea 
                            value={newComment} 
                            onChange={e => setNewComment(e.target.value)} 
                            onFocus={checkAuthAndRedirect}
                            placeholder={localStorage.getItem('accessToken') ? "댓글을 입력하세요" : "로그인 후 댓글을 작성할 수 있습니다"} 
                            style={styles.commentInput} 
                        />
                        <button type="submit" style={styles.commentSubmitBtn}>등록</button>
                    </form>

                    <div style={styles.commentList}>
                        {comments.map((c) => (
                            <div key={c.id} style={styles.commentContainer}>
                                <div style={styles.commentItem}>
                                    <div style={styles.commentHeader}>
                                        <strong>{c.authorName}</strong>
                                        <div style={styles.commentRight}>
                                            <span style={styles.commentDate}>{new Date(c.createdAt).toLocaleDateString()}</span>
                                            <div style={styles.miniAction}>
                                                <button onClick={() => setReplyingTo(replyingTo === c.id ? null : c.id)} style={styles.miniBtn}>답글</button>
                                                {currentUsername === c.authorUsername && (
                                                    <>
                                                        <button onClick={() => { setEditingCommentId(c.id); setEditCommentText(c.content); }} style={styles.miniBtn}>수정</button>
                                                        <button onClick={() => handleDeleteComment(c.id)} style={{ ...styles.miniBtn, color: '#ef4444' }}>삭제</button>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    {editingCommentId === c.id ? (
                                        <div style={{ marginTop: '10px' }}>
                                            <textarea style={styles.editInput} value={editCommentText} onChange={e => setEditCommentText(e.target.value)} />
                                            <div style={{ ...styles.btnGroup, marginTop: '5px' }}>
                                                <button onClick={() => handleUpdateComment(c.id)} style={styles.saveBtn}>수정완료</button>
                                                <button onClick={() => setEditingCommentId(null)} style={styles.cancelBtn}>취소</button>
                                            </div>
                                        </div>
                                    ) : (
                                        <p style={styles.commentContent}>{c.content}</p>
                                    )}
                                </div>

                                {replyingTo === c.id && (
                                    <div style={styles.replyInputArea}>
                                        <textarea 
                                            value={replyText} 
                                            onChange={e => setReplyText(e.target.value)} 
                                            onFocus={checkAuthAndRedirect}
                                            placeholder="답글을 남겨보세요" 
                                            style={styles.replyInput} 
                                        />
                                        <div style={styles.btnGroup}>
                                            <button onClick={() => handleReplySubmit(c.id)} style={styles.saveBtn}>답글등록</button>
                                            <button onClick={() => setReplyingTo(null)} style={styles.cancelBtn}>취소</button>
                                        </div>
                                    </div>
                                )}

                                {c.children && c.children.map(r => (
                                    <div key={r.id} style={styles.replyItem}>
                                        <div style={styles.commentHeader}>
                                            <strong>↳ {r.authorName}</strong>
                                            <div style={styles.commentRight}>
                                                <span style={styles.commentDate}>{new Date(r.createdAt).toLocaleDateString()}</span>
                                                {currentUsername === r.authorUsername && (
                                                    <div style={styles.miniAction}>
                                                        <button onClick={() => handleDeleteComment(r.id)} style={{ ...styles.miniBtn, color: '#ef4444' }}>삭제</button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <p style={styles.commentContent}>{r.content}</p>
                                    </div>
                                ))}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
            <style>{`
                @media screen and (max-width: 768px) {
                    .post-detail-header { flex-direction: column !important; align-items: flex-start !important; gap: 10px !important; }
                    .post-detail-title { font-size: 22px !important; }
                    .post-detail-actions { align-self: flex-end !important; }
                    div[style*="padding: '40px'"] { padding: 25px 20px !important; border-radius: 0 !important; border-left: none !important; border-right: none !important; }
                    .post-detail-comments { padding-left: 15px !important; padding-right: 15px !important; }
                    div[style*="marginLeft: '40px'"] { margin-left: 15px !important; }
                    .post-detail-reactions { margin-top: 30px !important; }
                }
            `}</style>
        </div>
    );
};

const styles = {
    layout: { width: '100vw', minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#f8fafc', overflowX: 'hidden' },
    content: { flex: 1, maxWidth: '800px', margin: '0 auto', padding: '40px 20px', width: '100%', overflowY: 'auto' },
    postCard: { backgroundColor: '#fff', padding: '40px', borderRadius: '24px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' },
    postHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' },
    backBtn: { background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', marginBottom: '20px', fontWeight: '600' },
    postTitle: { fontSize: '28px', fontWeight: '800', color: '#1e293b', marginBottom: '16px', flex: 1 },
    postMeta: { display: 'flex', gap: '20px', color: '#94a3b8', fontSize: '14px' },
    actionGroup: { display: 'flex', gap: '10px' },
    textBtn: { background: 'none', border: 'none', color: '#4285F4', cursor: 'pointer', fontWeight: 'bold' },
    hr: { border: 'none', borderTop: '1px solid #f1f5f9', margin: '24px 0' },
    postBody: { 
        fontSize: '17px', 
        lineHeight: '1.8', 
        color: '#334155',
        '& img': { maxWidth: '100%', borderRadius: '12px', marginTop: '16px', marginBottom: '16px' },
        '& p': { marginBottom: '16px' },
        '& h1, & h2, & h3': { marginTop: '24px', marginBottom: '12px' }
    },
    editForm: { display: 'flex', flexDirection: 'column', gap: '15px' },
    editInput: { width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', outline: 'none' },
    editTextarea: { width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', outline: 'none', resize: 'vertical' },
    btnGroup: { display: 'flex', justifyContent: 'flex-end', gap: '10px' },
    saveBtn: { padding: '8px 20px', backgroundColor: '#4285F4', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' },
    cancelBtn: { padding: '8px 20px', backgroundColor: '#f1f5f9', color: '#64748b', border: 'none', borderRadius: '8px', cursor: 'pointer' },
    reactionArea: { display: 'flex', justifyContent: 'center', marginTop: '40px' },
    likeBtn: { padding: '10px 24px', fontSize: '16px', fontWeight: 'bold', borderRadius: '24px', border: '1px solid', cursor: 'pointer', transition: '0.2s', display: 'flex', alignItems: 'center', gap: '8px' },
    commentSection: { marginTop: '30px', paddingBottom: '50px' },
    commentCount: { fontSize: '18px', fontWeight: '700', marginBottom: '20px' },
    commentForm: { display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '30px' },
    commentInput: { padding: '15px', borderRadius: '12px', border: '1px solid #e2e8f0', minHeight: '80px', outline: 'none' },
    commentSubmitBtn: { alignSelf: 'flex-end', padding: '10px 24px', backgroundColor: '#4285F4', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' },
    commentContainer: { marginBottom: '20px' },
    commentItem: { padding: '20px', backgroundColor: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0' },
    replyItem: { padding: '15px 20px', backgroundColor: '#f8fafc', borderRadius: '16px', border: '1px solid #e2e8f0', marginLeft: '40px', marginTop: '10px' },
    commentHeader: { display: 'flex', justifyContent: 'space-between', marginBottom: '8px' },
    commentRight: { display: 'flex', alignItems: 'center', gap: '10px' },
    commentDate: { fontSize: '12px', color: '#94a3b8' },
    miniAction: { display: 'flex', gap: '5px' },
    miniBtn: { background: 'none', border: 'none', fontSize: '12px', cursor: 'pointer', color: '#4285F4' },
    commentContent: { fontSize: '15px', color: '#475569' },
    replyInputArea: { marginLeft: '40px', marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '10px' },
    replyInput: { padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0', minHeight: '60px', outline: 'none' },
    loading: { display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }
};

export default PostDetailPage;