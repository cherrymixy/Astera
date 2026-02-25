/**
 * Constellation Engine
 * 별 배치, 별 연결, 키워드 추출 유틸리티
 */

import { Star, Connection } from '../types';
import { v4 as uuidv4 } from 'uuid';

// 불용어 (필터링 대상)
const STOP_WORDS = new Set([
    // 한국어 조사/접속사
    '그', '이', '저', '것', '수', '등', '들', '및', '에', '의', '가', '를', '로', '와', '과',
    '은', '는', '이', '가', '에서', '으로', '하고', '그리고', '하지만', '또는', '때문에',
    '그래서', '그런데', '그러나', '그러면', '그래도', '그러니까', '그렇게', '이렇게', '저렇게',
    '좀', '잘', '더', '덜', '매우', '아주', '정말', '진짜', '너무', '약간', '조금', '많이',
    '있다', '없다', '하다', '되다', '같다', '있는', '없는', '하는', '되는', '같은',
    '있어', '없어', '해요', '돼요', '같아', '있고', '없고', '해서', '되서', '했어', '됐어',
    '이거', '저거', '그거', '여기', '저기', '거기', '어디', '언제', '왜', '어떻게',
    '나', '너', '우리', '저희', '내가', '제가', '네가', '내', '제', '좀', '뭐', '뭔가',
    '근데', '음', '아', '네', '예', '응', '아니', '아뇨', '글쎄', '한번', '다시',
    '대해', '대한', '통해', '위해', '따라', '관해', '관한', '대해서',
    '생각', '느낌', '기분', '정도', '때', '거', '건', '게', '데', '줄',
    '하면', '하는데', '하니까', '했는데', '됐는데', '같은데', '있는데', '없는데',
    '거든', '거든요', '잖아', '잖아요', '니까', '니까요', '는데요', '인데요',
    // 일반 동사/형용사 어미
    '해야', '할', '된', '한', '할게', '할까', '해볼', '해봐',
    // 영어
    'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been',
    'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with',
    'I', 'you', 'he', 'she', 'it', 'we', 'they', 'my', 'your',
    'do', 'does', 'did', 'have', 'has', 'had', 'will', 'would',
    'can', 'could', 'should', 'may', 'might', 'not', 'no', 'yes',
    'this', 'that', 'these', 'those', 'what', 'which', 'who', 'how',
    'very', 'really', 'just', 'also', 'so', 'too', 'about', 'like',
    'think', 'know', 'want', 'need', 'feel', 'mean', 'kind', 'thing',
]);

// 한국어 동사/형용사 어미 패턴
const VERB_ENDINGS = /^(.+)(해요|합니다|하는|했어|하고|해서|에요|이에요|예요|입니다|인데|이고|이랑|이라|으로|하면|할|된|되는|됐|한다|gonna|wanna)$/;

/**
 * 문장에서 핵심 키워드 1~2개를 추출
 * 문장이 완성될 때만 호출되어야 함
 */
export function extractKeywords(sentence: string): string[] {
    if (!sentence || sentence.trim().length === 0) return [];

    // 문장 부호 제거 후 단어 분리
    const words = sentence
        .replace(/[.,!?;:()"""''…·\-—~]/g, ' ')
        .split(/\s+/)
        .map(w => w.trim())
        .filter(w => w.length >= 2);

    // 필터링: 불용어, 동사어미, 1글자 제거
    const candidates = words.filter(w => {
        if (STOP_WORDS.has(w)) return false;
        if (w.length < 2) return false;
        // 한국어 동사/형용사 어미로 끝나는 흔한 패턴 제거
        if (VERB_ENDINGS.test(w) && w.length <= 4) return false;
        // 숫자만으로 이루어진 단어 제거
        if (/^\d+$/.test(w)) return false;
        return true;
    });

    if (candidates.length === 0) return [];

    // 점수 매기기: 긴 단어일수록, 명사스러울수록 높은 점수
    const scored = candidates.map(w => {
        let score = w.length; // 긴 단어가 더 의미있을 확률 높음
        // 한자어/추상명사 보너스 (3글자 이상 한국어)
        if (/^[가-힣]{3,}$/.test(w)) score += 2;
        // 영어 단어 보너스 (보통 핵심 개념)
        if (/^[a-zA-Z]{3,}$/.test(w)) score += 2;
        return { word: w, score };
    });

    // 점수 높은 순 정렬 후 최대 2개만 반환
    scored.sort((a, b) => b.score - a.score);
    const maxKeywords = scored.length >= 4 ? 2 : 1;

    // 중복 제거
    const result: string[] = [];
    for (const { word } of scored) {
        if (result.length >= maxKeywords) break;
        if (!result.includes(word)) {
            result.push(word);
        }
    }

    return result;
}


/**
 * 캔버스 영역 내에서 기존 별과 겹치지 않는 위치에 별 배치
 */
export function placeStar(
    keyword: string,
    existingStars: Star[],
    canvasWidth: number = 800,
    canvasHeight: number = 600,
): Star {
    const margin = 80;
    const minDistance = 100;
    let x: number, y: number;
    let attempts = 0;

    do {
        x = margin + Math.random() * (canvasWidth - margin * 2);
        y = margin + Math.random() * (canvasHeight - margin * 2);
        attempts++;
    } while (
        attempts < 50 &&
        existingStars.some(s => {
            const dx = s.x - x;
            const dy = s.y - y;
            return Math.sqrt(dx * dx + dy * dy) < minDistance;
        })
    );

    return {
        id: uuidv4(),
        keyword,
        x,
        y,
        size: 1 + Math.random() * 2, // 1~3
        brightness: 0.6 + Math.random() * 0.4, // 0.6~1
        addedAt: Date.now(),
    };
}

/**
 * 근접 기반 자동 연결 — 각 별에서 가장 가까운 1~2개의 별과 연결
 */
export function autoConnect(stars: Star[]): Connection[] {
    if (stars.length < 2) return [];

    const connections: Connection[] = [];
    const connectionSet = new Set<string>();

    const addConnection = (fromId: string, toId: string) => {
        const key = [fromId, toId].sort().join('-');
        if (!connectionSet.has(key)) {
            connectionSet.add(key);
            connections.push({ from: fromId, to: toId });
        }
    };

    // 각 별에서 가장 가까운 별 1~2개와 연결
    stars.forEach(star => {
        const distances = stars
            .filter(s => s.id !== star.id)
            .map(s => ({
                star: s,
                dist: Math.sqrt((s.x - star.x) ** 2 + (s.y - star.y) ** 2),
            }))
            .sort((a, b) => a.dist - b.dist);

        // 최소 1개, 최대 2개 연결
        const connectCount = Math.min(2, distances.length);
        for (let i = 0; i < connectCount; i++) {
            addConnection(star.id, distances[i].star.id);
        }
    });

    return connections;
}

/**
 * 별자리 제목 자동 생성 (키워드 3개까지 조합)
 */
export function generateTitle(stars: Star[]): string {
    if (stars.length === 0) return '빈 별자리';
    const keywords = stars.slice(0, 3).map(s => s.keyword);
    return keywords.join(' · ');
}
