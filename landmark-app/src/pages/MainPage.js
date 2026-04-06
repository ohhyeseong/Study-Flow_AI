import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const MainPage = () => {
    const navigate = useNavigate();

    const [isLoggedIn, setIsLoggedIn] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem('accessToken');
        if (token) {
            setIsLoggedIn(true);
        }
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('accessToken');
        setIsLoggedIn(false);
    };

    return (
        <div style={styles.layout}>
            <div style={styles.topNav} className="top-nav-mobile">
                {isLoggedIn ? (
                    <button style={styles.authBtn} onClick={handleLogout}>
                        로그아웃
                    </button>
                ) : (
                    <>
                        <button style={styles.authBtn} onClick={() => navigate('/login')}>
                            로그인
                        </button>
                        <button style={styles.authBtnPrimary} onClick={() => navigate('/signup')}>
                            회원가입
                        </button>
                    </>
                )}
            </div>

            <div style={styles.content} className="main-content-mobile">
                <div style={styles.heroSection}>
                    <h1 style={styles.heroTitle} className="hero-title-mobile">
                        당신만의 스마트한<br/>학습 보조 튜터, <span style={styles.highlight}>Flow</span>
                    </h1>
                    <p style={styles.heroSubtitle} className="hero-subtitle-mobile">
                        AI가 만들어주는 오답노트부터 실시간 질의응답까지, 지금 바로 시작해보세요.
                    </p>

                    <div style={styles.menuGrid} className="menu-grid-mobile">
                        <div style={styles.menuCard} className="menu-card-hover menu-card-mobile" onClick={() => navigate('/ai-tutor')}>
                            <div style={styles.cardIcon}>🤖</div>
                            <div>
                                <h3 style={styles.cardTitle}>스마트 AI 튜터</h3>
                                <p style={styles.cardDesc}>모르는 문제를 사진으로 찍어 올리면 AI가 즉시 분석해 줍니다.</p>
                            </div>
                        </div>

                        <div style={styles.menuCard} className="menu-card-hover menu-card-mobile" onClick={() => navigate('/wrong-notes')}>
                            <div style={styles.cardIcon}>📝</div>
                            <div>
                                <h3 style={styles.cardTitle}>오답노트</h3>
                                <p style={styles.cardDesc}>틀린 문제만 모아서 나만의 오답노트를 자동으로 생성합니다.</p>
                            </div>
                        </div>

                        <div style={styles.menuCard} className="menu-card-hover menu-card-mobile" onClick={() => navigate('/board')}>
                            <div style={styles.cardIcon}>📋</div>
                            <div>
                                <h3 style={styles.cardTitle}>스터디 게시판</h3>
                                <p style={styles.cardDesc}>다른 학습자들과 함께 지식을 공유하고 소통해보세요.</p>
                            </div>
                        </div>

                        <div style={styles.menuCard} className="menu-card-hover menu-card-mobile" onClick={() => navigate('/map')}>
                            <div style={styles.cardIcon}>🗺️</div>
                            <div>
                                <h3 style={styles.cardTitle}>지도 AI</h3>
                                <p style={styles.cardDesc}>내 주변의 스터디 카페나 도서관을 찾아줍니다.</p>
                            </div>
                        </div>

                        <div style={styles.menuCard} className="menu-card-hover menu-card-mobile" onClick={() => navigate('/chat')}>
                            <div style={styles.cardIcon}>💬</div>
                            <div>
                                <h3 style={styles.cardTitle}>스터디 채팅</h3>
                                <p style={styles.cardDesc}>다른 학습자들과 실시간으로 소통해보세요.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
                .menu-card-hover:hover {
                    transform: translateY(-5px);
                    box-shadow: 0 20px 40px -10px rgba(0,0,0,0.1) !important;
                    border-color: #e0e7ff !important;
                }

                @media screen and (max-width: 768px) {
                    .top-nav-mobile {
                        padding: 15px 20px !important;
                    }
                    .main-content-mobile {
                        padding: 10px 20px 60px 20px !important;
                    }
                    .hero-title-mobile { font-size: 28px !important; }
                    .hero-subtitle-mobile { font-size: 15px !important; margin-bottom: 30px !important; word-break: keep-all; }

                    .menu-grid-mobile {
                        display: flex !important;
                        flex-direction: column !important;
                        gap: 16px !important;
                    }
                    .menu-card-mobile {
                        padding: 20px !important;
                        display: flex !important;
                        flex-direction: row !important;
                        align-items: center !important;
                        gap: 16px !important;
                        text-align: left !important;
                        width: 100% !important;
                        box-sizing: border-box !important;
                        box-shadow: 0 4px 12px rgba(0,0,0,0.06) !important;
                    }
                    .menu-card-mobile .cardIcon {
                        width: 56px !important;
                        height: 56px !important;
                        font-size: 28px !important;
                        margin-bottom: 0 !important;
                        flex-shrink: 0;
                    }
                    .menu-card-mobile h3 { font-size: 17px !important; margin-top: 0 !important; margin-bottom: 4px !important; }
                    .menu-card-mobile p { font-size: 13px !important; margin: 0 !important; }
                }
            `}</style>
        </div>
    );
};

const styles = {
    layout: { width: '100vw', height: '100dvh', display: 'flex', flexDirection: 'column', backgroundColor: '#f8fafc', overflow: 'hidden' },
    topNav: { width: '100%', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', padding: '20px 40px', boxSizing: 'border-box', gap: '12px' },
    authBtn: { background: 'transparent', border: 'none', fontSize: '14px', fontWeight: '600', color: '#64748b', cursor: 'pointer', padding: '8px 12px', transition: 'color 0.2s' },
    authBtnPrimary: { background: '#4f46e5', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '600', color: '#ffffff', cursor: 'pointer', padding: '8px 16px', transition: 'background 0.2s', boxShadow: '0 2px 4px rgba(79, 70, 229, 0.2)' },
    content: { flex: 1, display: 'flex', justifyContent: 'center', padding: '20px 20px 50px 20px', overflowY: 'auto' },
    heroSection: { maxWidth: '1000px', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' },
    heroTitle: { fontSize: '42px', fontWeight: '800', color: '#1e293b', lineHeight: '1.3', marginBottom: '20px' },
    highlight: { color: '#4f46e5' },
    heroSubtitle: { fontSize: '18px', color: '#64748b', marginBottom: '50px' },
    menuGrid: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '24px', width: '100%' },
    menuCard: { background: '#fff', padding: '32px', borderRadius: '24px', boxShadow: '0 8px 24px -10px rgba(0,0,0,0.05)', cursor: 'pointer', transition: 'all 0.3s ease', border: '1px solid #f1f5f9', display: 'flex', flexDirection: 'column', alignItems: 'center' },
    cardIcon: { fontSize: '40px', marginBottom: '20px', background: '#f8fafc', width: '80px', height: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '24px' },
    cardTitle: { margin: '0 0 10px 0', fontSize: '20px', color: '#1e293b', fontWeight: '700' },
    cardDesc: { margin: 0, color: '#64748b', fontSize: '15px', lineHeight: '1.5' }
};

export default MainPage;