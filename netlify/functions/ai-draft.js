// Gọi Anthropic API từ server (Netlify Function) thay vì từ trình duyệt.
//
// Lý do đổi cách này: nếu để mỗi người tự dán API key vào trình duyệt, hoặc
// bake thẳng 1 key dùng chung vào index.html, key đó sẽ hiện trong mã nguồn
// public — ai xem "View source" cũng lấy được và xài ké/rút credit. Đặt key
// làm biến môi trường trên Netlify (không nằm trong code, không ai xem
// được) rồi gọi qua function này là cách chuẩn để "dùng chung 1 key cho cả
// nhóm" mà vẫn an toàn.
//
// Cách cấu hình (làm 1 lần, người tổ chức chuyến đi):
// Netlify dashboard → Site configuration → Environment variables →
// Add a variable → Key: ANTHROPIC_API_KEY, Value: sk-ant-... → Save →
// Deploys → Trigger deploy (để function đọc được biến mới).

exports.handler = async function (event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Chưa cấu hình ANTHROPIC_API_KEY trên Netlify (Site configuration → Environment variables).',
      }),
    };
  }

  let payload;
  try {
    payload = JSON.parse(event.body || '{}');
  } catch (e) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Body không phải JSON hợp lệ' }) };
  }

  const convo = (payload.convo || '').slice(0, 8000); // chặn payload quá lớn

  const system =
    'Bạn là trợ lý lập kế hoạch cho một nhóm 3 người đi Hà Giang Loop bằng xe máy từ 04-07/11. ' +
    'Dựa vào đoạn hội thoại nhóm, hãy soạn MỘT đề xuất thay đổi lịch trình rõ ràng, thực tế, khả thi ' +
    'về mặt địa lý/thời gian. Trả lời DUY NHẤT một JSON hợp lệ, không thêm chữ nào khác, không dùng ' +
    'markdown fence, đúng format: {"title":"tiêu đề ngắn","day":"Ngày mấy hoặc Chung",' +
    '"summary":"tóm tắt 1 câu","details":"mô tả cụ thể, tối đa 4 câu, tiếng Việt"}';

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-5',
        max_tokens: 700,
        system,
        messages: [{ role: 'user', content: convo || '(chưa có tin nhắn nào, hãy soạn đề xuất chung chung dựa trên lịch trình 4 ngày Hà Giang Loop 4-7/11)' }],
      }),
    });

    if (!res.ok) {
      const t = await res.text();
      return {
        statusCode: res.status,
        body: JSON.stringify({ error: `Anthropic API lỗi ${res.status}: ${t.slice(0, 300)}` }),
      };
    }

    const data = await res.json();
    const text = (data.content || []).filter((b) => b.type === 'text').map((b) => b.text).join('\n');

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ text }),
    };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: String(err) }) };
  }
};
