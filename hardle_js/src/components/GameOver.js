import React, {useContext, useEffect, useMemo, useRef, useState} from 'react'
import {AppContext} from "../App"
import { formatTime } from './Timer'
import { computeScore } from '../lib/score'
import { submitScore, claimScore, isShared, boardIsShared } from '../lib/leaderboard'
import { getDailyHistory } from '../lib/daily'
import { buildShareText, shareText } from '../lib/share'
import { suspicionMessage } from '../lib/suspicion'

// A fun headline for each number of guesses (1-10). One is picked at random.
const WIN_HEADLINES = {
  1: ['Psychic.', 'One guess. ONE.'],
  2: ['Unreal!', 'Are you a wizard?'],
  3: ['Genius!', 'Big brain energy.'],
  4: ['Brilliant!', 'Smooth operator.'],
  5: ['Excellent!', 'Sharp as a tack.'],
  6: ['Great work!', 'Nicely deduced.'],
  7: ['Nice one!', 'Got there in style.'],
  8: ['Solid!', 'Slow and steady.'],
  9: ['Phew!', 'That was close.'],
  10: ['Clutch!', 'Last-guess hero!'],
};
const LOSS_HEADLINES = ['So close!', 'Hardle wins this round.', 'Ouch.', 'Not today!'];

const pick = (list) => list[Math.floor(Math.random() * list.length)];
const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 'es'}`;

function GameOver({ onPlayAgain, onMenu, onLeaderboard }) {
  const [open, setOpen] = useState(true)
  const {gameOver, currAttempt, startTime, endTime} = useContext(AppContext)
  const timeMs = endTime && startTime ? endTime - startTime : 0
  const won = gameOver.guessedWord

  return (
    <div className='gameOver'>
      <p className='gameOverSummary'>
        {won
          ? `Solved in ${plural(currAttempt.attempt, 'guess')} · ${formatTime(timeMs)}`
          : `Out of guesses · ${formatTime(timeMs)}`}
      </p>
      <button type='button' className='pillButton' onClick={() => setOpen(true)}>See results</button>
      {open && (
        <ResultsModal
          onClose={() => setOpen(false)}
          onPlayAgain={onPlayAgain}
          onMenu={onMenu}
          onLeaderboard={onLeaderboard}
        />
      )}
    </div>
  )
}

function ResultsModal({ onClose, onPlayAgain, onMenu, onLeaderboard }) {
  const {gameOver, correctWord, currAttempt, startTime, endTime, mode, serverGameId, dailyStats, dailyNumber, rowCounts} = useContext(AppContext)
  const timeMs = endTime && startTime ? endTime - startTime : 0
  const guesses = currAttempt.attempt
  const won = gameOver.guessedWord
  const isFreestyle = mode === 'freestyle'
  const score = won ? computeScore(guesses, timeMs) : 0

  // Pick the headline once, so it doesn't change on re-render.
  const headline = useMemo(
    () => (won ? pick(WIN_HEADLINES[guesses] || ['You did it!']) : pick(LOSS_HEADLINES)),
    [won, guesses]
  )
  const callout = suspicionMessage(won, guesses, timeMs)
  const history = useMemo(
    () => (isFreestyle ? null : getDailyHistory(dailyNumber, { solved: won })),
    [isFreestyle, dailyNumber, won]
  )

  const [shareStatus, setShareStatus] = useState('idle')
  const onShare = async () => {
    const text = buildShareText({ mode, dailyNumber, won, guesses, timeMs, score, rowCounts })
    const result = await shareText(text)
    setShareStatus(result)
    setTimeout(() => setShareStatus('idle'), 2000)
  }

  const closeRef = useRef(null)
  useEffect(() => {
    closeRef.current?.focus()
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className='helpBackdrop' onClick={onClose}>
      {won && <Confetti />}
      <div
        className='helpPanel resultsPanel'
        role='dialog'
        aria-modal='true'
        aria-labelledby='resultsTitle'
        onClick={(e) => e.stopPropagation()}
      >
        <button type='button' className='helpClose' onClick={onClose} aria-label='Back to the board'>×</button>

        <p className='resultsKicker'>{isFreestyle ? 'Freestyle' : `Daily #${dailyNumber}`}</p>
        <h2 id='resultsTitle' className='resultsTitle'>{headline}</h2>
        <div className='resultsWord'>
          {correctWord.toUpperCase().split('').map((l, i) => (
            <span key={i} className={`resultsTile ${won ? 'resultsTileWin' : ''}`}>{l}</span>
          ))}
        </div>

        <div className='resultsStats'>
          <Stat label='Guesses' value={won ? guesses : 'X'} />
          <Stat label='Time' value={formatTime(timeMs)} />
          <Stat label='Score' value={score} />
        </div>

        {callout && <p className='resultsCallout'>{callout}</p>}

        {!isFreestyle && <DailyToday stats={dailyStats} won={won} guesses={guesses} />}

        {history && (
          <div className='resultsSection'>
            <h3>Your Daily stats</h3>
            <div className='resultsStats resultsStatsSmall'>
              <Stat label='Played' value={history.played} />
              <Stat label='Win %' value={history.winPct} />
              <Stat label='Current streak' value={history.current} />
              <Stat label='Best streak' value={history.best} />
            </div>
          </div>
        )}

        {isFreestyle && won && (
          <NameEntry guesses={guesses} timeMs={timeMs} word={correctWord} serverGameId={serverGameId} onSaved={onLeaderboard} />
        )}

        <div className='gameOverActions'>
          <button type='button' className='pillButton shareButton' onClick={onShare}>
            {shareStatus === 'copied' ? 'Copied!' : shareStatus === 'failed' ? "Couldn't copy" : 'Share'}
          </button>
          {isFreestyle && (
            <button type='button' className='pillButton' onClick={onPlayAgain}>Play again</button>
          )}
          <button type='button' className='pillButton pillButtonAlt' onClick={onMenu}>Menu</button>
          {isFreestyle && (
            <button type='button' className='pillButton pillButtonAlt' onClick={onLeaderboard}>Leaderboard</button>
          )}
        </div>
      </div>
    </div>
  )
}

function Stat({ label, value }) {
  return (
    <div className='resultsStat'>
      <div className='resultsStatValue'>{value}</div>
      <div className='resultsStatLabel'>{label}</div>
    </div>
  )
}

// How today's Daily compares with everyone else's: percentiles + guess distribution.
function DailyToday({ stats, won, guesses }) {
  if (!isShared || stats === null) return null

  let body
  if (stats === 'loading') {
    body = <p className='resultsMuted'>Comparing with today's players…</p>
  } else if (stats === 'error') {
    body = <p className='resultsMuted'>Couldn't load today's stats right now.</p>
  } else if (stats.players <= 1) {
    body = <p className='resultsMuted'>You're the first to finish today! Check back later to see how you compare.</p>
  } else {
    const others = stats.players - 1
    body = (
      <>
        <PercentileBar label='Guesses' pct={stats.guesses} />
        <PercentileBar label='Time' pct={stats.time} />
        <PercentileBar label='Score' pct={stats.score} />
        <p className='resultsMuted'>
          Compared with {others} other {others === 1 ? 'player' : 'players'} today.
        </p>
        {stats.distribution && (
          <Distribution counts={stats.distribution} mine={won ? guesses : 11} />
        )}
      </>
    )
  }

  return (
    <div className='resultsSection'>
      <h3>How you did today</h3>
      {body}
    </div>
  )
}

function PercentileBar({ label, pct }) {
  return (
    <div className='pctRow'>
      <div className='pctHead'>
        <span>{label}</span>
        <span className='pctValue'>Better than {pct}%</span>
      </div>
      <div className='pctTrack'>
        <div className='pctFill' style={{ width: `${Math.max(pct, 2)}%` }} />
      </div>
    </div>
  )
}

// Today's players by number of guesses (1-10, then misses). Your bar is highlighted.
function Distribution({ counts, mine }) {
  const max = Math.max(1, ...counts)
  return (
    <div className='dist'>
      <h4>Today's guess distribution</h4>
      {counts.map((c, i) => {
        const bucket = i + 1
        return (
          <div key={bucket} className='distRow'>
            <span className='distLabel'>{bucket === 11 ? 'X' : bucket}</span>
            <div className='distTrack'>
              <div
                className={bucket === mine ? 'distBar distBarMine' : 'distBar'}
                style={{ width: `${Math.max(8, (100 * c) / max)}%` }}
              >
                {c}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// A short burst of falling tiles in Hardle's colors.
function Confetti() {
  const pieces = useMemo(() =>
    Array.from({ length: 36 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 0.6,
      duration: 1.8 + Math.random() * 1.4,
      size: 6 + Math.random() * 8,
      color: ['#528d4e', '#b49f39', '#ffffff'][i % 3],
      spin: Math.round(Math.random() * 720 - 360),
    })), [])
  return (
    <div className='confetti' aria-hidden='true'>
      {pieces.map((p) => (
        <span
          key={p.id}
          style={{
            left: `${p.left}%`,
            width: p.size,
            height: p.size,
            background: p.color,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
            '--spin': `${p.spin}deg`,
          }}
        />
      ))}
    </div>
  )
}

// Arcade-style initials: exactly three letters.
function NameEntry({ guesses, timeMs, word, serverGameId, onSaved }) {
  const [name, setName] = useState('')
  const [status, setStatus] = useState('idle') // idle | saving | error
  const [error, setError] = useState('')

  const onChange = (e) => {
    setName(e.target.value.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 3))
  }

  const onSubmit = async (e) => {
    e.preventDefault()
    if (name.length !== 3 || status === 'saving') return
    setStatus('saving')
    try {
      const saved = serverGameId
        ? await claimScore(serverGameId, name)
        : await submitScore({ name, word, guesses, timeMs })
      try { sessionStorage.setItem('hardle-last-entry', String(saved.id)) } catch {}
      onSaved()
    } catch (err) {
      setStatus('error')
      setError(err.message)
    }
  }

  return (
    <form className='nameEntry resultsSection' onSubmit={onSubmit}>
      <label htmlFor='initials'>Enter your initials for the {boardIsShared ? '' : 'local '}leaderboard</label>
      <div className='nameEntryRow'>
        <input
          id='initials'
          className='initialsInput'
          value={name}
          onChange={onChange}
          autoComplete='off'
          autoCapitalize='characters'
          spellCheck={false}
          placeholder='AAA'
        />
        <button type='submit' className='pillButton' disabled={name.length !== 3 || status === 'saving'}>
          {status === 'saving' ? 'Saving…' : 'Submit'}
        </button>
      </div>
      {status === 'error' && <p className='formError'>{error}. Try again.</p>}
    </form>
  )
}

export default GameOver
