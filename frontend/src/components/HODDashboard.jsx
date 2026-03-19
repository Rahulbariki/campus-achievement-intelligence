import { useEffect, useState } from 'react';
import axios from 'axios';

const API_BASE = '/api';

function HODDashboard({ token }) {
  const [leaderboard, setLeaderboard] = useState([]);
  const [activityStatus, setActivityStatus] = useState(null);
  const [predictionMail, setPredictionMail] = useState('');
  const [predictionResult, setPredictionResult] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, [token]);

  const fetchData = async () => {
    const headers = { Authorization: `Bearer ${token}` };
    try {
      const lbRes = await axios.get(`${API_BASE}/activity-ranking`, { headers });
      setLeaderboard(lbRes.data);
      
      const statusRes = await axios.get(`${API_BASE}/activity-status`, { headers });
      setActivityStatus(statusRes.data);
    } catch (err) {
      console.error('Fetch data failed:', err);
    }
  };

  const predictSuccess = async () => {
    if (!predictionMail) return;
    setLoading(true);
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const { data } = await axios.get(`${API_BASE}/predict-success/${predictionMail}`, { headers });
      setPredictionResult(data);
    } catch (err) {
      alert('Prediction failed: ' + (err.response?.data?.detail || err.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard-content">
      <div className="section-header">
        <div className="metadata">DEPARTMENTAL ANALYTICS | REPORT ID: {new Date().getFullYear()}.ARCH</div>
        <h2>ACADEMIC LEADERSHIP PORTAL</h2>
        <p className="font-serif italic">Analyzing student engagement trends, achievement distributions, and predictive success metrics across the department.</p>
      </div>

      <div className="grid-container">
        {activityStatus && (
          <section className="stats-row">
            <div className="stat-card hard-shadow-hover">
              <div className="metadata" style={{ color: '#15803D' }}>● HIGHLY ENGAGED</div>
              <h4>ACTIVE COHORT</h4>
              <p className="large-val">{activityStatus.counts.highly_active}</p>
            </div>
            <div className="stat-card hard-shadow-hover">
              <div className="metadata">○ STEADY PARTICIPATION</div>
              <h4>MODERATE COHORT</h4>
              <p className="large-val">{activityStatus.counts.moderate}</p>
            </div>
            <div className="stat-card hard-shadow-hover">
              <div className="metadata" style={{ color: 'var(--editorial-red)' }}>× LOW ENGAGEMENT</div>
              <h4>INACTIVE COHORT</h4>
              <p className="large-val">{activityStatus.counts.inactive}</p>
            </div>
          </section>
        )}

        <section className="card-section newsprint-texture">
          <div className="metadata" style={{ marginBottom: '0.5rem' }}>NEURAL ENGINE v4.2</div>
          <h3>AI STUDENT SUCCESS PREDICTOR</h3>
          <div className="form-group-stack" style={{ maxWidth: '600px' }}>
            <div className="form-group">
              <label>STUDENT IDENTIFIER (EMAIL)</label>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <input 
                  placeholder="e.g., student.name@university.edu" 
                  value={predictionMail} 
                  onChange={(e) => setPredictionMail(e.target.value)} 
                />
                <button className="primary-btn" onClick={predictSuccess} disabled={loading} style={{ whiteSpace: 'nowrap' }}>
                  {loading ? 'ANALYZING...' : 'INITIATE PREDICTION'}
                </button>
              </div>
            </div>
          </div>

          {predictionResult && (
            <div className="status-msg" style={{ marginTop: '2.5rem', border: '1px solid var(--ink-black)', padding: '2rem', background: 'white' }}>
              <div className="metadata" style={{ color: 'var(--editorial-red)', marginBottom: '1rem' }}>PREDICTION RESULT: {predictionResult.potential_category}</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                <div>
                  <label className="metadata">ENGAGEMENT PROBABILITY</label>
                  <div style={{ height: '4px', background: '#eee', margin: '0.5rem 0' }}>
                    <div style={{ height: '100%', background: 'var(--ink-black)', width: `${predictionResult.participation_probability}%` }}></div>
                  </div>
                  <div className="font-mono" style={{ textAlign: 'right', fontSize: '1.25rem', fontWeight: 900 }}>{predictionResult.participation_probability}%</div>
                </div>
                <div>
                  <label className="metadata">WINS PROBABILITY</label>
                  <div style={{ height: '4px', background: '#eee', margin: '0.5rem 0' }}>
                    <div style={{ height: '100%', background: 'var(--editorial-red)', width: `${predictionResult.winning_probability}%` }}></div>
                  </div>
                  <div className="font-mono" style={{ textAlign: 'right', fontSize: '1.25rem', fontWeight: 900 }}>{predictionResult.winning_probability}%</div>
                </div>
              </div>
              <div style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px dashed #ccc' }}>
                <div className="metadata">EDITORIAL INSIGHT</div>
                <p className="font-serif italic" style={{ fontSize: '1.1rem', marginTop: '0.5rem' }}>"{predictionResult.insights}"</p>
              </div>
            </div>
          )}
        </section>

        <section className="table-full-section">
          <div className="metadata" style={{ marginBottom: '0.5rem' }}>RANKING | SESSION 2026</div>
          <h3>DEPARTMENT LEADERBOARD</h3>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>RANK</th>
                  <th>STUDENT IDENTIFIER</th>
                  <th>PARTICIPATIONS</th>
                  <th>VICTORIES</th>
                  <th>TOTAL MERIT POINTS</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.map((item, idx) => (
                  <tr key={item.student_email}>
                    <td><span className="font-mono" style={{ fontWeight: 900, fontSize: '1.25rem' }}>#{idx + 1}</span></td>
                    <td className="font-mono">{item.student_email}</td>
                    <td>{item.participations}</td>
                    <td>{item.wins}</td>
                    <td><strong className="large-val" style={{ fontSize: '1.5rem' }}>{item.total_points}</strong></td>
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

export default HODDashboard;
