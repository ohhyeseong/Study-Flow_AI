import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import MainPage from './pages/MainPage';
import AiChatPage from './pages/AiChatPage';
import PerformancePage from './pages/PerformancePage';
import LoginPage from './pages/LoginPage';
import SignUpPage from './pages/SignUpPage';
import WrongNotePage from './pages/WrongNotePage';
import BoardPage from './pages/BoardPage';
import MapPage from './pages/MapPage';
import ChatPage from './pages/ChatPage';
import PostWritePage from './pages/PostWritePage';
import PostDetailPage from './pages/PostDetailPage';
import './App.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/main" element={<MainPage />} />

        <Route path="/ai-tutor" element={<AiChatPage />} />

        <Route path="/performance" element={<PerformancePage />} />

        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignUpPage />} />
        <Route path="/wrong-notes" element={<WrongNotePage />} />
        <Route path="/board" element={<BoardPage />} />
        <Route path="/map" element={<MapPage />} />
        <Route path="/chat" element={<ChatPage />} />
        <Route path="/post/write" element={<PostWritePage />} />
        <Route path="/post/:postId" element={<PostDetailPage />} />
      </Routes>
    </Router>
  );
}

export default App;