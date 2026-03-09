import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import SignUpPage from './pages/SignUpPage';
import MainPage from './pages/MainPage';
import BoardPage from './pages/BoardPage';
import ChatPage from './pages/ChatPage';
import MapPage from './pages/MapPage';

// ✅ 토큰이 실제로 유효한지 더 깐깐하게 체크 (null, undefined, 공백 방지)
const isAuthenticated = () => {
    const token = localStorage.getItem('token');
    return token !== null && token !== "undefined" && token !== "";
};

const PrivateRoute = ({ children }) => {
    return isAuthenticated() ? children : <Navigate to="/login" />;
};

const PublicRoute = ({ children }) => {
    return !isAuthenticated() ? children : <Navigate to="/main" />;
};

// ✅ 별도의 Header 컴포넌트 (useLocation 사용)
const Header = ({ onLogout }) => {
    const location = useLocation();
    const auth = isAuthenticated();

    // 메인페이지(/main)와 지도페이지(/map)는 자체 헤더를 쓰므로 여기서는 숨김
    if (location.pathname === '/main' || location.pathname === '/map') {
        return null;
    }

    return (
        <nav style={styles.header}>
            <Link to="/" style={styles.logo}>Study-Flow_Ai</Link>
            <div>
                {auth ? (
                    <>
                        <Link to="/main" style={styles.navLink}>AI 채팅</Link>
                        <Link to="/map" style={styles.navLink}>지도</Link>
                        <Link to="/board" style={styles.navLink}>게시판</Link>
                        <button onClick={onLogout} style={styles.logoutButton}>로그아웃</button>
                    </>
                ) : (
                    <>
                        <Link to="/login" style={styles.navLink}>로그인</Link>
                        <Link to="/signup" style={styles.navLink}>회원가입</Link>
                    </>
                )}
            </div>
        </nav>
    );
};

function App() {
    const handleLogout = () => {
        localStorage.removeItem('token');
        window.location.href = '/login';
    };

    return (
        <Router>
            {/* ✅ handleLogout을 onLogout으로 정확히 전달 */}
            <Header onLogout={handleLogout} />

            <Routes>
                <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
                <Route path="/signup" element={<PublicRoute><SignUpPage /></PublicRoute>} />

                <Route path="/main" element={<PrivateRoute><MainPage /></PrivateRoute>} />
                <Route path="/map" element={<PrivateRoute><MapPage /></PrivateRoute>} />
                <Route path="/board" element={<PrivateRoute><BoardPage /></PrivateRoute>} />
                <Route path="/chat" element={<PrivateRoute><ChatPage /></PrivateRoute>} />

                {/* 첫 접속 시 로직 */}
                <Route path="/" element={<Navigate to={isAuthenticated() ? "/main" : "/login"} />} />
                <Route path="*" element={<Navigate to="/" />} />
            </Routes>
        </Router>
    );
}

const styles = {
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 20px', height: '60px', backgroundColor: 'white', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', position: 'sticky', top: 0, zIndex: 1000 },
    logo: { fontWeight: 'bold', fontSize: '20px', color: '#4285F4', textDecoration: 'none' },
    navLink: { marginLeft: '20px', textDecoration: 'none', color: '#555', fontWeight: '500' },
    logoutButton: { marginLeft: '20px', padding: '8px 15px', backgroundColor: '#ff4d4f', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }
};

export default App;