/**
 * 世界版：現地語・英語の地名を日本語表示へ寄せる
 */

/** Nominatim 等が返す現地語・英語 → 日本語 */
export const WORLD_PLACE_JA = {
  // 韓国
  'N서울타워': '南山タワー',
  '남산서울타워': '南山タワー',
  '서울타워': '南山タワー',
  'N Seoul Tower': '南山タワー',
  'N Seoul Tower (Namsan)': '南山タワー',
  'Namsan Seoul Tower': '南山タワー',
  'Namsan Tower': '南山タワー',
  '경복궁': '景福宮',
  'Gyeongbokgung': '景福宮',
  '창덕궁': '昌徳宮',
  '명동': '明洞',
  'Myeongdong': '明洞',
  '부산': '釜山',
  'Busan': '釜山',
  '제주도': '済州島',
  'Jeju': '済州島',
  'Jeju Island': '済州島',
  '경주': '慶州',
  'Gyeongju': '慶州',
  '감천문화마을': '甘川文化村',
  '서울': 'ソウル',
  'Seoul': 'ソウル',
  // 中国
  '外滩': '外灘',
  '上海外滩': '上海・外灘',
  'The Bund': '上海・外灘',
  'Bund': '上海・外灘',
  '故宫': '故宮',
  '故宮': '故宮',
  'Forbidden City': '故宮',
  '天安门': '天安門',
  '天安門': '天安門',
  '兵马俑': '兵馬俑',
  'Terracotta Army': '兵馬俑',
  '长城': '万里の長城',
  'Great Wall of China': '万里の長城',
  'Shanghai': '上海',
  'Beijing': '北京',
  'Hong Kong': '香港',
  // 台湾
  '台北101': '台北101',
  'Taipei 101': '台北101',
  // 東南アジア
  'Wat Arun': 'ワット・アルン',
  'Angkor Wat': 'アンコールワット',
  'Petronas Towers': 'ペトロナスツインタワー',
  'Petronas Twin Towers': 'ペトロナスツインタワー',
  'Marina Bay Sands': 'マリーナベイ・サンズ',
  'Ha Long Bay': 'ハロン湾',
  'Hạ Long Bay': 'ハロン湾',
  // 欧州・米・その他（英語表記が残りやすいもの）
  'Eiffel Tower': 'エッフェル塔',
  'Louvre Museum': 'ルーヴル美術館',
  'Louvre': 'ルーヴル美術館',
  'Statue of Liberty': '自由の女神',
  'Colosseum': 'コロッセオ',
  'Colosseo': 'コロッセオ',
  'Big Ben': 'ビッグベン',
  'Tower Bridge': 'タワーブリッジ',
  'Buckingham Palace': 'バッキンガム宮殿',
  'White House': 'ホワイトハウス',
  'CN Tower': 'シーエヌタワー',
  'Times Square': 'タイムズスクエア',
  'Empire State Building': 'エンパイアステートビル',
  'Golden Gate Bridge': 'ゴールデンゲートブリッジ',
  'Hollywood Sign': 'ハリウッドサイン',
  'Sydney Opera House': 'シドニー・オペラハウス',
  'Taj Mahal': 'タージ・マハル',
  'Machu Picchu': 'マチュピチュ',
  'Christ the Redeemer': 'コルコバードのキリスト像',
  'Sagrada Família': 'サグラダ・ファミリア',
  'Sagrada Familia': 'サグラダ・ファミリア',
  'Brandenburg Gate': 'ブランデンブルク門',
  'Brandenburger Tor': 'ブランデンブルク門',
  'Hagia Sophia': 'アヤソフィア',
  "Saint Basil's Cathedral": '聖ワシリイ大聖堂',
  'Burj Khalifa': 'ブルジュ・ハリファ',
  'Gateway of India': 'インド門',
  'Pyramids of Giza': 'ギザのピラミッド',
  'Great Pyramid of Giza': 'ギザのピラミッド',
  'Table Mountain': 'テーブルマウンテン',
  'Niagara Falls': 'ナイアガラの滝',
  'Grand Canyon': 'グランドキャニオン',
  'Mount Rushmore': 'ラシュモア山',
  'Space Needle': 'スペースニードル',
  'Neuschwanstein Castle': 'ノイシュヴァンシュタイン城',
  'Mont-Saint-Michel': 'モン・サン=ミッシェル',
  'Stonehenge': 'ストーンヘンジ',
  'Petra': 'ペトラ',
  'Uluru': 'ウルル',
  'Chichen Itza': 'チチェン・イッツァ',
  'Victoria Falls': 'ビクトリアの滝',
  'Acropolis': 'アクロポリス',
  'Parthenon': 'パルテノン神殿',
  'Leaning Tower of Pisa': 'ピサの斜塔',
  'Tower of Pisa': 'ピサの斜塔',
  'Arc de Triomphe': '凱旋門',
  'Notre-Dame de Paris': 'ノートルダム大聖堂',
  'Notre Dame': 'ノートルダム大聖堂',
  'Matterhorn': 'マッターホルン',
  'Santorini': 'サントリーニ島',
  'Red Square': '赤の広場',
  'Versailles': 'ベルサイユ宮殿',
  'Palace of Versailles': 'ベルサイユ宮殿'
};

function normalizeLookupKey(name) {
  return String(name || '')
    .trim()
    .replace(/\s+/g, ' ');
}

/** ハングル・キリル・アラビア・タイ文字など、日本語UI向けに置換したい文字種 */
export function hasNonJapaneseLocalScript(text) {
  const s = String(text || '');
  return /[\u1100-\u11FF\u3130-\u318F\uAC00-\uD7AF]/.test(s) ||
    /[\u0400-\u04FF]/.test(s) ||
    /[\u0600-\u06FF]/.test(s) ||
    /[\u0E00-\u0E7F]/.test(s);
}

/** 日本語かなを含まない漢字のみ（中国語表記の可能性） */
export function looksLikeChineseOnlyName(text) {
  const s = String(text || '').trim();
  if (!s || s.length < 2) return false;
  if (/[\u3040-\u30FF]/.test(s)) return false; // かながあれば日本語寄り
  if (/[A-Za-z]/.test(s)) return false;
  return /[\u4E00-\u9FFF]/.test(s) && /外滩|故宫|长城|兵马俑|天安门|南浦|东方明珠/.test(s);
}

/**
 * @param {string} name
 * @returns {string|null}
 */
export function toJapaneseWorldPlaceName(name) {
  const key = normalizeLookupKey(name);
  if (!key) return null;
  if (WORLD_PLACE_JA[key]) return WORLD_PLACE_JA[key];

  const lower = key.toLowerCase();
  for (const [from, to] of Object.entries(WORLD_PLACE_JA)) {
    if (from.toLowerCase() === lower) return to;
  }
  return null;
}
