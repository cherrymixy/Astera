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

    const inputStyle = {
        width: '100%', padding: '0.875rem 1rem',
        background: 'rgba(255, 255, 255, 0.05)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '12px', color: '#e0e8ff', fontSize: '0.95rem',
        outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' as const,
    };

    return (
        <div style={{
            minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: '#04040f', padding: '2rem',
        }}>
            <div style={{
                width: '100%', maxWidth: '400px',
                background: 'rgba(15, 15, 40, 0.6)',
                borderRadius: '20px', padding: '3rem 2.5rem',
                border: '1px solid rgba(100, 130, 255, 0.1)',
            }}>
                <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
                    <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>✨</div>
                    <h1 style={{
                        fontSize: '1.6rem', fontWeight: '700', marginBottom: '0.5rem',
                        background: 'linear-gradient(135deg, #e0e8ff 0%, #a0b0ff 50%, #c0a0ff 100%)',
                        WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                    }}>
                        회원가입
                    </h1>
                    <p style={{ fontSize: '0.9rem', color: 'rgba(200, 210, 255, 0.4)' }}>
                        나만의 철학 별자리 여정을 시작하세요
                    </p>
                </div>

                <form onSubmit={handleSubmit}>
                    {error && (
                        <div style={{
                            padding: '0.75rem 1rem', marginBottom: '1.25rem',
                            background: 'rgba(255, 80, 80, 0.1)',
                            border: '1px solid rgba(255, 80, 80, 0.2)',
                            borderRadius: '10px', color: 'rgba(255, 140, 140, 0.9)',
                            fontSize: '0.85rem',
                        }}>
                            {error}
                        </div>
                    )}

                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', fontSize: '0.85rem', color: 'rgba(200, 210, 255, 0.5)', marginBottom: '0.4rem' }}>
                            이름
                        </label>
                        <input
                            type="text" value={name} onChange={e => setName(e.target.value)}
                            required autoFocus placeholder="별자리 탐험가"
                            style={inputStyle}
                            onFocus={e => { e.currentTarget.style.borderColor = 'rgba(100, 130, 255, 0.4)'; }}
                            onBlur={e => { e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)'; }}
                        />
                    </div>

                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', fontSize: '0.85rem', color: 'rgba(200, 210, 255, 0.5)', marginBottom: '0.4rem' }}>
                            이메일
                        </label>
                        <input
                            type="email" value={email} onChange={e => setEmail(e.target.value)}
                            required placeholder="email@example.com"
                            style={inputStyle}
                            onFocus={e => { e.currentTarget.style.borderColor = 'rgba(100, 130, 255, 0.4)'; }}
                            onBlur={e => { e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)'; }}
                        />
                    </div>

                    <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{ display: 'block', fontSize: '0.85rem', color: 'rgba(200, 210, 255, 0.5)', marginBottom: '0.4rem' }}>
                            비밀번호
                        </label>
                        <input
                            type="password" value={password} onChange={e => setPassword(e.target.value)}
                            required placeholder="6자 이상"
                            style={inputStyle}
                            onFocus={e => { e.currentTarget.style.borderColor = 'rgba(100, 130, 255, 0.4)'; }}
                            onBlur={e => { e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)'; }}
                        />
                    </div>

                    <button
                        type="submit" disabled={loading}
                        style={{
                            width: '100%', padding: '1rem',
                            background: 'linear-gradient(135deg, rgba(100, 130, 255, 0.3) 0%, rgba(150, 100, 255, 0.3) 100%)',
                            border: '1px solid rgba(150, 170, 255, 0.3)',
                            borderRadius: '14px', color: '#e0e8ff', fontSize: '1rem', fontWeight: '500',
                            cursor: loading ? 'not-allowed' : 'pointer',
                            transition: 'all 0.3s', fontFamily: 'inherit',
                            opacity: loading ? 0.6 : 1,
                        }}
                    >
                        {loading ? '가입 중...' : '회원가입'}
                    </button>
                </form>

                <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
                    <Link to="/login" style={{
                        color: 'rgba(150, 170, 255, 0.7)', fontSize: '0.9rem',
                        textDecoration: 'none',
                    }}>
                        이미 계정이 있으신가요? <span style={{ color: '#a0b0ff', fontWeight: '500' }}>로그인</span>
                    </Link>
                </div>
            </div>
        </div>
    );
}
