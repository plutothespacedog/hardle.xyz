import React, { useEffect, useRef } from 'react'

// One example row: yellow count, five letters, green count.
function ExampleRow({ yellow, letters, green }) {
  return (
    <div className='helpRow' aria-hidden='true'>
      <span className={`helpTile ${yellow ? 'helpAlmost' : 'helpNone'}`}>{yellow}</span>
      {letters.split('').map((l, i) => (
        <span key={i} className='helpTile'>{l}</span>
      ))}
      <span className={`helpTile ${green ? 'helpCorrect' : 'helpNone'}`}>{green}</span>
    </div>
  )
}

// "How to play" popup. Closes with the ×, the Got it button, Escape, or a click outside.
function Help({ onClose }) {
  const closeRef = useRef(null)

  useEffect(() => {
    closeRef.current?.focus()
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className='helpBackdrop' onClick={onClose}>
      <div
        className='helpPanel'
        role='dialog'
        aria-modal='true'
        aria-labelledby='helpTitle'
        onClick={(e) => e.stopPropagation()}
      >
        <button type='button' className='helpClose' onClick={onClose} aria-label='Close' ref={closeRef}>×</button>

        <h2 id='helpTitle'>How to play</h2>
        <p className='helpLead'>Guess the hidden 5-letter word in 10 tries.</p>

        <ul className='helpList'>
          <li>Each guess has to be a real 5-letter word.</li>
          <li>
            Unlike Wordle, the letters <strong>don't</strong> change color. You only get two numbers:
          </li>
        </ul>

        <div className='helpKey'>
          <div><span className='helpTile helpCorrect helpKeyTile'>#</span><span>on the <strong>right</strong>: right letter, right spot</span></div>
          <div><span className='helpTile helpAlmost helpKeyTile'>#</span><span>on the <strong>left</strong>: right letter, wrong spot</span></div>
        </div>

        <p className='helpExampleLabel'>Example: the word is <strong>GHOST</strong></p>
        <ExampleRow yellow={2} letters='STONE' green={1} />
        <p className='helpExampleNote'>
          <strong>O</strong> is in the right spot (green 1). <strong>S</strong> and <strong>T</strong> are in
          the word but in the wrong spots (yellow 2). You're not told which letters they are.
          Working that out is the hard part.
        </p>

        <h3>Modes</h3>
        <ul className='helpList'>
          <li><strong>Daily:</strong> everyone gets the same word, with a new one at midnight. One try per day.</li>
          <li><strong>Freestyle:</strong> a new word every game. Solve it in few guesses and little time to get a high score, then add your initials to the leaderboard.</li>
        </ul>

        <h3>Scoring</h3>
        <p>
          The clock starts when you press play. Fewer guesses and faster solves both count.
          In Freestyle you get 100 points for every guess under 11, plus up to 600 speed points:
          300 at 5 minutes, 200 at 10 minutes, and so on, so faster always scores more.
          The Speedrun board ranks pure time.
        </p>

        <div className='helpCredits'>
          <h3>Credits</h3>
          <p>
            Hardle is a fan-made mash-up of two great games:
          </p>
          <ul className='helpList'>
            <li>
              <a href='https://www.nytimes.com/games/wordle/index.html' target='_blank' rel='noreferrer'>Wordle</a>,
              created by Josh Wardle and now published by The New York Times. Hardle borrows the
              daily 5-letter word.
            </li>
            <li>
              <a href='https://en.wikipedia.org/wiki/Mastermind_(board_game)' target='_blank' rel='noreferrer'>Mastermind</a>,
              the code-breaking board game invented by Mordecai Meirowitz in 1970. Hardle borrows its
              feedback, where you learn <em>how many</em> pegs are right but not <em>which</em> ones.
            </li>
          </ul>
          <p className='helpFine'>Hardle isn't affiliated with or endorsed by either.</p>
        </div>

        <button type='button' className='pillButton helpGotIt' onClick={onClose}>Got it</button>
      </div>
    </div>
  )
}

export default Help
