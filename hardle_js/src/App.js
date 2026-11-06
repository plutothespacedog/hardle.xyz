import './App.css';
import Board from './components/Board';
import Keyboard from './components/Keyboard';
import GameOver from './components/GameOver';
import StartScreen from './components/StartScreen';
import Leaderboard from './components/Leaderboard';
import Timer from './components/Timer';
import Help from './components/Help';
import Toast from './components/Toast';
import QuitConfirm from './components/QuitConfirm';
import {createContext, useState, useEffect, useCallback, useRef} from "react";
import { freshBoard, generateGuessesSet, loadSecretWords, randomWord } from './components/Words';
import { getDailyNumber, pickDailyWord, loadDailyResult, saveDailyResult, loadDailyProgress, saveDailyProgress, clearDailyProgress, isTestWord, testWord, resetDailyOnThisDevice } from './lib/daily';
import { getCounts } from './lib/feedback';
import { recordFreestyleWin } from './lib/personal';
import { isShared, boardIsShared, startServerGame, submitServerGuess, submitDaily, fetchDailyPercentiles } from './lib/leaderboard';

export const AppContext = createContext()

function App() {
  const [board, setBoard] = useState(freshBoard);
  const [currAttempt, setCurrrAttempt] = useState({attempt: 0, letterPos: 0});
  const [guessSet, setGuessSet] = useState(new Set());
  const [secretWords, setSecretWords] = useState([]);
  const [correctWord, setCorrectWord] = useState("");
  const [gameOver, setGameOver] = useState({gameOver: false, guessedWord: false});
  const [startTime, setStartTime] = useState(null);
  const [endTime, setEndTime] = useState(null);
  // Clue counts for each submitted row: [{ yellow, green }, ...]
  const [rowCounts, setRowCounts] = useState([]);
  // Shared Freestyle: the server's game id. The word stays on the server until the end.
  const [serverGameId, setServerGameId] = useState(null);
  // True while waiting on the server (starting a game or checking a guess).
  const [busy, setBusy] = useState(false);
  // In-game message ({ message, id }) and the row to shake ({ row, id }).
  const [toast, setToast] = useState(null);
  const [shake, setShake] = useState(null);
  // Daily percentiles for the results popup: null (not shared), 'loading', 'error', or the stats.
  const [dailyStats, setDailyStats] = useState(null);

  const showToast = (message) => setToast({ message, id: Date.now() });
  const rejectGuess = (message, row) => {
    showToast(message);
    setShake({ row, id: Date.now() });
  };

  // Toasts disappear on their own.
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 1800);
    return () => clearTimeout(t);
  }, [toast]);

  // 'start' | 'game' | 'leaderboard'
  const [screen, setScreen] = useState('start');
  // 'daily' | 'freestyle'
  const [mode, setMode] = useState(null);
  const [showHelp, setShowHelp] = useState(false);
  const closeHelp = useCallback(() => setShowHelp(false), []);
  const [showQuit, setShowQuit] = useState(false);
  const stayInGame = useCallback(() => setShowQuit(false), []);

  const dailyNumber = getDailyNumber();
  const [dailyResult, setDailyResult] = useState(() => loadDailyResult(dailyNumber));

  useEffect(() => {
    generateGuessesSet().then((words) => setGuessSet(words.guessSet));
    loadSecretWords().then(setSecretWords);
  }, []);

  // Stop the clock the moment the game ends (win or lose).
  useEffect(() => {
    if (gameOver.gameOver && startTime && !endTime) {
      setEndTime(Date.now());
    }
  }, [gameOver.gameOver, startTime, endTime]);

  // Remember today's daily result so it can't be replayed. Each game is saved
  // (and sent for stats) exactly once, keyed by its start time.
  const savedDailyGame = useRef(null);
  useEffect(() => {
    if (mode === 'daily' && startTime && endTime && !dailyResult && savedDailyGame.current !== startTime) {
      savedDailyGame.current = startTime;
      const result = {
        solved: gameOver.guessedWord,
        guesses: currAttempt.attempt,
        timeMs: endTime - startTime,
        word: correctWord,
      };
      saveDailyResult(dailyNumber, result);
      clearDailyProgress(dailyNumber);
      setDailyResult(result);

      // Compare with everyone else who played today.
      if (isShared) {
        setDailyStats('loading');
        const args = { day: dailyNumber, solved: result.solved, guesses: result.guesses, timeMs: result.timeMs };
        (isTestWord ? fetchDailyPercentiles(args) : submitDaily(args))
          .then((stats) => {
            setDailyStats(stats);
            if (stats.id) saveDailyResult(dailyNumber, { ...result, resultId: stats.id });
          })
          .catch(() => setDailyStats('error'));
      }
    }
  }, [mode, endTime, dailyResult, gameOver.guessedWord, currAttempt.attempt, startTime, correctWord, dailyNumber]);

  // Keep every Freestyle win for the personal leaderboard (once per game).
  const recordedFreestyleGame = useRef(null);
  useEffect(() => {
    if (mode === 'freestyle' && startTime && endTime && gameOver.guessedWord
        && recordedFreestyleGame.current !== startTime) {
      recordedFreestyleGame.current = startTime;
      recordFreestyleWin({ word: correctWord, guesses: currAttempt.attempt, timeMs: endTime - startTime });
    }
  }, [mode, startTime, endTime, gameOver.guessedWord, correctWord, currAttempt.attempt]);

  // Save a Daily game after every keystroke so it can be resumed.
  useEffect(() => {
    if (screen === 'game' && mode === 'daily' && startTime && !gameOver.gameOver) {
      saveDailyProgress(dailyNumber, {board, rowCounts, currAttempt, startTime});
    }
  }, [screen, mode, startTime, gameOver.gameOver, board, rowCounts, currAttempt, dailyNumber]);

  const startGame = async (newMode) => {
    if (secretWords.length === 0 || busy) return;

    // Daily already started today? Pick up exactly where you left off.
    if (newMode === 'daily') {
      const saved = loadDailyProgress(dailyNumber);
      if (saved) {
        setMode('daily');
        setServerGameId(null);
        setCorrectWord(pickDailyWord(secretWords, dailyNumber));
        setBoard(saved.board.map((row) => [...row]));
        setRowCounts(saved.rowCounts);
        setCurrrAttempt(saved.currAttempt);
        setGameOver({gameOver: false, guessedWord: false});
        setEndTime(null);
        setStartTime(saved.startTime);
        setScreen('game');
        return;
      }
    }

    // Shared Freestyle: the server picks the word and starts the official clock.
    let gameId = null;
    let word = '';
    if (newMode === 'freestyle' && boardIsShared) {
      setBusy(true);
      try {
        gameId = await startServerGame();
      } catch (err) {
        showToast(`Couldn't start a game: ${err.message}`);
        return;
      } finally {
        setBusy(false);
      }
    } else {
      word = newMode === 'daily'
        ? pickDailyWord(secretWords, dailyNumber)
        : testWord || randomWord(secretWords);
    }

    setMode(newMode);
    setDailyStats(null);
    setServerGameId(gameId);
    setCorrectWord(word);
    setBoard(freshBoard());
    setRowCounts([]);
    setCurrrAttempt({attempt: 0, letterPos: 0});
    setGameOver({gameOver: false, guessedWord: false});
    setEndTime(null);
    setStartTime(Date.now());
    setScreen('game');
  };

  const goToMenu = () => {
    setShowQuit(false);
    setStartTime(null);
    setScreen('start');
  };

  // Back arrow: leaving a Freestyle game in progress ends it, so ask first.
  // (Daily resumes where you left off, so it doesn't need to ask.)
  const onBack = () => {
    if (mode === 'freestyle' && !gameOver.gameOver) {
      setShowQuit(true);
    } else {
      goToMenu();
    }
  };

  const onSelectLetter = (keyVal) => {
    if (gameOver.gameOver || showHelp || showQuit || busy) return;
    if (currAttempt.letterPos >4) return;
    const newBoard = [...board];
    newBoard[currAttempt.attempt][currAttempt.letterPos] = keyVal;
    setBoard(newBoard);
    setCurrrAttempt({...currAttempt, letterPos: currAttempt.letterPos + 1})
  };

  const onDelete = () => {
    if (gameOver.gameOver || showHelp || showQuit || busy) return;
    if(currAttempt.letterPos ===0) return;
    const newBoard = [...board];
    newBoard[currAttempt.attempt][currAttempt.letterPos -1] = "";
    setBoard(newBoard)
    setCurrrAttempt({...currAttempt, letterPos: currAttempt.letterPos -1})
  };

  const onEnter = async () => {
    if (gameOver.gameOver || showHelp || showQuit || busy) return;
    if(currAttempt.letterPos !==5) return;

    let currWord = "";
    for (let i = 0; i < 5; i++) {
      currWord += board[currAttempt.attempt][i];
    }

    if(!guessSet.has(currWord.toLowerCase())) {
      rejectGuess("Not a word", currAttempt.attempt);
      return;
    }

    const row = currAttempt.attempt;

    // Shared Freestyle: the server scores the guess; we only learn the word at the end.
    if (serverGameId) {
      setBusy(true);
      let result;
      try {
        result = await submitServerGuess(serverGameId, currWord);
      } catch (err) {
        rejectGuess(err.message.replace(/\. Try Again\.$/, ''), row);
        return;
      } finally {
        setBusy(false);
      }
      setRowCounts((prev) => { const next = [...prev]; next[row] = {yellow: result.yellow, green: result.green}; return next; });
      setCurrrAttempt({attempt: row + 1, letterPos: 0});
      if (result.finished) {
        setCorrectWord(result.word);
        setEndTime(startTime + result.time_ms); // the server's official time
        setGameOver({gameOver: true, guessedWord: result.solved});
      }
      return;
    }

    setRowCounts((prev) => { const next = [...prev]; next[row] = getCounts(currWord, correctWord); return next; });
    setCurrrAttempt({attempt: row + 1, letterPos: 0});

    if (currWord === correctWord.toUpperCase()) {
      setGameOver({gameOver: true, guessedWord: true});
      return;
    }
    if (row === 9) {
      setGameOver({gameOver: true, guessedWord: false });
    }
  };

  if (screen === 'leaderboard') {
    return (
      <div className="App">
        <Leaderboard onBack={goToMenu} />
        <Toast toast={toast} />
      </div>
    );
  }

  if (screen === 'start') {
    return (
      <div className="App">
        <StartScreen
          ready={secretWords.length > 0 && !busy}
          dailyNumber={dailyNumber}
          dailyResult={dailyResult}
          dailyInProgress={!dailyResult && Boolean(loadDailyProgress(dailyNumber))}
          onDaily={() => startGame('daily')}
          onFreestyle={() => startGame('freestyle')}
          onLeaderboard={() => setScreen('leaderboard')}
          onHelp={() => setShowHelp(true)}
          onResetDaily={() => {
            resetDailyOnThisDevice();
            setDailyResult(null);
            setDailyStats(null);
            showToast('Daily reset');
          }}
        />
        {showHelp && <Help onClose={closeHelp} />}
        <Toast toast={toast} />
      </div>
    );
  }

  return (
    <div className="App">
      <nav>
        <div className="navLeft">
          <button type="button" className="navBack" onClick={onBack} aria-label="Back to menu">
            <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
              <path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <span className="navMode">{mode === 'daily' ? `Daily #${dailyNumber}` : 'Freestyle'}</span>
        </div>
        <h1>Hardle</h1>
        <button type="button" className="navHelp" onClick={() => setShowHelp(true)} aria-label="How to play">?</button>
        <Timer startTime={startTime} endTime={endTime} />
      </nav>
      {showHelp && <Help onClose={closeHelp} />}
      {showQuit && <QuitConfirm onStay={stayInGame} onQuit={goToMenu} />}
      <Toast toast={toast} />
      <AppContext.Provider value={{board, setBoard, currAttempt, setCurrrAttempt, onSelectLetter, onEnter, onDelete, correctWord, setGameOver, gameOver, startTime, endTime, mode, dailyNumber, rowCounts, serverGameId, busy, shake, dailyStats}}>
        <div className='game'>
          <Board />
          {gameOver.gameOver
            ? <GameOver
                onPlayAgain={() => startGame('freestyle')}
                onMenu={goToMenu}
                onLeaderboard={() => setScreen('leaderboard')}
              />
            : <Keyboard />}
        </div>
      </AppContext.Provider>
    </div>
  );
}


export default App;
