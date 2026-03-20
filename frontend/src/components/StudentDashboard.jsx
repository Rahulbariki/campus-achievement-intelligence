import { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE = '/api';

function StudentDashboard({ token }) {
  const [eventName, setEventName] = useState('');
  const [achievement, setAchievement] = useState('participant');
  const [file, setFile] = useState(null);
  const [eventPhoto, setEventPhoto] = useState(null);
  const [message, setMessage] = useState('');
  const [myCertificates, setMyCertificates] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [activityRank, setActivityRank] = useState(null);
  const [loading, setLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);

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
    if (eventPhoto) formData.append('event_photo', eventPhoto);

    try {
      await axios.post(`${API_BASE}/upload-certificate`, formData, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' },
      });
      setMessage('Achievement recorded! Dignitary photo and certificate submitted.');
      setEventName('');
      setFile(null);
      setEventPhoto(null);
      fetchData();
    } catch (err) {
      setMessage(err.response?.data?.detail || 'Upload failed');
    } finally {
      setLoading(false);
    }
  };

  const exportPortfolio = async () => {
    setExportLoading(true);
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const response = await axios.get(`${API_BASE}/export-portfolio-pdf`, { headers, responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Portfolio_${localStorage.getItem('userName')?.replace(/\s/g, '_') || 'Student'}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      alert('Portfolio export failed: ' + err.message);
    } finally {
      setExportLoading(false);
    }
  };

  return (
    <div className="dashboard-content">
      <div className="section-header">
        <p className="eyebrow">Student Performance Record</p>
        <h2>My Dashboard</h2>
        <p className="font-serif">Track your achievements, verify credentials, and build your professional academic portfolio.</p>
      </div>

      <div className="grid-container">
        {activityRank && (
          <section className="stats-row">
            <div className="metric-card">
              <p className="eyebrow">Credit Points</p>
              <strong>{activityRank.total_points}</strong>
              <p className="font-sans small">Accumulated score from all verified events.</p>
            </div>
            <div className="metric-card">
              <p className="eyebrow">Participations</p>
              <strong>{activityRank.participations}</strong>
              <p className="font-sans small">Total events attended and recorded.</p>
            </div>
            <div className="metric-card">
              <p className="eyebrow">Certifications</p>
              <strong>{activityRank.wins}</strong>
              <p className="font-sans small">Verified merit recognitions.</p>
            </div>
          </section>
        )}

        <div className="two-col-grid">
          <section className="panel">
            <p className="eyebrow">Capture Achievement</p>
            <h3>New Submission</h3>
            <form onSubmit={handleUpload} className="form-group-stack">
              <div className="form-group">
                <label>Event Name</label>
                <input placeholder="e.g., Smart India Hackathon" value={eventName} onChange={(e) => setEventName(e.target.value)} required />
              </div>
              <div className="form-group">
                <label>Level</label>
                <select value={achievement} onChange={(e) => setAchievement(e.target.value)}>
                  <option value="participant">Participant</option>
                  <option value="finalist">Finalist</option>
                  <option value="runner_up">Runner Up</option>
                  <option value="winner">Winner</option>
                </select>
              </div>
              <div className="form-group">
                <label>Certificate Proof (PDF/Image)</label>
                <input type="file" onChange={(e) => setFile(e.target.files[0])} accept="application/pdf,image/*" required />
              </div>
              <div className="form-group">
                <label>Event Photo (Optional)</label>
                <input type="file" onChange={(e) => setEventPhoto(e.target.files[0])} accept="image/*" />
              </div>
              <button className="primary-button" type="submit" disabled={loading} style={{ width: '100%' }}>
                {loading ? 'Processing...' : 'Submit Entry'}
              </button>
            </form>
            {message && <p className="status-msg">{message}</p>}
          </section>

          <section className="panel">
            <p className="eyebrow">Communication</p>
            <h3>Recent Notifications</h3>
            <div className="notification-list">
              {notifications.length === 0 ? (
                <p className="font-serif italic">No new messages.</p>
              ) : (
                notifications.slice(0, 5).map((note) => (
                  <div key={note.notification_id} className="note-item">
                    <p>{note.message}</p>
                    <small className="font-mono">{new Date(note.created_at).toLocaleDateString()}</small>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>

        <section className="panel" style={{ marginTop: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h3>Verified Academic Portfolio</h3>
            <button className="primary-button" onClick={exportPortfolio} disabled={exportLoading || myCertificates.length === 0}>
              {exportLoading ? 'Processing...' : 'Download PDF Portfolio'}
            </button>
          </div>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Event</th>
                  <th>Award</th>
                  <th>Status</th>
                  <th>Feedback</th>
                  <th>Resource</th>
                </tr>
              </thead>
              <tbody>
                {myCertificates.length === 0 ? (
                  <tr><td colSpan="5" style={{ textAlign: 'center', padding: '2rem' }}>No records found.</td></tr>
                ) : (
                  myCertificates.map((cert) => (
                    <tr key={cert.file_name}>
                      <td>{cert.event_name}</td>
                      <td><span className={`badge ${cert.achievement}`}>{cert.achievement}</span></td>
                      <td>
                        <span style={{ 
                          color: cert.verified ? 'var(--success)' : cert.rejection_reason ? 'var(--accent)' : 'var(--muted)' 
                        }}>
                          {cert.verified ? 'Verified' : cert.rejection_reason ? 'Rejected' : 'Pending'}
                        </span>
                      </td>
                      <td>
                        {cert.verification_comment || cert.rejection_reason || 'Under review...'}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <a href={cert.cloudinary_url || `/certificate-files/${cert.file_name}`} 
                             target="_blank" rel="noreferrer" className="ghost-button">
                            View
                          </a>
                        </div>
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
