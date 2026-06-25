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

// Campeonatos base (fallback para não dar vazio)
const DEFAULT_LEAGUES = [
  71,   // Serie A Brasil
  39,   // Premier League
  140,  // La Liga
  78,   // Bundesliga
  135,  // Serie A Itália
];

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
// MATCHES TODAY (COM FALLBACK)
// =====================
app.get("/matches/today", async (req, res) => {
  try {
    const today = new Date().toISOString().split("T")[0];

    let allMatches = [];

    // loop em campeonatos principais
    for (const league of DEFAULT_LEAGUES) {
      try {
        const response = await axios.get(
          "https://v3.football.api-sports.io/fixtures",
          {
            headers: {
              "x-apisports-key": API_KEY,
              "x-apisports-host": "v3.football.api-sports.io",
            },
            params: {
              date: today,
              league: league,
              timezone: "America/Sao_Paulo",
            },
          }
        );

        const matches = (response.data.response || []).map((item) => ({
          league: item.league.name,
          country: item.league.country,
          home: item.teams.home.name,
          away: item.teams.away.name,
          homeGoals: item.goals.home,
          awayGoals: item.goals.away,
          status: item.fixture.status.short,
          time: item.fixture.date,
        }));

        allMatches = allMatches.concat(matches);
      } catch (err) {
        console.log(`Erro league ${league}`, err.message);
      }
    }

    res.json({
      success: true,
      count: allMatches.length,
      matches: allMatches,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.response?.data || error.message,
    });
  }
});

// =====================
// BACKTEST (JOGOS PASSADOS)
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

    let allMatches = [];

    for (const league of DEFAULT_LEAGUES) {
      try {
        const response = await axios.get(
          "https://v3.football.api-sports.io/fixtures",
          {
            headers: {
              "x-apisports-key": API_KEY,
              "x-apisports-host": "v3.football.api-sports.io",
            },
            params: {
              date,
              league,
              timezone: "America/Sao_Paulo",
            },
          }
        );

        const matches = (response.data.response || []).map((item) => ({
          league: item.league.name,
          home: item.teams.home.name,
          away: item.teams.away.name,
          homeGoals: item.goals.home,
          awayGoals: item.goals.away,
        }));

        allMatches = allMatches.concat(matches);
      } catch (err) {
        console.log(`Erro backtest league ${league}`, err.message);
      }
    }

    res.json({
      success: true,
      count: allMatches.length,
      matches: allMatches,
    });
  } catch (error) {
    res.status(500).json({
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
  console.log(`🚀 API rodando na porta ${PORT}`);
});