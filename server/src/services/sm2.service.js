/**
 * Classical SuperMemo-2 (SM-2) Spaced Repetition Algorithm
 * Grade scale:
 * 0 or 1: Total blackout / incorrect response
 * 3: Difficult response (recalled with hesitation)
 * 4: Good response (recalled with minor delay)
 * 5: Perfect recall
 */
export function calculateSM2({ easeFactor = 2.5, interval = 1, repetitions = 0, grade }) {
  const g = Math.max(0, Math.min(5, Number(grade)));

  let newEF = easeFactor + (0.1 - (5 - g) * (0.08 + (5 - g) * 0.02));
  if (newEF < 1.3) newEF = 1.3; // Hard floor per SM-2 standard

  let newRepetitions = repetitions;
  let newInterval = interval;

  if (g < 3) {
    // Incorrect / failure to recall
    newRepetitions = 0;
    newInterval = 1;
  } else {
    // Successful recall
    if (newRepetitions === 0) {
      newInterval = 1;
    } else if (newRepetitions === 1) {
      newInterval = 6;
    } else {
      newInterval = Math.round(interval * newEF);
    }
    newRepetitions += 1;
  }

  // Calculate next review timestamp
  const nextReviewAt = new Date();
  nextReviewAt.setDate(nextReviewAt.getDate() + newInterval);

  return {
    easeFactor: Number(newEF.toFixed(2)),
    interval: newInterval,
    repetitions: newRepetitions,
    nextReviewAt,
  };
}
