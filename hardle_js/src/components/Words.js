import guessBank from "../wordle-Ta.txt"
import secretBank from "../wordle-La.txt"

export const boardDefault = [
    ["","","","","","",""],
    ["","","","","","",""],
    ["","","","","","",""],
    ["","","","","","",""],
    ["","","","","","",""],
    ["","","","","","",""],
    ["","","","","","",""],
    ["","","","","","",""],
    ["","","","","","",""],
    ["","","","","","",""]
];

export const generateGuessesSet = async () => {
    let guessSet;
    let todaysWord;
    await fetch(guessBank)
        .then((response) => response.text())
        .then((result) => {
            const guessArray = result.split("\n");
            todaysWord = guessArray[Math.floor(Math.random() * guessArray.length)];
            guessSet = new Set(guessArray);
        });
    return {guessSet, todaysWord};
};

export const generateSecretSet = async () => {
    let secretSet;
    let todaysWord;
    await fetch(secretBank)
        .then((response) => response.text())
        .then((result) => {
            const secretArray = result.split("\n");
            todaysWord = secretArray[Math.floor(Math.random() * secretArray.length)];
            secretSet = new Set(secretArray);
        });
    return {secretSet, todaysWord};
};