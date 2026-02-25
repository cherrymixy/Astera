/**
 * Web Speech API를 사용한 음성 인식 (STT)
 * 화면에 텍스트를 표시하지 않고 내부적으로만 사용
 */

export class SpeechRecognitionService {
  private recognition: any = null;
  private transcript = '';
  private isActive = false;
  private onTranscriptUpdate?: (text: string) => void;

  constructor() {
    // 브라우저 호환성 확인
    const SpeechRecognition = (window as any).SpeechRecognition || 
                             (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      console.warn('Speech Recognition API를 지원하지 않는 브라우저입니다.');
      return;
    }

    this.recognition = new SpeechRecognition();
    this.recognition.continuous = true; // 연속 인식
    this.recognition.interimResults = true; // 중간 결과도 받기
    this.recognition.lang = 'ko-KR'; // 한국어

    this.recognition.onresult = (event: any) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript + ' ';
        } else {
          interimTranscript += transcript;
        }
      }

      this.transcript = finalTranscript + interimTranscript;
      
      // 디버깅: 인식된 텍스트 로깅
      if (finalTranscript) {
        console.log('[STT] 최종 인식:', finalTranscript);
      }
      
      if (this.onTranscriptUpdate) {
        this.onTranscriptUpdate(this.transcript);
      }
    };

    this.recognition.onerror = (event: any) => {
      console.error('음성 인식 오류:', event.error);
    };

    this.recognition.onend = () => {
      // 자동으로 재시작 (연속 인식을 위해)
      if (this.isActive) {
        try {
          this.recognition.start();
        } catch (e) {
          // 이미 시작 중일 수 있음
        }
      }
    };
  }

  /**
   * 음성 인식 시작
   */
  start(onTranscriptUpdate?: (text: string) => void): void {
    if (!this.recognition) {
      console.warn('Speech Recognition을 사용할 수 없습니다.');
      return;
    }

    this.onTranscriptUpdate = onTranscriptUpdate;
    this.transcript = '';
    this.isActive = true;

    try {
      this.recognition.start();
    } catch (e) {
      console.error('음성 인식 시작 실패:', e);
    }
  }

  /**
   * 음성 인식 중지
   */
  stop(): void {
    this.isActive = false;
    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch (e) {
        // 이미 중지되었을 수 있음
      }
    }
  }

  /**
   * 현재까지 인식된 텍스트 반환
   */
  getTranscript(): string {
    return this.transcript;
  }

  /**
   * 지원 여부 확인
   */
  static isSupported(): boolean {
    return !!(window as any).SpeechRecognition || 
           !!(window as any).webkitSpeechRecognition;
  }
}


