import React from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';

const LandingPage = () => {
    const navigate = useNavigate();

    return (
        <div style={styles.layout}>
            <Header />

            <section style={styles.hero}>
                <div style={styles.heroContent}>
                    <div style={styles.badge}>✨ 당신만의 AI 학습 튜터</div>
                    <h1 style={styles.heroTitle}>
                        학습의 흐름을 바꾸다,<br />
                        <span style={styles.highlight}>Study-Flow AI</span>
                    </h1>
                    <p style={styles.heroSubtitle}>
                        방대한 학습 자료 분석부터 나만의 맞춤형 오답 노트까지.<br />
                        당신의 모든 공부 과정을 스마트하게 연결합니다.
                    </p>
                    <div style={styles.buttonGroup}>
                        <button onClick={() => navigate('/ai-tutor')} style={styles.mainBtn}>🚀 지금 바로 시작하기</button>
                        <button onClick={() => navigate('/performance')} style={styles.subBtn}>📊 시스템 성능 지표</button>
                    </div>
                </div>
            </section>

            <section style={styles.featureSection}>
                <div style={styles.sectionHeader}>
                    <h2>압도적인 퍼포먼스로 학습에 몰입하세요</h2>
                    <p>최신 AI 기술과 Redis 캐싱 아키텍처가 결합된 완벽한 스터디 솔루션</p>
                </div>
                <div style={styles.featureGrid}>
                    <div style={styles.featureCard}>
                        <div style={styles.iconWrapper}>🔍</div>
                        <h3>스마트 문서 분석</h3>
                        <p>어떤 자료든 업로드하세요. AI가 핵심 문맥을 0.1초 만에 파악하여 요약합니다.</p>
                    </div>
                    <div style={styles.featureCard}>
                        <div style={styles.iconWrapper}>📝</div>
                        <h3>맞춤형 AI 퀴즈</h3>
                        <p>분석된 내용을 바탕으로 내 실력에 딱 맞는 난이도의 퀴즈를 자동 생성합니다.</p>
                    </div>
                    <div style={styles.featureCard}>
                        <div style={styles.iconWrapper}>⚡</div>
                        <h3>초고속 응답 속도</h3>
                        <p>Redis 캐싱 기술을 도입하여 동일한 질문에 대해 지연 없는 응답을 보장합니다.</p>
                    </div>
                </div>
            </section>
        </div>
    );
};

const styles = {
    layout: { width: '100vw', minHeight: '100vh', backgroundColor: '#fff', color: '#1e293b', overflowX: 'hidden' },
    hero: {
        padding: '120px 20px',
        textAlign: 'center',
        background: 'linear-gradient(135deg, #f0f4ff 0%, #ffffff 100%)',
        position: 'relative'
    },
    heroContent: { maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center' },
    badge: { padding: '8px 16px', backgroundColor: '#e0e7ff', color: '#4338ca', borderRadius: '30px', fontSize: '14px', fontWeight: 'bold', marginBottom: '20px' },
    heroTitle: { fontSize: '56px', fontWeight: '900', marginBottom: '24px', color: '#0f172a', lineHeight: '1.2', letterSpacing: '-1px' },
    highlight: { background: 'linear-gradient(90deg, #4285F4, #8b5cf6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' },
    heroSubtitle: { fontSize: '20px', color: '#475569', lineHeight: '1.6', marginBottom: '40px' },
    buttonGroup: { display: 'flex', justifyContent: 'center', gap: '16px', flexWrap: 'wrap' },
    mainBtn: { padding: '18px 36px', fontSize: '18px', fontWeight: 'bold', color: '#fff', backgroundColor: '#4285F4', border: 'none', borderRadius: '16px', cursor: 'pointer', boxShadow: '0 10px 20px -5px rgba(66, 133, 244, 0.4)', transition: 'transform 0.2s' },
    subBtn: { padding: '18px 36px', fontSize: '18px', fontWeight: 'bold', color: '#4285F4', backgroundColor: '#fff', border: '2px solid #e2e8f0', borderRadius: '16px', cursor: 'pointer', transition: 'border-color 0.2s' },
    featureSection: { maxWidth: '1200px', margin: '0 auto', padding: '100px 20px' },
    sectionHeader: { textAlign: 'center', marginBottom: '60px' },
    featureGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '30px' },
    featureCard: { padding: '40px', borderRadius: '24px', backgroundColor: '#fff', border: '1px solid #f1f5f9', textAlign: 'left', boxShadow: '0 20px 40px -10px rgba(0,0,0,0.05)', transition: 'transform 0.3s, boxShadow 0.3s' },
    iconWrapper: { fontSize: '32px', width: '60px', height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc', borderRadius: '16px', marginBottom: '24px' }
};

export default LandingPage;