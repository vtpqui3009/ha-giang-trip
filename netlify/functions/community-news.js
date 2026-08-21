// Kéo tin tức thật liên quan Hà Giang (sạt lở, mưa lũ, giao thông, thời
// tiết) từ Google News RSS. Chạy server-side (Netlify Function) để tránh
// lỗi CORS khi frontend gọi thẳng RSS, và để có thể cache/giới hạn tần suất.
//
// Đây là cách "kéo tin từ cộng đồng/báo chí thật" thay vì để nhóm tự đăng
// cảnh báo — không có cách hợp pháp nào để một website tự động đọc
// Facebook/Instagram, nên dùng Google News làm nguồn tổng hợp báo chí công
// khai, ổn định, không cần API key.

const QUERY =
  '"Hà Giang" (sạt lở OR "mưa lũ" OR "mưa lớn" OR "giao thông" OR "thời tiết" OR "cảnh báo" OR "sạt lở đất")';
const RSS_URL = `https://news.google.com/rss/search?q=${encodeURIComponent(
  QUERY
)}&hl=vi&gl=VN&ceid=VN:vi`;

function decodeEntities(str) {
  return (str || '')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&');
}

function stripCdata(str) {
  const m = /^<!\[CDATA\[([\s\S]*?)\]\]>$/.exec((str || '').trim());
  return m ? m[1] : str;
}

function extractTag(block, tag) {
  const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i');
  const m = re.exec(block);
  return m ? decodeEntities(stripCdata(m[1]).trim()) : '';
}

exports.handler = async function () {
  try {
    const res = await fetch(RSS_URL, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; HaGiangLoopTripApp/1.0)' },
    });

    if (!res.ok) {
      return {
        statusCode: 502,
        body: JSON.stringify({ error: 'RSS fetch failed', status: res.status }),
      };
    }

    const xml = await res.text();
    const items = [];
    const itemBlocks = xml.split('<item>').slice(1);

    for (const raw of itemBlocks.slice(0, 20)) {
      const block = raw.split('</item>')[0];
      const title = extractTag(block, 'title');
      const link = extractTag(block, 'link');
      const pubDate = extractTag(block, 'pubDate');
      const sourceMatch = /<source[^>]*>([\s\S]*?)<\/source>/i.exec(block);
      const source = sourceMatch ? decodeEntities(stripCdata(sourceMatch[1]).trim()) : '';
      if (title && link) items.push({ title, link, pubDate, source });
    }

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=600', // cache 10 phút phía CDN Netlify
      },
      body: JSON.stringify({ items, fetchedAt: new Date().toISOString() }),
    };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: String(err) }) };
  }
};
