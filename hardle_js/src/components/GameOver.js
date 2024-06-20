import React, {useContext} from 'react'
import {AppContext} from "../App"

function GameOver() {
    const {gameOver, setGameOver, correctWord, currAttempt} = useContext(AppContext)
  return (
    <div className='gameOver'>
        <h3>{gameOver.guessedWord ? "You Won!" : "You failed!"}</h3>
        {!gameOver.guessedWord && (<h3>Correct Word Was: {correctWord}</h3>)}
        {gameOver.guessedWord && (<h3> You solved in {currAttempt.attempt} {currAttempt.attempt === 1 ? "attempt" : "attempts"}</h3>)}
    </div>
  )
}

export default GameOver