const { mean, exp, factorial } = require("mathjs");

/**
 * Poisson simples (probabilidade de X gols)
 */
function poisson(lam, x) {
  return (Math.pow(lam, x) * Math.exp(-lam)) / factorial(x);
}

/**
 * Gera distribuição de placares prováveis
 */
function generateScoreMatrix(homeAvg, awayAvg) {
  const maxGoals = 5;
  const matrix = [];

  for (let home = 0; home <= maxGoals; home++) {
    for (let away = 0; away <= maxGoals; away++) {
      const prob =
        poisson(homeAvg, home) * poisson(awayAvg, away);

      matrix.push({
        home,
        away,
        prob: Number(prob.toFixed(4)),
      });
    }
  }

  return matrix.sort((a, b) => b.prob - a.prob);
}

/**
 * Probabilidade resultado final
 */
function resultProbabilities(homeAvg, awayAvg) {
  let win = 0,
    draw = 0,
    loss = 0;

  for (let h = 0; h <= 5; h++) {
    for (let a = 0; a <= 5; a++) {
      const p =
        poisson(homeAvg, h) * poisson(awayAvg, a);

      if (h > a) win += p;
      else if (h === a) draw += p;
      else loss += p;
    }
  }

  return {
    homeWin: Number(win.toFixed(4)),
    draw: Number(draw.toFixed(4)),
    awayWin: Number(loss.toFixed(4)),
  };
}

/**
 * MOTOR PRINCIPAL
 */
function predictMatch(homeStats, awayStats) {
  const homeAvgGoals =
    homeStats.goalsScored / homeStats.games;

  const awayAvgGoals =
    awayStats.goalsScored / awayStats.games;

  const homeConcede =
    homeStats.goalsConceded / homeStats.games;

  const awayConcede =
    awayStats.goalsConceded / awayStats.games;

  // força ofensiva simples
  const homeAttack = (homeAvgGoals + awayConcede) / 2;
  const awayAttack = (awayAvgGoals + homeConcede) / 2;

  const probabilities = resultProbabilities(
    homeAttack,
    awayAttack
  );

  const scores = generateScoreMatrix(
    homeAttack,
    awayAttack
  );

  return {
    homeAttack,
    awayAttack,
    probabilities,
    topScores: scores.slice(0, 5),
  };
}

module.exports = {
  predictMatch,
};