import * as SQLite from 'expo-sqlite';

const BOUND_STUDENT_ID_KEY = 'boundStudentId';

let initialized = false;
let nativeDb = null;

function getNativeDb() {
  if (nativeDb) {
    return nativeDb;
  }

  nativeDb = SQLite.openDatabaseSync('smart_class_checkin.db');
  return nativeDb;
}

async function executeSql(sql, args = [], readOnly = false) {
  const db = getNativeDb();
  const normalizedArgs = Array.isArray(args) ? args : [];

  if (readOnly) {
    return db.getAllAsync(sql, normalizedArgs);
  }

  return db.runAsync(sql, normalizedArgs);
}

export async function initDatabase() {
  if (initialized) {
    return;
  }

  const db = getNativeDb();
  await db.execAsync(
    `CREATE TABLE IF NOT EXISTS class_sessions (
      id TEXT PRIMARY KEY NOT NULL,
      studentId TEXT NOT NULL,
      classCode TEXT NOT NULL,
      sessionDate TEXT NOT NULL,
      checkInTime TEXT NOT NULL,
      checkInLat REAL NOT NULL,
      checkInLng REAL NOT NULL,
      checkInQr TEXT NOT NULL,
      previousTopic TEXT NOT NULL,
      expectedTopic TEXT NOT NULL,
      moodBefore INTEGER NOT NULL,
      checkOutTime TEXT,
      checkOutLat REAL,
      checkOutLng REAL,
      checkOutQr TEXT,
      learnedToday TEXT,
      feedback TEXT,
      status TEXT NOT NULL,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    );`
  );

  await db.execAsync(
    `CREATE TABLE IF NOT EXISTS app_settings (
      key TEXT PRIMARY KEY NOT NULL,
      value TEXT NOT NULL
    );`
  );

  initialized = true;
}

export async function insertCheckIn(session) {
  await initDatabase();

  return executeSql(
    `INSERT INTO class_sessions (
      id, studentId, classCode, sessionDate,
      checkInTime, checkInLat, checkInLng, checkInQr,
      previousTopic, expectedTopic, moodBefore,
      checkOutTime, checkOutLat, checkOutLng, checkOutQr,
      learnedToday, feedback, status, createdAt, updatedAt
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      session.id,
      session.studentId,
      session.classCode,
      session.sessionDate,
      session.checkInTime,
      session.checkInLat,
      session.checkInLng,
      session.checkInQr,
      session.previousTopic,
      session.expectedTopic,
      session.moodBefore,
      session.checkOutTime ?? null,
      session.checkOutLat ?? null,
      session.checkOutLng ?? null,
      session.checkOutQr ?? null,
      session.learnedToday ?? null,
      session.feedback ?? null,
      session.status,
      session.createdAt,
      session.updatedAt,
    ],
    false
  );
}

export async function getLatestOpenSession(studentId, classCode) {
  await initDatabase();

  const rows = await executeSql(
    `SELECT * FROM class_sessions
     WHERE studentId = ? AND classCode = ? AND status = 'checked_in'
     ORDER BY checkInTime DESC
     LIMIT 1`,
    [studentId, classCode],
    true
  );

  return rows.length > 0 ? rows[0] : null;
}

export async function hasCheckInForDate(studentId, classCode, sessionDate) {
  await initDatabase();

  const rows = await executeSql(
    `SELECT id FROM class_sessions
     WHERE studentId = ? AND classCode = ? AND sessionDate = ?
     LIMIT 1`,
    [studentId, classCode, sessionDate],
    true
  );

  return rows.length > 0;
}

export async function getBoundStudentId() {
  await initDatabase();

  const rows = await executeSql(
    `SELECT value FROM app_settings WHERE key = ? LIMIT 1`,
    [BOUND_STUDENT_ID_KEY],
    true
  );

  return rows.length > 0 ? rows[0].value : null;
}

export async function bindStudentIdIfNeeded(studentId) {
  await initDatabase();

  const existing = await getBoundStudentId();
  if (existing) {
    return existing;
  }

  await executeSql(
    `INSERT INTO app_settings (key, value) VALUES (?, ?)`,
    [BOUND_STUDENT_ID_KEY, studentId],
    false
  );

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

  return executeSql(
    `UPDATE class_sessions
     SET checkOutTime = ?,
         checkOutLat = ?,
         checkOutLng = ?,
         checkOutQr = ?,
         learnedToday = ?,
         feedback = ?,
         status = 'completed',
         updatedAt = ?
     WHERE id = ?`,
    [
      checkOutTime,
      checkOutLat,
      checkOutLng,
      checkOutQr,
      learnedToday,
      feedback,
      new Date().toISOString(),
      sessionId,
    ],
    false
  );
}

export async function getAllSessions() {
  await initDatabase();

  const rows = await executeSql(
    `SELECT * FROM class_sessions ORDER BY checkInTime DESC`,
    [],
    true
  );

  return rows;
}

export async function clearAllSessions() {
  await initDatabase();
  return executeSql('DELETE FROM class_sessions', [], false);
}
