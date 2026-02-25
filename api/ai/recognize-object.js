const OpenAI = require('openai');

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

module.exports = async function handler(req, res) {
    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ success: false, error: 'Method not allowed' });

    try {
        const { imageBase64 } = req.body || {};

        if (!imageBase64) {
            return res.status(400).json({ success: false, error: '이미지가 필요합니다.' });
        }

        const completion = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            temperature: 0,
            max_tokens: 200,
            messages: [
                {
                    role: 'system',
                    content: `당신은 사진 속 사물을 인식하는 AI입니다.

사진에서 가장 눈에 띄는 사물/장소/대상을 하나 인식하고:
1. name: 한국어 이름 (2~4글자, 간결하게)
2. description: 그 사물에 대한 짧은 설명 (1문장)
3. philosophicalPrompt: 이 사물에 대해 철학적으로 생각해볼 만한 질문 (1문장)

반드시 JSON만 출력:
{"name": "커피", "description": "따뜻한 커피 한 잔", "philosophicalPrompt": "매일 마시는 이 한 잔이 당신에게 어떤 의미인가요?"}`
                },
                {
                    role: 'user',
                    content: [
                        {
                            type: 'image_url',
                            image_url: {
                                url: imageBase64.startsWith('data:')
                                    ? imageBase64
                                    : `data:image/jpeg;base64,${imageBase64}`,
                                detail: 'low'
                            }
                        }
                    ]
                }
            ]
        });

        const content = completion.choices[0].message.content.trim();
        const jsonStr = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        const result = JSON.parse(jsonStr);

        res.json({
            success: true,
            data: {
                name: result.name || '사물',
                description: result.description || '',
                philosophicalPrompt: result.philosophicalPrompt || '이것에 대해 어떻게 생각하시나요?'
            }
        });
    } catch (error) {
        console.error('Recognize object error:', error);
        res.status(500).json({ success: false, error: '사물 인식에 실패했습니다.' });
    }
};
