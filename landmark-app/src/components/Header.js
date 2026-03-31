import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const [hoveredTab, setHoveredTab] = useState(null);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  const menuItems = [
    { name: '서비스 소개', path: '/' },
    { name: 'AI 학습', path: '/ai-tutor' },
    { name: '스터디 맵', path: '/map' },
    { name: '게시판', path: '/board' },
    { name: '채팅', path: '/chat' },
    { name: '오답노트', path: '/wrong-notes' },
    { name: '성능 지표', path: '/performance' },
  ];

  return (
    <header style={headerStyles.navBar}>
      <div style={headerStyles.container}>
        {/* 로고 영역 */}
        <div style={headerStyles.logo} onClick={() => navigate('/')}>
          <span style={headerStyles.logoIcon}>⚡</span> StudyFlow <span style={{color: '#94a3b8', fontWeight: '400'}}>AI</span>
        </div>

        {/* 네비게이션 메뉴 */}
        <nav style={headerStyles.navRight}>
          <div style={headerStyles.menuGroup}>
            {menuItems.map((item) => (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                onMouseEnter={() => setHoveredTab(item.path)}
                onMouseLeave={() => setHoveredTab(null)}
                style={headerStyles.tabBtn(isActive(item.path), hoveredTab === item.path)}
              >
                {item.name}
              </button>
            ))}
          </div>

          <div style={headerStyles.divider} />

          <button
            onClick={handleLogout}
            style={headerStyles.logoutBtn}
            onMouseEnter={(e) => e.target.style.backgroundColor = '#fecaca'}
            onMouseLeave={(e) => e.target.style.backgroundColor = '#fee2e2'}
          >
            로그아웃
          </button>
        </nav>
      </div>
    </header>
  );
}

const headerStyles = {
  navBar: {
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    backdropFilter: 'blur(10px)',
    borderBottom: '1px solid #f1f5f9',
    position: 'sticky',
    top: 0,
    zIndex: 1000
  },
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0 24px',
    height: '70px'
  },
  logo: {
    fontSize: '20px',
    fontWeight: '800',
    color: '#0f172a',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    letterSpacing: '-0.5px'
  },
  logoIcon: {
    backgroundColor: '#4285F4',
    color: '#fff',
    width: '28px',
    height: '28px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '8px',
    fontSize: '14px'
  },
  navRight: { display: 'flex', alignItems: 'center', gap: '20px' },
  menuGroup: { display: 'flex', gap: '4px' },
  tabBtn: (active, hovered) => ({
    padding: '8px 16px',
    backgroundColor: active ? '#eff6ff' : (hovered ? '#f8fafc' : 'transparent'),
    color: active ? '#4285F4' : '#64748b',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: active ? '700' : '500',
    fontSize: '14px',
    transition: 'all 0.2s ease',
  }),
  divider: { width: '1px', height: '20px', backgroundColor: '#e2e8f0' },
  logoutBtn: {
    padding: '8px 16px',
    backgroundColor: '#fee2e2',
    color: '#ef4444',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '600',
    transition: 'all 0.2s ease'
  },
};

export default Header;