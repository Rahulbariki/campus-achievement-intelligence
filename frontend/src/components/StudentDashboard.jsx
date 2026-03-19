import { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE = '/api';

function StudentDashboard({ token }) {
  const [eventName, setEventName] = useState('');
  const [achievement, setAchievement] = useState('participant');
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState('');
  const [myCertificates, setMyCertificates] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [activityRank, setActivityRank] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, [token]);

  const fetchData = async () => {
    const headers = { Authorization: `Bearer ${token}` };
    try {
      const certRes = await axios.get(`${API_BASE}/my-certificates`, { headers });
      setMyCertificates(certRes.data);
      
      const noteRes = await axios.get(`${API_BASE}/notifications`, { headers });
      setNotifications(noteRes.data);
      
      const scoreRes = await axios.get(`${API_BASE}/activity-score`, { headers });
      setActivityRank(scoreRes.data);
    } catch (err) {
      console.error('Fetch error:', err);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return;
    setLoading(true);

    const formData = new FormData();
    formData.append('student_email', localStorage.getItem('userEmail') || '');
    formData.append('event_name', eventName);
    formData.append('achievement', achievement);
    formData.append('file', file);

    try {
      await axios.post(`${API_BASE}/upload-certificate`, formData, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' },
      });
      setMessage('Certificate uploaded and pending verification!');
      fetchData();
    } catch (err) {
      setMessage(err.response?.data?.detail || 'Upload failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard-content">
      <div className="section-header">
        <div className="metadata">STUDENT REPORT | VOL. 2026.03</div>
        <h2>THE STUDENT PORTAL</h2>
        <p className="font-serif drop-cap">Comprehensive record of achievements, verified credentials, and academic portfolio growth in a newsprint-inspired intelligence landscape.</p>
      </div>

      <div className="grid-container">
        {activityRank && (
          <section className="stats-row">
            <div className="stat-card hard-shadow-hover">
              <h4>CREDIT POINTS</h4>
              <p className="large-val" style={{ color: 'var(--editorial-red)' }}>{activityRank.total_points}</p>
              <div className="metadata" style={{ marginTop: '0.5rem', fontSize: '0.6rem' }}>Accumulated Score</div>
            </div>
            <div className="stat-card hard-shadow-hover">
              <h4>ENGAGEMENT INDEX</h4>
              <p className="large-val">{activityRank.participations}</p>
              <div className="metadata" style={{ marginTop: '0.5rem', fontSize: '0.6rem' }}>Total Event Participation</div>
            </div>
            <div className="stat-card hard-shadow-hover">
              <h4>MERIT RECOGNITIONS</h4>
              <p className="large-val">{activityRank.wins}</p>
              <div className="metadata" style={{ marginTop: '0.5rem', fontSize: '0.6rem' }}>Verified Victory Instances</div>
            </div>
          </section>
        )}

        <div className="two-col-grid">
          <section className="card-section">
            <div className="metadata" style={{ marginBottom: '0.5rem' }}>ENTRY FORM</div>
            <h3>REGISTER ACHIEVEMENT</h3>
            <form onSubmit={handleUpload} className="form-group-stack">
              <div className="form-group">
                <label>NOMENCLATURE OF EVENT</label>
                <input placeholder="e.g., NATIONAL SMART INDIA HACKATHON" value={eventName} onChange={(e) => setEventName(e.target.value)} required />
              </div>
              <div className="form-group">
                <label>LEVEL OF ATTAINMENT</label>
                <select value={achievement} onChange={(e) => setAchievement(e.target.value)}>
                  <option value="participant">Participant</option>
                  <option value="finalist">Finalist</option>
                  <option value="runner_up">Runner Up</option>
                  <option value="winner">Winner</option>
                </select>
              </div>
              <div className="form-group">
                <label>VERIFIABLE PROOF (PDF/IMAGE)</label>
                <input type="file" onChange={(e) => setFile(e.target.files[0])} accept="application/pdf,image/*" required 
                       style={{ border: '1px dashed var(--ink-black)', padding: '1rem' }} />
              </div>
              <button className="primary-btn h-12" type="submit" disabled={loading} style={{ width: '100%' }}>
                {loading ? 'PROCESSING...' : 'SUBMIT FOR VERIFICATION'}
              </button>
            </form>
            {message && <p className="status-msg">{message}</p>}
          </section>

          <section className="card-section">
            <div className="metadata" style={{ marginBottom: '0.5rem' }}>BULLETIN BOARD</div>
            <h3>LATEST DISPATCHES</h3>
            <div className="notification-list">
              {notifications.length === 0 ? <p className="font-serif italic" style={{ padding: '1rem 0' }}>No correspondence at this time.</p> : 
                notifications.slice(0, 5).map((note) => (
                <div key={note.notification_id} className="note-item">
                  <p className="font-serif">{note.message}</p>
                  <small className="font-mono">{new Date(note.created_at).toLocaleDateString()}</small>
                </div>
              ))}
            </div>
          </section>
        </div>

        <section className="table-full-section newsprint-texture">
          <div className="metadata" style={{ marginBottom: '0.5rem' }}>LEDGER RECORD</div>
          <h3>VERIFIED ACADEMIC PORTFOLIO</h3>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>EVENT CLASSIFICATION</th>
                  <th>ACHIEVEMENT</th>
                  <th>STATUS</th>
                  <th>EDITORIAL FEEDBACK</th>
                  <th>ACTION</th>
                </tr>
              </thead>
              <tbody>
                {myCertificates.length === 0 ? (
                  <tr><td colSpan="5" style={{ textAlign: 'center' }}>No verified records found in the archive.</td></tr>
                ) : (
                  myCertificates.map((cert) => (
                    <tr key={cert.file_name}>
                      <td><strong style={{ fontFamily: 'Playfair Display' }}>{cert.event_name.toUpperCase()}</strong></td>
                      <td><span className={`badge ${cert.achievement}`}>{cert.achievement}</span></td>
                      <td>
                        <span className="metadata" style={{ 
                          color: cert.verified ? '#15803D' : cert.rejection_reason ? 'var(--editorial-red)' : '#737373' 
                        }}>
                          {cert.verified ? '✓ VERIFIED' : cert.rejection_reason ? '× REJECTED' : '○ PENDING'}
                        </span>
                      </td>
                      <td className="font-serif" style={{ fontSize: '0.9rem', color: '#525252' }}>
                        {cert.verification_comment || cert.rejection_reason || 'Examination in progress...'}
                      </td>
                      <td>
                        <a href={cert.cloudinary_url || `/certificate-files/${cert.file_name}`} 
                           target="_blank" rel="noreferrer" className="view-link">
                          Examine Proof
                        </a>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}

export default StudentDashboard;
