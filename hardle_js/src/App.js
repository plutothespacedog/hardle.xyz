import './App.css';
import Board from './components/Board';
import Keyboard from './components/Keyboard';
import GameOver from './components/GameOver';
import {createContext, useState, useEffect} from "react";
import { boardDefault, generateGuessesSet, generateSecretSet } from './components/Words';

export const AppContext = createContext()

function App() {
  const [board, setBoard] = useState(boardDefault);
  const [currAttempt, setCurrrAttempt] = useState({attempt: 0, letterPos: 0});
  const [guessSet, setGuessSet] = useState(new Set());
  const [secretSet, setSecretSet] = useState(new Set());
  //const [correctWord, setCorrectWord] = useState("");
  const [gameOver, setGameOver] = useState({gameOver: false, guessedWord: false});

  useEffect(() => {
    generateGuessesSet().then((words) => {
      setGuessSet(words.guessSet);
    });
  }, []);
  
  const correctWord = "HIRED";
  /*
  useEffect(() => {
    generateSecretSet().then((words) => {
      setSecretSet(words.secretSet);
      setCorrectWord(words.todaysWord);
    });
  }, []);

  */
  const onSelectLetter = (keyVal) => {
    if (currAttempt.letterPos >4) return;
    const newBoard = [...board];
    newBoard[currAttempt.attempt][currAttempt.letterPos] = keyVal;
    setBoard(newBoard);
    setCurrrAttempt({...currAttempt, letterPos: currAttempt.letterPos + 1})
  };

  const onDelete = () => {
    if(currAttempt.letterPos ===0) return;
    const newBoard = [...board];
    newBoard[currAttempt.attempt][currAttempt.letterPos -1] = "";
    setBoard(newBoard)
    setCurrrAttempt({...currAttempt, letterPos: currAttempt.letterPos -1})
  };

  const onEnter = () => {
    if(currAttempt.letterPos !==5) return;

    let currWord = "";
    for (let i = 0; i < 5; i++) {
      currWord += board[currAttempt.attempt][i];
    }

    if(guessSet.has(currWord.toLowerCase())) {
      setCurrrAttempt({attempt: currAttempt.attempt +1, letterPos: 0});
    }else {
      alert("Not a word. Try Again.");
      return;
    }

    if (currWord === correctWord) {
      setGameOver({gameOver: true, guessedWord: true});
      return;
    }
    if (currAttempt.attempt === 9) {
      setGameOver({gameOver: true, guessedWord: false });
    }
  };

  return (
    <div className="App">
      <nav>
        <h1>Hardle</h1>
      </nav>
      <AppContext.Provider value={{board, setBoard, currAttempt, setCurrrAttempt, onSelectLetter, onEnter, onDelete, correctWord, setGameOver, gameOver}}>
        <div className='game'>
          <Board />
          {gameOver.gameOver ? <GameOver /> : <Keyboard />}
        </div>
      </AppContext.Provider>
    </div>
  );
}


export default App;
