import React, { useState, useEffect } from 'react';
import GuessedWordList from './GuessedWordsList';

interface WikiPage {
    title: string;
    extract: string;
}

interface GuessedWord {
    word: string;
    isCorrect: boolean;
}

const WikiGuessGame: React.FC = () => {
    const [wikiPage, setWikiPage] = useState<WikiPage | null>(null);
    const [blurredContent, setBlurredContent] = useState<string>('');
    const [guessedWords, setGuessedWords] = useState<GuessedWord[]>([]);
    const [inputValue, setInputValue] = useState<string>('');
    const [attempts, setAttempts] = useState<number>(0);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [helperDescription, setHelperDescription] = useState<string>('');
    const [tips, setTips] = useState<boolean>(false);

    useEffect(() => {
        fetchRandomWikiPage();
    }, []);

    const fetchRandomWikiPage = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await fetch('https://fr.wikipedia.org/api/rest_v1/page/random/summary');
            const data = await response.json();
            setWikiPage({ title: data.title, extract: data.extract });
            setBlurredContent(blurWords(data.title + ' ' + data.extract));
            setHelperDescription(data.description);
        } catch (err) {
            setError("Erreur lors du chargement de la page Wikipedia. Veuillez réessayer.");
        }
        setIsLoading(false);
    };

    const blurWords = (text: string): string => {
        return text.replace(/\p{L}+/gu, match => '■'.repeat(match.length)).replace(/\d+/g, match => '□'.repeat(match.length));
    };

    const handleGuess = (e: React.FormEvent) => {
        e.preventDefault();
        const word = inputValue.toLowerCase().trim();
        const isCorrect = unblurWord(inputValue);
        setGuessedWords(prev => [...prev, { word, isCorrect }]);
        setAttempts(prev => prev + 1);
        setInputValue('');
    };

    const unblurWord = (word: string): boolean => {
        if (!wikiPage) return false;

        const fullContent = wikiPage.title + ' ' + wikiPage.extract;

        const checkWord = (w: string): boolean => {
            const regex = new RegExp(`\\b${w.toLowerCase().trim()}\\b`, 'gi');
            return regex.test(fullContent);
        };

        const replaceWord = (w: string, originalLength: number): void => {
            const regex = new RegExp(`\\b${w.toLowerCase().trim()}\\b`, 'gi');
            let match;
            let newBlurredContent = blurredContent;

            while ((match = regex.exec(fullContent)) !== null) {
                const startIndex = match.index;
                const endIndex = startIndex + w.length;
                newBlurredContent =
                    newBlurredContent.substring(0, startIndex) +
                    fullContent.substring(startIndex, endIndex) +
                    newBlurredContent.substring(endIndex);

            }

            setBlurredContent(newBlurredContent);
        };

        // Vérifier le mot original
        if (checkWord(word)) {
            replaceWord(word, word.length);
            return true;
        }

        if (word.length < 3) {
            // Vérifier le pluriel avec 's'
            if (checkWord(word + 's')) {
                replaceWord(word + 's', word.length);
                return true;
            }

            // Vérifier le pluriel avec 'x'
            if (checkWord(word + 'x')) {
                replaceWord(word + 'x', word.length);
                return true;
            }

            // Vérifier la forme singulière si le mot se termine par 's' ou 'x'
            if (word.endsWith('s') || word.endsWith('x')) {
                const singularForm = word.slice(0, -1);
                if (checkWord(singularForm)) {
                    replaceWord(singularForm, word.length);
                    return true;
                }
            }
        }

        return false;
    };

    const resetFoundWords = () => {
        setGuessedWords([]);
        setBlurredContent(blurWords(wikiPage!.title + ' ' + wikiPage!.extract));
        setAttempts(0);
        fetchRandomWikiPage();
    }

    const revealRandomVowel = () => {
        if (!wikiPage) return;

        const vowels = 'aeiouy';
        const randomVowel = vowels[Math.floor(Math.random() * vowels.length)];
        const fullContent = wikiPage.title + ' ' + wikiPage.extract;

        let newBlurredContent = '';
        for (let i = 0; i < fullContent.length; i++) {
            if (fullContent[i].toLowerCase() === randomVowel) {
                newBlurredContent += fullContent[i];
            } else {
                newBlurredContent += blurredContent[i];
            }
        }

        setBlurredContent(newBlurredContent);
    };

    const triesStyle = () => {
        if (attempts < 25) {
            return 'text-green-500';
        } else if (attempts < 50) {
            return 'text-yellow-500';
        } else {
            return 'text-red-500';
        }
    }

    if (isLoading) return <div>Chargement...</div>;
    if (error) return <div style={{ color: 'red' }}>{error}</div>;

    return (
        <div className="max-w-2xl mx-auto p-auto">
            <style>
                {`
            @keyframes revealAnimation {
                from { opacity: 0; }
                to { opacity: 1; }
            }
            .revealed {
                animation: revealAnimation 1s ease-in-out;
                font-weight: bold;
                color: #4CAF50;
            }
            .tips {
                font-size: 0.8rem;
                color: #666!important;
            }
            `}
            </style>
            <h1 className="text-2xl font-bold mb-6">Devinez le titre de l'article Wikipédia</h1>
            <p className={triesStyle() + ' mb-4 font-bold'} >Essais : {attempts}</p>
            <div className="bg-gray-200 p-4 rounded-lg mb-6">
                <p className="font-bold mb-6">
                    {blurredContent.slice(0, wikiPage!.title.length)}
                </p>
                <p dangerouslySetInnerHTML={{ __html: blurredContent }}></p>
            </div>
            <form onSubmit={handleGuess} className="mb-6">
                <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md mr-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Entrez un mot"
                />
                <button type="submit" className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors">
                    Deviner
                </button>
            </form>
            <div className="flex justify-evenly mb-6">
                <span className="text-sm text-gray-600">
                    ■ : Lettres floutées
                </span>
                <span className="text-sm text-gray-600">
                    □ : Chiffres floutés
                </span>
            </div>

            <div className="mb-6">
                <p className="font-bold mb-2">Mots devinés :</p>
                <div className="h-64 overflow-auto border border-gray-200 rounded-md p-128">
                    <GuessedWordList guessedWords={guessedWords} />
                </div>
            </div>
            <div className="flex space-x-4 my-4" style={{ alignSelf: 'center', justifyContent: 'center' }}>
                <button
                    onClick={resetFoundWords}
                    className="px-4 py-2 bg-green-300  rounded-md hover:bg-green-400 transition-colors"
                >
                    Recommencer
                </button>
                <button
                    onClick={() => setTips(!tips)}
                    className="px-4 py-2 bg-orange-300 text-white rounded-md hover:bg-orange-400 transition-colors "
                >
                    Avoir la description en indice
                </button>

            </div>
            {tips &&
                helperDescription && <p className="revealed text-sm text-gray-600 bold tips">On cherche : "{helperDescription}"</p>
            }
        </div>
    );
}


export default WikiGuessGame;