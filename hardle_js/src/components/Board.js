import React, { useContext } from 'react';
import { AppContext } from '../App';
import Letter from './Letter';
import YellowCount from './YellowCount';
import GreenCount from './GreenCount';

const ROWS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
const LETTERS = [0, 1, 2, 3, 4];

// 10 rows of: yellow count, five letters, green count.
function Board() {
  const { shake } = useContext(AppContext);

  return (
    <div className='board'>
      {ROWS.map((row) => {
        const shaking = shake && shake.row === row;
        return (
          <div
            // Changing the key restarts the shake animation on repeat misses.
            key={shaking ? `${row}-${shake.id}` : row}
            className={shaking ? 'row rowShake' : 'row'}
          >
            <YellowCount attemptVal={row} />
            {LETTERS.map((pos) => (
              <Letter key={pos} letterPos={pos} attemptVal={row} />
            ))}
            <GreenCount attemptVal={row} />
          </div>
        );
      })}
    </div>
  );
}

export default Board;
