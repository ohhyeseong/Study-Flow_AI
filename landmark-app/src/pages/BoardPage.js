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
                    <div style={styles.listContainer}>
                        {posts.map((post) => (
                            <div
                                key={post.id}
                                style={styles.card}
                                onClick={() => navigate(`/post/${post.id}`)}
                            >
                                <h3 style={styles.postTitle}>{post.title}</h3>
                                <div style={styles.postMeta}>
                                    <span>👤 {post.authorName}</span>
                                    <span>📅 {new Date(post.createdAt).toLocaleDateString()}</span>
                                    <span>💬 {post.comments ? post.comments.length : 0}</span>
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
        transition: '0.2s'
    },
    listContainer: { display: 'flex', flexDirection: 'column', gap: '16px' },
    card: {
        backgroundColor: '#fff',
        padding: '24px',
        borderRadius: '16px',
        border: '1px solid #e2e8f0',
        cursor: 'pointer',
        transition: 'transform 0.2s, box-shadow 0.2s',
        ":hover": { transform: 'translateY(-2px)', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.05)' }
    },
    postTitle: { fontSize: '18px', fontWeight: '700', color: '#334155', marginBottom: '12px' },
    postMeta: { display: 'flex', gap: '20px', fontSize: '13px', color: '#94a3b8' },
    emptyState: { textAlign: 'center', padding: '100px 0', color: '#64748b' }
};

export default BoardPage;