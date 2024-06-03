import React, {useContext} from 'react'
import {AppContext} from "../App";

function YellowCount({attemptVal}) {
  const {board, correctWord, currAttempt, gameOver} = useContext(AppContext);

  let rowsWord = "";
  let yellowCount = 0;
  for (let i = 0; i < 5; i++) {
    rowsWord += board[attemptVal][i];
  }

  let counter = 0
  for (const char of rowsWord) {
    if (correctWord.toUpperCase().includes(char) && char !== correctWord.toUpperCase()[counter] && rowsWord.split(char).length <= correctWord.split(char).length){
      yellowCount ++;
    }
    counter ++
  }

  const revealYellowCount = currAttempt.attempt > attemptVal ? yellowCount : "";
  const colorState = ((currAttempt.attempt > 9 || gameOver.guessedWord) ? "blank" : ((currAttempt.attempt > attemptVal && yellowCount !== 0) ? "almost" : "error"));
  return <div className='letter' id={colorState}>{revealYellowCount}</div>
};

export default YellowCount