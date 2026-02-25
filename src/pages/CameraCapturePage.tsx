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
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [stream, setStream] = useState<MediaStream | null>(null);
    const [cameraActive, setCameraActive] = useState(false);
    const [capturedImage, setCapturedImage] = useState<string | null>(null);
    const [recognizing, setRecognizing] = useState(false);
    const [recognized, setRecognized] = useState<RecognizedObject | null>(null);

    // 카메라 시작 (후면 → 전면 → 아무 카메라 순서로 시도)
    const startCamera = async () => {
        const constraints = [
            { video: { facingMode: 'environment' } },
            { video: { facingMode: 'user' } },
            { video: true },
        ];

        for (const constraint of constraints) {
            try {
                const mediaStream = await navigator.mediaDevices.getUserMedia(constraint);
                if (videoRef.current) {
                    videoRef.current.srcObject = mediaStream;
                    // 비디오가 로드될 때까지 대기
                    await new Promise<void>((resolve) => {
                        videoRef.current!.onloadedmetadata = () => {
                            videoRef.current!.play();
                            resolve();
                        };
                    });
                }
                setStream(mediaStream);
                setCameraActive(true);
                return;
            } catch {
                continue;
            }
        }
        // 모든 시도 실패 — 갤러리로 안내
        alert('카메라를 사용할 수 없습니다. 갤러리에서 이미지를 선택해주세요.');
        fileInputRef.current?.click();
    };

    // 카메라 중지
    const stopCamera = () => {
        stream?.getTracks().forEach(t => t.stop());
        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }
        setStream(null);
        setCameraActive(false);
    };

    // 사진 촬영
    const capturePhoto = () => {
        if (!videoRef.current || !canvasRef.current) return;
        const video = videoRef.current;
        if (video.videoWidth === 0) return; // 아직 준비 안 됨
        const canvas = canvasRef.current;
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(video, 0, 0);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
        setCapturedImage(dataUrl);
        stopCamera();
    };

    // 갤러리에서 선택
    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
            setCapturedImage(reader.result as string);
        };
        reader.readAsDataURL(file);
    };

    // AI 사물 인식
    const recognizeObject = async () => {
        if (!capturedImage) return;
        setRecognizing(true);
        try {
            const res = await fetchAPI<{ success: boolean; data: RecognizedObject }>(
                '/api/ai/recognize-object',
                {
                    method: 'POST',
                    body: JSON.stringify({ imageBase64: capturedImage }),
                }
            );
            setRecognized(res.data);
        } catch {
            alert('사물 인식에 실패했습니다. 다시 시도해주세요.');
        } finally {
            setRecognizing(false);
        }
    };

    // 다시 찍기
    const resetCapture = () => {
        setCapturedImage(null);
        setRecognized(null);
    };

    // 대화 시작
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
                <div style={{ fontSize: '0.9rem', color: 'rgba(200, 210, 255, 0.5)' }}>
                    📷 사물 인식
                </div>
            </div>

            {/* 메인 콘텐츠 */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '2rem 1.5rem', gap: '1.5rem' }}>

                {/* 인식 결과 표시 */}
                {recognized ? (
                    <div style={{
                        width: '100%', maxWidth: '500px', textAlign: 'center',
                        animation: 'fadeInUp 0.6s ease',
                    }}>
                        {/* 인식된 이미지 */}
                        {capturedImage && (
                            <div style={{
                                width: '100%', borderRadius: '20px', overflow: 'hidden',
                                marginBottom: '1.5rem', border: '1px solid rgba(100, 130, 255, 0.2)',
                            }}>
                                <img src={capturedImage} alt="captured" style={{ width: '100%', display: 'block' }} />
                            </div>
                        )}

                        {/* 인식 결과 카드 */}
                        <div style={{
                            padding: '2rem', background: 'rgba(100, 130, 255, 0.08)',
                            borderRadius: '20px', border: '1px solid rgba(100, 130, 255, 0.15)',
                            marginBottom: '1.5rem',
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

                        {/* 버튼들 */}
                        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                            <button
                                onClick={resetCapture}
                                style={{
                                    padding: '0.875rem 1.5rem', fontSize: '0.95rem',
                                    background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)',
                                    borderRadius: '12px', color: 'rgba(200, 210, 255, 0.6)',
                                    cursor: 'pointer', transition: 'all 0.2s', fontFamily: 'inherit',
                                }}
                            >
                                다시 찍기
                            </button>
                            <button
                                onClick={startDiscussion}
                                style={{
                                    padding: '0.875rem 2rem', fontSize: '0.95rem', fontWeight: '500',
                                    background: 'linear-gradient(135deg, rgba(100, 130, 255, 0.3) 0%, rgba(150, 100, 255, 0.3) 100%)',
                                    border: '1px solid rgba(150, 170, 255, 0.3)',
                                    borderRadius: '12px', color: '#e0e8ff',
                                    cursor: 'pointer', transition: 'all 0.3s', fontFamily: 'inherit',
                                    boxShadow: '0 4px 20px rgba(100, 130, 255, 0.15)',
                                }}
                            >
                                🌌 이 사물에 대해 이야기하기
                            </button>
                        </div>
                    </div>
                ) : capturedImage ? (
                    /* 촬영된 사진 + 인식 중 */
                    <div style={{ width: '100%', maxWidth: '500px', textAlign: 'center' }}>
                        <div style={{
                            width: '100%', borderRadius: '20px', overflow: 'hidden',
                            marginBottom: '1.5rem', border: '1px solid rgba(100, 130, 255, 0.15)',
                        }}>
                            <img src={capturedImage} alt="captured" style={{ width: '100%', display: 'block' }} />
                        </div>

                        {recognizing ? (
                            <div style={{
                                padding: '1.5rem', color: 'rgba(200, 210, 255, 0.6)',
                                fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem',
                            }}>
                                <span style={{
                                    display: 'inline-block', width: '12px', height: '12px', borderRadius: '50%',
                                    border: '2px solid rgba(100, 130, 255, 0.4)', borderTopColor: '#a0b0ff',
                                    animation: 'spin 1s linear infinite',
                                }} />
                                AI가 사물을 인식하고 있어요...
                            </div>
                        ) : (
                            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                                <button
                                    onClick={resetCapture}
                                    style={{
                                        padding: '0.875rem 1.5rem', fontSize: '0.95rem',
                                        background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)',
                                        borderRadius: '12px', color: 'rgba(200, 210, 255, 0.6)',
                                        cursor: 'pointer', transition: 'all 0.2s', fontFamily: 'inherit',
                                    }}
                                >
                                    다시 찍기
                                </button>
                                <button
                                    onClick={recognizeObject}
                                    style={{
                                        padding: '0.875rem 2rem', fontSize: '0.95rem', fontWeight: '500',
                                        background: 'linear-gradient(135deg, rgba(100, 130, 255, 0.3) 0%, rgba(150, 100, 255, 0.3) 100%)',
                                        border: '1px solid rgba(150, 170, 255, 0.3)',
                                        borderRadius: '12px', color: '#e0e8ff',
                                        cursor: 'pointer', transition: 'all 0.3s', fontFamily: 'inherit',
                                    }}
                                >
                                    ✨ 사물 인식하기
                                </button>
                            </div>
                        )}
                    </div>
                ) : cameraActive ? (
                    /* 카메라 뷰 */
                    <div style={{ width: '100%', maxWidth: '500px', textAlign: 'center' }}>
                        <div style={{
                            width: '100%', borderRadius: '20px', overflow: 'hidden',
                            marginBottom: '1.5rem', border: '1px solid rgba(100, 130, 255, 0.15)',
                            position: 'relative',
                        }}>
                            <video ref={videoRef} autoPlay playsInline muted style={{ width: '100%', display: 'block' }} />
                        </div>
                        <button
                            onClick={capturePhoto}
                            style={{
                                width: '72px', height: '72px', borderRadius: '50%',
                                background: 'radial-gradient(circle, rgba(255,255,255,0.9) 0%, rgba(200,210,255,0.6) 100%)',
                                border: '4px solid rgba(100, 130, 255, 0.3)',
                                cursor: 'pointer', transition: 'all 0.2s',
                                boxShadow: '0 0 20px rgba(100, 130, 255, 0.2)',
                            }}
                        />
                    </div>
                ) : (
                    /* 시작 화면 */
                    <div style={{
                        flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
                        justifyContent: 'center', textAlign: 'center', gap: '2rem',
                    }}>
                        <div>
                            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>📷</div>
                            <h2 style={{
                                fontSize: '1.6rem', fontWeight: '600', marginBottom: '0.75rem',
                                background: 'linear-gradient(135deg, #e0e8ff 0%, #a0b0ff 100%)',
                                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                            }}>
                                주변의 사물을 찍어보세요
                            </h2>
                            <p style={{ color: 'rgba(200, 210, 255, 0.5)', fontSize: '0.95rem', lineHeight: 1.6 }}>
                                카메라로 사물을 인식하면<br />
                                그 사물에 대한 철학적 대화를 시작합니다
                            </p>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%', maxWidth: '320px' }}>
                            <button
                                onClick={startCamera}
                                style={{
                                    padding: '1rem 2rem', fontSize: '1rem', fontWeight: '500',
                                    background: 'linear-gradient(135deg, rgba(100, 130, 255, 0.25) 0%, rgba(150, 100, 255, 0.25) 100%)',
                                    border: '1px solid rgba(150, 170, 255, 0.3)',
                                    borderRadius: '14px', color: '#e0e8ff',
                                    cursor: 'pointer', transition: 'all 0.3s', fontFamily: 'inherit',
                                    boxShadow: '0 4px 20px rgba(100, 130, 255, 0.1)',
                                }}
                            >
                                📷 카메라로 촬영
                            </button>
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                style={{
                                    padding: '1rem 2rem', fontSize: '1rem',
                                    background: 'rgba(255, 255, 255, 0.05)',
                                    border: '1px solid rgba(255, 255, 255, 0.1)',
                                    borderRadius: '14px', color: 'rgba(200, 210, 255, 0.6)',
                                    cursor: 'pointer', transition: 'all 0.2s', fontFamily: 'inherit',
                                }}
                            >
                                🖼️ 갤러리에서 선택
                            </button>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                capture="environment"
                                onChange={handleFileSelect}
                                style={{ display: 'none' }}
                            />
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

            {/* hidden canvas for capture */}
            <canvas ref={canvasRef} style={{ display: 'none' }} />

            <style>{`
                @keyframes fadeInUp {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
}
