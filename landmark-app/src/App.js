import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import SignUpPage from './pages/SignUpPage';
import MainPage from './pages/MainPage';
import MapPage from './pages/MapPage';
import BoardPage from './pages/BoardPage';
import ChatPage from './pages/ChatPage';
import WrongNotePage from './pages/WrongNotePage';

// 수정된 PrivateRoute (Outlet 사용)
const PrivateRoute = () => {
    const token = localStorage.getItem('token');
    return token ? <Outlet /> : <Navigate to="/login" replace />;
};

function App() {
    return (
        <Router>
            <div className="App">
                <Routes>
                    <Route path="/" element={<Navigate to="/login" replace />} />
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/signup" element={<SignUpPage />} />

                    <Route element={<PrivateRoute />}>
                        <Route path="/main" element={<MainPage />} />
                        <Route path="/map" element={<MapPage />} />
                        <Route path="/board" element={<BoardPage />} />
                        <Route path="/chat" element={<ChatPage />} />
                        <Route path="/wrong-note" element={<WrongNotePage />} />
                    </Route>

                    <Route path="*" element={<div>페이지를 찾을 수 없습니다.</div>} />
                </Routes>
            </div>
        </Router>
    );
}

export default App;