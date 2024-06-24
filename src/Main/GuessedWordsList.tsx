import React from 'react';

interface GuessedWord {
    word: string;
    isCorrect: boolean;
}

interface GuessedWordProps {
    guessedWords: GuessedWord[];
}

const GuessedWordList: React.FC<GuessedWordProps> = ({ guessedWords }) => {
    const tab = Object.values(guessedWords);
    return (
        <ol reversed>
            {tab.reverse().map((gw, index) => (
                <li key={index + "_" + gw.word} style={{ color: gw.isCorrect ? '#4CAF50' : 'inherit', marginBottom: '5px' }} className='revealed'>
                    {gw.word}
                </li>
            ))}

        </ol>
    );
};

export default GuessedWordList;