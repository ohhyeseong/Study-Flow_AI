import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

function Header() {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <div style={headerStyles.navBar}>
      <div style={headerStyles.logo} onClick={() => navigate('/main')}>StudyFlow AI</div>
      <div style={headerStyles.navRight}>
        <button onClick={() => navigate('/main')} style={headerStyles.tabBtn(isActive('/main'))}>💬 AI 채팅</button>
        <button onClick={() => navigate('/map')} style={headerStyles.tabBtn(isActive('/map'))}>🗺️ 스터디 맵</button>
        <button onClick={() => navigate('/board')} style={headerStyles.tabBtn(isActive('/board'))}>📋 게시판</button>
        <button onClick={() => navigate('/chat')} style={headerStyles.tabBtn(isActive('/chat'))}>💬 채팅방</button>
        <button onClick={handleLogout} style={headerStyles.logoutBtn}>로그아웃</button>
      </div>
    </div>
  );
}

const headerStyles = {
  navBar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 40px', backgroundColor: '#fff', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', zIndex: 1000 },
  logo: { fontSize: '22px', fontWeight: 'bold', color: '#4285F4', cursor: 'pointer' },
  navRight: { display: 'flex', gap: '15px' },
  tabBtn: (active) => ({
    padding: '10px 15px', backgroundColor: active ? '#4285F4' : 'transparent',
    color: active ? '#fff' : '#555', border: 'none', borderRadius: '10px',
    cursor: 'pointer', fontWeight: 'bold'
  }),
  logoutBtn: { padding: '8px 15px', backgroundColor: '#ff4d4f', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer' },
};

export default Header;