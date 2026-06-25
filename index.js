require("dotenv").config();
const express = require("express");
const cors = require("cors");
const axios = require("axios");

const app = express();

app.use(cors());
app.use(express.json());

// =====================
// CONFIG
// =====================
const API_KEY = process.env.FOOTBALL_API_KEY;

// =====================
// HEALTH CHECK
// =====================
app.get("/", (req, res) => {
  res.json({
    status: "Placar Mágico API rodando 🚀",
    api_loaded: !!API_KEY,
  });
});

// =====================
// MATCHES TODAY (COM FALLBACK REAL)
// =====================
app.get("/matches/today", async (req, res) => {
  try {
    const today = new Date().toISOString().split("T")[0];

    // 1️⃣ tenta pegar jogos do dia (GLOBAL)
    const todayResponse = await axios.get(
      "https://v3.football.api-sports.io/fixtures",
      {
        headers: {
          "x-apisports-key": API_KEY,
        },
        params: {
          date: today,
        },
      }
    );

    let matches = todayResponse.data.response || [];

    // 2️⃣ SE VIER VAZIO → fallback automático
    if (matches.length === 0) {
      const fallbackResponse = await axios.get(
        "https://v3.football.api-sports.io/fixtures",
        {
          headers: {
            "x-apisports-key": API_KEY,
          },
          params: {
            league: 39, // Premier League fallback garantido
            season: 2026,
          },
        }
      );

      matches = fallbackResponse.data.response || [];

      return res.json({
        success: true,
        source: "fallback-league-39",
        count: matches.length,
        matches: matches.map((item) => ({
          league: item.league.name,
          country: item.league.country,
          home: item.teams.home.name,
          away: item.teams.away.name,
          homeGoals: item.goals.home,
          awayGoals: item.goals.away,
          status: item.fixture.status.short,
          time: item.fixture.date,
        })),
      });
    }

    // 3️⃣ resposta normal
    return res.json({
      success: true,
      source: "today",
      count: matches.length,
      matches: matches.map((item) => ({
        league: item.league.name,
        country: item.league.country,
        home: item.teams.home.name,
        away: item.teams.away.name,
        homeGoals: item.goals.home,
        awayGoals: item.goals.away,
        status: item.fixture.status.short,
        time: item.fixture.date,
      })),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.response?.data || error.message,
    });
  }
});

// =====================
// BACKTEST (SEM DEPENDER DE LEAGUE)
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
          date,
        },
      }
    );

    const matches = response.data.response || [];

    return res.json({
      success: true,
      count: matches.length,
      matches: matches.map((item) => ({
        league: item.league.name,
        country: item.league.country,
        home: item.teams.home.name,
        away: item.teams.away.name,
        homeGoals: item.goals.home,
        awayGoals: item.goals.away,
        status: item.fixture.status.short,
      })),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.response?.data || error.message,
    });
  }
});

// =====================
// START SERVER
// =====================
const PORT = process.env.PORT || 10000;

app.listen(PORT, () => {
  console.log("🚀 API rodando na porta " + PORT);
});