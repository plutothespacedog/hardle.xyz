import React, { useEffect, useState } from 'react'

export function formatTime(ms) {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

// Shows elapsed time since startTime. Freezes at endTime once the game ends.
function Timer({ startTime, endTime }) {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (endTime) return;
    const id = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, [endTime]);

  const elapsed = (endTime || now) - startTime;
  return <div className='timer'>{formatTime(Math.max(0, elapsed))}</div>;
}

export default Timer
