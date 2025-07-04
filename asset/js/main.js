const $ = (s) => document.querySelector(s);
const $$ = (s) => document.querySelectorAll(s);

const form = $('#add-palette-form');
const container = $('#palettes-container');
const toggleBtn = $('#toggle-dark-mode');
const tabs = $$('.tab');

let palettes = JSON.parse(localStorage.getItem('palettes')) || [];

// Tạo id duy nhất cho mỗi palette
const generateId = () => '_' + Math.random().toString(36).substr(2, 9);

const save = () => localStorage.setItem('palettes', JSON.stringify(palettes));

const applyDarkMode = () => {
  const isDark = document.body.classList.toggle('dark-mode');
  toggleBtn.textContent = isDark ? 'Tắt Dark Mode' : 'Bật Dark Mode';
  localStorage.setItem('darkMode', isDark);
};

const formatHex = (hex) => {
  hex = hex.replace(/^#/, '');
  if (hex.length === 3) hex = hex.split('').map((c) => c + c).join('');
  return `#${hex.toUpperCase()}`;
};

const displayPalettes = (filter = 'all') => {
  container.innerHTML = '';
  let filtered = palettes;
  if (filter === 'favorite') filtered = palettes.filter((p) => p.favorite);
  if (filter === 'frequently-used') {
    filtered = palettes
      .filter((p) => p.copyCounts?.some((c) => c > 0))
      .sort((a, b) => b.copyCounts.reduce((s, x) => s + x, 0) - a.copyCounts.reduce((s, x) => s + x, 0));
  }

  if (filtered.length === 0) {
    container.innerHTML = '<p style="text-align:center;opacity:0.6">Không có palette nào để hiển thị.</p>';
    return;
  }

  filtered.forEach((palette) => {
    const div = document.createElement('div');
    div.className = 'palette';
    div.innerHTML = `
      <div class="palette-header">
        <span class="palette-name" data-id="${palette.id}">${palette.name}</span>
        <div>
          <input type="checkbox" class="favorite-checkbox" data-id="${palette.id}" ${palette.favorite ? 'checked' : ''}>
          <button class="delete-btn" data-id="${palette.id}">&times;</button>
        </div>
      </div>
      <div class="colors">
        ${palette.colors.map((c, i) => `<div class="color" style="background:${c}" data-hex="${c}" data-id="${palette.id}" data-cidx="${i}"></div>`).join('')}
      </div>
    `;
    container.appendChild(div);
  });
  save();
};

const init = () => {
  if (localStorage.getItem('darkMode') === 'true') {
    document.body.classList.add('dark-mode');
    toggleBtn.textContent = 'Tắt Dark Mode';
  }
  displayPalettes();
};

form.addEventListener('submit', (e) => {
  e.preventDefault();
  const name = $('#palette-name').value.trim();
  const colors = [1, 2, 3, 4].map(i => {
    try {
      return formatHex($(`#color${i}`).value.trim());
    } catch {
      return null;
    }
  });
  const hexRegex = /^#[0-9A-F]{6}$/;
  if (!name || !colors.every(c => hexRegex.test(c))) {
    alert('Vui lòng nhập tên và mã màu hợp lệ.');
    return;
  }
  palettes.push({ id: generateId(), name, colors, favorite: false, copyCounts: [0, 0, 0, 0] });
  form.reset();
  displayPalettes($('.tab.active').dataset.tab);
});

container.addEventListener('click', (e) => {
  // Lấy id palette từ data-id
  const id = e.target.dataset.id;
  const paletteIdx = palettes.findIndex(p => p.id === id);

  if (e.target.classList.contains('delete-btn')) {
    if (paletteIdx !== -1 && confirm('Bạn có chắc chắn muốn xóa palette này không?')) {
      palettes.splice(paletteIdx, 1);
      displayPalettes($('.tab.active').dataset.tab);
    }
  }
  if (e.target.classList.contains('favorite-checkbox')) {
    if (paletteIdx !== -1) {
      palettes[paletteIdx].favorite = e.target.checked;
      save();
    }
  }
  if (e.target.classList.contains('palette-name')) {
    if (paletteIdx !== -1) {
      const input = document.createElement('input');
      input.value = palettes[paletteIdx].name;
      input.className = 'palette-name-input';
      input.addEventListener('blur', () => {
        if (input.value.trim()) palettes[paletteIdx].name = input.value.trim();
        displayPalettes($('.tab.active').dataset.tab);
      });
      input.addEventListener('keypress', (ev) => ev.key === 'Enter' && input.blur());
      e.target.replaceWith(input);
      input.focus();
    }
  }
  if (e.target.classList.contains('color')) {
    const cidx = e.target.dataset.cidx;
    const hex = e.target.dataset.hex;
    if (paletteIdx !== -1 && cidx !== undefined) {
      navigator.clipboard.writeText(hex);
      alert(`Đã copy: ${hex}`);
      palettes[paletteIdx].copyCounts[cidx]++;
      save();
      displayPalettes($('.tab.active').dataset.tab);
    }
  }
});

tabs.forEach((tab) => {
  tab.addEventListener('click', () => {
    tabs.forEach((t) => t.classList.remove('active'));
    tab.classList.add('active');
    displayPalettes(tab.dataset.tab);
  });
});

toggleBtn.addEventListener('click', applyDarkMode);

init();