import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function RegisterPage() {
    const { register } = useAuth();
    const navigate = useNavigate();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await register(email, password, name);
            navigate('/home');
        } catch (err: any) {
            setError(err.message || '회원가입에 실패했습니다.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', padding: 'clamp(1rem, 5vw, 2rem)' }}>
            <div style={{ width: '100%', maxWidth: '380px' }}>
                <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
                    <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>✨</div>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>회원가입</h1>
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-tertiary)' }}>나만의 철학 별자리 여정을 시작하세요</p>
                </div>

                <form onSubmit={handleSubmit}>
                    {error && (
                        <div style={{ padding: '0.75rem 1rem', marginBottom: '1.25rem', background: 'var(--danger)', borderRadius: 'var(--radius-sm)', color: 'var(--danger-text)', fontSize: '0.85rem' }}>{error}</div>
                    )}
                    <div style={{ marginBottom: '0.75rem' }}>
                        <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-tertiary)', marginBottom: '0.35rem' }}>이름</label>
                        <input type="text" value={name} onChange={e => setName(e.target.value)} required autoFocus placeholder="별자리 탐험가" />
                    </div>
                    <div style={{ marginBottom: '0.75rem' }}>
                        <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-tertiary)', marginBottom: '0.35rem' }}>이메일</label>
                        <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="email@example.com" />
                    </div>
                    <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-tertiary)', marginBottom: '0.35rem' }}>비밀번호</label>
                        <input type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="6자 이상" />
                    </div>
                    <button type="submit" disabled={loading} className="btn-primary">
                        {loading ? '가입 중...' : '회원가입'}
                    </button>
                </form>

                <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
                    <Link to="/login" style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', textDecoration: 'none' }}>
                        이미 계정이 있으신가요? <span style={{ color: 'var(--accent)', fontWeight: '500' }}>로그인</span>
                    </Link>
                </div>
            </div>
        </div>
    );
}
