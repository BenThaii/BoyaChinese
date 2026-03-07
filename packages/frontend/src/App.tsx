import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import VocabularyManagement from './pages/VocabularyManagement';
import VocabularyUpload from './pages/VocabularyUpload';
import VocabularySharing from './pages/VocabularySharing';
import DatabaseAdmin from './pages/DatabaseAdmin';
import AITestPage from './pages/AITestPage';
import PhrasesPage from './pages/PhrasesPage';
import EnglishPhrasesPage from './pages/EnglishPhrasesPage';
import FlashcardPage from './pages/FlashcardPage';
import ChapterFlashcardPage from './pages/ChapterFlashcardPage';

function Navigation() {
  const username = 'user1'; // Always use user1
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  return (
    <nav style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      backgroundColor: '#007bff',
      zIndex: 2000,
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
    }}>
      {/* Hamburger Menu Button */}
      <button
        onClick={toggleMenu}
        style={{
          padding: '10px 15px',
          backgroundColor: 'transparent',
          border: 'none',
          cursor: 'pointer',
          fontSize: '20px',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}
      >
        <span style={{ fontSize: '24px' }}>☰</span>
        <span style={{ fontSize: '14px', fontWeight: 'bold' }}>Menu</span>
      </button>

      {/* Dropdown Menu */}
      {isMenuOpen && (
        <>
          {/* Backdrop */}
          <div
            onClick={closeMenu}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              zIndex: 2001
            }}
          />
          
          {/* Menu Panel */}
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              width: '280px',
              height: '100vh',
              backgroundColor: 'white',
              boxShadow: '2px 0 8px rgba(0,0,0,0.2)',
              zIndex: 2002,
              overflowY: 'auto'
            }}
          >
            <div style={{
              padding: '20px',
              backgroundColor: '#007bff',
              color: 'white',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <h2 style={{ margin: 0, fontSize: '20px' }}>Navigation</h2>
              <button
                onClick={closeMenu}
                style={{
                  backgroundColor: 'transparent',
                  border: 'none',
                  color: 'white',
                  fontSize: '28px',
                  cursor: 'pointer',
                  padding: '0',
                  lineHeight: '1'
                }}
              >
                ×
              </button>
            </div>
            
            <ul style={{
              listStyle: 'none',
              padding: 0,
              margin: 0
            }}>
              <li>
                <Link
                  to="/"
                  onClick={closeMenu}
                  style={{
                    display: 'block',
                    padding: '15px 20px',
                    color: '#333',
                    textDecoration: 'none',
                    borderBottom: '1px solid #eee',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  🏠 Home
                </Link>
              </li>
              <li>
                <Link
                  to={`/${username}/admin`}
                  onClick={closeMenu}
                  style={{
                    display: 'block',
                    padding: '15px 20px',
                    color: '#333',
                    textDecoration: 'none',
                    borderBottom: '1px solid #eee',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  📚 Vocabulary Management
                </Link>
              </li>
              <li>
                <Link
                  to={`/${username}/upload`}
                  onClick={closeMenu}
                  style={{
                    display: 'block',
                    padding: '15px 20px',
                    color: '#333',
                    textDecoration: 'none',
                    borderBottom: '1px solid #eee',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  ➕ Add Vocabulary
                </Link>
              </li>
              <li>
                <Link
                  to="/database-admin"
                  onClick={closeMenu}
                  style={{
                    display: 'block',
                    padding: '15px 20px',
                    color: '#333',
                    textDecoration: 'none',
                    borderBottom: '1px solid #eee',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  🗄️ Database Admin
                </Link>
              </li>
              <li>
                <Link
                  to="/ai-test"
                  onClick={closeMenu}
                  style={{
                    display: 'block',
                    padding: '15px 20px',
                    color: '#333',
                    textDecoration: 'none',
                    borderBottom: '1px solid #eee',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  🤖 AI Test Page
                </Link>
              </li>
              <li>
                <Link
                  to="/phrases"
                  onClick={closeMenu}
                  style={{
                    display: 'block',
                    padding: '15px 20px',
                    color: '#333',
                    textDecoration: 'none',
                    borderBottom: '1px solid #eee',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  🇨🇳 Phrases (Chinese)
                </Link>
              </li>
              <li>
                <Link
                  to="/english-phrases"
                  onClick={closeMenu}
                  style={{
                    display: 'block',
                    padding: '15px 20px',
                    color: '#333',
                    textDecoration: 'none',
                    borderBottom: '1px solid #eee',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  🇬🇧 Phrases (English)
                </Link>
              </li>
              <li>
                <Link
                  to="/flashcards"
                  onClick={closeMenu}
                  style={{
                    display: 'block',
                    padding: '15px 20px',
                    color: '#333',
                    textDecoration: 'none',
                    borderBottom: '1px solid #eee',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  ⭐ Flashcards (Favorites)
                </Link>
              </li>
              <li>
                <Link
                  to="/chapter-flashcards"
                  onClick={closeMenu}
                  style={{
                    display: 'block',
                    padding: '15px 20px',
                    color: '#333',
                    textDecoration: 'none',
                    borderBottom: '1px solid #eee',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  📖 Flashcards (Chapters)
                </Link>
              </li>
            </ul>
          </div>
        </>
      )}
    </nav>
  );
}

function App() {
  return (
    <Router>
      <div className="app">
        <Navigation />
        <main style={{ paddingTop: '50px' }}>
          <Routes>
            <Route path="/" element={
              <div>
                <h2>Welcome to Chinese Learning App</h2>
                <p>Available features:</p>
                <ul>
                  <li>Vocabulary Management - View and manage vocabulary entries</li>
                  <li>Add Vocabulary - Create new vocabulary entries with automatic translation</li>
                  <li>Database Admin - Backup and restore database</li>
                  <li>AI Test Page - Test Google AI Studio API for sentence generation</li>
                  <li>Phrases (Chinese) - Practice with pre-generated Chinese sentences</li>
                  <li>Phrases (English) - Practice by reading English translations</li>
                  <li>Flashcards (Favorites) - Practice your favorite words with flashcards</li>
                  <li>Flashcards (Chapters) - Practice words by chapter range</li>
                </ul>
              </div>
            } />
            <Route path="/:username/admin" element={<VocabularyManagement />} />
            <Route path="/:username/upload" element={<VocabularyUpload />} />
            <Route path="/:username/share" element={<VocabularySharing />} />
            <Route path="/database-admin" element={<DatabaseAdmin />} />
            <Route path="/ai-test" element={<AITestPage />} />
            <Route path="/phrases" element={<PhrasesPage />} />
            <Route path="/english-phrases" element={<EnglishPhrasesPage />} />
            <Route path="/flashcards" element={<FlashcardPage />} />
            <Route path="/chapter-flashcards" element={<ChapterFlashcardPage />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
