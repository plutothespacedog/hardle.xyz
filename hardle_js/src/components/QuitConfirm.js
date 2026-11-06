import React, { useEffect, useRef } from 'react'

// Shown when you press back during a Freestyle game. The clock keeps running.
function QuitConfirm({ onStay, onQuit }) {
  const stayRef = useRef(null)

  useEffect(() => {
    stayRef.current?.focus()
    const onKey = (e) => { if (e.key === 'Escape') onStay() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onStay])

  return (
    <div className='helpBackdrop helpBackdropCenter' onClick={onStay}>
      <div
        className='helpPanel quitPanel'
        role='alertdialog'
        aria-modal='true'
        aria-labelledby='quitTitle'
        aria-describedby='quitBody'
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id='quitTitle'>Quit this game?</h2>
        <p id='quitBody'>
          Leaving ends this Freestyle game. Your guesses will be lost and your next game
          starts over with a new word.
        </p>
        <p className='resultsMuted'>⏱️ The clock is still running.</p>
        <div className='gameOverActions'>
          <button type='button' className='pillButton' onClick={onStay} ref={stayRef}>Keep playing</button>
          <button type='button' className='pillButton pillButtonDanger' onClick={onQuit}>Quit game</button>
        </div>
      </div>
    </div>
  )
}

export default QuitConfirm
