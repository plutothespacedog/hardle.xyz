import React, { useEffect, useRef, useState } from 'react'
import { formatTime } from './Timer'
import { suspicionShort } from '../lib/suspicion'

// Landing page. Pick Daily (same word for everyone today) or Freestyle (new word
// every time, arcade-style leaderboard). The clock starts when a game starts.
function StartScreen({ ready, dailyNumber, dailyResult, dailyInProgress, onDaily, onFreestyle, onLeaderboard, onHelp, onResetDaily }) {
  // Easter egg: tap the logo 5 times quickly to play the original Hardle.
  const taps = useRef({ count: 0, last: 0 })
  const [bounce, setBounce] = useState(0)
  const [unlocked, setUnlocked] = useState(false)
  // Coming back with the browser's back button restores this page from a
  // snapshot, so clear the "unlocked" message and start the tap count over.
  useEffect(() => {
    const onPageShow = (e) => {
      if (e.persisted) {
        taps.current = { count: 0, last: 0 }
        setUnlocked(false)
      }
    }
    window.addEventListener('pageshow', onPageShow)
    return () => window.removeEventListener('pageshow', onPageShow)
  }, [])

  const onLogoTap = () => {
    if (unlocked) return
    const now = Date.now()
    const t = taps.current
    t.count = now - t.last < 1500 ? t.count + 1 : 1
    t.last = now
    setBounce((b) => b + 1)
    if (t.count >= 5) {
      setUnlocked(true)
      setTimeout(() => {
        window.location.href = `${process.env.PUBLIC_URL}/classic/index.html`
      }, 1200)
    }
  }

  const today = new Date().toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className='startScreen'>
      {/* Logo: one Hardle row — yellow count, five letters, green count */}
      <div
        key={bounce}
        className={bounce ? 'startLogo startLogoBounce' : 'startLogo'}
        aria-hidden='true'
        onClick={onLogoTap}
      >
        <span className='startTile startTileAlmost'>2</span>
        <span className='startTile' />
        <span className='startTile' />
        <span className='startTile' />
        <span className='startTile' />
        <span className='startTile' />
        <span className='startTile startTileCorrect'>1</span>
      </div>

      {unlocked && (
        <div className='toastWrap' role='status'>
          <div className='toast classicToast'>🕹️ Classic Hardle unlocked!</div>
        </div>
      )}

      <h1 className='startTitle'>Hardle</h1>
      <p className='startTagline'>
        Like Wordle, but Harder!
      </p>

      <div className='startModes'>
        <div className='startMode'>
          {dailyResult ? (
            <>
              <button type='button' className='startPlay' disabled>
                Daily done ✓
              </button>
              <p className='startModeNote'>
                {dailyResult.solved
                  ? `Solved in ${dailyResult.guesses} ${dailyResult.guesses === 1 ? 'guess' : 'guesses'}, ${formatTime(dailyResult.timeMs)}`
                  : `Missed it — the word was ${dailyResult.word.toUpperCase()}`}
                {suspicionShort('daily', dailyResult.solved, dailyResult.guesses, dailyResult.timeMs) && (
                  <span className='startCallout'>
                    {suspicionShort('daily', dailyResult.solved, dailyResult.guesses, dailyResult.timeMs)}
                  </span>
                )}
                <span className='startNextPuzzle'>New puzzle at midnight</span>
              </p>
            </>
          ) : (
            <>
              <button type='button' className='startPlay' onClick={onDaily} disabled={!ready} autoFocus>
                {dailyInProgress ? 'Continue Daily' : 'Daily'}
              </button>
              <p className='startModeNote'>
                {dailyInProgress
                  ? "Your clock is still running."
                  : 'Same word for everyone today. One try.'}
              </p>
            </>
          )}
        </div>

        <div className='startMode'>
          <button
            type='button'
            className='startPlay startPlayAlt'
            onClick={onFreestyle}
            disabled={!ready}
            autoFocus={Boolean(dailyResult)}
          >
            Freestyle
          </button>
          <p className='startModeNote'>New word every game. Chase a high score.</p>
        </div>
      </div>

      <div className='startLinks'>
        <button type='button' className='linkButton' onClick={onHelp}>
          How to play
        </button>
        <button type='button' className='linkButton' onClick={onLeaderboard}>
          🏆 Leaderboard
        </button>
      </div>

      <p className='startDate'>
        {today}
        <br />
        <span className='startNumber'>No. {dailyNumber}</span>
      </p>

      {/* Local testing only: never shown on the live site. */}
      {process.env.NODE_ENV === 'development' && (
        <button type='button' className='linkButton devReset' onClick={onResetDaily}>
          Reset Daily (testing)
        </button>
      )}
    </div>
  );
}

export default StartScreen
