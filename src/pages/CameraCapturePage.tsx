import { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { fetchAPI } from '../api/client';

interface RecognizedObject { name: string; description: string; philosophicalPrompt: string; }

export default function CameraCapturePage() {
    const navigate = useNavigate();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const cameraInputRef = useRef<HTMLInputElement>(null);
    const [capturedImage, setCapturedImage] = useState<string | null>(null);
    const [recognizing, setRecognizing] = useState(false);
    const [recognized, setRecognized] = useState<RecognizedObject | null>(null);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => setCapturedImage(reader.result as string);
        reader.readAsDataURL(file);
    };

    const recognizeObject = async () => {
        if (!capturedImage) return;
        setRecognizing(true);
        try {
            const res = await fetchAPI<{ success: boolean; data: RecognizedObject }>('/api/ai/recognize-object', { method: 'POST', body: JSON.stringify({ imageBase64: capturedImage }) });
            setRecognized(res.data);
        } catch { alert('사물 인식에 실패했습니다.'); }
        finally { setRecognizing(false); }
    };

    const resetCapture = () => { setCapturedImage(null); setRecognized(null); };

    const startDiscussion = () => {
        if (!recognized) return;
        navigate('/session/new', { state: { objectName: recognized.name, objectDescription: recognized.description, objectPrompt: recognized.philosophicalPrompt, objectImage: capturedImage } });
    };

    return (
        <div style={{ height: '100vh', background: '#050510', color: 'rgba(255,255,255,0.9)', display: 'flex', flexDirection: 'column' }}>
            {/* Header */}
            <div style={{ padding: '1.25rem clamp(1rem, 5vw, 2rem)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Link to="/home" style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem', textDecoration: 'none', letterSpacing: '0.02em' }}>← 돌아가기</Link>
                <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.3)', letterSpacing: '0.05em' }}>사물 인식</span>
            </div>

            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '1.5rem clamp(1rem, 5vw, 1.5rem)', gap: '1.25rem' }}>
                {recognized ? (
                    <div style={{ width: '100%', maxWidth: '440px', textAlign: 'center', animation: 'fadeIn 0.5s ease' }}>
                        {capturedImage && <div style={{ borderRadius: '14px', overflow: 'hidden', marginBottom: '1.25rem' }}><img src={capturedImage} alt="" style={{ width: '100%', display: 'block' }} /></div>}
                        <div style={{ padding: '1.75rem', background: 'rgba(255,255,255,0.04)', borderRadius: '14px', marginBottom: '1.25rem' }}>
                            <div style={{ fontSize: '1.3rem', fontWeight: '600', marginBottom: '0.35rem', letterSpacing: '-0.01em' }}>{recognized.name}</div>
                            <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.35)', marginBottom: '1rem' }}>{recognized.description}</div>
                            <div style={{ fontSize: '0.95rem', fontStyle: 'italic', lineHeight: 1.7, color: 'rgba(255,255,255,0.5)' }}>"{recognized.philosophicalPrompt}"</div>
                        </div>
                        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
                            <button onClick={resetCapture} style={{
                                padding: '0.75rem 1.3rem', fontSize: '0.85rem',
                                background: 'rgba(255,255,255,0.06)', border: 'none',
                                borderRadius: '10px', color: 'rgba(255,255,255,0.5)',
                                cursor: 'pointer', fontFamily: 'inherit',
                            }}>다시 선택</button>
                            <button onClick={startDiscussion} style={{
                                padding: '0.75rem 1.5rem', fontSize: '0.85rem',
                                background: 'var(--accent)', border: 'none',
                                borderRadius: '10px', color: '#121212',
                                fontWeight: '600', cursor: 'pointer', fontFamily: 'inherit',
                            }}>이야기하기</button>
                        </div>
                    </div>
                ) : capturedImage ? (
                    <div style={{ width: '100%', maxWidth: '440px', textAlign: 'center' }}>
                        <div style={{ borderRadius: '14px', overflow: 'hidden', marginBottom: '1.25rem' }}><img src={capturedImage} alt="" style={{ width: '100%', display: 'block' }} /></div>
                        {recognizing ? (
                            <div style={{ padding: '1.25rem', color: 'rgba(255,255,255,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                                <span style={{ display: 'inline-block', width: '10px', height: '10px', borderRadius: '50%', border: '2px solid rgba(255,255,255,0.15)', borderTopColor: 'var(--accent)', animation: 'spin 1s linear infinite' }} />
                                AI가 사물을 인식하고 있어요...
                            </div>
                        ) : (
                            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
                                <button onClick={resetCapture} style={{
                                    padding: '0.75rem 1.3rem', fontSize: '0.85rem',
                                    background: 'rgba(255,255,255,0.06)', border: 'none',
                                    borderRadius: '10px', color: 'rgba(255,255,255,0.5)',
                                    cursor: 'pointer', fontFamily: 'inherit',
                                }}>다시 선택</button>
                                <button onClick={recognizeObject} style={{
                                    padding: '0.75rem 1.5rem', fontSize: '0.85rem',
                                    background: 'var(--accent)', border: 'none',
                                    borderRadius: '10px', color: '#121212',
                                    fontWeight: '600', cursor: 'pointer', fontFamily: 'inherit',
                                }}>인식하기</button>
                            </div>
                        )}
                    </div>
                ) : (
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', gap: '2.5rem' }}>
                        <div>
                            <img src="/logo.svg" alt="Astera" style={{ width: '40px', height: '40px', opacity: 0.5, marginBottom: '1.25rem' }} />
                            <h2 style={{ fontSize: 'clamp(1.2rem, 3vw, 1.5rem)', fontWeight: '300', marginBottom: '0.6rem', letterSpacing: '0.06em', color: 'rgba(255,255,255,0.9)' }}>사물을 선택해보세요</h2>
                            <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 'clamp(0.8rem, 1.5vw, 0.85rem)', lineHeight: 1.7, letterSpacing: '0.02em' }}>AI가 사물을 인식하고<br />철학적 대화를 시작합니다</p>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', width: '100%', maxWidth: '260px' }}>
                            <button onClick={() => cameraInputRef.current?.click()} style={{
                                padding: '0.8rem', fontSize: '0.85rem',
                                background: 'var(--accent)', border: 'none',
                                borderRadius: '10px', color: '#121212',
                                fontWeight: '600', cursor: 'pointer', fontFamily: 'inherit',
                            }}>카메라로 촬영</button>
                            <button onClick={() => fileInputRef.current?.click()} style={{
                                padding: '0.8rem', fontSize: '0.85rem',
                                background: 'rgba(255,255,255,0.06)', border: 'none',
                                borderRadius: '10px', color: 'rgba(255,255,255,0.5)',
                                cursor: 'pointer', fontFamily: 'inherit',
                            }}>갤러리에서 선택</button>
                            <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" onChange={handleFileSelect} style={{ display: 'none' }} />
                            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} style={{ display: 'none' }} />
                        </div>
                        <Link to="/session/new" style={{ color: 'rgba(255,255,255,0.2)', fontSize: '0.75rem', textDecoration: 'none', letterSpacing: '0.05em' }}>사물 없이 시작하기 →</Link>
                    </div>
                )}
            </div>
        </div>
    );
}
