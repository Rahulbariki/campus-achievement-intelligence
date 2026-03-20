import { useEffect, useState } from 'react';
import axios from 'axios';

const API_BASE = '/api';

function AdminDashboard({ token }) {
  const [certificates, setCertificates] = useState([]);
  const [pressNoteConfig, setPressNoteConfig] = useState({ studentEmail: '', eventName: '' });
  const [pressNoteResult, setPressNoteResult] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchCertificates();
  }, [token]);

  const fetchCertificates = async () => {
    const headers = { Authorization: `Bearer ${token}` };
    const { data } = await axios.get(`${API_BASE}/certificates`, { headers });
    setCertificates(data);
  };

  const verify = async (file_name) => {
    try {
      const comment = window.prompt('Enter verification comment (optional):', '');
      const headers = { Authorization: `Bearer ${token}` };
      await axios.put(`${API_BASE}/verify-certificate/${file_name}?comment=${encodeURIComponent(comment || '')}`, null, { headers });
      fetchCertificates();
    } catch (err) {
      console.error(err);
    }
  };

  const reject = async (file_name) => {
    try {
      const reason = window.prompt('Enter rejection reason (required):', '');
      if (!reason) return;
      const headers = { Authorization: `Bearer ${token}` };
      await axios.put(`${API_BASE}/reject-certificate/${file_name}?reason=${encodeURIComponent(reason)}`, null, { headers });
      fetchCertificates();
    } catch (err) {
      console.error(err);
    }
  };

  const runOCR = async (cert) => {
    try {
      setLoading(true);
      const headers = { Authorization: `Bearer ${token}` };
      const { data } = await axios.post(`${API_BASE}/ocr-verify?event_name=${encodeURIComponent(cert.event_name)}&student_email=${encodeURIComponent(cert.student_email)}&file_name=${encodeURIComponent(cert.file_name)}`, null, { headers });
      alert(`OCR Result: ${data.auto_verify.verified ? 'Verified!' : 'Not clear'}\nConfidence: ${Math.round(data.ocr.confidence * 100)}%`);
      fetchCertificates();
    } catch (err) {
      alert('OCR failed: ' + (err.response?.data?.detail || err.message));
    } finally {
      setLoading(false);
    }
  };

  const generatePressNote = async () => {
    try {
      setLoading(true);
      const headers = { Authorization: `Bearer ${token}` };
      const { data } = await axios.post(`${API_BASE}/admin/generate-press-note?student_email=${encodeURIComponent(pressNoteConfig.studentEmail)}&event_name=${encodeURIComponent(pressNoteConfig.eventName)}`, null, { headers });
      setPressNoteResult(data);
    } catch (err) {
      alert('Failed to generate press note: ' + (err.response?.data?.detail || err.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard-content">
      <div className="section-header">
        <p className="eyebrow">Administrative Portal</p>
        <h2>Verification & Operations</h2>
        <p className="font-serif">Oversee student submissions, verify credentials with AI assistance, and generate official press materials.</p>
      </div>

      <div className="grid-container">
        <section className="panel">
          <p className="eyebrow">AI Tools</p>
          <h3>Draft Press Release</h3>
          <div className="form-group-stack">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              <div className="form-group">
                <label>Student Email</label>
                <input 
                  placeholder="student@campus.edu" 
                  value={pressNoteConfig.studentEmail} 
                  onChange={(e) => setPressNoteConfig({...pressNoteConfig, studentEmail: e.target.value})} 
                />
              </div>
              <div className="form-group">
                <label>Event Name</label>
                <input 
                  placeholder="e.g., Smart India Hackathon" 
                  value={pressNoteConfig.eventName} 
                  onChange={(e) => setPressNoteConfig({...pressNoteConfig, eventName: e.target.value})} 
                />
              </div>
            </div>
            <button className="primary-button" onClick={generatePressNote} disabled={loading || !pressNoteConfig.studentEmail}>
              {loading ? 'Generating...' : 'Create Press Note'}
            </button>
          </div>

          {pressNoteResult && (
            <div style={{ marginTop: '2.5rem', display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '2rem', borderTop: '1px solid var(--line)', paddingTop: '2.5rem' }}>
              <div>
                <p className="eyebrow">Official Draft</p>
                <div className="panel" style={{ background: 'var(--paper-strong)', padding: '2rem' }}>
                  <h4 style={{ marginBottom: '1rem' }}>{pressNoteConfig.eventName}</h4>
                  <p className="font-serif" style={{ whiteSpace: 'pre-wrap' }}>
                    {pressNoteResult.press_note}
                  </p>
                </div>
              </div>
              <div>
                <p className="eyebrow">Social Media</p>
                <div className="panel" style={{ background: 'var(--surface-muted)' }}>
                  <p className="font-mono" style={{ fontSize: '0.8rem', whiteSpace: 'pre-wrap' }}>
                    {pressNoteResult.social_media_post}
                  </p>
                </div>
              </div>
            </div>
          )}
        </section>

        <section className="panel" style={{ gridColumn: 'span 2' }}>
          <p className="eyebrow">Verification Queue</p>
          <h3>Certificate Review Ledger</h3>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Event</th>
                  <th>Level</th>
                  <th>Status</th>
                  <th>AI Confidence</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {certificates.map((cert) => (
                  <tr key={cert.file_name}>
                    <td className="font-mono">{cert.student_email}</td>
                    <td>{cert.event_name}</td>
                    <td><span className={`badge ${cert.achievement}`}>{cert.achievement}</span></td>
                    <td>
                      <span style={{ 
                        color: cert.verified ? 'var(--success)' : cert.rejection_reason ? 'var(--accent)' : 'var(--muted)',
                        fontWeight: 600
                      }}>
                        {cert.verified ? 'Verified' : cert.rejection_reason ? 'Rejected' : 'Pending'}
                      </span>
                    </td>
                    <td>
                      {cert.ocr_confidence ? (
                        <div style={{ fontWeight: 600 }}>
                          {Math.round(cert.ocr_confidence * 100)}% {cert.auto_verified ? '✓' : ''}
                        </div>
                      ) : (
                        <button className="small-btn" onClick={() => runOCR(cert)} disabled={loading}>Run AI</button>
                      )}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <a href={cert.cloudinary_url || `/certificate-files/${cert.file_name}`} 
                           target="_blank" rel="noreferrer" className="ghost-button">
                          Review
                        </a>
                        {!cert.verified && (
                          <>
                            <button className="small-btn" onClick={() => verify(cert.file_name)}>Approve</button>
                            <button className="small-btn btn-danger" onClick={() => reject(cert.file_name)}>Reject</button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}

export default AdminDashboard;
