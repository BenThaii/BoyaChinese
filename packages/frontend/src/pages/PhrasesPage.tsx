import { useState, useEffect } from 'react';
import { apiClient } from '../api/client';

// TypeScript interfaces
interface VocabGroupResponse {
  id: number;
  chapterStart: number;
  chapterEnd: number;
  sentenceCount: number;
}

interface SentenceResponse {
  id: string;
  vocabGroupId: number;
  chineseText: string;
  pinyin: string;
  usedCharacters: string[];
  generationTimestamp: string;
}

interface CharacterInfo {
  chineseCharacter: string;
  pinyin: string;
  hanVietnamese?: string;
  modernVietnamese?: string;
  englishMeaning?: string;
  isFavorite?: boolean;
}

export default function PhrasesPage() {
  // Component state
  const [vocabGroups, setVocabGroups] = useState<VocabGroupResponse[]>([]);
  const [sentences, setSentences] = useState<Map<number, SentenceResponse[]>>(new Map());
  const [selectedSentence, setSelectedSentence] = useState<SentenceResponse | null>(null);
  const [characterDetails, setCharacterDetails] = useState<CharacterInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedGroup, setExpandedGroup] = useState<number | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [playingCharacter, setPlayingCharacter] = useState<string | null>(null);
  const [loadingSentences, setLoadingSentences] = useState<Set<number>>(new Set());
  const [playingSentence, setPlayingSentence] = useState<boolean>(false);

  // Fetch vocab groups on mount
  useEffect(() => {
    fetchVocabGroups();
  }, []);

  const fetchVocabGroups = async (retryCount = 0) => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.get<VocabGroupResponse[]>('/phrases/vocab-groups');
      setVocabGroups(response.data);
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || err.message || 'Failed to load vocabulary groups';
      
      // Retry logic: 2 attempts with 1s delay
      if (retryCount < 2) {
        console.log(`Retrying vocab groups fetch (attempt ${retryCount + 1}/2)...`);
        await new Promise(resolve => setTimeout(resolve, 1000));
        return fetchVocabGroups(retryCount + 1);
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const toggleGroup = async (groupId: number) => {
    if (expandedGroup === groupId) {
      setExpandedGroup(null);
    } else {
      setExpandedGroup(groupId);
      // Fetch sentences if not already loaded
      if (!sentences.has(groupId)) {
        await fetchSentences(groupId);
      }
    }
  };

  const fetchSentences = async (vocabGroupId: number, retryCount = 0) => {
    setLoadingSentences(prev => new Set(prev).add(vocabGroupId));
    setError(null);
    try {
      const response = await apiClient.get<SentenceResponse[]>(`/phrases/sentences/${vocabGroupId}`);
      setSentences(prev => new Map(prev).set(vocabGroupId, response.data));
    } catch (err: any) {
      console.error(`Failed to load sentences for group ${vocabGroupId}:`, err);
      
      // Retry logic: 2 attempts with 1s delay
      if (retryCount < 2) {
        console.log(`Retrying sentences fetch for group ${vocabGroupId} (attempt ${retryCount + 1}/2)...`);
        await new Promise(resolve => setTimeout(resolve, 1000));
        return fetchSentences(vocabGroupId, retryCount + 1);
      }
      
      setError(`Failed to load sentences for group ${vocabGroupId}`);
    } finally {
      setLoadingSentences(prev => {
        const newSet = new Set(prev);
        newSet.delete(vocabGroupId);
        return newSet;
      });
    }
  };

  const handleSentenceClick = (sentence: SentenceResponse) => {
    setSelectedSentence(sentence);
    setCharacterDetails([]);
    fetchCharacterDetails(sentence.usedCharacters);
  };

  const fetchCharacterDetails = async (characters: string[], retryCount = 0) => {
    setLoadingDetails(true);
    try {
      const details = await Promise.all(
        characters.map(async (char) => {
          try {
            const response = await apiClient.get<CharacterInfo>(
              `/phrases/character-info/${char}`
            );
            return response.data;
          } catch (error) {
            console.error(`Failed to fetch details for ${char}:`, error);
            return {
              chineseCharacter: char,
              pinyin: 'N/A',
              hanVietnamese: 'N/A',
              modernVietnamese: 'N/A',
              englishMeaning: 'N/A'
            };
          }
        })
      );
      setCharacterDetails(details);
    } catch (error) {
      console.error('Error fetching character details:', error);
      
      // Retry logic: 2 attempts with 1s delay
      if (retryCount < 2) {
        console.log(`Retrying character details fetch (attempt ${retryCount + 1}/2)...`);
        await new Promise(resolve => setTimeout(resolve, 1000));
        return fetchCharacterDetails(characters, retryCount + 1);
      }
    } finally {
      setLoadingDetails(false);
    }
  };

  const handlePronounceCharacter = (character: string) => {
    if (!character || character === 'N/A') return;
    
    if ('speechSynthesis' in window) {
      setPlayingCharacter(character);
      const utterance = new SpeechSynthesisUtterance(character);
      utterance.lang = 'zh-CN';
      utterance.rate = 0.5;
      
      utterance.onend = () => setPlayingCharacter(null);
      utterance.onerror = () => {
        setPlayingCharacter(null);
        alert('Failed to play pronunciation');
      };
      
      window.speechSynthesis.speak(utterance);
    } else {
      alert('Text-to-speech is not supported in your browser');
    }
  };

  const handlePronounceSentence = () => {
    if (!selectedSentence || !selectedSentence.chineseText) return;
    
    if ('speechSynthesis' in window) {
      setPlayingSentence(true);
      const utterance = new SpeechSynthesisUtterance(selectedSentence.chineseText);
      utterance.lang = 'zh-CN';
      utterance.rate = 0.7;
      
      utterance.onend = () => setPlayingSentence(false);
      utterance.onerror = () => {
        setPlayingSentence(false);
        alert('Failed to play sentence pronunciation');
      };
      
      window.speechSynthesis.speak(utterance);
    } else {
      alert('Text-to-speech is not supported in your browser');
    }
  };

  const handleToggleFavorite = async (character: string, currentFavoriteStatus: boolean) => {
    try {
      await apiClient.post(`/user1/vocabulary/toggle-favorite`, {
        chineseCharacter: character
      });

      // Update the character details with the new favorite status
      setCharacterDetails(prevDetails =>
        prevDetails.map(char =>
          char.chineseCharacter === character
            ? { ...char, isFavorite: !currentFavoriteStatus }
            : char
        )
      );
    } catch (error) {
      console.error('Error toggling favorite:', error);
      alert('Failed to update favorite status');
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <h1>Pre-Generated Phrases</h1>
      <p style={{ color: '#666', marginBottom: '30px' }}>
        Practice Chinese sentences organized by vocabulary groups. Click any sentence to see character details.
      </p>

      {loading && (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <div style={{ fontSize: '18px', color: '#666' }}>Loading...</div>
        </div>
      )}

      {error && (
        <div style={{
          padding: '15px',
          backgroundColor: '#f8d7da',
          color: '#721c24',
          border: '1px solid #f5c6cb',
          borderRadius: '4px',
          marginBottom: '20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <strong>Error:</strong> {error}
          </div>
          <button
            onClick={() => {
              setError(null);
              fetchVocabGroups();
            }}
            style={{
              padding: '8px 16px',
              backgroundColor: '#721c24',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            Retry
          </button>
        </div>
      )}

      <div>
        {vocabGroups.length === 0 && !loading && !error && (
          <div style={{
            padding: '40px',
            textAlign: 'center',
            backgroundColor: '#f8f9fa',
            borderRadius: '8px',
            color: '#666'
          }}>
            No vocabulary groups available. Sentences will be generated automatically.
          </div>
        )}

        {vocabGroups.map(group => (
          <div key={group.id} style={{
            marginBottom: '15px',
            border: '1px solid #ddd',
            borderRadius: '8px',
            overflow: 'hidden'
          }}>
            <button
              onClick={() => toggleGroup(group.id)}
              style={{
                width: '100%',
                padding: '15px 20px',
                backgroundColor: expandedGroup === group.id ? '#007bff' : '#f8f9fa',
                color: expandedGroup === group.id ? 'white' : '#333',
                border: 'none',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: 'bold',
                textAlign: 'left',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <span>
                Vocabulary Group {group.id}: Chapters {group.chapterStart} - {group.chapterEnd}
                {' '}({group.sentenceCount} sentences)
              </span>
              <span style={{ fontSize: '20px' }}>
                {expandedGroup === group.id ? '▼' : '▶'}
              </span>
            </button>

            {expandedGroup === group.id && (
              <div style={{ padding: '20px', backgroundColor: 'white' }}>
                {loadingSentences.has(group.id) ? (
                  <div style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
                    <div style={{ fontSize: '16px' }}>Loading sentences...</div>
                  </div>
                ) : sentences.get(group.id) && sentences.get(group.id)!.length > 0 ? (
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                    gap: '15px'
                  }}>
                    {sentences.get(group.id)!.map((sentence, index) => (
                      <div
                        key={sentence.id}
                        onClick={() => handleSentenceClick(sentence)}
                        style={{
                          padding: '15px',
                          backgroundColor: '#f8f9fa',
                          border: '2px solid #dee2e6',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                          fontSize: '18px',
                          textAlign: 'center',
                          minHeight: '80px',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          position: 'relative'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#e9ecef';
                          e.currentTarget.style.borderColor = '#007bff';
                          e.currentTarget.style.transform = 'translateY(-2px)';
                          e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.1)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = '#f8f9fa';
                          e.currentTarget.style.borderColor = '#dee2e6';
                          e.currentTarget.style.transform = 'translateY(0)';
                          e.currentTarget.style.boxShadow = 'none';
                        }}
                      >
                        <div style={{
                          position: 'absolute',
                          top: '5px',
                          left: '8px',
                          fontSize: '12px',
                          fontWeight: 'bold',
                          color: '#666',
                          backgroundColor: 'white',
                          padding: '2px 6px',
                          borderRadius: '4px'
                        }}>
                          {index + 1}
                        </div>
                        {sentence.chineseText}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{
                    textAlign: 'center',
                    padding: '40px',
                    color: '#666',
                    backgroundColor: '#f8f9fa',
                    borderRadius: '8px'
                  }}>
                    No sentences available for this group.
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Character Detail Modal */}
      {selectedSentence && (
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
            zIndex: 1000,
            padding: '20px'
          }}
          onClick={() => setSelectedSentence(null)}
        >
          <div
            style={{
              backgroundColor: 'white',
              borderRadius: '8px',
              padding: '30px',
              maxWidth: '900px',
              maxHeight: '90vh',
              overflow: 'auto',
              width: '100%'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ margin: 0 }}>Sentence Details</h2>
              <button
                onClick={() => setSelectedSentence(null)}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#dc3545',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                Close
              </button>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <strong>Chinese Text:</strong>
              <div style={{
                fontSize: '24px',
                padding: '15px',
                backgroundColor: '#f8f9fa',
                borderRadius: '4px',
                marginTop: '5px',
                lineHeight: '1.6',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <span>{selectedSentence.chineseText}</span>
                <button
                  onClick={handlePronounceSentence}
                  disabled={playingSentence}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: playingSentence ? '#6c757d' : '#28a745',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: playingSentence ? 'not-allowed' : 'pointer',
                    fontSize: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    minWidth: '120px',
                    justifyContent: 'center'
                  }}
                >
                  <span style={{ fontSize: '20px' }}>{playingSentence ? '🔊' : '🔉'}</span>
                  <span>{playingSentence ? 'Playing...' : 'Pronounce'}</span>
                </button>
              </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <strong>Pinyin:</strong>
              <div style={{
                fontSize: '18px',
                padding: '15px',
                backgroundColor: '#f8f9fa',
                borderRadius: '4px',
                marginTop: '5px',
                color: selectedSentence.pinyin ? '#000' : '#999',
                fontStyle: selectedSentence.pinyin ? 'normal' : 'italic'
              }}>
                {selectedSentence.pinyin || 'Not available'}
              </div>
            </div>

            <div>
              <strong>Characters Used:</strong>
              {loadingDetails ? (
                <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
                  Loading character details...
                </div>
              ) : characterDetails.length > 0 ? (
                <div style={{ marginTop: '10px', overflowX: 'auto' }}>
                  <table style={{
                    width: '100%',
                    borderCollapse: 'collapse',
                    backgroundColor: 'white',
                    borderRadius: '4px',
                    overflow: 'hidden'
                  }}>
                    <thead>
                      <tr style={{ backgroundColor: '#f8f9fa' }}>
                        <th style={{ padding: '10px', border: '1px solid #dee2e6', textAlign: 'left' }}>Chinese</th>
                        <th style={{ padding: '10px', border: '1px solid #dee2e6', textAlign: 'left' }}>Pinyin</th>
                        <th style={{ padding: '10px', border: '1px solid #dee2e6', textAlign: 'left' }}>Han Vietnamese</th>
                        <th style={{ padding: '10px', border: '1px solid #dee2e6', textAlign: 'left' }}>Modern Vietnamese</th>
                        <th style={{ padding: '10px', border: '1px solid #dee2e6', textAlign: 'left' }}>English</th>
                        <th style={{ padding: '10px', border: '1px solid #dee2e6', textAlign: 'center' }}>Favorite</th>
                        <th style={{ padding: '10px', border: '1px solid #dee2e6', textAlign: 'center' }}>Pronounce</th>
                      </tr>
                    </thead>
                    <tbody>
                      {characterDetails.map((char, index) => (
                        <tr key={index}>
                          <td style={{ padding: '10px', border: '1px solid #dee2e6', fontSize: '20px' }}>
                            {char.chineseCharacter}
                          </td>
                          <td style={{ padding: '10px', border: '1px solid #dee2e6' }}>
                            {char.pinyin || 'N/A'}
                          </td>
                          <td style={{ padding: '10px', border: '1px solid #dee2e6' }}>
                            {char.hanVietnamese || 'N/A'}
                          </td>
                          <td style={{ padding: '10px', border: '1px solid #dee2e6' }}>
                            {char.modernVietnamese || 'N/A'}
                          </td>
                          <td style={{ padding: '10px', border: '1px solid #dee2e6' }}>
                            {char.englishMeaning || 'N/A'}
                          </td>
                          <td style={{ padding: '10px', border: '1px solid #dee2e6', textAlign: 'center' }}>
                            <button
                              onClick={() => handleToggleFavorite(char.chineseCharacter, char.isFavorite || false)}
                              style={{
                                padding: '5px 10px',
                                backgroundColor: 'transparent',
                                color: char.isFavorite ? '#ffc107' : '#ccc',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '20px',
                                transition: 'color 0.2s'
                              }}
                              title={char.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                            >
                              {char.isFavorite ? '★' : '☆'}
                            </button>
                          </td>
                          <td style={{ padding: '10px', border: '1px solid #dee2e6', textAlign: 'center' }}>
                            <button
                              onClick={() => handlePronounceCharacter(char.chineseCharacter)}
                              disabled={playingCharacter === char.chineseCharacter}
                              style={{
                                padding: '5px 10px',
                                backgroundColor: playingCharacter === char.chineseCharacter ? '#ccc' : '#007bff',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: playingCharacter === char.chineseCharacter ? 'not-allowed' : 'pointer',
                                fontSize: '14px'
                              }}
                            >
                              {playingCharacter === char.chineseCharacter ? '🔊' : '🔉'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
                  No character details available
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
