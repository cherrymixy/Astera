const OpenAI = require('openai');

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

module.exports = async function handler(req, res) {
    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ success: false, error: 'Method not allowed' });

    try {
        const { keywords, transcript } = req.body || {};

        if (!keywords || keywords.length === 0) {
            return res.json({ success: true, data: { reasoning: '', philosophers: [] } });
        }

        const keywordList = keywords.join(', ');

        const completion = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            temperature: 0.7,
            max_tokens: 800,
            messages: [
                {
                    role: 'system',
                    content: `당신은 철학 전문가이자 사유 안내자입니다.

사용자가 대화 중 언급한 키워드들을 바탕으로:
1. 이 키워드들의 철학적 연결과 의미를 2~3문장으로 요약 (reasoning)
2. 관련된 철학자 2~3명을 추천하고, 각각에 대해:
   - name: 한국어 이름
   - nameEn: 영어 이름
   - reasoning: 이 키워드들과 연결되는 이유 (1문장)
   - explanation: 해당 철학자의 핵심 사상 설명 (2~3문장)

반드시 아래 JSON 형식으로만 응답:
{
  "reasoning": "사유 요약 문장",
  "philosophers": [
    {
      "id": "philosopher-1",
      "name": "한국어 이름",
      "nameEn": "English Name",
      "reasoning": "연결 이유",
      "explanation": "사상 설명"
    }
  ]
}`
                },
                {
                    role: 'user',
                    content: `키워드: [${keywordList}]${transcript ? '\n\n전체 대화:\n' + transcript : ''}`
                }
            ]
        });

        const content = completion.choices[0].message.content.trim();
        const jsonStr = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        const result = JSON.parse(jsonStr);

        res.json({
            success: true,
            data: {
                reasoning: result.reasoning || '',
                philosophers: result.philosophers || []
            }
        });
    } catch (error) {
        console.error('Generate reasoning error:', error);
        res.status(500).json({ success: false, error: '사유 생성에 실패했습니다.' });
    }
};
