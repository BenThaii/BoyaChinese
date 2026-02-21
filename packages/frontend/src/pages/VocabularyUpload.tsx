import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { vocabularyApi } from '../api/client';

export default function VocabularyUpload() {
  const { username } = useParams<{ username: string }>();
  const [form, setForm] = useState({
    chineseCharacter: '',
    pinyin: '',
    hanVietnamese: '',
    modernVietnamese: '',
    englishMeaning: '',
    learningNote: '',
    chapter: 1,
  });
  const [loading, setLoading] = useState(false);
  const [audioPlaying, setAudioPlaying] = useState(false);

  const handlePronounce = () => {
    if (!form.chineseCharacter) {
      alert('Please enter a Chinese character first');
      return;
    }
    
    // Use browser's Web Speech API for pronunciation
    if ('speechSynthesis' in window) {
      setAudioPlaying(true);
      const utterance = new SpeechSynthesisUtterance(form.chineseCharacter);
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

  const handlePreviewTranslation = async () => {
    if (!username || !form.chineseCharacter) {
      alert('Please enter a Chinese character first');
      return;
    }
    setLoading(true);
    try {
      const response = await vocabularyApi.previewTranslation(
        username,
        form.chineseCharacter,
        form.pinyin,
        form.modernVietnamese,
        form.englishMeaning
      );
      // Only fill in blank fields
      setForm({
        ...form,
        pinyin: form.pinyin || response.data.pinyin,
        modernVietnamese: form.modernVietnamese || response.data.modernVietnamese,
        englishMeaning: form.englishMeaning || response.data.englishMeaning,
      });
    } catch (error: any) {
      console.error('Failed to preview translation:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Unknown error';
      alert(`Failed to preview translation: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!username) return;
    setLoading(true);
    try {
      await vocabularyApi.create(username, form);
      alert('Vocabulary entry created!');
      setForm({
        chineseCharacter: '',
        pinyin: '',
        hanVietnamese: '',
        modernVietnamese: '',
        englishMeaning: '',
        learningNote: '',
        chapter: 1,
      });
    } catch (error) {
      console.error('Failed to create entry:', error);
      alert('Failed to create entry');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="vocabulary-upload">
      <h2>Add New Vocabulary - {username}</h2>
      <form onSubmit={(e) => e.preventDefault()}>
        <div>
          <label>Chinese Character:</label>
          <input
            value={form.chineseCharacter}
            onChange={(e) => setForm({ ...form, chineseCharacter: e.target.value })}
            required
          />
          <button 
            type="button" 
            onClick={handlePronounce} 
            disabled={audioPlaying || !form.chineseCharacter}
            style={{ marginLeft: '10px' }}
          >
            🔊 {audioPlaying ? 'Playing...' : 'Pronounce'}
          </button>
        </div>
        <div>
          <label>Pinyin:</label>
          <input
            value={form.pinyin}
            onChange={(e) => setForm({ ...form, pinyin: e.target.value })}
          />
        </div>
        <div>
          <label>Han Vietnamese:</label>
          <input
            value={form.hanVietnamese}
            onChange={(e) => setForm({ ...form, hanVietnamese: e.target.value })}
          />
        </div>
        <div>
          <label>Modern Vietnamese:</label>
          <input
            value={form.modernVietnamese}
            onChange={(e) => setForm({ ...form, modernVietnamese: e.target.value })}
          />
        </div>
        <div>
          <label>English Meaning:</label>
          <input
            value={form.englishMeaning}
            onChange={(e) => setForm({ ...form, englishMeaning: e.target.value })}
          />
        </div>
        <div>
          <label>Learning Note:</label>
          <textarea
            value={form.learningNote}
            onChange={(e) => setForm({ ...form, learningNote: e.target.value })}
          />
        </div>
        <div>
          <label>Chapter:</label>
          <input
            type="number"
            value={form.chapter}
            onChange={(e) => setForm({ ...form, chapter: parseInt(e.target.value) })}
            required
          />
        </div>
        <div>
          <button type="button" onClick={handlePreviewTranslation} disabled={loading}>
            Preview Translation
          </button>
          <button type="button" onClick={handleSave} disabled={loading}>
            Save
          </button>
        </div>
      </form>
    </div>
  );
}
