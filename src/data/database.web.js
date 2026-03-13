const WEB_STORAGE_KEY = 'smart_class_checkin_sessions';
const WEB_BOUND_STUDENT_ID_KEY = 'smart_class_checkin_bound_student_id';

let initialized = false;
let memoryWebSessions = [];

function readWebSessions() {
  if (typeof localStorage === 'undefined') {
    return memoryWebSessions;
  }

  const raw = localStorage.getItem(WEB_STORAGE_KEY);
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (_error) {
    return [];
  }
}

function writeWebSessions(sessions) {
  if (typeof localStorage === 'undefined') {
    memoryWebSessions = sessions;
    return;
  }

  localStorage.setItem(WEB_STORAGE_KEY, JSON.stringify(sessions));
}

export async function initDatabase() {
  if (initialized) {
    return;
  }

  const sessions = readWebSessions();
  writeWebSessions(sessions);
  initialized = true;
}

export async function insertCheckIn(session) {
  await initDatabase();
  const sessions = readWebSessions();
  sessions.push(session);
  writeWebSessions(sessions);
  return { rowsAffected: 1, insertId: session.id };
}

export async function getLatestOpenSession(studentId, classCode) {
  await initDatabase();
  const sessions = readWebSessions();
  const filtered = sessions
    .filter(
      (session) =>
        session.studentId === studentId &&
        session.classCode === classCode &&
        session.status === 'checked_in'
    )
    .sort((a, b) => b.checkInTime.localeCompare(a.checkInTime));
  return filtered[0] ?? null;
}

export async function hasCheckInForDate(studentId, classCode, sessionDate) {
  await initDatabase();
  const sessions = readWebSessions();

  return sessions.some(
    (session) =>
      session.studentId === studentId &&
      session.classCode === classCode &&
      session.sessionDate === sessionDate
  );
}

export async function getBoundStudentId() {
  await initDatabase();

  if (typeof localStorage === 'undefined') {
    return null;
  }

  const value = localStorage.getItem(WEB_BOUND_STUDENT_ID_KEY);
  return value && value.trim() ? value.trim() : null;
}

export async function bindStudentIdIfNeeded(studentId) {
  await initDatabase();

  const existing = await getBoundStudentId();
  if (existing) {
    return existing;
  }

  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(WEB_BOUND_STUDENT_ID_KEY, studentId);
  }

  return studentId;
}

export async function completeSession({
  sessionId,
  checkOutTime,
  checkOutLat,
  checkOutLng,
  checkOutQr,
  learnedToday,
  feedback,
}) {
  await initDatabase();

  const sessions = readWebSessions();
  const index = sessions.findIndex((session) => session.id === sessionId);

  if (index === -1) {
    return { rowsAffected: 0 };
  }

  sessions[index] = {
    ...sessions[index],
    checkOutTime,
    checkOutLat,
    checkOutLng,
    checkOutQr,
    learnedToday,
    feedback,
    status: 'completed',
    updatedAt: new Date().toISOString(),
  };

  writeWebSessions(sessions);
  return { rowsAffected: 1 };
}

export async function getAllSessions() {
  await initDatabase();
  return readWebSessions().sort((a, b) =>
    b.checkInTime.localeCompare(a.checkInTime)
  );
}

export async function clearAllSessions() {
  await initDatabase();
  writeWebSessions([]);
  return { rowsAffected: 1 };
}
