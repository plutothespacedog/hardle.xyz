import React, {useContext} from 'react'
import {AppContext} from "../App";

// Left-hand tile: letters in the word but in the wrong spot.
function YellowCount({attemptVal}) {
  const {rowCounts, currAttempt, gameOver} = useContext(AppContext);
  const counts = rowCounts[attemptVal];
  const yellowCount = counts ? counts.yellow : 0;

  const revealYellowCount = counts ? yellowCount : "";
  const colorState = ((currAttempt.attempt > 9 || gameOver.guessedWord) ? "blank" : ((counts && yellowCount !== 0) ? "almost" : "error"));
  return <div className='letter' id={colorState}>{revealYellowCount}</div>
};

export default YellowCount
