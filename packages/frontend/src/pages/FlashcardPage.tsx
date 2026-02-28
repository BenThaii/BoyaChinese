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
  const [showUnfavoriteConfirm, setShowUnfavoriteConfirm] = useState(false);

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

      // Close confirmation dialog
      setShowUnfavoriteConfirm(false);

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

  return (
    <div style={{
      padding: '20px',
      maxWidth: '800px',
      margin: '0 auto',
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'space-between',
      boxSizing: 'border-box'
    }}>
      <h1 style={{ marginBottom: '20px', marginTop: '0', textAlign: 'center', fontSize: '24px' }}>Flashcard Practice</h1>

      {loading && (
        <div style={{ textAlign: 'center', padding: '20px', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
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
          textAlign: 'center',
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          overflow: 'auto'
        }}>
          {/* Chinese Character Card */}
          <div style={{
            padding: '40px 20px',
            backgroundColor: '#f8f9fa',
            border: '3px solid #007bff',
            borderRadius: '16px',
            marginBottom: '20px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            position: 'relative'
          }}>
            {currentWord.isFavorite && (
              <div style={{
                position: 'absolute',
                top: '15px',
                right: '15px',
                fontSize: '32px',
                color: '#ffc107'
              }}>
                ★
              </div>
            )}
            <div style={{
              fontSize: '80px',
              fontWeight: 'bold',
              color: '#333',
              marginBottom: '15px'
            }}>
              {currentWord.chineseCharacter}
            </div>

            {!showDetails && (
              <button
                onClick={handleShowDetails}
                style={{
                  padding: '12px 30px',
                  backgroundColor: '#007bff',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  marginTop: '10px'
                }}
              >
                Show Details
              </button>
            )}
          </div>

          {/* Details Section */}
          {showDetails && (
            <div style={{
              padding: '20px',
              backgroundColor: 'white',
              border: '2px solid #dee2e6',
              borderRadius: '12px',
              marginBottom: '20px',
              textAlign: 'left',
              maxHeight: '50vh',
              overflow: 'auto'
            }}>
              <div style={{ marginBottom: '15px' }}>
                <strong style={{ fontSize: '14px', color: '#666' }}>Pinyin:</strong>
                <div style={{ fontSize: '20px', marginTop: '5px' }}>{currentWord.pinyin}</div>
              </div>

              {currentWord.hanVietnamese && (
                <div style={{ marginBottom: '15px' }}>
                  <strong style={{ fontSize: '14px', color: '#666' }}>Han Vietnamese:</strong>
                  <div style={{ fontSize: '18px', marginTop: '5px' }}>{currentWord.hanVietnamese}</div>
                </div>
              )}

              {currentWord.modernVietnamese && (
                <div style={{ marginBottom: '15px' }}>
                  <strong style={{ fontSize: '14px', color: '#666' }}>Modern Vietnamese:</strong>
                  <div style={{ fontSize: '18px', marginTop: '5px' }}>{currentWord.modernVietnamese}</div>
                </div>
              )}

              {currentWord.englishMeaning && (
                <div style={{ marginBottom: '15px' }}>
                  <strong style={{ fontSize: '14px', color: '#666' }}>English Meaning:</strong>
                  <div style={{ fontSize: '18px', marginTop: '5px' }}>{currentWord.englishMeaning}</div>
                </div>
              )}

              {currentWord.learningNote && (
                <div style={{ marginBottom: '15px' }}>
                  <strong style={{ fontSize: '14px', color: '#666' }}>Learning Note:</strong>
                  <div style={{ fontSize: '16px', marginTop: '5px', fontStyle: 'italic' }}>
                    {currentWord.learningNote}
                  </div>
                </div>
              )}

              <div 
                className="flashcard-buttons"
                style={{
                  display: 'flex',
                  flexDirection: 'row',
                  gap: '10px',
                  marginTop: '15px',
                  paddingTop: '15px',
                  borderTop: '1px solid #dee2e6'
                }}
              >
                <button
                  onClick={handlePronounce}
                  disabled={playing}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: playing ? '#6c757d' : '#28a745',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: playing ? 'not-allowed' : 'pointer',
                    fontSize: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    flex: 1
                  }}
                >
                  <span style={{ fontSize: '16px' }}>{playing ? '🔊' : '🔉'}</span>
                  <span>{playing ? 'Playing...' : 'Pronounce'}</span>
                </button>

                <button
                  onClick={() => setShowUnfavoriteConfirm(true)}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#dc3545',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    flex: 1
                  }}
                >
                  <span style={{ fontSize: '16px' }}>★</span>
                  <span>Un-favorite</span>
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

          {/* Next Button */}
          <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
            <button
              onClick={handleNext}
              style={{
                padding: '12px 40px',
                backgroundColor: '#17a2b8',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '18px',
                fontWeight: 'bold',
                maxWidth: '300px',
                marginTop: '10px'
              }}
            >
              Next Word
            </button>
          </div>
        </div>
      )}

      {/* Un-favorite Confirmation Modal */}
      {showUnfavoriteConfirm && currentWord && (
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
          onClick={() => setShowUnfavoriteConfirm(false)}
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
            <h2 style={{ marginTop: 0, marginBottom: '20px', color: '#dc3545' }}>
              Un-favorite Word?
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
                Are you sure you want to remove this word from your favorites?
              </p>
              
              <div style={{
                backgroundColor: '#fff3cd',
                border: '1px solid #ffc107',
                borderRadius: '6px',
                padding: '12px',
                marginTop: '15px'
              }}>
                <p style={{ margin: 0, fontSize: '14px', color: '#856404' }}>
                  <strong>⚠️ Note:</strong> This word will no longer appear in your flashcard practice. 
                  You can re-favorite it later from the Vocabulary Management or Phrases pages.
                </p>
              </div>
            </div>

            <div style={{
              display: 'flex',
              gap: '10px',
              justifyContent: 'flex-end'
            }}>
              <button
                onClick={() => setShowUnfavoriteConfirm(false)}
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
                onClick={handleUnfavorite}
                style={{
                  padding: '10px 24px',
                  backgroundColor: '#dc3545',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '16px',
                  fontWeight: '500'
                }}
              >
                Yes, Un-favorite
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
