/**
 * マイナー名所カタログ（コンパクト定義）
 * spots.js から展開して SPOTS にマージ
 *
 * 形式: { id, name, lat, lng, mode, img, aliases?, label?, food?, desc? }
 */

export const MINOR_SPOT_ENTRIES = [
  // ── 日本：城・史跡 ──
  { id: 'matsumoto-castle', name: '松本城', lat: 36.2388, lng: 137.9689, mode: 'japan', img: 'nagoyaCastle', aliases: ['深志城', '松本'] },
  { id: 'hirosaki-castle', name: '弘前城', lat: 40.6075, lng: 140.4636, mode: 'japan', img: 'nagoyaCastle', aliases: ['弘前', '桜の城'] },
  { id: 'hikone-castle', name: '彦根城', lat: 35.2764, lng: 136.2517, mode: 'japan', img: 'nagoyaCastle', aliases: ['彦根', 'ひこね'] },
  { id: 'matsue-castle', name: '松江城', lat: 35.4753, lng: 133.0506, mode: 'japan', img: 'nagoyaCastle', aliases: ['松江', 'くろつる城'] },
  { id: 'marugame-castle', name: '丸亀城', lat: 34.2864, lng: 133.7997, mode: 'japan', img: 'nagoyaCastle', aliases: ['丸亀'] },
  { id: 'aizuwakamatsu-castle', name: '会津若松城', lat: 37.4878, lng: 139.9297, mode: 'japan', img: 'nagoyaCastle', aliases: ['鶴ヶ城', '会津', '若松城'] },
  { id: 'takeda-castle', name: '竹田城', lat: 35.3003, lng: 134.8294, mode: 'japan', img: 'nagoyaCastle', aliases: ['天空の城', '竹田', '但馬'] },
  { id: 'inuyama-castle', name: '犬山城', lat: 35.3882, lng: 136.9392, mode: 'japan', img: 'nagoyaCastle', aliases: ['犬山', '国宝犬山城'] },
  { id: 'uwajima-castle', name: '宇和島城', lat: 33.2236, lng: 132.5656, mode: 'japan', img: 'nagoyaCastle', aliases: ['宇和島'] },

  // ── 日本：寺社・宗教施設 ──
  { id: 'ise-jingu', name: '伊勢神宮', lat: 34.4553, lng: 136.7258, mode: 'japan', img: 'itsukushima', aliases: ['伊勢', '内宮', 'いせじんぐう'] },
  { id: 'zenkoji', name: '善光寺', lat: 36.6616, lng: 138.1878, mode: 'japan', img: 'sensoji', aliases: ['長野', 'ぜんこうじ'] },
  { id: 'chusonji', name: '中尊寺', lat: 39.0012, lng: 141.1132, mode: 'japan', img: 'kinkakuji', aliases: ['平泉', '金色堂', 'ちゅうそんじ'] },
  { id: 'motsuji', name: '毛越寺', lat: 38.9889, lng: 141.1133, mode: 'japan', img: 'kinkakuji', aliases: ['平泉', 'もつじ'] },
  { id: 'zuiganji', name: '瑞巌寺', lat: 38.3708, lng: 141.0611, mode: 'japan', img: 'matsushima', aliases: ['松島', 'ずいがんじ'] },
  { id: 'zuihoden', name: '瑞鳳殿', lat: 38.2506, lng: 140.8667, mode: 'japan', img: 'matsushima', aliases: ['仙台', '伊達', 'ずいほうでん'] },
  { id: 'kofukuji', name: '興福寺', lat: 34.6830, lng: 135.8330, mode: 'japan', img: 'todaiji', aliases: ['奈良', 'こうふくじ', '五重塔'] },
  { id: 'toshodaiji', name: '唐招提寺', lat: 34.6756, lng: 135.7847, mode: 'japan', img: 'todaiji', aliases: ['奈良', 'とうしょうだいじ'] },
  { id: 'ginkakuji', name: '銀閣寺', lat: 35.5271, lng: 135.7982, mode: 'japan', img: 'kinkakuji', aliases: ['慈照寺', 'ぎんかくじ'] },
  { id: 'ryoanji', name: '龍安寺', lat: 35.0344, lng: 135.7183, mode: 'japan', img: 'kinkakuji', aliases: ['石庭', 'りょうあんじ'] },
  { id: 'tenryuji', name: '天龍寺', lat: 35.0155, lng: 135.6739, mode: 'japan', img: 'arashiyama', aliases: ['嵯峨野', 'てんりゅうじ'] },
  { id: 'nanzenji', name: '南禅寺', lat: 35.0114, lng: 135.7944, mode: 'japan', img: 'kinkakuji', aliases: ['京都', 'なんぜんじ', '三門'] },
  { id: 'daigoji', name: '醍醐寺', lat: 34.9511, lng: 135.8194, mode: 'japan', img: 'kinkakuji', aliases: ['京都', 'だいごじ'] },
  { id: 'byodoin', name: '平等院', lat: 34.8892, lng: 135.8078, mode: 'japan', img: 'kinkakuji', aliases: ['宇治', '鳳凰堂', 'びょうどういん'] },
  { id: 'kumano-hongu', name: '熊野本宮大社', lat: 33.8406, lng: 135.7736, mode: 'japan', img: 'itsukushima', aliases: ['熊野', '本宮', '大斎原'] },
  { id: 'kumano-nachi', name: '熊野那智大社', lat: 33.6853, lng: 135.8900, mode: 'japan', img: 'itsukushima', aliases: ['那智', '那智の滝', '熊野'] },
  { id: 'dewa-sanzan', name: '出羽三山', lat: 38.7008, lng: 140.1017, mode: 'japan', img: 'sensoji', aliases: ['羽黒山', '羽中山', '月山', '出羽'] },
  { id: 'risshakuji', name: '立石寺', lat: 38.3125, lng: 140.4375, mode: 'japan', img: 'sensoji', aliases: ['山寺', 'りっしゃくじ', '宝珠山'] },
  { id: 'naritasan', name: '成田山新勝寺', lat: 35.7878, lng: 140.3183, mode: 'japan', img: 'sensoji', aliases: ['成田', '新勝寺', '成田山'] },
  { id: 'engyoji', name: '書写山圓教寺', lat: 34.8989, lng: 134.9489, mode: 'japan', img: 'himejiCastle', aliases: ['書写山', '圓教寺', '姫路'] },
  { id: 'yasukuni', name: '靖国神社', lat: 35.6941, lng: 139.7430, mode: 'japan', img: 'meijiJingu', aliases: ['千鳥ヶ淵', 'やすくに'] },
  { id: 'heian-jingu', name: '平安神宮', lat: 35.0161, lng: 135.7825, mode: 'japan', img: 'meijiJingu', aliases: ['京都', '神苑'] },
  { id: 'dazaifu-tenmangu', name: '太宰府天満宮', lat: 33.5211, lng: 130.5342, mode: 'japan', img: 'itsukushima', aliases: ['太宰府', '菅原道真', '天満宮'] },
  { id: 'kashima-jingu', name: '鹿島神宮', lat: 35.9689, lng: 140.6311, mode: 'japan', img: 'itsukushima', aliases: ['鹿島', 'かしま'] },
  { id: 'togo-jinja', name: '東郷神社', lat: 35.6711, lng: 139.7350, mode: 'japan', img: 'meijiJingu', aliases: ['原宿', 'とうごう'] },

  // ── 日本：自然・景勝 ──
  { id: 'ogasawara', name: '小笠原諸島', lat: 27.0944, lng: 142.1917, mode: 'japan', img: 'fuji', aliases: ['父島', '世界自然遺産', 'おがさわら'] },
  { id: 'yakushima', name: '屋久島', lat: 30.3586, lng: 130.5286, mode: 'japan', img: 'yakushima', aliases: ['縄文杉', '白谷雲水峡', 'やくしま'] },
  { id: 'shiretoko', name: '知床', lat: 44.1000, lng: 145.1833, mode: 'japan', img: 'shiretoko', aliases: ['知床五湖', '羅臼', 'しれとこ'] },
  { id: 'akanko', name: '阿寒湖', lat: 43.4561, lng: 144.1006, mode: 'japan', img: 'fuji', aliases: ['阿寒', 'まりも', 'あかんこ'] },
  { id: 'mashuko', name: '摩周湖', lat: 43.5722, lng: 144.5600, mode: 'japan', img: 'fuji', aliases: ['摩周', 'ましゅうこ'] },
  { id: 'towadako', name: '十和田湖', lat: 40.4711, lng: 140.8856, mode: 'japan', img: 'towadako', aliases: ['とわだこ', '十和田'] },
  { id: 'oirase', name: '奥入瀬渓流', lat: 40.5833, lng: 140.9667, mode: 'japan', img: 'towadako', aliases: ['奥入瀬', '十和田', 'おいらせ'] },
  { id: 'kagura-dake', name: '上高地', lat: 36.2550, lng: 137.6483, mode: 'japan', img: 'kamikochi', aliases: ['河童橋', '大正池', 'かみこうち'] },
  { id: 'norikura', name: '乗鞍高原', lat: 36.1067, lng: 137.5556, mode: 'japan', img: 'fuji', aliases: ['乗鞍', 'のりくら'] },
  { id: 'shirakami', name: '白神山地', lat: 40.4500, lng: 140.2000, mode: 'japan', img: 'fuji', aliases: ['世界遺産', 'しらかみ'] },
  { id: 'asosan', name: '阿蘇山', lat: 32.8847, lng: 131.1039, mode: 'japan', img: 'asosan', aliases: ['阿蘇', '草千里', 'あそ'] },
  { id: 'sakurajima', name: '桜島', lat: 31.5858, lng: 130.6578, mode: 'japan', img: 'sakurajima', aliases: ['鹿児島', 'さくらじま'] },
  { id: 'kirishima', name: '霧島', lat: 31.9342, lng: 130.8617, mode: 'japan', img: 'kirishima', aliases: ['霧島神宮', 'きりしま'] },
  { id: 'takachiho', name: '高千穂峡', lat: 32.7028, lng: 131.3094, mode: 'japan', img: 'takachiho', aliases: ['高千穂', '真名井の滝', 'たかちほ'] },
  { id: 'kazurabashi', name: '祖谷のかずら橋', lat: 33.8761, lng: 133.8133, mode: 'japan', img: 'kazurabashi', aliases: ['祖谷', 'かずら橋', '徳島'] },
  { id: 'naruto-kaikyo', name: '鳴門海峡', lat: 34.2378, lng: 134.6528, mode: 'japan', img: 'itsukushima', aliases: ['鳴門の渦潮', '大鳴門橋', 'なると'] },
  { id: 'tottori-sakyu', name: '鳥取砂丘', lat: 35.5406, lng: 134.2294, mode: 'japan', img: 'tottoriSakyu', aliases: ['鳥取', 'とっとりさきゅう'] },
  { id: 'akiyoshido', name: '秋芳洞', lat: 34.2267, lng: 131.3078, mode: 'japan', img: 'akiyoshido', aliases: ['秋吉台', 'あきよしどう', '山口'] },
  { id: 'kurobe-dam', name: '黒部ダム', lat: 36.5656, lng: 137.6611, mode: 'japan', img: 'kurobeDam', aliases: ['黒部', '立山', 'くろべ'] },
  { id: 'kurobe-alpine', name: '立山黒部アルペンルート', lat: 36.5750, lng: 137.6167, mode: 'japan', img: 'kurobeDam', aliases: ['立山', '室堂', '雪の大谷'] },
  { id: 'okunikko-kegon', name: '華厳の滝', lat: 36.7378, lng: 139.5031, mode: 'japan', img: 'nikkoToshogu', aliases: ['奥日光', '中禅寺湖', 'けごん'] },
  { id: 'chuzenjiko', name: '中禅寺湖', lat: 36.7228, lng: 139.4847, mode: 'japan', img: 'nikkoToshogu', aliases: ['奥日光', 'ちゅうぜんじこ'] },
  { id: 'ashinoko', name: '芦ノ湖', lat: 35.2117, lng: 139.0108, mode: 'japan', img: 'hakoneFuji', aliases: ['箱根', 'あしのこ'] },
  { id: 'hakone-shrine', name: '箱根神社', lat: 35.2044, lng: 139.0258, mode: 'japan', img: 'hakoneFuji', aliases: ['箱根', '平和の鳥居'] },
  { id: 'shirahama', name: '白良浜', lat: 33.6628, lng: 135.3486, mode: 'japan', img: 'guam', aliases: ['南紀白浜', '和歌山', 'しらはま'] },
  { id: 'tojinbo', name: '東尋坊', lat: 36.0772, lng: 136.1228, mode: 'japan', img: 'tojinbo', aliases: ['福井', 'とうじんぼう'] },
  { id: 'geibikei', name: '猊鼻渓', lat: 38.9378, lng: 141.0578, mode: 'japan', img: 'fuji', aliases: ['一関', 'げいびけい'] },
  { id: 'matsushima-bay', name: '松島湾', lat: 38.3700, lng: 141.0600, mode: 'japan', img: 'matsushima', aliases: ['日本三景', '松島'] },
  { id: 'tsunoshima', name: '角島大橋', lat: 34.3167, lng: 130.8833, mode: 'japan', img: 'itsukushima', aliases: ['角島', '下関', 'つうのしま'] },
  { id: 'yabakei', name: '耶馬渓', lat: 33.4667, lng: 131.1833, mode: 'japan', img: 'fuji', aliases: ['青の洞門', '中津', 'やばけい'] },
  { id: 'unzen-jigoku', name: '雲仙地獄', lat: 32.7500, lng: 130.2500, mode: 'japan', img: 'fuji', aliases: ['雲仙', 'うんぜん'] },
  { id: 'goshikinuma', name: '五色沼', lat: 37.7333, lng: 140.2833, mode: 'japan', img: 'fuji', aliases: ['裏磐梯', '福島', 'ごしきぬま'] },
  { id: 'bandai', name: '磐梯山', lat: 37.6011, lng: 140.0725, mode: 'japan', img: 'fuji', aliases: ['猪苗代', 'ばんだい'] },
  { id: 'zao-okama', name: '蔵王お釜', lat: 38.1361, lng: 140.4417, mode: 'japan', img: 'zaoOkama', aliases: ['蔵王', '御釜', 'ざおう'] },
  { id: 'ogasawara-minami', name: '南アルプス', lat: 35.4694, lng: 138.2383, mode: 'japan', img: 'fuji', aliases: ['甲斐駒', '北岳', 'みなみあるぷす'] },

  // ── 日本：温泉・リゾート ──
  { id: 'kusatsu-onsen', name: '草津温泉', lat: 36.6208, lng: 138.5961, mode: 'japan', img: 'kusatsuOnsen', aliases: ['草津', '湯畑', 'くさつ'] },
  { id: 'beppu-onsen', name: '別府温泉', lat: 33.2794, lng: 131.4975, mode: 'japan', img: 'beppuOnsen', aliases: ['別府', '地獄めぐり', 'べっぷ'] },
  { id: 'yufuin', name: '由布院', lat: 33.2653, lng: 131.3839, mode: 'japan', img: 'yufuin', aliases: ['湯布院', 'ゆふいん', '金鱗湖'] },
  { id: 'dogo-onsen', name: '道後温泉', lat: 33.8517, lng: 132.7861, mode: 'japan', img: 'dogoOnsen', aliases: ['松山', 'どうご'] },
  { id: 'arima-onsen', name: '有馬温泉', lat: 34.7994, lng: 135.2478, mode: 'japan', img: 'kobePort', aliases: ['有馬', 'ありま'] },
  { id: 'ikaho-onsen', name: '伊香保温泉', lat: 36.4933, lng: 138.9200, mode: 'japan', img: 'fuji', aliases: ['伊香保', '石段', 'いかほ'] },
  { id: 'goshogawara-nebuta', name: 'ねぶたの家', lat: 40.8228, lng: 140.7472, mode: 'japan', img: 'sapporoClock', aliases: ['青森ねぶた', '五所川原', 'ねぶた'] },
  { id: 'karuizawa', name: '軽井沢', lat: 36.3483, lng: 138.6358, mode: 'japan', img: 'karuizawa', aliases: ['旧軽', '軽井沢プリンス', 'かるいざわ'] },
  { id: 'atami', name: '熱海', lat: 35.0961, lng: 139.0717, mode: 'japan', img: 'atami', aliases: ['熱海温泉', 'あたみ'] },
  { id: 'shimoda', name: '下田', lat: 34.6792, lng: 138.9453, mode: 'japan', img: 'fuji', aliases: ['ペリー', '下田海中水族館', 'しもだ'] },

  // ── 日本：町並み・文化 ──
  { id: 'kurashiki', name: '倉敷美観地区', lat: 34.5950, lng: 133.7725, mode: 'japan', img: 'shirakawago', aliases: ['倉敷', 'くらしき'] },
  { id: 'tomonoura', name: '鞆の浦', lat: 34.3833, lng: 133.3833, mode: 'japan', img: 'itsukushima', aliases: ['福山', 'とものうら'] },
  { id: 'magome', name: '馬籠宿', lat: 35.5217, lng: 137.5628, mode: 'japan', img: 'shirakawago', aliases: ['中山道', 'まごめ'] },
  { id: 'tsumago', name: '妻籠宿', lat: 35.5783, lng: 137.5939, mode: 'japan', img: 'shirakawago', aliases: ['中山道', 'つまご'] },
  { id: 'kawagoe', name: '川越', lat: 35.9250, lng: 139.4858, mode: 'japan', img: 'shirakawago', aliases: ['小江戸', '時の鐘', 'かわごえ'] },
  { id: 'ouchijuku', name: '大内宿', lat: 37.3394, lng: 139.8644, mode: 'japan', img: 'shirakawago', aliases: ['会津', 'おおうちじゅく'] },
  { id: 'takayama', name: '高山', lat: 36.1461, lng: 137.2522, mode: 'japan', img: 'shirakawago', aliases: ['飛騨', '古い町並', 'たかやま'] },
  { id: 'hida-furukawa', name: '飛騨古川', lat: 36.2383, lng: 137.1867, mode: 'japan', img: 'shirakawago', aliases: ['君の名は', 'ひだふるかわ'] },
  { id: 'inuyama-town', name: '犬山観光', lat: 35.3783, lng: 136.9394, mode: 'japan', img: 'nagoyaCastle', aliases: ['犬山', 'いぬやま'] },
  { id: 'hitachi-kaihin', name: '国営ひたち海浜公園', lat: 36.4000, lng: 140.5917, mode: 'japan', img: 'hitachiKaihin', aliases: ['ひたち海浜', 'ネモフィラ', 'ひたち'] },
  { id: 'glover-garden', name: 'グラバー園', lat: 32.7344, lng: 129.8717, mode: 'japan', img: 'kobePort', aliases: ['長崎', 'ぐらばー'] },
  { id: 'gunkanjima', name: '軍艦島', lat: 32.6278, lng: 129.7386, mode: 'japan', img: 'kobePort', aliases: ['端島', '長崎', 'ぐんかんじま'] },
  { id: 'aoshima', name: '青島', lat: 31.8033, lng: 131.4594, mode: 'japan', img: 'guam', aliases: ['鬼の洗濯板', '宮崎', 'あおしま'] },
  { id: 'kochi-castle', name: '高知城', lat: 33.5606, lng: 133.5314, mode: 'japan', img: 'nagoyaCastle', aliases: ['高知', 'こうちじょう'] },
  { id: 'matsuyama-castle', name: '松山城', lat: 33.8456, lng: 132.7658, mode: 'japan', img: 'nagoyaCastle', aliases: ['松山', 'まつやまじょう'] },
  { id: 'ashikaga-flower', name: 'あしかがフラワーパーク', lat: 36.3147, lng: 139.5228, mode: 'japan', img: 'fuji', aliases: ['足利', '藤', 'あしかが'] },
  { id: 'ashikaga-school', name: '足利学校', lat: 36.3356, lng: 139.4539, mode: 'japan', img: 'sensoji', aliases: ['日本最古の学校', 'あしかが'] },
  { id: 'ashiya', name: '芦屋', lat: 34.7333, lng: 135.3000, mode: 'japan', img: 'kobePort', aliases: ['六麓荘', 'あしや'] },

  // ── 日本：離島 ──
  { id: 'sado-island', name: '佐渡島', lat: 38.0183, lng: 138.3681, mode: 'japan', img: 'itsukushima', aliases: ['佐渡', 'さど'] },
  { id: 'tsushima', name: '対馬', lat: 34.2000, lng: 129.2833, mode: 'japan', img: 'itsukushima', aliases: ['対馬海峡', 'つしま'] },
  { id: 'iki-island', name: '壱岐', lat: 33.7833, lng: 129.7000, mode: 'japan', img: 'itsukushima', aliases: ['壱岐島', 'いき'] },
  { id: 'yakushima-seaside', name: '西表島', lat: 24.4667, lng: 123.8000, mode: 'japan', img: 'guam', aliases: ['西表', '八重山', 'いりおもて'] },
  { id: 'taketomi', name: '竹富島', lat: 24.3250, lng: 124.0833, mode: 'japan', img: 'guam', aliases: ['八重山', 'たけとみ'] },
  { id: 'kouri-island', name: '古宇利島', lat: 26.7028, lng: 128.2778, mode: 'japan', img: 'guam', aliases: ['古宇利橋', 'こうり'] },
  { id: 'miyakojima', name: '宮古島', lat: 24.8056, lng: 125.2811, mode: 'japan', img: 'guam', aliases: ['与那覇前浜', '宮古', 'みやこ'] },
  { id: 'ishigaki-island', name: '石垣島', lat: 24.3444, lng: 124.1572, mode: 'japan', img: 'guam', aliases: ['石垣', 'いしがき'] },
  { id: 'rebun', name: '礼文島', lat: 45.4167, lng: 141.0167, mode: 'japan', img: 'fuji', aliases: ['レブンアツモリソウ', 'れぶん'] },
  { id: 'rishiri', name: '利尻島', lat: 45.1833, lng: 141.1333, mode: 'japan', img: 'fuji', aliases: ['利尻富士', 'りしり'] },

  // ── 海外：ヨーロッパ ──
  { id: 'neuschwanstein', name: 'ノイシュヴァンシュタイン城', lat: 47.5576, lng: 10.7498, mode: 'world', img: 'brandenburgGate', aliases: ['新天鹅堡', 'neuschwanstein', 'バイエルン'] },
  { id: 'mont-saint-michel', name: 'モン・サン=ミッシェル', lat: 48.6360, lng: -1.5115, mode: 'world', img: 'eiffelTower', aliases: ['mont saint michel', 'フランス'] },
  { id: 'stonehenge', name: 'ストーンヘンジ', lat: 51.1789, lng: -1.8262, mode: 'world', img: 'palaceOfWestminster', aliases: ['stonehenge', 'イギリス'] },
  { id: 'edinburgh-castle', name: 'エディンバラ城', lat: 55.9486, lng: -3.1999, mode: 'world', img: 'palaceOfWestminster', aliases: ['edinburgh', 'スコットランド'] },
  { id: 'hallstatt', name: 'ハルシュタット', lat: 47.5622, lng: 13.6493, mode: 'world', img: 'amsterdamCanal', aliases: ['hallstatt', 'オーストリア'] },
  { id: 'matterhorn', name: 'マッターホルン', lat: 45.9763, lng: 7.6586, mode: 'world', img: 'eiffelTower', aliases: ['matterhorn', 'ツェルマット', 'スイス'] },
  { id: 'prague-castle', name: 'プラハ城', lat: 50.0900, lng: 14.4000, mode: 'world', img: 'brandenburgGate', aliases: ['prague', 'カレル橋', 'チェコ'] },
  { id: 'charles-bridge', name: 'カレル橋', lat: 50.0865, lng: 14.4114, mode: 'world', img: 'brandenburgGate', aliases: ['プラハ', 'charles bridge'] },
  { id: 'cappadocia', name: 'カッパドキア', lat: 38.6431, lng: 34.8289, mode: 'world', img: 'hagiaSophia', aliases: ['cappadocia', 'トルコ', '気球'] },
  { id: 'pamukkale', name: 'パムッカレ', lat: 37.9138, lng: 29.1187, mode: 'world', img: 'hagiaSophia', aliases: ['pamukkale', 'トルコ'] },
  { id: 'ephesus', name: 'エフェソス', lat: 37.9390, lng: 27.3410, mode: 'world', img: 'colosseum', aliases: ['ephesus', 'トルコ', '古代遺跡'] },
  { id: 'plitvice', name: 'プリトヴィツェ湖群国立公園', lat: 44.8654, lng: 15.5820, mode: 'world', img: 'amsterdamCanal', aliases: ['plitvice', 'クロアチア'] },
  { id: 'dubrovnik', name: 'ドゥブロヴニク', lat: 42.6507, lng: 18.0944, mode: 'world', img: 'colosseum', aliases: ['dubrovnik', 'クロアチア', '王の道'] },
  { id: 'santorini', name: 'サントリーニ島', lat: 36.3932, lng: 25.4615, mode: 'world', img: 'colosseum', aliases: ['santorini', 'ギリシャ', 'イア'] },
  { id: 'meteora', name: 'メテオラ', lat: 39.7217, lng: 21.6306, mode: 'world', img: 'colosseum', aliases: ['meteora', 'ギリシャ'] },
  { id: 'pompeii', name: 'ポンペイ', lat: 40.7489, lng: 14.4897, mode: 'world', img: 'colosseum', aliases: ['pompeii', 'イタリア', '遺跡'] },
  { id: 'florence-duomo', name: 'フィレンツェ大聖堂', lat: 43.7731, lng: 11.2560, mode: 'world', img: 'colosseum', aliases: ['florence', 'ドゥオモ', 'フィレンツェ'] },
  { id: 'venice', name: 'ヴェネツィア', lat: 45.4408, lng: 12.3155, mode: 'world', img: 'colosseum', aliases: ['venice', 'サン・マルコ', 'イタリア'] },
  { id: 'lake-bled', name: 'ブレッド湖', lat: 46.3636, lng: 14.0945, mode: 'world', img: 'amsterdamCanal', aliases: ['bled', 'スロベニア'] },
  { id: 'budapest-parliament', name: 'ハンガリー国会議事堂', lat: 47.5070, lng: 19.0456, mode: 'world', img: 'brandenburgGate', aliases: ['budapest', 'ブダペスト', 'ハンガリー'] },
  { id: 'schonbrunn', name: 'シェーンブルン宮殿', lat: 48.1858, lng: 16.3127, mode: 'world', img: 'brandenburgGate', aliases: ['schonbrunn', 'ウィーン', 'オーストリア'] },
  { id: 'nyhavn', name: 'ニューハウン', lat: 55.6799, lng: 12.5907, mode: 'world', img: 'amsterdamCanal', aliases: ['nyhavn', 'コペンハーゲン', 'デンマーク'] },
  { id: 'blue-lagoon', name: 'ブルーラグーン', lat: 63.8804, lng: -22.4495, mode: 'world', img: 'tableMountain', aliases: ['blue lagoon'] },
  { id: 'reine', name: 'レーヌ', lat: 67.9333, lng: 13.0833, mode: 'world', img: 'tableMountain', aliases: ['reine', 'ロフォーテン', 'ノルウェー'] },

  // ── 海外：アジア・中東 ──
  { id: 'angkor-wat', name: 'アンコールワット', lat: 13.4125, lng: 103.8670, mode: 'world', img: 'watArun', aliases: ['angkor wat', 'シェムリアップ', 'カンボジア'] },
  { id: 'bagan', name: 'バガン', lat: 21.1717, lng: 94.8585, mode: 'world', img: 'watArun', aliases: ['bagan', 'ミャンマー', '仏塔'] },
  { id: 'luang-prabang', name: 'ルアンパバーン', lat: 19.8860, lng: 102.1347, mode: 'world', img: 'watArun', aliases: ['luang prabang', 'ラオス'] },
  { id: 'ha-long-bay', name: 'ハロン湾', lat: 20.9101, lng: 107.1839, mode: 'world', img: 'watArun', aliases: ['ha long', 'ベトナム', '下龍湾'] },
  { id: 'hoi-an', name: 'ホイアン', lat: 15.8801, lng: 108.3380, mode: 'world', img: 'watArun', aliases: ['hoi an', 'ベトナム', '古い町'] },
  { id: 'taj-mahal', name: 'タージ・マハル', lat: 27.1751, lng: 78.0421, mode: 'world', img: 'gatewayOfIndia', aliases: ['taj mahal', 'インド', 'アーグラ'] },
  { id: 'jaipur', name: 'ジャイプール', lat: 26.9124, lng: 75.7873, mode: 'world', img: 'gatewayOfIndia', aliases: ['jaipur', 'ピンクシティ', 'インド'] },
  { id: 'varanasi', name: 'バラナシ', lat: 25.3176, lng: 82.9739, mode: 'world', img: 'gatewayOfIndia', aliases: ['varanasi', 'ガンジス', 'インド'] },
  { id: 'petra', name: 'ペトラ', lat: 30.3285, lng: 35.4444, mode: 'world', img: 'gizaPyramid', aliases: ['petra', 'ヨルダン', '遺跡'] },
  { id: 'wadi-rum', name: 'ワディ・ラム', lat: 29.5833, lng: 35.4167, mode: 'world', img: 'gizaPyramid', aliases: ['wadi rum', 'ヨルダン'] },
  { id: 'jeju-island', name: '済州島', lat: 33.3846, lng: 126.5534, mode: 'world', img: 'seoulTower', aliases: ['jeju', '韓国', '済州'] },
  { id: 'gyeongju', name: '慶州', lat: 35.8562, lng: 129.2247, mode: 'world', img: 'seoulTower', aliases: ['gyeongju', '仏国寺', '韓国'] },
  { id: 'busan-gamcheon', name: '甘川文化村', lat: 35.0975, lng: 129.0106, mode: 'world', img: 'seoulTower', aliases: ['gamcheon', '釜山', '韓国'] },
  { id: 'chiang-mai', name: 'チェンマイ', lat: 18.7883, lng: 98.9853, mode: 'world', img: 'watArun', aliases: ['chiang mai', 'タイ'] },
  { id: 'el-nido', name: 'エルニド', lat: 11.1953, lng: 119.4036, mode: 'world', img: 'bali', aliases: ['el nido', 'パラワン', 'フィリピン'] },
  { id: 'boracay', name: 'ボラカイ島', lat: 11.9674, lng: 121.9248, mode: 'world', img: 'bali', aliases: ['boracay', 'フィリピン'] },
  { id: 'penang', name: 'ペナン', lat: 5.4164, lng: 100.3327, mode: 'world', img: 'merlion', aliases: ['penang', 'ジョージタウン', 'マレーシア'] },
  { id: 'langkawi', name: 'ランカウイ', lat: 6.3500, lng: 99.8000, mode: 'world', img: 'merlion', aliases: ['langkawi', 'マレーシア'] },
  { id: 'phuket', name: 'プーケット', lat: 7.8804, lng: 98.3923, mode: 'world', img: 'bali', aliases: ['phuket', 'タイ'] },
  { id: 'chefchaouen', name: 'シェフシャウエン', lat: 35.1688, lng: -5.2636, mode: 'world', img: 'hagiaSophia', aliases: ['chefchaouen', 'モロッコ', '青い街'] },
  { id: 'marrakech', name: 'マラケシュ', lat: 31.6295, lng: -7.9811, mode: 'world', img: 'hagiaSophia', aliases: ['marrakech', 'モロッコ', 'ジャマ・エル・フナ'] },

  // ── 海外：南北アメリカ・オセアニア ──
  { id: 'machu-picchu', name: 'マチュピチュ', lat: -13.1631, lng: -72.5450, mode: 'world', img: 'christRedeemer', aliases: ['machu picchu', '遺跡'] },
  { id: 'iguazu-falls', name: 'イグアスの滝', lat: -25.6953, lng: -54.4367, mode: 'world', img: 'christRedeemer', aliases: ['iguazu', 'イグアス', '滝'] },
  { id: 'torres-del-paine', name: 'トーレス・デル・パイネ', lat: -50.9423, lng: -73.4068, mode: 'world', img: 'christRedeemer', aliases: ['torres del paine', 'チリ', 'パタゴニア'] },
  { id: 'uyuni', name: 'ウユニ塩湖', lat: -20.1338, lng: -67.4891, mode: 'world', img: 'christRedeemer', aliases: ['uyuni', 'ボリビア', '塩湖'] },
  { id: 'easter-island', name: 'イースター島', lat: -27.1127, lng: -109.3497, mode: 'world', img: 'christRedeemer', aliases: ['easter island', 'モアイ', 'ラパ・ヌイ'] },
  { id: 'grand-canyon', name: 'グランドキャニオン', lat: 36.1069, lng: -112.1129, mode: 'world', img: 'hollywoodSign', aliases: ['grand canyon', 'アメリカ', '峡谷'] },
  { id: 'yellowstone', name: 'イエローストーン', lat: 44.4280, lng: -110.5885, mode: 'world', img: 'hollywoodSign', aliases: ['yellowstone', 'アメリカ', '国立公園'] },
  { id: 'niagara-falls', name: 'ナイアガラの滝', lat: 43.0962, lng: -79.0377, mode: 'world', img: 'statueOfLiberty', aliases: ['niagara', '滝', 'カナダ'] },
  { id: 'banff', name: 'バンフ国立公園', lat: 51.4968, lng: -115.9281, mode: 'world', img: 'hollywoodSign', aliases: ['banff', 'カナダ', 'レイクルイーズ'] },
  { id: 'antelope-canyon', name: 'アンテロープキャニオン', lat: 36.8619, lng: -111.3743, mode: 'world', img: 'hollywoodSign', aliases: ['antelope canyon', 'アメリカ', '峡谷'] },
  { id: 'chichen-itza', name: 'チチェン・イッツァ', lat: 20.6843, lng: -88.5678, mode: 'world', img: 'hollywoodSign', aliases: ['chichen itza', 'メキシコ', 'マヤ'] },
  { id: 'quebec-old', name: 'ケベック旧市街', lat: 46.8139, lng: -71.2080, mode: 'world', img: 'statueOfLiberty', aliases: ['quebec', 'カナダ', '旧市街'] },
  { id: 'milford-sound', name: 'ミルフォード・サウンド', lat: -44.6167, lng: 167.8667, mode: 'world', img: 'sydneyOpera', aliases: ['milford sound', 'ニュージーランド', 'フィヨルド'] },
  { id: 'uluru', name: 'ウルル', lat: -25.3444, lng: 131.0369, mode: 'world', img: 'sydneyOpera', aliases: ['uluru', 'エアーズロック', 'オーストラリア'] },
  { id: 'great-barrier-reef', name: 'グレートバリアリーフ', lat: -18.2871, lng: 147.6992, mode: 'world', img: 'sydneyOpera', aliases: ['great barrier reef', 'オーストラリア', '珊瑚礁'] },
  { id: 'cartagena', name: 'カルタヘナ', lat: 10.3910, lng: -75.4794, mode: 'world', img: 'colosseum', aliases: ['cartagena', 'コロンビア', '旧市街'] },
  { id: 'galapagos', name: 'ガラパゴス諸島', lat: -0.9538, lng: -90.9656, mode: 'world', img: 'christRedeemer', aliases: ['galapagos', 'エクアドル'] },
  { id: 'atacama', name: 'アタカマ砂漠', lat: -24.5000, lng: -69.2500, mode: 'world', img: 'christRedeemer', aliases: ['atacama', 'チリ'] }
];

const DEFAULT_FOOD = 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&q=80';

/** カタログエントリを SPOTS 形式に展開 */
export function expandSpotEntries(entries, SPOT_IMAGES) {
  const fallback = SPOT_IMAGES.tokyoTower;
  const seen = new Set();

  return entries.filter((entry) => {
    if (seen.has(entry.id)) return false;
    seen.add(entry.id);
    return true;
  }).map((entry) => ({
    id: entry.id,
    name: entry.name,
    lat: entry.lat,
    lng: entry.lng,
    mode: entry.mode,
    aliases: entry.aliases || [],
    spotLabel: entry.label || entry.name,
    spotImage: SPOT_IMAGES[entry.img] || fallback,
    specialtyName: entry.food || 'ご当地グルメ',
    specialtyImage: DEFAULT_FOOD,
    description: entry.desc || `${entry.name}に到着！`
  }));
}

/** @deprecated expandSpotEntries を使用 */
export function expandMinorSpots(SPOT_IMAGES) {
  return expandSpotEntries(MINOR_SPOT_ENTRIES, SPOT_IMAGES);
}
