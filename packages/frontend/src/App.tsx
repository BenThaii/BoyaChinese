import { BrowserRouter as Router, Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import VocabularyManagement from './pages/VocabularyManagement';
import VocabularyUpload from './pages/VocabularyUpload';
import VocabularySharing from './pages/VocabularySharing';
import DatabaseAdmin from './pages/DatabaseAdmin';
import AITestPage from './pages/AITestPage';
import { vocabularyApi } from './api/client';

function Navigation() {
  const location = useLocation();
  const navigate = useNavigate();
  const [users, setUsers] = useState<string[]>([]);
  const [newUsername, setNewUsername] = useState('');
  const [showNewUserInput, setShowNewUserInput] = useState(false);

  // Extract username from current path
  const pathParts = location.pathname.split('/');
  const currentUsername = pathParts[1] && pathParts[1] !== 'database-admin' ? pathParts[1] : null;

  // Load users on mount
  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      console.log('Loading users from API...');
      const response = await vocabularyApi.getAllUsers();
      console.log('Users loaded:', response.data);
      setUsers(response.data);
    } catch (error) {
      console.error('Failed to load users:', error);
      // If API fails, still allow creating new users
      setUsers([]);
    }
  };

  const handleUserSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    if (value === '__new__') {
      setShowNewUserInput(true);
      setSelectedUser('');
    } else if (value) {
      setShowNewUserInput(false);
      navigate(`/${value}/admin`);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newUsername.trim()) {
      try {
        // Create user in database
        await vocabularyApi.createUser(newUsername.trim());
        // Navigate to the new user's admin page
        navigate(`/${newUsername.trim()}/admin`);
        setNewUsername('');
        setShowNewUserInput(false);
        // Reload users list
        await loadUsers();
      } catch (error) {
        console.error('Failed to create user:', error);
        alert('Failed to create user');
      }
    }
  };

  return (
    <nav>
      <h1>Chinese Learning App - Admin</h1>
      <div style={{ display: 'flex', gap: '20px', alignItems: 'center', marginBottom: '10px' }}>
        {!showNewUserInput ? (
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <label htmlFor="user-select">Select User:</label>
            <select
              id="user-select"
              value={currentUsername || ''}
              onChange={handleUserSelect}
              style={{ padding: '5px', minWidth: '150px' }}
            >
              <option value="">-- Select User --</option>
              {users.map(user => (
                <option key={user} value={user}>{user}</option>
              ))}
              <option value="__new__">+ Create New User</option>
            </select>
          </div>
        ) : (
          <form onSubmit={handleCreateUser} style={{ display: 'flex', gap: '10px' }}>
            <input
              type="text"
              placeholder="Enter new username"
              value={newUsername}
              onChange={(e) => setNewUsername(e.target.value)}
              style={{ padding: '5px' }}
              autoFocus
            />
            <button type="submit">Create</button>
            <button type="button" onClick={() => setShowNewUserInput(false)}>Cancel</button>
          </form>
        )}
        {currentUsername && <span style={{ fontWeight: 'bold' }}>Current User: {currentUsername}</span>}
      </div>
      <ul>
        <li><Link to="/">Home</Link></li>
        {currentUsername && (
          <>
            <li><Link to={`/${currentUsername}/admin`}>Vocabulary Management</Link></li>
            <li><Link to={`/${currentUsername}/upload`}>Add Vocabulary</Link></li>
            <li><Link to={`/${currentUsername}/share`}>Import Vocabulary</Link></li>
          </>
        )}
        <li><Link to="/database-admin">Database Admin</Link></li>
        <li><Link to="/ai-test">AI Test Page</Link></li>
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
                <p>Select a user from the dropdown above to get started, or create a new user.</p>
                <p>Available features:</p>
                <ul>
                  <li>Vocabulary Management - View and manage vocabulary entries</li>
                  <li>Add Vocabulary - Create new vocabulary entries with automatic translation</li>
                  <li>Import Vocabulary - Share vocabulary from other users</li>
                  <li>Database Admin - Backup and restore database</li>
                  <li>AI Test Page - Test Google AI Studio API for sentence generation</li>
                </ul>
              </div>
            } />
            <Route path="/:username/admin" element={<VocabularyManagement />} />
            <Route path="/:username/upload" element={<VocabularyUpload />} />
            <Route path="/:username/share" element={<VocabularySharing />} />
            <Route path="/database-admin" element={<DatabaseAdmin />} />
            <Route path="/ai-test" element={<AITestPage />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
