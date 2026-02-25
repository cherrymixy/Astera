export interface Star {
  id: string;
  keyword: string;
  x: number;
  y: number;
  size: number;       // 별 크기 (1~3)
  brightness: number; // 밝기 (0~1)
  addedAt: number;    // 추가된 시점 (ms)
}

export interface Connection {
  from: string; // Star id
  to: string;   // Star id
}

export interface ConstellationData {
  stars: Star[];
  connections: Connection[];
}

export interface SessionData {
  id: string;
  createdAt: string;
  title?: string;
  constellationJson: string; // JSON<ConstellationData>
  reasoningText?: string;
  transcriptText?: string;
  thumbnailBase64?: string;
}
