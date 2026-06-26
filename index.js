require("dotenv").config();
const express = require("express");
const cors = require("cors");
const axios = require("axios");
const fs = require("fs");

const app = express();

app.use(cors());
app.use(express.json());

const API_KEY = process.env.FOOTBALL_API_KEY;
const DB_FILE = "./db.json";

// =====================
// HELPERS (BANCO LOCAL)
// =====================
function readDB() {
  if (!fs.existsSync(DB_FILE)) return { matches: [] };
  return JSON.parse(fs.readFileSync(DB_FILE));
}

function writeDB(data) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

// =====================
// HEALTH
// =====================
app.get("/", (req, res) => {
  res.json({ status: "Placar Mágico rodando 🚀" });
});

// =====================
// MATCHES TODAY (API + MANUAL + SAVE)
// =====================
app.get("/matches/today", async (req, res) => {
  try {
    const today = new Date().toISOString().split("T")[0];

    let apiMatches = [];

    try {
      const response = await axios.get(
        "https://v3.football.api-sports.io/fixtures",
        {
          headers: {
            "x-apisports-key": API_KEY,
          },
          params: { date: today },
        }
      );

      apiMatches = response.data.response || [];
    } catch (e) {
      console.log("API error:", e.message);
    }

    // =====================
    // MANUAL MATCHES (VOCÊ PODE EDITAR AQUI)
    // =====================
    const manualMatches = [
      {
        league: "MANUAL LEAGUE",
        country: "Manual",
        home: "Time A",
        away: "Time B",
        homeGoals: null,
        awayGoals: null,
        status: "NS",
        time: today,
        source: "manual",
      },
    ];

    // =====================
    // FORMAT API MATCHES
    // =====================
    const formattedApi = apiMatches.map((item) => ({
      league: item.league.name,
      country: item.league.country,
      home: item.teams.home.name,
      away: item.teams.away.name,
      homeGoals: item.goals.home,
      awayGoals: item.goals.away,
      status: item.fixture.status.short,
      time: item.fixture.date,
      source: "api",
    }));

    const allMatches = [...formattedApi, ...manualMatches];

    // =====================
    // SAVE NO BANCO LOCAL
    // =====================
    const db = readDB();
    db.matches.push(...allMatches);
    writeDB(db);

    res.json({
      success: true,
      count: allMatches.length,
      matches: allMatches,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// =====================
// BACKTEST (USA BANCO LOCAL)
// =====================
app.get("/backtest", (req, res) => {
  const db = readDB();

  const played = db.matches.filter(
    (m) => m.homeGoals !== null && m.awayGoals !== null
  );

  res.json({
    success: true,
    count: played.length,
    matches: played,
  });
});

// =====================
// ADD MANUAL MATCH
// =====================
app.post("/manual", (req, res) => {
  const db = readDB();

  db.matches.push({
    ...req.body,
    source: "manual",
  });

  writeDB(db);

  res.json({
    success: true,
    message: "Jogo manual salvo",
  });
});

// =====================
// START SERVER
// =====================
const PORT = process.env.PORT || 10000;

app.listen(PORT, () => {
  console.log("🚀 Placar Mágico rodando na porta " + PORT);
});