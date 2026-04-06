import React, { useState, useEffect } from 'react';
import apiClient from '../api';
import Header from '../components/Header';
import { useNavigate } from 'react-router-dom';

const BoardPage = () => {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        fetchPosts();
    }, []);

    const fetchPosts = async () => {
        try {
            const response = await apiClient.get('/api/posts/list');
            setPosts(response.data.data || []);
            setLoading(false);
        } catch (error) {
            console.error("게시글 로딩 실패:", error);
            setLoading(false);
        }
    };

    return (
        <div style={styles.layout}>
            <Header />
            <div style={styles.content}>
                <div style={styles.headerArea}>
                    <div>
                        <h2 style={styles.title}>📋 커뮤니티 게시판</h2>
                        <p style={styles.subtitle}>함께 공부하는 동료들과 지식을 공유해보세요.</p>
                    </div>
                    <button
                        onClick={() => navigate('/post/write')}
                        style={styles.writeBtn}
                    >
                        ✍️ 글쓰기
                    </button>
                </div>

                {loading ? (
                    <div style={styles.emptyState}>로딩 중... ⏳</div>
                ) : posts.length === 0 ? (
                    <div style={styles.emptyState}>
                        <h3>등록된 게시글이 없습니다.</h3>
                        <p>첫 번째 게시글의 주인공이 되어보세요!</p>
                    </div>
                ) : (
                    <div style={styles.gridContainer}>
                        {posts.map((post) => (
                            <div
                                key={post.id}
                                style={styles.blogCard}
                                onClick={() => navigate(`/post/${post.id}`)}
                            >
                                <div style={styles.thumbnail}>
                                    {post.imageUrls && post.imageUrls.length > 0 ? (
                                        <img 
                                            src={post.imageUrls[0]} 
                                            alt="Thumbnail" 
                                            style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                                        />
                                    ) : (
                                        <div style={styles.thumbnailPlaceholder}>📝</div>
                                    )}
                                </div>
                                <div style={styles.cardContent}>
                                    <h3 style={styles.postTitle}>{post.title}</h3>
                                    <p style={styles.postExcerpt}>
                                        {post.content ? post.content.substring(0, 80) + '...' : '내용이 없습니다.'}
                                    </p>
                                    <div style={styles.postMeta}>
                                        <div style={styles.authorInfo}>
                                            <div style={styles.authorAvatar}>{post.authorName ? post.authorName.charAt(0) : '👤'}</div>
                                            <span>{post.authorName}</span>
                                        </div>
                                        <div style={styles.statsInfo}>
                                            <span style={styles.statItem}>❤️ {post.likeCount || 0}</span>
                                            <span style={styles.statItem}>💬 {post.comments ? post.comments.length : 0}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

const styles = {
    layout: { width: '100vw', minHeight: '100vh', backgroundColor: '#f8fafc' },
    content: { maxWidth: '1000px', margin: '0 auto', padding: '40px 20px' },
    headerArea: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        marginBottom: '30px',
        borderBottom: '2px solid #e2e8f0',
        paddingBottom: '20px'
    },
    title: { fontSize: '28px', fontWeight: '800', color: '#1e293b', margin: 0 },
    subtitle: { color: '#64748b', marginTop: '8px', fontSize: '15px' },
    writeBtn: {
        padding: '12px 24px',
        backgroundColor: '#4285F4',
        color: '#fff',
        border: 'none',
        borderRadius: '10px',
        fontWeight: 'bold',
        cursor: 'pointer',
        transition: '0.2s',
        boxShadow: '0 4px 6px rgba(66, 133, 244, 0.2)'
    },
    gridContainer: { 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', 
        gap: '24px' 
    },
    blogCard: {
        backgroundColor: '#fff',
        borderRadius: '16px',
        border: '1px solid #f1f5f9',
        cursor: 'pointer',
        overflow: 'hidden',
        transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
        ":hover": { transform: 'translateY(-5px)', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }
    },
    thumbnail: {
        width: '100%',
        height: '160px',
        backgroundColor: '#e2e8f0',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center'
    },
    thumbnailPlaceholder: {
        fontSize: '48px',
        opacity: 0.5
    },
    cardContent: {
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        flex: 1
    },
    postTitle: { fontSize: '18px', fontWeight: '800', color: '#1e293b', margin: '0 0 10px 0', lineHeight: '1.4' },
    postExcerpt: { fontSize: '14px', color: '#64748b', margin: '0 0 20px 0', lineHeight: '1.6', flex: 1 },
    postMeta: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '16px', borderTop: '1px solid #f1f5f9' },
    authorInfo: { display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: '600', color: '#475569' },
    authorAvatar: { width: '24px', height: '24px', borderRadius: '12px', backgroundColor: '#cbd5e1', color: '#fff', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '12px' },
    statsInfo: { display: 'flex', gap: '12px' },
    statItem: { fontSize: '13px', color: '#64748b', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '4px' },
    emptyState: { textAlign: 'center', padding: '100px 0', color: '#64748b' }
};

export default BoardPage;