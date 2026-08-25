const test = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_secret_key_12345';
process.env.ADMIN_EMAIL = 'admin@test.com';
process.env.ADMIN_PASSWORD = 'AdminPassword123!';

let mongoServer;
let User, Subject, Test, Question, TestAttempt, EssaySubmission, PlatformSettings, AuditLog;
let resetLeaderboard, getLeaderboard, recordEssayViolation, recordViolation;

test.before(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();

  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  await mongoose.connect(uri);

  User = require('../models/User');
  Subject = require('../models/Subject');
  Test = require('../models/Test');
  Question = require('../models/Question');
  TestAttempt = require('../models/TestAttempt');
  EssaySubmission = require('../models/EssaySubmission');
  PlatformSettings = require('../models/PlatformSettings');
  AuditLog = require('../models/AuditLog');

  const adminController = require('../controllers/adminController');
  resetLeaderboard = adminController.resetLeaderboard;

  const analyticsController = require('../controllers/analyticsController');
  getLeaderboard = analyticsController.getLeaderboard;

  const essayController = require('../controllers/essayController');
  recordEssayViolation = essayController.recordEssayViolation;

  const attemptController = require('../controllers/attemptController');
  recordViolation = attemptController.recordViolation;
});

test.after(async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  if (mongoServer) {
    await mongoServer.stop();
  }
});

function mockRes() {
  const res = {
    statusCode: 200,
    headers: {},
    data: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(obj) {
      this.data = obj;
      return this;
    },
    setHeader(key, val) {
      this.headers[key] = val;
    },
    send(payload) {
      this.data = payload;
      return this;
    },
  };
  return res;
}

test('LEADERBOARD RESET: Admin can reset leaderboard, updating PlatformSettings cutoff and audit log', async () => {
  const adminId = new mongoose.Types.ObjectId();
  const req = {
    user: { _id: adminId, email: 'admin@test.com', role: 'admin' },
    ip: '127.0.0.1',
    headers: { 'user-agent': 'node-test' },
  };
  const res = mockRes();

  await resetLeaderboard(req, res);

  assert.equal(res.statusCode, 200);
  assert.equal(res.data.success, true);
  assert.ok(res.data.resetAt);

  const settings = await PlatformSettings.findOne().lean();
  assert.ok(settings);
  assert.ok(settings.leaderboardResetAt);

  const logs = await AuditLog.find({ action: 'LEADERBOARD_RESET' }).lean();
  assert.equal(logs.length, 1);
  assert.ok(logs[0].details.includes('admin@test.com'));
});

test('LEADERBOARD QUERY: Respects reset cutoff without deleting historical attempt or submission records', async () => {
  await TestAttempt.deleteMany({});
  await EssaySubmission.deleteMany({});
  await PlatformSettings.deleteMany({});

  const teacher = await User.create({
    name: 'Teacher User',
    email: `teacher_${Date.now()}@test.com`,
    password: 'Password123!',
    role: 'teacher',
  });

  const student = await User.create({
    name: 'Test Leaderboard Student',
    email: `lb_student_${Date.now()}@test.com`,
    password: 'Password123!',
    role: 'student',
  });

  const subject = await Subject.create({
    name: 'Mathematics',
    code: `MATH_${Date.now()}`,
    createdBy: teacher._id,
  });

  const mcqTest = await Test.create({
    title: 'Calculus Final',
    subjectId: subject._id,
    teacherId: teacher._id,
    type: 'mcq',
    status: 'STARTED',
    totalMarks: 100,
  });

  const pastDate = new Date(Date.now() - 3600 * 1000 * 24); // 1 day ago
  const oldAttempt = await TestAttempt.create({
    testId: mcqTest._id,
    studentId: student._id,
    score: 95,
    maxMarks: 100,
    accuracy: 95,
    status: 'submitted',
    submittedAt: pastDate,
    createdAt: pastDate,
  });

  // Query leaderboard before reset -> Old attempt should be present
  const reqBefore = { query: {} };
  const resBefore = mockRes();
  await getLeaderboard(reqBefore, resBefore);
  assert.equal(resBefore.statusCode, 200);
  assert.ok(resBefore.data.length >= 1);
  assert.equal(resBefore.data[0].student._id.toString(), student._id.toString());

  // Execute Leaderboard Reset
  const resetAt = new Date();
  await PlatformSettings.findOneAndUpdate(
    {},
    { leaderboardResetAt: resetAt },
    { upsert: true, new: true }
  );

  // Query leaderboard after reset -> Old attempt should be excluded
  const reqAfter = { query: {} };
  const resAfter = mockRes();
  await getLeaderboard(reqAfter, resAfter);
  assert.equal(resAfter.statusCode, 200);
  assert.equal(resAfter.data.length, 0);

  // Create new attempt completed AFTER reset
  const newAttempt = await TestAttempt.create({
    testId: mcqTest._id,
    studentId: student._id,
    score: 90,
    maxMarks: 100,
    accuracy: 90,
    status: 'submitted',
    submittedAt: new Date(),
  });

  // Query leaderboard after new attempt -> New attempt appears
  const reqNew = { query: {} };
  const resNew = mockRes();
  await getLeaderboard(reqNew, resNew);
  assert.equal(resNew.statusCode, 200);
  assert.equal(resNew.data.length, 1);

  // CRITICAL CHECK: Verify old attempt record is NOT deleted from DB!
  const checkOldInDB = await TestAttempt.findById(oldAttempt._id);
  assert.ok(checkOldInDB);
  assert.equal(checkOldInDB.score, 95);
});

test('ESSAY ANTI-CHEATING: Handles violations, 3-strike auto-submit, and text preservation', async () => {
  const teacher = await User.create({
    name: 'Teacher User 2',
    email: `teacher2_${Date.now()}@test.com`,
    password: 'Password123!',
    role: 'teacher',
  });

  const student = await User.create({
    name: 'Essay Anti-Cheating Student',
    email: `essay_cheat_${Date.now()}@test.com`,
    password: 'Password123!',
    role: 'student',
  });

  const subject = await Subject.create({
    name: 'Literature',
    code: `LIT_${Date.now()}`,
    createdBy: teacher._id,
  });

  const essayTest = await Test.create({
    title: 'Shakespeare Essay',
    subjectId: subject._id,
    teacherId: teacher._id,
    type: 'essay',
    status: 'STARTED',
    totalMarks: 50,
  });

  const essay = await EssaySubmission.create({
    testId: essayTest._id,
    studentId: student._id,
    essayText: 'To be or not to be, that is the question.',
    wordCount: 10,
    status: 'in_progress',
  });

  const req1 = {
    params: { id: essay._id.toString() },
    body: { type: 'visibilitychange', details: 'Tab switch' },
    user: { _id: student._id, role: 'student' },
    ip: '127.0.0.1',
    headers: { 'user-agent': 'node-test' },
  };
  const res1 = mockRes();

  await recordEssayViolation(req1, res1);

  assert.equal(res1.statusCode, 200);
  assert.equal(res1.data.violationCount, 1);
  assert.equal(res1.data.isAutoSubmitted, false);

  // Second violation
  const res2 = mockRes();
  await recordEssayViolation(req1, res2);
  assert.equal(res2.data.violationCount, 2);
  assert.equal(res2.data.isAutoSubmitted, false);

  // Third violation -> Triggers Auto-Submit
  const res3 = mockRes();
  await recordEssayViolation(req1, res3);
  assert.equal(res3.data.violationCount, 3);
  assert.equal(res3.data.isAutoSubmitted, true);

  // Check DB state after auto-submit
  const updatedEssay = await EssaySubmission.findById(essay._id);
  assert.equal(updatedEssay.status, 'auto_submitted');
  assert.equal(updatedEssay.submissionType, 'AUTO_SUBMITTED');
  assert.ok(updatedEssay.submittedAt);
  // CRITICAL CHECK: Ensure essay text is preserved!
  assert.equal(updatedEssay.essayText, 'To be or not to be, that is the question.');

  // Subsequent violation on already submitted essay should be safely rejected without corrupting state
  const res4 = mockRes();
  await recordEssayViolation(req1, res4);
  assert.equal(res4.data.isAutoSubmitted, true);
  assert.equal(res4.data.message, 'Essay is already submitted');
});

test('ESSAY ANTI-CHEATING: Reject unauthorized violation logging for another student', async () => {
  const owner = await User.create({
    name: 'Essay Owner',
    email: `essay_owner_${Date.now()}@test.com`,
    password: 'Password123!',
    role: 'student',
  });

  const attacker = await User.create({
    name: 'Attacker Student',
    email: `essay_attacker_${Date.now()}@test.com`,
    password: 'Password123!',
    role: 'student',
  });

  const essay = await EssaySubmission.create({
    testId: new mongoose.Types.ObjectId(),
    studentId: owner._id,
    essayText: 'Private Essay',
    status: 'in_progress',
  });

  const req = {
    params: { id: essay._id.toString() },
    body: { type: 'blur' },
    user: { _id: attacker._id, role: 'student' },
    ip: '127.0.0.1',
    headers: { 'user-agent': 'node-test' },
  };
  const res = mockRes();

  await recordEssayViolation(req, res);

  assert.equal(res.statusCode, 404);
  assert.equal(res.data.message, 'Active essay submission not found');
});

test('GENERIC VIOLATION API: /api/attempts/:id/violation supports EssaySubmission fallback', async () => {
  const student = await User.create({
    name: 'Generic Route Student',
    email: `generic_route_${Date.now()}@test.com`,
    password: 'Password123!',
    role: 'student',
  });

  const essay = await EssaySubmission.create({
    testId: new mongoose.Types.ObjectId(),
    studentId: student._id,
    essayText: 'Testing generic violation fallback endpoint',
    status: 'in_progress',
  });

  const req = {
    params: { id: essay._id.toString() },
    body: { type: 'fullscreenchange', details: 'Exited fullscreen' },
    user: { _id: student._id, role: 'student' },
    ip: '127.0.0.1',
    headers: { 'user-agent': 'node-test' },
  };
  const res = mockRes();

  await recordViolation(req, res);

  assert.equal(res.statusCode, 200);
  assert.equal(res.data.violationCount, 1);
  assert.equal(res.data.isAutoSubmitted, false);
});
