/**
 * Recognize supported commerce platforms from copied share text / URLs.
 * No platform is inferred from a bare product ID or an opaque short link.
 * A user must select the platform manually when this returns null.
 */
export function detectCpsPlatform(value) {
  if (typeof value !== 'string' || !value.trim()) return null;
  const text = value.trim();
  const hosts = [
    ['jd', /(?:^|[^\w.-])(?:[a-z0-9-]+\.)*(?:jd\.com|3\.cn)(?=$|[\/?#:\s，。])/i],
    ['pdd', /(?:^|[^\w.-])(?:[a-z0-9-]+\.)*(?:pinduoduo\.com|yangkeduo\.com|pdd\.cn)(?=$|[\/?#:\s，。])/i],
    ['taobao', /(?:^|[^\w.-])(?:[a-z0-9-]+\.)*(?:taobao\.com|tmall\.com|tb\.cn)(?=$|[\/?#:\s，。])/i],
    ['douyin', /(?:^|[^\w.-])(?:[a-z0-9-]+\.)*(?:douyin\.com|iesdouyin\.com)(?=$|[\/?#:\s，。])/i],
  ];
  for (const [code, pattern] of hosts) {
    if (pattern.test(text)) return code;
  }
  return null;
}
