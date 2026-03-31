import React from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';

const LandingPage = () => {
    const navigate = useNavigate();

    return (
        <div style={styles.layout}>
            <Header />
            {/* Hero Section: 서비스의 첫인상 */}
            <section style={styles.hero}>
                <h1 style={styles.heroTitle}>Study-Flow AI</h1>
                <p style={styles.heroSubtitle}>
                    이미지 분석부터 맞춤형 퀴즈까지, <br />
                    AI 튜터와 함께하는 가장 스마트한 학습 경험.
                </p>
                <div style={styles.buttonGroup}>
                    <button onClick={() => navigate('/ai-tutor')} style={styles.mainBtn}>학습 시작하기</button>
                    <button onClick={() => navigate('/performance')} style={styles.subBtn}>성능 지표 확인</button>
                </div>
            </section>

            {/* Feature Cards: 핵심 기능 요약 */}
            <section style={styles.featureSection}>
                <div style={styles.featureGrid}>
                    <div style={styles.featureCard}>
                        <div style={styles.icon}>🔍</div>
                        <h3>스마트 분석</h3>
                        <p>학습 자료를 업로드하면 AI가 핵심 내용을 즉시 파악합니다.</p>
                    </div>
                    <div style={styles.featureCard}>
                        <div style={styles.icon}>📝</div>
                        <h3>맞춤형 퀴즈</h3>
                        <p>분석된 내용을 바탕으로 실력을 점검할 수 있는 퀴즈를 생성합니다.</p>
                    </div>
                    <div style={styles.featureCard}>
                        <div style={styles.icon}>⚡</div>
                        <h3>압도적 속도</h3>
                        <p>Redis 캐싱 기술로 동일 질문에 대해 0.06초의 응답 속도를 보장합니다.</p>
                    </div>
                </div>
            </section>
        </div>
    );
};

const styles = {
    layout: { width: '100vw', backgroundColor: '#fff', color: '#1e293b' },
    hero: { padding: '100px 20px', textAlign: 'center', backgroundColor: '#f8fafc' },
    heroTitle: { fontSize: '56px', fontWeight: '900', marginBottom: '20px', color: '#4285F4' },
    heroSubtitle: { fontSize: '20px', color: '#64748b', lineHeight: '1.6', marginBottom: '40px' },
    buttonGroup: { display: 'flex', justifyContent: 'center', gap: '15px' },
    mainBtn: { padding: '16px 32px', fontSize: '18px', fontWeight: 'bold', color: '#fff', backgroundColor: '#4285F4', border: 'none', borderRadius: '12px', cursor: 'pointer', transition: '0.3s' },
    subBtn: { padding: '16px 32px', fontSize: '18px', fontWeight: 'bold', color: '#4285F4', backgroundColor: '#fff', border: '2px solid #4285F4', borderRadius: '12px', cursor: 'pointer' },
    featureSection: { maxWidth: '1200px', margin: '0 auto', padding: '80px 20px' },
    featureGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '30px' },
    featureCard: { padding: '40px', borderRadius: '24px', backgroundColor: '#fff', border: '1px solid #e2e8f0', textAlign: 'center', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.05)' },
    icon: { fontSize: '40px', marginBottom: '20px' }
};

export default LandingPage;