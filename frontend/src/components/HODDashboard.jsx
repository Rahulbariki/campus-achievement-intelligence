import { useEffect, useState } from 'react';
import axios from 'axios';

const API_BASE = '/api';

function HODDashboard({ token }) {
  const [leaderboard, setLeaderboard] = useState([]);
  const [activityStatus, setActivityStatus] = useState(null);
  const [predictionMail, setPredictionMail] = useState('');
  const [predictionResult, setPredictionResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [filterDays, setFilterDays] = useState(null); // null = All Time
  const [briefing, setBriefing] = useState(null);
  const [briefingLoading, setBriefingLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, [token, filterDays]);

  const fetchData = async () => {
    const headers = { Authorization: `Bearer ${token}` };
    const params = filterDays ? { days: filterDays } : {};
    try {
      const lbRes = await axios.get(`${API_BASE}/activity-ranking`, { headers, params });
      setLeaderboard(lbRes.data);
      
      const statusRes = await axios.get(`${API_BASE}/activity-status`, { headers, params });
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

  const generateBriefing = async () => {
    setBriefingLoading(true);
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const days = filterDays || 30; // Default to 30 if "All Time"
      const { data } = await axios.get(`${API_BASE}/admin/department-briefing?days=${days}`, { headers });
      setBriefing(data);
    } catch (err) {
      alert('Briefing generation failed: ' + (err.response?.data?.detail || err.message));
    } finally {
      setBriefingLoading(false);
    }
  };

  const downloadPDF = () => {
    const days = filterDays || 30;
    const url = `${API_BASE}/admin/export-briefing-pdf?days=${days}`;
    const headers = { Authorization: `Bearer ${token}` };
    
    axios.get(url, { headers, responseType: 'blob' })
      .then((response) => {
        const blobUrl = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = blobUrl;
        link.setAttribute('download', `HOD_Briefing_${days}days.pdf`);
        document.body.appendChild(link);
        link.click();
        link.remove();
      })
      .catch((err) => alert('PDF Download failed: ' + err.message));
  };

  return (
    <div className="dashboard-content">
      <div className="section-header">
        <p className="eyebrow">Departmental Analytics</p>
        <h2>Academic Overview</h2>
        <p className="font-serif">Analyze student engagement, track achievements, and generate AI-driven performance reports.</p>
      </div>

      <div className="filter-container panel" style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
        <span className="metadata">Timeline:</span>
        {[
          { label: 'All Time', val: null },
          { label: '1 Week', val: 7 },
          { label: '1 Month', val: 30 },
          { label: '6 Months', val: 180 },
          { label: '1 Year', val: 365 },
        ].map((f) => (
          <button 
            key={f.label}
            className={`small-btn ${filterDays === f.val ? 'primary-button' : 'ghost-button'}`}
            onClick={() => setFilterDays(f.val)}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="grid-container">
        {activityStatus && (
          <section className="stats-row">
            <div className="metric-card">
              <p className="eyebrow" style={{ color: 'var(--success)' }}>High Engagement</p>
              <strong>{activityStatus.counts.highly_active}</strong>
              <p className="small">Students with consistent activity.</p>
            </div>
            <div className="metric-card">
              <p className="eyebrow">Moderate</p>
              <strong>{activityStatus.counts.moderate}</strong>
              <p className="small">Students with steady participation.</p>
            </div>
            <div className="metric-card">
              <p className="eyebrow" style={{ color: 'var(--accent)' }}>Low Engagement</p>
              <strong>{activityStatus.counts.inactive}</strong>
              <p className="small">Students requiring attention.</p>
            </div>
          </section>
        )}

        <section className="panel">
          <p className="eyebrow">Predictive Analytics</p>
          <h3>Success Predictor</h3>
          <div className="form-group-stack">
            <div className="form-group">
              <label>Enter Student Email</label>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <input 
                  placeholder="student@university.edu" 
                  value={predictionMail} 
                  onChange={(e) => setPredictionMail(e.target.value)} 
                />
                <button className="primary-button" onClick={predictSuccess} disabled={loading}>
                  {loading ? 'Analyzing...' : 'Run Prediction'}
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

        <section className="panel" style={{ gridColumn: 'span 2' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <div>
              <p className="eyebrow">Executive Summary</p>
              <h3>Performance Briefing</h3>
            </div>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button className="primary-button" onClick={generateBriefing} disabled={briefingLoading}>
                {briefingLoading ? 'Generating...' : 'Update Briefing'}
              </button>
              {briefing && (
                <button className="ghost-button" onClick={downloadPDF}>
                  Download PDF
                </button>
              )}
            </div>
          </div>

          {briefing ? (
            <div className="panel" style={{ background: 'var(--paper-strong)', whiteSpace: 'pre-wrap', fontFamily: 'monospace', fontSize: '0.85rem' }}>
               {briefing.briefing}
            </div>
          ) : (
            <p className="font-serif italic" style={{ textAlign: 'center', padding: '2rem' }}>
              Select a timeline and update the briefing to generate an AI-powered summary.
            </p>
          )}
        </section>

        <section className="panel" style={{ gridColumn: 'span 2' }}>
          <p className="eyebrow">Ranking</p>
          <h3>Department Leaderboard</h3>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Student Email</th>
                  <th>Events</th>
                  <th>Wins</th>
                  <th>Points</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.map((item, idx) => (
                  <tr key={item.student_email}>
                    <td><strong>#{idx + 1}</strong></td>
                    <td className="font-mono">{item.student_email}</td>
                    <td>{item.participations}</td>
                    <td>{item.wins}</td>
                    <td><strong style={{ fontSize: '1.2rem', color: 'var(--accent)' }}>{item.total_points}</strong></td>
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
