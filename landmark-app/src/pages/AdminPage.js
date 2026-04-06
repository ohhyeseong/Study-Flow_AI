import React, { useState, useEffect } from 'react';
import apiClient from '../api';
import Header from '../components/Header';
import { useNavigate } from 'react-router-dom';

const AdminPage = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const role = localStorage.getItem('role');
        if (role !== 'ADMIN') {
            alert('관리자만 접근 가능합니다.');
            navigate('/');
            return;
        }
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const response = await apiClient.get('/api/admin/users');
            setUsers(response.data.data || []);
            setLoading(false);
        } catch (error) {
            console.error('Failed to fetch users:', error);
            setLoading(false);
        }
    };

    const handleBan = async (userId) => {
        if (!window.confirm('이 사용자를 정지하시겠습니까?')) return;
        try {
            await apiClient.post(`/api/admin/users/${userId}/ban`);
            alert('사용자가 정지되었습니다.');
            fetchUsers();
        } catch (error) {
            console.error('Failed to ban user:', error);
            alert('정지 처리에 실패했습니다.');
        }
    };

    const handleUnban = async (userId) => {
        if (!window.confirm('이 사용자의 정지를 해제하시겠습니까?')) return;
        try {
            await apiClient.post(`/api/admin/users/${userId}/unban`);
            alert('정지가 해제되었습니다.');
            fetchUsers();
        } catch (error) {
            console.error('Failed to unban user:', error);
            alert('해제 처리에 실패했습니다.');
        }
    };

    if (loading) return <div>Loading...</div>;

    return (
        <div style={styles.layout}>
            <Header />
            <div style={styles.container}>
                <div style={styles.content}>
                    <h2 style={styles.title}>🛡️ 관리자 대시보드 - 유저 관리</h2>
                    <div style={styles.tableWrapper}>
                        <table style={styles.table}>
                            <thead>
                                <tr>
                                    <th style={styles.th}>ID</th>
                                    <th style={styles.th}>사용자명</th>
                                    <th style={styles.th}>닉네임</th>
                                    <th style={styles.th}>이메일</th>
                                    <th style={styles.th}>역할</th>
                                    <th style={styles.th}>상태</th>
                                    <th style={styles.th}>동작</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map(user => (
                                    <tr key={user.id} style={styles.tr}>
                                        <td style={styles.td}>{user.id}</td>
                                        <td style={styles.td}>{user.username}</td>
                                        <td style={styles.td}>{user.nickname}</td>
                                        <td style={styles.td}>{user.email}</td>
                                        <td style={styles.td}>
                                            <span style={user.role === 'ADMIN' ? styles.adminBadge : styles.userBadge}>
                                                {user.role}
                                            </span>
                                        </td>
                                        <td style={styles.td}>
                                            {user.isBanned ? 
                                                <span style={styles.bannedText}>정지됨</span> : 
                                                <span style={styles.activeText}>정상</span>
                                            }
                                        </td>
                                        <td style={styles.td}>
                                            {user.role !== 'ADMIN' && (
                                                user.isBanned ? 
                                                <button onClick={() => handleUnban(user.id)} style={styles.unbanBtn}>해제</button> :
                                                <button onClick={() => handleBan(user.id)} style={styles.banBtn}>정지</button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

const styles = {
    layout: { minHeight: '100vh', backgroundColor: '#f1f5f9' },
    container: { maxWidth: '1200px', margin: '40px auto', padding: '0 20px' },
    content: { backgroundColor: '#fff', borderRadius: '16px', padding: '30px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' },
    title: { fontSize: '24px', fontWeight: '800', color: '#0f172a', marginBottom: '30px' },
    tableWrapper: { overflowX: 'auto' },
    table: { width: '100%', borderCollapse: 'collapse', textAlign: 'left' },
    th: { padding: '16px', borderBottom: '2px solid #e2e8f0', color: '#64748b', fontSize: '14px', fontWeight: 'bold' },
    tr: { borderBottom: '1px solid #f1f5f9', transition: 'background 0.2s' },
    td: { padding: '16px', fontSize: '14px', color: '#1e293b' },
    adminBadge: { backgroundColor: '#e0e7ff', color: '#4338ca', padding: '4px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 'bold' },
    userBadge: { backgroundColor: '#f1f5f9', color: '#64748b', padding: '4px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 'bold' },
    bannedText: { color: '#ef4444', fontWeight: 'bold' },
    activeText: { color: '#10b981', fontWeight: 'bold' },
    banBtn: { padding: '6px 12px', backgroundColor: '#fef2f2', color: '#ef4444', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' },
    unbanBtn: { padding: '6px 12px', backgroundColor: '#ecfdf5', color: '#10b981', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' },
};

export default AdminPage;
