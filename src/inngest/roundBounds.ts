export function assertCanGenerateRound(
  roundIndex: number,
  expectedRounds: number,
) {
  if (roundIndex >= expectedRounds) {
    throw new Error(`Generation returned more than ${expectedRounds} rounds`);
  }
}

export function assertExactRoundCount(
  actualRounds: number,
  expectedRounds: number,
) {
  if (actualRounds !== expectedRounds) {
    throw new Error(
      `Generation returned ${actualRounds} rounds; exactly ${expectedRounds} are required`,
    );
  }
}
