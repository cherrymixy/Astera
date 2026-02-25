import { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { fetchAPI } from '../api/client';

interface RecognizedObject {
    name: string;
    description: string;
    philosophicalPrompt: string;
}

export default function CameraCapturePage() {
    const navigate = useNavigate();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [capturedImage, setCapturedImage] = useState<string | null>(null);
    const [recognizing, setRecognizing] = useState(false);
    const [recognized, setRecognized] = useState<RecognizedObject | null>(null);

    // 갤러리에서 선택
    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => setCapturedImage(reader.result as string);
        reader.readAsDataURL(file);
    };

    // AI 사물 인식
    const recognizeObject = async () => {
        if (!capturedImage) return;
        setRecognizing(true);
        try {
            const res = await fetchAPI<{ success: boolean; data: RecognizedObject }>(
                '/api/ai/recognize-object',
                { method: 'POST', body: JSON.stringify({ imageBase64: capturedImage }) }
            );
            setRecognized(res.data);
        } catch {
            alert('사물 인식에 실패했습니다. 다시 시도해주세요.');
        } finally {
            setRecognizing(false);
        }
    };

    const resetCapture = () => {
        setCapturedImage(null);
        setRecognized(null);
    };

    const startDiscussion = () => {
        if (!recognized) return;
        navigate('/session/new', {
            state: {
                objectName: recognized.name,
                objectDescription: recognized.description,
                objectPrompt: recognized.philosophicalPrompt,
                objectImage: capturedImage,
            }
        });
    };

    return (
        <div style={{ minHeight: '100vh', background: '#04040f', color: '#e0e8ff', display: 'flex', flexDirection: 'column' }}>
            {/* 헤더 */}
            <div style={{
                padding: '1rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(10, 10, 30, 0.8)',
            }}>
                <Link to="/home" style={{ color: 'rgba(200, 210, 255, 0.6)', fontSize: '0.9rem', textDecoration: 'none' }}>
                    ← 돌아가기
                </Link>
                <div style={{ fontSize: '0.9rem', color: 'rgba(200, 210, 255, 0.5)' }}>🖼️ 사물 인식</div>
            </div>

            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '2rem 1.5rem', gap: '1.5rem' }}>

                {recognized ? (
                    <div style={{ width: '100%', maxWidth: '500px', textAlign: 'center', animation: 'fadeInUp 0.6s ease' }}>
                        {capturedImage && (
                            <div style={{
                                width: '100%', borderRadius: '20px', overflow: 'hidden',
                                marginBottom: '1.5rem', border: '1px solid rgba(100, 130, 255, 0.2)',
                            }}>
                                <img src={capturedImage} alt="captured" style={{ width: '100%', display: 'block' }} />
                            </div>
                        )}
                        <div style={{
                            padding: '2rem', background: 'rgba(100, 130, 255, 0.08)',
                            borderRadius: '20px', border: '1px solid rgba(100, 130, 255, 0.15)', marginBottom: '1.5rem',
                        }}>
                            <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>✨</div>
                            <div style={{
                                fontSize: '1.4rem', fontWeight: '700', marginBottom: '0.5rem',
                                background: 'linear-gradient(135deg, #c0d0ff 0%, #a0b0ff 100%)',
                                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                            }}>
                                {recognized.name}
                            </div>
                            <div style={{ fontSize: '0.9rem', color: 'rgba(200, 210, 255, 0.5)', marginBottom: '1.25rem' }}>
                                {recognized.description}
                            </div>
                            <div style={{
                                fontSize: '1.05rem', fontStyle: 'italic', lineHeight: 1.7,
                                color: 'rgba(220, 230, 255, 0.85)', fontFamily: "'Noto Serif KR', serif",
                            }}>
                                "{recognized.philosophicalPrompt}"
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                            <button onClick={resetCapture} style={{
                                padding: '0.875rem 1.5rem', fontSize: '0.95rem',
                                background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)',
                                borderRadius: '12px', color: 'rgba(200, 210, 255, 0.6)',
                                cursor: 'pointer', fontFamily: 'inherit',
                            }}>다시 선택</button>
                            <button onClick={startDiscussion} style={{
                                padding: '0.875rem 2rem', fontSize: '0.95rem', fontWeight: '500',
                                background: 'linear-gradient(135deg, rgba(100, 130, 255, 0.3) 0%, rgba(150, 100, 255, 0.3) 100%)',
                                border: '1px solid rgba(150, 170, 255, 0.3)',
                                borderRadius: '12px', color: '#e0e8ff', cursor: 'pointer', fontFamily: 'inherit',
                                boxShadow: '0 4px 20px rgba(100, 130, 255, 0.15)',
                            }}>🌌 이 사물에 대해 이야기하기</button>
                        </div>
                    </div>
                ) : capturedImage ? (
                    <div style={{ width: '100%', maxWidth: '500px', textAlign: 'center' }}>
                        <div style={{
                            width: '100%', borderRadius: '20px', overflow: 'hidden',
                            marginBottom: '1.5rem', border: '1px solid rgba(100, 130, 255, 0.15)',
                        }}>
                            <img src={capturedImage} alt="captured" style={{ width: '100%', display: 'block' }} />
                        </div>
                        {recognizing ? (
                            <div style={{ padding: '1.5rem', color: 'rgba(200, 210, 255, 0.6)', fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem' }}>
                                <span style={{
                                    display: 'inline-block', width: '12px', height: '12px', borderRadius: '50%',
                                    border: '2px solid rgba(100, 130, 255, 0.4)', borderTopColor: '#a0b0ff',
                                    animation: 'spin 1s linear infinite',
                                }} />
                                AI가 사물을 인식하고 있어요...
                            </div>
                        ) : (
                            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                                <button onClick={resetCapture} style={{
                                    padding: '0.875rem 1.5rem', fontSize: '0.95rem',
                                    background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)',
                                    borderRadius: '12px', color: 'rgba(200, 210, 255, 0.6)',
                                    cursor: 'pointer', fontFamily: 'inherit',
                                }}>다시 선택</button>
                                <button onClick={recognizeObject} style={{
                                    padding: '0.875rem 2rem', fontSize: '0.95rem', fontWeight: '500',
                                    background: 'linear-gradient(135deg, rgba(100, 130, 255, 0.3) 0%, rgba(150, 100, 255, 0.3) 100%)',
                                    border: '1px solid rgba(150, 170, 255, 0.3)',
                                    borderRadius: '12px', color: '#e0e8ff', cursor: 'pointer', fontFamily: 'inherit',
                                }}>✨ 사물 인식하기</button>
                            </div>
                        )}
                    </div>
                ) : (
                    <div style={{
                        flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
                        justifyContent: 'center', textAlign: 'center', gap: '2rem',
                    }}>
                        <div>
                            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🖼️</div>
                            <h2 style={{
                                fontSize: '1.6rem', fontWeight: '600', marginBottom: '0.75rem',
                                background: 'linear-gradient(135deg, #e0e8ff 0%, #a0b0ff 100%)',
                                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                            }}>
                                사물 사진을 선택해보세요
                            </h2>
                            <p style={{ color: 'rgba(200, 210, 255, 0.5)', fontSize: '0.95rem', lineHeight: 1.6 }}>
                                사진 속 사물을 AI가 인식하고<br />
                                그 사물에 대한 철학적 대화를 시작합니다
                            </p>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%', maxWidth: '320px' }}>
                            <button onClick={() => fileInputRef.current?.click()} style={{
                                padding: '1rem 2rem', fontSize: '1rem', fontWeight: '500',
                                background: 'linear-gradient(135deg, rgba(100, 130, 255, 0.25) 0%, rgba(150, 100, 255, 0.25) 100%)',
                                border: '1px solid rgba(150, 170, 255, 0.3)',
                                borderRadius: '14px', color: '#e0e8ff', cursor: 'pointer', fontFamily: 'inherit',
                                boxShadow: '0 4px 20px rgba(100, 130, 255, 0.1)',
                            }}>🖼️ 사진 선택하기</button>
                            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} style={{ display: 'none' }} />
                        </div>

                        <Link to="/session/new" style={{
                            color: 'rgba(200, 210, 255, 0.3)', fontSize: '0.85rem',
                            textDecoration: 'none', marginTop: '1rem',
                        }}>
                            사물 없이 바로 시작하기 →
                        </Link>
                    </div>
                )}
            </div>

            <style>{`
                @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
                @keyframes spin { to { transform: rotate(360deg); } }
            `}</style>
        </div>
    );
}
