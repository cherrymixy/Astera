import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
    const { login } = useAuth();
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await login(email, password);
            navigate('/home');
        } catch (err: any) {
            setError(err.message || '로그인에 실패했습니다.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', padding: 'clamp(1rem, 5vw, 2rem)', overflow: 'hidden' }}>
            <div style={{ width: '100%', maxWidth: '380px' }}>
                <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
                    <div style={{ marginBottom: '0.75rem' }}>
                        <img src="/logo.svg" alt="Astera" style={{ width: '40px', height: '40px' }} />
                    </div>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
                        Astera
                    </h1>
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-tertiary)' }}>로그인하고 철학을 사랑해 보세요.</p>
                </div>

                <form onSubmit={handleSubmit}>
                    {error && (
                        <div style={{ padding: '0.75rem 1rem', marginBottom: '1.25rem', background: 'var(--danger)', borderRadius: 'var(--radius-sm)', color: 'var(--danger-text)', fontSize: '0.85rem' }}>
                            {error}
                        </div>
                    )}
                    <div style={{ marginBottom: '0.75rem' }}>
                        <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-tertiary)', marginBottom: '0.35rem' }}>이메일</label>
                        <input type="email" value={email} onChange={e => setEmail(e.target.value)} required autoFocus placeholder="email@example.com" />
                    </div>
                    <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-tertiary)', marginBottom: '0.35rem' }}>비밀번호</label>
                        <input type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="6자 이상" />
                    </div>
                    <button type="submit" disabled={loading} className="btn-primary">
                        {loading ? '로그인 중...' : '로그인'}
                    </button>
                </form>

                <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
                    <Link to="/register" style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', textDecoration: 'none' }}>
                        아직 계정이 없으신가요? <span style={{ color: 'var(--accent)', fontWeight: '500' }}>회원가입</span>
                    </Link>
                </div>
            </div>
        </div>
    );
}
