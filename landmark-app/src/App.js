import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import MainPage from './pages/MainPage';
import AiChatPage from './pages/AiChatPage';
import LoginPage from './pages/LoginPage';
import SignUpPage from './pages/SignUpPage';
import WrongNotePage from './pages/WrongNotePage';
import BoardPage from './pages/BoardPage';
import MapPage from './pages/MapPage';
import ChatPage from './pages/ChatPage';
import PostWritePage from './pages/PostWritePage';
import PostDetailPage from './pages/PostDetailPage';
import MyPage from './pages/MyPage';
import AdminPage from './pages/AdminPage';
import './App.css';

const ProtectedRoute = ({ children, adminOnly = false }) => {
  const token = localStorage.getItem('accessToken');
  const role = localStorage.getItem('role');
  const location = useLocation();

  if (!token) {
    alert('로그인이 필요한 서비스입니다.');
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (adminOnly && role !== 'ADMIN') {
    alert('관리자 권한이 필요합니다.');
    return <Navigate to="/" replace />;
  }

  return children;
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<MainPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignUpPage />} />

        {/* 보호되는 라우트들 */}
        <Route path="/ai-tutor" element={<ProtectedRoute><AiChatPage /></ProtectedRoute>} />
        <Route path="/wrong-notes" element={<ProtectedRoute><WrongNotePage /></ProtectedRoute>} />
        <Route path="/chat" element={<ProtectedRoute><ChatPage /></ProtectedRoute>} />
        <Route path="/post/write" element={<ProtectedRoute><PostWritePage /></ProtectedRoute>} />
        <Route path="/mypage" element={<ProtectedRoute><MyPage /></ProtectedRoute>} />
        <Route path="/admin" element={<ProtectedRoute adminOnly={true}><AdminPage /></ProtectedRoute>} />

        {/* 공개 라우트들 */}
        <Route path="/board" element={<BoardPage />} />
        <Route path="/map" element={<MapPage />} />
        <Route path="/post/:postId" element={<PostDetailPage />} />
      </Routes>
    </Router>
  );
}

export default App;
