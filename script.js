/* Mini App logic */
(function () {
  const tg = window.Telegram ? window.Telegram.WebApp : null;

  let categories = null; // данные для основных кнопок
  let characterGroups = null; // подкатегории персонажей
  const ideaEl = document.getElementById('idea');
  const menu = document.querySelector('.menu');
  const characterSubmenu = document.getElementById('character-submenu');

  const CHARACTER_ATTRS = [
    { key: 'Какой?', label: '🧠 Какой?' },
    { key: 'Профессии', label: '💼 Профессии' },
    { key: 'Отношения', label: '❤️ Отношения' }
  ];

  const CHARACTER_ROLES = [
    { key: 'Звëзды TV', label: '⭐ Звëзды TV' },
    { key: 'Персонажи: комиксы и TV', label: '🎬 Персонажи: комиксы и TV' },
    { key: 'Персонажи: мультфильмов', label: '🎨 Персонажи: мультфильмов' },
    { key: 'Персонажи: литературы', label: '📚 Персонажи: литературы' }
  ];

  const CHARACTER_ORDER = [...CHARACTER_ATTRS, ...CHARACTER_ROLES];

  function getAvailableCharacterGroups() {
    if (!characterGroups) return [];
    return CHARACTER_ORDER.filter(({ key }) => Array.isArray(characterGroups[key]) && characterGroups[key].length);
  }

  function applyTheme(params) {
    const css = document.documentElement.style;
    if (!params) return;
    if (params.bg_color) css.setProperty('--bg', params.bg_color);
    if (params.text_color) css.setProperty('--text', params.text_color);
    if (params.hint_color) css.setProperty('--muted', params.hint_color);
    if (params.secondary_bg_color) css.setProperty('--card', params.secondary_bg_color);
    if (params.link_color) css.setProperty('--accent', params.link_color);
  }

  function applyBrandButtons() {
    const css = document.documentElement.style;
    css.setProperty('--btn-bg', 'var(--primary)');
    css.setProperty('--btn-text', '#111827');
    css.setProperty('--subtitle', '#50534F');
  }

  function random(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  function setIdeaPlain(text) {
    ideaEl.textContent = text;
  }

  function setIdeaResult(label, value) {
    ideaEl.innerHTML = `<strong>${label}</strong>: ${value}`;
  }

  const SCENE_MAPPING = [
    ['Зачины', 'Зачин'],
    ['Локации', 'Локация'],
    ['Персонажи', 'Персонаж'],
    ['Предметы', 'Предмет'],
    ['Эмоции', 'Эмоция'],
    ['Ситуации', 'Ситуация'],
    ['Жанры', 'Жанр']
  ];

  function generateSceneParts() {
    if (!categories) return null;
    const available = SCENE_MAPPING.filter(([key]) => Array.isArray(categories[key]) && categories[key].length);
    if (!available.length) return [];
    const maxCount = available.length;
    const count = Math.max(1, Math.floor(Math.random() * maxCount) + 1);
    const selected = shuffle(available).slice(0, count);
    return selected.map(([key, label]) => ({ label, value: random(categories[key]) }));
  }

  function showRandomScene() {
    const parts = generateSceneParts();
    if (!parts) {
      setIdeaPlain('Загрузка…');
      return;
    }
    ideaEl.innerHTML = parts
      .map(({ label, value }) => `<strong>${label}</strong>: ${value}`)
      .join('<br>');
  }

  function renderCharacterSubmenu() {
    if (!characterSubmenu) return;
    if (!characterGroups) {
      characterSubmenu.innerHTML = `<p class="submenu-placeholder">Загрузка…</p>`;
      return;
    }

    const available = CHARACTER_ORDER.filter(({ key }) => Array.isArray(characterGroups[key]) && characterGroups[key].length);
    const singleKey = 'Отношения';
    const singleItem = available.find(({ key }) => key === singleKey);
    const restItems = available.filter(({ key }) => key !== singleKey);

    const restButtons = restItems
      .map(({ key, label }) => `<button class="menu-btn" data-subcategory="${key}">${label}</button>`)
      .join('');

    characterSubmenu.innerHTML = `
      ${singleItem ? `<div class="menu-row"><button class="menu-btn" data-subcategory="${singleItem.key}">${singleItem.label}</button></div>` : ''}
      ${restButtons ? `<div class="menu-grid submenu-grid">${restButtons}</div>` : ''}
    `;
  }

  function init() {
    if (tg) {
      tg.ready();
      tg.expand();
      applyTheme(tg.themeParams);
      applyBrandButtons();
      tg.onEvent('themeChanged', () => {
        applyTheme(tg.themeParams);
        applyBrandButtons();
      });

      tg.MainButton.setText('Закрыть');
      tg.MainButton.show();
      tg.onEvent('mainButtonClicked', () => tg.close());
    }

    menu.addEventListener('click', (e) => {
      const target = e.target.closest('.menu-btn');
      if (!target) return;
      const category = target.dataset.category;
      const action = target.dataset.action;

      if (action === 'random_scene') {
        showRandomScene();
        tg?.HapticFeedback?.impactOccurred('light');
        return;
      }

      if (category === 'Персонажи') {
        const combination = getCharacterCombination();
        if (combination) {
          ideaEl.innerHTML = combination.map(({ label, value }) => `<strong>${label}</strong>: ${value}`).join('<br>');
          tg?.HapticFeedback?.selectionChanged();
        } else {
          setIdeaPlain('Нет данных по персонажам');
        }
        return;
      }

      if (category && categories && categories[category]) {
        setIdeaResult(category, random(categories[category]));
        tg?.HapticFeedback?.selectionChanged();
      }
    });

    characterSubmenu?.addEventListener('click', (e) => {
      const target = e.target.closest('.menu-btn');
      if (!target) return;
      const subcategory = target.dataset.subcategory;
      if (subcategory && characterGroups && characterGroups[subcategory]) {
        setIdeaResult(subcategory, random(characterGroups[subcategory]));
        tg?.HapticFeedback?.selectionChanged();
      }
    });

    fetch('./data.json', { cache: 'no-store' })
      .then((r) => r.json())
      .then((json) => {
        categories = json.categories;
        characterGroups = json.characterGroups;
        renderCharacterSubmenu();
      })
      .catch(() => {
        categories = {
          'Локации': ['Замок', 'Лес', 'Город', 'Дом', 'Школа'],
          'Персонажи': ['Бизнесмен', 'Врач', 'Художник', 'Повар'],
          'Предметы': ['Телефон', 'Портфель', 'Ключи'],
          'Эмоции': ['Радость', 'Печаль', 'Злость', 'Страх'],
          'Ситуации': ['Предложение', 'Праздник', 'Авария'],
          'Жанры': ['Фантастика', 'Фэнтези', 'Комедия'],
          'Зачины': ['У тебя есть товар?', 'Ты уверен в этом?', 'Это ограбление!']
        };
        characterGroups = {
          'Отношения': ['Брат и сестра', 'Соседи', 'Коллеги'],
          'Профессии': ['Бизнесмен', 'Врач', 'Художник', 'Повар'],
          'Персонажи: фильмы, комиксы, сериалы': ['Шерлок Холмс', 'Бэтмен', 'Нео'],
          'Персонажи: мультфильмов': ['Шрек', 'Чебурашка', 'Спанч Боб'],
          'Персонажи: литературы': ['Гарри Поттер', 'Анна Каренина', 'Дон Кихот']
        };
        renderCharacterSubmenu();
      });
  }

  function getCharacterCombination() {
    if (!characterGroups) return null;
    
    const result = [];
    
    // Берём случайно из атрибутов (Какой?, Профессии, Отношения)
    const availableAttrs = CHARACTER_ATTRS.filter(({ key }) => Array.isArray(characterGroups[key]) && characterGroups[key].length);
    const attrCount = Math.floor(Math.random() * (availableAttrs.length + 1));
    const selectedAttrs = shuffle(availableAttrs).slice(0, attrCount);
    selectedAttrs.forEach(({ key, label }) => {
      result.push({ label, value: random(characterGroups[key]) });
    });
    
    // Добавляем одну из ролей (Звёзды TV, Персонажи: комиксы и TV и т.д.)
    const availableRoles = CHARACTER_ROLES.filter(({ key }) => Array.isArray(characterGroups[key]) && characterGroups[key].length);
    if (availableRoles.length) {
      const pickedRole = availableRoles[Math.floor(Math.random() * availableRoles.length)];
      result.push({ label: pickedRole.label, value: random(characterGroups[pickedRole.key]) });
    }
    
    return result.length ? result : null;
  }

  function shuffle(arr) {
    const copy = [...arr];
    for (let i = copy.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  renderCharacterSubmenu();
})();