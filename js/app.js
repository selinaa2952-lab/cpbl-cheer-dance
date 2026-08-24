// 全域球隊元數據
const TEAMS_META = {
  fubon: {
    name: '富邦悍將',
    enName: 'Fubon Guardians',
    cheerLeader: '應援團：Fubon Angels',
    bgClass: 'team-card-fubon'
  },
  uni: {
    name: '統一 7-ELEVEN 獅',
    enName: 'Uni-Lions',
    cheerLeader: '應援團：Uni-Girls',
    bgClass: 'team-card-uni'
  },
  brothers: {
    name: '中信兄弟',
    enName: 'CTBC Brothers',
    cheerLeader: '應援團：Passion Sisters',
    bgClass: 'team-card-brothers'
  }
};

// 取得所有歌曲資料
async function fetchSongs() {
  try {
    const res = await fetch('data/songs.json');
    if (!res.ok) throw new Error('無法讀取歌曲資料庫');
    return await res.json();
  } catch (error) {
    console.error(error);
    return [];
  }
}

// 收藏管理模組 (localStorage)
const Favorites = {
  STORAGE_KEY: 'cpbl_dance_studio_favorites',
  getAll() {
    try {
      return JSON.parse(localStorage.getItem(this.STORAGE_KEY)) || [];
    } catch {
      return [];
    }
  },
  isFavorite(songId) {
    return this.getAll().includes(songId);
  },
  toggle(songId) {
    let list = this.getAll();
    if (list.includes(songId)) {
      list = list.filter(id => id !== songId);
    } else {
      list.push(songId);
    }
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(list));
    return this.isFavorite(songId);
  }
};

// 渲染難度星星
function renderStars(count) {
  const fullStars = '★'.repeat(count);
  const emptyStars = '☆'.repeat(5 - count);
  return `${fullStars}${emptyStars}`;
}

// 產生標準卡片 HTML
function createSongCardHTML(song) {
  const isFav = Favorites.isFavorite(song.id);
  const favBtnText = isFav ? '<i class="bi bi-heart-fill text-white"></i> 已收藏' : '<i class="bi bi-heart"></i> 收藏';
  const favBtnClass = isFav ? 'btn-favorite active' : 'btn-favorite';
  
  // 縮圖處理：若有 youtubeId 則產生官方縮圖，若無則顯示待補佔位
  let mediaHTML = '';
  if (song.youtubeId && song.youtubeId.trim() !== '') {
    const thumbUrl = `https://img.youtube.com/vi/${song.youtubeId}/hqdefault.jpg`;
    mediaHTML = `<img src="${thumbUrl}" alt="${song.title}" class="song-thumbnail-img" loading="lazy">`;
  } else {
    mediaHTML = `
      <div class="no-video-placeholder">
        <i class="bi bi-play-circle fs-2 mb-1"></i>
        <span class="small">影片待補</span>
      </div>
    `;
  }

  return `
    <div class="col-12 col-md-6 col-lg-4" data-song-id="${song.id}">
      <div class="song-card">
        <a href="song.html?id=${song.id}" class="song-thumbnail-wrapper text-decoration-none">
          ${mediaHTML}
        </a>
        <div class="p-3 d-flex flex-column flex-grow-1">
          <div class="d-flex align-items-center justify-content-between mb-2">
            <span class="badge bg-secondary bg-opacity-50 text-light small">${song.teamName}</span>
            <span class="star-rating" title="難度 ${song.difficulty}/5">${renderStars(song.difficulty)}</span>
          </div>
          
          <h4 class="h5 fw-bold mb-1">
            <a href="song.html?id=${song.id}" class="text-white text-decoration-none">${song.title}</a>
          </h4>
          <p class="text-secondary small mb-3">${song.year} · ${song.type}</p>
          
          <div class="mt-auto pt-2 border-top border-secondary border-opacity-25 d-flex align-items-center justify-content-between">
            <button class="${favBtnClass}" onclick="handleToggleFavorite(event, '${song.id}')">
              ${favBtnText}
            </button>
            <a href="song.html?id=${song.id}" class="btn btn-sm btn-outline-primary rounded-pill px-3">
              觀看教學 <i class="bi bi-play-fill"></i>
            </a>
          </div>
        </div>
      </div>
    </div>
  `;
}

// 點擊收藏事件全域處理
function handleToggleFavorite(event, songId) {
  event.stopPropagation();
  event.preventDefault();
  Favorites.toggle(songId);
  
  // 若在首頁，即時刷新清單
  if (typeof initHomePageFavorites === 'function') {
    initHomePageFavorites();
  }
  
  // 局部更新被點擊按鈕的狀態
  const buttons = document.querySelectorAll(`[data-song-id="${songId}"] .btn-favorite`);
  const isFav = Favorites.isFavorite(songId);
  buttons.forEach(btn => {
    btn.className = isFav ? 'btn-favorite active' : 'btn-favorite';
    btn.innerHTML = isFav ? '<i class="bi bi-heart-fill text-white"></i> 已收藏' : '<i class="bi bi-heart"></i> 收藏';
  });
}

// 首頁邏輯初始化
async function initHomePage() {
  const latestContainer = document.getElementById('latest-songs-grid');
  if (!latestContainer) return;

  const songs = await fetchSongs();
  
  // 渲染 6 首測試歌曲至最新應援
  latestContainer.innerHTML = songs.map(song => createSongCardHTML(song)).join('');

  // 渲染收藏清單
  window.initHomePageFavorites = () => {
    const favContainer = document.getElementById('favorite-songs-grid');
    if (!favContainer) return;

    const favIds = Favorites.getAll();
    const favSongs = songs.filter(s => favIds.includes(s.id));

    if (favSongs.length === 0) {
      favContainer.innerHTML = `
        <div class="col-12">
          <div class="empty-state-box">
            <i class="bi bi-heartbreak fs-3 mb-2 d-block"></i>
            還沒有收藏任何應援舞，快去挑選喜歡的歌曲加入練習！
          </div>
        </div>
      `;
    } else {
      favContainer.innerHTML = favSongs.map(song => createSongCardHTML(song)).join('');
    }
  };

  initHomePageFavorites();
}

document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('latest-songs-grid')) {
    initHomePage();
  }
});