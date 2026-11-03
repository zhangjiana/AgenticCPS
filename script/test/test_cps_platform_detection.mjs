import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

// The UniApp package is not declared as a Node ESM package.
// Import the small platform detector as a data URL without changing package settings.
const source = readFileSync(
  new URL('../../frontend/mall-uniapp/sheep/helper/cpsPlatform.js', import.meta.url),
  'utf8',
);
const { detectCpsPlatform } = await import(`data:text/javascript,${encodeURIComponent(source)}`);

const cases = [
  ['https://item.jd.com/123456.html', 'jd'],
  ['京东 https://u.jd.com/abc123', 'jd'],
  ['https://mobile.yangkeduo.com/goods.html?goods_id=123', 'pdd'],
  ['https://mobile.pinduoduo.com/goods.html', 'pdd'],
  ['https://m.tb.cn/h.ABCD', 'taobao'],
  ['https://detail.tmall.com/item.htm?id=789', 'taobao'],
  ['https://v.douyin.com/aBc', 'douyin'],
  ['1234567890', null],
  ['https://foo.jd.com.evil.com/no', null],
  ['', null],
];
for (const [input, expected] of cases) {
  assert.equal(detectCpsPlatform(input), expected, `Unexpected platform for ${input}`);
}
console.log(`Platform detection: ${cases.length} cases passed`);
