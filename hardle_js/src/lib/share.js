import { formatTime } from '../components/Timer';
import { suspicionShort } from './suspicion';

// Spoiler-free result to paste anywhere. Each row shows that guess's clue as
// five squares: 🟩 per right-spot letter, 🟨 per wrong-spot letter, ⬜ for the rest.
export function buildShareText({ mode, dailyNumber, won, guesses, timeMs, score, rowCounts }) {
  const title = mode === 'daily' ? `Hardle Daily #${dailyNumber}` : 'Hardle Freestyle';
  const result = won ? `${guesses}/10` : 'X/10';
  const extras = [`⏱️ ${formatTime(timeMs)}`];
  if (won) extras.push(`⭐ ${score}`);

  const grid = rowCounts
    .slice(0, guesses)
    .filter(Boolean)
    .map(({ green, yellow }) =>
      '🟩'.repeat(green) + '🟨'.repeat(yellow) + '⬜'.repeat(Math.max(0, 5 - green - yellow))
    );

  const callout = suspicionShort(mode, won, guesses, timeMs);
  return [
    `${title} ${result}  ${extras.join('  ')}`,
    ...(callout ? [callout] : []),
    '',
    ...grid,
    '',
    'hardle.xyz',
  ].join('\n');
}

// Opens the phone's share sheet when there is one, otherwise copies to the clipboard.
// Resolves to 'shared', 'copied', or 'failed'.
export async function shareText(text) {
  const isTouch = typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches;
  if (isTouch && navigator.share) {
    try {
      await navigator.share({ text });
      return 'shared';
    } catch (err) {
      if (err && err.name === 'AbortError') return 'shared'; // user closed the sheet
    }
  }
  try {
    await navigator.clipboard.writeText(text);
    return 'copied';
  } catch {
    // Older browsers: copy via a hidden text box.
    try {
      const box = document.createElement('textarea');
      box.value = text;
      box.setAttribute('readonly', '');
      box.style.position = 'fixed';
      box.style.opacity = '0';
      document.body.appendChild(box);
      box.select();
      const ok = document.execCommand('copy');
      box.remove();
      return ok ? 'copied' : 'failed';
    } catch {
      return 'failed';
    }
  }
}
