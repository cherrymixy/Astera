/**
 * 철학자 데이터 및 추천 로직
 * 사용자의 사유 문장을 기반으로 유사한 관점의 철학자를 추천
 */

export interface Philosopher {
  id: string;
  name: string;
  nameEn: string;
  reasoning: string; // 한 줄 사유 요약
  explanation: string; // 클릭 시 보여줄 설명 (3~5문장)
}

export const PHILOSOPHERS: Philosopher[] = [
  {
    id: 'heidegger',
    name: '하이데거',
    nameEn: 'Martin Heidegger',
    reasoning: '사물은 사용 속에서 의미를 드러낸다.',
    explanation: '하이데거의 관점에서 보면, 이 개체는 단순한 사물이 아니라 우리가 일상에서 사용하는 방식 속에서 그 의미가 드러납니다. 사물은 우리와의 관계 속에서 존재하며, 그 관계가 곧 사물의 본질입니다.',
  },
  {
    id: 'merleau-ponty',
    name: '메를로퐁티',
    nameEn: 'Maurice Merleau-Ponty',
    reasoning: '몸과 세계의 경계는 모호하다.',
    explanation: '메를로퐁티는 우리의 몸이 세계를 경험하는 방식에 주목합니다. 이 개체는 우리의 몸과 분리된 외부 대상이 아니라, 우리가 세계를 느끼고 이해하는 방식 자체와 밀접하게 연결되어 있습니다.',
  },
  {
    id: 'barthes',
    name: '바르트',
    nameEn: 'Roland Barthes',
    reasoning: '사물은 문화적 기호로 읽힌다.',
    explanation: '바르트에게 이 개체는 문화적 의미의 네트워크 속에서 존재합니다. 우리가 이 개체를 보는 방식은 우리가 속한 문화와 사회가 부여한 기호 체계에 따라 달라집니다. 사물은 그 자체로 의미를 가지기보다는 우리가 읽어내는 방식에 따라 의미가 생성됩니다.',
  },
  {
    id: 'foucault',
    name: '푸코',
    nameEn: 'Michel Foucault',
    reasoning: '사물은 권력과 지식의 관계 속에서 구성된다.',
    explanation: '푸코의 관점에서 이 개체는 단순한 물리적 존재가 아니라, 우리 사회의 권력 구조와 지식 체계가 만들어낸 산물입니다. 우리가 이 개체를 어떻게 이해하고 사용하는지는 우리가 속한 사회적 맥락과 밀접하게 연관되어 있습니다.',
  },
  {
    id: 'sartre',
    name: '사르트르',
    nameEn: 'Jean-Paul Sartre',
    reasoning: '사물은 우리의 선택과 행동을 통해 의미를 획득한다.',
    explanation: '사르트르에게 이 개체는 우리의 자유로운 선택과 행동을 통해 의미를 갖게 됩니다. 사물 자체에는 고정된 의미가 없으며, 우리가 그것을 어떻게 사용하고 어떤 의미를 부여하느냐에 따라 달라집니다.',
  },
  {
    id: 'deleuze',
    name: '들뢰즈',
    nameEn: 'Gilles Deleuze',
    reasoning: '사물은 관계와 연결의 네트워크 속에서 생성된다.',
    explanation: '들뢰즈에게 이 개체는 고정된 실체가 아니라, 다른 사물들과의 관계 속에서 끊임없이 변화하고 생성되는 존재입니다. 우리가 이 개체를 보는 순간, 그것은 이미 다른 것들과의 연결 속에서 새로운 의미를 만들어냅니다.',
  },
  {
    id: 'benjamin',
    name: '벤야민',
    nameEn: 'Walter Benjamin',
    reasoning: '사물은 시간의 흔적을 담고 있다.',
    explanation: '벤야민에게 이 개체는 단순한 현재의 존재가 아니라, 과거의 시간과 기억이 응축된 산물입니다. 우리가 이 개체를 보는 순간, 그것은 우리에게 시간의 흔적과 역사의 무게를 전달합니다.',
  },
  {
    id: 'simondon',
    name: '시몽동',
    nameEn: 'Gilbert Simondon',
    reasoning: '사물은 기술적 개체로서 인간과 공진화한다.',
    explanation: '시몽동에게 이 개체는 인간과 분리된 도구가 아니라, 인간의 삶과 함께 진화해온 기술적 개체입니다. 우리가 이 개체를 사용하는 방식은 우리 자신의 존재 방식과 밀접하게 연결되어 있습니다.',
  },
];

/**
 * 사유 문장을 기반으로 유사한 관점의 철학자 2~3명 추천
 */
export function recommendPhilosophers(reasoningText: string): Philosopher[] {
  const text = reasoningText.toLowerCase();
  
  // 키워드 기반 매칭 점수 계산
  const scores = PHILOSOPHERS.map(philosopher => {
    let score = 0;
    const keywords = [
      { words: ['루틴', '반복', '습관', '매일'], philosophers: ['heidegger', 'simondon'] },
      { words: ['기억', '과거', '시간', '흔적'], philosophers: ['benjamin', 'foucault'] },
      { words: ['의미', '상징', '기호', '표상'], philosophers: ['barthes', 'deleuze'] },
      { words: ['관계', '연결', '네트워크'], philosophers: ['deleuze', 'merleau-ponty'] },
      { words: ['사용', '사용법', '사용하는'], philosophers: ['heidegger', 'sartre'] },
      { words: ['감정', '느낌', '경험'], philosophers: ['merleau-ponty', 'benjamin'] },
      { words: ['변화', '생성', '진화'], philosophers: ['deleuze', 'simondon'] },
      { words: ['문화', '사회', '권력'], philosophers: ['barthes', 'foucault'] },
    ];

    keywords.forEach(({ words, philosophers }) => {
      if (words.some(word => text.includes(word)) && philosophers.includes(philosopher.id)) {
        score += 1;
      }
    });

    // 철학자의 reasoning 텍스트와의 유사도
    const philosopherText = philosopher.reasoning.toLowerCase();
    const commonWords = philosopherText.split(' ').filter(word => 
      text.includes(word) && word.length > 2
    );
    score += commonWords.length * 0.5;

    return { philosopher, score };
  });

  // 점수 순으로 정렬하고 상위 2~3명 반환
  scores.sort((a, b) => b.score - a.score);
  
  // 점수가 0보다 큰 경우만 반환, 최대 3명
  const recommended = scores
    .filter(item => item.score > 0)
    .slice(0, 3)
    .map(item => item.philosopher);

  // 매칭되는 것이 없으면 기본 2명 반환
  if (recommended.length === 0) {
    return [PHILOSOPHERS[0], PHILOSOPHERS[1]];
  }

  return recommended;
}






