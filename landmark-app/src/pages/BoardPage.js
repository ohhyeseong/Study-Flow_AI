import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../api';
import Header from '../components/Header'; // 👈 공통 헤더 임포트

const BoardPage = () => {
    const [posts, setPosts] = useState([]);
    const [newPostTitle, setNewPostTitle] = useState('');
    const [newPostContent, setNewPostContent] = useState('');
    const [commentInputs, setCommentInputs] = useState({});
    const [replyInputs, setReplyInputs] = useState({});
    const [activeReplyId, setActiveReplyId] = useState(null);

    useEffect(() => {
        fetchPosts();
    }, []);

    const fetchPosts = async () => {
        try {
            // 화면에 403 에러가 뜬다면 서버의 SecurityConfig 확인이 필요합니다.
            const response = await apiClient.get('/api/posts/list');
            setPosts(response.data);
        } catch (error) {
            console.error('목록 불러오기 실패:', error);
        }
    };

    const handleCreatePost = async () => {
        if (!newPostTitle || !newPostContent) return;
        try {
            await apiClient.post('/api/posts/create', {
                title: newPostTitle,
                content: newPostContent,
            });
            setNewPostTitle('');
            setNewPostContent('');
            fetchPosts();
        } catch (error) {
            console.error('게시글 작성 실패:', error);
        }
    };

    const handleAddComment = async (postId) => {
        const commentText = commentInputs[postId];
        if (!commentText?.trim()) return;
        try {
            await apiClient.post(`/api/posts/${postId}/comments`, { content: commentText });
            setCommentInputs(prev => ({ ...prev, [postId]: '' }));
            fetchPosts();
        } catch (error) {
            console.error('댓글 작성 실패:', error);
        }
    };

    const handleAddReply = async (postId, parentId) => {
        const replyText = replyInputs[parentId];
        if (!replyText?.trim()) return;
        try {
            await apiClient.post(`/api/posts/${postId}/comments`, {
                content: replyText,
                parentId: parentId
            });
            setReplyInputs(prev => ({ ...prev, [parentId]: '' }));
            setActiveReplyId(null);
            fetchPosts();
        } catch (error) {
            console.error('답글 작성 실패:', error);
        }
    };

    return (
        <div style={styles.layout}>
            {/* 🔵 각 페이지 상단에 헤더 직접 추가 */}
            <Header />

            <div style={styles.container}>
                {/* 🟢 고정 영역: 게시글 작성 폼 */}
                <div style={styles.stickyHeader}>
                    <div style={styles.headerRow}>
                        <h2 style={{margin: 0}}>📋 자유 게시판</h2>
                        <Link to="/main" style={styles.backLink}>← 메인으로</Link>
                    </div>
                    <div style={styles.createForm}>
                        <input type="text" placeholder="제목을 입력하세요" value={newPostTitle} onChange={(e) => setNewPostTitle(e.target.value)} style={styles.input} />
                        <textarea placeholder="내용을 입력하세요" value={newPostContent} onChange={(e) => setNewPostContent(e.target.value)} style={styles.textarea} />
                        <button onClick={handleCreatePost} style={styles.button}>게시글 작성</button>
                    </div>
                </div>

            <div style={styles.scrollArea}>
                <div style={styles.postList}>
                    {posts.map(post => (
                        <div key={post.id} style={styles.postCard}>
                            <h3 style={styles.postTitle}>{post.title}</h3>
                            <p style={styles.postContent}>{post.content}</p>
                            <div style={styles.postMeta}>
                                작성자: {post.authorName} | {new Date(post.createdAt).toLocaleDateString()}
                            </div>

                            <div style={styles.commentSection}>
                                <h4>댓글 ({post.comments ? post.comments.length : 0})</h4>

                                {/* ✅ 수정됨: parentId가 없는 최상위 댓글만 먼저 렌더링 */}
                                {post.comments && post.comments
                                    .filter(comment => !comment.parentId)
                                    .map(comment => (
                                        <div key={comment.id} style={styles.commentItem}>
                                            <div style={styles.commentMain}>
                                                <strong>{comment.authorName}:</strong> {comment.content}
                                                <button style={styles.replyButton} onClick={() => setActiveReplyId(activeReplyId === comment.id ? null : comment.id)}>
                                                    {activeReplyId === comment.id ? '취소' : '답글'}
                                                </button>
                                            </div>

                                            {/* 답글 입력창 */}
                                            {activeReplyId === comment.id && (
                                                <div style={styles.replyInputWrapper}>
                                                    <input
                                                        style={styles.replyInput}
                                                        placeholder="답글 입력 후 엔터..."
                                                        value={replyInputs[comment.id] || ''}
                                                        onChange={(e) => setReplyInputs({...replyInputs, [comment.id]: e.target.value})}
                                                        onKeyDown={(e) => e.key === 'Enter' && handleAddReply(post.id, comment.id)}
                                                        autoFocus
                                                    />
                                                </div>
                                            )}

                                            {/* 대댓글(자식) 출력 영역 */}
                                            {comment.children && comment.children.map(child => (
                                                <div key={child.id} style={styles.replyItem}>
                                                    <span style={styles.replyArrow}>└</span>
                                                    <strong>{child.authorName}:</strong> {child.content}
                                                </div>
                                            ))}
                                        </div>
                                    ))
                                }

                                {/* 새 일반 댓글 입력창 */}
                                <input
                                    type="text"
                                    placeholder="댓글 입력 후 엔터..."
                                    value={commentInputs[post.id] || ''}
                                    onChange={(e) => setCommentInputs({...commentInputs, [post.id]: e.target.value})}
                                    onKeyDown={(e) => e.key === 'Enter' && handleAddComment(post.id)}
                                    style={styles.commentInput}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

const styles = {
    layout: { height: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#f5f7fb' },
    container: { flex: 1, display: 'flex', flexDirection: 'column', maxWidth: '800px', margin: '0 auto', width: '100%', overflow: 'hidden', backgroundColor: '#fff' },

    stickyHeader: { padding: '20px', backgroundColor: '#fff', borderBottom: '1px solid #eee', zIndex: 10 },
    headerRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' },
    createForm: { padding: '15px', backgroundColor: '#f9f9f9', borderRadius: '12px' },

    scrollArea: { flex: 1, overflowY: 'auto', padding: '20px' },

    backLink: { textDecoration: 'none', color: '#4285F4', fontWeight: 'bold', fontSize: '14px' },
    input: { width: '100%', padding: '12px', marginBottom: '10px', borderRadius: '8px', border: '1px solid #ddd', boxSizing: 'border-box', outline: 'none' },
    textarea: { width: '100%', padding: '12px', height: '70px', marginBottom: '10px', borderRadius: '8px', border: '1px solid #ddd', boxSizing: 'border-box', outline: 'none', resize: 'none' },
    button: { width: '100%', padding: '12px', backgroundColor: '#4285F4', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' },

    postList: { display: 'flex', flexDirection: 'column', gap: '20px' },
    postCard: { padding: '20px', border: '1px solid #eee', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' },
    postTitle: { margin: '0 0 10px 0', color: '#333' },
    postContent: { whiteSpace: 'pre-wrap', color: '#555', lineHeight: '1.5' },
    postMeta: { fontSize: '12px', color: '#999', marginTop: '15px' },

    commentSection: { marginTop: '15px', borderTop: '1px solid #f1f1f1', paddingTop: '10px' },
    commentItem: { padding: '8px 0', borderBottom: '1px solid #f9f9f9' },
    commentMain: { display: 'flex', justifyContent: 'space-between', fontSize: '14px', alignItems: 'center' },
    replyButton: { border: 'none', background: 'none', color: '#4285F4', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' },

    replyInputWrapper: { marginLeft: '20px', marginTop: '5px' },
    replyInput: { width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #eee', outline: 'none', fontSize: '13px' },
    replyItem: { marginLeft: '20px', fontSize: '13px', color: '#666', marginTop: '5px', backgroundColor: '#f8f9fa', padding: '5px 10px', borderRadius: '6px' },
    replyArrow: { marginRight: '5px', color: '#4285F4' },
    commentInput: { width: '100%', padding: '10px', marginTop: '15px', boxSizing: 'border-box', border: '1px solid #eee', borderRadius: '8px', outline: 'none' },
    emptyText: { textAlign: 'center', color: '#999', marginTop: '40px' }
};

export default BoardPage;