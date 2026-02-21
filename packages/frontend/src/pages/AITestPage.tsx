import React, { useState } from 'react';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:3000/api';

interface GeneratedText {
  chineseText: string;
  pinyin: string;
  wordCount: number;
  usedCharacters?: string[];
}

interface CharacterInfo {
  chineseCharacter: string;
  pinyin: string;
  modernVietnamese?: string;
  englishMeaning?: string;
}

export default function AITestPage() {
  const [username, setUsername] = useState('user1');
  const [users, setUsers] = useState<string[]>([]);
  const [chapterStart, setChapterStart] = useState(1);
  const [chapterEnd, setChapterEnd] = useState(3);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<GeneratedText | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [audioPlaying, setAudioPlaying] = useState(false);
  const [characterDetails, setCharacterDetails] = useState<CharacterInfo[]>([]);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [playingCharacter, setPlayingCharacter] = useState<string | null>(null);

  React.useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const response = await axios.get<string[]>(`${API_BASE_URL}/vocabulary/users`);
      setUsers(response.data);
      if (response.data.length > 0 && !response.data.includes(username)) {
        setUsername(response.data[0]);
      }
    } catch (error) {
      console.error('Failed to load users:', error);
    }
  };

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    setCharacterDetails([]);

    try {
      console.log('Sending request to:', `${API_BASE_URL}/${username}/comprehension/generate`);
      console.log('Params:', { chapterStart, chapterEnd });
      
      const response = await axios.get<GeneratedText>(
        `${API_BASE_URL}/${username}/comprehension/generate`,
        {
          params: {
            chapterStart,
            chapterEnd
          }
        }
      );

      console.log('Response:', response.data);
      setResult(response.data);

      // Fetch character details if usedCharacters is available
      if (response.data.usedCharacters && response.data.usedCharacters.length > 0) {
        await fetchCharacterDetails(response.data.usedCharacters);
      }
    } catch (err: any) {
      console.error('Error:', err);
      const errorMessage = err.response?.data?.details || err.response?.data?.error || err.message || 'Failed to generate text';
      console.error('Error message:', errorMessage);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const fetchCharacterDetails = async (characters: string[]) => {
    setLoadingDetails(true);
    try {
      const details = await Promise.all(
        characters.map(async (char) => {
          try {
            const response = await axios.get<CharacterInfo>(
              `${API_BASE_URL}/${username}/comprehension/character-info`,
              { params: { character: char } }
            );
            return response.data;
          } catch (error) {
            console.error(`Failed to fetch details for ${char}:`, error);
            return {
              chineseCharacter: char,
              pinyin: 'N/A',
              modernVietnamese: 'N/A',
              englishMeaning: 'N/A'
            };
          }
        })
      );
      setCharacterDetails(details);
    } catch (error) {
      console.error('Error fetching character details:', error);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handlePronounce = () => {
    if (!result?.chineseText) return;
    
    // Use browser's Web Speech API for pronunciation
    if ('speechSynthesis' in window) {
      setAudioPlaying(true);
      const utterance = new SpeechSynthesisUtterance(result.chineseText);
      utterance.lang = 'zh-CN'; // Chinese (Simplified)
      utterance.rate = 0.5; // Slower speed for learning (0.5 = half speed)
      
      utterance.onend = () => setAudioPlaying(false);
      utterance.onerror = () => {
        setAudioPlaying(false);
        alert('Failed to play pronunciation');
      };
      
      window.speechSynthesis.speak(utterance);
    } else {
      alert('Text-to-speech is not supported in your browser');
    }
  };

  const handlePronounceCharacter = (character: string) => {
    if (!character) return;
    
    // Use browser's Web Speech API for pronunciation
    if ('speechSynthesis' in window) {
      setPlayingCharacter(character);
      const utterance = new SpeechSynthesisUtterance(character);
      utterance.lang = 'zh-CN'; // Chinese (Simplified)
      utterance.rate = 0.5; // Slower speed for learning
      
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

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>Google AI Studio API Test Page</h1>
      <p style={{ color: '#666', marginBottom: '30px' }}>
        Test the Google AI Studio API to generate random Chinese sentences based on your vocabulary.
      </p>

      <div style={{ marginBottom: '20px', padding: '20px', border: '1px solid #ddd', borderRadius: '8px' }}>
        <h2>Configuration</h2>
        
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            Username:
          </label>
          <select
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            style={{
              width: '100%',
              padding: '8px',
              border: '1px solid #ccc',
              borderRadius: '4px',
              fontSize: '14px'
            }}
          >
            {users.map(user => (
              <option key={user} value={user}>{user}</option>
            ))}
          </select>
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            Chapter Start:
          </label>
          <input
            type="number"
            value={chapterStart}
            onChange={(e) => setChapterStart(parseInt(e.target.value))}
            min="1"
            style={{
              width: '100%',
              padding: '8px',
              border: '1px solid #ccc',
              borderRadius: '4px'
            }}
          />
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            Chapter End:
          </label>
          <input
            type="number"
            value={chapterEnd}
            onChange={(e) => setChapterEnd(parseInt(e.target.value))}
            min="1"
            style={{
              width: '100%',
              padding: '8px',
              border: '1px solid #ccc',
              borderRadius: '4px'
            }}
          />
        </div>

        <button
          onClick={handleGenerate}
          disabled={loading}
          style={{
            padding: '10px 20px',
            backgroundColor: loading ? '#ccc' : '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontSize: '16px',
            width: '100%'
          }}
        >
          {loading ? 'Generating...' : 'Generate Random Sentence'}
        </button>
      </div>

      {error && (
        <div style={{
          padding: '15px',
          backgroundColor: '#f8d7da',
          color: '#721c24',
          border: '1px solid #f5c6cb',
          borderRadius: '4px',
          marginBottom: '20px'
        }}>
          <strong>Error:</strong> {error}
        </div>
      )}

      {result && (
        <div style={{
          padding: '20px',
          backgroundColor: '#d4edda',
          border: '1px solid #c3e6cb',
          borderRadius: '8px'
        }}>
          <h2 style={{ marginTop: 0, color: '#155724' }}>Generated Text</h2>
          
          <div style={{ marginBottom: '15px' }}>
            <strong>Chinese Text:</strong>
            <div style={{
              fontSize: '20px',
              padding: '10px',
              backgroundColor: 'white',
              borderRadius: '4px',
              marginTop: '5px',
              lineHeight: '1.6'
            }}>
              {result.chineseText}
            </div>
            <button
              onClick={handlePronounce}
              disabled={audioPlaying}
              style={{
                marginTop: '10px',
                padding: '8px 16px',
                backgroundColor: audioPlaying ? '#ccc' : '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: audioPlaying ? 'not-allowed' : 'pointer',
                fontSize: '14px'
              }}
            >
              🔊 {audioPlaying ? 'Playing...' : 'Read Aloud'}
            </button>
          </div>

          <div style={{ marginBottom: '15px' }}>
            <strong>Pinyin:</strong>
            <div style={{
              fontSize: '16px',
              padding: '10px',
              backgroundColor: 'white',
              borderRadius: '4px',
              marginTop: '5px',
              color: result.pinyin ? '#000' : '#999',
              fontStyle: result.pinyin ? 'normal' : 'italic'
            }}>
              {result.pinyin || 'Not available'}
            </div>
          </div>

          {result.usedCharacters && result.usedCharacters.length > 0 && (
            <div style={{ marginBottom: '15px' }}>
              <strong>Characters Used:</strong>
              {loadingDetails ? (
                <div style={{ padding: '10px', fontStyle: 'italic', color: '#666' }}>
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
                        <th style={{ padding: '10px', border: '1px solid #dee2e6', textAlign: 'left' }}>English</th>
                        <th style={{ padding: '10px', border: '1px solid #dee2e6', textAlign: 'left' }}>Vietnamese</th>
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
                            {char.pinyin}
                          </td>
                          <td style={{ padding: '10px', border: '1px solid #dee2e6' }}>
                            {char.englishMeaning || 'N/A'}
                          </td>
                          <td style={{ padding: '10px', border: '1px solid #dee2e6' }}>
                            {char.modernVietnamese || 'N/A'}
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
                <div style={{
                  fontSize: '18px',
                  padding: '10px',
                  backgroundColor: 'white',
                  borderRadius: '4px',
                  marginTop: '5px'
                }}>
                  {result.usedCharacters.join(', ')}
                </div>
              )}
            </div>
          )}

          <div>
            <strong>Word Count:</strong>
            <div style={{
              fontSize: '16px',
              padding: '10px',
              backgroundColor: 'white',
              borderRadius: '4px',
              marginTop: '5px'
            }}>
              {result.wordCount} characters
            </div>
          </div>
        </div>
      )}

      <div style={{
        marginTop: '30px',
        padding: '15px',
        backgroundColor: '#f8f9fa',
        border: '1px solid #dee2e6',
        borderRadius: '4px'
      }}>
        <h3 style={{ marginTop: 0 }}>How it works:</h3>
        <ol style={{ marginBottom: 0 }}>
          <li>Enter a username (default: user1)</li>
          <li>Select chapter range (default: 1-3)</li>
          <li>Click "Generate Random Sentence"</li>
          <li>The API will fetch vocabulary from the specified chapters</li>
          <li>Google AI Studio will generate a sentence using those characters</li>
          <li>The result will be displayed with pinyin and word count</li>
        </ol>
      </div>

      <div style={{
        marginTop: '20px',
        padding: '15px',
        backgroundColor: '#fff3cd',
        border: '1px solid #ffeaa7',
        borderRadius: '4px'
      }}>
        <h3 style={{ marginTop: 0 }}>⚠️ Requirements:</h3>
        <ul style={{ marginBottom: 0 }}>
          <li>Backend server must be running on port 3000</li>
          <li>Google AI Studio API key must be configured in backend .env file</li>
          <li>User must have vocabulary entries in the database</li>
        </ul>
      </div>
    </div>
  );
}
