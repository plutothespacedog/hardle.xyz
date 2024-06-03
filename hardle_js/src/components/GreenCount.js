import React, {useContext} from 'react'
import {AppContext} from "../App";

function GreenCount({attemptVal}) {
  const {board, correctWord, currAttempt, gameOver} = useContext(AppContext);

  let rowsWord = "";
  let greenCount = 0;
  for (let i = 0; i < 5; i++) {
    rowsWord += board[attemptVal][i];
  }

  for (let i = 0; i<5; i++) {
    if(rowsWord[i] === correctWord[i]){
      greenCount ++;
    }
  }

  const revealGreenCount = currAttempt.attempt > attemptVal ? greenCount : "";
  const colorState = ((currAttempt.attempt > 9 || gameOver.guessedWord) ? "blank" : ((currAttempt.attempt > attemptVal && greenCount !== 0) ? "correct" : "error"));
  return <div className='letter' id={colorState}>{revealGreenCount}</div>
};

export default GreenCount