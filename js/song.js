document.addEventListener('DOMContentLoaded', async () => {
  const params = new URLSearchParams(window.location.search);
  const songId = params.get('id');

  const allSongs = await fetchSongs();
  const song = allSongs.find(s => s.id === songId);

  if (!song) {
    document.querySelector('main').innerHTML = `
      <div class="text-center py-5">
        <h2 class="h4">找不到該歌曲</h2>
        <a href="index.html" class="btn btn-primary mt-3">回首頁</a>
      </div>
    `;
    return;
  }

  // 設定資訊與頁面 Title
  document.title = `${song.title} - ${song.teamName} 應援舞教學 | 中職應援舞教室`;
  document.getElementById('nav-title').textContent = `返回 ${song.teamName}`;
  document.getElementById('back-link').href = `team.html?team=${song.team}`;

  document.getElementById('song-title').textContent = song.title;
  document.getElementById('song-team-badge').textContent = song.teamName;
  document.getElementById('song-type-badge').textContent = song.type;
  document.getElementById('song-difficulty').innerHTML = renderStars(song.difficulty);
  document.getElementById('song-year').textContent = song.year;
  document.getElementById('song-desc').textContent = song.description || '無詳細說明';

  // 16:9 YouTube Embed 播放邏輯（無自動播放）
  const videoContainer = document.getElementById('video-container');
  if (song.youtubeId && song.youtubeId.trim() !== '') {
    videoContainer.innerHTML = `
      <iframe 
        src="https://www.youtube.com/embed/${encodeURIComponent(song.youtubeId)}" 
        title="${song.title}" 
        allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
        allowfullscreen>
      </iframe>
    `;
  } else {
    videoContainer.innerHTML = `
      <div class="no-video-placeholder">
        <i class="bi bi-camera-video-off fs-1 mb-2"></i>
        <h3 class="h5">影片待補</h3>
        <p class="small text-secondary mb-0">官方教學影片正在整理中，敬請期待</p>
      </div>
    `;
  }

  // 收藏按鈕管理
  const favBtn = document.getElementById('song-fav-btn');
  const updateFavBtnUI = () => {
    const isFav = Favorites.isFavorite(song.id);
    favBtn.className = isFav ? 'btn btn-favorite active px-4 py-2' : 'btn btn-favorite px-4 py-2';
    favBtn.innerHTML = isFav ? '<i class="bi bi-heart-fill"></i> 已收藏' : '<i class="bi bi-heart"></i> 收藏此曲';
  };

  favBtn.addEventListener('click', () => {
    Favorites.toggle(song.id);
    updateFavBtnUI();
  });

  updateFavBtnUI();
});