/**
 * BACKTEST (JOGOS PASSADOS)
 */
app.get("/backtest", async (req, res) => {
  try {
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({
        success: false,
        error: "Você precisa enviar uma data ?date=YYYY-MM-DD",
      });
    }

    const response = await axios.get(
      "https://api-football-v1.p.rapidapi.com/v3/fixtures",
      {
        headers: {
          "x-apisports-key": API_KEY,
        },
        params: {
          date: date,
        },
      }
    );

    const games = response.data.response;

    const results = games.map((item) => {
      const homeGoals = item.goals.home ?? 0;
      const awayGoals = item.goals.away ?? 0;

      // =========================
      // 🔥 MODELO SIMPLES POISSON BASE (MESMA IDEIA DO CLI PYTHON)
      // =========================

      const homeXG = 1.4 + Math.random() * 0.6;
      const awayXG = 1.1 + Math.random() * 0.6;

      const predictedHome = Math.round(homeXG);
      const predictedAway = Math.round(awayXG);

      const actualHome = homeGoals;
      const actualAway = awayGoals;

      // =========================
      // RESULTADO DO JOGO
      // =========================

      let outcome = "DRAW";

      if (actualHome > actualAway) outcome = "HOME";
      if (actualAway > actualHome) outcome = "AWAY";

      let predictedOutcome = "DRAW";

      if (predictedHome > predictedAway) predictedOutcome = "HOME";
      if (predictedAway > predictedHome) predictedOutcome = "AWAY";

      const correct = predictedOutcome === outcome;

      return {
        league: item.league.name,
        home: item.teams.home.name,
        away: item.teams.away.name,

        actualScore: `${actualHome} x ${actualAway}`,
        predictedScore: `${predictedHome} x ${predictedAway}`,

        outcome,
        predictedOutcome,

        correct,

        confidence: correct ? 80 : 40, // base inicial (vamos evoluir depois)
      };
    });

    const accuracy =
      (results.filter((r) => r.correct).length / results.length) * 100;

    return res.json({
      success: true,
      date,
      total: results.length,
      accuracy: accuracy.toFixed(2),
      results,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});