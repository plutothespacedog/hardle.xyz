import React, { useEffect, useMemo, useState } from 'react'
import { fetchTop, boardIsShared, GLOBAL_LIMIT } from '../lib/leaderboard'
import { isTestWord, dateForDaily } from '../lib/daily'
import { getPersonalBoards } from '../lib/personal'
import { formatTime } from './Timer'

// Two boards:
//   Global   - the arcade board everyone shares (Freestyle only)
//   Personal - your best Freestyle and Daily games on this device
// Both can be sorted by High score or Speedrun.
function Leaderboard({ onBack }) {
  const [scope, setScope] = useState('global')
  const [kind, setKind] = useState('score')

  return (
    <div className='leaderboard'>
      <h1 className='leaderboardTitle'>🏆 Leaderboard</h1>

      <Tabs
        label='Which leaderboard'
        value={scope}
        onChange={setScope}
        options={[['global', 'Global'], ['personal', 'Personal']]}
        big
      />

      <p className='leaderboardSub'>
        {scope === 'global'
          ? <>Freestyle top {GLOBAL_LIMIT}{boardIsShared ? '' : ' · saved on this device'}{isTestWord && ' (test mode)'}</>
          : <>Your best games on this device{isTestWord && ' (test mode)'}</>}
      </p>

      <Tabs
        label='Sort by'
        value={kind}
        onChange={setKind}
        options={[['score', 'High score'], ['speed', 'Speedrun']]}
      />

      {scope === 'global' ? <GlobalBoard kind={kind} /> : <PersonalBoard kind={kind} />}

      <p className='leaderboardHow'>
        {kind === 'score'
          ? 'Score = 100 points for every guess under 11, plus up to 600 speed points (300 at 5 minutes, 200 at 10 minutes, and so on: faster always scores more).'
          : 'Fastest solves, any number of guesses.'}
      </p>

      <div className='gameOverActions'>
        <button type='button' className='pillButton' onClick={onBack}>Menu</button>
      </div>
    </div>
  )
}

function Tabs({ label, value, onChange, options, big }) {
  return (
    <div className={big ? 'tabs tabsBig' : 'tabs'} role='tablist' aria-label={label}>
      {options.map(([key, text]) => (
        <button
          key={key}
          type='button'
          role='tab'
          aria-selected={value === key}
          className={value === key ? 'tab tabActive' : 'tab'}
          onClick={() => onChange(key)}
        >
          {text}
        </button>
      ))}
    </div>
  )
}

function GlobalBoard({ kind }) {
  const [rows, setRows] = useState(null)
  const [error, setError] = useState('')

  let lastEntryId = null
  try { lastEntryId = sessionStorage.getItem('hardle-last-entry') } catch {}

  useEffect(() => {
    let cancelled = false
    setRows(null)
    setError('')
    fetchTop(kind)
      .then((r) => { if (!cancelled) setRows(r) })
      .catch((e) => { if (!cancelled) setError(e.message) })
    return () => { cancelled = true }
  }, [kind])

  if (error) return <p className='formError'>{error}</p>
  if (rows === null) return <p className='leaderboardEmpty'>Loading…</p>
  if (rows.length === 0) return <p className='leaderboardEmpty'>No scores yet. Be the first!</p>

  return (
    <table className='leaderboardTable'>
      <thead>
        <tr>
          <th>#</th>
          <th>Name</th>
          <th>Word</th>
          <th>{kind === 'score' ? 'Score' : 'Time'}</th>
          <th>{kind === 'score' ? 'Guesses / Time' : 'Guesses'}</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r, i) => (
          <tr key={r.id} className={String(r.id) === lastEntryId ? 'rowMine' : undefined}>
            <td>{i + 1}</td>
            <td className='lbName'>{r.name}</td>
            <td className='lbWord'>{r.word ? r.word.toUpperCase() : '–'}</td>
            <td className='lbMain'>{kind === 'score' ? r.score : formatTime(r.time_ms)}</td>
            <td className='lbSub'>
              {kind === 'score' ? `${r.guesses} · ${formatTime(r.time_ms)}` : r.guesses}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

function PersonalBoard({ kind }) {
  const boards = useMemo(() => getPersonalBoards(kind), [kind])
  return (
    <div className='personalBoards'>
      <PersonalSection
        title='Freestyle'
        board={boards.freestyle}
        kind={kind}
        empty='Win a Freestyle game to start your personal board.'
        label={(g) => g.word.toUpperCase()}
      />
      <PersonalSection
        title='Daily'
        board={boards.daily}
        kind={kind}
        empty='Solve a Daily to start your personal board.'
        label={(g) => `#${g.day}`}
        sublabel={(g) => dateForDaily(g.day).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
      />
    </div>
  )
}

function PersonalSection({ title, board, kind, empty, label, sublabel }) {
  return (
    <section className='personalSection'>
      <h2>{title}</h2>
      {!board.bests ? (
        <p className='leaderboardEmpty'>{empty}</p>
      ) : (
        <>
          <div className='personalBests'>
            <Best value={board.bests.bestScore} label='Best score' />
            <Best value={formatTime(board.bests.fastest)} label='Fastest' />
            <Best value={board.bests.fewest} label='Fewest guesses' />
            <Best value={board.bests.played} label={board.bests.played === 1 ? 'Win' : 'Wins'} />
          </div>
          <table className='leaderboardTable'>
            <thead>
              <tr>
                <th>#</th>
                <th>{title === 'Daily' ? 'Puzzle' : 'Word'}</th>
                <th>{kind === 'score' ? 'Score' : 'Time'}</th>
                <th>{kind === 'score' ? 'Guesses / Time' : 'Guesses'}</th>
              </tr>
            </thead>
            <tbody>
              {board.top.map((g, i) => (
                <tr key={`${g.at}-${i}`}>
                  <td>{i + 1}</td>
                  <td className='lbWord'>
                    {label(g)}
                    {sublabel && <span className='lbDate'>{sublabel(g)}</span>}
                  </td>
                  <td className='lbMain'>{kind === 'score' ? g.score : formatTime(g.time_ms)}</td>
                  <td className='lbSub'>
                    {kind === 'score' ? `${g.guesses} · ${formatTime(g.time_ms)}` : g.guesses}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </section>
  )
}

function Best({ value, label }) {
  return (
    <div className='resultsStat'>
      <div className='personalBestValue'>{value}</div>
      <div className='resultsStatLabel'>{label}</div>
    </div>
  )
}

export default Leaderboard
