/**
 * FOOD SCAN - 음식 데이터셋 (foodData.js)
 * 
 * 12가지 한국 대표 음식 기본 영양 데이터
 * 1인분 기준: 칼로리(kcal), 탄수화물(g), 단백질(g), 지방(g)
 * 로컬 이미지 경로: images/<id>.jpg
 */

const FOOD_DATABASE = [
  {
    id: 'bibimbap',
    name: '비빔밥',
    category: '밥류',
    calories: 550,
    carbs: 85,
    protein: 18,
    fat: 15,
    unit: '1인분 (400g)',
    description: '신선한 나물, 계란, 소고기 볶음과 고추장이 어우러져 영양 밸런스가 뛰어난 한국의 대표 건강 비빔밥입니다.',
    imageUrl: 'images/bibimbap.jpg',
    emoji: '🥗',
    tags: ['나물', '영양균형', '든든한한끼']
  },
  {
    id: 'kimchi-jjigae',
    name: '김치찌개',
    category: '찌개/국',
    calories: 300,
    carbs: 18,
    protein: 16,
    fat: 18,
    unit: '1인분 (350g)',
    description: '잘 익은 묵은지와 돼지고기, 두부를 넣고 깊고 칼칼하게 끓여낸 한국인의 소울푸드 찌개입니다.',
    imageUrl: 'images/kimchi-jjigae.jpg',
    emoji: '🍲',
    tags: ['얼큰함', '김치', '국물요리']
  },
  {
    id: 'bulgogi',
    name: '불고기',
    category: '고기류',
    calories: 400,
    carbs: 22,
    protein: 32,
    fat: 20,
    unit: '1인분 (250g)',
    description: '배와 간장 베이스의 달콤 짭조름한 특제 양념에 재운 부드러운 소고기 구이 요리입니다.',
    imageUrl: 'images/bulgogi.jpg',
    emoji: '🥩',
    tags: ['소고기', '단백질', '전통양념']
  },
  {
    id: 'tteokbokki',
    name: '떡볶이',
    category: '분식/면',
    calories: 400,
    carbs: 82,
    protein: 8,
    fat: 4,
    unit: '1인분 (300g)',
    description: '쫄깃쫄깃한 쌀떡과 어묵에 매콤달콤한 고추장 소스가 진하게 밴 국민 분식 요리입니다.',
    imageUrl: 'images/tteokbokki.jpg',
    emoji: '🍢',
    tags: ['매콤달콤', '국민분식', '탄수화물']
  },
  {
    id: 'gimbap',
    name: '김밥',
    category: '밥류',
    calories: 450,
    carbs: 70,
    protein: 12,
    fat: 13,
    unit: '1줄 (230g)',
    description: '단무지, 당근, 시금치, 햄, 우엉 등 알록달록 다양한 속재료를 고소한 참기름 밥과 김으로 말아낸 한 줄 식사입니다.',
    imageUrl: 'images/gimbap.jpg',
    emoji: '🍙',
    tags: ['간편식', '소풍', '균형식']
  },
  {
    id: 'samgyeopsal',
    name: '삼겹살',
    category: '고기류',
    calories: 650,
    carbs: 2,
    protein: 30,
    fat: 58,
    unit: '1인분 (200g)',
    description: '노릇노릇 불판에 구워 고소한 육즙과 바삭한 식감을 만끽하는 한국의 대표 돼지고기 구이입니다.',
    imageUrl: 'images/samgyeopsal.jpg',
    emoji: '🥓',
    tags: ['고단백', '저탄수', '외식인기']
  },
  {
    id: 'japchae',
    name: '잡채',
    category: '일품',
    calories: 350,
    carbs: 58,
    protein: 8,
    fat: 10,
    unit: '1인분 (200g)',
    description: '쫄깃한 당면에 양파, 시금치, 표고버섯, 쇠고기 등 채소를 달콤짭짤하게 볶아 버무린 잔치 요리입니다.',
    imageUrl: 'images/japchae.jpg',
    emoji: '🍜',
    tags: ['당면', '명절음식', '야채풍부']
  },
  {
    id: 'tonkatsu',
    name: '돈가스',
    category: '일품',
    calories: 700,
    carbs: 60,
    protein: 28,
    fat: 38,
    unit: '1인분 (250g)',
    description: '두툼한 등심 돼지고기에 바삭한 빵가루를 입혀 황금빛으로 튀겨낸 고소하고 든든한 경양식 돈가스입니다.',
    imageUrl: 'images/tonkatsu.jpg',
    emoji: '🍱',
    tags: ['바삭함', '든든함', '아이선호']
  },
  {
    id: 'doenjang-jjigae',
    name: '된장찌개',
    category: '찌개/국',
    calories: 250,
    carbs: 16,
    protein: 14,
    fat: 14,
    unit: '1인분 (350g)',
    description: '전통 된장을 풀어 구수한 국물에 담백한 두부, 애호박, 바지락을 듬뿍 넣고 끓여낸 웰빙 찌개입니다.',
    imageUrl: 'images/doenjang-jjigae.jpg',
    emoji: '🥣',
    tags: ['구수함', '발효식품', '저칼로리']
  },
  {
    id: 'jeyuk-bokkeum',
    name: '제육볶음',
    category: '고기류',
    calories: 450,
    carbs: 20,
    protein: 30,
    fat: 28,
    unit: '1인분 (250g)',
    description: '부드러운 돼지고기를 매콤칼칼한 고추장 특제 소스에 센 불로 불맛 나게 볶아낸 밥도둑 메인 반찬입니다.',
    imageUrl: 'images/jeyuk-bokkeum.jpg',
    emoji: '🥘',
    tags: ['매콤', '밥도둑', '불맛']
  },
  {
    id: 'naengmyeon',
    name: '냉면',
    category: '분식/면',
    calories: 500,
    carbs: 95,
    protein: 14,
    fat: 6,
    unit: '1그릇 (500g)',
    description: '살얼음 띄운 시원하고 감칠맛 나는 육수에 쫄깃한 메밀면과 아삭한 오이, 무절임을 올린 여름철 별미입니다.',
    imageUrl: 'images/naengmyeon.jpg',
    emoji: '🧊',
    tags: ['시원한육수', '메밀면', '여름별미']
  },
  {
    id: 'ramen',
    name: '라면',
    category: '분식/면',
    calories: 500,
    carbs: 78,
    protein: 10,
    fat: 16,
    unit: '1봉지 (500ml)',
    description: '얼큰하고 칼칼한 국물에 꼬들꼬들한 면발, 계란과 파를 넣어 간편하고 든든하게 즐기는 대표 라면입니다.',
    imageUrl: 'images/ramen.jpg',
    emoji: '🍜',
    tags: ['얼큰한국물', '꼬들면', '국민야식']
  }
];

// 카테고리 목록
const FOOD_CATEGORIES = ['전체', '밥류', '찌개/국', '고기류', '분식/면', '일품'];

// 기본 권장 영양 가이드라인 (성인 기준)
const NUTRITION_TARGETS = {
  dailyCalories: 2000,
  carbs: 250,    // 약 50%
  protein: 100,  // 약 20%
  fat: 65        // 약 30%
};
