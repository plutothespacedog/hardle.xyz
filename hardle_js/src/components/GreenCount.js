import React, {useContext} from 'react'
import {AppContext} from "../App";

// Right-hand tile: letters in the right spot.
function GreenCount({attemptVal}) {
  const {rowCounts, currAttempt, gameOver} = useContext(AppContext);
  const counts = rowCounts[attemptVal];
  const greenCount = counts ? counts.green : 0;

  const revealGreenCount = counts ? greenCount : "";
  const colorState = ((currAttempt.attempt > 9 || gameOver.guessedWord) ? "blank" : ((counts && greenCount !== 0) ? "correct" : "error"));
  return <div className='letter' id={colorState}>{revealGreenCount}</div>
};

export default GreenCount
