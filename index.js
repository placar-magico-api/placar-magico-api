require("dotenv").config();
const express = require("express");
const cors = require("cors");
const axios = require("axios");

const app = express();

app.use(cors());
app.use(express.json());

const API_KEY = process.env.FOOTBALL_API_KEY;

/**
 * HEALTH CHECK
 */
app.get("/", (req, res) => {
  res.json({
    status: "Placar Mágico API rodando 🚀",
  });
});

/**
 * MATCHES TODAY (API OFICIAL)
 */
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

        homeXG: 1.4,
        awayXG: 1.1,

        status: item.fixture.status.short,
        time: item.fixture.date,
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

/**
 * START SERVER (RENDER)
 */
const PORT = process.env.PORT || 10000;

app.listen(PORT, () => {
  console.log(`API rodando na porta ${PORT}`);
});