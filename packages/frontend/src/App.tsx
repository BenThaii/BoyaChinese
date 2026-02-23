import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import VocabularyManagement from './pages/VocabularyManagement';
import VocabularyUpload from './pages/VocabularyUpload';
import VocabularySharing from './pages/VocabularySharing';
import DatabaseAdmin from './pages/DatabaseAdmin';
import AITestPage from './pages/AITestPage';
import PhrasesPage from './pages/PhrasesPage';

function Navigation() {
  const username = 'user1'; // Always use user1

  return (
    <nav>
      <h1>Chinese Learning App - Admin</h1>
      <ul>
        <li><Link to="/">Home</Link></li>
        <li><Link to={`/${username}/admin`}>Vocabulary Management</Link></li>
        <li><Link to={`/${username}/upload`}>Add Vocabulary</Link></li>
        <li><Link to="/database-admin">Database Admin</Link></li>
        <li><Link to="/ai-test">AI Test Page</Link></li>
        <li><Link to="/phrases">Phrases Page</Link></li>
      </ul>
    </nav>
  );
}

function App() {
  return (
    <Router>
      <div className="app">
        <Navigation />
        <main>
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
                  <li>Phrases Page - Practice with pre-generated Chinese sentences</li>
                </ul>
              </div>
            } />
            <Route path="/:username/admin" element={<VocabularyManagement />} />
            <Route path="/:username/upload" element={<VocabularyUpload />} />
            <Route path="/:username/share" element={<VocabularySharing />} />
            <Route path="/database-admin" element={<DatabaseAdmin />} />
            <Route path="/ai-test" element={<AITestPage />} />
            <Route path="/phrases" element={<PhrasesPage />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
