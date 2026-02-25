/**
 * Web Speech API를 사용한 음성 인식 (STT)
 * 문장이 완성될 때만 콜백을 호출
 */

export class SpeechRecognitionService {
  private recognition: any = null;
  private fullTranscript = '';
  private isActive = false;
  private onSentenceComplete?: (sentence: string, fullText: string) => void;

  constructor() {
    const SpeechRecognition = (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      console.warn('Speech Recognition API를 지원하지 않는 브라우저입니다.');
      return;
    }

    this.recognition = new SpeechRecognition();
    this.recognition.continuous = true;
    this.recognition.interimResults = false; // 최종 결과만 받기
    this.recognition.lang = 'ko-KR';

    this.recognition.onresult = (event: any) => {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          const sentence = event.results[i][0].transcript.trim();
          if (sentence.length > 0) {
            this.fullTranscript += sentence + ' ';
            console.log('[STT] 문장 완성:', sentence);

            if (this.onSentenceComplete) {
              this.onSentenceComplete(sentence, this.fullTranscript);
            }
          }
        }
      }
    };

    this.recognition.onerror = (event: any) => {
      console.error('음성 인식 오류:', event.error);
    };

    this.recognition.onend = () => {
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
   * onSentenceComplete: 문장이 완성될 때마다 호출 (문장, 전체 텍스트)
   */
  start(onSentenceComplete?: (sentence: string, fullText: string) => void): void {
    if (!this.recognition) {
      console.warn('Speech Recognition을 사용할 수 없습니다.');
      return;
    }

    this.onSentenceComplete = onSentenceComplete;
    this.fullTranscript = '';
    this.isActive = true;

    try {
      this.recognition.start();
    } catch (e) {
      console.error('음성 인식 시작 실패:', e);
    }
  }

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

  getTranscript(): string {
    return this.fullTranscript;
  }

  static isSupported(): boolean {
    return !!(window as any).SpeechRecognition ||
      !!(window as any).webkitSpeechRecognition;
  }
}
