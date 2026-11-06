import guessBank from "../wordle-Ta.txt"
import secretBank from "../wordle-La.txt"

const ROWS = 10;
const COLS = 7;

// A brand-new empty board. Each game needs its own copy because the game
// writes letters into the rows directly.
export const freshBoard = () =>
    Array.from({ length: ROWS }, () => Array(COLS).fill(""));

export const boardDefault = freshBoard();

const loadWords = async (file) => {
    const text = await (await fetch(file)).text();
    return text.split("\n").map((w) => w.trim()).filter(Boolean);
};

// Every word you're allowed to guess.
export const generateGuessesSet = async () => {
    const words = await loadWords(guessBank);
    return { guessSet: new Set(words) };
};

// Possible answers (common words only).
export const loadSecretWords = () => loadWords(secretBank);

export const randomWord = (words) =>
    words[Math.floor(Math.random() * words.length)];
