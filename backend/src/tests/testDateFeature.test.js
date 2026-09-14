const { test, describe, before, after } = require('node:test');
const assert = require('node:assert');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongod;
let User, Subject, Test;
let createTest, updateTest, getTestById, getTests;

before(async () => {
  mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();
  await mongoose.connect(uri);

  User = require('../models/User');
  Subject = require('../models/Subject');
  Test = require('../models/Test');

  const testController = require('../controllers/testController');
  createTest = testController.createTest;
  updateTest = testController.updateTest;
  getTestById = testController.getTestById;
  getTests = testController.getTests;
});

after(async () => {
  await mongoose.disconnect();
  if (mongod) await mongod.stop();
});

describe('Test Date & Time Feature Verification', () => {
  let teacher, student, subject;

  test('Setup teacher, student, and subject', async () => {
    teacher = await User.create({
      name: 'Test Teacher',
      email: 'teacher_testdate@assessify.com',
      password: 'Password123!',
      role: 'teacher',
      isApproved: true,
    });

    student = await User.create({
      name: 'Test Student',
      email: 'student_testdate@assessify.com',
      password: 'Password123!',
      role: 'student',
    });

    subject = await Subject.create({
      name: 'Computer Science',
      code: 'CS_DATE_101',
      createdBy: teacher._id,
    });

    assert.ok(teacher._id);
    assert.ok(student._id);
    assert.ok(subject._id);
  });

  test('1. Admin/Teacher can create a test with a specified date and time', async () => {
    const scheduledDate = new Date('2026-10-15T14:30:00.000Z');

    let responseData = null;
    let statusCode = 200;
    const req = {
      user: teacher,
      body: {
        title: 'Algorithms Midterm Exam',
        description: 'Midterm test on graph algorithms',
        subjectId: subject._id.toString(),
        type: 'mcq',
        testDate: scheduledDate.toISOString(),
        durationMinutes: 45,
        questions: [
          {
            questionText: 'What is the time complexity of BFS?',
            options: ['O(V + E)', 'O(V^2)', 'O(E^2)', 'O(1)'],
            correctAnswerIndex: 0,
            marks: 2,
          },
        ],
      },
    };
    const res = {
      status(code) {
        statusCode = code;
        return this;
      },
      json(data) {
        responseData = data;
        return this;
      },
    };

    await createTest(req, res);

    assert.strictEqual(statusCode, 201);
    assert.ok(responseData._id);
    assert.strictEqual(new Date(responseData.testDate).toISOString(), scheduledDate.toISOString());
  });

  test('2. Admin/Teacher can edit test to a PAST date and PAST time without restrictions', async () => {
    // Find the created test
    const existingTest = await Test.findOne({ title: 'Algorithms Midterm Exam' });
    assert.ok(existingTest);

    // Set to a past date (e.g. 2024-01-15 09:15 AM)
    const pastDate = new Date('2024-01-15T09:15:00.000Z');

    let updatedResponse = null;
    let updateStatusCode = 200;
    const req = {
      user: teacher,
      params: { id: existingTest._id.toString() },
      body: {
        testDate: pastDate.toISOString(),
      },
    };
    const res = {
      status(code) {
        updateStatusCode = code;
        return this;
      },
      json(data) {
        updatedResponse = data;
        return this;
      },
    };

    await updateTest(req, res);

    assert.strictEqual(updateStatusCode, 200);
    assert.strictEqual(new Date(updatedResponse.testDate).toISOString(), pastDate.toISOString());

    // Verify directly in DB
    const freshDbTest = await Test.findById(existingTest._id);
    assert.strictEqual(new Date(freshDbTest.testDate).toISOString(), pastDate.toISOString());
  });

  test('3. Student receives configured testDate in getTestById and getTests', async () => {
    const existingTest = await Test.findOne({ title: 'Algorithms Midterm Exam' });
    assert.ok(existingTest);

    let fetchedTest = null;
    const req = {
      user: student,
      params: { id: existingTest._id.toString() },
    };
    const res = {
      status() { return this; },
      json(data) {
        fetchedTest = data;
        return this;
      },
    };

    await getTestById(req, res);

    assert.ok(fetchedTest);
    assert.ok(fetchedTest.testDate);
    assert.strictEqual(new Date(fetchedTest.testDate).toISOString(), new Date('2024-01-15T09:15:00.000Z').toISOString());
    // Ensure security: testCode is NOT exposed to student
    assert.strictEqual(fetchedTest.testCode, undefined);
  });

  test('4. Admin can create, view, and edit any test date/time to a past timestamp', async () => {
    const adminUser = await User.create({
      name: 'System Admin',
      email: 'admin_testdate@assessify.com',
      password: 'AdminPassword123!',
      role: 'admin',
    });

    const pastDate = new Date('2020-05-10T08:30:00.000Z');

    // Admin creates test with past date
    let createdTest = null;
    const createReq = {
      user: adminUser,
      body: {
        title: 'Admin Historical Assessment',
        description: 'Test created in past',
        subjectId: subject._id.toString(),
        type: 'mcq',
        testDate: pastDate.toISOString(),
      },
    };
    const createRes = {
      status() { return this; },
      json(data) { createdTest = data; return this; },
    };

    await createTest(createReq, createRes);
    assert.ok(createdTest._id);
    assert.strictEqual(new Date(createdTest.testDate).toISOString(), pastDate.toISOString());

    // Admin edits test to an even earlier past date
    const olderPastDate = new Date('2019-01-01T07:00:00.000Z');
    let updatedTest = null;
    const updateReq = {
      user: adminUser,
      params: { id: createdTest._id.toString() },
      body: {
        testDate: olderPastDate.toISOString(),
      },
    };
    const updateRes = {
      status() { return this; },
      json(data) { updatedTest = data; return this; },
    };

    await updateTest(updateReq, updateRes);
    assert.strictEqual(new Date(updatedTest.testDate).toISOString(), olderPastDate.toISOString());
  });

  test('5. Legacy test without testDate field falls back gracefully to existing timestamp in API', async () => {
    // Create raw test directly in DB without testDate field
    const legacyCreatedAt = new Date('2023-06-15T12:00:00.000Z');
    const legacyDoc = await Test.collection.insertOne({
      title: 'Legacy Database Test',
      description: 'Test created prior to testDate schema field',
      subjectId: subject._id,
      teacherId: teacher._id,
      type: 'mcq',
      testType: 'mcq',
      timerMode: 'full',
      durationMinutes: 30,
      isPublished: true,
      createdAt: legacyCreatedAt,
      updatedAt: legacyCreatedAt,
    });

    // Student fetches tests list via getTests
    let testsList = null;
    const listReq = { user: student, query: {} };
    const listRes = {
      status() { return this; },
      json(data) { testsList = data; return this; },
    };

    await getTests(listReq, listRes);
    const foundLegacy = testsList.find((t) => t._id.toString() === legacyDoc.insertedId.toString());
    assert.ok(foundLegacy, 'Legacy test should be returned');
    assert.ok(foundLegacy.testDate, 'Legacy test must have testDate fallback');
    assert.strictEqual(new Date(foundLegacy.testDate).toISOString(), legacyCreatedAt.toISOString());
  });
});
