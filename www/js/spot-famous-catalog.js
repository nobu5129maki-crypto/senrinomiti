/**
 * 有名観光地カタログ（日本・海外の定番スポット）
 */

export const FAMOUS_SPOT_ENTRIES = [
  // ── 日本：テーマパーク・エンタメ ──
  { id: 'tokyo-disneysea', name: '東京ディズニーシー', lat: 35.6267, lng: 139.8833, mode: 'japan', img: 'tokyoDisneyland', aliases: ['ディズニーシー', 'TDS', 'tds', 'disney sea'] },
  { id: 'usj', name: 'ユニバーサル・スタジオ・ジャパン', lat: 34.6654, lng: 135.4323, mode: 'japan', img: 'dotonbori', aliases: ['USJ', 'usj', 'ユニバ', '大阪USJ'] },
  { id: 'fuji-q-highland', name: '富士急ハイランド', lat: 35.4883, lng: 138.7808, mode: 'japan', img: 'fuji', aliases: ['富士急', 'ふじきゅう', 'FUJI-Q'] },
  { id: 'huis-ten-bosch', name: 'ハウステンボス', lat: 33.0872, lng: 129.7878, mode: 'japan', img: 'itsukushima', aliases: ['HUIS TEN BOSCH', '長崎テーマパーク'] },
  { id: 'legoland-japan', name: 'レゴランド・ジャパン', lat: 35.0506, lng: 136.8842, mode: 'japan', img: 'nagoyaCastle', aliases: ['レゴランド', '名古屋レゴ'] },

  // ── 日本：東京・関東 ──
  { id: 'imperial-palace', name: '皇居', lat: 35.6852, lng: 139.7528, mode: 'japan', img: 'meijiJingu', aliases: ['東京皇居', '皇居外苑', 'こうきょ'] },
  { id: 'ueno-park', name: '上野公園', lat: 35.7145, lng: 139.7733, mode: 'japan', img: 'sensoji', aliases: ['上野', 'うえの', '上野動物園'] },
  { id: 'shinjuku-gyoen', name: '新宿御苑', lat: 35.6852, lng: 139.7100, mode: 'japan', img: 'meijiJingu', aliases: ['新宿', 'しんじゅくぎょえん'] },
  { id: 'roppongi-hills', name: '六本木ヒルズ', lat: 35.6605, lng: 139.7293, mode: 'japan', img: 'roppongiHills', aliases: ['六本木', 'ろっぽんぎ', '森美術館'] },
  { id: 'odaiba', name: 'お台場', lat: 35.6298, lng: 139.7756, mode: 'japan', img: 'odaiba', aliases: ['台場', 'おだいば', 'レインボーブリッジ', '自由の女神像'] },
  { id: 'shibuya-scramble', name: '渋谷スクランブル交差点', lat: 35.6595, lng: 139.7004, mode: 'japan', img: 'shibuyaScramble', aliases: ['渋谷', 'しぶや', 'ハチ公'] },
  { id: 'harajuku', name: '原宿', lat: 35.6702, lng: 139.7027, mode: 'japan', img: 'meijiJingu', aliases: ['竹下通り', 'はらじゅく', '表参道'] },
  { id: 'tokyo-dome', name: '東京ドーム', lat: 35.7056, lng: 139.7519, mode: 'japan', img: 'tokyoDome', aliases: ['後楽園', 'とうきょうドーム'] },
  { id: 'toyosu-market', name: '豊洲市場', lat: 35.6457, lng: 139.7856, mode: 'japan', img: 'sensoji', aliases: ['築地', 'つきじ', '豊洲'] },
  { id: 'national-stadium', name: '国立競技場', lat: 35.6797, lng: 139.7106, mode: 'japan', img: 'nationalStadium', aliases: ['新国立競技場', 'ジャパン国立スタジアム'] },
  { id: 'yokohama-landmark', name: '横浜ランドマークタワー', lat: 35.4547, lng: 139.6317, mode: 'japan', img: 'yokohamaMinatoMirai', aliases: ['横浜ランドマーク', 'みなとみらい'] },
  { id: 'yokohama-chinatown', name: '横浜中華街', lat: 35.4427, lng: 139.6455, mode: 'japan', img: 'yokohamaMinatoMirai', aliases: ['中華街', 'よこはまちゅうかがい'] },
  { id: 'kamakura', name: '鎌倉', lat: 35.3192, lng: 139.5467, mode: 'japan', img: 'kamakuraDaibutsu', aliases: ['鎌倉市', 'かまくら', '鶴岡八幡宮'] },
  { id: 'hakone-ropeway', name: '大涌谷', lat: 35.2431, lng: 139.0197, mode: 'japan', img: 'hakoneFuji', aliases: ['箱根', 'はこね', '箱根ロープウェイ', '黒たまご'] },
  { id: 'nikko-city', name: '日光', lat: 36.7500, lng: 139.6167, mode: 'japan', img: 'nikkoToshogu', aliases: ['にっこう', '日光市'] },

  // ── 日本：関西・中部 ──
  { id: 'nijo-castle', name: '二条城', lat: 35.0142, lng: 135.7485, mode: 'japan', img: 'nagoyaCastle', aliases: ['二条', 'にじょうじょう', '京都二条城'] },
  { id: 'gion', name: '祇園', lat: 35.0037, lng: 135.7788, mode: 'japan', img: 'kinkakuji', aliases: ['花見小路', 'ぎおん', '京都祇園'] },
  { id: 'biwako', name: '琵琶湖', lat: 35.2500, lng: 136.0833, mode: 'japan', img: 'kinkakuji', aliases: ['びわこ', '滋賀', '琵琶湖大橋'] },
  { id: 'kobe-kitano', name: '神戸異人館', lat: 34.6983, lng: 135.1869, mode: 'japan', img: 'kobePort', aliases: ['北野異人館', '神戸北野', 'きたの'] },
  { id: 'shirahige-shrine', name: '白鬚神社', lat: 35.2989, lng: 136.0139, mode: 'japan', img: 'itsukushima', aliases: ['琵琶湖大鳥居', 'しらひげ'] },

  // ── 日本：北海道・東北 ──
  { id: 'hakodate', name: '函館山', lat: 41.7575, lng: 140.7083, mode: 'japan', img: 'sapporoClock', aliases: ['函館', 'はこだて', '函館夜景', '百万ドルの夜景'] },
  { id: 'goryokaku', name: '五稜郭', lat: 41.7968, lng: 140.7569, mode: 'japan', img: 'sapporoClock', aliases: ['五稜郭タワー', 'ごりょかく', '函館五稜郭'] },
  { id: 'otaru-canal', name: '小樽運河', lat: 43.1969, lng: 141.0020, mode: 'japan', img: 'sapporoClock', aliases: ['小樽', 'おたる'] },
  { id: 'asahiyama-zoo', name: '旭山動物園', lat: 43.7683, lng: 142.4814, mode: 'japan', img: 'sapporoClock', aliases: ['旭川', 'あさひやま'] },
  { id: 'furano', name: '富良野', lat: 43.3422, lng: 142.3847, mode: 'japan', img: 'furano', aliases: ['富良野ラベンダー', 'ふらの', 'ファーム富田'] },
  { id: 'biei-blue-pond', name: '青い池', lat: 43.4847, lng: 142.6497, mode: 'japan', img: 'bieiBluePond', aliases: ['美瑛', 'びえい', '白金青い池'] },
  { id: 'niseko', name: 'ニセコ', lat: 42.8047, lng: 140.6874, mode: 'japan', img: 'niseko', aliases: ['ニセコスキー', 'にせこ', '二世古'] },

  // ── 日本：中国・四国・九州・沖縄 ──
  { id: 'miyajima', name: '宮島', lat: 34.2959, lng: 132.3198, mode: 'japan', img: 'itsukushima', aliases: ['厳島', 'みやじま'] },
  { id: 'fukuoka-tower', name: '福岡タワー', lat: 33.5931, lng: 130.3514, mode: 'japan', img: 'fukuokaOhori', aliases: ['福岡', 'ふくおかタワー', 'ももち浜'] },
  { id: 'kagoshima-city', name: '鹿児島', lat: 31.5961, lng: 130.5483, mode: 'japan', img: 'sakurajima', aliases: ['かごしま', '仙巌園'] },
  { id: 'naha-kokusai', name: '那覇国際通り', lat: 26.2164, lng: 127.6840, mode: 'japan', img: 'shurijo', aliases: ['国際通り', '那覇', 'なは'] },
  { id: 'manzamo', name: '万座毛', lat: 26.5072, lng: 127.8511, mode: 'japan', img: 'guam', aliases: ['恩納村', 'まんざもう', '沖縄'] },

  // ── 海外：ヨーロッパ ──
  { id: 'louvre', name: 'ルーヴル美術館', lat: 48.8606, lng: 2.3376, mode: 'world', img: 'louvre', aliases: ['louvre', 'ルーブル', 'パリ'] },
  { id: 'notre-dame', name: 'ノートルダム大聖堂', lat: 48.8530, lng: 2.3499, mode: 'world', img: 'eiffelTower', aliases: ['notre dame', 'ノートルダム', 'パリ'] },
  { id: 'arc-de-triomphe', name: '凱旋門', lat: 48.8738, lng: 2.2950, mode: 'world', img: 'eiffelTower', aliases: ['arc de triomphe', 'シャンゼリゼ', 'パリ'] },
  { id: 'versailles', name: 'ベルサイユ宮殿', lat: 48.8049, lng: 2.1204, mode: 'world', img: 'eiffelTower', aliases: ['versailles', 'ヴェルサイユ', 'フランス'] },
  { id: 'tower-bridge', name: 'タワーブリッジ', lat: 51.5055, lng: -0.0754, mode: 'world', img: 'palaceOfWestminster', aliases: ['tower bridge'] },
  { id: 'buckingham-palace', name: 'バッキンガム宮殿', lat: 51.5014, lng: -0.1419, mode: 'world', img: 'palaceOfWestminster', aliases: ['buckingham', 'ロンドン'] },
  { id: 'tower-of-london', name: 'ロンドン塔', lat: 51.5081, lng: -0.0760, mode: 'world', img: 'palaceOfWestminster', aliases: ['tower of london'] },
  { id: 'leaning-tower-pisa', name: 'ピサの斜塔', lat: 43.7230, lng: 10.3966, mode: 'world', img: 'leaningTowerPisa', aliases: ['pisa', 'ピサ', 'イタリア'] },
  { id: 'vatican', name: 'バチカン', lat: 41.9022, lng: 12.4539, mode: 'world', img: 'colosseum', aliases: ['vatican', 'サン・ピエトロ大聖堂', 'ローマ'] },
  { id: 'trevi-fountain', name: 'トレヴィの泉', lat: 41.9009, lng: 12.4833, mode: 'world', img: 'colosseum', aliases: ['trevi fountain', 'ローマ'] },
  { id: 'acropolis', name: 'アクロポリス', lat: 37.9715, lng: 23.7267, mode: 'world', img: 'colosseum', aliases: ['acropolis', 'パルテノン', 'アテネ', 'ギリシャ'] },
  { id: 'alhambra', name: 'アルハンブラ宮殿', lat: 37.1761, lng: -3.5881, mode: 'world', img: 'sagradaFamilia', aliases: ['alhambra', 'グラナダ', 'スペイン'] },
  { id: 'red-square', name: '赤の広場', lat: 55.7539, lng: 37.6208, mode: 'world', img: 'saintBasils', aliases: ['red square', 'クレムリン', 'モスクワ'] },

  // ── 海外：北米 ──
  { id: 'times-square', name: 'タイムズスクエア', lat: 40.7580, lng: -73.9855, mode: 'world', img: 'statueOfLiberty', aliases: ['times square', 'ニューヨーク', 'NY'] },
  { id: 'empire-state', name: 'エンパイアステートビル', lat: 40.7484, lng: -73.9857, mode: 'world', img: 'statueOfLiberty', aliases: ['empire state', 'ニューヨーク'] },
  { id: 'white-house', name: 'ホワイトハウス', lat: 38.8977, lng: -77.0365, mode: 'world', img: 'whiteHouse', aliases: ['white house', 'ワシントンDC'] },
  { id: 'las-vegas-strip', name: 'ラスベガス', lat: 36.1147, lng: -115.1728, mode: 'world', img: 'hollywoodSign', aliases: ['las vegas', 'ラスベガスストリップ', 'ベガス'] },
  { id: 'disney-world', name: 'ウォルト・ディズニー・ワールド', lat: 28.3852, lng: -81.5639, mode: 'world', img: 'hollywoodSign', aliases: ['disney world', 'ディズニーワールド', 'フロリダ'] },
  { id: 'cn-tower', name: 'シーエヌタワー', lat: 43.6426, lng: -79.3871, mode: 'world', img: 'cnTower', aliases: ['CNタワー', 'cn tower', 'トロント', 'カナダ'] },
  { id: 'mount-rushmore', name: 'ラシュモア山', lat: 43.8791, lng: -103.4591, mode: 'world', img: 'hollywoodSign', aliases: ['mount rushmore', 'ラシュモア', 'アメリカ'] },
  { id: 'space-needle', name: 'スペースニードル', lat: 47.6205, lng: -122.3493, mode: 'world', img: 'goldenGate', aliases: ['space needle', 'シアトル'] },
  { id: 'yosemite', name: 'ヨセミテ国立公園', lat: 37.8651, lng: -119.5383, mode: 'world', img: 'hollywoodSign', aliases: ['yosemite', 'ヨセミテ', 'アメリカ'] },
  { id: 'miami-beach', name: 'マイアミビーチ', lat: 25.7907, lng: -80.1300, mode: 'world', img: 'waikiki', aliases: ['miami', 'マイアミ', 'サウスビーチ'] },

  // ── 海外：アジア・中東・オセアニア ──
  { id: 'marina-bay-sands', name: 'マリーナベイ・サンズ', lat: 1.2834, lng: 103.8607, mode: 'world', img: 'merlion', aliases: ['marina bay sands', 'シンガポール', 'MBS'] },
  { id: 'sentosa', name: 'セントーサ島', lat: 1.2494, lng: 103.8303, mode: 'world', img: 'merlion', aliases: ['sentosa', 'シンガポール'] },
  { id: 'forbidden-city', name: '故宮', lat: 39.9163, lng: 116.3972, mode: 'world', img: 'greatWall', aliases: ['紫禁城', 'forbidden city', '北京', '故宮博物院'] },
  { id: 'terracotta-army', name: '兵馬俑', lat: 34.3844, lng: 109.2785, mode: 'world', img: 'greatWall', aliases: ['terracotta army', '西安', '始皇帝'] },
  { id: 'petronas-towers', name: 'ペトロナスツインタワー', lat: 3.1579, lng: 101.7116, mode: 'world', img: 'merlion', aliases: ['petronas', 'クアラルンプール', 'KL'] },
  { id: 'sydney-harbour-bridge', name: 'シドニーハーバーブリッジ', lat: -33.8523, lng: 151.2108, mode: 'world', img: 'sydneyOpera', aliases: ['harbour bridge', 'シドニー', 'ハーバーブリッジ'] },
  { id: 'maldives', name: 'モルディブ', lat: 3.2028, lng: 73.2207, mode: 'world', img: 'bali', aliases: ['maldives', 'モルディブ諸島', 'リゾート'] },
  { id: 'cancun', name: 'カンクン', lat: 21.1619, lng: -86.8515, mode: 'world', img: 'chichenItza', aliases: ['cancun', 'カンクン', 'メキシコ'] },
  { id: 'victoria-falls', name: 'ビクトリアの滝', lat: -17.9243, lng: 25.8572, mode: 'world', img: 'tableMountain', aliases: ['victoria falls', 'ザンビア', 'ジンバブエ'] }
];
