# 🌱 Digital Habit Garden

> *A gamified habit tracker where your habits grow plants. Water daily, earn streaks, unlock achievements, and watch your garden bloom!*

![Node.js](https://img.shields.io/badge/Node.js-18+-339933?logo=nodedotjs&logoColor=white)
![Express](https://img.shields.io/badge/Express-4.x-000000?logo=express&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-F7DF1E?logo=javascript&logoColor=black)
![License](https://img.shields.io/badge/License-MIT-blue)

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| 🌿 **Visual Plant Growth** | Each habit grows through 5 stages: Seed → Sprout → Sapling → Bloom → Flower |
| 🥀 **Wilt System** | Neglected habits visually wilt and lose health |
| 💧 **Daily Watering** | Mark habits as done each day to maintain streaks |
| 🔥 **Streak Tracking** | Build consecutive-day streaks per habit |
| 🏅 **10 Achievements** | Unlock badges like "First Bloom", "Week Warrior", "Habit Master" |
| 🎉 **Celebrations** | Particle burst animations on achievement unlocks |
| 💡 **Smart Recommendations** | API suggests which plants need urgent attention |
| 📊 **Garden Stats** | Health score, total waters, garden age, best streaks |
| 📱 **Fully Responsive** | Works on desktop, tablet, and mobile |
| 🎨 **Modern UI** | Dark earthy theme, glassmorphism, CSS animations |

---

## 🛠️ Tech Stack

- **Backend**: Node.js + Express.js (REST API)
- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Storage**: File-based JSON (no database needed)
- **Design**: CSS Custom Properties, Glassmorphism, CSS Animations, Canvas particles

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) v14 or higher
- npm (comes with Node.js)

### Installation

```bash
# 1. Navigate to the project folder
cd digital-habit-garden

# 2. Install dependencies
npm install

# 3. Start the server
node server.js
```

### Open in Browser

```
http://localhost:3000
```

---

## 📁 Project Structure

```
digital-habit-garden/
├── server.js              # Express server with REST API & game logic
├── package.json           # Dependencies & scripts
├── data/
│   └── garden.json        # Persistent data storage (auto-managed)
├── public/
│   ├── index.html         # Single-page frontend
│   ├── css/
│   │   └── style.css      # Styles, animations, responsive layout
│   └── js/
│       └── app.js         # Frontend logic & API communication
└── README.md              # This file
```

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/habits` | Fetch all habits with growth stage & health |
| `POST` | `/api/habits` | Create a new habit (plant a seed) |
| `PUT` | `/api/habits/:id/water` | Water a habit (mark done today) |
| `DELETE` | `/api/habits/:id` | Remove a habit from the garden |
| `GET` | `/api/stats` | Get garden stats, achievements & recommendations |
| `POST` | `/api/reset-daily` | Force reset daily watering status |

---

## 🎮 How It Works

1. **Plant a Seed** — Click "Plant a Seed", name your habit, and choose an icon
2. **Water Daily** — Click the 💧 button each day to complete your habit
3. **Watch it Grow** — Consistent streaks make your plant evolve through 5 growth stages
4. **Don't Neglect!** — Missing days causes plants to wilt (health drops by 15% per missed day)
5. **Earn Achievements** — Unlock 10 badges as you build habits (with celebration effects!)
6. **Follow Recommendations** — The app warns you which plants need urgent attention

### Growth Stages

| Stage | Days Required | Visual |
|-------|--------------|--------|
| Seed | 0–2 days | 🟤 |
| Sprout | 3–6 days | 🌱 |
| Sapling | 7–13 days | 🌿 |
| Bloom | 14–20 days | 🌳/🌸 |
| Flower | 21+ days | 🌹/🌻/🌷 |

---

## 🏅 Achievements

| Badge | Name | How to Unlock |
|-------|------|---------------|
| 🌱 | First Seed | Plant your first habit |
| 🌿 | Growing Garden | Plant 3 habits |
| 🌳 | Garden Keeper | Plant 5 habits |
| 💧 | First Drop | Water a habit for the first time |
| 🔥 | On Fire | 3-day streak on any habit |
| ⭐ | Week Warrior | 7-day streak |
| 🏆 | Fortnight Hero | 14-day streak |
| 👑 | Habit Master | 21-day streak |
| 🌈 | Perfect Day | Water all habits in a single day |
| 🚿 | Dedicated | 10 total waters |

---

## 📸 Screenshots

<img width="424" height="458" alt="Screenshot 2026-03-17 205044" src="https://github.com/user-attachments/assets/8cbd2523-1e78-48d8-9b1b-7e6194fd7938" />
<img width="1889" height="877" alt="Screenshot 2026-03-17 205033" src="https://github.com/user-attachments/assets/ce998011-a95e-4722-b75a-1498d5cc05fe" />


---

## 📝 License

MIT License — feel free to use, modify, and share.

---

> Built with 💚 by a developer who believes small habits grow into big changes.
