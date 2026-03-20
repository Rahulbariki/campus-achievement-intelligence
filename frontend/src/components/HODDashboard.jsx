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
        <div className="metadata">DEPARTMENTAL ANALYTICS | REPORT ID: {new Date().getFullYear()}.ARCH</div>
        <h2>ACADEMIC LEADERSHIP PORTAL</h2>
        <p className="font-serif italic">Analyzing student engagement trends, achievement distributions, and predictive success metrics across the department.</p>
      </div>

      <div className="filter-container newsprint-texture" style={{ marginBottom: '2rem', padding: '1.5rem', border: '1px solid var(--ink-black)', display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
        <span className="metadata" style={{ marginRight: '1rem' }}>Timeline Filter:</span>
        {[
          { label: 'All Time', val: null },
          { label: '1 Week', val: 7 },
          { label: '1 Month', val: 30 },
          { label: '6 Months', val: 180 },
          { label: '1 Year', val: 365 },
        ].map((f) => (
          <button 
            key={f.label}
            className={`small-btn ${filterDays === f.val ? 'primary-btn' : ''}`}
            onClick={() => setFilterDays(f.val)}
            style={{ padding: '0.4rem 1rem', fontSize: '0.7rem' }}
          >
            {f.label}
          </button>
        ))}
        <div className="metadata" style={{ marginLeft: 'auto', color: 'var(--editorial-red)' }}>
          Showing: {filterDays ? `Last ${filterDays} Days` : 'All Historical Data'}
        </div>
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

        <section className="card-section newsprint-texture" style={{ gridColumn: 'span 2' }}>
          <div className="metadata" style={{ marginBottom: '0.5rem' }}>HOD BRIEFING | {filterDays ? `LAST ${filterDays} DAYS` : 'MONTHLY OVERVIEW'}</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h3>MONTHLY ACHIEVEMENT PRESENTATION</h3>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button className="primary-btn" onClick={generateBriefing} disabled={briefingLoading}>
                {briefingLoading ? 'GENERATING...' : 'GENERATE SUMMARY'}
              </button>
              {briefing && (
                <button className="small-btn" onClick={downloadPDF} style={{ background: 'var(--ink-black)', color: 'white' }}>
                  DOWNLOAD PDF report
                </button>
              )}
            </div>
          </div>

          {briefing ? (
            <div className="status-msg" style={{ background: 'white', whiteSpace: 'pre-wrap', fontFamily: 'JetBrains Mono', fontSize: '0.9rem', border: '2px solid var(--ink-black)', padding: '2.5rem' }}>
               {briefing.briefing}
            </div>
          ) : (
            <div style={{ padding: '3rem', border: '1px dashed #ccc', textAlign: 'center', fontStyle: 'italic' }}>
              Select a timeline and click generate to create an AI-powered summary for your monthly presentation.
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
