import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import apiClient from '../api';

const SignUpPage = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [nickname, setNickname] = useState('');
    const [email, setEmail] = useState('');
    const [verificationCode, setVerificationCode] = useState('');
    const [isEmailSent, setIsEmailSent] = useState(false);
    const [isEmailVerified, setIsEmailVerified] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const navigate = useNavigate();

    const handleSendVerification = async () => {
        if (!email) {
            alert("이메일을 입력해주세요.");
            return;
        }
        try {
            await apiClient.post(`/api/auth/email-send?email=${email}`);
            alert("인증번호가 이메일로 전송되었습니다.");
            setIsEmailSent(true);
        } catch (error) {
            alert("이메일 전송에 실패했습니다.");
        }
    };

    const handleVerifyCode = async () => {
        if (!verificationCode) {
            alert("인증번호를 입력해주세요.");
            return;
        }
        try {
            await apiClient.post(`http://localhost:8090/api/auth/email-verify?email=${email}&code=${verificationCode}`);
            alert("이메일 인증이 완료되었습니다!");
            setIsEmailVerified(true);
        } catch (error) {
            alert("인증번호가 일치하지 않거나 만료되었습니다.");
        }
    };

    const handleSignUp = async (e) => {
        e.preventDefault();
        if (!isEmailVerified) {
            alert("이메일 인증을 먼저 완료해주세요.");
            return;
        }
        if (username.length < 4 || nickname.length < 4) {
            alert("아이디와 닉네임은 4자 이상이어야 합니다.");
            return;
        }

        setIsLoading(true);
        try {
            await apiClient.post('http://localhost:8090/api/auth/signup', {
                username,
                password,
                nickname,
                email,
                authCode: "VERIFIED_USER"
            });
            alert('회원가입 완료! 로그인해주세요.');
            navigate('/login');
        } catch (error) {
            const msg = error.response?.data?.message || "회원가입에 실패했습니다.";
            alert(msg);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div style={styles.container}>
            <div style={styles.card}>
                <div style={styles.header}>
                    <h1 style={styles.logo}>Study-Flow <span style={{color: '#4285F4'}}>AI</span></h1>
                    <p style={styles.subtitle}>새로운 학습 여정을 시작해보세요</p>
                </div>

                <form onSubmit={handleSignUp} style={styles.form}>
                    <div style={styles.inputGroup}>
                        <label style={styles.label}>아이디 (4~20자)</label>
                        <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} style={styles.input} required minLength={4} maxLength={20} />
                    </div>

                    <div style={styles.inputGroup}>
                        <label style={styles.label}>닉네임 (4~20자)</label>
                        <input type="text" value={nickname} onChange={(e) => setNickname(e.target.value)} style={styles.input} required minLength={4} maxLength={20} />
                    </div>

                    <div style={styles.inputGroup}>
                        <label style={styles.label}>이메일</label>
                        <div style={styles.row}>
                            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} style={{...styles.input, flex: 1}} required disabled={isEmailVerified} />
                            <button type="button" onClick={handleSendVerification} disabled={isEmailVerified} style={{...styles.sideBtn, backgroundColor: isEmailVerified ? '#f1f5f9' : '#1e293b', color: isEmailVerified ? '#94a3b8' : '#fff'}}>
                                {isEmailVerified ? "인증됨" : "번호 전송"}
                            </button>
                        </div>
                    </div>

                    {isEmailSent && !isEmailVerified && (
                        <div style={styles.inputGroup}>
                            <label style={styles.label}>인증번호 확인</label>
                            <div style={styles.row}>
                                <input type="text" value={verificationCode} onChange={(e) => setVerificationCode(e.target.value)} style={{...styles.input, flex: 1}} placeholder="6자리 번호 입력" />
                                <button type="button" onClick={handleVerifyCode} style={styles.verifyBtn}>확인</button>
                            </div>
                        </div>
                    )}

                    <div style={styles.inputGroup}>
                        <label style={styles.label}>비밀번호</label>
                        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} style={styles.input} required />
                    </div>

                    <button type="submit" disabled={!isEmailVerified || isLoading} style={{...styles.submitBtn, backgroundColor: isEmailVerified ? '#4285F4' : '#cbd5e1'}}>
                        {isLoading ? "가입 처리 중..." : "회원가입 완료"}
                    </button>
                </form>

                <div style={styles.footer}>
                    <span>이미 계정이 있으신가요?</span>
                    <Link to="/login" style={styles.link}>로그인</Link>
                </div>
            </div>
        </div>
    );
};

const styles = {
    container: { width: '100vw', height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)' },
    card: { width: '90%', maxWidth: '450px', padding: '50px 40px', backgroundColor: '#fff', borderRadius: '32px', boxShadow: '0 20px 40px rgba(0,0,0,0.05)', textAlign: 'center' },
    header: { marginBottom: '30px' },
    logo: { fontSize: '28px', fontWeight: '900', color: '#1e293b', marginBottom: '8px' },
    subtitle: { fontSize: '14px', color: '#64748b' },
    form: { display: 'flex', flexDirection: 'column', gap: '16px' },
    inputGroup: { textAlign: 'left' },
    label: { display: 'block', fontSize: '13px', fontWeight: '700', color: '#475569', marginBottom: '6px', marginLeft: '4px' },
    input: { width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid #e2e8f0', backgroundColor: '#f8fafc', fontSize: '15px', outline: 'none', boxSizing: 'border-box' },
    row: { display: 'flex', gap: '8px' },
    sideBtn: { padding: '0 15px', borderRadius: '12px', border: 'none', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' },
    verifyBtn: { padding: '0 20px', borderRadius: '12px', border: '1px solid #4285F4', backgroundColor: '#fff', color: '#4285F4', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' },
    submitBtn: { width: '100%', padding: '16px', borderRadius: '14px', border: 'none', color: '#fff', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', marginTop: '10px', transition: '0.3s' },
    footer: { marginTop: '25px', display: 'flex', justifyContent: 'center', gap: '8px', fontSize: '14px', color: '#64748b' },
    link: { color: '#4285F4', fontWeight: '700', textDecoration: 'none' }
};

export default SignUpPage;