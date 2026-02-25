/**
 * Constellation Engine
 * 별 배치, 별 연결, 키워드 추출 유틸리티
 */

import { Star, Connection } from '../types';
import { v4 as uuidv4 } from 'uuid';

// 불용어 (필터링 대상)
const STOP_WORDS = new Set([
    '그', '이', '저', '것', '수', '등', '들', '및', '에', '의', '가', '를', '로', '와', '과',
    '은', '는', '이', '가', '에서', '으로', '하고', '그리고', '하지만', '또는', '때문에',
    '그래서', '그런데', '그러나', '그러면', '그래도', '그러니까',
    '좀', '잘', '더', '덜', '매우', '아주', '정말', '진짜', '너무',
    '있다', '없다', '하다', '되다', '같다', '있는', '없는', '하는', '되는',
    '있어', '없어', '해요', '돼요', '같아', '있고', '없고',
    'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been',
    'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with',
    'I', 'you', 'he', 'she', 'it', 'we', 'they', 'my', 'your',
]);

/**
 * 텍스트에서 핵심 키워드를 추출
 */
export function extractKeywords(text: string): string[] {
    if (!text || text.trim().length === 0) return [];

    // 문장 부호 기준 분리 후 단어 추출
    const words = text
        .replace(/[.,!?;:()"""''…·\-—]/g, ' ')
        .split(/\s+/)
        .map(w => w.trim())
        .filter(w => w.length >= 2 && !STOP_WORDS.has(w));

    // 중복 제거
    const unique = [...new Set(words)];
    return unique;
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
