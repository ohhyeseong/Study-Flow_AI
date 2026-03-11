import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import SignUpPage from './pages/SignUpPage';
import MainPage from './pages/MainPage';
import BoardPage from './pages/BoardPage';
import ChatPage from './pages/ChatPage';
import MapPage from './pages/MapPage';

// ✅ 토큰 체크 로직은 그대로 유지
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


function App() {

    return (
        <Router>

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


export default App;