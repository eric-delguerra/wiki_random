import React, { useState, useEffect } from 'react';
import GuessedWordRender from './GuessedWordsList';

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

    if (isLoading) return <div>Chargement...</div>;
    if (error) return <div style={{ color: 'red' }}>{error}</div>;

    return (
        <div style={{ maxWidth: '600px', margin: '0 auto', padding: '20px' }}>
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
        `}
            </style>
            <h1 style={{ fontSize: '24px', marginBottom: '20px' }}>Devinez le titre de l'article Wikipédia</h1>

            <p>Essais : {attempts}</p>
            <div style={{ backgroundColor: '#f0f0f0', padding: '15px', borderRadius: '5px', marginBottom: '20px' }}>
                <p style={{ fontWeight: 'bold', marginBottom: '10px' }}>Titre et contenu floutés :</p>
                <p dangerouslySetInnerHTML={{ __html: blurredContent }}></p>
            </div>
            <form onSubmit={handleGuess} style={{ marginBottom: '20px' }}>
                <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    style={{ padding: '5px', marginRight: '10px' }}
                    placeholder="Entrez un mot"
                />
                <button type="submit" style={{ padding: '5px 10px', backgroundColor: '#4CAF50', color: 'white', border: 'none', borderRadius: '3px' }}>
                    Deviner
                </button>
            </form>
            <div style={{ display: 'flex', justifyContent: 'space-evenly' }}>
                <span>
                    ■ : Lettres floutées
                </span>
                <span>
                    □ : Chiffres floutés
                </span>
            </div>

            <div>
                <p style={{ fontWeight: 'bold', marginBottom: '10px' }}>Mots devinés :</p>
                <button onClick={resetFoundWords} style={{ padding: '5px 10px', backgroundColor: '#4CAF50', color: 'white', border: 'none', borderRadius: '3px', cursor: 'pointer' }}>
                    Recommencer
                </button> <br />
                <div style={{ height: 250, overflow: 'auto', }}>
                    <GuessedWordRender guessedWords={guessedWords} />
                </div>
            </div>
        </div>
    );
};

export default WikiGuessGame;