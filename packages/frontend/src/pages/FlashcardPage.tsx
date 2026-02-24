import { useState, useEffect } from 'react';
import { apiClient } from '../api/client';

interface VocabularyEntry {
  id: string;
  username: string;
  chineseCharacter: string;
  pinyin: string;
  hanVietnamese?: string;
  modernVietnamese?: string;
  englishMeaning?: string;
  learningNote?: string;
  isFavorite: boolean;
  chapter: number;
  sharedFrom?: string;
  createdAt: string;
  updatedAt: string;
}

export default function FlashcardPage() {
  const [currentWord, setCurrentWord] = useState<VocabularyEntry | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);
  const [noFavorites, setNoFavorites] = useState(false);

  useEffect(() => {
    fetchRandomFavorite();
  }, []);

  const fetchRandomFavorite = async () => {
    setLoading(true);
    setError(null);
    setShowDetails(false);
    setNoFavorites(false);
    
    try {
      const response = await apiClient.get<VocabularyEntry>('/user1/vocabulary/favorites/random');
      setCurrentWord(response.data);
    } catch (err: any) {
      if (err.response?.status === 404) {
        setNoFavorites(true);
        setError('No favorite words found. Please mark some words as favorites first.');
      } else {
        setError(err.response?.data?.error || err.message || 'Failed to load favorite word');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleShowDetails = () => {
    setShowDetails(true);
  };

  const handleNext = () => {
    fetchRandomFavorite();
  };

  const handleUnfavorite = async () => {
    if (!currentWord) return;

    try {
      await apiClient.post(`/user1/vocabulary/toggle-favorite`, {
        chineseCharacter: currentWord.chineseCharacter
      });

      // Fetch next word after unfavoriting
      fetchRandomFavorite();
    } catch (error) {
      console.error('Error unfavoriting word:', error);
      alert('Failed to unfavorite word');
    }
  };

  const handlePronounce = () => {
    if (!currentWord) return;

    if ('speechSynthesis' in window) {
      setPlaying(true);
      const utterance = new SpeechSynthesisUtterance(currentWord.chineseCharacter);
      utterance.lang = 'zh-CN';
      utterance.rate = 0.5;

      utterance.onend = () => setPlaying(false);
      utterance.onerror = () => {
        setPlaying(false);
        alert('Failed to play pronunciation');
      };

      window.speechSynthesis.speak(utterance);
    } else {
      alert('Text-to-speech is not supported in your browser');
    }
  };

  return (
    <div style={{
      padding: '20px',
      maxWidth: '800px',
      margin: '0 auto',
      minHeight: '80vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <h1 style={{ marginBottom: '40px', textAlign: 'center' }}>Flashcard Practice</h1>

      {loading && (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <div style={{ fontSize: '18px', color: '#666' }}>Loading...</div>
        </div>
      )}

      {error && (
        <div style={{
          padding: '20px',
          backgroundColor: '#f8d7da',
          color: '#721c24',
          border: '1px solid #f5c6cb',
          borderRadius: '8px',
          marginBottom: '20px',
          textAlign: 'center',
          maxWidth: '500px'
        }}>
          <div style={{ marginBottom: '15px' }}>{error}</div>
          {noFavorites && (
            <a
              href="/user1/admin"
              style={{
                display: 'inline-block',
                padding: '10px 20px',
                backgroundColor: '#007bff',
                color: 'white',
                textDecoration: 'none',
                borderRadius: '4px',
                fontSize: '16px'
              }}
            >
              Go to Vocabulary Management
            </a>
          )}
        </div>
      )}

      {!loading && !error && currentWord && (
        <div style={{
          width: '100%',
          maxWidth: '600px',
          textAlign: 'center'
        }}>
          {/* Chinese Character Card */}
          <div style={{
            padding: '60px',
            backgroundColor: '#f8f9fa',
            border: '3px solid #007bff',
            borderRadius: '16px',
            marginBottom: '30px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
          }}>
            <div style={{
              fontSize: '120px',
              fontWeight: 'bold',
              color: '#333',
              marginBottom: '20px'
            }}>
              {currentWord.chineseCharacter}
            </div>

            {!showDetails && (
              <button
                onClick={handleShowDetails}
                style={{
                  padding: '15px 40px',
                  backgroundColor: '#007bff',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '18px',
                  fontWeight: 'bold',
                  marginTop: '20px'
                }}
              >
                Show Details
              </button>
            )}
          </div>

          {/* Details Section */}
          {showDetails && (
            <div style={{
              padding: '30px',
              backgroundColor: 'white',
              border: '2px solid #dee2e6',
              borderRadius: '12px',
              marginBottom: '30px',
              textAlign: 'left'
            }}>
              <div style={{ marginBottom: '20px' }}>
                <strong style={{ fontSize: '16px', color: '#666' }}>Pinyin:</strong>
                <div style={{ fontSize: '24px', marginTop: '5px' }}>{currentWord.pinyin}</div>
              </div>

              {currentWord.hanVietnamese && (
                <div style={{ marginBottom: '20px' }}>
                  <strong style={{ fontSize: '16px', color: '#666' }}>Han Vietnamese:</strong>
                  <div style={{ fontSize: '20px', marginTop: '5px' }}>{currentWord.hanVietnamese}</div>
                </div>
              )}

              {currentWord.modernVietnamese && (
                <div style={{ marginBottom: '20px' }}>
                  <strong style={{ fontSize: '16px', color: '#666' }}>Modern Vietnamese:</strong>
                  <div style={{ fontSize: '20px', marginTop: '5px' }}>{currentWord.modernVietnamese}</div>
                </div>
              )}

              {currentWord.englishMeaning && (
                <div style={{ marginBottom: '20px' }}>
                  <strong style={{ fontSize: '16px', color: '#666' }}>English Meaning:</strong>
                  <div style={{ fontSize: '20px', marginTop: '5px' }}>{currentWord.englishMeaning}</div>
                </div>
              )}

              {currentWord.learningNote && (
                <div style={{ marginBottom: '20px' }}>
                  <strong style={{ fontSize: '16px', color: '#666' }}>Learning Note:</strong>
                  <div style={{ fontSize: '18px', marginTop: '5px', fontStyle: 'italic' }}>
                    {currentWord.learningNote}
                  </div>
                </div>
              )}

              <div style={{
                display: 'flex',
                gap: '15px',
                marginTop: '30px',
                justifyContent: 'center'
              }}>
                <button
                  onClick={handlePronounce}
                  disabled={playing}
                  style={{
                    padding: '12px 24px',
                    backgroundColor: playing ? '#6c757d' : '#28a745',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: playing ? 'not-allowed' : 'pointer',
                    fontSize: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  <span style={{ fontSize: '20px' }}>{playing ? '🔊' : '🔉'}</span>
                  <span>{playing ? 'Playing...' : 'Pronounce'}</span>
                </button>

                <button
                  onClick={handleUnfavorite}
                  style={{
                    padding: '12px 24px',
                    backgroundColor: '#dc3545',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  <span style={{ fontSize: '20px' }}>★</span>
                  <span>Un-favorite</span>
                </button>
              </div>
            </div>
          )}

          {/* Next Button */}
          <button
            onClick={handleNext}
            style={{
              padding: '15px 50px',
              backgroundColor: '#17a2b8',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '20px',
              fontWeight: 'bold',
              width: '100%',
              maxWidth: '300px'
            }}
          >
            Next Word
          </button>
        </div>
      )}
    </div>
  );
}
