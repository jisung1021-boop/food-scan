/**
 * FOOD SCAN - 메인 애플리케이션 로직 (app.js)
 */

// 글로벌 파스텔 대체 SVG 생성기 및 이미지 에러 핸들러
const FOOD_EMOJI_MAP = {
  'bibimbap': '🥗',
  'kimchi-jjigae': '🍲',
  'bulgogi': '🥩',
  'tteokbokki': '🍢',
  'gimbap': '🍙',
  'samgyeopsal': '🥓',
  'japchae': '🍜',
  'tonkatsu': '🍱',
  'doenjang-jjigae': '🥣',
  'jeyuk-bokkeum': '🥘',
  'naengmyeon': '🧊',
  'ramen': '🍜'
};

const CATEGORY_PASTEL_THEMES = {
  '밥류': { bg1: '#FEF3C7', bg2: '#FDE68A', text: '#B45309', border: '#FCD34D' },
  '찌개/국': { bg1: '#FFE4E6', bg2: '#FECDD3', text: '#BE123C', border: '#FDA4AF' },
  '고기류': { bg1: '#EDE9FE', bg2: '#DDD6FE', text: '#6D28D9', border: '#C4B5FD' },
  '분식/면': { bg1: '#DCFCE7', bg2: '#BBF7D0', text: '#047857', border: '#86EFAC' },
  '일품': { bg1: '#E0F2FE', bg2: '#BAE6FD', text: '#0369A1', border: '#7DD3FC' }
};

function generatePastelFallbackSvg(foodId, foodName, category) {
  let name = foodName;
  let cat = category;
  let emoji = foodId ? FOOD_EMOJI_MAP[foodId] : null;

  if (typeof FOOD_DATABASE !== 'undefined' && Array.isArray(FOOD_DATABASE)) {
    const f = FOOD_DATABASE.find(item => item.id === foodId || item.name === foodName);
    if (f) {
      if (!name) name = f.name;
      if (!cat) cat = f.category;
      if (!emoji) emoji = f.emoji || FOOD_EMOJI_MAP[f.id];
    }
  }

  name = name || '맛있는 음식';
  cat = cat || '한식';
  emoji = emoji || '🍲';

  const theme = CATEGORY_PASTEL_THEMES[cat] || { bg1: '#F1F5F9', bg2: '#E2E8F0', text: '#334155', border: '#CBD5E1' };

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300" width="400" height="300">
    <defs>
      <linearGradient id="pastel_${foodId || 'def'}" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${theme.bg1}"/>
        <stop offset="100%" stop-color="${theme.bg2}"/>
      </linearGradient>
    </defs>
    <rect width="100%" height="100%" fill="url(#pastel_${foodId || 'def'})"/>
    <circle cx="200" cy="115" r="62" fill="#ffffff" opacity="0.92"/>
    <circle cx="200" cy="115" r="65" fill="none" stroke="${theme.border}" stroke-width="2"/>
    <text x="200" y="134" font-family="Apple Color Emoji, Segoe UI Emoji, sans-serif" font-size="52" text-anchor="middle">${emoji}</text>
    <text x="200" y="215" font-family="Pretendard, -apple-system, sans-serif" font-size="22" font-weight="700" fill="#0F172A" text-anchor="middle">${name}</text>
    <rect x="145" y="235" width="110" height="26" rx="13" fill="#ffffff" opacity="0.95"/>
    <text x="200" y="252" font-family="Pretendard, -apple-system, sans-serif" font-size="12" font-weight="700" fill="${theme.text}" text-anchor="middle">${cat} · FOOD SCAN</text>
  </svg>`;

  try {
    return 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svg)));
  } catch (e) {
    return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
  }
}

window.handleFoodImgError = function(imgEl, foodId, foodName, category) {
  if (!imgEl) return;
  imgEl.onerror = null;
  imgEl.src = generatePastelFallbackSvg(foodId, foodName, category);
};

class FoodScanApp {
  constructor() {
    this.storageKey = 'foodscan_records_v1';
    this.currentView = 'dashboard';
    this.selectedDate = this.getTodayDateString(); // YYYY-MM-DD
    this.records = this.loadRecords();

    // 현재 계산기 모달 상태
    this.activeFood = null;
    this.activePortion = 1.0;
    this.activeMealType = '아침';
    this.activeAttachedPhoto = null;

    // 검색 & 필터 상태
    this.currentCategory = '전체';
    this.searchKeyword = '';
    this.sortOption = 'default';

    this.init();
  }

  // --------------------------------------------------------------------------
  // 초기화 및 이벤트 리스너 바인딩
  // --------------------------------------------------------------------------
  init() {
    this.bindEvents();
    this.updateHeaderDate();
    this.syncDatePickers();
    this.renderFoodGallery();
    this.renderAllViews();
  }

  bindEvents() {
    // 1. 네비게이션 (데스크탑 & 모바일)
    document.querySelectorAll('.nav-link, .mobile-tab').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const viewName = btn.dataset.view;
        if (viewName) {
          this.switchView(viewName);
        }
      });
    });

    // 로고 클릭시 대시보드로 이동
    const brandLogo = document.getElementById('brand-logo');
    if (brandLogo) {
      brandLogo.addEventListener('click', () => this.switchView('dashboard'));
    }

    // 헤더 음식 추가 버튼
    const quickAddBtn = document.getElementById('btn-quick-add');
    if (quickAddBtn) {
      quickAddBtn.addEventListener('click', () => this.switchView('search'));
    }

    // 2. 대시보드 날짜 네비게이션
    const dashPrev = document.getElementById('btn-prev-day');
    const dashNext = document.getElementById('btn-next-day');
    const dashToday = document.getElementById('btn-go-today');
    const dashPicker = document.getElementById('dashboard-date-picker');

    if (dashPrev) dashPrev.addEventListener('click', () => this.changeDate(-1));
    if (dashNext) dashNext.addEventListener('click', () => this.changeDate(1));
    if (dashToday) dashToday.addEventListener('click', () => this.setDate(this.getTodayDateString()));
    if (dashPicker) {
      dashPicker.addEventListener('change', (e) => {
        if (e.target.value) this.setDate(e.target.value);
      });
      const dashLabel = document.querySelector('.date-label-wrapper');
      if (dashLabel) {
        dashLabel.addEventListener('click', () => {
          try { if (dashPicker.showPicker) dashPicker.showPicker(); } catch (err) {}
        });
      }
    }

    // 3. 기록 페이지 날짜 네비게이션
    const recPrev = document.getElementById('records-prev-day');
    const recNext = document.getElementById('records-next-day');
    const recToday = document.getElementById('records-go-today');
    const recPicker = document.getElementById('records-date-picker');

    if (recPrev) recPrev.addEventListener('click', () => this.changeDate(-1));
    if (recNext) recNext.addEventListener('click', () => this.changeDate(1));
    if (recToday) recToday.addEventListener('click', () => this.setDate(this.getTodayDateString()));
    if (recPicker) {
      recPicker.addEventListener('change', (e) => {
        if (e.target.value) this.setDate(e.target.value);
      });
      const recLabel = document.querySelector('#view-records .date-label-wrapper');
      if (recLabel) {
        recLabel.addEventListener('click', () => {
          try { if (recPicker.showPicker) recPicker.showPicker(); } catch (err) {}
        });
      }
    }

    // 4. 검색 & 카테고리 & 정렬
    const searchInput = document.getElementById('food-search-input');
    const clearSearchBtn = document.getElementById('btn-clear-search');
    const sortSelect = document.getElementById('food-sort-select');
    const categoryContainer = document.getElementById('category-pills');

    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.searchKeyword = e.target.value.trim().toLowerCase();
        if (clearSearchBtn) {
          clearSearchBtn.classList.toggle('hidden', !this.searchKeyword);
        }
        this.renderFoodGallery();
      });
    }

    if (clearSearchBtn) {
      clearSearchBtn.addEventListener('click', () => {
        if (searchInput) {
          searchInput.value = '';
          this.searchKeyword = '';
          clearSearchBtn.classList.add('hidden');
          this.renderFoodGallery();
          searchInput.focus();
        }
      });
    }

    if (categoryContainer) {
      categoryContainer.addEventListener('click', (e) => {
        const pill = e.target.closest('.pill');
        if (!pill) return;
        categoryContainer.querySelectorAll('.pill').forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        this.currentCategory = pill.dataset.category || '전체';
        this.renderFoodGallery();
      });
    }

    if (sortSelect) {
      sortSelect.addEventListener('change', (e) => {
        this.sortOption = e.target.value;
        this.renderFoodGallery();
      });
    }

    // 검색 상단 식단 사진 첨부 버튼 데모
    const demoPhotoInput = document.getElementById('demo-photo-input');
    if (demoPhotoInput) {
      demoPhotoInput.addEventListener('change', (e) => {
        if (e.target.files && e.target.files[0]) {
          const file = e.target.files[0];
          const reader = new FileReader();
          reader.onload = (event) => {
            // 비빔밥 기본 선택하여 사진 첨부와 함께 모달 열기
            const defaultFood = FOOD_DATABASE[0];
            this.openCalculatorModal(defaultFood, '점심', event.target.result);
            this.showToast('식단 사진이 첨부되었습니다. 음식과 섭취량을 확인해주세요.', 'success');
          };
          reader.readAsDataURL(file);
        }
      });
    }

    // 5. 섭취량 계산 모달 제어
    this.bindModalEvents();

    // 6. 시연용 샘플 생성 & 초기화
    const btnSample = document.getElementById('btn-load-sample-data');
    if (btnSample) {
      btnSample.addEventListener('click', () => this.loadSampleData());
    }

    const btnClearAll = document.getElementById('btn-clear-all-records');
    if (btnClearAll) {
      btnClearAll.addEventListener('click', () => this.clearAllRecords());
    }
  }

  bindModalEvents() {
    const modalBackdrop = document.getElementById('modal-calculator');
    const btnClose = document.getElementById('btn-close-calc');
    const btnCancel = document.getElementById('btn-cancel-calc');
    const btnSubmit = document.getElementById('btn-submit-add-food');

    const closeHandler = () => this.closeCalculatorModal();
    if (btnClose) btnClose.addEventListener('click', closeHandler);
    if (btnCancel) btnCancel.addEventListener('click', closeHandler);
    if (modalBackdrop) {
      modalBackdrop.addEventListener('click', (e) => {
        if (e.target === modalBackdrop) closeHandler();
      });
    }

    // 식사 유형 선택 (아침, 점심, 저녁, 간식)
    const mealTypeContainer = document.getElementById('calc-meal-types');
    if (mealTypeContainer) {
      mealTypeContainer.addEventListener('click', (e) => {
        const btn = e.target.closest('.btn-meal-type');
        if (!btn) return;
        mealTypeContainer.querySelectorAll('.btn-meal-type').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.activeMealType = btn.dataset.meal;
      });
    }

    // 섭취량 프리셋 버튼 (0.5, 1, 1.5, 2)
    const portionPresetContainer = document.querySelector('.portion-presets');
    const portionInput = document.getElementById('input-portion-qty');

    if (portionPresetContainer) {
      portionPresetContainer.addEventListener('click', (e) => {
        const btn = e.target.closest('.btn-portion');
        if (!btn) return;
        portionPresetContainer.querySelectorAll('.btn-portion').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const val = parseFloat(btn.dataset.portion);
        this.updatePortion(val);
      });
    }

    // 직접 수량 입력
    if (portionInput) {
      portionInput.addEventListener('input', (e) => {
        let val = parseFloat(e.target.value);
        if (isNaN(val) || val <= 0) val = 1.0;
        if (val > 10) val = 10.0;
        this.activePortion = val;
        this.recalculateModalValues();
      });
    }

    // 스텝 버튼 (+, -)
    const btnMinus = document.getElementById('btn-portion-minus');
    const btnPlus = document.getElementById('btn-portion-plus');

    if (btnMinus) {
      btnMinus.addEventListener('click', () => {
        let val = Math.max(0.1, Math.round((this.activePortion - 0.1) * 10) / 10);
        this.updatePortion(val);
      });
    }

    if (btnPlus) {
      btnPlus.addEventListener('click', () => {
        let val = Math.min(10.0, Math.round((this.activePortion + 0.1) * 10) / 10);
        this.updatePortion(val);
      });
    }

    // 모달 내 사진 첨부
    const photoInput = document.getElementById('calc-photo-file');
    const previewContainer = document.getElementById('photo-preview-container');
    const previewImg = document.getElementById('photo-preview-img');
    const btnRemovePhoto = document.getElementById('btn-remove-photo');
    const uploadLabel = document.querySelector('.photo-upload-label');

    if (photoInput) {
      photoInput.addEventListener('change', (e) => {
        if (e.target.files && e.target.files[0]) {
          const reader = new FileReader();
          reader.onload = (evt) => {
            this.activeAttachedPhoto = evt.target.result;
            if (previewImg) previewImg.src = this.activeAttachedPhoto;
            if (previewContainer) previewContainer.classList.remove('hidden');
            if (uploadLabel) uploadLabel.classList.add('hidden');
          };
          reader.readAsDataURL(e.target.files[0]);
        }
      });
    }

    if (btnRemovePhoto) {
      btnRemovePhoto.addEventListener('click', () => {
        this.activeAttachedPhoto = null;
        if (photoInput) photoInput.value = '';
        if (previewContainer) previewContainer.classList.add('hidden');
        if (uploadLabel) uploadLabel.classList.remove('hidden');
      });
    }

    // 제출: 식단에 추가
    if (btnSubmit) {
      btnSubmit.addEventListener('click', () => this.submitAddRecord());
    }
  }

  // --------------------------------------------------------------------------
  // SPA 뷰 전환
  // --------------------------------------------------------------------------
  switchView(viewName) {
    this.currentView = viewName;

    // View 섹션 토글
    document.querySelectorAll('.view').forEach(view => {
      view.classList.toggle('active', view.id === `view-${viewName}`);
    });

    // 네비게이션 버튼 활성화 토글
    document.querySelectorAll('.nav-link, .mobile-tab').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.view === viewName);
    });

    // 뷰별 렌더링 동기화
    window.scrollTo({ top: 0, behavior: 'smooth' });
    this.renderAllViews();
  }

  // --------------------------------------------------------------------------
  // 날짜 제어 유틸리티
  // --------------------------------------------------------------------------
  getTodayDateString() {
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  formatDateKorean(dateStr) {
    const [y, m, d] = dateStr.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d);
    const days = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];
    const dayName = days[dateObj.getDay()];
    return `${y}년 ${m}월 ${d}일 (${dayName})`;
  }

  formatDateShort(dateStr) {
    const [y, m, d] = dateStr.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d);
    const days = ['일', '월', '화', '수', '목', '금', '토'];
    const dayName = days[dateObj.getDay()];
    return `${y}. ${m}. ${d} (${dayName})`;
  }

  setDate(newDateStr) {
    this.selectedDate = newDateStr;
    this.syncDatePickers();
    this.updateHeaderDate();
    this.renderAllViews();
  }

  changeDate(offsetDays) {
    const [y, m, d] = this.selectedDate.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d);
    dateObj.setDate(dateObj.getDate() + offsetDays);

    const newY = dateObj.getFullYear();
    const newM = String(dateObj.getMonth() + 1).padStart(2, '0');
    const newD = String(dateObj.getDate()).padStart(2, '0');
    this.setDate(`${newY}-${newM}-${newD}`);
  }

  syncDatePickers() {
    const isToday = this.selectedDate === this.getTodayDateString();

    // 대시보드 날짜 라벨 및 인풋
    const dashLabel = document.getElementById('dashboard-selected-date');
    const dashPicker = document.getElementById('dashboard-date-picker');
    const dashChip = document.getElementById('chip-today-indicator');

    if (dashLabel) dashLabel.textContent = this.formatDateKorean(this.selectedDate);
    if (dashPicker) dashPicker.value = this.selectedDate;
    if (dashChip) dashChip.classList.toggle('hidden', !isToday);

    // 기록 페이지 날짜 라벨 및 인풋
    const recLabel = document.getElementById('records-selected-date');
    const recPicker = document.getElementById('records-date-picker');

    if (recLabel) recLabel.textContent = this.formatDateKorean(this.selectedDate);
    if (recPicker) recPicker.value = this.selectedDate;

    // 통계 칩
    const statsChip = document.getElementById('stats-current-date-chip');
    if (statsChip) {
      statsChip.textContent = isToday ? '오늘 기준' : `${this.formatDateShort(this.selectedDate)} 기준`;
    }
  }

  updateHeaderDate() {
    const headerDateText = document.getElementById('current-date-text');
    if (headerDateText) {
      headerDateText.textContent = this.formatDateShort(this.selectedDate);
    }
  }

  // --------------------------------------------------------------------------
  // 음식 갤러리 (VIEW 2) 렌더링
  // --------------------------------------------------------------------------
  renderFoodGallery() {
    const container = document.getElementById('food-gallery-grid');
    if (!container) return;

    let foods = [...FOOD_DATABASE];

    // 카테고리 필터링
    if (this.currentCategory !== '전체') {
      foods = foods.filter(f => f.category === this.currentCategory);
    }

    // 검색어 필터링
    if (this.searchKeyword) {
      foods = foods.filter(f => {
        return f.name.toLowerCase().includes(this.searchKeyword) ||
               f.description.toLowerCase().includes(this.searchKeyword) ||
               (f.tags && f.tags.some(t => t.toLowerCase().includes(this.searchKeyword)));
      });
    }

    // 정렬
    switch (this.sortOption) {
      case 'cal-asc':
        foods.sort((a, b) => a.calories - b.calories);
        break;
      case 'cal-desc':
        foods.sort((a, b) => b.calories - a.calories);
        break;
      case 'protein-desc':
        foods.sort((a, b) => b.protein - a.protein);
        break;
      case 'name-asc':
        foods.sort((a, b) => a.name.localeCompare(b.name, 'ko'));
        break;
      default:
        break;
    }

    if (foods.length === 0) {
      container.innerHTML = `
        <div class="empty-state" style="grid-column: 1 / -1;">
          <div class="empty-state-icon">🔍</div>
          <h3 class="empty-state-title">일치하는 음식을 찾을 수 없습니다</h3>
          <p class="empty-state-desc">'${this.searchKeyword}'에 대한 검색 결과가 없습니다. 다른 검색어를 입력해보세요.</p>
          <button class="btn btn-secondary btn-sm" onclick="app.resetSearch()">전체 목록 보기</button>
        </div>
      `;
      return;
    }

    container.innerHTML = foods.map(food => {
      return `
        <div class="food-card" data-food-id="${food.id}" onclick="app.openCalculatorModalById('${food.id}')" title="${food.name} 섭취량 계산하기" style="cursor: pointer;">
          <div class="food-card-img-wrap">
            <img 
              src="${food.imageUrl}" 
              alt="${food.name}" 
              class="food-card-img" 
              loading="lazy"
              onerror="handleFoodImgError(this, '${food.id}', '${food.name}', '${food.category}');"
            >
            <span class="food-card-category">${food.category}</span>
            <span class="food-card-cal-badge">${food.calories} kcal</span>
          </div>
          <div class="food-card-body">
            <h3 class="food-card-title">${food.name}</h3>
            <p class="food-card-desc">${food.description}</p>
            <div class="food-card-macros">
              <div class="food-card-macro-item">
                <span class="name">탄수화물</span>
                <span class="val">${food.carbs}g</span>
              </div>
              <div class="food-card-macro-item">
                <span class="name">단백질</span>
                <span class="val">${food.protein}g</span>
              </div>
              <div class="food-card-macro-item">
                <span class="name">지방</span>
                <span class="val">${food.fat}g</span>
              </div>
            </div>
            <button class="btn btn-primary food-card-btn" onclick="event.stopPropagation(); app.openCalculatorModalById('${food.id}')">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              선택 & 섭취량 계산
            </button>
          </div>
        </div>
      `;
    }).join('');
  }

  resetSearch() {
    this.searchKeyword = '';
    this.currentCategory = '전체';
    const input = document.getElementById('food-search-input');
    const clearBtn = document.getElementById('btn-clear-search');
    if (input) input.value = '';
    if (clearBtn) clearBtn.classList.add('hidden');
    document.querySelectorAll('#category-pills .pill').forEach((p, idx) => {
      p.classList.toggle('active', idx === 0);
    });
    this.renderFoodGallery();
  }

  // --------------------------------------------------------------------------
  // 섭취량 계산 모달 열기 & 실시간 계산 로직
  // --------------------------------------------------------------------------
  openCalculatorModalById(foodId, defaultMealType = null) {
    const food = FOOD_DATABASE.find(f => f.id === foodId);
    if (!food) return;
    this.openCalculatorModal(food, defaultMealType);
  }

  openAddMealModal(mealType) {
    // 특정 식사 슬롯에서 바로 음식 선택창으로 이동하거나 기본 음식으로 모달 열기
    this.activeMealType = mealType;
    this.switchView('search');
    this.showToast(`'${mealType}' 식단에 추가할 음식을 선택해주세요.`, 'info');
  }

  openCalculatorModal(food, presetMealType = null, attachedPhotoUrl = null) {
    this.activeFood = food;
    this.activePortion = 1.0;
    this.activeMealType = presetMealType || this.activeMealType || this.determineCurrentMealType();
    this.activeAttachedPhoto = attachedPhotoUrl || null;

    // 모달 DOM 요소 채우기
    const modalImg = document.getElementById('calc-food-img');
    const categoryBadge = document.getElementById('calc-food-category');
    const nameEl = document.getElementById('calc-food-name');
    const descEl = document.getElementById('calc-food-desc');
    const unitEl = document.getElementById('calc-base-unit');
    const baseCal = document.getElementById('calc-base-cal');
    const baseCarb = document.getElementById('calc-base-carb');
    const baseProtein = document.getElementById('calc-base-protein');
    const baseFat = document.getElementById('calc-base-fat');
    const dateInput = document.getElementById('calc-record-date');
    const memoInput = document.getElementById('calc-memo');

    if (modalImg) {
      modalImg.src = food.imageUrl;
      modalImg.onerror = function() {
        this.onerror = null;
        this.src = generatePastelFallbackSvg(food.id, food.name, food.category);
      };
    }
    if (categoryBadge) categoryBadge.textContent = food.category;
    if (nameEl) nameEl.textContent = food.name;
    if (descEl) descEl.textContent = food.description;
    if (unitEl) unitEl.textContent = food.unit || '1인분';

    if (baseCal) baseCal.textContent = food.calories;
    if (baseCarb) baseCarb.textContent = food.carbs;
    if (baseProtein) baseProtein.textContent = food.protein;
    if (baseFat) baseFat.textContent = food.fat;

    if (dateInput) dateInput.value = this.selectedDate;
    if (memoInput) memoInput.value = '';

    // 사진 프리뷰 상태 초기화
    const previewContainer = document.getElementById('photo-preview-container');
    const previewImg = document.getElementById('photo-preview-img');
    const uploadLabel = document.querySelector('.photo-upload-label');
    const photoFileInput = document.getElementById('calc-photo-file');
    if (photoFileInput) photoFileInput.value = '';

    if (this.activeAttachedPhoto) {
      if (previewImg) previewImg.src = this.activeAttachedPhoto;
      if (previewContainer) previewContainer.classList.remove('hidden');
      if (uploadLabel) uploadLabel.classList.add('hidden');
    } else {
      if (previewContainer) previewContainer.classList.add('hidden');
      if (uploadLabel) uploadLabel.classList.remove('hidden');
    }

    // 식사 유형 버튼 활성화 설정
    document.querySelectorAll('#calc-meal-types .btn-meal-type').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.meal === this.activeMealType);
    });

    // 프리셋 버튼 및 인풋 초기화 (1인분 기본)
    this.updatePortion(1.0);

    // 모달 표시
    const modal = document.getElementById('modal-calculator');
    if (modal) modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  }

  closeCalculatorModal() {
    const modal = document.getElementById('modal-calculator');
    if (modal) modal.classList.add('hidden');
    document.body.style.overflow = '';
    this.activeFood = null;
    this.activeAttachedPhoto = null;
  }

  updatePortion(newPortion) {
    this.activePortion = newPortion;
    const portionInput = document.getElementById('input-portion-qty');
    if (portionInput) portionInput.value = this.activePortion.toFixed(1);

    // 프리셋 버튼 active 상태 동기화
    document.querySelectorAll('.portion-presets .btn-portion').forEach(btn => {
      const p = parseFloat(btn.dataset.portion);
      btn.classList.toggle('active', p === this.activePortion);
    });

    this.recalculateModalValues();
  }

  recalculateModalValues() {
    if (!this.activeFood) return;

    // 공식: 각 영양성분 * 섭취 비율
    const portion = this.activePortion;
    const totalCal = Math.round(this.activeFood.calories * portion);
    const totalCarb = Math.round(this.activeFood.carbs * portion * 10) / 10;
    const totalProtein = Math.round(this.activeFood.protein * portion * 10) / 10;
    const totalFat = Math.round(this.activeFood.fat * portion * 10) / 10;

    const elTotalCal = document.getElementById('calc-res-total-cal');
    const elCarb = document.getElementById('calc-res-carb');
    const elProtein = document.getElementById('calc-res-protein');
    const elFat = document.getElementById('calc-res-fat');

    if (elTotalCal) elTotalCal.textContent = totalCal.toLocaleString();
    if (elCarb) elCarb.textContent = totalCarb;
    if (elProtein) elProtein.textContent = totalProtein;
    if (elFat) elFat.textContent = totalFat;
  }

  determineCurrentMealType() {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 11) return '아침';
    if (hour >= 11 && hour < 16) return '점심';
    if (hour >= 16 && hour < 22) return '저녁';
    return '간식';
  }

  submitAddRecord() {
    if (!this.activeFood) return;

    const dateInput = document.getElementById('calc-record-date');
    const memoInput = document.getElementById('calc-memo');
    const recordDate = dateInput ? dateInput.value : this.selectedDate;
    const memo = memoInput ? memoInput.value.trim() : '';

    const portion = this.activePortion;
    const calculatedCalories = Math.round(this.activeFood.calories * portion);
    const calculatedCarbs = Math.round(this.activeFood.carbs * portion * 10) / 10;
    const calculatedProtein = Math.round(this.activeFood.protein * portion * 10) / 10;
    const calculatedFat = Math.round(this.activeFood.fat * portion * 10) / 10;

    const portionText = portion === 1.5 
      ? '1.5인분 (곱빼기)' 
      : (portion === 0.5 ? '0.5인분 (반 그릇)' : (portion === 1.0 ? '1인분 (정량)' : (portion === 2.0 ? '2인분 (2그릇)' : `${portion}인분`)));

    const newRecord = {
      id: 'rec_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
      foodId: this.activeFood.id,
      name: this.activeFood.name,
      category: this.activeFood.category,
      portion: portion,
      portionText: portionText,
      calories: calculatedCalories,
      carbs: calculatedCarbs,
      protein: calculatedProtein,
      fat: calculatedFat,
      mealType: this.activeMealType,
      date: recordDate,
      timestamp: Date.now(),
      imageUrl: this.activeFood.imageUrl,
      customPhotoUrl: this.activeAttachedPhoto,
      memo: memo
    };

    this.records.unshift(newRecord);
    this.saveRecords();

    this.closeCalculatorModal();
    this.showToast(`${newRecord.name} (${portionText})이(가) ${newRecord.mealType} 식단에 추가되었습니다!`, 'success');

    // 기록한 날짜로 기준일자 동기화
    this.setDate(recordDate);
  }

  deleteRecord(recordId) {
    const index = this.records.findIndex(r => r.id === recordId);
    if (index === -1) return;

    const item = this.records[index];
    if (confirm(`'${item.name}' 기록을 삭제하시겠습니까?`)) {
      this.records.splice(index, 1);
      this.saveRecords();
      this.showToast('식단 기록이 삭제되었습니다.', 'danger');
      this.renderAllViews();
    }
  }

  // --------------------------------------------------------------------------
  // LocalStorage 영속화 관리
  // --------------------------------------------------------------------------
  loadRecords() {
    try {
      const data = localStorage.getItem(this.storageKey);
      if (data) {
        const parsed = JSON.parse(data);
        // 기존에 저장된 외부 Unsplash 링크가 있다면 로컬 이미지 경로로 자동 보정
        let updated = false;
        parsed.forEach(r => {
          if (r.imageUrl && (r.imageUrl.includes('unsplash.com') || !r.imageUrl.startsWith('images/'))) {
            const match = FOOD_DATABASE.find(f => f.id === r.foodId || f.name === r.name);
            if (match) {
              r.imageUrl = match.imageUrl;
              updated = true;
            }
          }
        });
        if (updated) {
          localStorage.setItem(this.storageKey, JSON.stringify(parsed));
        }
        return parsed;
      }
    } catch (e) {
      console.error('LocalStorage 로드 실패:', e);
    }
    // 기본 초기 데이터 (없으면 생성)
    return this.generateInitialRecords();
  }

  saveRecords() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.records));
    } catch (e) {
      console.error('LocalStorage 저장 실패:', e);
    }
  }

  generateInitialRecords() {
    // 사용자가 처음 방문했을 때 오늘 날짜로 시연용 1~2개 기본 샘플 식단 등록
    const today = this.getTodayDateString();
    return [
      {
        id: 'rec_init_1',
        foodId: 'bibimbap',
        name: '비빔밥',
        category: '밥류',
        portion: 1.0,
        portionText: '1인분',
        calories: 550,
        carbs: 85,
        protein: 18,
        fat: 15,
        mealType: '점심',
        date: today,
        timestamp: Date.now() - 3600000 * 2,
        imageUrl: 'images/bibimbap.jpg',
        customPhotoUrl: null,
        memo: '참기름 적당히 넣고 비벼 먹음'
      },
      {
        id: 'rec_init_2',
        foodId: 'kimchi-jjigae',
        name: '김치찌개',
        category: '찌개/국',
        portion: 0.5,
        portionText: '0.5인분',
        calories: 150,
        carbs: 9,
        protein: 8,
        fat: 9,
        mealType: '아침',
        date: today,
        timestamp: Date.now() - 3600000 * 5,
        imageUrl: 'images/kimchi-jjigae.jpg',
        customPhotoUrl: null,
        memo: '두부 위주로 가볍게 섭취'
      }
    ];
  }

  // --------------------------------------------------------------------------
  // 전체 뷰 통합 렌더링
  // --------------------------------------------------------------------------
  renderAllViews() {
    this.renderDashboard();
    this.renderRecordsView();
    this.renderStatsView();
  }

  // --------------------------------------------------------------------------
  // 1. 대시보드 (Dashboard) 렌더링
  // --------------------------------------------------------------------------
  renderDashboard() {
    // 선택된 날짜의 기록 필터링
    const dayRecords = this.records.filter(r => r.date === this.selectedDate);

    // 총 섭취량 계산
    let totalCalories = 0;
    let totalCarbs = 0;
    let totalProtein = 0;
    let totalFat = 0;

    const mealGroups = {
      '아침': { cal: 0, count: 0, names: [] },
      '점심': { cal: 0, count: 0, names: [] },
      '저녁': { cal: 0, count: 0, names: [] },
      '간식': { cal: 0, count: 0, names: [] }
    };

    dayRecords.forEach(r => {
      totalCalories += r.calories;
      totalCarbs += r.carbs;
      totalProtein += r.protein;
      totalFat += r.fat;

      if (mealGroups[r.mealType]) {
        mealGroups[r.mealType].cal += r.calories;
        mealGroups[r.mealType].count += 1;
        mealGroups[r.mealType].names.push(r.name);
      }
    });

    totalCarbs = Math.round(totalCarbs * 10) / 10;
    totalProtein = Math.round(totalProtein * 10) / 10;
    totalFat = Math.round(totalFat * 10) / 10;

    const targetCal = NUTRITION_TARGETS.dailyCalories;
    const remainingCal = Math.max(0, targetCal - totalCalories);
    const calPercentage = Math.round((totalCalories / targetCal) * 100);

    // 대시보드 주요 수치 DOM 업데이트
    const elTotalCal = document.getElementById('val-total-calories');
    const elPercent = document.getElementById('val-calorie-percentage');
    const elRemaining = document.getElementById('val-remaining-calories');
    const elFoodCount = document.getElementById('val-total-food-count');
    const elStatus = document.getElementById('val-calorie-status');
    const heroProgress = document.getElementById('hero-progress-text');

    if (elTotalCal) elTotalCal.textContent = totalCalories.toLocaleString();
    if (elPercent) elPercent.textContent = `${calPercentage}%`;
    if (elRemaining) elRemaining.textContent = `${remainingCal.toLocaleString()} kcal`;
    if (elFoodCount) elFoodCount.textContent = `${dayRecords.length}개`;
    if (heroProgress) heroProgress.textContent = `${calPercentage}% 완료`;

    // 원형 프로그레스 링 업데이트 (r=68, circumference = 427.26)
    const ringFill = document.getElementById('cal-ring-fill');
    if (ringFill) {
      const circumference = 427.26;
      const progress = Math.min(totalCalories / targetCal, 1);
      const offset = circumference * (1 - progress);
      ringFill.style.strokeDashoffset = offset;
      if (calPercentage > 100) {
        ringFill.style.stroke = '#EF4444'; // 초과시 붉은색
      } else {
        ringFill.style.stroke = '#10B981'; // 적정 에메랄드
      }
    }

    // 상태 메시지
    if (elStatus) {
      if (dayRecords.length === 0) {
        elStatus.textContent = '오늘 첫 식단을 기록해보세요';
        elStatus.style.backgroundColor = '#F1F5F9';
        elStatus.style.color = '#64748B';
      } else if (calPercentage < 50) {
        elStatus.textContent = '목표 칼로리까지 넉넉해요';
        elStatus.style.backgroundColor = '#ECFDF5';
        elStatus.style.color = '#047857';
      } else if (calPercentage <= 100) {
        elStatus.textContent = '적절한 식사량을 유지 중입니다';
        elStatus.style.backgroundColor = '#ECFDF5';
        elStatus.style.color = '#047857';
      } else {
        elStatus.textContent = `권장량을 ${totalCalories - targetCal} kcal 초과했습니다`;
        elStatus.style.backgroundColor = '#FEE2E2';
        elStatus.style.color = '#B91C1C';
      }
    }

    // 3대 영양소 진행률 바
    this.updateMacroBar('carb', totalCarbs, NUTRITION_TARGETS.carbs);
    this.updateMacroBar('protein', totalProtein, NUTRITION_TARGETS.protein);
    this.updateMacroBar('fat', totalFat, NUTRITION_TARGETS.fat);

    // 식사별 요약 카드
    this.updateMealSlot('breakfast', mealGroups['아침']);
    this.updateMealSlot('lunch', mealGroups['점심']);
    this.updateMealSlot('dinner', mealGroups['저녁']);
    this.updateMealSlot('snack', mealGroups['간식']);

    // 오늘의 식단 최근 타임라인 목록
    this.renderDashboardRecentList(dayRecords);
  }

  updateMacroBar(macroType, currentVal, targetVal) {
    const elVal = document.getElementById(`val-${macroType}`);
    const elBar = document.getElementById(`bar-${macroType}`);
    const elPercent = document.getElementById(`percent-${macroType}`);

    if (elVal) elVal.textContent = currentVal;
    const pct = Math.min(Math.round((currentVal / targetVal) * 100), 100);
    if (elBar) elBar.style.width = `${pct}%`;
    if (elPercent) elPercent.textContent = `${pct}% (${currentVal}g / ${targetVal}g)`;
  }

  updateMealSlot(slotKey, groupData) {
    const elCal = document.getElementById(`meal-cal-${slotKey}`);
    const elItems = document.getElementById(`meal-items-${slotKey}`);

    if (elCal) elCal.textContent = groupData.cal.toLocaleString();
    if (elItems) {
      if (groupData.count === 0) {
        elItems.textContent = '기록 없음';
      } else if (groupData.count === 1) {
        elItems.textContent = groupData.names[0];
      } else {
        elItems.textContent = `${groupData.names[0]} 외 ${groupData.count - 1}개`;
      }
    }
  }

  renderDashboardRecentList(records) {
    const container = document.getElementById('dashboard-recent-list');
    if (!container) return;

    if (records.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">🍽️</div>
          <h3 class="empty-state-title">선택한 날짜에 기록된 식단이 없습니다</h3>
          <p class="empty-state-desc">음식 검색에서 오늘 먹은 음식을 추가하고 칼로리를 계산해보세요.</p>
          <button class="btn btn-primary btn-sm" onclick="app.switchView('search')">+ 지금 식단 추가하기</button>
        </div>
      `;
      return;
    }

    container.innerHTML = records.map(r => this.renderRecordItemHtml(r)).join('');
  }

  // --------------------------------------------------------------------------
  // 2. 식단 기록 (Records View) 렌더링
  // --------------------------------------------------------------------------
  renderRecordsView() {
    const dayRecords = this.records.filter(r => r.date === this.selectedDate);

    // 일일 리본 통계 수치
    let totalCal = 0, totalCarb = 0, totalProtein = 0, totalFat = 0;
    dayRecords.forEach(r => {
      totalCal += r.calories;
      totalCarb += r.carbs;
      totalProtein += r.protein;
      totalFat += r.fat;
    });

    const elCal = document.getElementById('rec-total-cal');
    const elCarb = document.getElementById('rec-total-carb');
    const elProtein = document.getElementById('rec-total-protein');
    const elFat = document.getElementById('rec-total-fat');

    if (elCal) elCal.textContent = totalCal.toLocaleString();
    if (elCarb) elCarb.textContent = Math.round(totalCarb * 10) / 10;
    if (elProtein) elProtein.textContent = Math.round(totalProtein * 10) / 10;
    if (elFat) elFat.textContent = Math.round(totalFat * 10) / 10;

    // 아침, 점심, 저녁, 간식 섹션별 렌더링
    const container = document.getElementById('meal-log-sections');
    if (!container) return;

    const mealTypes = [
      { name: '아침', icon: '🌅', colorClass: 'morning' },
      { name: '점심', icon: '☀️', colorClass: 'lunch' },
      { name: '저녁', icon: '🌙', colorClass: 'dinner' },
      { name: '간식', icon: '🥪', colorClass: 'snack' }
    ];

    container.innerHTML = mealTypes.map(m => {
      const items = dayRecords.filter(r => r.mealType === m.name);
      const sectionCal = items.reduce((sum, item) => sum + item.calories, 0);

      const itemsHtml = items.length > 0 
        ? items.map(item => this.renderRecordItemHtml(item)).join('')
        : `<div class="meal-empty-hint">${m.name}에 기록된 음식이 없습니다. 우측 상단의 '+ 추가' 버튼으로 등록해보세요.</div>`;

      return `
        <div class="meal-log-card">
          <div class="meal-log-card-header">
            <div class="meal-log-card-title-wrap">
              <span class="meal-log-icon">${m.icon}</span>
              <h3 class="meal-log-name">${m.name} 식단</h3>
              <span class="meal-log-cal-total">${sectionCal.toLocaleString()} kcal</span>
            </div>
            <button class="btn btn-secondary btn-sm" onclick="app.openAddMealModal('${m.name}')">
              + ${m.name} 추가
            </button>
          </div>
          <div class="meal-log-items-list">
            ${itemsHtml}
          </div>
        </div>
      `;
    }).join('');
  }

  renderRecordItemHtml(r) {
    const mealClass = r.mealType === '아침' ? 'morning' :
                      r.mealType === '점심' ? 'lunch' :
                      r.mealType === '저녁' ? 'dinner' : 'snack';

    const displayPhoto = r.customPhotoUrl || r.imageUrl;

    return `
      <div class="food-record-item" data-id="${r.id}">
        <div class="record-main">
          <img 
            src="${displayPhoto}" 
            alt="${r.name}" 
            class="record-thumb" 
            onerror="handleFoodImgError(this, '${r.foodId || ''}', '${r.name || ''}', '${r.category || ''}');"
          >
          <div class="record-meta">
            <div class="record-header-row">
              <span class="record-meal-badge ${mealClass}">${r.mealType}</span>
              <strong class="record-name">${r.name}</strong>
              <span class="record-portion">${r.portionText}</span>
            </div>
            <div class="record-nutrition-pills">
              <span>탄수화물 ${r.carbs}g</span>
              <span>단백질 ${r.protein}g</span>
              <span>지방 ${r.fat}g</span>
            </div>
            ${r.memo ? `<span class="record-memo">📝 ${this.escapeHtml(r.memo)}</span>` : ''}
          </div>
        </div>

        <div class="record-right">
          <div class="record-cal-box">
            <div class="record-cal-val">${r.calories.toLocaleString()}</div>
            <div class="record-cal-unit">kcal</div>
          </div>
          <button class="btn-delete-record" onclick="app.deleteRecord('${r.id}')" title="기록 삭제">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
              <line x1="10" y1="11" x2="10" y2="17"></line>
              <line x1="14" y1="11" x2="14" y2="17"></line>
            </svg>
          </button>
        </div>
      </div>
    `;
  }

  // --------------------------------------------------------------------------
  // 3. 영양 통계 (Nutrition Stats) 렌더링
  // --------------------------------------------------------------------------
  renderStatsView() {
    this.renderWeeklyBarChart();
    this.renderMacroDonutChart();
    this.renderMealDistributionBars();
  }

  // 최근 7일간 섭취 칼로리 바 차트 (Pure CSS/SVG)
  renderWeeklyBarChart() {
    const container = document.getElementById('weekly-bar-chart');
    if (!container) return;

    // 기준 날짜(selectedDate) 기준 최근 7일 날짜 배열 생성
    const days = [];
    const [y, m, d] = this.selectedDate.split('-').map(Number);
    const baseDate = new Date(y, m - 1, d);

    for (let i = 6; i >= 0; i--) {
      const dt = new Date(baseDate);
      dt.setDate(baseDate.getDate() - i);
      const strY = dt.getFullYear();
      const strM = String(dt.getMonth() + 1).padStart(2, '0');
      const strD = String(dt.getDate()).padStart(2, '0');
      const dateKey = `${strY}-${strM}-${strD}`;

      const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
      days.push({
        date: dateKey,
        label: `${strM}/${strD} (${dayNames[dt.getDay()]})`,
        isToday: dateKey === this.getTodayDateString(),
        calories: 0,
        recordCount: 0
      });
    }

    // 각 날짜별 총 칼로리 집계
    this.records.forEach(r => {
      const match = days.find(d => d.date === r.date);
      if (match) {
        match.calories += r.calories;
        match.recordCount += 1;
      }
    });

    const maxChartCal = 2800; // 차트 최고 기준점 (2,800 kcal)
    const targetCal = NUTRITION_TARGETS.dailyCalories;

    // 바 HTML 생성
    container.innerHTML = days.map(day => {
      const heightPercent = Math.min(Math.round((day.calories / maxChartCal) * 100), 100);
      const isOver = day.calories > targetCal;
      const isZero = day.calories === 0;

      return `
        <div class="chart-bar-group" onclick="app.setDate('${day.date}')" style="cursor: pointer;" title="${day.label}: ${day.calories} kcal">
          <div class="bar-tooltip">${day.calories > 0 ? `${day.calories} kcal` : ''}</div>
          <div 
            class="chart-bar ${isOver ? 'over' : ''} ${isZero ? 'empty' : ''}" 
            style="height: ${Math.max(heightPercent, 4)}%;"
          ></div>
          <span class="bar-date-label ${day.isToday ? 'today' : ''}">${day.label}</span>
        </div>
      `;
    }).join('');

    // 메트릭 집계
    const daysWithData = days.filter(d => d.calories > 0);
    const avgCal = daysWithData.length > 0 
      ? Math.round(days.reduce((acc, d) => acc + d.calories, 0) / 7) 
      : 0;
    
    let maxDay = { calories: 0, label: '-' };
    days.forEach(d => {
      if (d.calories > maxDay.calories) maxDay = d;
    });

    const achieveCount = days.filter(d => d.calories >= targetCal * 0.8 && d.calories <= targetCal * 1.15).length;
    const totalWeeklyRecords = days.reduce((acc, d) => acc + d.recordCount, 0);

    const elAvg = document.getElementById('metric-avg-cal');
    const elMax = document.getElementById('metric-max-day');
    const elAchieve = document.getElementById('metric-achieve-days');
    const elTotalRec = document.getElementById('metric-total-records');

    if (elAvg) elAvg.textContent = `${avgCal.toLocaleString()} kcal`;
    if (elMax) elMax.textContent = maxDay.calories > 0 ? `${maxDay.label}` : '-';
    if (elAchieve) elAchieve.textContent = `${achieveCount}일`;
    if (elTotalRec) elTotalRec.textContent = `${totalWeeklyRecords}건`;
  }

  // 탄단지 3대 영양소 도넛 차트 (Pure SVG)
  renderMacroDonutChart() {
    const dayRecords = this.records.filter(r => r.date === this.selectedDate);

    let totalCarbs = 0, totalProtein = 0, totalFat = 0, totalCal = 0;
    dayRecords.forEach(r => {
      totalCarbs += r.carbs;
      totalProtein += r.protein;
      totalFat += r.fat;
      totalCal += r.calories;
    });

    // 탄수화물(4kcal/g), 단백질(4kcal/g), 지방(9kcal/g) 기준 에너지 비율 계산
    const carbKcal = totalCarbs * 4;
    const proteinKcal = totalProtein * 4;
    const fatKcal = totalFat * 9;
    const macroKcalSum = carbKcal + proteinKcal + fatKcal;

    let carbPct = 0, proteinPct = 0, fatPct = 0;
    if (macroKcalSum > 0) {
      carbPct = Math.round((carbKcal / macroKcalSum) * 100);
      proteinPct = Math.round((proteinKcal / macroKcalSum) * 100);
      fatPct = 100 - carbPct - proteinPct; // 총합 100% 보정
    }

    // 도넛 둘레: 2 * Math.PI * 60 = 376.99
    const circumference = 376.99;
    const carbSegment = document.getElementById('donut-carb');
    const proteinSegment = document.getElementById('donut-protein');
    const fatSegment = document.getElementById('donut-fat');
    const donutCal = document.getElementById('donut-center-cal');

    if (donutCal) donutCal.textContent = totalCal.toLocaleString();

    if (macroKcalSum === 0) {
      // 데이터 없을 때 회색 도넛 표시
      if (carbSegment) {
        carbSegment.style.strokeDasharray = `0 ${circumference}`;
        carbSegment.style.strokeDashoffset = '0';
      }
      if (proteinSegment) {
        proteinSegment.style.strokeDasharray = `0 ${circumference}`;
        proteinSegment.style.strokeDashoffset = '0';
      }
      if (fatSegment) {
        fatSegment.style.strokeDasharray = `${circumference} 0`;
        fatSegment.style.strokeDashoffset = '0';
        fatSegment.style.stroke = '#E2E8F0';
      }
    } else {
      const carbLength = (carbPct / 100) * circumference;
      const proteinLength = (proteinPct / 100) * circumference;
      const fatLength = (fatPct / 100) * circumference;

      if (carbSegment) {
        carbSegment.style.stroke = 'var(--carb-color)';
        carbSegment.style.strokeDasharray = `${carbLength} ${circumference - carbLength}`;
        carbSegment.style.strokeDashoffset = '0';
      }
      if (proteinSegment) {
        proteinSegment.style.stroke = 'var(--protein-color)';
        proteinSegment.style.strokeDasharray = `${proteinLength} ${circumference - proteinLength}`;
        proteinSegment.style.strokeDashoffset = `-${carbLength}`;
      }
      if (fatSegment) {
        fatSegment.style.stroke = 'var(--fat-color)';
        fatSegment.style.strokeDasharray = `${fatLength} ${circumference - fatLength}`;
        fatSegment.style.strokeDashoffset = `-${carbLength + proteinLength}`;
      }
    }

    // 레전드 수치 갱신
    const elCarbPct = document.getElementById('legend-carb-pct');
    const elCarbG = document.getElementById('legend-carb-g');
    const elProteinPct = document.getElementById('legend-protein-pct');
    const elProteinG = document.getElementById('legend-protein-g');
    const elFatPct = document.getElementById('legend-fat-pct');
    const elFatG = document.getElementById('legend-fat-g');

    if (elCarbPct) elCarbPct.textContent = `${carbPct}%`;
    if (elCarbG) elCarbG.textContent = `${Math.round(totalCarbs)}g`;
    if (elProteinPct) elProteinPct.textContent = `${proteinPct}%`;
    if (elProteinG) elProteinG.textContent = `${Math.round(totalProtein)}g`;
    if (elFatPct) elFatPct.textContent = `${fatPct}%`;
    if (elFatG) elFatG.textContent = `${Math.round(totalFat)}g`;
  }

  // 식사 시간대별 칼로리 분포 바
  renderMealDistributionBars() {
    const dayRecords = this.records.filter(r => r.date === this.selectedDate);

    const mealCal = { '아침': 0, '점심': 0, '저녁': 0, '간식': 0 };
    let totalCal = 0;

    dayRecords.forEach(r => {
      if (mealCal[r.mealType] !== undefined) {
        mealCal[r.mealType] += r.calories;
        totalCal += r.calories;
      }
    });

    const updateDistItem = (type, key) => {
      const cal = mealCal[type];
      const pct = totalCal > 0 ? Math.round((cal / totalCal) * 100) : 0;

      const elCal = document.getElementById(`stats-meal-cal-${key}`);
      const elPct = document.getElementById(`stats-meal-pct-${key}`);
      const elBar = document.getElementById(`stats-meal-bar-${key}`);

      if (elCal) elCal.textContent = cal.toLocaleString();
      if (elPct) elPct.textContent = `${pct}%`;
      if (elBar) elBar.style.width = `${pct}%`;
    };

    updateDistItem('아침', 'breakfast');
    updateDistItem('점심', 'lunch');
    updateDistItem('저녁', 'dinner');
    updateDistItem('간식', 'snack');
  }

  // --------------------------------------------------------------------------
  // 발표 시연용 7일 샘플 데이터 생성 & 초기화
  // --------------------------------------------------------------------------
  loadSampleData() {
    const sampleFoods = [
      { id: 'bibimbap', name: '비빔밥', category: '밥류', portion: 1.0, portionText: '1인분', cal: 550, c: 85, p: 18, f: 15, meal: '점심' },
      { id: 'kimchi-jjigae', name: '김치찌개', category: '찌개/국', portion: 1.0, portionText: '1인분', cal: 300, c: 18, p: 16, f: 18, meal: '아침' },
      { id: 'bulgogi', name: '불고기', category: '고기류', portion: 1.5, portionText: '1.5인분 (곱빼기)', cal: 600, c: 33, p: 48, f: 30, meal: '저녁' },
      { id: 'tteokbokki', name: '떡볶이', category: '분식/면', portion: 0.5, portionText: '0.5인분', cal: 200, c: 41, p: 4, f: 2, meal: '간식' },
      { id: 'gimbap', name: '김밥', category: '밥류', portion: 1.0, portionText: '1줄', cal: 450, c: 70, p: 12, f: 13, meal: '점심' },
      { id: 'samgyeopsal', name: '삼겹살', category: '고기류', portion: 1.0, portionText: '1인분', cal: 650, c: 2, p: 30, f: 58, meal: '저녁' },
      { id: 'doenjang-jjigae', name: '된장찌개', category: '찌개/국', portion: 1.0, portionText: '1인분', cal: 250, c: 16, p: 14, f: 14, meal: '아침' },
      { id: 'jeyuk-bokkeum', name: '제육볶음', category: '고기류', portion: 1.0, portionText: '1인분', cal: 450, c: 20, p: 30, f: 28, meal: '점심' },
      { id: 'naengmyeon', name: '냉면', category: '분식/면', portion: 1.0, portionText: '1인분', cal: 500, c: 95, p: 14, f: 6, meal: '점심' },
      { id: 'ramen', name: '라면', category: '분식/면', portion: 1.0, portionText: '1인분', cal: 500, c: 78, p: 10, f: 16, meal: '간식' }
    ];

    const newRecords = [];
    const [y, m, d] = this.selectedDate.split('-').map(Number);
    const baseDate = new Date(y, m - 1, d);

    // 최근 7일 동안 매일 3~4개씩 실제같은 식단 기록 생성
    for (let i = 6; i >= 0; i--) {
      const dt = new Date(baseDate);
      dt.setDate(baseDate.getDate() - i);
      const strY = dt.getFullYear();
      const strM = String(dt.getMonth() + 1).padStart(2, '0');
      const strD = String(dt.getDate()).padStart(2, '0');
      const dateKey = `${strY}-${strM}-${strD}`;

      // 요일별 변화 있는 식단 조합
      const dayMeals = [
        sampleFoods[(i * 2) % sampleFoods.length],
        sampleFoods[(i * 3 + 1) % sampleFoods.length],
        sampleFoods[(i * 4 + 2) % sampleFoods.length]
      ];

      // 주말 또는 특정일에 간식 추가
      if (i % 2 === 0) {
        dayMeals.push(sampleFoods[3]);
      }

      dayMeals.forEach((item, idx) => {
        const fullFood = FOOD_DATABASE.find(f => f.id === item.id) || FOOD_DATABASE[0];
        newRecords.push({
          id: `sample_${dateKey}_${idx}`,
          foodId: fullFood.id,
          name: fullFood.name,
          category: fullFood.category,
          portion: item.portion,
          portionText: item.portionText,
          calories: item.cal,
          carbs: item.c,
          protein: item.p,
          fat: item.f,
          mealType: item.meal,
          date: dateKey,
          timestamp: dt.getTime() + (idx * 3600000 * 4),
          imageUrl: fullFood.imageUrl,
          customPhotoUrl: null,
          memo: i === 0 ? '추천 균형 식단' : ''
        });
      });
    }

    this.records = newRecords;
    this.saveRecords();
    this.renderAllViews();
    this.showToast('최근 7일간의 샘플 식단 데이터가 성공적으로 생성되었습니다!', 'success');
  }

  clearAllRecords() {
    if (confirm('모든 식단 기록을 삭제하고 초기화하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
      this.records = [];
      this.saveRecords();
      this.renderAllViews();
      this.showToast('모든 기록이 초기화되었습니다.', 'danger');
    }
  }

  // --------------------------------------------------------------------------
  // 부가 UI 유틸리티 (토스트, SVG 폴백, HTML escape)
  // --------------------------------------------------------------------------
  showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
      <span>${this.escapeHtml(message)}</span>
    `;

    container.appendChild(toast);

    setTimeout(() => {
      toast.classList.add('fade-out');
      setTimeout(() => toast.remove(), 300);
    }, 3200);
  }

  escapeHtml(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  getPastelFallback(foodId, foodName, category) {
    return generatePastelFallbackSvg(foodId, foodName, category);
  }

  generateFallbackSvg(foodName, category) {
    return generatePastelFallbackSvg(null, foodName, category);
  }
}

// 애플리케이션 싱글톤 인스턴스 생성
let app;
document.addEventListener('DOMContentLoaded', () => {
  app = new FoodScanApp();
});
