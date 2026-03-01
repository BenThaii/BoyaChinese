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

export default function ChapterFlashcardPage() {
  const [chapterStart, setChapterStart] = useState<number>(1);
  const [chapterEnd, setChapterEnd] = useState<number>(1);
  const [availableChapters, setAvailableChapters] = useState<number[]>([]);
  const [currentWord, setCurrentWord] = useState<VocabularyEntry | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);
  const [noWords, setNoWords] = useState(false);
  const [showSettings, setShowSettings] = useState(true);
  const [showFavoriteConfirm, setShowFavoriteConfirm] = useState(false);
  const [favoriteAction, setFavoriteAction] = useState<'favorite' | 'unfavorite'>('favorite');

  useEffect(() => {
    fetchAvailableChapters();
  }, []);

  const fetchAvailableChapters = async () => {
    try {
      const response = await apiClient.get<number[]>('/user1/vocabulary/chapters');
      setAvailableChapters(response.data);
      if (response.data.length > 0) {
        setChapterStart(response.data[0]);
        setChapterEnd(response.data[0]);
      }
    } catch (error) {
      console.error('Error fetching chapters:', error);
    }
  };

  const fetchRandomWord = async () => {
    setLoading(true);
    setError(null);
    setShowDetails(false);
    setNoWords(false);
    
    try {
      const response = await apiClient.get<VocabularyEntry>(
        `/user1/vocabulary/chapters/random?chapterStart=${chapterStart}&chapterEnd=${chapterEnd}`
      );
      setCurrentWord(response.data);
      setShowSettings(false);
    } catch (err: any) {
      if (err.response?.status === 404) {
        setNoWords(true);
        setError(`No words found in chapters ${chapterStart}-${chapterEnd}. Please select different chapters.`);
      } else {
        setError(err.response?.data?.error || err.message || 'Failed to load word');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleStart = () => {
    if (chapterStart > chapterEnd) {
      setError('Start chapter must be less than or equal to end chapter');
      return;
    }
    fetchRandomWord();
  };

  const handleShowDetails = () => {
    setShowDetails(true);
  };

  const handleNext = () => {
    fetchRandomWord();
  };

  const handlePronounce = () => {
    if (!currentWord) return;

    if ('speechSynthesis' in window) {
      setPlaying(true);
      
      // Cancel any ongoing speech
      window.speechSynthesis.cancel();
      
      // Small delay to ensure cancellation is complete (helps with mobile)
      setTimeout(() => {
        const utterance = new SpeechSynthesisUtterance(currentWord.chineseCharacter);
        utterance.lang = 'zh-CN';
        utterance.rate = 0.8;
        utterance.pitch = 1.0;
        utterance.volume = 1.0;

        utterance.onend = () => {
          setPlaying(false);
        };
        
        utterance.onerror = (event) => {
          console.error('Speech synthesis error:', event);
          setPlaying(false);
          
          // More specific error messages
          if (event.error === 'network') {
            alert('Network error. Please check your connection.');
          } else if (event.error === 'synthesis-unavailable') {
            alert('Chinese voice not available on this device.');
          } else if (event.error === 'not-allowed') {
            alert('Speech permission denied. Please enable it in browser settings.');
          } else {
            alert('Failed to play pronunciation. Try again.');
          }
        };

        // For mobile browsers, especially Chrome on Android
        try {
          window.speechSynthesis.speak(utterance);
        } catch (error) {
          console.error('Error speaking:', error);
          setPlaying(false);
          alert('Failed to play pronunciation. Your browser may not support Chinese speech.');
        }
      }, 100);
    } else {
      alert('Text-to-speech is not supported in your browser');
    }
  };

  const handleChangeSettings = () => {
    setShowSettings(true);
    setCurrentWord(null);
    setError(null);
  };

  const handleToggleFavorite = async () => {
    if (!currentWord) return;

    try {
      await apiClient.post(`/user1/vocabulary/toggle-favorite`, {
        chineseCharacter: currentWord.chineseCharacter
      });

      // Close confirmation dialog
      setShowFavoriteConfirm(false);

      // Update current word's favorite status
      setCurrentWord({
        ...currentWord,
        isFavorite: !currentWord.isFavorite
      });
    } catch (error) {
      console.error('Error toggling favorite:', error);
      alert('Failed to update favorite status');
    }
  };

  const handleFavoriteClick = () => {
    if (!currentWord) return;
    setFavoriteAction(currentWord.isFavorite ? 'unfavorite' : 'favorite');
    setShowFavoriteConfirm(true);
  };

  return (
    <div style={{
      padding: '10px',
      maxWidth: '800px',
      margin: '0 auto',
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'space-between',
      boxSizing: 'border-box'
    }}>
      <h1 style={{ marginBottom: '10px', marginTop: '0', textAlign: 'center', fontSize: '20px' }}>
        Chapter Flashcards
      </h1>

      {showSettings && (
        <div style={{
          width: '100%',
          maxWidth: '500px',
          padding: '30px',
          backgroundColor: 'white',
          border: '2px solid #007bff',
          borderRadius: '12px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
        }}>
          <h2 style={{ marginTop: 0, marginBottom: '20px', textAlign: 'center' }}>Select Chapters</h2>
          
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
              Start Chapter:
            </label>
            <select
              value={chapterStart}
              onChange={(e) => setChapterStart(parseInt(e.target.value))}
              style={{
                width: '100%',
                padding: '10px',
                fontSize: '16px',
                borderRadius: '6px',
                border: '1px solid #dee2e6'
              }}
            >
              {availableChapters.map(chapter => (
                <option key={chapter} value={chapter}>Chapter {chapter}</option>
              ))}
            </select>
          </div>

          <div style={{ marginBottom: '25px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
              End Chapter:
            </label>
            <select
              value={chapterEnd}
              onChange={(e) => setChapterEnd(parseInt(e.target.value))}
              style={{
                width: '100%',
                padding: '10px',
                fontSize: '16px',
                borderRadius: '6px',
                border: '1px solid #dee2e6'
              }}
            >
              {availableChapters.map(chapter => (
                <option key={chapter} value={chapter}>Chapter {chapter}</option>
              ))}
            </select>
          </div>

          {error && (
            <div style={{
              padding: '12px',
              backgroundColor: '#f8d7da',
              color: '#721c24',
              border: '1px solid #f5c6cb',
              borderRadius: '6px',
              marginBottom: '20px',
              fontSize: '14px'
            }}>
              {error}
            </div>
          )}

          <button
            onClick={handleStart}
            style={{
              width: '100%',
              padding: '15px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '18px',
              fontWeight: 'bold'
            }}
          >
            Start Practice
          </button>
        </div>
      )}

      {loading && !showSettings && (
        <div style={{ textAlign: 'center', padding: '20px', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ fontSize: '18px', color: '#666' }}>Loading...</div>
        </div>
      )}

      {error && !showSettings && !noWords && (
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
          <button
            onClick={handleChangeSettings}
            style={{
              padding: '10px 20px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '16px'
            }}
          >
            Change Chapters
          </button>
        </div>
      )}

      {!loading && !error && currentWord && !showSettings && (
        <div style={{
          width: '100%',
          maxWidth: '600px',
          textAlign: 'center',
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          overflow: 'hidden'
        }}>
          <div>
            <div style={{
              marginBottom: '10px',
              padding: '6px 12px',
              backgroundColor: '#e7f3ff',
              borderRadius: '6px',
              display: 'inline-block',
              fontSize: '13px'
            }}>
              <strong>Chapters {chapterStart}-{chapterEnd}</strong>
              {' | '}
              <button
                onClick={handleChangeSettings}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#007bff',
                  cursor: 'pointer',
                  textDecoration: 'underline',
                  fontSize: '13px'
                }}
              >
                Change
              </button>
            </div>

            {/* Chinese Character Card */}
            <div style={{
              padding: '20px 15px',
              backgroundColor: '#f8f9fa',
              border: '3px solid #007bff',
              borderRadius: '16px',
              marginBottom: '10px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              position: 'relative'
            }}>
              {currentWord.isFavorite && (
                <div style={{
                  position: 'absolute',
                  top: '10px',
                  right: '10px',
                  fontSize: '24px',
                  color: '#ffc107'
                }}>
                  ★
                </div>
              )}
              
              {/* Pronounce button on card */}
              <button
                onClick={handlePronounce}
                disabled={playing}
                style={{
                  position: 'absolute',
                  top: '10px',
                  left: '10px',
                  padding: '6px 10px',
                  backgroundColor: playing ? '#6c757d' : '#28a745',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: playing ? 'not-allowed' : 'pointer',
                  fontSize: '18px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                {playing ? '🔊' : '🔉'}
              </button>
              
              <div style={{
                fontSize: '60px',
                fontWeight: 'bold',
                color: '#333',
                marginBottom: '10px'
              }}>
                {currentWord.chineseCharacter}
              </div>

              {!showDetails && (
                <button
                  onClick={handleShowDetails}
                  style={{
                    padding: '10px 24px',
                    backgroundColor: '#007bff',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    marginTop: '5px'
                  }}
                >
                  Show Details
                </button>
              )}
            </div>

            {/* Details Section */}
            {showDetails && (
              <div style={{
                padding: '12px',
                backgroundColor: 'white',
                border: '2px solid #dee2e6',
                borderRadius: '12px',
                marginBottom: '10px',
                textAlign: 'left',
                maxHeight: '35vh',
                overflow: 'auto',
                fontSize: '14px'
              }}>
                <div style={{ marginBottom: '10px' }}>
                  <strong style={{ fontSize: '12px', color: '#666' }}>Chapter:</strong>
                  <div style={{ fontSize: '14px', marginTop: '3px' }}>{currentWord.chapter}</div>
                </div>

                <div style={{ marginBottom: '10px' }}>
                  <strong style={{ fontSize: '12px', color: '#666' }}>Pinyin:</strong>
                  <div style={{ fontSize: '16px', marginTop: '3px' }}>{currentWord.pinyin}</div>
                </div>

                {currentWord.hanVietnamese && (
                  <div style={{ marginBottom: '10px' }}>
                    <strong style={{ fontSize: '12px', color: '#666' }}>Han Vietnamese:</strong>
                    <div style={{ fontSize: '14px', marginTop: '3px' }}>{currentWord.hanVietnamese}</div>
                  </div>
                )}

                {currentWord.modernVietnamese && (
                  <div style={{ marginBottom: '10px' }}>
                    <strong style={{ fontSize: '12px', color: '#666' }}>Modern Vietnamese:</strong>
                    <div style={{ fontSize: '14px', marginTop: '3px' }}>{currentWord.modernVietnamese}</div>
                  </div>
                )}

                {currentWord.englishMeaning && (
                  <div style={{ marginBottom: '10px' }}>
                    <strong style={{ fontSize: '12px', color: '#666' }}>English Meaning:</strong>
                    <div style={{ fontSize: '14px', marginTop: '3px' }}>{currentWord.englishMeaning}</div>
                  </div>
                )}

                {currentWord.learningNote && (
                  <div style={{ marginBottom: '10px' }}>
                    <strong style={{ fontSize: '12px', color: '#666' }}>Learning Note:</strong>
                    <div style={{ fontSize: '13px', marginTop: '3px', fontStyle: 'italic' }}>
                      {currentWord.learningNote}
                    </div>
                  </div>
                )}

                <div 
                  className="flashcard-buttons"
                  style={{
                    display: 'flex',
                    flexDirection: 'row',
                    gap: '8px',
                    marginTop: '10px',
                    paddingTop: '10px',
                    borderTop: '1px solid #dee2e6'
                  }}
                >
                  <button
                    onClick={handlePronounce}
                    disabled={playing}
                    style={{
                      padding: '8px 12px',
                      backgroundColor: playing ? '#6c757d' : '#28a745',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: playing ? 'not-allowed' : 'pointer',
                      fontSize: '13px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '4px',
                      flex: 1
                    }}
                  >
                    <span style={{ fontSize: '14px' }}>{playing ? '🔊' : '🔉'}</span>
                    <span>{playing ? 'Playing...' : 'Pronounce'}</span>
                  </button>

                  <button
                    onClick={handleFavoriteClick}
                    style={{
                      padding: '8px 12px',
                      backgroundColor: currentWord.isFavorite ? '#dc3545' : '#ffc107',
                      color: currentWord.isFavorite ? 'white' : '#000',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '13px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '4px',
                      flex: 1
                    }}
                  >
                    <span style={{ fontSize: '14px' }}>{currentWord.isFavorite ? '★' : '☆'}</span>
                    <span>{currentWord.isFavorite ? 'Un-favorite' : 'Favorite'}</span>
                  </button>
                </div>

                {/* Mobile responsive styles */}
                <style>{`
                  @media (max-width: 480px) {
                    .flashcard-buttons {
                      flex-direction: column !important;
                    }
                  }
                `}</style>
              </div>
            )}
          </div>

          {/* Next Button */}
          <div style={{ display: 'flex', justifyContent: 'center', width: '100%', marginTop: '10px' }}>
            <button
              onClick={handleNext}
              style={{
                padding: '10px 30px',
                backgroundColor: '#17a2b8',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: 'bold',
                maxWidth: '300px'
              }}
            >
              Next Word
            </button>
          </div>
        </div>
      )}

      {/* Favorite/Un-favorite Confirmation Modal */}
      {showFavoriteConfirm && currentWord && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2000,
            padding: '20px'
          }}
          onClick={() => setShowFavoriteConfirm(false)}
        >
          <div
            style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              padding: '30px',
              maxWidth: '500px',
              width: '100%',
              boxShadow: '0 4px 20px rgba(0,0,0,0.15)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ 
              marginTop: 0, 
              marginBottom: '20px', 
              color: favoriteAction === 'unfavorite' ? '#dc3545' : '#ffc107' 
            }}>
              {favoriteAction === 'unfavorite' ? 'Un-favorite Word?' : 'Favorite Word?'}
            </h2>
            
            <div style={{ marginBottom: '25px' }}>
              <div style={{
                fontSize: '48px',
                textAlign: 'center',
                marginBottom: '15px',
                fontWeight: 'bold'
              }}>
                {currentWord.chineseCharacter}
              </div>
              
              <p style={{ fontSize: '16px', color: '#666', lineHeight: '1.6', marginBottom: '10px' }}>
                {favoriteAction === 'unfavorite' 
                  ? 'Are you sure you want to remove this word from your favorites?'
                  : 'Add this word to your favorites for quick practice?'}
              </p>
              
              <div style={{
                backgroundColor: favoriteAction === 'unfavorite' ? '#fff3cd' : '#d1ecf1',
                border: `1px solid ${favoriteAction === 'unfavorite' ? '#ffc107' : '#bee5eb'}`,
                borderRadius: '6px',
                padding: '12px',
                marginTop: '15px'
              }}>
                <p style={{ 
                  margin: 0, 
                  fontSize: '14px', 
                  color: favoriteAction === 'unfavorite' ? '#856404' : '#0c5460' 
                }}>
                  {favoriteAction === 'unfavorite' ? (
                    <>
                      <strong>⚠️ Note:</strong> This word will no longer appear in your favorite flashcard practice. 
                      You can re-favorite it later from the Vocabulary Management or Phrases pages.
                    </>
                  ) : (
                    <>
                      <strong>ℹ️ Note:</strong> Favorited words will appear in your favorite flashcard practice 
                      for focused review.
                    </>
                  )}
                </p>
              </div>
            </div>

            <div style={{
              display: 'flex',
              gap: '10px',
              justifyContent: 'flex-end'
            }}>
              <button
                onClick={() => setShowFavoriteConfirm(false)}
                style={{
                  padding: '10px 24px',
                  backgroundColor: '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '16px',
                  fontWeight: '500'
                }}
              >
                Cancel
              </button>
              
              <button
                onClick={handleToggleFavorite}
                style={{
                  padding: '10px 24px',
                  backgroundColor: favoriteAction === 'unfavorite' ? '#dc3545' : '#ffc107',
                  color: favoriteAction === 'unfavorite' ? 'white' : '#000',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '16px',
                  fontWeight: '500'
                }}
              >
                {favoriteAction === 'unfavorite' ? 'Yes, Un-favorite' : 'Yes, Favorite'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
