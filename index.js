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
// MATCHES TODAY (ROBUSTO - SEM FALLBACK QUE QUEBRA)
// =====================
app.get("/matches/today", async (req, res) => {
  try {
    const today = new Date().toISOString().split("T")[0];

    const response = await axios.get(
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

    const matches = response.data.response || [];

    // 🔥 NÃO ESCONDE MAIS O PROBLEMA
    return res.json({
      success: true,
      source: "today",
      count: matches.length,
      message:
        matches.length === 0
          ? "Nenhum jogo encontrado para hoje nessa API/plano."
          : "Jogos carregados com sucesso",
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
// BACKTEST (COM SEASON DINÂMICA - CORRIGIDO)
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

    const season = new Date(date).getFullYear();

    const response = await axios.get(
      "https://v3.football.api-sports.io/fixtures",
      {
        headers: {
          "x-apisports-key": API_KEY,
        },
        params: {
          date,
          season,
        },
      }
    );

    const matches = response.data.response || [];

    return res.json({
      success: true,
      source: "backtest",
      count: matches.length,
      message:
        matches.length === 0
          ? "Nenhum jogo encontrado nessa data/season (limitação da API ou data sem jogos)."
          : "Backtest carregado com sucesso",
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