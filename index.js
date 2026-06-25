require("dotenv").config();
const express = require("express");
const cors = require("cors");
const axios = require("axios");

const app = express();

app.use(cors());
app.use(express.json());

// =====================
// ENV VAR (IMPORTANTE)
// =====================
const API_KEY = process.env.FOOTBALL_API_KEY;

// =====================
// VALIDATION CHECK
// =====================
if (!API_KEY) {
  console.error("❌ FOOTBALL_API_KEY não encontrada no .env ou Render");
}

// =====================
// HEALTH CHECK
// =====================
app.get("/", (req, res) => {
  res.json({
    status: "Placar Mágico API rodando 🚀",
    api_key_loaded: !!API_KEY,
  });
});

// =====================
// MATCHES TODAY
// =====================
app.get("/matches/today", async (req, res) => {
  try {
    const today = new Date().toISOString().split("T")[0];

    const response = await axios.get(
      "https://v3.football.api-sports.io/fixtures",
      {
        headers: {
          "x-apisports-key": API_KEY, // ✔ CORRETO PARA API OFICIAL
        },
        params: {
          date: today,
        },
      }
    );

    const matches = response.data.response.map((item) => ({
      league: item.league.name,
      country: item.league.country,
      home: item.teams.home.name,
      away: item.teams.away.name,
      homeGoals: item.goals.home,
      awayGoals: item.goals.away,
      status: item.fixture.status.short,
      time: item.fixture.date,
    }));

    res.json({
      success: true,
      count: matches.length,
      matches,
    });
  } catch (error) {
    console.error("MATCHES ERROR:", error.response?.data || error.message);

    res.status(500).json({
      success: false,
      error: error.response?.data || error.message,
    });
  }
});

// =====================
// BACKTEST (CORRIGIDO)
// =====================
app.get("/backtest", async (req, res) => {
  try {
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({
        success: false,
        error: "Envie ?date=YYYY-MM-DD",
      });
    }

    const response = await axios.get(
      "https://v3.football.api-sports.io/fixtures",
      {
        headers: {
          "x-apisports-key": API_KEY,
        },
        params: {
          date: date,
        },
      }
    );

    const matches = response.data.response.map((item) => ({
      league: item.league.name,
      home: item.teams.home.name,
      away: item.teams.away.name,
      homeGoals: item.goals.home,
      awayGoals: item.goals.away,
    }));

    res.json({
      success: true,
      count: matches.length,
      matches,
    });
  } catch (error) {
    console.error("BACKTEST ERROR:", error.response?.data || error.message);

    res.status(500).json({
      success: false,
      error: error.response?.data || error.message,
    });
  }
});

// =====================
// START SERVER (CRÍTICO NO RENDER)
// =====================
const PORT = process.env.PORT || 10000;

app.listen(PORT, () => {
  console.log(`🚀 API rodando na porta ${PORT}`);
});