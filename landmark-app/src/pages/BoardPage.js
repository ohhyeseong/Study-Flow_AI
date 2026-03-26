import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../api';
import Header from '../components/Header';

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
            const response = await apiClient.get('/api/posts/list');
            const data = response.data?.data || response.data || [];
            setPosts(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('목록 불러오기 실패:', error);
            setPosts([]);
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
            <Header />

            <div style={styles.container}>
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
                        {Array.isArray(posts) && posts.length > 0 ? (
                            posts.map(post => (
                                <div key={post.id} style={styles.postCard}>
                                    <h3 style={styles.postTitle}>{post.title}</h3>
                                    <p style={styles.postContent}>{post.content}</p>
                                    <div style={styles.postMeta}>
                                        작성자: {post.authorName} | {new Date(post.createdAt).toLocaleDateString()}
                                    </div>

                                    <div style={styles.commentSection}>
                                        <h4>댓글 ({post.comments?.length || 0})</h4>

                                        {Array.isArray(post.comments) && post.comments
                                            .filter(comment => !comment.parent && !comment.parentId)
                                            .map(comment => (
                                                <div key={comment.id} style={styles.commentContainer}>
                                                    <div style={styles.commentItem}>
                                                        <div style={styles.commentMain}>
                                                            <div style={styles.commentTextGroup}>
                                                                <strong style={{marginRight: '8px'}}>{comment.authorName}:</strong>
                                                                <span>{comment.content}</span>
                                                            </div>
                                                            <button
                                                                style={styles.replyButton}
                                                                onClick={() => setActiveReplyId(activeReplyId === comment.id ? null : comment.id)}
                                                            >
                                                                {activeReplyId === comment.id ? '취소' : '답글'}
                                                            </button>
                                                        </div>
                                                    </div>

                                                    <div style={styles.replySection}>
                                                        {activeReplyId === comment.id && (
                                                            <div style={styles.replyInputWrapper}>
                                                                <input
                                                                    style={styles.replyInput}
                                                                    placeholder="답글 입력 후 엔터..."
                                                                    value={replyInputs[comment.id] || ''}
                                                                    onChange={(e) => setReplyInputs({...replyInputs, [comment.id]: e.target.value})}
                                                                    onKeyDown={(e) => {
                                                                        if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
                                                                            e.preventDefault();
                                                                            handleAddReply(post.id, comment.id);
                                                                        }
                                                                    }}
                                                                    autoFocus
                                                                />
                                                            </div>
                                                        )}

                                                        {Array.isArray(comment.children) && comment.children.map(child => (
                                                            <div key={child.id} style={styles.replyItem}>
                                                                <span style={styles.replyArrow}>└</span>
                                                                <strong style={{marginRight: '5px'}}>{child.authorName}:</strong>
                                                                <span>{child.content}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            ))
                                        }

                                        <input
                                            type="text"
                                            placeholder="댓글 입력 후 엔터..."
                                            value={commentInputs[post.id] || ''}
                                            onChange={(e) => setCommentInputs({...commentInputs, [post.id]: e.target.value})}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
                                                    e.preventDefault();
                                                    handleAddComment(post.id);
                                                }
                                            }}
                                            style={styles.commentInput}
                                        />
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
                                게시글이 없습니다. 첫 번째 게시글을 작성해 보세요!
                            </div>
                        )}
                        <div style={{ height: '80px' }}></div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const styles = {
    layout: { backgroundColor: '#f5f5f5', height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' },
    container: { flex: 1, display: 'flex', flexDirection: 'column', maxWidth: '800px', margin: '0 auto', width: '100%', backgroundColor: '#fff', overflow: 'hidden' },
    stickyHeader: { padding: '20px', backgroundColor: '#fff', borderBottom: '2px solid #eee', zIndex: 10 },
    headerRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' },
    createForm: { padding: '15px', backgroundColor: '#f9f9f9', borderRadius: '8px' },
    scrollArea: { flex: 1, overflowY: 'auto', padding: '20px', backgroundColor: '#fff' },
    backLink: { textDecoration: 'none', color: '#4285F4', fontWeight: 'bold' },
    input: { width: '100%', padding: '10px', marginBottom: '10px', borderRadius: '4px', border: '1px solid #ddd', boxSizing: 'border-box' },
    textarea: { width: '100%', padding: '10px', height: '60px', marginBottom: '10px', borderRadius: '4px', border: '1px solid #ddd', boxSizing: 'border-box' },
    button: { width: '100%', padding: '10px', backgroundColor: '#4285F4', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' },
    postList: { display: 'flex', flexDirection: 'column', gap: '20px' },
    postCard: { padding: '20px', border: '1px solid #eee', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' },
    postTitle: { margin: '0 0 10px 0' },
    postContent: { whiteSpace: 'pre-wrap', color: '#555' },
    postMeta: { fontSize: '12px', color: '#999', marginTop: '10px' },
    commentSection: { marginTop: '15px', borderTop: '1px solid #eee', paddingTop: '10px' },
    commentContainer: { padding: '12px 0', borderBottom: '1px solid #f0f0f0', display: 'flex', flexDirection: 'column', alignItems: 'flex-start' },
    commentItem: { width: '100%', marginBottom: '4px' },
    commentMain: { display: 'flex', justifyContent: 'space-between', width: '100%', fontSize: '14px', alignItems: 'flex-start' },
    commentTextGroup: { display: 'flex', flexWrap: 'wrap', flex: 1 },
    replyButton: { border: 'none', background: 'none', color: '#4285F4', cursor: 'pointer', fontSize: '12px', whiteSpace: 'nowrap', marginLeft: '10px' },
    replySection: { width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'flex-start' },
    replyInputWrapper: { marginTop: '8px', marginBottom: '8px', width: '100%' },
    replyInput: { width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ddd', outline: 'none', boxSizing: 'border-box', fontSize: '13px' },
    replyItem: { fontSize: '13px', color: '#666', marginTop: '6px', paddingLeft: '0', textAlign: 'left', width: '100%', display: 'flex', alignItems: 'center' },
    replyArrow: { marginRight: '8px', color: '#4285F4', fontSize: '12px' },
    commentInput: { width: '100%', padding: '10px', marginTop: '15px', boxSizing: 'border-box', border: '1px solid #ddd', borderRadius: '4px', fontSize: '14px' }
};

export default BoardPage;