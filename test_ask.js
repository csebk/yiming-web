const fs = require('fs');
const https = require('https');

const envContent = fs.readFileSync('.env.local', 'utf8');
const match = envContent.match(/^DASHSCOPE_API_KEY=(.+)$/m);
const apiKey = match ? match[1] : '';

console.log('API Key loaded:', !!apiKey, 'length:', apiKey.length);

const rulesText = '【财富】第8术 · 旧业勿轻弃：业之道，旧业勿轻弃。虽利薄，然根基之所系，存身之本也。若新业既成，根基稳固，方可择之而从。若二者得兼，善之善者也。\n\n【修身】第49术 · 讼过内省：事之不成，必在己也。讼过而内省，克己而复正。\n\n【人际】第16术 · 交游分三等：交游之众，当分三等：其一唯利是图，毋涉情义；其二唯情是守，毋涉利欲；此二者不可逾，逾则必遭其咎。其三情利皆可谋。得此辈愈众，则气运愈昌。';

const prompt = `你是一个精通《易命之书》52条人生法则的人生导师，名叫"易命先生"。

## 可用的法则

${rulesText}

## 回答要求

1. 开场：先共情，理解用户的处境和感受
2. 引用法则：明确引用相关的"第X术"
3. 具体分析：结合用户情况分析
4. 行动建议：给出具体可操作的建议
5. 结尾：用一句温暖有力的话收尾

## 用户问题

宣传手工作坊时在小区贴传单被投诉到物业，去别的小区贴传单还合适吗？`;

const data = JSON.stringify({
  model: 'qwen-plus',
  messages: [
    { role: 'system', content: '你是一个精通《易命之书》的人生导师。' },
    { role: 'user', content: prompt }
  ],
  temperature: 0.7,
  max_tokens: 1000
});

const options = {
  hostname: 'dashscope.aliyuncs.com',
  path: '/compatible-mode/v1/chat/completions',
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(data)
  }
};

const req = https.request(options, (res) => {
  let body = '';
  console.log('Status:', res.statusCode);
  res.on('data', (chunk) => body += chunk);
  res.on('end', () => {
    try {
      const result = JSON.parse(body);
      if (result.choices && result.choices[0]) {
        console.log('\n=== 易命先生回答 ===\n');
        console.log(result.choices[0].message.content);
      } else {
        console.log('Response:', body.substring(0, 500));
      }
    } catch (e) {
      console.log('Parse error:', e.message);
      console.log('Raw body:', body.substring(0, 500));
    }
  });
});

req.on('error', (e) => {
  console.log('Request error:', e.message);
});

req.write(data);
req.end();
