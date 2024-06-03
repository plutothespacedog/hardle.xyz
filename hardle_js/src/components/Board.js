import React, { useState } from 'react';
import { boardDefault } from './Words';
import Letter from './Letter';
import YellowCount from './YellowCount';
import GreenCount from './GreenCount';

function Board() {
    const [board, setBoard] = useState(boardDefault);
  return ( <div className='board'>
    <div className='row'> 
        <YellowCount          attemptVal={0}/>
        <Letter letterPos={0} attemptVal={0}/>
        <Letter letterPos={1} attemptVal={0}/>
        <Letter letterPos={2} attemptVal={0}/>
        <Letter letterPos={3} attemptVal={0}/>
        <Letter letterPos={4} attemptVal={0}/>
        <GreenCount           attemptVal={0}/>
    </div>
    <div className='row'> 
        <YellowCount          attemptVal={1}/>
        <Letter letterPos={0} attemptVal={1}/>
        <Letter letterPos={1} attemptVal={1}/>
        <Letter letterPos={2} attemptVal={1}/>
        <Letter letterPos={3} attemptVal={1}/>
        <Letter letterPos={4} attemptVal={1}/>
        <GreenCount           attemptVal={1}/>
    </div>
    <div className='row'> 
        <YellowCount          attemptVal={2}/>
        <Letter letterPos={0} attemptVal={2}/>
        <Letter letterPos={1} attemptVal={2}/>
        <Letter letterPos={2} attemptVal={2}/>
        <Letter letterPos={3} attemptVal={2}/>
        <Letter letterPos={4} attemptVal={2}/>
        <GreenCount           attemptVal={2}/>
    </div>
    <div className='row'> 
        <YellowCount          attemptVal={3}/>
        <Letter letterPos={0} attemptVal={3}/>
        <Letter letterPos={1} attemptVal={3}/>
        <Letter letterPos={2} attemptVal={3}/>
        <Letter letterPos={3} attemptVal={3}/>
        <Letter letterPos={4} attemptVal={3}/>
        <GreenCount           attemptVal={3}/>
    </div>
    <div className='row'> 
        <YellowCount          attemptVal={4}/>
        <Letter letterPos={0} attemptVal={4}/>
        <Letter letterPos={1} attemptVal={4}/>
        <Letter letterPos={2} attemptVal={4}/>
        <Letter letterPos={3} attemptVal={4}/>
        <Letter letterPos={4} attemptVal={4}/>
        <GreenCount           attemptVal={4}/>
    </div>
    <div className='row'> 
        <YellowCount          attemptVal={5}/>
        <Letter letterPos={0} attemptVal={5}/>
        <Letter letterPos={1} attemptVal={5}/>
        <Letter letterPos={2} attemptVal={5}/>
        <Letter letterPos={3} attemptVal={5}/>
        <Letter letterPos={4} attemptVal={5}/>
        <GreenCount           attemptVal={5}/>
    </div>
    <div className='row'> 
        <YellowCount          attemptVal={6}/>
        <Letter letterPos={0} attemptVal={6}/>
        <Letter letterPos={1} attemptVal={6}/>
        <Letter letterPos={2} attemptVal={6}/>
        <Letter letterPos={3} attemptVal={6}/>
        <Letter letterPos={4} attemptVal={6}/>
        <GreenCount           attemptVal={6}/>
    </div>
    <div className='row'> 
        <YellowCount          attemptVal={7}/>
        <Letter letterPos={0} attemptVal={7}/>
        <Letter letterPos={1} attemptVal={7}/>
        <Letter letterPos={2} attemptVal={7}/>
        <Letter letterPos={3} attemptVal={7}/>
        <Letter letterPos={4} attemptVal={7}/>
        <GreenCount           attemptVal={7}/>
    </div>
    <div className='row'> 
        <YellowCount          attemptVal={8}/>
        <Letter letterPos={0} attemptVal={8}/>
        <Letter letterPos={1} attemptVal={8}/>
        <Letter letterPos={2} attemptVal={8}/>
        <Letter letterPos={3} attemptVal={8}/>
        <Letter letterPos={4} attemptVal={8}/>
        <GreenCount           attemptVal={8}/>
    </div>
    <div className='row'> 
        <YellowCount          attemptVal={9}/>
        <Letter letterPos={0} attemptVal={9}/>
        <Letter letterPos={1} attemptVal={9}/>
        <Letter letterPos={2} attemptVal={9}/>
        <Letter letterPos={3} attemptVal={9}/>
        <Letter letterPos={4} attemptVal={9}/>
        <GreenCount           attemptVal={9}/>
    </div>
  </div>
  );
}

export default Board