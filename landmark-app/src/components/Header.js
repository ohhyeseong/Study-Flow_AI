import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import apiClient from '../api';

const Header = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const handleLogout = async () => {
        try {
            await apiClient.post('/api/auth/logout');
            localStorage.removeItem('token');
            navigate('/login');
        } catch (error) {
            console.error('로그아웃 중 오류가 발생했습니다:', error);
            localStorage.removeItem('token');
            navigate('/login');
        }
    };

    const getNavStyle = (path) => {
        return location.pathname === path
            ? { ...styles.navItem, ...styles.activeNavItem }
            : styles.navItem;
    };

    return (
        <header style={styles.header}>
            <div style={styles.logoContainer} onClick={() => navigate('/main')}>
                <span style={styles.logoIcon}>🌊</span>
                <span style={styles.logoText}>Study-Flow</span>
            </div>

            <nav style={styles.navMenu} className="header-nav-mobile">
                <button style={getNavStyle('/ai-tutor')} onClick={() => navigate('/ai-tutor')}>
                    🤖 AI 튜터
                </button>
                <button style={getNavStyle('/map')} onClick={() => navigate('/map')}>
                    🗺️ 지도 AI
                </button>
                <button style={getNavStyle('/board')} onClick={() => navigate('/board')}>
                    📋 게시판
                </button>
                <button style={getNavStyle('/wrong-notes')} onClick={() => navigate('/wrong-notes')}>
                    📝 오답노트
                </button>
            </nav>

            <div style={styles.userActions}>
                <button style={styles.logoutBtn} onClick={handleLogout}>
                    로그아웃
                </button>
            </div>

            <style>{`
                @media screen and (max-width: 768px) {
                    header {
                        flex-direction: column !important;
                        padding: 15px 10px !important;
                        height: auto !important;
                        gap: 15px !important;
                        position: relative !important;
                    }
                    .header-nav-mobile {
                        width: 100% !important;
                        display: flex !important;
                        overflow-x: auto !important;
                        justify-content: flex-start !important;
                        padding-bottom: 5px !important;
                        gap: 8px !important;
                        -ms-overflow-style: none;
                        scrollbar-width: none;
                    }
                    .header-nav-mobile::-webkit-scrollbar {
                        display: none;
                    }
                    .header-nav-mobile button {
                        white-space: nowrap !important;
                        padding: 8px 12px !important;
                        font-size: 14px !important;
                        flex-shrink: 0 !important;
                    }
                    header > div:last-child {
                        position: absolute !important;
                        top: 15px !important;
                        right: 15px !important;
                    }
                    header > div:last-child button {
                        padding: 6px 12px !important;
                        font-size: 12px !important;
                    }
                }
            `}</style>
        </header>
    );
};

const styles = {
    header: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 30px',
        height: '70px',
        backgroundColor: '#fff',
        boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
        position: 'relative',
        zIndex: 100
    },
    logoContainer: {
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        cursor: 'pointer'
    },
    logoIcon: {
        fontSize: '24px'
    },
    logoText: {
        fontSize: '20px',
        fontWeight: '800',
        color: '#1e293b'
    },
    navMenu: {
        display: 'flex',
        gap: '10px'
    },
    navItem: {
        padding: '10px 16px',
        border: 'none',
        background: 'transparent',
        color: '#64748b',
        fontSize: '15px',
        fontWeight: '600',
        borderRadius: '12px',
        cursor: 'pointer',
        transition: 'all 0.2s'
    },
    activeNavItem: {
        backgroundColor: '#e0e7ff',
        color: '#4f46e5'
    },
    userActions: {
        display: 'flex',
        alignItems: 'center',
        gap: '15px'
    },
    logoutBtn: {
        padding: '8px 20px',
        border: '1px solid #e2e8f0',
        background: '#fff',
        color: '#ef4444',
        fontWeight: '600',
        borderRadius: '20px',
        cursor: 'pointer',
        transition: '0.2s'
    }
};

export default Header;