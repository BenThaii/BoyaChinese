import { useState } from 'react';
import { adminApi } from '../api/client';

export default function DatabaseAdmin() {
  const [password, setPassword] = useState('');
  const [authenticated, setAuthenticated] = useState(false);
  const [authToken, setAuthToken] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAuthenticate = async () => {
    setLoading(true);
    try {
      const response = await adminApi.authenticate(password);
      if (response.data.success && response.data.token) {
        setAuthenticated(true);
        setAuthToken(response.data.token);
      } else {
        alert('Incorrect password');
      }
    } catch (error) {
      console.error('Authentication failed:', error);
      alert('Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    setLoading(true);
    try {
      const response = await adminApi.backup(authToken);
      const url = window.URL.createObjectURL(new Blob([JSON.stringify(response.data, null, 2)]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `backup-${new Date().toISOString().replace(/[:.]/g, '-')}.json`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      alert('Database exported successfully!');
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed');
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!confirm('This will erase all existing data. Continue?')) {
      event.target.value = '';
      return;
    }

    setLoading(true);
    try {
      const response = await adminApi.restore(file, authToken);
      console.log('Import response:', response);
      alert('Database restored successfully!');
    } catch (error: any) {
      console.error('Import failed:', error);
      const errorMsg = error.response?.data?.error || error.response?.data?.details || error.message || 'Unknown error';
      alert(`Import failed: ${errorMsg}`);
    } finally {
      setLoading(false);
      event.target.value = '';
    }
  };

  if (!authenticated) {
    return (
      <div className="database-admin">
        <h2>Database Administration</h2>
        <div>
          <label>Password:</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleAuthenticate()}
          />
          <button onClick={handleAuthenticate} disabled={loading}>
            Authenticate
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="database-admin">
      <h2>Database Administration</h2>
      <div>
        <h3>Export Database</h3>
        <p>Download a complete backup of all vocabulary entries.</p>
        <button onClick={handleExport} disabled={loading}>
          Export Database
        </button>
      </div>
      <div>
        <h3>Import Database</h3>
        <p>
          <strong>Warning:</strong> This will erase all existing data and replace it
          with the backup file.
        </p>
        <input
          type="file"
          accept=".json"
          onChange={handleImport}
          disabled={loading}
        />
      </div>
    </div>
  );
}
