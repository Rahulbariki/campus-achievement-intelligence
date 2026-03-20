export const roleMeta = {
  student: {
    label: 'Student',
    path: 'student',
    strapline: 'Submit achievements, upload proof, and watch your score grow.',
    highlights: ['Participation tracking', 'Certificate uploads', 'Personal portfolio'],
  },
  faculty: {
    label: 'Faculty',
    path: 'faculty',
    strapline: 'Spot student momentum early and guide the next milestone.',
    highlights: ['Department snapshots', 'Activity monitoring', 'Student support'],
  },
  admin: {
    label: 'Admin',
    path: 'admin',
    strapline: 'Keep operations moving across events, verification, and reporting.',
    highlights: ['Event control', 'Certificate review', 'Press note drafting'],
  },
  hod: {
    label: 'HOD',
    path: 'hod',
    strapline: 'See the department story from raw submissions to outcomes.',
    highlights: ['Leaderboard oversight', 'Activity intelligence', 'Department analytics'],
  },
  super_admin: {
    label: 'Super Admin',
    path: 'super-admin',
    strapline: 'Coordinate the full platform with a system-wide lens.',
    highlights: ['Cross-role oversight', 'Global analytics', 'Platform governance'],
  },
};

export const roleOptions = Object.entries(roleMeta).map(([value, meta]) => ({
  value,
  label: meta.label,
}));

export const eventControlRoles = ['admin', 'hod', 'super_admin'];
export const activityRoles = ['student', 'faculty', 'admin', 'hod', 'super_admin'];
export const pressNoteRoles = ['admin', 'hod', 'super_admin'];
export const certificateUploadRoles = ['student', 'faculty', 'admin', 'hod', 'super_admin'];

export function getDashboardPath(role) {
  const meta = roleMeta[role] ?? roleMeta.student;
  return `/dashboard/${meta.path}`;
}
