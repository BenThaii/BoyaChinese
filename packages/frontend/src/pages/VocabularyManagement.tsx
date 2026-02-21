import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { vocabularyApi, VocabularyEntry } from '../api/client';

export default function VocabularyManagement() {
  const { username } = useParams<{ username: string }>();
  const [entries, setEntries] = useState<VocabularyEntry[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<VocabularyEntry>>({});
  const [loading, setLoading] = useState(false);
  const [showBatchUpload, setShowBatchUpload] = useState(false);
  const [batchText, setBatchText] = useState('');
  const [batchChapter, setBatchChapter] = useState(1);
  const [batchUploading, setBatchUploading] = useState(false);
  const [batchResult, setBatchResult] = useState<{ success: number; failed: number; total: number } | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [playingAudio, setPlayingAudio] = useState<string | null>(null);

  useEffect(() => {
    loadEntries();
  }, [username]);

  const loadEntries = async () => {
    if (!username) return;
    setLoading(true);
    try {
      const response = await vocabularyApi.getAll(username);
      setEntries(response.data);
    } catch (error) {
      console.error('Failed to load vocabulary:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (entry: VocabularyEntry) => {
    setEditingId(entry.id);
    setEditForm(entry);
  };

  const handleSave = async () => {
    if (!username || !editingId) return;
    try {
      await vocabularyApi.update(username, editingId, editForm);
      setEditingId(null);
      loadEntries();
    } catch (error) {
      console.error('Failed to update entry:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!username || !confirm('Delete this entry?')) return;
    try {
      await vocabularyApi.delete(username, id);
      loadEntries();
    } catch (error) {
      console.error('Failed to delete entry:', error);
    }
  };

  const handleBatchUpload = async () => {
    if (!username || !batchText.trim()) return;
    setBatchUploading(true);
    setBatchResult(null);
    try {
      console.log('Sending batch upload request:', { username, batchText, batchChapter });
      const response = await vocabularyApi.batchUpload(username, batchText, batchChapter);
      console.log('Batch upload response:', response.data);
      setBatchResult({
        success: response.data.success,
        failed: response.data.failed,
        total: response.data.total,
      });
      setBatchText('');
      loadEntries();
    } catch (error: any) {
      console.error('Failed to batch upload:', error);
      console.error('Error response:', error.response?.data);
      const errorMsg = error.response?.data?.error || error.message || 'Unknown error';
      alert(`Batch upload failed: ${errorMsg}`);
    } finally {
      setBatchUploading(false);
    }
  };

  const handlePronounce = async (text: string, id: string) => {
    if (!text) return;
    
    // Use browser's Web Speech API for pronunciation
    if ('speechSynthesis' in window) {
      setPlayingAudio(id);
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'zh-CN'; // Chinese (Simplified)
      utterance.rate = 0.5; // Slower speed for learning (0.5 = half speed)
      
      utterance.onend = () => setPlayingAudio(null);
      utterance.onerror = () => {
        setPlayingAudio(null);
        alert('Failed to play pronunciation');
      };
      
      window.speechSynthesis.speak(utterance);
    } else {
      alert('Text-to-speech is not supported in your browser');
    }
  };

  const toggleSelection = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === entries.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(entries.map(e => e.id)));
    }
  };

  const handleBatchDelete = async () => {
    if (!username || selectedIds.size === 0) return;
    if (!confirm(`Delete ${selectedIds.size} selected entries?`)) return;
    
    try {
      const deletePromises = Array.from(selectedIds).map(id => 
        vocabularyApi.delete(username, id)
      );
      await Promise.all(deletePromises);
      setSelectedIds(new Set());
      loadEntries();
    } catch (error) {
      console.error('Failed to batch delete:', error);
      alert('Some entries failed to delete');
      loadEntries();
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="vocabulary-management">
      <h2>Vocabulary Management - {username}</h2>
      
      <div style={{ marginBottom: '20px' }}>
        <button onClick={() => setShowBatchUpload(!showBatchUpload)}>
          {showBatchUpload ? 'Hide Batch Upload' : 'Batch Upload'}
        </button>
        {selectedIds.size > 0 && (
          <button 
            onClick={handleBatchDelete}
            style={{ marginLeft: '10px', backgroundColor: '#dc3545', color: 'white' }}
          >
            Delete Selected ({selectedIds.size})
          </button>
        )}
      </div>

      {showBatchUpload && (
        <div style={{ marginBottom: '20px', padding: '15px', border: '1px solid #ccc', borderRadius: '5px' }}>
          <h3>Batch Upload Chinese Characters</h3>
          <p>Enter Chinese characters separated by comma (,), semicolon (;), or newline (Enter)</p>
          <textarea
            value={batchText}
            onChange={(e) => setBatchText(e.target.value)}
            placeholder="例如: 你,好,世,界 or 你;好;世;界 or one per line"
            rows={4}
            style={{ width: '100%', marginBottom: '10px' }}
            disabled={batchUploading}
          />
          <div style={{ marginBottom: '10px' }}>
            <label>
              Chapter: 
              <input
                type="number"
                value={batchChapter}
                onChange={(e) => setBatchChapter(parseInt(e.target.value) || 1)}
                min="1"
                style={{ marginLeft: '10px', width: '80px' }}
                disabled={batchUploading}
              />
            </label>
          </div>
          <button 
            onClick={handleBatchUpload} 
            disabled={batchUploading || !batchText.trim()}
          >
            {batchUploading ? 'Uploading...' : 'Upload'}
          </button>
          {batchResult && (
            <div style={{ marginTop: '10px', padding: '10px', backgroundColor: '#f0f0f0', borderRadius: '3px' }}>
              <strong>Upload Complete:</strong> {batchResult.success} succeeded, {batchResult.failed} failed out of {batchResult.total} total
            </div>
          )}
        </div>
      )}

      <table>
        <thead>
          <tr>
            <th>
              <input 
                type="checkbox" 
                checked={selectedIds.size === entries.length && entries.length > 0}
                onChange={toggleSelectAll}
              />
            </th>
            <th>Chinese</th>
            <th>Pinyin</th>
            <th>Han Vietnamese</th>
            <th>Modern Vietnamese</th>
            <th>English</th>
            <th>Note</th>
            <th>Chapter</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry) => (
            <tr key={entry.id}>
              {editingId === entry.id ? (
                <>
                  <td>
                    <input 
                      type="checkbox" 
                      disabled
                    />
                  </td>
                  <td>
                    <input
                      value={editForm.chineseCharacter || ''}
                      onChange={(e) =>
                        setEditForm({ ...editForm, chineseCharacter: e.target.value })
                      }
                    />
                  </td>
                  <td>
                    <input
                      value={editForm.pinyin || ''}
                      onChange={(e) =>
                        setEditForm({ ...editForm, pinyin: e.target.value })
                      }
                    />
                  </td>
                  <td>
                    <input
                      value={editForm.hanVietnamese || ''}
                      onChange={(e) =>
                        setEditForm({ ...editForm, hanVietnamese: e.target.value })
                      }
                    />
                  </td>
                  <td>
                    <input
                      value={editForm.modernVietnamese || ''}
                      onChange={(e) =>
                        setEditForm({ ...editForm, modernVietnamese: e.target.value })
                      }
                    />
                  </td>
                  <td>
                    <input
                      value={editForm.englishMeaning || ''}
                      onChange={(e) =>
                        setEditForm({ ...editForm, englishMeaning: e.target.value })
                      }
                    />
                  </td>
                  <td>
                    <input
                      value={editForm.learningNote || ''}
                      onChange={(e) =>
                        setEditForm({ ...editForm, learningNote: e.target.value })
                      }
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      value={editForm.chapter || ''}
                      onChange={(e) =>
                        setEditForm({ ...editForm, chapter: parseInt(e.target.value) })
                      }
                    />
                  </td>
                  <td>
                    <button onClick={handleSave}>Save</button>
                    <button onClick={() => setEditingId(null)}>Cancel</button>
                  </td>
                </>
              ) : (
                <>
                  <td>
                    <input 
                      type="checkbox" 
                      checked={selectedIds.has(entry.id)}
                      onChange={() => toggleSelection(entry.id)}
                    />
                  </td>
                  <td>{entry.chineseCharacter}</td>
                  <td>{entry.pinyin}</td>
                  <td>{entry.hanVietnamese}</td>
                  <td>{entry.modernVietnamese}</td>
                  <td>{entry.englishMeaning}</td>
                  <td>{entry.learningNote}</td>
                  <td>{entry.chapter}</td>
                  <td>
                    <button 
                      onClick={() => handlePronounce(entry.chineseCharacter, entry.id)}
                      disabled={playingAudio === entry.id}
                      style={{ marginRight: '5px', fontSize: '12px' }}
                      title="Pronounce"
                    >
                      {playingAudio === entry.id ? '🔊' : '🔉'}
                    </button>
                    <button onClick={() => handleEdit(entry)}>Edit</button>
                    <button onClick={() => handleDelete(entry.id)}>Delete</button>
                  </td>
                </>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
