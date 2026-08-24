document.addEventListener('DOMContentLoaded', async () => {
  const params = new URLSearchParams(window.location.search);
  const teamId = params.get('team') || 'fubon';
  const meta = TEAMS_META[teamId] || TEAMS_META['fubon'];

  // 設定頁面標題與球隊資訊
  document.title = `${meta.name} 應援舞教學 | 中職應援舞教室`;
  document.getElementById('team-name').textContent = meta.name;
  document.getElementById('team-en-name').textContent = meta.enName;
  document.getElementById('team-cheer-leader').textContent = meta.cheerLeader;
  
  const badgeTag = document.getElementById('team-badge-tag');
  badgeTag.textContent = meta.enName.toUpperCase();
  badgeTag.className = `badge px-3 py-1 rounded-pill mb-2 bg-primary`;

  const allSongs = await fetchSongs();
  const teamSongs = allSongs.filter(s => s.team === teamId);
  const gridContainer = document.getElementById('team-songs-grid');

  function renderFilteredSongs(category = '全部') {
    let filtered = teamSongs;
    if (category !== '全部') {
      filtered = teamSongs.filter(s => s.category === category || s.type === category);
    }

    if (filtered.length === 0) {
      gridContainer.innerHTML = `
        <div class="col-12">
          <div class="empty-state-box">
            目前此分類尚無應援歌曲
          </div>
        </div>
      `;
    } else {
      gridContainer.innerHTML = filtered.map(song => createSongCardHTML(song)).join('');
    }
  }

  // 綁定過濾按鈕事件
  const filterButtons = document.querySelectorAll('#category-filters .filter-btn');
  filterButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      filterButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      renderFilteredSongs(btn.dataset.filter);
    });
  });

  // 初始渲染
  renderFilteredSongs('全部');
});