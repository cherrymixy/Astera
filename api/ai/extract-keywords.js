const OpenAI = require('openai');

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

module.exports = async function handler(req, res) {
    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ success: false, error: 'Method not allowed' });

    try {
        const { sentence, existingKeywords } = req.body || {};

        if (!sentence || sentence.trim().length === 0) {
            return res.json({ success: true, data: { keywords: [] } });
        }

        const existing = existingKeywords?.length > 0
            ? `\n이미 추출된 키워드: [${existingKeywords.join(', ')}] (중복 피하기)`
            : '';

        const completion = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            temperature: 0,
            max_tokens: 100,
            messages: [
                {
                    role: 'system',
                    content: `당신은 철학적 대화에서 핵심 개념/키워드를 추출하는 AI입니다.

규칙:
1. 사용자의 문장에서 철학적으로 의미 있는 핵심 단어/개념을 1~2개만 추출
2. 명사, 추상개념, 철학 용어를 우선 추출
3. 조사, 어미, 접속사, 대명사, 일상적 동사 등은 제외
4. 키워드는 간결하게 (2~6글자)
5. 의미 없는 일상 대화(인사, 감탄사 등)에서는 빈 배열 반환
6. 반드시 JSON 배열만 출력: ["키워드1", "키워드2"] 또는 []${existing}

예시:
"사랑이란 무엇인지 생각해봤어" → ["사랑"]
"자유와 책임에 대해 고민이 많아" → ["자유", "책임"]
"음 그래 맞아 네" → []
"존재의 의미를 찾고 싶어" → ["존재", "의미"]`
                },
                {
                    role: 'user',
                    content: sentence
                }
            ]
        });

        const content = completion.choices[0].message.content.trim();
        const jsonStr = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        const keywords = JSON.parse(jsonStr);

        res.json({ success: true, data: { keywords: Array.isArray(keywords) ? keywords : [] } });
    } catch (error) {
        console.error('Extract keywords error:', error);
        res.json({ success: true, data: { keywords: [] } });
    }
};
