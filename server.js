// ============================================================
// Digital Habit Garden — Express Server
// A gamified habit tracker where habits grow plants over time.
// ============================================================

const express = require('express');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3000;

// --- Middleware ---
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// --- Data file path ---
const DATA_FILE = path.join(__dirname, 'data', 'garden.json');

// ============================================================
// Data Layer — Read / Write JSON file
// ============================================================

function readData() {
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    // If file is missing or corrupt, return defaults
    const defaults = { habits: [], achievements: [], gardenCreated: new Date().toISOString() };
    writeData(defaults);
    return defaults;
  }
}

function writeData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

// ============================================================
// Plant Growth Engine
// Determines the growth stage based on the current streak.
// Stages: seed → sprout → sapling → bloom → flower
// ============================================================

const GROWTH_STAGES = ['seed', 'sprout', 'sapling', 'bloom', 'flower'];

function getGrowthStage(streak) {
  if (streak >= 21) return 'flower';   // 21+ days — fully bloomed
  if (streak >= 14) return 'bloom';    // 14–20 days
  if (streak >= 7)  return 'sapling';  // 7–13 days
  if (streak >= 3)  return 'sprout';   // 3–6 days
  return 'seed';                        // 0–2 days
}

// ============================================================
// Wilt System
// Calculates plant health (0–100) based on missed days.
// Health drops by 15 for each day the habit is not watered.
// ============================================================

function calculateHealth(habit) {
  if (!habit.lastWatered) return 100;
  const now = new Date();
  const lastWatered = new Date(habit.lastWatered);
  const daysSinceWatered = Math.floor((now - lastWatered) / (1000 * 60 * 60 * 24));

  if (daysSinceWatered <= 1) return 100;
  // Each missed day after 1 reduces health by 15
  const health = Math.max(0, 100 - (daysSinceWatered - 1) * 15);
  return health;
}

// ============================================================
// Achievement Definitions
// ============================================================

const ACHIEVEMENT_DEFS = [
  { id: 'first_seed',     name: '🌱 First Seed',       desc: 'Plant your first habit',              check: (data) => data.habits.length >= 1 },
  { id: 'three_seeds',    name: '🌿 Growing Garden',   desc: 'Plant 3 habits in your garden',       check: (data) => data.habits.length >= 3 },
  { id: 'five_seeds',     name: '🌳 Garden Keeper',    desc: 'Plant 5 habits in your garden',       check: (data) => data.habits.length >= 5 },
  { id: 'first_water',    name: '💧 First Drop',       desc: 'Water a habit for the first time',    check: (data) => data.habits.some(h => h.totalWaters >= 1) },
  { id: 'streak_3',       name: '🔥 On Fire',          desc: 'Reach a 3-day streak on any habit',   check: (data) => data.habits.some(h => h.streak >= 3) },
  { id: 'streak_7',       name: '⭐ Week Warrior',     desc: 'Reach a 7-day streak on any habit',   check: (data) => data.habits.some(h => h.streak >= 7) },
  { id: 'streak_14',      name: '🏆 Fortnight Hero',   desc: 'Reach a 14-day streak on any habit',  check: (data) => data.habits.some(h => h.streak >= 14) },
  { id: 'streak_21',      name: '👑 Habit Master',     desc: 'Reach a 21-day streak on any habit',  check: (data) => data.habits.some(h => h.streak >= 21) },
  { id: 'all_watered',    name: '🌈 Perfect Day',      desc: 'Water all habits in a single day',    check: (data) => data.habits.length > 0 && data.habits.every(h => h.wateredToday) },
  { id: 'ten_waters',     name: '🚿 Dedicated',        desc: 'Water habits 10 times total',         check: (data) => data.habits.reduce((sum, h) => sum + (h.totalWaters || 0), 0) >= 10 },
];

// Check for newly unlocked achievements and return them
function checkAchievements(data) {
  const newlyUnlocked = [];
  for (const def of ACHIEVEMENT_DEFS) {
    const alreadyUnlocked = data.achievements.some(a => a.id === def.id);
    if (!alreadyUnlocked && def.check(data)) {
      const achievement = { id: def.id, name: def.name, desc: def.desc, unlockedAt: new Date().toISOString() };
      data.achievements.push(achievement);
      newlyUnlocked.push(achievement);
    }
  }
  return newlyUnlocked;
}

// ============================================================
// Helper: Check if a date is "today"
// ============================================================

function isToday(dateStr) {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  const now = new Date();
  return d.getFullYear() === now.getFullYear() &&
         d.getMonth() === now.getMonth() &&
         d.getDate() === now.getDate();
}

// ============================================================
// Helper: Ensure daily reset (marks habits as not watered for new day)
// ============================================================

function ensureDailyReset(data) {
  let changed = false;
  for (const habit of data.habits) {
    if (habit.wateredToday && !isToday(habit.lastWatered)) {
      habit.wateredToday = false;
      changed = true;
    }
  }
  if (changed) writeData(data);
  return data;
}

// ============================================================
// Smart Recommendations
// Suggests which habits need attention most urgently.
// ============================================================

function getRecommendations(habits) {
  const recs = [];

  // Sort by health ascending (most wilted first)
  const sorted = [...habits].sort((a, b) => calculateHealth(a) - calculateHealth(b));

  for (const h of sorted) {
    const health = calculateHealth(h);
    if (h.wateredToday) continue; // Skip already watered

    if (health < 40) {
      recs.push({ habitId: h.id, name: h.name, urgency: 'critical', message: `🚨 "${h.name}" is wilting! Water it now!` });
    } else if (health < 70) {
      recs.push({ habitId: h.id, name: h.name, urgency: 'warning', message: `⚠️ "${h.name}" needs water soon.` });
    } else if (!h.wateredToday) {
      recs.push({ habitId: h.id, name: h.name, urgency: 'info', message: `💧 Don't forget to water "${h.name}" today.` });
    }
  }

  return recs;
}

// ============================================================
// Plant type assignment (visual variety in the garden)
// ============================================================

const PLANT_TYPES = ['rose', 'sunflower', 'tulip', 'cactus', 'bonsai', 'lavender', 'cherry', 'fern'];

function assignPlantType(index) {
  return PLANT_TYPES[index % PLANT_TYPES.length];
}

// ============================================================
// API Routes
// ============================================================

// GET /api/habits — Retrieve all habits with computed fields
app.get('/api/habits', (req, res) => {
  let data = readData();
  data = ensureDailyReset(data);

  const enriched = data.habits.map((h, i) => ({
    ...h,
    stage: getGrowthStage(h.streak),
    health: calculateHealth(h),
    plantType: h.plantType || assignPlantType(i),
  }));

  res.json({ habits: enriched });
});

// POST /api/habits — Plant a new habit
app.post('/api/habits', (req, res) => {
  const { name, icon } = req.body;
  if (!name || name.trim().length === 0) {
    return res.status(400).json({ error: 'Habit name is required.' });
  }

  const data = readData();

  const habit = {
    id: uuidv4(),
    name: name.trim(),
    icon: icon || '🌱',
    plantType: assignPlantType(data.habits.length),
    streak: 0,
    bestStreak: 0,
    totalWaters: 0,
    wateredToday: false,
    lastWatered: null,
    createdAt: new Date().toISOString(),
  };

  data.habits.push(habit);

  // Check achievements after adding
  const newAchievements = checkAchievements(data);
  writeData(data);

  res.status(201).json({
    habit: { ...habit, stage: 'seed', health: 100 },
    newAchievements,
  });
});

// PUT /api/habits/:id/water — Water a habit (mark as done today)
app.put('/api/habits/:id/water', (req, res) => {
  const data = readData();
  const habit = data.habits.find(h => h.id === req.params.id);

  if (!habit) return res.status(404).json({ error: 'Habit not found.' });
  if (habit.wateredToday && isToday(habit.lastWatered)) {
    return res.status(400).json({ error: 'Already watered today!', habit });
  }

  // Update streak: if last watered yesterday or today, continue; otherwise reset
  const now = new Date();
  if (habit.lastWatered) {
    const last = new Date(habit.lastWatered);
    const diffDays = Math.floor((now - last) / (1000 * 60 * 60 * 24));
    if (diffDays <= 1) {
      habit.streak += 1;
    } else {
      habit.streak = 1; // Reset streak if missed days
    }
  } else {
    habit.streak = 1; // First time watering
  }

  habit.bestStreak = Math.max(habit.bestStreak, habit.streak);
  habit.totalWaters += 1;
  habit.wateredToday = true;
  habit.lastWatered = now.toISOString();

  // Check achievements after watering
  const newAchievements = checkAchievements(data);
  writeData(data);

  res.json({
    habit: { ...habit, stage: getGrowthStage(habit.streak), health: 100 },
    newAchievements,
  });
});

// DELETE /api/habits/:id — Remove a habit from the garden
app.delete('/api/habits/:id', (req, res) => {
  const data = readData();
  const idx = data.habits.findIndex(h => h.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Habit not found.' });

  const removed = data.habits.splice(idx, 1)[0];
  writeData(data);

  res.json({ removed });
});

// GET /api/stats — Overall garden statistics
app.get('/api/stats', (req, res) => {
  let data = readData();
  data = ensureDailyReset(data);

  const habits = data.habits;
  const totalHabits = habits.length;
  const wateredToday = habits.filter(h => h.wateredToday).length;
  const avgHealth = totalHabits > 0
    ? Math.round(habits.reduce((sum, h) => sum + calculateHealth(h), 0) / totalHabits)
    : 100;
  const bestStreak = habits.reduce((max, h) => Math.max(max, h.bestStreak || 0), 0);
  const totalWaters = habits.reduce((sum, h) => sum + (h.totalWaters || 0), 0);
  const recommendations = getRecommendations(habits);

  // Days since garden created
  const gardenAge = Math.floor((new Date() - new Date(data.gardenCreated)) / (1000 * 60 * 60 * 24));

  res.json({
    totalHabits,
    wateredToday,
    avgHealth,
    bestStreak,
    totalWaters,
    gardenAge,
    achievements: data.achievements,
    allAchievements: ACHIEVEMENT_DEFS.map(d => ({
      ...d,
      unlocked: data.achievements.some(a => a.id === d.id),
      check: undefined,
    })),
    recommendations,
  });
});

// POST /api/reset-daily — Force daily reset (utility endpoint)
app.post('/api/reset-daily', (req, res) => {
  const data = readData();
  for (const habit of data.habits) {
    habit.wateredToday = false;
  }
  writeData(data);
  res.json({ message: 'Daily status reset.' });
});

// ============================================================
// Start Server
// ============================================================

app.listen(PORT, () => {
  console.log(`\n🌱 Digital Habit Garden is growing on http://localhost:${PORT}\n`);
});
