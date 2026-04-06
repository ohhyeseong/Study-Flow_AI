import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api';
import Header from '../components/Header';

const MyPage = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [activeTab, setActiveTab] = useState('info'); // info, posts, likes
    const [myPosts, setMyPosts] = useState([]);
    const [likedPosts, setLikedPosts] = useState([]);

    // Edit states
    const [isEditingNick, setIsEditingNick] = useState(false);
    const [editNickname, setEditNickname] = useState('');
    const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);

    // List of predefined avatars (using dicebear as placeholder)
    const predefinedAvatars = [
        "https://api.dicebear.com/7.x/fun-emoji/svg?seed=Felix",
        "https://api.dicebear.com/7.x/fun-emoji/svg?seed=Aneka",
        "https://api.dicebear.com/7.x/fun-emoji/svg?seed=Boo",
        "https://api.dicebear.com/7.x/fun-emoji/svg?seed=Nala",
        "https://api.dicebear.com/7.x/fun-emoji/svg?seed=Peanut",
        "https://api.dicebear.com/7.x/fun-emoji/svg?seed=Oliver",
        "https://api.dicebear.com/7.x/fun-emoji/svg?seed=Lucky",
        "https://api.dicebear.com/7.x/fun-emoji/svg?seed=Sasha"
    ];

    useEffect(() => {
        fetchUserInfo();
    }, []);

    useEffect(() => {
        if (activeTab === 'posts') {
            fetchMyPosts();
        } else if (activeTab === 'likes') {
            fetchLikedPosts();
        }
    }, [activeTab]);

    const fetchUserInfo = async () => {
        try {
            const response = await apiClient.get('/api/users/me');
            setUser(response.data.data);
            setEditNickname(response.data.data.nickname);
        } catch (error) {
            console.error('Failed to fetch user info', error);
        }
    };

    const fetchMyPosts = async () => {
        try {
            const response = await apiClient.get('/api/posts/my');
            setMyPosts(response.data.data || []);
        } catch (error) {
            console.error('Failed to fetch my posts', error);
        }
    };

    const fetchLikedPosts = async () => {
        try {
            const response = await apiClient.get('/api/posts/liked');
            setLikedPosts(response.data.data || []);
        } catch (error) {
            console.error('Failed to fetch liked posts', error);
        }
    };

    const handleSaveNickname = async () => {
        if (!editNickname.trim()) return;
        try {
            const response = await apiClient.put('/api/users/me', {
                nickname: editNickname,
                profileImageUrl: user.profileImageUrl
            });
            setUser(response.data.data);
            setIsEditingNick(false);
            alert('닉네임이 성공적으로 변경되었습니다!');
        } catch (error) {
            console.error(error);
            alert('닉네임 변경에 실패했습니다.');
        }
    };

    const handleAvatarSelect = async (url) => {
        try {
            const response = await apiClient.put('/api/users/me', {
                nickname: user.nickname,
                profileImageUrl: url
            });
            setUser(response.data.data);
            setIsAvatarModalOpen(false);
            alert('프로필 이미지가 변경되었습니다!');
        } catch (error) {
            console.error(error);
            alert('프로필 이미지 변경에 실패했습니다.');
        }
    };

    if (!user) return <div style={styles.loading}>로딩중...</div>;

    const defaultProfile = "https://api.dicebear.com/7.x/fun-emoji/svg?seed=default";

    return (
        <div style={styles.layout}>
            <Header />
            <div style={styles.container}>
                <div style={styles.sidebar}>
                    <h2 style={styles.sidebarTitle}>마이 페이지</h2>
                    <ul style={styles.menuList}>
                        <li style={activeTab === 'info' ? styles.activeMenu : styles.menuItem} onClick={() => setActiveTab('info')}>
                            👤 내 정보
                        </li>
                        <li style={activeTab === 'posts' ? styles.activeMenu : styles.menuItem} onClick={() => setActiveTab('posts')}>
                            📝 내가 쓴 글
                        </li>
                        <li style={activeTab === 'likes' ? styles.activeMenu : styles.menuItem} onClick={() => setActiveTab('likes')}>
                            ❤️ 내가 찜한 글
                        </li>
                    </ul>
                </div>

                <div style={styles.content}>
                    {activeTab === 'info' && (
                        <div style={styles.infoSection}>
                            <h3 style={styles.sectionTitle}>내 프로필</h3>
                            <div style={styles.profileCard}>
                                <div style={styles.avatarWrapper}>
                                    <img 
                                        src={user.profileImageUrl || defaultProfile} 
                                        alt="Profile" 
                                        style={styles.avatarImg}
                                    />
                                    <button style={styles.avatarEditBtn} onClick={() => setIsAvatarModalOpen(true)}>
                                        ✏️ 변경
                                    </button>
                                </div>
                                <div style={styles.infoDetails}>
                                    <div style={styles.infoRow}>
                                        <span style={styles.infoLabel}>아이디:</span>
                                        <span style={styles.infoValue}>{user.username}</span>
                                    </div>
                                    <div style={styles.infoRow}>
                                        <span style={styles.infoLabel}>이메일:</span>
                                        <span style={styles.infoValue}>{user.email}</span>
                                    </div>
                                    <div style={styles.infoRow}>
                                        <span style={styles.infoLabel}>닉네임:</span>
                                        {isEditingNick ? (
                                            <div style={{display: 'flex', gap: '8px'}}>
                                                <input 
                                                    value={editNickname}
                                                    onChange={e => setEditNickname(e.target.value)}
                                                    style={styles.nickInput}
                                                />
                                                <button onClick={handleSaveNickname} style={styles.saveBtn}>저장</button>
                                                <button onClick={() => { setIsEditingNick(false); setEditNickname(user.nickname); }} style={styles.cancelBtn}>취소</button>
                                            </div>
                                        ) : (
                                            <div style={{display: 'flex', gap: '8px', alignItems: 'center'}}>
                                                <span style={styles.infoValue}>{user.nickname}</span>
                                                <button onClick={() => setIsEditingNick(true)} style={styles.editBtn}>수정</button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'posts' && (
                        <div style={styles.postsSection}>
                            <h3 style={styles.sectionTitle}>내가 쓴 글</h3>
                            {myPosts.length === 0 ? (
                                <p style={styles.emptyText}>게시글이 없습니다.</p>
                            ) : (
                                <div style={styles.postList}>
                                    {myPosts.map(post => (
                                        <div key={post.id} style={styles.postCard} onClick={() => navigate(`/post/${post.id}`)}>
                                            <h4 style={styles.postTitle}>{post.title}</h4>
                                            <p style={styles.postExcerpt}>{post.content.substring(0, 50)}...</p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'likes' && (
                        <div style={styles.postsSection}>
                            <h3 style={styles.sectionTitle}>내가 찜한 글</h3>
                            {likedPosts.length === 0 ? (
                                <p style={styles.emptyText}>아직 찜한 글이 없습니다.</p>
                            ) : (
                                <div style={styles.gridContainer}>
                                    {likedPosts.map(post => (
                                        <div key={post.id} style={styles.blogCard} onClick={() => navigate(`/post/${post.id}`)}>
                                            <div style={styles.thumbnail}>
                                                <div style={styles.thumbnailPlaceholder}>📝</div>
                                            </div>
                                            <div style={styles.cardContent}>
                                                <h3 style={styles.postCardTitle}>{post.title}</h3>
                                                <p style={styles.postExcerpt}>{post.content ? post.content.substring(0, 50) + '...' : '내용 없음'}</p>
                                                <div style={styles.postMeta}>
                                                    <span style={styles.statItem}>❤️ {post.likeCount || 0}</span>
                                                    <span style={styles.statItem}>👤 {post.authorName}</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Avatar Selection Modal */}
            {isAvatarModalOpen && (
                <div style={styles.modalOverlay}>
                    <div style={styles.modalContent}>
                        <h3 style={{margin: '0 0 20px 0'}}>프로필 아바타 선택</h3>
                        <div style={styles.avatarGrid}>
                            {predefinedAvatars.map((url, idx) => (
                                <img 
                                    key={idx}
                                    src={url}
                                    alt="Avatar option"
                                    onClick={() => handleAvatarSelect(url)}
                                    className="avatar-hover"
                                    style={{ width: '100%', aspectRatio: '1', backgroundColor: '#f8fafc', borderRadius: '50%', cursor: 'pointer', transition: '0.2s', border: '2px solid transparent' }}
                                />
                            ))}
                        </div>
                        <button onClick={() => setIsAvatarModalOpen(false)} style={styles.closeModalBtn}>닫기</button>
                    </div>
                    <style>{`
                        .avatar-hover:hover {
                            border-color: #4f46e5 !important;
                            transform: scale(1.1);
                        }
                    `}</style>
                </div>
            )}
        </div>
    );
};

const styles = {
    layout: { width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#f8fafc', overflow: 'hidden' },
    loading: { display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', fontSize: '18px', color: '#64748b' },
    container: { display: 'flex', flex: 1, maxWidth: '1000px', margin: '30px auto', width: '90%', gap: '30px', backgroundColor: '#fff', borderRadius: '24px', boxShadow: '0 10px 30px rgba(0,0,0,0.05)', overflow: 'hidden' },
    
    sidebar: { width: '220px', padding: '30px 20px', borderRight: '1px solid #f1f5f9', backgroundColor: '#fafafb' },
    sidebarTitle: { margin: '0 0 30px 0', fontSize: '20px', fontWeight: '800', color: '#1e293b' },
    menuList: { listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' },
    menuItem: { padding: '12px 16px', borderRadius: '12px', fontSize: '15px', fontWeight: '600', color: '#64748b', cursor: 'pointer', transition: 'all 0.2s' },
    activeMenu: { padding: '12px 16px', borderRadius: '12px', fontSize: '15px', fontWeight: '700', color: '#4f46e5', backgroundColor: '#e0e7ff', cursor: 'pointer' },
    
    content: { flex: 1, padding: '40px 30px', overflowY: 'auto' },
    sectionTitle: { margin: '0 0 25px 0', fontSize: '24px', fontWeight: '800', color: '#1e293b' },
    infoSection: { display: 'flex', flexDirection: 'column' },
    profileCard: { display: 'flex', gap: '40px', padding: '30px', border: '1px solid #e2e8f0', borderRadius: '16px', backgroundColor: '#fff' },
    avatarWrapper: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px' },
    avatarImg: { width: '120px', height: '120px', borderRadius: '60px', backgroundColor: '#f1f5f9', objectFit: 'cover' },
    avatarEditBtn: { padding: '8px 16px', borderRadius: '20px', border: 'none', backgroundColor: '#f1f5f9', color: '#475569', fontSize: '13px', fontWeight: '600', cursor: 'pointer' },
    infoDetails: { display: 'flex', flexDirection: 'column', gap: '20px', justifyContent: 'center' },
    infoRow: { display: 'flex', alignItems: 'center' },
    infoLabel: { width: '80px', color: '#64748b', fontSize: '15px', fontWeight: '600' },
    infoValue: { color: '#1e293b', fontSize: '16px', fontWeight: '500' },
    nickInput: { padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '14px', outline: 'none' },
    saveBtn: { padding: '8px 16px', border: 'none', borderRadius: '8px', backgroundColor: '#4f46e5', color: '#fff', fontSize: '13px', fontWeight: '600', cursor: 'pointer' },
    cancelBtn: { padding: '8px 16px', border: '1px solid #e2e8f0', borderRadius: '8px', backgroundColor: '#fff', color: '#64748b', fontSize: '13px', fontWeight: '600', cursor: 'pointer' },
    editBtn: { padding: '4px 10px', border: '1px solid #e2e8f0', borderRadius: '6px', backgroundColor: '#f8fafc', color: '#475569', fontSize: '12px', cursor: 'pointer' },
    
    postsSection: { display: 'flex', flexDirection: 'column' },
    emptyText: { color: '#94a3b8', fontSize: '15px' },
    postList: { display: 'flex', flexDirection: 'column', gap: '16px' },
    postCard: { padding: '20px', border: '1px solid #f1f5f9', borderRadius: '12px', cursor: 'pointer', transition: 'box-shadow 0.2s', '&:hover': { boxShadow: '0 4px 12px rgba(0,0,0,0.05)' } },
    postTitle: { margin: '0 0 8px 0', fontSize: '18px', fontWeight: '700', color: '#1e293b' },
    postExcerpt: { margin: 0, fontSize: '14px', color: '#64748b', lineHeight: '1.5' },
    gridContainer: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' },
    blogCard: { backgroundColor: '#fff', borderRadius: '16px', border: '1px solid #f1f5f9', cursor: 'pointer', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', transition: 'transform 0.2s', '&:hover': { transform: 'translateY(-4px)' } },
    thumbnail: { width: '100%', height: '140px', backgroundColor: '#e2e8f0', display: 'flex', justifyContent: 'center', alignItems: 'center' },
    thumbnailPlaceholder: { fontSize: '40px', opacity: 0.5 },
    cardContent: { padding: '16px', display: 'flex', flexDirection: 'column', flex: 1 },
    postCardTitle: { fontSize: '16px', fontWeight: '800', color: '#1e293b', margin: '0 0 8px 0' },
    postMeta: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: '12px', borderTop: '1px solid #f1f5f9' },
    statItem: { fontSize: '13px', color: '#64748b', fontWeight: '500' },

    modalOverlay: { position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
    modalContent: { backgroundColor: '#fff', padding: '30px', borderRadius: '24px', width: '400px', maxWidth: '90%', textAlign: 'center' },
    avatarGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '15px', marginBottom: '20px' },
    avatarOption: { width: '100%', aspectRatio: '1', backgroundColor: '#f8fafc', borderRadius: '50%', cursor: 'pointer', border: '2px solid transparent', transition: '0.2s' },
    closeModalBtn: { padding: '10px 24px', backgroundColor: '#f1f5f9', border: 'none', borderRadius: '12px', color: '#475569', fontWeight: 'bold', cursor: 'pointer' }
};

export default MyPage;
