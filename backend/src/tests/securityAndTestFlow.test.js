const test = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongoServer;
let User, Subject, Test, Question, TestAttempt;
let registerUser, googleAuth, startAttempt, getTestById;

test.before(async () => {
  process.env.JWT_SECRET = 'test_jwt_secret_key_security_99';
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

  const authController = require('../controllers/authController');
  registerUser = authController.registerUser;
  googleAuth = authController.googleAuth;

  const attemptController = require('../controllers/attemptController');
  startAttempt = attemptController.startAttempt;

  const testController = require('../controllers/testController');
  getTestById = testController.getTestById;
});

test.after(async () => {
  await mongoose.disconnect();
  if (mongoServer) {
    await mongoServer.stop();
  }
});

test('SECURITY: Public registration enforces role = student and ignores client role override', async () => {
  const req = {
    body: {
      name: 'Malicious Admin Wannabe',
      email: 'hacker@example.com',
      password: 'Password123!',
      role: 'admin', // Attack attempt: trying to self-assign admin!
    },
    ip: '127.0.0.1',
  };

  let responseData = null;
  let responseStatus = 200;

  const res = {
    status(code) {
      responseStatus = code;
      return this;
    },
    json(data) {
      responseData = data;
      return this;
    },
  };

  await registerUser(req, res);

  assert.equal(responseStatus, 201, 'Should successfully register user');
  assert.equal(responseData.role, 'student', 'Role MUST be forced to student, ignoring client admin request!');

  const createdUser = await User.findOne({ email: 'hacker@example.com' });
  assert.equal(createdUser.role, 'student', 'Database record must have role = student');
});

test('SECURITY: Google Auth rejects role = admin for new signups', async () => {
  const req = {
    body: {
      name: 'Google Hacker',
      email: 'ghacker@example.com',
      role: 'admin',
    },
    ip: '127.0.0.1',
  };

  let responseData = null;
  let responseStatus = 200;

  const res = {
    status(code) {
      responseStatus = code;
      return this;
    },
    json(data) {
      responseData = data;
      return this;
    },
  };

  await googleAuth(req, res);

  assert.equal(responseData.role, 'student', 'Google signup MUST NOT allow role = admin');
});

test('SECURITY: Student test fetch strips correctAnswerIndex and explanation', async () => {
  const teacher = await User.create({
    name: 'Prof Security',
    email: 'secprof@test.com',
    password: 'Password123!',
    role: 'teacher',
  });

  const subject = await Subject.create({
    name: 'Computer Science',
    code: 'CS101',
    description: 'Intro to CS',
    createdBy: teacher._id,
  });

  const testDoc = await Test.create({
    title: 'Security Exam',
    subjectId: subject._id,
    teacherId: teacher._id,
    isPublished: true,
    status: 'STARTED',
    testCode: 'TEST',
  });

  await Question.create({
    testId: testDoc._id,
    questionText: 'What is 2+2?',
    options: ['3', '4', '5'],
    correctAnswerIndex: 1, // Secret answer
    explanation: 'Basic math',
    marks: 1,
    order: 0,
  });

  const studentUser = await User.create({
    name: 'Student Bob',
    email: 'bob@test.com',
    password: 'Password123!',
    role: 'student',
  });

  const req = {
    params: { id: testDoc._id.toString() },
    user: studentUser,
  };

  let responseData = null;
  const res = {
    status(code) {
      return this;
    },
    json(data) {
      responseData = data;
      return this;
    },
  };

  await getTestById(req, res);

  assert.ok(responseData, 'Should return test data');
  assert.ok(responseData.questions, 'Should return questions array');
  assert.equal(responseData.questions.length, 1);
  assert.equal(responseData.questions[0].correctAnswerIndex, undefined, 'correctAnswerIndex MUST be stripped for student');
  assert.equal(responseData.questions[0].explanation, undefined, 'explanation MUST be stripped for student');
});

test('TEST ENGINE: Starting a DRAFT (unpublished) test is rejected by backend', async () => {
  const teacher = await User.create({
    name: 'Prof Draft',
    email: 'draftprof@test.com',
    password: 'Password123!',
    role: 'teacher',
  });

  const subject = await Subject.create({
    name: 'Mathematics',
    code: 'MATH101',
    createdBy: teacher._id,
  });

  const draftTest = await Test.create({
    title: 'Unpublished Draft Test',
    subjectId: subject._id,
    teacherId: teacher._id,
    isPublished: false,
    status: 'DRAFT',
    testCode: 'DRAF',
  });

  const studentUser = await User.create({
    name: 'Student Alice',
    email: 'alice@test.com',
    password: 'Password123!',
    role: 'student',
  });

  const req = {
    params: { id: draftTest._id.toString() },
    user: studentUser,
    body: { code: 'DRAF' },
    ip: '127.0.0.1',
  };

  let responseData = null;
  let responseStatus = 200;

  const res = {
    status(code) {
      responseStatus = code;
      return this;
    },
    json(data) {
      responseData = data;
      return this;
    },
  };

  await startAttempt(req, res);

  assert.ok([400, 404].includes(responseStatus), 'Backend MUST reject starting unpublished/draft tests with HTTP 400 or 404');
});
