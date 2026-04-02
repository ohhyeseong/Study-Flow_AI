import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import Header from '../components/Header';

const PerformancePage = () => {
    // 포트폴리오 수치 (기존 측정값 반영)
    const [stats] = useState([
        { name: '최적화 전 (Local AI)', time: 11.14, color: '#ef4444' },
        { name: '최적화 후 (Redis)', time: 0.06, color: '#22c55e' }
    ]);

    return (
        <div style={styles.container}>
            <Header />
            <div style={styles.content}>
                <div style={styles.headerArea}>
                    <h2 style={styles.title}>⚡ 시스템 성능 모니터링</h2>
                    <p style={styles.subtitle}>Redis 캐싱 전략 적용에 따른 AI 분석 응답 속도 체감 지표</p>
                </div>

                <div style={styles.dashboardGrid}>
                    {/* 메인 차트 카드 */}
                    <div style={styles.chartCard}>
                        <h3 style={styles.cardTitle}>🚀 응답 속도 비교 (Latency)</h3>
                        <div style={{ height: '300px', marginTop: '20px' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={stats} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748b'}} />
                                    <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748b'}} />
                                    <Tooltip cursor={{fill: '#f8fafc'}} />
                                    <Bar dataKey="time" radius={[10, 10, 0, 0]} barSize={50}>
                                        {stats.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                        <p style={styles.chartInfo}>* 동일한 이미지 및 질문에 대한 재요청 시 성능 지표입니다.</p>
                    </div>

                    {/* 요약 정보 카드 */}
                    <div style={styles.sideArea}>
                        <div style={styles.statBox}>
                            <span style={styles.statLabel}>최대 개선율</span>
                            <span style={styles.statValue}>99.4%</span>
                        </div>
                        <div style={styles.statBox}>
                            <span style={styles.statLabel}>평균 응답 속도 (Cache Hit)</span>
                            <span style={{...styles.statValue, color: '#22c55e'}}>0.06s</span>
                        </div>
                        <div style={styles.statBox}>
                            <span style={styles.statLabel}>기존 지연 시간</span>
                            <span style={{...styles.statValue, color: '#ef4444'}}>11.14s</span>
                        </div>
                    </div>
                </div>

                {/* 기술적 설명 섹션 */}
                <div style={styles.techCard}>
                    <h3 style={styles.cardTitle}>🛠️ 적용된 기술 스택</h3>
                    <ul style={styles.techList}>
                        <li><strong>Redis (In-Memory DB):</strong> 분석 결과를 메모리에 캐싱하여 중복 연산 제거.</li>
                        <li><strong>Semantic Key Management:</strong> 이미지 식별자와 프롬프트 조합을 Key로 활용.</li>
                        <li><strong>Performance Analytics:</strong> Recharts 라이브러리를 이용한 실시간 시각화.</li>
                    </ul>
                </div>
            </div>
        </div>
    );
};

const styles = {
    container: { width: '100vw', minHeight: '100vh', backgroundColor: '#f8fafc', display: 'flex', flexDirection: 'column' },
    content: { flex: 1, maxWidth: '1100px', margin: '0 auto', padding: '40px 20px', width: '100%' },
    headerArea: { marginBottom: '40px' },
    title: { fontSize: '32px', fontWeight: '800', color: '#1e293b', marginBottom: '10px' },
    subtitle: { color: '#64748b', fontSize: '16px' },
    dashboardGrid: { display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px', marginBottom: '24px' },
    chartCard: { backgroundColor: '#fff', padding: '30px', borderRadius: '20px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' },
    cardTitle: { fontSize: '18px', fontWeight: '700', color: '#334155' },
    chartInfo: { fontSize: '12px', color: '#94a3b8', marginTop: '15px', textAlign: 'center' },
    sideArea: { display: 'flex', flexDirection: 'column', gap: '20px' },
    statBox: { backgroundColor: '#fff', padding: '24px', borderRadius: '20px', textAlign: 'center', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' },
    statLabel: { display: 'block', fontSize: '13px', color: '#64748b', fontWeight: '600', marginBottom: '10px' },
    statValue: { fontSize: '32px', fontWeight: '900', color: '#4285F4' },
    techCard: { backgroundColor: '#fff', padding: '30px', borderRadius: '20px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' },
    techList: { marginTop: '15px', color: '#475569', lineHeight: '2' }
};

export default PerformancePage;