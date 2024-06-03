import React, {useContext} from 'react'
import {AppContext} from "../App";

function Letter({letterPos, attemptVal}) {
  const {board, correctWord, currAttempt, gameOver} = useContext(AppContext);
  const letter = board[attemptVal][letterPos];
  const currWord = board[attemptVal].join("");
  

  const correct = correctWord.toUpperCase()[letterPos] === letter;
  const almost =!correct && letter !== "" && correctWord.toUpperCase().includes(letter)
  && currWord.split(letter).length <= correctWord.split(letter).length;

  const letterState = (currAttempt.attempt === 10 || gameOver.guessedWord) && 
  (correct ? "correct" : almost ? "almost" : "error");
  return <div className='letter' id={letterState}>{letter}</div>
  
}

export default Letter