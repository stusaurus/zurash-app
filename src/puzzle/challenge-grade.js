// Challenge scoring for independently certified solo stages.
// Minima are computed by the COMPLETE BFS solver in CI, never guessed by the UI.
// One turn means one "prepare (optional wall/item) + slide" action.
export function validateChallenge(stage) {
  const challenge = stage?.challenge;
  if (challenge === undefined) return null;
  const {minimumTurns, aThrough, passThrough, verifiedBy} = challenge;
  if (!Number.isSafeInteger(minimumTurns) || minimumTurns < 1 ||
      !Number.isSafeInteger(aThrough) || !Number.isSafeInteger(passThrough) ||
      !(minimumTurns <= aThrough && aThrough <= passThrough) ||
      verifiedBy !== 'complete-bfs-solo-v1') {
    throw Error('Invalid certified challenge thresholds');
  }
  return {minimumTurns,aThrough,passThrough};
}

export function evaluateChallenge(stage, turns) {
  const goals=validateChallenge(stage);
  if (!goals) return null;
  if (!Number.isSafeInteger(turns) || turns < goals.minimumTurns) {
    throw Error('Completed game has impossible turn count');
  }
  const rank=turns===goals.minimumTurns?'S':
    turns<=goals.aThrough?'A':
    turns<=goals.passThrough?'B':'unqualified';
  return {...goals,turns,extraTurns:turns-goals.minimumTurns,rank,
    passed:rank!=='unqualified'};
}
