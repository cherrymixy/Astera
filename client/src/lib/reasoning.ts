/**
 * 별자리 키워드 기반 사유 요약 생성 (규칙 기반 fallback)
 */

/**
 * 키워드 배열을 기반으로 철학적 사유 문장 생성
 */
export function generateConstellationReasoning(keywords: string[]): string {
  if (!keywords || keywords.length === 0) {
    return '아직 말하지 않은 생각들의 흔적이 별이 되기를 기다리고 있다.';
  }

  const count = keywords.length;
  const first = keywords[0];
  const last = keywords[keywords.length - 1];

  // 키워드 수에 따른 패턴
  if (count === 1) {
    return `${first}이라는 단어 속에 아직 드러나지 않은 우주가 숨어 있다.`;
  }

  if (count === 2) {
    return `${first}과 ${last} 사이에 놓인 보이지 않는 선이 하나의 의미를 만들어낸다.`;
  }

  if (count <= 4) {
    return `${keywords.join(', ')} — 이 단어들이 만드는 별자리는 당신만의 사유 지도이다.`;
  }

  // 5개 이상
  const themes = [
    `${count}개의 별이 모여 하나의 형상을 이루듯, 당신의 생각들은 보이지 않는 질서를 따르고 있다.`,
    `${first}에서 시작해 ${last}에 이르는 별들의 궤적이 당신의 철학적 지형도를 그려낸다.`,
    `흩어진 ${count}개의 키워드들이 연결되는 순간, 당신만의 별자리가 밤하늘에 떠오른다.`,
    `${first}, ${keywords[1]}, 그리고 ${last} — 이 별들 사이에서 당신의 사유가 빛나고 있다.`,
  ];

  const seed = keywords.reduce((acc, k) => acc + k.length, 0);
  return themes[seed % themes.length];
}
