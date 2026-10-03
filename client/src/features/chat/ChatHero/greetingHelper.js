/**
 * Extracts a display first name from user profile or email address.
 * @param {object|null} user
 * @returns {string|null}
 */
export function getFirstName(user) {
  if (!user) return null;
  if (typeof user.name === 'string' && user.name.trim().length > 0) {
    const first = user.name.trim().split(/\s+/)[0];
    if (first) {
      return first.charAt(0).toUpperCase() + first.slice(1);
    }
  }
  if (typeof user.email === 'string' && user.email.includes('@')) {
    const raw = user.email.split('@')[0];
    const cleaned = raw.split(/[._-]/)[0];
    if (cleaned && cleaned.length > 0) {
      return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
    }
  }
  return null;
}

/**
 * Returns time-of-day contextual greeting and subtitle.
 * @param {object|null} user
 * @param {Date} [date]
 * @returns {{ period: string, timeLabel: string, headline: string, subtitle: string }}
 */
export function getGreetingContext(user, date = new Date()) {
  const firstName = getFirstName(user);
  const hour = date.getHours();

  // 00:00 - 04:59: Late Night / Night Owl
  if (hour >= 0 && hour < 5) {
    return {
      period: 'night',
      timeLabel: 'Late Night',
      headline: firstName
        ? `Burning the midnight oil, ${firstName}?`
        : 'Hey night owl, where should we start?',
      subtitle: 'Late-night coding or deep thoughts? I’m here whenever inspiration strikes.',
    };
  }

  // 05:00 - 11:59: Morning
  if (hour >= 5 && hour < 12) {
    return {
      period: 'morning',
      timeLabel: 'Morning',
      headline: firstName
        ? `Good morning, ${firstName}!`
        : 'Good morning! Where should we start?',
      subtitle: 'Ready to start fresh? What are we building or exploring today?',
    };
  }

  // 12:00 - 16:59: Afternoon
  if (hour >= 12 && hour < 17) {
    return {
      period: 'afternoon',
      timeLabel: 'Afternoon',
      headline: firstName
        ? `Good afternoon, ${firstName}!`
        : 'Good afternoon! Where should we start?',
      subtitle: 'Let’s tackle your next task, document, or code challenge together.',
    };
  }

  // 17:00 - 20:59: Evening
  if (hour >= 17 && hour < 21) {
    return {
      period: 'evening',
      timeLabel: 'Evening',
      headline: firstName
        ? `Good evening, ${firstName}!`
        : 'Good evening! Where should we start?',
      subtitle: 'Winding down or gearing up for an evening build session?',
    };
  }

  // 21:00 - 23:59: Late Evening
  return {
    period: 'late-evening',
    timeLabel: 'Night',
    headline: firstName
      ? `Working late, ${firstName}?`
      : 'Working late? Where should we start?',
    subtitle: 'Let’s finish today’s goals strong or brainstorm something new.',
  };
}
