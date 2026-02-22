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
  const [availableChapters, setAvailableChapters] = useState<number[]>([]);
  const [selectedChapter, setSelectedChapter] = useState<number | null>(null);
  const [batchEditMode, setBatchEditMode] = useState(false);
  const [batchEditForms, setBatchEditForms] = useState<Map<string, Partial<VocabularyEntry>>>(new Map());
  const [showBatchEdit, setShowBatchEdit] = useState(false);
  const [batchEditForm, setBatchEditForm] = useState<Partial<VocabularyEntry>>({});
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    loadChapters();
  }, [username]);

  useEffect(() => {
    loadEntries();
  }, [username, selectedChapter]);

  const loadChapters = async () => {
    if (!username) return;
    try {
      const response = await vocabularyApi.getChapters(username);
      setAvailableChapters(response.data);
    } catch (error) {
      console.error('Failed to load chapters:', error);
    }
  };

  const loadEntries = async () => {
    if (!username) return;
    setLoading(true);
    try {
      const response = selectedChapter 
        ? await vocabularyApi.getAll(username, selectedChapter, selectedChapter)
        : await vocabularyApi.getAll(username);
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
      loadChapters(); // Reload chapters in case new chapter was added
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

  const handleBatchEditStart = () => {
    if (selectedIds.size === 0) {
      alert('Please select entries to edit');
      return;
    }
    
    // Initialize edit forms for selected entries
    const forms = new Map<string, Partial<VocabularyEntry>>();
    entries.filter(e => selectedIds.has(e.id)).forEach(entry => {
      forms.set(entry.id, { ...entry });
    });
    setBatchEditForms(forms);
    setBatchEditMode(true);
  };

  const handleBatchEditCancel = () => {
    setBatchEditMode(false);
    setBatchEditForms(new Map());
  };

  const handleBatchEditSave = async () => {
    if (!username) return;
    
    try {
      const updatePromises = Array.from(batchEditForms.entries()).map(([id, form]) =>
        vocabularyApi.update(username, id, form)
      );
      await Promise.all(updatePromises);
      setBatchEditMode(false);
      setBatchEditForms(new Map());
      setSelectedIds(new Set());
      loadEntries();
    } catch (error) {
      console.error('Failed to batch update:', error);
      alert('Some entries failed to update');
      loadEntries();
    }
  };

  const updateBatchEditForm = (id: string, field: keyof VocabularyEntry, value: any) => {
    const newForms = new Map(batchEditForms);
    const form = newForms.get(id) || {};
    newForms.set(id, { ...form, [field]: value });
    setBatchEditForms(newForms);
  };

  const handleBatchEdit = async () => {
    if (!username || selectedIds.size === 0) return;
    
    // Filter out empty fields
    const updates: Partial<VocabularyEntry> = {};
    if (batchEditForm.chapter !== undefined) updates.chapter = batchEditForm.chapter;
    if (batchEditForm.hanVietnamese?.trim()) updates.hanVietnamese = batchEditForm.hanVietnamese;
    if (batchEditForm.modernVietnamese?.trim()) updates.modernVietnamese = batchEditForm.modernVietnamese;
    if (batchEditForm.englishMeaning?.trim()) updates.englishMeaning = batchEditForm.englishMeaning;
    if (batchEditForm.learningNote?.trim()) updates.learningNote = batchEditForm.learningNote;
    
    if (Object.keys(updates).length === 0) {
      alert('Please fill in at least one field to update');
      return;
    }
    
    if (!confirm(`Update ${selectedIds.size} selected entries with these values?`)) return;
    
    try {
      const updatePromises = Array.from(selectedIds).map(id => 
        vocabularyApi.update(username, id, updates)
      );
      await Promise.all(updatePromises);
      setSelectedIds(new Set());
      setBatchEditForm({});
      setShowBatchEdit(false);
      loadEntries();
    } catch (error) {
      console.error('Failed to batch edit:', error);
      alert('Some entries failed to update');
      loadEntries();
    }
  };

  const handleRowClick = (id: string, e: React.MouseEvent) => {
    // Don't toggle if clicking on a button or input
    const target = e.target as HTMLElement;
    if (target.tagName === 'BUTTON' || target.tagName === 'INPUT') {
      return;
    }
    
    toggleSelection(id);
  };

  if (loading) return <div>Loading...</div>;

  // Filter entries based on batch edit mode
  const displayedEntries = batchEditMode 
    ? entries.filter(e => selectedIds.has(e.id))
    : entries;

  return (
    <div className="vocabulary-management">
      <h2>Vocabulary Management - {username}</h2>
      
      <div style={{ marginBottom: '20px' }}>
        <label style={{ marginRight: '15px' }}>
          Filter by Chapter: 
          <select 
            value={selectedChapter || ''} 
            onChange={(e) => setSelectedChapter(e.target.value ? parseInt(e.target.value) : null)}
            style={{ marginLeft: '10px' }}
          >
            <option value="">All Chapters</option>
            {availableChapters.map(chapter => (
              <option key={chapter} value={chapter}>Chapter {chapter}</option>
            ))}
          </select>
        </label>
        <span style={{ color: '#666', fontSize: '14px' }}>
          ({entries.length} entries)
        </span>
      </div>
      
      <div style={{ marginBottom: '20px' }}>
        <button onClick={() => setShowBatchUpload(!showBatchUpload)}>
          {showBatchUpload ? 'Hide Batch Upload' : 'Batch Upload'}
        </button>
        {selectedIds.size > 0 && !batchEditMode && (
          <>
            <button 
              onClick={handleBatchEditStart}
              style={{ marginLeft: '10px', backgroundColor: '#007bff', color: 'white' }}
            >
              Batch Edit ({selectedIds.size})
            </button>
            <button 
              onClick={handleBatchDelete}
              style={{ marginLeft: '10px', backgroundColor: '#dc3545', color: 'white' }}
            >
              Delete Selected ({selectedIds.size})
            </button>
          </>
        )}
        {batchEditMode && (
          <>
            <button 
              onClick={handleBatchEditSave}
              style={{ marginLeft: '10px', backgroundColor: '#28a745', color: 'white' }}
            >
              Save All Changes
            </button>
            <button 
              onClick={handleBatchEditCancel}
              style={{ marginLeft: '10px', backgroundColor: '#6c757d', color: 'white' }}
            >
              Cancel Batch Edit
            </button>
          </>
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
          {displayedEntries.map((entry) => (
            <tr 
              key={entry.id}
              onClick={(e) => !batchEditMode && editingId !== entry.id && handleRowClick(entry.id, e)}
              style={{ 
                cursor: batchEditMode || editingId === entry.id ? 'default' : 'pointer',
                backgroundColor: selectedIds.has(entry.id) ? '#e3f2fd' : 'transparent'
              }}
            >
              {batchEditMode ? (
                // Batch edit mode - all fields editable
                <>
                  <td>
                    <input 
                      type="checkbox" 
                      checked={true}
                      disabled
                    />
                  </td>
                  <td>
                    <input
                      value={batchEditForms.get(entry.id)?.chineseCharacter || ''}
                      onChange={(e) => updateBatchEditForm(entry.id, 'chineseCharacter', e.target.value)}
                    />
                  </td>
                  <td>
                    <input
                      value={batchEditForms.get(entry.id)?.pinyin || ''}
                      onChange={(e) => updateBatchEditForm(entry.id, 'pinyin', e.target.value)}
                    />
                  </td>
                  <td>
                    <input
                      value={batchEditForms.get(entry.id)?.hanVietnamese || ''}
                      onChange={(e) => updateBatchEditForm(entry.id, 'hanVietnamese', e.target.value)}
                    />
                  </td>
                  <td>
                    <input
                      value={batchEditForms.get(entry.id)?.modernVietnamese || ''}
                      onChange={(e) => updateBatchEditForm(entry.id, 'modernVietnamese', e.target.value)}
                    />
                  </td>
                  <td>
                    <input
                      value={batchEditForms.get(entry.id)?.englishMeaning || ''}
                      onChange={(e) => updateBatchEditForm(entry.id, 'englishMeaning', e.target.value)}
                    />
                  </td>
                  <td>
                    <input
                      value={batchEditForms.get(entry.id)?.learningNote || ''}
                      onChange={(e) => updateBatchEditForm(entry.id, 'learningNote', e.target.value)}
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      value={batchEditForms.get(entry.id)?.chapter || ''}
                      onChange={(e) => updateBatchEditForm(entry.id, 'chapter', parseInt(e.target.value))}
                    />
                  </td>
                  <td>
                    {/* No actions in batch edit mode */}
                  </td>
                </>
              ) : editingId === entry.id ? (
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
                  <td onClick={(e) => e.stopPropagation()}>
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
                  <td onClick={(e) => e.stopPropagation()}>
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

      {/* Scroll to Top Button */}
      {showScrollTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          style={{
            position: 'fixed',
            bottom: '30px',
            right: '30px',
            width: '50px',
            height: '50px',
            borderRadius: '50%',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            fontSize: '24px',
            cursor: 'pointer',
            boxShadow: '0 4px 8px rgba(0,0,0,0.3)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          title="Scroll to top"
        >
          ↑
        </button>
      )}
    </div>
  );
}
