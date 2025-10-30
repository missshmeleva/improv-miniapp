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
    if (params.button_color) css.setProperty('--btn-bg', params.button_color);
    if (params.button_text_color) css.setProperty('--btn-text', params.button_text_color);
    if (params.link_color) css.setProperty('--accent', params.link_color);
  }

  // Simple local generator (без привязки к бэку)
  const openings = ['Неожиданная встреча', 'Секретная миссия', 'Потерянный предмет', 'Смена ролей'];
  const locations = ['Кафе', 'Аэропорт', 'Сцена театра', 'Больница', 'Поезд'];
  const characters = ['Бариста', 'Контролёр', 'Режиссёр', 'Адвокат', 'Провизор'];

  function random(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

  function generateIdea() {
    return `${random(openings)} · ${random(locations)} · ${random(characters)}`;
  }

  function init() {
    const ideaEl = document.getElementById('idea');
    const btn = document.getElementById('generate');

    if (tg) {
      tg.ready();
      tg.expand();
      applyTheme(tg.themeParams);
      tg.onEvent('themeChanged', () => applyTheme(tg.themeParams));

      tg.MainButton.setText('Закрыть');
      tg.MainButton.show();
      tg.onEvent('mainButtonClicked', () => tg.close());
    }

    btn.addEventListener('click', () => {
      ideaEl.textContent = generateIdea();
      if (tg && tg.HapticFeedback) {
        tg.HapticFeedback.impactOccurred('light');
      }
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