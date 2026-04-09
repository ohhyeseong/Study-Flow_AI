import React, { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import apiClient from '../api';

const LoginPage = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();

    const from = location.state?.from || '/';

    const handleLogin = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const response = await apiClient.post('/api/auth/login', {
                username: username,
                password: password,
            });

            let token = response.headers['authorization'];

            if (!token && response.data.data && response.data.data.accessToken) {
                token = response.data.data.accessToken;
            }

            if (token) {
                const pureToken = token.startsWith('Bearer ') ? token.substring(7).trim() : token.trim();
                localStorage.setItem('accessToken', pureToken);
                localStorage.setItem('username', username);
                localStorage.setItem('role', response.data.data.role);

                alert("로그인에 성공했습니다!");

                navigate(from, { replace: true });
                window.location.reload();
            } else {
                alert("로그인 성공했으나 서버로부터 토큰을 받지 못했습니다.");
            }

        } catch (error) {
            console.error('로그인 실패:', error);
            const errorMsg = error.response?.data?.message || '아이디 또는 비밀번호를 확인하세요.';
            alert(`로그인 실패: ${errorMsg}`);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div style={styles.container}>
            <div style={styles.loginCard}>
                <div style={styles.headerArea}>
                    <h1 style={styles.logoText}>Study-Flow <span style={{ color: '#4285F4' }}>AI</span></h1>
                    <p style={styles.subtitle}>스마트한 학습의 시작, 다시 몰입해볼까요?</p>
                </div>

                <form onSubmit={handleLogin} style={styles.form}>
                    <div style={styles.inputGroup}>
                        <label style={styles.label}>아이디</label>
                        <input
                            type="text"
                            placeholder="아이디를 입력하세요"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            style={styles.input}
                            autoComplete="username"
                            required
                        />
                    </div>

                    <div style={styles.inputGroup}>
                        <label style={styles.label}>비밀번호</label>
                        <input
                            type="password"
                            placeholder="비밀번호를 입력하세요"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            style={styles.input}
                            autoComplete="current-password"
                            required
                        />
                    </div>

                    <button type="submit" disabled={isLoading} style={styles.loginBtn}>
                        {isLoading ? "로그인 중..." : "로그인"}
                    </button>
                </form>

                <div style={styles.divider}>
                    <div style={styles.dividerLine}></div>
                    <span style={styles.dividerText}>또는</span>
                    <div style={styles.dividerLine}></div>
                </div>

                <div style={styles.footer}>
                    <span style={styles.footerText}>아직 계정이 없으신가요?</span>
                    <Link to="/signup" style={styles.signupLink}>회원가입 하기</Link>
                </div>
            </div>
        </div>
    );
};

const styles = {
    container: {
        width: '100vw',
        height: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)'
    },
    loginCard: {
        width: '90%',
        maxWidth: '420px',
        padding: '50px 40px',
        backgroundColor: '#fff',
        borderRadius: '32px',
        boxShadow: '0 20px 40px rgba(0,0,0,0.05)',
        textAlign: 'center'
    },
    headerArea: { marginBottom: '35px' },
    logoText: { fontSize: '30px', fontWeight: '900', color: '#1e293b', marginBottom: '8px' },
    subtitle: { fontSize: '14px', color: '#64748b' },
    form: { display: 'flex', flexDirection: 'column', gap: '18px' },
    inputGroup: { textAlign: 'left' },
    label: { display: 'block', fontSize: '13px', fontWeight: '700', color: '#475569', marginBottom: '8px', marginLeft: '4px' },
    input: {
        width: '100%',
        padding: '16px',
        borderRadius: '14px',
        border: '1px solid #e2e8f0',
        backgroundColor: '#f8fafc',
        fontSize: '15px',
        outline: 'none',
        boxSizing: 'border-box'
    },
    loginBtn: {
        width: '100%',
        padding: '16px',
        borderRadius: '14px',
        border: 'none',
        backgroundColor: '#4285F4',
        color: '#fff',
        fontSize: '16px',
        fontWeight: 'bold',
        cursor: 'pointer',
        marginTop: '10px',
        boxShadow: '0 8px 16px rgba(66, 133, 244, 0.2)'
    },
    divider: { display: 'flex', alignItems: 'center', margin: '25px 0', width: '100%' },
    dividerLine: { flex: 1, height: '1px', backgroundColor: '#e2e8f0' },
    dividerText: { padding: '0 15px', fontSize: '13px', color: '#94a3b8' },
    footer: { display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' },
    footerText: { fontSize: '14px', color: '#64748b' },
    signupLink: { fontSize: '14px', color: '#4285F4', fontWeight: '700', textDecoration: 'none' }
};

export default LoginPage;