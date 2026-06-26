require("dotenv").config();
const express = require("express");
const cors = require("cors");
const axios = require("axios");

const app = express();

app.use(cors());
app.use(express.json());

const API_KEY = process.env.FOOTBALL_API_KEY;

/* =========================
   MOTOR DE PREVISÃO SIMPLES
========================= */

function factorial(n) {
  let r = 1;
  for (let i = 2; i <= n; i++) r *= i;
  return r;
}

function poisson(lam, x) {
  return (Math.pow(lam, x) * Math.exp(-lam)) / factorial(x);
}

function predict(home, away) {
  let homeWin = 0;
  let draw = 0;
  let awayWin = 0;

  for (let h = 0; h <= 5; h++) {
    for (let a = 0; a <= 5; a++) {
      const p =
        poisson(home, h) * poisson(away, a);

      if (h > a) homeWin += p;
      else if (h === a) draw += p;
      else awayWin += p;
    }
  }

  return {
    homeWin: Number(homeWin.toFixed(4)),
    draw: Number(draw.toFixed(4)),
    awayWin: Number(awayWin.toFixed(4)),
  };
}

/* =========================
   HEALTH CHECK
========================= */

app.get("/", (req, res) => {
  res.json({ ok: true, api: "Placar Mágico rodando" });
});

/* =========================
   JOGOS DE HOJE
========================= */

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
          league: 39,
          season: 2025,
        },
      }
    );

    const matches = response.data.response.map((m) => {
      return {
        league: m.league.name,
        home: m.teams.home.name,
        away: m.teams.away.name,
        status: m.fixture.status.short,

        goalsHome: m.goals.home,
        goalsAway: m.goals.away,

        prediction: predict(1.4, 1.2),
      };
    });

    res.json({
      success: true,
      count: matches.length,
      matches,
    });
  } catch (err) {
    res.json({
      success: false,
      error: err.response?.data || err.message,
    });
  }
});

/* =========================
   BACKTEST
========================= */

app.get("/backtest", async (req, res) => {
  try {
    const { date } = req.query;

    if (!date) {
      return res.json({
        success: false,
        error: "envie ?date=YYYY-MM-DD",
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
          league: 39,
          season: 2025,
        },
      }
    );

    const matches = response.data.response.map((m) => ({
      home: m.teams.home.name,
      away: m.teams.away.name,
      homeGoals: m.goals.home,
      awayGoals: m.goals.away,
    }));

    res.json({
      success: true,
      count: matches.length,
      matches,
    });
  } catch (err) {
    res.json({
      success: false,
      error: err.response?.data || err.message,
    });
  }
});

/* =========================
   START SERVER
========================= */

const PORT = process.env.PORT || 10000;

app.listen(PORT, () => {
  console.log("API rodando na porta", PORT);
});