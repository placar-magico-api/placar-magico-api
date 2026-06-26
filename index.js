require("dotenv").config();
const express = require("express");
const cors = require("cors");
const axios = require("axios");

const app = express();

app.use(cors());
app.use(express.json());

const API_KEY = process.env.FOOTBALL_API_KEY;

/* =====================================================
   POISSON SIMPLES (MOTOR DENTRO DO INDEX PRA NÃO QUEBRAR)
===================================================== */

function poisson(lam, x) {
  return (Math.pow(lam, x) * Math.exp(-lam)) / factorial(x);
}

// factorial simples
function factorial(n) {
  if (n === 0 || n === 1) return 1;
  let res = 1;
  for (let i = 2; i <= n; i++) res *= i;
  return res;
}

function predict(homeAvg, awayAvg) {
  let homeWin = 0,
    draw = 0,
    awayWin = 0;

  for (let h = 0; h <= 5; h++) {
    for (let a = 0; a <= 5; a++) {
      const p =
        poisson(homeAvg, h) * poisson(awayAvg, a);

      if (h > a) homeWin += p;
      else if (h === a) draw += p;
      else awayWin += p;
    }
  }

  const scores = [];

  for (let h = 0; h <= 5; h++) {
    for (let a = 0; a <= 5; a++) {
      scores.push({
        home: h,
        away: a,
        prob: poisson(homeAvg, h) * poisson(awayAvg, a),
      });
    }
  }

  scores.sort((a, b) => b.prob - a.prob);

  return {
    probabilities: {
      homeWin: Number(homeWin.toFixed(4)),
      draw: Number(draw.toFixed(4)),
      awayWin: Number(awayWin.toFixed(4)),
    },
    topScores: scores.slice(0, 5),
  };
}

/* =====================================================
   HEALTH CHECK
===================================================== */
app.get("/", (req, res) => {
  res.json({
    status: "API Placar Mágico rodando 🚀",
  });
});

/* =====================================================
   JOGOS DE HOJE
===================================================== */
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

    const matches = response.data.response.map((item) => {
      return {
        league: item.league.name,
        country: item.league.country,
        home: item.teams.home.name,
        away: item.teams.away.name,
        goalsHome: item.goals.home,
        goalsAway: item.goals.away,
        status: item.fixture.status.short,
        date: item.fixture.date,

        // fallback simples pra não quebrar
        homeAvg: 1.4,
        awayAvg: 1.1,

        prediction: predict(1.4, 1.1),
      };
    });

    res.json({
      success: true,
      count: matches.length,
      matches,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.response?.data || error.message,
    });
  }
});

/* =====================================================
   BACKTEST (JOGOS PASSADOS)
===================================================== */
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

    const matches = response.data.response.map((item) => ({
      league: item.league.name,
      home: item.teams.home.name,
      away: item.teams.away.name,
      homeGoals: item.goals.home,
      awayGoals: item.goals.away,
      status: item.fixture.status.short,
    }));

    res.json({
      success: true,
      count: matches.length,
      matches,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.response?.data || error.message,
    });
  }
});

/* =====================================================
   ENDPOINT DE TEST DE PREVISÃO (AQUI É O QUE VOCÊ QUERIA)
===================================================== */
app.post("/predict", (req, res) => {
  try {
    const { homeAvg, awayAvg } = req.body;

    if (!homeAvg || !awayAvg) {
      return res.status(400).json({
        success: false,
        error: "Envie homeAvg e awayAvg",
      });
    }

    const result = predict(homeAvg, awayAvg);

    res.json({
      success: true,
      prediction: result,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/* =====================================================
   START SERVER
===================================================== */
const PORT = process.env.PORT || 10000;

app.listen(PORT, () => {
  console.log("🚀 API rodando na porta", PORT);
});