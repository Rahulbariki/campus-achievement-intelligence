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
        <div className="metadata">ADMINISTRATIVE OVERRIDE | SYSTEM v1.0.42</div>
        <h2>EDITORIAL OPERATIONS CONTROL</h2>
        <p className="font-serif italic">Managing institutional recognition pipelines, intellectual property verification, and automated press correspondence.</p>
      </div>

      <div className="grid-container">
        <section className="card-section newsprint-texture">
          <div className="metadata" style={{ marginBottom: '0.5rem' }}>CORRESPONDENCE ENGINE</div>
          <h3>GENERATE OFFICIAL PRESS NOTE</h3>
          <div className="form-group-stack">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              <div className="form-group">
                <label>STUDENT EMAIL IDENTIFIER</label>
                <input 
                  placeholder="e.g., student@campus.edu" 
                  value={pressNoteConfig.studentEmail} 
                  onChange={(e) => setPressNoteConfig({...pressNoteConfig, studentEmail: e.target.value})} 
                />
              </div>
              <div className="form-group">
                <label>EVENT NOMENCLATURE</label>
                <input 
                  placeholder="e.g., NATIONAL SYMPOSIUM" 
                  value={pressNoteConfig.eventName} 
                  onChange={(e) => setPressNoteConfig({...pressNoteConfig, eventName: e.target.value})} 
                />
              </div>
            </div>
            <button className="primary-btn h-12" onClick={generatePressNote} disabled={loading || !pressNoteConfig.studentEmail}>
              {loading ? 'DRAFTING CORRESPONDENCE...' : 'GENERATE OFFICIAL PRESS NOTE'}
            </button>
          </div>

          {pressNoteResult && (
            <div style={{ marginTop: '2.5rem', display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '3rem', borderTop: '4px solid var(--ink-black)', paddingTop: '2.5rem' }}>
              <div>
                <div className="metadata" style={{ color: 'var(--editorial-red)', marginBottom: '1rem' }}>OFFICIAL PRESS RELEASE</div>
                <div className="status-msg" style={{ background: 'white', padding: '2.5rem', border: '1px solid var(--ink-black)' }}>
                  <h4 className="font-serif" style={{ fontSize: '1.75rem', marginBottom: '1.5rem', borderBottom: '1px solid #eee' }}>"{pressNoteConfig.eventName.toUpperCase()}"</h4>
                  <p className="font-serif italic" style={{ fontSize: '1.1rem', whiteSpace: 'pre-wrap', lineHeight: '1.8' }}>
                    {pressNoteResult.press_note}
                  </p>
                </div>
              </div>
              <div>
                <div className="metadata" style={{ marginBottom: '1rem' }}>SOCIAL MEDIA DISPATCH</div>
                <div className="status-msg" style={{ background: '#f5f5f5', border: '1px dashed var(--ink-black)' }}>
                  <p className="font-mono" style={{ fontSize: '0.85rem', whiteSpace: 'pre-wrap' }}>
                    {pressNoteResult.social_media_post}
                  </p>
                </div>
              </div>
            </div>
          )}
        </section>

        <section className="table-full-section">
          <div className="metadata" style={{ marginBottom: '0.5rem' }}>VERIFICATION PIPELINE</div>
          <h3>CERTIFICATION LEDGER REVIEW</h3>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>STUDENT IDENTIFIER</th>
                  <th>EVENT CLASSIFICATION</th>
                  <th>ACHIEVEMENT</th>
                  <th>EDITORIAL STATUS</th>
                  <th>NEURAL CONFIDENCE</th>
                  <th>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {certificates.map((cert) => (
                  <tr key={cert.file_name}>
                    <td className="font-mono">{cert.student_email}</td>
                    <td className="font-serif" style={{ fontWeight: 700 }}>{cert.event_name.toUpperCase()}</td>
                    <td><span className={`badge ${cert.achievement}`}>{cert.achievement}</span></td>
                    <td>
                      <span className="metadata" style={{ 
                        color: cert.verified ? '#15803D' : cert.rejection_reason ? 'var(--editorial-red)' : '#737373',
                        fontWeight: 900
                      }}>
                        {cert.verified ? '✓ VERIFIED' : cert.rejection_reason ? '× REJECTED' : '○ PENDING'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      {cert.ocr_confidence ? (
                        <div className="font-mono" style={{ fontWeight: 900, color: cert.auto_verified ? '#15803D' : 'var(--ink-black)' }}>
                          {Math.round(cert.ocr_confidence * 100)}% {cert.auto_verified ? '✓' : '?'}
                        </div>
                      ) : (
                        <button className="small-btn" onClick={() => runOCR(cert)} disabled={loading} style={{ padding: '0.5rem', fontSize: '0.65rem' }}>RUN AI ANALYSIS</button>
                      )}
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <a href={cert.cloudinary_url || `/certificate-files/${cert.file_name}`} 
                           target="_blank" rel="noreferrer" className="view-link" style={{ textAlign: 'center' }}>
                          Examine
                        </a>
                        {!cert.verified && (
                          <div style={{ display: 'flex', gap: '0.25rem' }}>
                            <button className="small-btn btn-success" style={{ flex: 1 }} onClick={() => verify(cert.file_name)}>PASS</button>
                            <button className="small-btn btn-danger" style={{ flex: 1 }} onClick={() => reject(cert.file_name)}>FAIL</button>
                          </div>
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
