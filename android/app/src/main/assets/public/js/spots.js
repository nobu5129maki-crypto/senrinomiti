/**
 * 名所・観光スポットマスタ
 */

import { SPOT_IMAGES } from './image-urls.js';
import { expandSpotEntries, MINOR_SPOT_ENTRIES } from './spot-catalog.js';
import { FAMOUS_SPOT_ENTRIES } from './spot-famous-catalog.js';

const BASE_SPOTS = [
  {
    id: 'skytree',
    name: '東京スカイツリー',
    aliases: ['スカイツリー', '東京スカイツリ', 'skytree', 'sky tree'],
    lat: 35.7100627,
    lng: 139.8107004,
    mode: 'japan',
    spotLabel: '東京スカイツリー',
    spotImage: SPOT_IMAGES.tokyoSkytree,
    specialtyName: 'ソラマチのグルメ',
    specialtyImage: 'https://images.unsplash.com/photo-1563245372-28a3f4ccb4b5?w=600&q=80',
    description: '高さ634mの電波塔。東京の新しいシンボルに到達！'
  },
  {
    id: 'tokyo-tower',
    name: '東京タワー',
    aliases: ['東京タワ', 'tokyo tower'],
    lat: 35.6585805,
    lng: 139.7454329,
    mode: 'japan',
    spotLabel: '東京タワー',
    spotImage: SPOT_IMAGES.tokyoTower,
    specialtyName: 'タワー下のもんじゃ',
    specialtyImage: 'https://images.unsplash.com/photo-1585238342024-78d387f4a707?w=600&q=80',
    description: '赤と白のランドマーク・東京タワーに到着！'
  },
  {
    id: 'sensoji',
    name: '浅草寺',
    aliases: ['浅草', 'せんそうじ', '雷門'],
    lat: 35.7147653,
    lng: 139.7966553,
    mode: 'japan',
    spotLabel: '浅草寺・雷門',
    spotImage: SPOT_IMAGES.sensoji,
    specialtyName: '人形焼',
    specialtyImage: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=600&q=80',
    description: '雷門をくぐって浅草寺に到着！'
  },
  {
    id: 'meiji-jingu',
    name: '明治神宮',
    aliases: ['明治神社', '原宿'],
    lat: 35.6763976,
    lng: 139.6993259,
    mode: 'japan',
    spotLabel: '明治神宮の大鳥居',
    spotImage: SPOT_IMAGES.meijiJingu,
    specialtyName: '原宿クレープ',
    specialtyImage: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=600&q=80',
    description: '都心の森・明治神宮に到着！'
  },
  {
    id: 'fuji',
    name: '富士山',
    aliases: ['富士', 'mt fuji', 'mount fuji', '富士五湖', '五合目'],
    lat: 35.3606255,
    lng: 138.7274404,
    mode: 'japan',
    spotLabel: '富士山',
    spotImage: SPOT_IMAGES.fuji,
    specialtyName: '富士の水',
    specialtyImage: 'https://images.unsplash.com/photo-1556678189-8654bd754a69?w=600&q=80',
    description: '日本一の山・富士山に到着！'
  },
  {
    id: 'fushimi-inari',
    name: '伏見稲荷大社',
    aliases: ['伏見稲荷', '千本鳥居', '稲荷'],
    lat: 34.9671402,
    lng: 135.7726717,
    mode: 'japan',
    spotLabel: '伏見稲荷・千本鳥居',
    spotImage: SPOT_IMAGES.fushimiInari,
    specialtyName: '京都の和菓子',
    specialtyImage: 'https://images.unsplash.com/photo-1564890369478-c89ca6d9cde9?w=600&q=80',
    description: '千本鳥居を通過！伏見稲荷大社に到着！'
  },
  {
    id: 'tokyo-disneyland',
    name: '東京ディズニーランド',
    aliases: ['ディズニーランド', 'TDL', 'tdl', 'disneyland'],
    lat: 35.6328964,
    lng: 139.8803943,
    mode: 'japan',
    spotLabel: '東京ディズニーランド',
    spotImage: SPOT_IMAGES.tokyoDisneyland,
    specialtyName: 'チュロス',
    specialtyImage: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=600&q=80',
    description: '夢と魔法の王国・東京ディズニーランドに到着！'
  },
  {
    id: 'kinkakuji',
    name: '金閣寺',
    aliases: ['鹿苑寺', 'きんかくじ'],
    lat: 35.0393703,
    lng: 135.7292433,
    mode: 'japan',
    spotLabel: '金閣寺',
    spotImage: SPOT_IMAGES.kinkakuji,
    specialtyName: '抹茶パフェ',
    specialtyImage: 'https://images.unsplash.com/photo-1564890369478-c89ca6d9cde9?w=600&q=80',
    description: '黄金に輝く金閣寺に到着！'
  },
  {
    id: 'ginkakuji',
    name: '銀閣寺',
    aliases: ['慈照寺', 'ぎんかくじ', '東山慈照寺'],
    lat: 35.027021,
    lng: 135.798205,
    mode: 'japan',
    spotLabel: '銀閣寺',
    spotImage: SPOT_IMAGES.ginkakuji,
    specialtyName: '抹茶スイーツ',
    specialtyImage: 'https://images.unsplash.com/photo-1564890369478-c89ca6d9cde9?w=600&q=80',
    description: '東山の銀閣寺に到着！庭園と銀沙灘が広がります。'
  },
  {
    id: 'dotonbori',
    name: '道頓堀',
    aliases: ['道頓堜', 'どうとんぼり', 'グリコサイン', '心斎橋', 'なんば'],
    lat: 34.6686474,
    lng: 135.5013076,
    mode: 'japan',
    spotLabel: '道頓堀',
    spotImage: SPOT_IMAGES.dotonbori,
    specialtyName: 'たこ焼き',
    specialtyImage: 'https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?w=600&q=80',
    description: 'グリコサインの前・道頓堀に到着！'
  },
  {
    id: 'itsukushima',
    name: '厳島神社',
    aliases: ['宮島', '大鳥居', 'いつくしま'],
    lat: 34.2959896,
    lng: 132.3198381,
    mode: 'japan',
    spotLabel: '厳島神社の大鳥居',
    spotImage: SPOT_IMAGES.itsukushima,
    specialtyName: 'もみじ饅頭',
    specialtyImage: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=600&q=80',
    description: '海に浮かぶ大鳥居・厳島神社に到着！'
  },
  {
    id: 'kenrokuen',
    name: '兼六園',
    aliases: ['金沢兼六園', 'けんろくえん'],
    lat: 36.5620127,
    lng: 136.6626855,
    mode: 'japan',
    spotLabel: '兼六園',
    spotImage: SPOT_IMAGES.kenrokuen,
    specialtyName: '金沢の加賀料理',
    specialtyImage: 'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=600&q=80',
    description: '日本三名園・兼六園に到着！'
  },
  {
    id: 'sendai-castle',
    name: '仙台城',
    aliases: ['仙台', '青葉城', 'せんだい', '仙台市', 'sendai'],
    lat: 38.2656,
    lng: 140.8556,
    mode: 'japan',
    spotLabel: '仙台城（青葉城）',
    spotImage: SPOT_IMAGES.zuihoden,
    specialtyName: '牛タン',
    specialtyImage: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=600&q=80',
    description: '伊達政宗公ゆかりの仙台・青葉城下に到着！'
  },
  {
    id: 'akita-kubota',
    name: '秋田',
    aliases: ['久保田城', '秋田市', 'あきた', '千秋公園', 'akita'],
    lat: 39.7233,
    lng: 140.1231,
    mode: 'japan',
    spotLabel: '秋田・久保田城',
    spotImage: SPOT_IMAGES.akitaKubota,
    specialtyName: 'きりたんぽ',
    specialtyImage: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&q=80',
    description: '秋田・久保田城（千秋公園）に到着！'
  },
  {
    id: 'aomori-nebuta',
    name: '青森',
    aliases: ['青森ねぶた', '青森市', 'ねぶた', 'あおもり', 'aomori'],
    lat: 40.8244,
    lng: 140.7400,
    mode: 'japan',
    spotLabel: '青森・ねぶた',
    spotImage: SPOT_IMAGES.aomoriNebuta,
    specialtyName: 'りんご',
    specialtyImage: 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=600&q=80',
    description: '青森・ねぶたの街に到着！'
  },
  {
    id: 'matsushima',
    name: '松島',
    aliases: ['松島湾', 'まつしま', '日本三景松島'],
    lat: 38.3700,
    lng: 141.0600,
    mode: 'japan',
    spotLabel: '松島',
    spotImage: SPOT_IMAGES.matsushima,
    specialtyName: '笹かまぼこ',
    specialtyImage: 'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=600&q=80',
    description: '日本三景・松島に到着！'
  },
  {
    id: 'nikko-toshogu',
    name: '日光東照宮',
    aliases: ['東照宮', '日光', 'にっこうとうしょうぐう', 'nikko toshogu', 'toshogu'],
    lat: 36.7572,
    lng: 139.5988,
    mode: 'japan',
    spotLabel: '日光東照宮',
    spotImage: SPOT_IMAGES.nikkoToshogu,
    specialtyName: 'ゆば',
    specialtyImage: 'https://images.unsplash.com/photo-1564890369478-c89ca6d9cde9?w=600&q=80',
    description: '世界遺産・日光東照宮に到着！'
  },
  {
    id: 'himeji-castle',
    name: '姫路城',
    aliases: ['姫路', '白鷺城', 'ひめじじょう', 'himeji castle'],
    lat: 34.8394,
    lng: 134.6939,
    mode: 'japan',
    spotLabel: '姫路城',
    spotImage: SPOT_IMAGES.himejiCastle,
    specialtyName: '姫路おでん',
    specialtyImage: 'https://images.unsplash.com/photo-1585238342024-78d387f4a707?w=600&q=80',
    description: '白鷺城・姫路城に到着！'
  },
  {
    id: 'todaiji',
    name: '東大寺',
    aliases: ['奈良大仏', '大仏殿', 'とうだいじ'],
    lat: 34.6889,
    lng: 135.8399,
    mode: 'japan',
    spotLabel: '東大寺・大仏殿',
    spotImage: SPOT_IMAGES.todaiji,
    specialtyName: '柿の葉寿司',
    specialtyImage: 'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=600&q=80',
    description: '奈良の大仏・東大寺に到着！'
  },
  {
    id: 'kiyomizudera',
    name: '清水寺',
    aliases: ['きよみずでら', 'kiyomizu', 'Kiyomizu-dera', 'kiyomizu-dera', '清水の舞台'],
    lat: 34.9949,
    lng: 135.7850,
    mode: 'japan',
    spotLabel: '清水寺',
    spotImage: SPOT_IMAGES.kiyomizudera,
    specialtyName: '京都の和菓子',
    specialtyImage: 'https://images.unsplash.com/photo-1564890369478-c89ca6d9cde9?w=600&q=80',
    description: '清水の舞台・清水寺に到着！'
  },
  {
    id: 'arashiyama',
    name: '嵐山',
    aliases: ['渡月橋', 'あらしやま', '竹林の道'],
    lat: 35.0094,
    lng: 135.6772,
    mode: 'japan',
    spotLabel: '嵐山・渡月橋',
    spotImage: SPOT_IMAGES.arashiyama,
    specialtyName: '湯豆腐',
    specialtyImage: 'https://images.unsplash.com/photo-1564890369478-c89ca6d9cde9?w=600&q=80',
    description: '風景名勝・嵐山に到着！'
  },
  {
    id: 'shirakawago',
    name: '白川郷',
    aliases: ['白川郷合掌造り', 'しらかわごう', 'shirakawa-go'],
    lat: 36.2578,
    lng: 136.9060,
    mode: 'japan',
    spotLabel: '白川郷合掌造り集落',
    spotImage: SPOT_IMAGES.shirakawago,
    specialtyName: '朴葉味噌',
    specialtyImage: 'https://images.unsplash.com/photo-1585238342024-78d387f4a707?w=600&q=80',
    description: '世界遺産・白川郷に到着！'
  },
  {
    id: 'koyasan',
    name: '高野山',
    aliases: ['金剛峰寺', 'こうやさん', 'koyasan'],
    lat: 34.2131,
    lng: 135.5808,
    mode: 'japan',
    spotLabel: '高野山',
    spotImage: SPOT_IMAGES.koyasan,
    specialtyName: '精進料理',
    specialtyImage: 'https://images.unsplash.com/photo-1564890369478-c89ca6d9cde9?w=600&q=80',
    description: '聖地・高野山に到着！'
  },
  {
    id: 'kamakura-daibutsu',
    name: '鎌倉大仏',
    aliases: ['高德院', '鎌倉', 'かまくらだいぶつ'],
    lat: 35.3167,
    lng: 139.5357,
    mode: 'japan',
    spotLabel: '鎌倉大仏',
    spotImage: SPOT_IMAGES.kamakuraDaibutsu,
    specialtyName: 'しらす丼',
    specialtyImage: 'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=600&q=80',
    description: '鎌倉大仏の前に到着！'
  },
  {
    id: 'nagoya-castle',
    name: '名古屋城',
    aliases: ['名古屋', 'なごやじょう', 'nagoya castle'],
    lat: 35.1853,
    lng: 136.8996,
    mode: 'japan',
    spotLabel: '名古屋城',
    spotImage: SPOT_IMAGES.nagoyaCastle,
    specialtyName: '味噌カツ',
    specialtyImage: 'https://images.unsplash.com/photo-1585238342024-78d387f4a707?w=600&q=80',
    description: '金のシャチホコ・名古屋城に到着！'
  },
  {
    id: 'osaka-castle',
    name: '大阪城',
    aliases: ['大阪城公園', 'おおさかじょう', 'osaka castle'],
    lat: 34.6873,
    lng: 135.5262,
    mode: 'japan',
    spotLabel: '大阪城',
    spotImage: SPOT_IMAGES.osakaCastle,
    specialtyName: 'たこ焼き',
    specialtyImage: 'https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?w=600&q=80',
    description: '大阪城に到着！'
  },
  {
    id: 'hiroshima-dome',
    name: '原爆ドーム',
    aliases: ['平和記念公園', '広島平和記念公園', 'genbaku dome'],
    lat: 34.3955,
    lng: 132.4536,
    mode: 'japan',
    spotLabel: '原爆ドーム',
    spotImage: SPOT_IMAGES.hiroshimaDome,
    specialtyName: 'お好み焼き',
    specialtyImage: 'https://images.unsplash.com/photo-1585238342024-78d387f4a707?w=600&q=80',
    description: '平和記念公園・原爆ドームに到着！'
  },
  {
    id: 'matsushima',
    name: '松島',
    aliases: ['松島湾', 'まつしま', 'matsushima'],
    lat: 38.3700,
    lng: 141.0600,
    mode: 'japan',
    spotLabel: '松島',
    spotImage: SPOT_IMAGES.matsushima,
    specialtyName: '牡蠣料理',
    specialtyImage: 'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=600&q=80',
    description: '日本三景・松島に到着！'
  },
  {
    id: 'nara-deer',
    name: '奈良公園',
    aliases: ['奈良', 'ならこうえん', 'nara park'],
    lat: 34.6851,
    lng: 135.8430,
    mode: 'japan',
    spotLabel: '奈良公園と鹿',
    spotImage: SPOT_IMAGES.naraDeer,
    specialtyName: '柿の葉寿司',
    specialtyImage: 'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=600&q=80',
    description: '鹿とともに奈良公園に到着！'
  },
  {
    id: 'sapporo-clock',
    name: '札幌時計台',
    aliases: ['札幌', 'さっぽろ', 'sapporo clock tower'],
    lat: 43.0629,
    lng: 141.3534,
    mode: 'japan',
    spotLabel: '札幌時計台',
    spotImage: SPOT_IMAGES.sapporoClock,
    specialtyName: 'ジンギスカン',
    specialtyImage: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=600&q=80',
    description: '札幌時計台に到着！'
  },
  {
    id: 'kobe-port',
    name: '神戸ポートタワー',
    aliases: ['神戸', 'ポートタワー', 'こうべ'],
    lat: 34.6827,
    lng: 135.1868,
    mode: 'japan',
    spotLabel: '神戸ポートタワー',
    spotImage: SPOT_IMAGES.kobePort,
    specialtyName: '神戸牛',
    specialtyImage: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=600&q=80',
    description: '神戸ポートタワーに到着！'
  },
  {
    id: 'yokohama-minatomirai',
    name: 'みなとみらい21',
    aliases: ['横浜みなとみらい', 'みなとみらい', '横浜', 'minato mirai'],
    lat: 35.4564,
    lng: 139.6345,
    mode: 'japan',
    spotLabel: 'みなとみらい21',
    spotImage: SPOT_IMAGES.yokohamaMinatoMirai,
    specialtyName: 'シウマイ',
    specialtyImage: 'https://images.unsplash.com/photo-1563245372-28a3f4ccb4b5?w=600&q=80',
    description: '横浜・みなとみらい21に到着！'
  },
  {
    id: 'izumo-taisha',
    name: '出雲大社',
    aliases: ['出雲', 'いずもたいしゃ', 'izumo taisha'],
    lat: 35.4020,
    lng: 132.6854,
    mode: 'japan',
    spotLabel: '出雲大社',
    spotImage: SPOT_IMAGES.izumoTaisha,
    specialtyName: '出雲そば',
    specialtyImage: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=600&q=80',
    description: '縁結びの社・出雲大社に到着！'
  },
  {
    id: 'kumamoto-castle',
    name: '熊本城',
    aliases: ['熊本', 'くまもとじょう', 'kumamoto castle'],
    lat: 32.8062,
    lng: 130.7059,
    mode: 'japan',
    spotLabel: '熊本城',
    spotImage: SPOT_IMAGES.kumamotoCastle,
    specialtyName: '馬刺し',
    specialtyImage: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=600&q=80',
    description: '熊本城に到着！'
  },
  {
    id: 'shurijo',
    name: '首里城',
    aliases: ['那覇', 'しゅりじょう', 'shuri castle', '沖縄'],
    lat: 26.2170,
    lng: 127.7195,
    mode: 'japan',
    spotLabel: '首里城',
    spotImage: SPOT_IMAGES.shurijo,
    specialtyName: 'ソーキそば',
    specialtyImage: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=600&q=80',
    description: '琉球の王城・首里城に到着！'
  },
  {
    id: 'churaumi',
    name: '美ら海水族館',
    aliases: ['沖縄美ら海', 'ちゅらうみ', 'churaumi aquarium'],
    lat: 26.6944,
    lng: 127.8778,
    mode: 'japan',
    spotLabel: '沖縄美ら海水族館',
    spotImage: SPOT_IMAGES.churaumi,
    specialtyName: 'タコライス',
    specialtyImage: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=600&q=80',
    description: '沖縄美ら海水族館に到着！'
  },
  {
    id: 'amanohashidate',
    name: '天橋立',
    aliases: ['あまのはしだて', 'amanohashidate', '日本三景'],
    lat: 35.5647,
    lng: 135.1878,
    mode: 'japan',
    spotLabel: '天橋立',
    spotImage: SPOT_IMAGES.amanohashidate,
    specialtyName: '松葉ガニ',
    specialtyImage: 'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=600&q=80',
    description: '日本三景・天橋立に到着！'
  },
  {
    id: 'kawaguchiko',
    name: '河口湖',
    aliases: ['富士五湖', 'かわぐちこ', 'lake kawaguchi'],
    lat: 35.5178,
    lng: 138.7622,
    mode: 'japan',
    spotLabel: '河口湖と富士山',
    spotImage: SPOT_IMAGES.kawaguchiko,
    specialtyName: 'ほうとう',
    specialtyImage: 'https://images.unsplash.com/photo-1518568814500-bf0f8d125f46?w=600&q=80',
    description: '富士山を望む河口湖に到着！'
  },
  {
    id: 'enoshima',
    name: '江の島',
    aliases: ['えのしま', 'enoshima'],
    lat: 35.2998,
    lng: 139.4803,
    mode: 'japan',
    spotLabel: '江の島',
    spotImage: SPOT_IMAGES.enoshima,
    specialtyName: 'しらす丼',
    specialtyImage: 'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=600&q=80',
    description: '湘南のシンボル・江の島に到着！'
  },
  {
    id: 'tsutenkaku',
    name: '通天閣',
    aliases: ['新世界', 'つうてんかく', 'tsutenkaku'],
    lat: 34.6525,
    lng: 135.5063,
    mode: 'japan',
    spotLabel: '通天閣',
    spotImage: SPOT_IMAGES.dotonbori,
    specialtyName: '串カツ',
    specialtyImage: 'https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?w=600&q=80',
    description: '大阪・通天閣に到着！'
  },
  {
    id: 'eiffel-tower',
    name: 'エッフェル塔',
    aliases: ['エッフェル', 'eiffel tower', 'パリ'],
    lat: 48.8584,
    lng: 2.2945,
    mode: 'world',
    spotLabel: 'エッフェル塔',
    spotImage: SPOT_IMAGES.eiffelTower,
    specialtyName: 'クロワッサン',
    specialtyImage: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=600&q=80',
    description: 'パリのシンボル・エッフェル塔に到着！'
  },
  {
    id: 'statue-of-liberty',
    name: '自由の女神',
    aliases: ['自由女神', 'statue of liberty', 'ニューヨーク'],
    lat: 40.6892,
    lng: -74.0445,
    mode: 'world',
    spotLabel: '自由の女神',
    spotImage: SPOT_IMAGES.statueOfLiberty,
    specialtyName: 'ニューヨークピザ',
    specialtyImage: 'https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?w=600&q=80',
    description: '自由の女神の前に到着！'
  },
  {
    id: 'great-wall',
    name: '万里の長城',
    aliases: ['長城', 'great wall'],
    lat: 40.4319,
    lng: 116.5704,
    mode: 'world',
    spotLabel: '万里の長城',
    spotImage: SPOT_IMAGES.greatWall,
    specialtyName: '北京ダック',
    specialtyImage: 'https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?w=600&q=80',
    description: '万里の長城に到着！'
  },
  {
    id: 'sydney-opera',
    name: 'シドニー・オペラハウス',
    aliases: ['オペラハウス', 'sydney opera'],
    lat: -33.8568,
    lng: 151.2153,
    mode: 'world',
    spotLabel: 'シドニー・オペラハウス',
    spotImage: SPOT_IMAGES.sydneyOpera,
    specialtyName: 'ラム肉',
    specialtyImage: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=600&q=80',
    description: 'シドニー・オペラハウスに到着！'
  },
  {
    id: 'guam',
    name: 'グアム',
    aliases: ['guam', 'グアム島', 'タモン'],
    lat: 13.5178,
    lng: 144.8391,
    mode: 'world',
    spotLabel: 'タモンビーチ',
    spotImage: SPOT_IMAGES.guam,
    specialtyName: 'ケラガンヘンムン（レッドライス）',
    specialtyImage: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&q=80',
    description: '太平洋の楽園・グアムに到着！'
  },
  {
    id: 'colosseum',
    name: 'コロッセオ',
    aliases: ['コロセオ', 'colosseum', 'ローマ'],
    lat: 41.8902,
    lng: 12.4922,
    mode: 'world',
    spotLabel: 'コロッセオ',
    spotImage: SPOT_IMAGES.colosseum,
    specialtyName: 'カルボナーラ',
    specialtyImage: 'https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?w=600&q=80',
    description: '古代ローマのコロッセオに到着！'
  },
  {
    id: 'big-ben',
    name: 'ビッグベン',
    aliases: ['ウェストミンスター', 'big ben', 'ロンドン'],
    lat: 51.5007,
    lng: -0.1246,
    mode: 'world',
    spotLabel: 'ビッグベン',
    spotImage: SPOT_IMAGES.palaceOfWestminster,
    specialtyName: 'フィッシュアンドチップス',
    specialtyImage: 'https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?w=600&q=80',
    description: 'ロンドン・ビッグベンに到着！'
  },
  {
    id: 'brandenburg-gate',
    name: 'ブランデンブルク門',
    aliases: ['ベルリン', 'brandenburg gate'],
    lat: 52.5163,
    lng: 13.3777,
    mode: 'world',
    spotLabel: 'ブランデンブルク門',
    spotImage: SPOT_IMAGES.brandenburgGate,
    specialtyName: 'ソーセージ',
    specialtyImage: 'https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?w=600&q=80',
    description: 'ベルリン・ブランデンブルク門に到着！'
  },
  {
    id: 'merlion',
    name: 'マーライオン',
    aliases: ['シンガポール', 'merlion'],
    lat: 1.2868,
    lng: 103.8545,
    mode: 'world',
    spotLabel: 'マーライオン',
    spotImage: SPOT_IMAGES.merlion,
    specialtyName: 'チキンライス',
    specialtyImage: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&q=80',
    description: 'シンガポール・マーライオンに到着！'
  },
  {
    id: 'wat-arun',
    name: 'ワット・アルン',
    aliases: ['暁の寺', 'バンコク', 'wat arun'],
    lat: 13.7437,
    lng: 100.4888,
    mode: 'world',
    spotLabel: 'ワット・アルン',
    spotImage: SPOT_IMAGES.watArun,
    specialtyName: 'トムヤムクン',
    specialtyImage: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&q=80',
    description: 'バンコク・ワット・アルンに到着！'
  },
  {
    id: 'gateway-of-india',
    name: 'インド門',
    aliases: ['gateway of india', 'ムンバイ'],
    lat: 18.9220,
    lng: 72.8347,
    mode: 'world',
    spotLabel: 'インド門',
    spotImage: SPOT_IMAGES.gatewayOfIndia,
    specialtyName: 'カレー',
    specialtyImage: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&q=80',
    description: 'ムンバイ・インド門に到着！'
  },
  {
    id: 'hagia-sophia',
    name: 'アヤソフィア',
    aliases: ['ハギア・ソフィア', 'イスタンブール', 'hagia sophia'],
    lat: 41.0086,
    lng: 28.9802,
    mode: 'world',
    spotLabel: 'アヤソフィア',
    spotImage: SPOT_IMAGES.hagiaSophia,
    specialtyName: 'ケバブ',
    specialtyImage: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&q=80',
    description: 'イスタンブール・アヤソフィアに到着！'
  },
  {
    id: 'sagrada-familia',
    name: 'サグラダ・ファミリア',
    aliases: ['sagrada familia', 'バルセロナ'],
    lat: 41.4036,
    lng: 2.1744,
    mode: 'world',
    spotLabel: 'サグラダ・ファミリア',
    spotImage: SPOT_IMAGES.sagradaFamilia,
    specialtyName: 'パエリア',
    specialtyImage: 'https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?w=600&q=80',
    description: 'バルセロナ・サグラダ・ファミリアに到着！'
  },
  {
    id: 'hollywood-sign',
    name: 'ハリウッドサイン',
    aliases: ['ハリウッド', 'hollywood sign', 'ロサンゼルス'],
    lat: 34.1341,
    lng: -118.3215,
    mode: 'world',
    spotLabel: 'ハリウッドサイン',
    spotImage: SPOT_IMAGES.hollywoodSign,
    specialtyName: 'ハンバーガー',
    specialtyImage: 'https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?w=600&q=80',
    description: 'ハリウッドサインに到着！'
  },
  {
    id: 'golden-gate',
    name: 'ゴールデンゲートブリッジ',
    aliases: ['ゴールデンゲート', 'golden gate', 'サンフランシスコ'],
    lat: 37.8199,
    lng: -122.4783,
    mode: 'world',
    spotLabel: 'ゴールデンゲートブリッジ',
    spotImage: SPOT_IMAGES.goldenGate,
    specialtyName: 'クラムチャウダー',
    specialtyImage: 'https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?w=600&q=80',
    description: 'ゴールデンゲートブリッジに到着！'
  },
  {
    id: 'giza-pyramid',
    name: 'ギザのピラミッド',
    aliases: ['ピラミッド', 'giza', 'カイロ'],
    lat: 29.9792,
    lng: 31.1342,
    mode: 'world',
    spotLabel: 'ギザのピラミッド',
    spotImage: SPOT_IMAGES.gizaPyramid,
    specialtyName: 'クシャリ',
    specialtyImage: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&q=80',
    description: 'ギザのピラミッドに到着！'
  },
  {
    id: 'seoul-tower',
    name: 'Nソウルタワー',
    aliases: ['ソウルタワー', '南山タワー', 'seoul tower', 'ソウル'],
    lat: 37.5512,
    lng: 126.9882,
    mode: 'world',
    spotLabel: 'Nソウルタワー',
    spotImage: SPOT_IMAGES.seoulTower,
    specialtyName: '韓国料理',
    specialtyImage: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&q=80',
    description: 'Nソウルタワーに到着！'
  },
  {
    id: 'shanghai-bund',
    name: '上海外滩',
    aliases: ['外滩', '上海', 'shanghai bund'],
    lat: 31.2397,
    lng: 121.4900,
    mode: 'world',
    spotLabel: '上海外滩',
    spotImage: SPOT_IMAGES.shanghaiBund,
    specialtyName: '小籠包',
    specialtyImage: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&q=80',
    description: '上海外滩に到着！'
  },
  {
    id: 'hong-kong',
    name: '香港',
    aliases: ['ビクトリアピーク', 'hong kong', '香港島'],
    lat: 22.2783,
    lng: 114.1747,
    mode: 'world',
    spotLabel: '香港のスカイライン',
    spotImage: SPOT_IMAGES.hongKongSkyline,
    specialtyName: '飲茶',
    specialtyImage: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&q=80',
    description: '香港に到着！'
  },
  {
    id: 'burj-khalifa',
    name: 'ブルジュ・ハリファ',
    aliases: ['ドバイ', 'burj khalifa'],
    lat: 25.1972,
    lng: 55.2744,
    mode: 'world',
    spotLabel: 'ブルジュ・ハリファ',
    spotImage: SPOT_IMAGES.burjKhalifa,
    specialtyName: '中東料理',
    specialtyImage: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&q=80',
    description: 'ブルジュ・ハリファに到着！'
  },
  {
    id: 'saint-basils',
    name: 'サン・バシリオ大聖堂',
    aliases: ['聖ワシリイ大聖堂', 'モスクワ', 'saint basils'],
    lat: 55.7525,
    lng: 37.6231,
    mode: 'world',
    spotLabel: 'サン・バシリオ大聖堂',
    spotImage: SPOT_IMAGES.saintBasils,
    specialtyName: 'ボルシチ',
    specialtyImage: 'https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?w=600&q=80',
    description: 'モスクワ・赤の広場に到着！'
  },
  {
    id: 'amsterdam-canal',
    name: 'アムステルダム',
    aliases: ['amsterdam'],
    lat: 52.3676,
    lng: 4.9041,
    mode: 'world',
    spotLabel: 'アムステルダムの運河',
    spotImage: SPOT_IMAGES.amsterdamCanal,
    specialtyName: 'ストロープワッフル',
    specialtyImage: 'https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?w=600&q=80',
    description: 'アムステルダムに到着！'
  },
  {
    id: 'table-mountain',
    name: 'テーブルマウンテン',
    aliases: ['ケープタウン', 'table mountain'],
    lat: -33.9628,
    lng: 18.4098,
    mode: 'world',
    spotLabel: 'テーブルマウンテン',
    spotImage: SPOT_IMAGES.tableMountain,
    specialtyName: 'ボーホール',
    specialtyImage: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&q=80',
    description: 'ケープタウン・テーブルマウンテンに到着！'
  },
  {
    id: 'christ-redeemer',
    name: 'コルコバードのキリスト像',
    aliases: ['コルコバード', 'christ the redeemer', 'リオ'],
    lat: -22.9519,
    lng: -43.2105,
    mode: 'world',
    spotLabel: 'コルコバードのキリスト像',
    spotImage: SPOT_IMAGES.christRedeemer,
    specialtyName: 'シュラスコ',
    specialtyImage: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=600&q=80',
    description: 'リオデジャネイロ・コルコバードに到着！'
  },
  {
    id: 'waikiki',
    name: 'ワイキキビーチ',
    aliases: ['ワイキキ', 'waikiki', 'ホノルル', 'ハワイ'],
    lat: 21.2767,
    lng: -157.8275,
    mode: 'world',
    spotLabel: 'ワイキキビーチ',
    spotImage: SPOT_IMAGES.waikiki,
    specialtyName: 'ポキ',
    specialtyImage: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&q=80',
    description: 'ワイキキビーチに到着！'
  },
  {
    id: 'taipei101',
    name: '台北101',
    aliases: ['台北', 'taipei 101', 'タイペイ'],
    lat: 25.0330,
    lng: 121.5654,
    mode: 'world',
    spotLabel: '台北101',
    spotImage: SPOT_IMAGES.taipei101,
    specialtyName: '小籠包',
    specialtyImage: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&q=80',
    description: '台北101に到着！'
  },
  {
    id: 'manila-bay',
    name: 'マニラ湾',
    aliases: ['マニラ', 'manila bay', 'フィリピン'],
    lat: 14.5605,
    lng: 120.9739,
    mode: 'world',
    spotLabel: 'マニラ湾',
    spotImage: SPOT_IMAGES.manilaBay,
    specialtyName: 'アドボ',
    specialtyImage: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&q=80',
    description: 'マニラ湾に到着！'
  },
  {
    id: 'bali',
    name: 'バリ島',
    aliases: ['バリ', 'bali', 'ウルワトゥ'],
    lat: -8.8291,
    lng: 115.0849,
    mode: 'world',
    spotLabel: 'ウルワトゥ寺院',
    spotImage: SPOT_IMAGES.bali,
    specialtyName: 'ナシゴレン',
    specialtyImage: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&q=80',
    description: 'バリ島に到着！'
  }
];

function dedupeSpots(spots) {
  const seen = new Set();
  return spots.filter((s) => {
    if (seen.has(s.id)) return false;
    seen.add(s.id);
    return true;
  });
}

export const SPOTS = dedupeSpots([
  ...BASE_SPOTS,
  ...expandSpotEntries(FAMOUS_SPOT_ENTRIES, SPOT_IMAGES),
  ...expandSpotEntries(MINOR_SPOT_ENTRIES, SPOT_IMAGES)
]);

function normalize(text) {
  return text.trim().toLowerCase()
    .replace(/\s+/g, '')
    .replace(/[・\-－—ー]/g, '');
}

/** 検索・照合用に地名を整形 */
export function cleanSpotName(name) {
  return String(name ?? '')
    .replace(/（名所）/g, '')
    .replace(/（観光）/g, '')
    .replace(/（住所）/g, '')
    .split(/[,、]/)[0]
    .trim();
}

/** 名所名称・別名とクエリが対応するか */
export function spotNameMatches(spot, name) {
  if (!spot || !name) return false;
  const q = normalize(cleanSpotName(name));
  if (!q) return false;
  const spotName = normalize(spot.name);
  const label = normalize(spot.spotLabel || '');
  if (spotName === q || label === q) return true;
  if (spot.aliases?.some((a) => normalize(a) === q)) return true;
  // 「仙台城（青葉城）」のような表示名
  if (label && (label.includes(q) || q.includes(spotName))) return true;
  if (q.includes(spotName) || spotName.includes(q)) {
    // 短すぎる部分一致は別地名の誤認を招く（例: 「田」）
    return Math.min(q.length, spotName.length) >= 2
      && overlapRatio(q, spotName) >= 0.5;
  }
  return false;
}

/** 名所マスタから解決（名称と矛盾する spotId は捨てる） */
export function resolveRegisteredSpot(spotId, name) {
  const byName = name ? findExactSpotByName(name) : null;
  if (spotId) {
    const byId = getSpotById(spotId);
    if (byId) {
      // 直前の目的地の spotId が残ったまま地名だけ変わったケースを防ぐ
      if (byName && byName.id !== byId.id) return byName;
      if (name && !spotNameMatches(byId, name)) return byName;
      return byId;
    }
  }
  return byName;
}

/** 画像 URL が別の名所マスタのものと一致するか */
export function findSpotByImageUrl(url) {
  if (!url || typeof url !== 'string') return null;
  const exact = SPOTS.find((s) => s.spotImage === url);
  if (exact) return exact;
  const file = url.split('/').pop()?.replace(/^\d+px-/, '') || '';
  if (!file || file.length < 8) return null;
  return SPOTS.find((s) => {
    const other = s.spotImage?.split('/').pop()?.replace(/^\d+px-/, '') || '';
    return other && other === file;
  }) || null;
}

const GENERIC_ALIAS_TERMS = new Set([
  '砂漠', '運河', '川', '山', '島', '海', '湾', '湖', '寺', '城', '神社', '温泉', '駅', '公園'
]);

function isGenericAliasTerm(term) {
  return GENERIC_ALIAS_TERMS.has(normalize(term));
}

function overlapRatio(a, b) {
  const shorter = a.length <= b.length ? a : b;
  const longer = a.length > b.length ? a : b;
  return shorter.length / longer.length;
}

function spotMatchesMode(spot, mode) {
  return mode !== 'japan' || spot.mode === 'japan';
}

function isDisallowedExactAlias(alias, spot) {
  if (isGenericAliasTerm(alias)) return true;
  const na = normalize(alias);
  const name = normalize(spot.name);
  // 別名が正式名称と無関係なら国名・広域名タグとみなし、完全一致を禁止
  return name !== na && !name.includes(na) && !na.includes(name);
}

/** 名称・別名の完全一致で名所を解決 */
export function findExactSpotByName(name) {
  const q = cleanSpotName(name);
  if (!q) return null;
  const nq = normalize(q);
  return SPOTS.find((s) => {
    if (normalize(s.name) === nq) return true;
    return s.aliases.some((a) => normalize(a) === nq && !isDisallowedExactAlias(a, s));
  }) || null;
}

/** ルート設定時に名所マスタへ自動解決（曖昧な別名・部分一致は使わない） */
export function findResolvableSpot(query, mode = 'japan') {
  const q = query.trim();
  if (q.length < 2) return null;

  const exact = findExactSpotByName(q);
  if (exact && spotMatchesMode(exact, mode)) return exact;

  let best = null;
  let bestScore = 0;
  for (const spot of SPOTS) {
    if (!spotMatchesMode(spot, mode)) continue;
    const score = scoreSpotForResolve(spot, q);
    if (score >= RESOLVE_SPOT_MIN_SCORE && score > bestScore) {
      best = spot;
      bestScore = score;
    }
  }
  return best;
}

/** 正式名称・別名の一致、または正式名称との十分な前方一致 */
function scoreSpotForResolve(spot, query) {
  const q = normalize(query);
  if (!q || q.length < 2) return 0;

  const name = normalize(spot.name);
  if (name === q) return 100;
  if (spot.aliases.some((a) => normalize(a) === q && !isDisallowedExactAlias(a, spot))) return 95;
  if (name.startsWith(q) || q.startsWith(name)) {
    if (name === q) return 85;
    if (q.startsWith(name) && overlapRatio(name, q) >= 0.6) return 85;
    if (name.startsWith(q) && overlapRatio(name, q) >= 0.85) return 85;
  }
  return 0;
}

/** 候補一覧向け（自動解決より緩いが、短い汎用別名は除外） */
function scoreSpotForSuggest(spot, query) {
  const resolveScore = scoreSpotForResolve(spot, query);
  if (resolveScore) return resolveScore;

  const q = normalize(query);
  if (!q || q.length < 2) return 0;

  const name = normalize(spot.name);
  let best = 0;

  if (name.includes(q) && q.length >= 4 && overlapRatio(name, q) >= 0.75) {
    best = Math.max(best, 70);
  }
  if (q.includes(name) && name.length >= 4 && overlapRatio(name, q) >= 0.75) {
    best = Math.max(best, 65);
  }

  for (const alias of spot.aliases) {
    const na = normalize(alias);
    if (isGenericAliasTerm(na) || na.length < 3) continue;
    if (na.startsWith(q) || q.startsWith(na)) {
      if (overlapRatio(na, q) >= 0.65) best = Math.max(best, 80);
    }
    if ((na.includes(q) || q.includes(na)) && na.length >= 4 && overlapRatio(na, q) >= 0.65) {
      best = Math.max(best, 55);
    }
  }

  for (let len = Math.min(q.length, 6); len >= 3 && best < 50; len -= 1) {
    for (let i = 0; i <= q.length - len; i += 1) {
      const sub = q.slice(i, i + len);
      if (name.includes(sub)) best = Math.max(best, 35 + len);
    }
  }

  return best;
}

/** 候補表示向けの最低スコア */
export const LOCAL_SPOT_MIN_SCORE = 50;

/** ルート自動解決向けの最低スコア */
export const RESOLVE_SPOT_MIN_SCORE = 85;

function matchesSpot(spot, query, minScore = 0) {
  return scoreSpotForSuggest(spot, query) >= Math.max(minScore, 1);
}

export function searchSpots(query, mode = 'japan', minScore = 0) {
  const q = query.trim();
  if (q.length < 2) return [];

  return SPOTS.filter((spot) => {
    if (mode === 'japan' && spot.mode === 'world') return false;
    return matchesSpot(spot, q, minScore);
  })
    .map((spot) => ({ spot, score: scoreSpotForSuggest(spot, q) }))
    .sort((a, b) => b.score - a.score)
    .map(({ spot }) => spot);
}

export function getSpotById(id) {
  return SPOTS.find((s) => s.id === id) || null;
}

export function matchSpot(name, mode = null) {
  if (!name) return null;
  const q = cleanSpotName(name);
  if (!q) return null;

  const exact = findExactSpotByName(q);
  if (exact) {
    if (!mode || spotMatchesMode(exact, mode)) return exact;
  }

  if (mode) return findResolvableSpot(q, mode);
  return findResolvableSpot(q, 'japan') || findResolvableSpot(q, 'world');
}

export function getSpotLandmark(spotId, name) {
  const spot = resolveRegisteredSpot(spotId, name);
  if (!spot) return null;
  return {
    spotLabel: spot.spotLabel,
    spotImage: spot.spotImage,
    specialtyName: spot.specialtyName,
    specialtyImage: spot.specialtyImage,
    description: spot.description,
    spotId: spot.id
  };
}

/** 地点オブジェクトに名所メタデータを付与（登録名所の選択時のみ座標を上書き） */
export function attachSpotMetadata(place) {
  if (!place) return null;

  const spot = place.spotId
    ? getSpotById(place.spotId)
    : findExactSpotByName(place.name);
  if (!spot) return place;

  return {
    ...place,
    spotId: spot.id,
    isSpot: true,
    name: spot.name,
    lat: spot.lat,
    lng: spot.lng,
    description: place.description || spot.description
  };
}

export function getPopularSpots(mode = 'japan', limit = 8) {
  return SPOTS.filter((s) => mode === 'world' || s.mode === 'japan').slice(0, limit);
}

export function spotToPlace(spot) {
  return {
    id: spot.id,
    spotId: spot.id,
    name: spot.name,
    displayName: `${spot.name}（名所）`,
    lat: spot.lat,
    lng: spot.lng,
    isSpot: true,
    description: spot.description
  };
}
