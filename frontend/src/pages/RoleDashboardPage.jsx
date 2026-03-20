import { useEffect, useState } from 'react';
import AppShell from '../components/AppShell';
import MetricGrid from '../components/MetricGrid';
import Panel from '../components/Panel';
import {
  activityRoles,
  certificateUploadRoles,
  eventControlRoles,
  pressNoteRoles,
  roleMeta,
} from '../config/roles';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

function readError(error, fallback) {
  return error?.response?.data?.detail ?? fallback;
}

export default function RoleDashboardPage() {
  const { role, user } = useAuth();
  const [events, setEvents] = useState([]);
  const [participations, setParticipations] = useState([]);
  const [certificates, setCertificates] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [activityStatus, setActivityStatus] = useState([]);
  const [pressNote, setPressNote] = useState('');
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busyAction, setBusyAction] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [eventForm, setEventForm] = useState({
    title: '',
    category: 'Hackathon',
    description: '',
    date: '',
    department: user?.department ?? '',
  });
  const [participationForm, setParticipationForm] = useState({
    event_id: '',
    achievement: 'participation',
    notes: '',
  });
  const [certificateForm, setCertificateForm] = useState({
    participation_id: '',
    file: null,
  });
  const [pressForm, setPressForm] = useState({
    name: user?.name ?? '',
    department: user?.department ?? '',
    event: '',
    achievement: 'Winner',
  });
  const [predictionForm, setPredictionForm] = useState({
    student_name: user?.name ?? '',
    events_participated: '0',
    wins: '0',
    categories: 'Hackathon, Workshop',
  });

  const canManageEvents = eventControlRoles.includes(role);
  const canViewActivity = activityRoles.includes(role);
  const canUploadCertificate = certificateUploadRoles.includes(role);
  const canGeneratePressNote = pressNoteRoles.includes(role);
  const canVerifyCertificates = canManageEvents;

  useEffect(() => {
    const wins = participations.filter((item) => item.achievement === 'winner').length;
    setPredictionForm((current) => ({
      ...current,
      student_name: user?.name ?? '',
      events_participated: String(participations.length),
      wins: String(wins),
    }));
  }, [participations, user]);

  useEffect(() => {
    setPressForm((current) => ({
      ...current,
      name: user?.name ?? '',
      department: user?.department ?? '',
    }));
  }, [user]);

  useEffect(() => {
    loadDashboard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role]);

  const loadDashboard = async () => {
    setLoading(true);
    setError('');

    const requests = [
      api.get('/events'),
      api.get('/participations'),
      api.get('/certificates'),
      api.get('/leaderboard'),
      canViewActivity ? api.get('/activity-status') : Promise.resolve({ data: [] }),
    ];

    const [eventsResult, participationsResult, certificatesResult, leaderboardResult, activityResult] =
      await Promise.allSettled(requests);

    setEvents(eventsResult.status === 'fulfilled' ? eventsResult.value.data : []);
    setParticipations(
      participationsResult.status === 'fulfilled' ? participationsResult.value.data : [],
    );
    setCertificates(
      certificatesResult.status === 'fulfilled' ? certificatesResult.value.data : [],
    );
    setLeaderboard(leaderboardResult.status === 'fulfilled' ? leaderboardResult.value.data : []);
    setActivityStatus(activityResult.status === 'fulfilled' ? activityResult.value.data : []);

    const firstFailure = [
      eventsResult,
      participationsResult,
      certificatesResult,
      leaderboardResult,
      activityResult,
    ].find((result) => result.status === 'rejected');

    if (firstFailure?.status === 'rejected') {
      setError(readError(firstFailure.reason, 'Some dashboard data could not be loaded.'));
    }

    setLoading(false);
  };

  const handleChange = (setter) => (event) => {
    const { name, value, files } = event.target;
    setter((current) => ({
      ...current,
      [name]: files ? files[0] : value,
    }));
  };

  const runAction = async (key, task, successMessage) => {
    setBusyAction(key);
    setError('');
    setMessage('');

    try {
      await task();
      setMessage(successMessage);
      await loadDashboard();
    } catch (requestError) {
      setError(readError(requestError, 'The request could not be completed.'));
    } finally {
      setBusyAction('');
    }
  };

  const handleEventSubmit = async (event) => {
    event.preventDefault();
    await runAction(
      'event',
      () => api.post('/create-event', eventForm),
      'Event created and pushed into the shared calendar.',
    );
    setEventForm({
      title: '',
      category: 'Hackathon',
      description: '',
      date: '',
      department: user?.department ?? '',
    });
  };

  const handleParticipationSubmit = async (event) => {
    event.preventDefault();
    await runAction(
      'participation',
      () => api.post('/submit-participation', participationForm),
      'Participation submitted successfully.',
    );
    setParticipationForm({
      event_id: '',
      achievement: 'participation',
      notes: '',
    });
  };

  const handleCertificateSubmit = async (event) => {
    event.preventDefault();
    const formData = new FormData();
    if (certificateForm.participation_id) {
      formData.append('participation_id', certificateForm.participation_id);
    }
    if (certificateForm.file) {
      formData.append('file', certificateForm.file);
    }

    await runAction(
      'certificate',
      () => api.post('/upload-certificate', formData),
      'Certificate uploaded and queued for verification.',
    );
    setCertificateForm({ participation_id: '', file: null });
  };

  const handleVerifyCertificate = async (certificateId) => {
    await runAction(
      `verify-${certificateId}`,
      () => api.put(`/verify-certificate/${certificateId}`),
      'Certificate verified successfully.',
    );
  };

  const handlePressNoteSubmit = async (event) => {
    event.preventDefault();
    setBusyAction('press-note');
    setError('');
    setMessage('');

    try {
      const { data } = await api.post('/press-note', pressForm);
      setPressNote(data.press_note);
      setMessage('Press note drafted successfully.');
    } catch (requestError) {
      setError(readError(requestError, 'Press note generation failed.'));
    } finally {
      setBusyAction('');
    }
  };

  const handlePredictionSubmit = async (event) => {
    event.preventDefault();
    setBusyAction('prediction');
    setError('');
    setMessage('');

    try {
      const { data } = await api.post('/predict-achievement', {
        student_name: predictionForm.student_name,
        events_participated: Number(predictionForm.events_participated),
        wins: Number(predictionForm.wins),
        categories: predictionForm.categories
          .split(',')
          .map((item) => item.trim())
          .filter(Boolean),
      });
      setPrediction(data);
      setMessage('Prediction module returned a fresh forecast.');
    } catch (requestError) {
      setError(readError(requestError, 'Prediction request failed.'));
    } finally {
      setBusyAction('');
    }
  };

  const totalPoints = participations.reduce((sum, item) => sum + (item.points ?? 0), 0);
  const pendingCertificates = certificates.filter((item) => !item.verified).length;
  const leaderboardRank = leaderboard.findIndex((item) => item.student_email === user?.email) + 1;

  const metrics = [
    {
      label: 'Events',
      value: events.length,
      caption: 'Shared opportunities currently visible in your workspace.',
    },
    {
      label: 'Participations',
      value: participations.length,
      caption: 'Tracked activity records available to this role.',
    },
    {
      label: 'Total Score',
      value: totalPoints,
      caption: 'Points accumulated from the achievement scoring model.',
    },
    {
      label: 'Pending Certificates',
      value: pendingCertificates,
      caption: 'Proof waiting for review or admin verification.',
    },
    {
      label: 'Leaderboard Rank',
      value: leaderboardRank > 0 ? `#${leaderboardRank}` : '--',
      caption: 'Your current placement when visible in the leaderboard list.',
    },
  ];

  if (loading) {
    return (
      <div className="screen-state">
        <div className="screen-state__card">
          <p className="eyebrow">Workspace Sync</p>
          <h2>Loading your CAIP dashboard...</h2>
        </div>
      </div>
    );
  }

  return (
    <AppShell
      title={`${roleMeta[role]?.label ?? 'User'} Dashboard`}
      subtitle={roleMeta[role]?.strapline ?? 'Role-based workspace'}
    >
      <section className="hero-summary">
        <div>
          <p className="eyebrow">Mission Focus</p>
          <h3>Starter workspace for submissions, analytics, and AI-assisted recognition.</h3>
        </div>
        <div className="chip-row">
          {(roleMeta[role]?.highlights ?? []).map((item) => (
            <span key={item} className="chip">
              {item}
            </span>
          ))}
        </div>
      </section>

      {message ? <p className="feedback success">{message}</p> : null}
      {error ? <p className="feedback error">{error}</p> : null}

      <MetricGrid items={metrics} />

      <div className="dashboard-grid">
        <Panel id="operations" eyebrow="Operations" title="Event Calendar">
          {canManageEvents ? (
            <form className="form-grid compact" onSubmit={handleEventSubmit}>
              <label>
                Title
                <input name="title" value={eventForm.title} onChange={handleChange(setEventForm)} required />
              </label>
              <label>
                Category
                <input
                  name="category"
                  value={eventForm.category}
                  onChange={handleChange(setEventForm)}
                  required
                />
              </label>
              <label>
                Date
                <input
                  name="date"
                  type="date"
                  value={eventForm.date}
                  onChange={handleChange(setEventForm)}
                  required
                />
              </label>
              <label>
                Department
                <input
                  name="department"
                  value={eventForm.department}
                  onChange={handleChange(setEventForm)}
                />
              </label>
              <label className="span-2">
                Description
                <textarea
                  name="description"
                  value={eventForm.description}
                  onChange={handleChange(setEventForm)}
                />
              </label>
              <button className="primary-button" type="submit" disabled={busyAction === 'event'}>
                {busyAction === 'event' ? 'Saving...' : 'Create Event'}
              </button>
            </form>
          ) : null}

          <ul className="stack-list">
            {events.map((item) => (
              <li key={item.id}>
                <strong>{item.title}</strong>
                <span>
                  {item.category} | {item.date}
                  {item.department ? ` | ${item.department}` : ''}
                </span>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel eyebrow="Operations" title="Participation Ledger">
          {role === 'student' ? (
            <form className="form-grid compact" onSubmit={handleParticipationSubmit}>
              <label className="span-2">
                Event
                <select
                  name="event_id"
                  value={participationForm.event_id}
                  onChange={handleChange(setParticipationForm)}
                  required
                >
                  <option value="">Select an event</option>
                  {events.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.title}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Achievement
                <select
                  name="achievement"
                  value={participationForm.achievement}
                  onChange={handleChange(setParticipationForm)}
                >
                  <option value="participation">Participation</option>
                  <option value="runner_up">Runner-Up</option>
                  <option value="finalist">Finalist</option>
                  <option value="winner">Winner</option>
                </select>
              </label>
              <label className="span-2">
                Notes
                <textarea
                  name="notes"
                  value={participationForm.notes}
                  onChange={handleChange(setParticipationForm)}
                />
              </label>
              <button
                className="primary-button"
                type="submit"
                disabled={busyAction === 'participation'}
              >
                {busyAction === 'participation' ? 'Submitting...' : 'Submit Participation'}
              </button>
            </form>
          ) : null}

          <ul className="stack-list">
            {participations.map((item) => (
              <li key={item.id}>
                <strong>{item.event_title}</strong>
                <span>
                  {item.achievement} | {item.points} points | {item.student_name}
                </span>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel eyebrow="Operations" title="Certificate Vault">
          {canUploadCertificate ? (
            <form className="form-grid compact" onSubmit={handleCertificateSubmit}>
              <label className="span-2">
                Linked Participation
                <select
                  name="participation_id"
                  value={certificateForm.participation_id}
                  onChange={handleChange(setCertificateForm)}
                >
                  <option value="">Optional participation link</option>
                  {participations.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.event_title}
                    </option>
                  ))}
                </select>
              </label>
              <label className="span-2">
                Certificate File
                <input
                  name="file"
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg"
                  onChange={handleChange(setCertificateForm)}
                  required
                />
              </label>
              <button
                className="primary-button"
                type="submit"
                disabled={busyAction === 'certificate'}
              >
                {busyAction === 'certificate' ? 'Uploading...' : 'Upload Certificate'}
              </button>
            </form>
          ) : null}

          <ul className="stack-list">
            {certificates.map((item) => (
              <li key={item.id}>
                <div>
                  <strong>{item.student_name}</strong>
                  <span>
                    {item.verification_status} | confidence {item.confidence ?? '--'}
                  </span>
                </div>
                {canVerifyCertificates && !item.verified ? (
                  <button
                    className="ghost-button small"
                    type="button"
                    onClick={() => handleVerifyCertificate(item.id)}
                  >
                    Verify
                  </button>
                ) : null}
              </li>
            ))}
          </ul>
        </Panel>

        <Panel id="analytics" eyebrow="Analytics" title="Leaderboard Snapshot">
          <ol className="rank-list">
            {leaderboard.map((item) => (
              <li key={item.student_email}>
                <strong>{item.student_name}</strong>
                <span>
                  {item.total_points} pts | {item.activity_level}
                </span>
              </li>
            ))}
          </ol>
        </Panel>

        {canViewActivity ? (
          <Panel eyebrow="Analytics" title="Activity Status">
            <ul className="stack-list">
              {activityStatus.map((item) => (
                <li key={item.student_email}>
                  <strong>{item.student_name}</strong>
                  <span>
                    {item.activity_level} | {item.participations} tracked events
                  </span>
                </li>
              ))}
            </ul>
          </Panel>
        ) : null}

        {canGeneratePressNote ? (
          <Panel id="ai-lab" eyebrow="AI Lab" title="Press Note Generator">
            <form className="form-grid compact" onSubmit={handlePressNoteSubmit}>
              <label>
                Student Name
                <input name="name" value={pressForm.name} onChange={handleChange(setPressForm)} required />
              </label>
              <label>
                Department
                <input
                  name="department"
                  value={pressForm.department}
                  onChange={handleChange(setPressForm)}
                  required
                />
              </label>
              <label>
                Event
                <input name="event" value={pressForm.event} onChange={handleChange(setPressForm)} required />
              </label>
              <label>
                Achievement
                <input
                  name="achievement"
                  value={pressForm.achievement}
                  onChange={handleChange(setPressForm)}
                  required
                />
              </label>
              <button
                className="primary-button"
                type="submit"
                disabled={busyAction === 'press-note'}
              >
                {busyAction === 'press-note' ? 'Generating...' : 'Generate Press Note'}
              </button>
            </form>
            {pressNote ? <p className="result-block">{pressNote}</p> : null}
          </Panel>
        ) : null}

        <Panel eyebrow="AI Lab" title="Achievement Predictor">
          <form className="form-grid compact" onSubmit={handlePredictionSubmit}>
            <label>
              Student Name
              <input
                name="student_name"
                value={predictionForm.student_name}
                onChange={handleChange(setPredictionForm)}
              />
            </label>
            <label>
              Events Participated
              <input
                name="events_participated"
                type="number"
                min="0"
                value={predictionForm.events_participated}
                onChange={handleChange(setPredictionForm)}
              />
            </label>
            <label>
              Wins
              <input
                name="wins"
                type="number"
                min="0"
                value={predictionForm.wins}
                onChange={handleChange(setPredictionForm)}
              />
            </label>
            <label className="span-2">
              Categories
              <input
                name="categories"
                value={predictionForm.categories}
                onChange={handleChange(setPredictionForm)}
              />
            </label>
            <button
              className="primary-button"
              type="submit"
              disabled={busyAction === 'prediction'}
            >
              {busyAction === 'prediction' ? 'Forecasting...' : 'Run Prediction'}
            </button>
          </form>

          {prediction ? (
            <div className="result-block">
              <strong>{Math.round(prediction.win_probability * 100)}% win probability</strong>
              <p>{prediction.activity_level}</p>
              <p>{prediction.summary}</p>
            </div>
          ) : null}
        </Panel>
      </div>
    </AppShell>
  );
}
