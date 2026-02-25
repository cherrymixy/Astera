/**
 * localStorage 기반 별자리 저장소
 * Vercel 서버리스 환경에서 DB 없이 동작
 */

import { SessionData, ConstellationData } from '@/types';
import { v4 as uuidv4 } from 'uuid';

const STORAGE_KEY = 'constellation_sessions';

function getAll(): SessionData[] {
    if (typeof window === 'undefined') return [];
    try {
        const data = localStorage.getItem(STORAGE_KEY);
        return data ? JSON.parse(data) : [];
    } catch {
        return [];
    }
}

function saveAll(sessions: SessionData[]): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
}

/**
 * 새 별자리 저장
 */
export function saveConstellation(params: {
    title?: string;
    constellationJson: string;
    reasoningText?: string;
    transcriptText?: string;
}): SessionData {
    const session: SessionData = {
        id: uuidv4(),
        createdAt: new Date().toISOString(),
        title: params.title,
        constellationJson: params.constellationJson,
        reasoningText: params.reasoningText,
        transcriptText: params.transcriptText,
    };

    const sessions = getAll();
    sessions.unshift(session); // 최신이 앞으로
    saveAll(sessions);
    return session;
}

/**
 * ID로 별자리 조회
 */
export function getConstellation(id: string): SessionData | null {
    const sessions = getAll();
    return sessions.find(s => s.id === id) || null;
}

/**
 * 전체 별자리 조회 (최신순)
 */
export function getAllConstellations(): SessionData[] {
    return getAll();
}

/**
 * 별자리 삭제
 */
export function deleteConstellation(id: string): void {
    const sessions = getAll().filter(s => s.id !== id);
    saveAll(sessions);
}
