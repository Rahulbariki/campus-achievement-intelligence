import { useEffect, useMemo, useState } from 'react';
import ActivityDistributionChart from '../components/ActivityDistributionChart';
import AnalyticsBarChart from '../components/AnalyticsBarChart';
import AppShell from '../components/AppShell';
import MetricGrid from '../components/MetricGrid';
import NewsTicker from '../components/NewsTicker';
import Panel from '../components/Panel';
import SuperAdminDashboard from '../components/SuperAdminDashboard';
import {
  activityRoles,
  certificateUploadRoles,
  eventControlRoles,
  pressNoteRoles,
  roleMeta,
} from '../config/roles';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const categoryOptions = ['Hackathon', 'Workshop', 'Seminar', 'Competition', 'Conference'];
const achievementOptions = [
  { value: 'participation', label: 'Participation' },
  { value: 'runner_up', label: 'Runner-Up' },
  { value: 'finalist', label: 'Finalist' },
  { value: 'winner', label: 'Winner' },
];

function readError(error, fallback) {
  return error?.response?.data?.detail ?? fallback;
}

function getEventLabel(event) {
  return event?.event_name ?? event?.title ?? 'Untitled Event';
}

function getParticipationLabel(participation) {
  return participation?.event_name ?? participation?.event_title ?? 'Untitled Participation';
}

function humanizeAchievement(value) {
  return String(value ?? '')
    .replaceAll('_', ' ')
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function formatDate(value) {
  if (!value) {
    return 'Awaiting date';
  }

  try {
    return new Intl.DateTimeFormat('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(new Date(value));
  } catch {
    return value;
  }
}

export default function RoleDashboardPage() {
  const { role, user } = useAuth();
  const [events, setEvents] = useState([]);
  const [participations, setParticipations] = useState([]);
  const [certificates, setCertificates] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [activityStatus, setActivityStatus] = useState([]);
  const [pressNoteResult, setPressNoteResult] = useState(null);
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busyAction, setBusyAction] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [eventForm, setEventForm] = useState({
    event_name: '',
    organizer: user?.name ?? '',
    category: 'Hackathon',
    description: '',
    date: '',
  });
  const [participationForm, setParticipationForm] = useState({
    event_id: '',
    achievement: 'participation',
    notes: '',
  });
  const [certificateForm, setCertificateForm] = useState({
    participation_id: '',
    student_email: user?.email ?? '',
    event_name: '',
    achievement: 'participation',
    file: null,
  });
  const [pressForm, setPressForm] = useState({
    student_name: user?.name ?? '',
    department: user?.department ?? '',
    event_name: '',
    achievement: 'winner',
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
    setEventForm((current) => ({
      ...current,
      organizer: user?.name ?? '',
    }));
    setCertificateForm((current) => ({
      ...current,
      student_email:
        role === 'student' ? user?.email ?? '' : current.student_email || user?.email || '',
    }));
    setPressForm((current) => ({
      ...current,
      student_name: user?.name ?? '',
      department: user?.department ?? '',
    }));
  }, [role, user]);

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
    if (!certificateForm.participation_id) {
      return;
    }

    const linkedParticipation = participations.find(
      (item) => item.id === certificateForm.participation_id,
    );
    if (!linkedParticipation) {
      return;
    }

    setCertificateForm((current) => ({
      ...current,
      student_email: linkedParticipation.student_email ?? current.student_email,
      event_name: getParticipationLabel(linkedParticipation),
      achievement: linkedParticipation.achievement ?? current.achievement,
    }));
  }, [certificateForm.participation_id, participations]);

  useEffect(() => {
    loadDashboard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role]);

  const loadDashboard = async () => {
    setLoading(true);
    setError('');

    const [eventsResult, participationsResult, certificatesResult, leaderboardResult, activityResult] =
      await Promise.allSettled([
        api.get('/events'),
        api.get('/participations'),
        api.get('/certificates'),
        api.get('/leaderboard'),
        canViewActivity ? api.get('/activity-status') : Promise.resolve({ data: [] }),
      ]);

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
      () =>
        api.post('/create-event', {
          ...eventForm,
          organizer: eventForm.organizer || user?.name || 'CAIP Editorial Desk',
        }),
      'Event created and published to the shared edition board.',
    );
    setEventForm({
      event_name: '',
      organizer: user?.name ?? '',
      category: 'Hackathon',
      description: '',
      date: '',
    });
  };

  const handleParticipationSubmit = async (event) => {
    event.preventDefault();
    await runAction(
      'participation',
      () => api.post('/submit-participation', participationForm),
      'Participation filed and added to the achievement ledger.',
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
    formData.append('student_email', certificateForm.student_email.trim());
    formData.append('event_name', certificateForm.event_name.trim());
    formData.append('achievement', certificateForm.achievement);
    if (certificateForm.file) {
      formData.append('file', certificateForm.file);
    }

    await runAction(
      'certificate',
      () => api.post('/upload-certificate', formData),
      'Certificate uploaded and placed into the verification queue.',
    );
    setCertificateForm({
      participation_id: '',
      student_email: role === 'student' ? user?.email ?? '' : '',
      event_name: '',
      achievement: 'participation',
      file: null,
    });
  };

  const handleVerifyCertificate = async (certificateId) => {
    await runAction(
      `verify-${certificateId}`,
      () => api.put(`/verify-certificate/${certificateId}`),
      'Certificate verified and score projection updated.',
    );
  };

  const handlePressNoteSubmit = async (event) => {
    event.preventDefault();
    setBusyAction('press-note');
    setError('');
    setMessage('');

    try {
      const { data } = await api.post('/generate-press-note', pressForm);
      setPressNoteResult(data);
      setMessage('A publication-ready press note has been drafted.');
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
      setMessage('Prediction console returned a fresh projection.');
    } catch (requestError) {
      setError(readError(requestError, 'Prediction request failed.'));
    } finally {
      setBusyAction('');
    }
  };

  const leaderboardEntry = useMemo(
    () => leaderboard.find((item) => item.student_email === user?.email),
    [leaderboard, user?.email],
  );
  const activityEntry = useMemo(
    () => activityStatus.find((item) => item.student_email === user?.email),
    [activityStatus, user?.email],
  );

  const pendingCertificates = certificates.filter((item) => !item.verified).length;
  const verifiedCertificates = certificates.filter((item) => item.verified).length;
  const leaderboardRank = leaderboard.findIndex((item) => item.student_email === user?.email) + 1;
  const activityBand = activityEntry?.activity_level ?? 'Inactive';

  const metrics = [
    {
      label: 'Verified Score',
      value: leaderboardEntry?.total_points ?? 0,
      caption: 'Points currently counted in the verified leaderboard projection.',
      badge: 'Score',
    },
    {
      label: 'Tracked Events',
      value: activityEntry?.participations ?? participations.length,
      caption: 'Recorded participations visible to this edition of the dashboard.',
      badge: 'Ledger',
    },
    {
      label: 'Leaderboard Rank',
      value: leaderboardRank > 0 ? `#${leaderboardRank}` : '--',
      caption: 'Placement within the currently visible leaderboard slice.',
      badge: 'Rank',
      tone: 'terminal',
    },
    {
      label: 'Proof Queue',
      value: pendingCertificates,
      caption: 'Certificates still waiting for editorial verification or follow-up.',
      badge: 'Queue',
    },
    {
      label: 'Activity Band',
      value: activityBand,
      caption: 'Current engagement classification from the activity intelligence model.',
      badge: 'Status',
    },
  ];

  const tickerItems = [
    `${events.length} open event briefs are currently posted to the campus board.`,
    `${verifiedCertificates} verified proof files are now archived in the certificate bureau.`,
    `${pendingCertificates} filings still require verification attention.`,
    `${leaderboard.length} ranked student records are visible in this edition.`,
    `${activityBand} engagement signal for ${user?.name ?? 'the active desk'}.`,
  ];

  const leaderboardChartData = leaderboard.slice(0, 6).map((item) => ({
    label: item.student_name,
    value: item.total_points,
    note: `${item.activity_level} | ${item.wins} wins`,
  }));

  const activityDistribution = [
    {
      label: 'Highly Active',
      value: activityStatus.filter((item) => item.activity_level === 'Highly Active').length,
      note: 'Students participating in five or more events.',
      tone: 'high',
    },
    {
      label: 'Moderate',
      value: activityStatus.filter((item) => item.activity_level === 'Moderate').length,
      note: 'Students showing steady but still growing momentum.',
      tone: 'moderate',
    },
    {
      label: 'Inactive',
      value: activityStatus.filter((item) => item.activity_level === 'Inactive').length,
      note: 'Students needing intervention or stronger opportunity matching.',
      tone: 'inactive',
    },
  ];

  if (loading) {
    return (
      <div className="screen-state">
        <div className="screen-state__card">
          <p className="eyebrow">Edition Sync</p>
          <h2>Loading the live campus edition...</h2>
        </div>
      </div>
    );
  }

  return (
    <AppShell
      title={`${roleMeta[role]?.label ?? 'User'} Dashboard`}
      subtitle={roleMeta[role]?.strapline ?? 'Role-based workspace'}
    >
      <NewsTicker items={tickerItems} />

      <section className="hero-summary newsprint-texture">
        <div className="hero-summary__lead">
          <p className="eyebrow">Front Page Lead</p>
          <h3>Editorial-grade visibility for achievements, filings, and campus momentum.</h3>
          <p className="hero-summary__copy">
            The {roleMeta[role]?.label ?? 'Campus'} desk is balancing operational workflows
            with live analytics, giving every role an opinionated dashboard that feels more
            like a publication control room than a generic admin console.
          </p>
        </div>

        <div className="hero-summary__ledger">
          <div className="hero-ledger-card">
            <span className="eyebrow">Edition Notes</span>
            <strong>{formatDate(new Date().toISOString())}</strong>
            <p>Morning issue with role-aware event operations and AI coverage columns.</p>
          </div>
          <div className="hero-ledger-card">
            <span className="eyebrow">Coverage Angle</span>
            <strong>{roleMeta[role]?.label ?? 'Campus'} Intelligence</strong>
            <p>{roleMeta[role]?.highlights?.join(' | ')}</p>
          </div>
        </div>
      </section>

      {message ? <p className="feedback success">{message}</p> : null}
      {error ? <p className="feedback error">{error}</p> : null}

      <MetricGrid items={metrics} />

      <div className="dashboard-grid">
        <div className="dashboard-column">
          <Panel
            id="operations"
            eyebrow="Operations"
            title="Event Desk"
            className={canManageEvents ? '' : 'panel--compact'}
          >
            <div className={`panel-split ${canManageEvents ? '' : 'panel-split--single'}`.trim()}>
              {canManageEvents ? (
                <form className="form-grid compact" onSubmit={handleEventSubmit}>
                  <label>
                    Event Name
                    <input
                      name="event_name"
                      value={eventForm.event_name}
                      onChange={handleChange(setEventForm)}
                      required
                    />
                  </label>
                  <label>
                    Organizer
                    <input
                      name="organizer"
                      value={eventForm.organizer}
                      onChange={handleChange(setEventForm)}
                      required
                    />
                  </label>
                  <label>
                    Category
                    <select
                      name="category"
                      value={eventForm.category}
                      onChange={handleChange(setEventForm)}
                    >
                      {categoryOptions.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
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
                  <label className="span-2">
                    Description
                    <textarea
                      name="description"
                      value={eventForm.description}
                      onChange={handleChange(setEventForm)}
                      placeholder="Add a concise editorial brief for the campus notice board."
                    />
                  </label>
                  <button className="primary-button" type="submit" disabled={busyAction === 'event'}>
                    {busyAction === 'event' ? 'Publishing...' : 'Publish Event Brief'}
                  </button>
                </form>
              ) : null}

              <div className="editorial-feed">
                <div className="editorial-feed__header">
                  <p className="eyebrow">Active Briefs</p>
                  <span>{events.length} listed</span>
                </div>
                <ul className="editorial-list">
                  {events.length ? (
                    events.map((item) => (
                      <li key={item.id} className="editorial-list__item">
                        <div>
                          <strong>{getEventLabel(item)}</strong>
                          <p>
                            {item.category} | {formatDate(item.date)}
                          </p>
                        </div>
                        <span className="editorial-stamp">{item.organizer ?? 'Desk Filed'}</span>
                      </li>
                    ))
                  ) : (
                    <li className="editorial-list__empty">
                      No event briefs are currently visible in this edition.
                    </li>
                  )}
                </ul>
              </div>
            </div>
          </Panel>

          <Panel eyebrow="Operations" title="Achievement Ledger">
            <div className={`panel-split ${role === 'student' ? '' : 'panel-split--single'}`.trim()}>
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
                          {getEventLabel(item)}
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
                      {achievementOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="span-2">
                    Notes
                    <textarea
                      name="notes"
                      value={participationForm.notes}
                      onChange={handleChange(setParticipationForm)}
                      placeholder="Capture what happened, who attended, or what should be highlighted."
                    />
                  </label>
                  <button
                    className="primary-button"
                    type="submit"
                    disabled={busyAction === 'participation'}
                  >
                    {busyAction === 'participation' ? 'Filing...' : 'File Participation'}
                  </button>
                </form>
              ) : null}

              <div className="editorial-feed">
                <div className="editorial-feed__header">
                  <p className="eyebrow">Recent Activity</p>
                  <span>{participations.length} records</span>
                </div>
                <ul className="editorial-list">
                  {participations.length ? (
                    participations.map((item) => (
                      <li key={item.id} className="editorial-list__item">
                        <div>
                          <strong>{getParticipationLabel(item)}</strong>
                          <p>
                            {humanizeAchievement(item.achievement)} | {item.points} points
                          </p>
                        </div>
                        <span className="editorial-stamp">
                          {item.student_name ?? item.student_email}
                        </span>
                      </li>
                    ))
                  ) : (
                    <li className="editorial-list__empty">
                      No participation records are available for this workspace yet.
                    </li>
                  )}
                </ul>
              </div>
            </div>
          </Panel>

          <Panel eyebrow="Operations" title="Certificate Bureau">
            <div
              className={`panel-split ${canUploadCertificate ? '' : 'panel-split--single'}`.trim()}
            >
              {canUploadCertificate ? (
                <form className="form-grid compact" onSubmit={handleCertificateSubmit}>
                  <label>
                    Student Email
                    <input
                      name="student_email"
                      type="email"
                      value={certificateForm.student_email}
                      onChange={handleChange(setCertificateForm)}
                      readOnly={role === 'student'}
                      required
                    />
                  </label>
                  <label>
                    Linked Participation
                    <select
                      name="participation_id"
                      value={certificateForm.participation_id}
                      onChange={handleChange(setCertificateForm)}
                    >
                      <option value="">Optional ledger link</option>
                      {participations.map((item) => (
                        <option key={item.id} value={item.id}>
                          {getParticipationLabel(item)}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="span-2">
                    Event Name
                    <input
                      name="event_name"
                      value={certificateForm.event_name}
                      onChange={handleChange(setCertificateForm)}
                      required
                    />
                  </label>
                  <label>
                    Achievement
                    <select
                      name="achievement"
                      value={certificateForm.achievement}
                      onChange={handleChange(setCertificateForm)}
                    >
                      {achievementOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="span-2">
                    Certificate File
                    <input
                      name="file"
                      type="file"
                      accept=".pdf,.png,.jpg,.jpeg,.webp"
                      onChange={handleChange(setCertificateForm)}
                      required
                    />
                  </label>
                  <button
                    className="primary-button"
                    type="submit"
                    disabled={busyAction === 'certificate'}
                  >
                    {busyAction === 'certificate' ? 'Sending...' : 'Submit Proof File'}
                  </button>
                </form>
              ) : null}

              <div className="editorial-feed">
                <div className="editorial-feed__header">
                  <p className="eyebrow">Verification Queue</p>
                  <span>{certificates.length} files</span>
                </div>
                <ul className="editorial-list editorial-list--dense">
                  {certificates.length ? (
                    certificates.map((item) => (
                      <li key={item.id} className="editorial-list__item">
                        <div>
                          <strong>{item.event_name}</strong>
                          <p>
                            {item.student_email} | {humanizeAchievement(item.achievement)}
                          </p>
                          <p>{formatDate(item.uploaded_at)}</p>
                        </div>
                        <div className="editorial-actions">
                          <span
                            className={`badge badge--${item.verified ? 'verified' : 'pending'}`}
                          >
                            {item.verification_status}
                          </span>
                          {canVerifyCertificates && !item.verified ? (
                            <button
                              className="ghost-button small"
                              type="button"
                              onClick={() => handleVerifyCertificate(item.id)}
                              disabled={busyAction === `verify-${item.id}`}
                            >
                              {busyAction === `verify-${item.id}` ? 'Reviewing...' : 'Verify'}
                            </button>
                          ) : null}
                        </div>
                      </li>
                    ))
                  ) : (
                    <li className="editorial-list__empty">
                      The certificate bureau has no files in circulation yet.
                    </li>
                  )}
                </ul>
              </div>
            </div>
          </Panel>

          {role === 'super_admin' ? <SuperAdminDashboard /> : null}
        </div>

        <div className="dashboard-column dashboard-column--aside">
          <Panel
            id="analytics"
            eyebrow="Analytics"
            title="Leaderboard Signal"
            variant="terminal"
          >
            {leaderboardChartData.length ? (
              <AnalyticsBarChart
                data={leaderboardChartData}
                ariaLabel="Leaderboard comparison chart"
                suffix=" pts"
              />
            ) : (
              <p className="terminal-empty">No ranked students are visible in this edition yet.</p>
            )}
          </Panel>

          <Panel eyebrow="Analytics" title="Activity Matrix" variant="terminal">
            {activityStatus.length ? (
              <>
                <ActivityDistributionChart
                  items={activityDistribution}
                  ariaLabel="Student activity distribution chart"
                />
                <ul className="terminal-list">
                  {activityStatus.slice(0, 5).map((item) => (
                    <li key={item.student_email}>
                      <span>{item.student_name}</span>
                      <strong>
                        {item.activity_level} | {item.participations}
                      </strong>
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              <p className="terminal-empty">
                Activity intelligence will appear here once student records are available.
              </p>
            )}
          </Panel>
