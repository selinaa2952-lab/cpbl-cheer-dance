let songsData = [];
let songModalInstance = null;

const STORAGE_ADMIN_KEY = 'cpbl_dance_studio_admin_db';

const TEAM_NAMES = {
  fubon: '富邦悍將',
  uni: '統一 7-ELEVEN 獅',
  brothers: '中信兄弟'
};

// 強化版 YouTube 網址解析器（支援 Shorts、Live、youtu.be、embed）
function extractYouTubeID(urlOrId) {
  if (!urlOrId) return '';
  const trimmed = urlOrId.trim();
  
  // 已經是 11 碼 ID
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }
  
  const regExp = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?|shorts)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i;
  const match = trimmed.match(regExp);
  return match ? match[1] : '';
}

// 載入資料
async function loadAdminData() {
  const localData = localStorage.getItem(STORAGE_ADMIN_KEY);
  if (localData) {
    try {
      songsData = JSON.parse(localData);
    } catch {
      await fetchOriginalJSON();
    }
  } else {
    await fetchOriginalJSON();
  }
  renderTable();
}

async function fetchOriginalJSON() {
  try {
    const res = await fetch('data/songs.json');
    songsData = await res.json();
    localStorage.setItem(STORAGE_ADMIN_KEY, JSON.stringify(songsData));
  } catch (e) {
    console.error(e);
    songsData = [];
  }
}

// 渲染清單
function renderTable() {
  const tbody = document.getElementById('songs-table-body');
  const search = document.getElementById('filter-search').value.toLowerCase().trim();
  const teamFilter = document.getElementById('filter-team').value;
  const statusFilter = document.getElementById('filter-status').value;

  const filtered = songsData.filter(s => {
    const matchSearch = s.title.toLowerCase().includes(search) || s.teamName.toLowerCase().includes(search);
    const matchTeam = (teamFilter === 'ALL') || (s.team === teamFilter);
    const hasVideo = s.youtubeId && s.youtubeId.trim() !== '';
    let matchStatus = true;
    if (statusFilter === 'MISSING') matchStatus = !hasVideo;
    if (statusFilter === 'HAS_VIDEO') matchStatus = hasVideo;

    return matchSearch && matchTeam && matchStatus;
  });

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" class="text-center py-4 text-secondary">查無相符歌曲</td></tr>`;
    return;
  }

  tbody.innerHTML = filtered.map(s => {
    const hasYT = s.youtubeId && s.youtubeId.trim() !== '';
    const ytDisplay = hasYT 
      ? `<a href="https://youtu.be/${s.youtubeId}" target="_blank" class="text-info text-decoration-none small">
           <i class="bi bi-play-circle-fill text-danger me-1"></i><code>${s.youtubeId}</code>
         </a>`
      : `<span class="badge bg-warning text-dark">待補影片</span>`;

    return `
      <tr>
        <td><span class="badge bg-secondary bg-opacity-50">${s.teamName}</span></td>
        <td>
          <div class="fw-bold text-white">${s.title}</div>
          <div class="small text-secondary">${s.type || s.category}</div>
        </td>
        <td><span class="badge bg-dark border border-secondary">${s.category}</span></td>
        <td>${ytDisplay}</td>
        <td class="text-end">
          <button class="btn btn-sm btn-outline-primary me-1" onclick="editSong('${s.id}')">
            <i class="bi bi-pencil"></i> 編輯
          </button>
          <button class="btn btn-sm btn-outline-danger" onclick="deleteSong('${s.id}')">
            <i class="bi bi-trash"></i>
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

// 監聽 YouTube 輸入並預覽（加入 referrerpolicy 與 origin 防呆）
function handleYoutubeInput(val) {
  const ytId = extractYouTubeID(val);
  const codeEl = document.getElementById('parsed-yt-id');
  const preview = document.getElementById('modal-video-preview');
  const extLink = document.getElementById('preview-external-link');

  if (ytId) {
    codeEl.textContent = ytId;
    extLink.href = `https://www.youtube.com/watch?v=${ytId}`;
    extLink.classList.remove('d-none');
    preview.classList.remove('d-none');
    
    // 解決 Error 153 的關鍵參數配置
    preview.innerHTML = `
      <iframe 
        src="https://www.youtube-nocookie.com/embed/${ytId}?enablejsapi=1&origin=${encodeURIComponent(window.location.origin)}" 
        referrerpolicy="strict-origin-when-cross-origin"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
        allowfullscreen>
      </iframe>
    `;
  } else {
    codeEl.textContent = '無';
    extLink.classList.add('d-none');
    preview.classList.add('d-none');
    preview.innerHTML = '';
  }
}

// 開啟彈窗
function openSongModal(song = null) {
  if (!songModalInstance) {
    songModalInstance = new bootstrap.Modal(document.getElementById('songModal'));
  }

  const form = document.getElementById('songForm');
  form.reset();
  handleYoutubeInput('');

  if (song) {
    document.getElementById('modalTitle').textContent = '編輯應援曲：' + song.title;
    document.getElementById('edit-original-id').value = song.id;
    document.getElementById('form-id').value = song.id;
    document.getElementById('form-team').value = song.team;
    document.getElementById('form-title').value = song.title;
    document.getElementById('form-category').value = song.category || '攻擊應援';
    document.getElementById('form-difficulty').value = song.difficulty || 3;
    document.getElementById('form-year').value = song.year || 2026;
    document.getElementById('form-description').value = song.description || '';

    if (song.youtubeId) {
      document.getElementById('form-youtube-input').value = song.youtubeId;
      handleYoutubeInput(song.youtubeId);
    }
  } else {
    document.getElementById('modalTitle').textContent = '快速新增應援曲';
    document.getElementById('edit-original-id').value = '';
    document.getElementById('form-id').value = '';
    document.getElementById('form-year').value = 2026;
    document.getElementById('form-difficulty').value = 3;
  }

  songModalInstance.show();
}

function editSong(id) {
  const song = songsData.find(s => s.id === id);
  if (song) openSongModal(song);
}

function deleteSong(id) {
  const song = songsData.find(s => s.id === id);
  if (!song) return;
  if (confirm(`確定刪除「${song.title}」？`)) {
    songsData = songsData.filter(s => s.id !== id);
    saveToStorage();
  }
}

// 儲存歌曲（自動組裝 ID 與預設屬性）
function saveSongForm() {
  const origId = document.getElementById('edit-original-id').value;
  const team = document.getElementById('form-team').value;
  const title = document.getElementById('form-title').value.trim();
  const category = document.getElementById('form-category').value;
  const ytInput = document.getElementById('form-youtube-input').value;
  const ytId = extractYouTubeID(ytInput);
  
  const difficulty = parseInt(document.getElementById('form-difficulty').value, 10) || 3;
  const year = parseInt(document.getElementById('form-year').value, 10) || 2026;
  const description = document.getElementById('form-description').value.trim() || `${year} ${TEAM_NAMES[team]} ${title}`;

  if (!title) {
    alert('請輸入歌曲名稱！');
    return;
  }

  // 自動生成 ID（若為新歌曲）
  const id = origId || `${team}-${Date.now().toString().slice(-6)}`;

  const songObj = {
    id,
    team,
    teamName: TEAM_NAMES[team],
    title,
    year,
    category,
    type: category === '年度主題' ? '年度主題曲' : category,
    difficulty,
    youtubeId: ytId,
    official: false,
    playerSong: false,
    featured: category === '2026最新',
    description
  };

  if (origId) {
    const idx = songsData.findIndex(s => s.id === origId);
    if (idx !== -1) songsData[idx] = { ...songsData[idx], ...songObj };
  } else {
    songsData.unshift(songObj);
  }

  saveToStorage();
  songModalInstance.hide();
}

function saveToStorage() {
  localStorage.setItem(STORAGE_ADMIN_KEY, JSON.stringify(songsData));
  renderTable();
}

function exportJSON() {
  const jsonStr = JSON.stringify(songsData, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'songs.json';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

async function resetToInitial() {
  if (confirm('確定放棄暫存修改，還原回預設 songs.json 嗎？')) {
    localStorage.removeItem(STORAGE_ADMIN_KEY);
    await fetchOriginalJSON();
    renderTable();
  }
}

document.addEventListener('DOMContentLoaded', () => {
  loadAdminData();
  document.getElementById('filter-search').addEventListener('input', renderTable);
  document.getElementById('filter-team').addEventListener('change', renderTable);
  document.getElementById('filter-status').addEventListener('change', renderTable);
});