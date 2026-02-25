export interface Star {
    id: string;
    keyword: string;
    x: number;
    y: number;
    size: number;
    brightness: number;
    addedAt: number;
}

export interface Connection {
    from: string;
    to: string;
}

export interface ConstellationData {
    stars: Star[];
    connections: Connection[];
}

export interface SessionData {
    id: string;
    createdAt: string;
    title?: string;
    constellationJson: string;
    reasoningText?: string;
    transcriptText?: string;
}

export interface User {
    id: string;
    email: string;
    name: string;
    created_at: string;
}
