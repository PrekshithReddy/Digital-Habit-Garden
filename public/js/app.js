// ============================================================
// Digital Habit Garden — Frontend Application
// Handles API communication, dynamic rendering, animations,
// and the interactive garden experience.
// ============================================================

// ---- API Base URL ----
const API = '/api';

// ---- DOM References ----
const gardenGrid       = document.getElementById('garden-grid');
const emptyGarden      = document.getElementById('empty-garden');
const modalOverlay     = document.getElementById('modal-overlay');
const habitForm        = document.getElementById('habit-form');
const habitNameInput   = document.getElementById('habit-name');
const charCount        = document.getElementById('char-count');
const toastContainer   = document.getElementById('toast-container');
const recBanner        = document.getElementById('recommendations-banner');
const recText          = document.getElementById('rec-text');
const deleteOverlay    = document.getElementById('delete-modal-overlay');
const deleteHabitName  = document.getElementById('delete-habit-name');
const particlesCanvas  = document.getElementById('particles-canvas');

// ---- State ----
let selectedIcon = '🌱';
let deleteTargetId = null;

// ============================================================
// Plant Emoji Mapping
// Maps growth stage + plant type to an emoji for visual variety
// ============================================================
const PLANT_EMOJIS = {
  rose:      { seed: '🟤', sprout: '🌱', sapling: '🌿', bloom: '🥀', flower: '🌹' },
  sunflower: { seed: '🟤', sprout: '🌱', sapling: '🌿', bloom: '🌻', flower: '🌻' },
  tulip:     { seed: '🟤', sprout: '🌱', sapling: '🌿', bloom: '🌷', flower: '🌷' },
  cactus:    { seed: '🟤', sprout: '🌱', sapling: '🌵', bloom: '🌵', flower: '🌵' },
  bonsai:    { seed: '🟤', sprout: '🌱', sapling: '🌿', bloom: '🌳', flower: '🌳' },
  lavender:  { seed: '🟤', sprout: '🌱', sapling: '🌿', bloom: '💜', flower: '💐' },
  cherry:    { seed: '🟤', sprout: '🌱', sapling: '🌿', bloom: '🌸', flower: '🌸' },
  fern:      { seed: '🟤', sprout: '🌱', sapling: '🌿', bloom: '🍀', flower: '🍀' },
};

// ============================================================
// Background Particles (floating leaves / sparkles)
// ============================================================
function initParticles() {
  const ctx = particlesCanvas.getContext('2d');
  let particles = [];

  function resize() {
    particlesCanvas.width = window.innerWidth;
    particlesCanvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  // Create particles
  for (let i = 0; i < 30; i++) {
    particles.push({
      x: Math.random() * particlesCanvas.width,
      y: Math.random() * particlesCanvas.height,
      size: Math.random() * 3 + 1,
      speedX: (Math.random() - 0.5) * 0.3,
      speedY: Math.random() * -0.5 - 0.1,
      opacity: Math.random() * 0.3 + 0.05,
      hue: 100 + Math.random() * 40, // green to yellow-green
    });
  }

  function animate() {
    ctx.clearRect(0, 0, particlesCanvas.width, particlesCanvas.height);
    for (const p of particles) {
      p.x += p.speedX;
      p.y += p.speedY;

      // Wrap around
      if (p.y < -10) { p.y = particlesCanvas.height + 10; p.x = Math.random() * particlesCanvas.width; }
      if (p.x < -10) p.x = particlesCanvas.width + 10;
      if (p.x > particlesCanvas.width + 10) p.x = -10;

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fillStyle = `hsla(${p.hue}, 60%, 55%, ${p.opacity})`;
      ctx.fill();
    }
    requestAnimationFrame(animate);
  }
  animate();
}

// ============================================================
// API Helpers
// ============================================================

async function fetchHabits() {
  const res = await fetch(`${API}/habits`);
  const data = await res.json();
  return data.habits;
}

async function fetchStats() {
  const res = await fetch(`${API}/stats`);
  return await res.json();
}

async function createHabit(name, icon) {
  const res = await fetch(`${API}/habits`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, icon }),
  });
  return await res.json();
}

async function waterHabit(id) {
  const res = await fetch(`${API}/habits/${id}/water`, {
    method: 'PUT',
  });
  return await res.json();
}

async function deleteHabit(id) {
  const res = await fetch(`${API}/habits/${id}`, {
    method: 'DELETE',
  });
  return await res.json();
}

// ============================================================
// Rendering — Garden Grid
// ============================================================

function getPlantEmoji(plantType, stage) {
  const typeMap = PLANT_EMOJIS[plantType] || PLANT_EMOJIS.rose;
  return typeMap[stage] || '🌱';
}

function renderHabitCard(habit) {
  const emoji = getPlantEmoji(habit.plantType, habit.stage);
  const isWilting = habit.health < 50;
  const healthClass = habit.health >= 70 ? 'health-high' : habit.health >= 40 ? 'health-medium' : 'health-low';

  const card = document.createElement('div');
  card.className = `habit-card`;
  card.dataset.id = habit.id;
  card.style.animationDelay = `${Math.random() * 0.3}s`;

  card.innerHTML = `
    <div class="habit-card-top">
      <div class="habit-info">
        <div class="habit-icon-wrap">${habit.icon}</div>
        <div>
          <div class="habit-name">${escapeHtml(habit.name)}</div>
          <div class="habit-streak">🔥 <span class="streak-num">${habit.streak}</span> day streak</div>
        </div>
      </div>
      <button class="habit-delete-btn" title="Remove plant" data-id="${habit.id}">🗑️</button>
    </div>

    <div class="plant-visual plant-stage-${habit.stage} ${isWilting ? 'plant-wilting' : ''}">
      <div class="plant-body">
        <div class="plant-top">${emoji}</div>
        <div class="plant-stem"></div>
      </div>
      <div class="plant-ground"></div>
    </div>

    <div class="health-bar-container">
      <div class="health-bar-label">
        <span>Health</span>
        <span>${habit.health}%</span>
      </div>
      <div class="health-bar">
        <div class="health-bar-fill ${healthClass}" style="width: ${habit.health}%"></div>
      </div>
    </div>

    <div class="water-btn-container">
      ${habit.wateredToday
        ? `<button class="water-btn already-watered" disabled>✅ Watered Today</button>`
        : `<button class="water-btn can-water" data-id="${habit.id}">💧 Water Plant</button>`
      }
    </div>
  `;

  return card;
}

function renderGarden(habits) {
  gardenGrid.innerHTML = '';

  if (habits.length === 0) {
    emptyGarden.style.display = 'flex';
    gardenGrid.style.display = 'none';
  } else {
    emptyGarden.style.display = 'none';
    gardenGrid.style.display = 'grid';
    habits.forEach(habit => {
      gardenGrid.appendChild(renderHabitCard(habit));
    });
  }
}

// ============================================================
// Rendering — Stats & Achievements
// ============================================================

function renderStats(stats) {
  // Header stats
  document.getElementById('health-value').textContent = `${stats.avgHealth}%`;
  document.getElementById('streak-value').textContent = stats.bestStreak;
  document.getElementById('watered-value').textContent = `${stats.wateredToday}/${stats.totalHabits}`;

  // Health pill color indicator
  const healthPill = document.getElementById('stat-health');
  healthPill.style.borderColor = stats.avgHealth >= 70 ? 'rgba(93,184,92,0.3)' : stats.avgHealth >= 40 ? 'rgba(240,192,64,0.3)' : 'rgba(255,126,103,0.3)';

  // Sidebar stats
  document.getElementById('total-habits').textContent = stats.totalHabits;
  document.getElementById('total-waters').textContent = stats.totalWaters;
  document.getElementById('garden-age').textContent = stats.gardenAge;
  document.getElementById('achievements-count').textContent = stats.achievements.length;

  // Achievements list
  renderAchievements(stats.allAchievements);

  // Recommendations
  renderRecommendations(stats.recommendations);
}

function renderAchievements(allAchievements) {
  const list = document.getElementById('achievements-list');
  if (!allAchievements || allAchievements.length === 0) return;

  list.innerHTML = '';
  allAchievements.forEach(a => {
    const item = document.createElement('div');
    item.className = `achievement-item ${a.unlocked ? 'unlocked' : 'locked'}`;
    item.innerHTML = `
      <span class="achievement-icon">${a.name.split(' ')[0]}</span>
      <div class="achievement-info">
        <div class="achievement-name">${a.name.split(' ').slice(1).join(' ')}</div>
        <div class="achievement-desc">${a.desc}</div>
      </div>
      ${a.unlocked ? '<span class="achievement-check">✓</span>' : ''}
    `;
    list.appendChild(item);
  });
}

function renderRecommendations(recommendations) {
  if (!recommendations || recommendations.length === 0) {
    recBanner.style.display = 'none';
    return;
  }

  // Show the most urgent recommendation
  const top = recommendations[0];
  recText.textContent = top.message;
  recBanner.style.display = 'flex';
}

// ============================================================
// Toast Notifications
// ============================================================

function showToast(title, desc, type = 'success') {
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <span class="toast-icon">${type === 'achievement' ? '🏅' : type === 'warning' ? '⚠️' : '✨'}</span>
    <div class="toast-content">
      <div class="toast-title">${title}</div>
      ${desc ? `<div class="toast-desc">${desc}</div>` : ''}
    </div>
  `;
  toastContainer.appendChild(toast);

  // Remove after animation ends
  setTimeout(() => {
    if (toast.parentNode) toast.remove();
  }, 4000);
}

// ============================================================
// Celebration Particles (on achievement unlock)
// ============================================================

function celebrationBurst(x, y) {
  const colors = ['#f0c040', '#ff7e67', '#5dade2', '#a78bfa', '#5cb85c', '#f472b6'];
  for (let i = 0; i < 24; i++) {
    const particle = document.createElement('div');
    particle.className = 'celebration-particle';
    const angle = (Math.PI * 2 * i) / 24;
    const dist = 60 + Math.random() * 80;
    const dx = Math.cos(angle) * dist;
    const dy = Math.sin(angle) * dist;
    particle.style.cssText = `
      left: ${x}px; top: ${y}px;
      background: ${colors[i % colors.length]};
      --dx: ${dx}px; --dy: ${dy}px;
      width: ${4 + Math.random() * 6}px;
      height: ${4 + Math.random() * 6}px;
    `;
    document.body.appendChild(particle);
    setTimeout(() => particle.remove(), 1500);
  }
}

// ============================================================
// Event Handlers
// ============================================================

// Open Add Habit Modal
function openModal() {
  modalOverlay.classList.add('active');
  habitNameInput.focus();
}

function closeModal() {
  modalOverlay.classList.remove('active');
  habitForm.reset();
  charCount.textContent = '0';
  // Reset icon selection
  document.querySelectorAll('.icon-btn').forEach(btn => btn.classList.remove('selected'));
  document.querySelector('.icon-btn[data-icon="🌱"]').classList.add('selected');
  selectedIcon = '🌱';
}

// Open Delete Confirmation
function openDeleteModal(id, name) {
  deleteTargetId = id;
  deleteHabitName.textContent = name;
  deleteOverlay.classList.add('active');
}

function closeDeleteModal() {
  deleteOverlay.classList.remove('active');
  deleteTargetId = null;
}

// ---- Button Listeners ----
document.getElementById('btn-add-habit').addEventListener('click', openModal);
document.getElementById('btn-empty-add').addEventListener('click', openModal);
document.getElementById('modal-close').addEventListener('click', closeModal);
document.getElementById('delete-modal-close').addEventListener('click', closeDeleteModal);
document.getElementById('delete-cancel').addEventListener('click', closeDeleteModal);

// Close modals on overlay click
modalOverlay.addEventListener('click', (e) => { if (e.target === modalOverlay) closeModal(); });
deleteOverlay.addEventListener('click', (e) => { if (e.target === deleteOverlay) closeDeleteModal(); });

// Keyboard: Escape closes modals
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closeModal();
    closeDeleteModal();
  }
});

// Character count for habit name input
habitNameInput.addEventListener('input', () => {
  charCount.textContent = habitNameInput.value.length;
});

// Icon picker
document.getElementById('icon-picker').addEventListener('click', (e) => {
  const btn = e.target.closest('.icon-btn');
  if (!btn) return;
  document.querySelectorAll('.icon-btn').forEach(b => b.classList.remove('selected'));
  btn.classList.add('selected');
  selectedIcon = btn.dataset.icon;
});

// ---- Form Submit: Create Habit ----
habitForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const name = habitNameInput.value.trim();
  if (!name) return;

  try {
    const result = await createHabit(name, selectedIcon);
    closeModal();
    showToast('🌱 Seed Planted!', `"${name}" has been added to your garden.`);

    // Check for new achievements
    if (result.newAchievements && result.newAchievements.length > 0) {
      result.newAchievements.forEach(a => {
        setTimeout(() => {
          showToast(a.name, a.desc, 'achievement');
          celebrationBurst(window.innerWidth / 2, window.innerHeight / 2);
        }, 800);
      });
    }

    await refreshAll();
  } catch (err) {
    showToast('Error', 'Could not plant the seed. Try again.', 'warning');
  }
});

// ---- Garden Grid: Water & Delete (event delegation) ----
gardenGrid.addEventListener('click', async (e) => {
  // Water button
  const waterBtn = e.target.closest('.water-btn.can-water');
  if (waterBtn) {
    const id = waterBtn.dataset.id;
    const card = waterBtn.closest('.habit-card');

    // Splash animation
    card.classList.add('water-splash');
    setTimeout(() => card.classList.remove('water-splash'), 600);

    // Optimistic UI
    waterBtn.textContent = '✅ Watered Today';
    waterBtn.classList.remove('can-water');
    waterBtn.classList.add('already-watered');
    waterBtn.disabled = true;

    try {
      const result = await waterHabit(id);

      showToast('💧 Plant Watered!', `Keep up the streak!`);

      // Check for new achievements
      if (result.newAchievements && result.newAchievements.length > 0) {
        result.newAchievements.forEach(a => {
          setTimeout(() => {
            showToast(a.name, a.desc, 'achievement');
            const rect = card.getBoundingClientRect();
            celebrationBurst(rect.left + rect.width / 2, rect.top + rect.height / 2);
          }, 600);
        });
      }

      await refreshAll();
    } catch (err) {
      showToast('Error', 'Could not water the plant.', 'warning');
      await refreshAll();
    }
    return;
  }

  // Delete button
  const delBtn = e.target.closest('.habit-delete-btn');
  if (delBtn) {
    const id = delBtn.dataset.id;
    const card = delBtn.closest('.habit-card');
    const name = card.querySelector('.habit-name').textContent;
    openDeleteModal(id, name);
    return;
  }
});

// ---- Confirm Delete ----
document.getElementById('delete-confirm').addEventListener('click', async () => {
  if (!deleteTargetId) return;

  try {
    await deleteHabit(deleteTargetId);
    closeDeleteModal();
    showToast('🗑️ Plant Removed', 'The habit has been removed from your garden.');
    await refreshAll();
  } catch (err) {
    showToast('Error', 'Could not remove the plant.', 'warning');
  }
});

// ============================================================
// Refresh Everything
// ============================================================

async function refreshAll() {
  try {
    const [habits, stats] = await Promise.all([fetchHabits(), fetchStats()]);
    renderGarden(habits);
    renderStats(stats);
  } catch (err) {
    console.error('Failed to refresh:', err);
  }
}

// ============================================================
// Utility: Escape HTML to prevent XSS
// ============================================================

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// ============================================================
// Initialization
// ============================================================

document.addEventListener('DOMContentLoaded', () => {
  initParticles();
  refreshAll();

  // Auto-refresh every 60 seconds to keep health/recommendations current
  setInterval(refreshAll, 60000);
});
