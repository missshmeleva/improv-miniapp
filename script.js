const API_URL = "https://your-backend.com"; // Замени на свой
(function () {
  const tg = window.Telegram ? window.Telegram.WebApp : null;

  // Theme sync from Telegram
  function applyTheme(params) {
    const css = document.documentElement.style;
    if (!params) return;
    if (params.bg_color) css.setProperty('--bg', params.bg_color);
    if (params.text_color) css.setProperty('--text', params.text_color);
    if (params.hint_color) css.setProperty('--muted', params.hint_color);
    if (params.secondary_bg_color) css.setProperty('--card', params.secondary_bg_color);
    if (params.link_color) css.setProperty('--accent', params.link_color);
  }

  function applyBrandButtons(colorScheme) {
    const css = document.documentElement.style;
    if (colorScheme === 'dark') {
      css.setProperty('--btn-bg', 'var(--primary)');
      css.setProperty('--btn-text', '#111827');
    } else {
      css.setProperty('--btn-bg', '#50534F');
      css.setProperty('--btn-text', '#ffffff');
    }
  }

  // Simple local generator (без привязки к бэку)
  let DATA = null; // будет загружено из data.json

  function random(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

  function generateIdea() {
    if (!DATA) return 'Загрузка…';
    return `${random(DATA['Зачины'])} · ${random(DATA['Локации'])} · ${random(DATA['Персонажи'])}`;
  }

  function init() {
    const ideaEl = document.getElementById('idea');
    const menu = document.querySelector('.menu');

    if (tg) {
      tg.ready();
      tg.expand();
      applyTheme(tg.themeParams);
      applyBrandButtons(tg.colorScheme);
      tg.onEvent('themeChanged', () => {
        applyTheme(tg.themeParams);
        applyBrandButtons(tg.colorScheme);
      });

      tg.MainButton.setText('Закрыть');
      tg.MainButton.show();
      tg.onEvent('mainButtonClicked', () => tg.close());
    }

    // Обработчики меню
    menu.addEventListener('click', (e) => {
      const target = e.target.closest('.menu-btn');
      if (!target) return;
      const category = target.getAttribute('data-category');
      const action = target.getAttribute('data-action');
      if (action === 'random_scene') {
        ideaEl.textContent = generateIdea();
        tg?.HapticFeedback?.impactOccurred('light');
        return;
      }
      if (category && DATA && DATA[category]) {
        ideaEl.textContent = `${category}: ${random(DATA[category])}`;
        tg?.HapticFeedback?.selectionChanged();
      }
    });

    // Загрузка данных из data.json (сгенерирован из data.py)
    fetch('./data.json', { cache: 'no-store' })
      .then((r) => r.json())
      .then((json) => {
        DATA = json;
      })
      .catch(() => {
        // Фолбэк на небольшой набор, если файл недоступен
        DATA = {
          'Локации': ['Замок', 'Лес', 'Город', 'Дом', 'Школа'],
          'Персонажи': ['Бизнесмен', 'Врач', 'Художник', 'Повар'],
          'Предметы': ['Телефон', 'Портфель', 'Ключи'],
          'Эмоции': ['Радость', 'Печаль', 'Злость', 'Страх'],
          'Ситуации': ['Предложение', 'Праздник', 'Авария'],
          'Зачины': ['У тебя есть товар?', 'Ты уверен в этом?', 'Это ограбление!']
        };
      });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

let currentItemKey = null;
let currentCategory = null;

const tg = window.Telegram.WebApp;
tg.ready();
tg.expand();

function showMenu() {
  document.getElementById("menu").classList.remove("hidden");
  document.getElementById("result").classList.add("hidden");
}

function showResult(data) {
  document.getElementById("menu").classList.add("hidden");
  document.getElementById("result").classList.remove("hidden");
  document.getElementById("category").textContent = data.category;
  document.getElementById("name").textContent = data.name;

  currentItemKey = data.item_key;
  currentCategory = data.category;

  const anotherBtn = document.getElementById("another-btn");
  anotherBtn.onclick = () => {
    if (currentCategory) {
      openCategory(currentCategory);
    } else {
      getRandomScene();
    }
  };
}

async function getRandomScene() {
  const res = await fetch(`${API_URL}/random-scene`);
  const data = await res.json();
  showResult(data);
}

async function openCategory(cat) {
  const res = await fetch(`${API_URL}/category/${cat}`);
  const data = await res.json();
  showResult(data);
}

// Показать меню при старте
showMenu();
