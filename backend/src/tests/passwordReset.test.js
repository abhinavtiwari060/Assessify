const test = require('node:test');
const assert = require('node:assert/strict');
const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');
const User = require('../models/User');
const PasswordResetRequest = require('../models/PasswordResetRequest');
const {
  forgotPassword,
  changePassword,
  loginUser,
} = require('../controllers/authController');
const {
  getPasswordResetRequests,
  processPasswordReset,
} = require('../controllers/adminController');

let mongoServer;

test.before(async () => {
  process.env.JWT_SECRET = 'test_secret_key_password_reset_99';
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
});

test.after(async () => {
  await mongoose.disconnect();
  if (mongoServer) {
    await mongoServer.stop();
  }
});

test.beforeEach(async () => {
  await User.deleteMany({});
  await PasswordResetRequest.deleteMany({});
});

const mockResponse = () => {
  const res = {};
  res.statusCode = 200;
  res.status = (code) => {
    res.statusCode = code;
    return res;
  };
  res.json = (data) => {
    res.body = data;
    return res;
  };
  return res;
};

test('Forgot Password: Submitting request for existing student creates PENDING request and returns generic response', async () => {
  const student = await User.create({
    name: 'Rahul Kumar',
    email: 'rahul@gmail.com',
    password: 'Password123!',
    role: 'student',
  });

  const req = { body: { email: 'rahul@gmail.com' } };
  const res = mockResponse();

  await forgotPassword(req, res);

  assert.equal(res.statusCode, 200);
  assert.equal(
    res.body.message,
    'Your password reset request has been submitted to the administrator.'
  );

  const requests = await PasswordResetRequest.find({ userId: student._id });
  assert.equal(requests.length, 1);
  assert.equal(requests[0].email, 'rahul@gmail.com');
  assert.equal(requests[0].userName, 'Rahul Kumar');
  assert.equal(requests[0].role, 'student');
  assert.equal(requests[0].status, 'PENDING');
});

test('Forgot Password: Non-existent email receives identical generic response and creates no DB record', async () => {
  const req = { body: { email: 'nonexistent@gmail.com' } };
  const res = mockResponse();

  await forgotPassword(req, res);

  assert.equal(res.statusCode, 200);
  assert.equal(
    res.body.message,
    'Your password reset request has been submitted to the administrator.'
  );

  const requests = await PasswordResetRequest.find({ email: 'nonexistent@gmail.com' });
  assert.equal(requests.length, 0);
});

test('Forgot Password: Duplicate pending request from same user updates requestedAt instead of creating duplicate clutter', async () => {
  const teacher = await User.create({
    name: 'Amit Kumar',
    email: 'amit@gmail.com',
    password: 'Password123!',
    role: 'teacher',
  });

  const req = { body: { email: 'amit@gmail.com' } };
  const res1 = mockResponse();
  await forgotPassword(req, res1);

  const initialRequests = await PasswordResetRequest.find({ userId: teacher._id });
  assert.equal(initialRequests.length, 1);

  const res2 = mockResponse();
  await forgotPassword(req, res2);

  const finalRequests = await PasswordResetRequest.find({ userId: teacher._id });
  assert.equal(finalRequests.length, 1);
  assert.equal(finalRequests[0].status, 'PENDING');
});

test('Admin Password Reset: Admin views requests and resets pending request', async () => {
  const admin = await User.create({
    name: 'Admin User',
    email: 'admin@system.com',
    password: 'AdminPassword123!',
    role: 'admin',
  });

  const student = await User.create({
    name: 'Priya Sharma',
    email: 'priya@gmail.com',
    password: 'OriginalPassword123!',
    role: 'student',
  });

  const resetReq = await PasswordResetRequest.create({
    userId: student._id,
    email: student.email,
    userName: student.name,
    role: student.role,
    status: 'PENDING',
  });

  // Admin GET password resets
  const getReq = { user: admin };
  const getRes = mockResponse();
  await getPasswordResetRequests(getReq, getRes);

  assert.equal(getRes.statusCode, 200);
  assert.equal(getRes.body.length, 1);
  assert.equal(getRes.body[0].email, 'priya@gmail.com');

  // Admin POST reset
  const processReq = { params: { id: resetReq._id.toString() }, user: admin };
  const processRes = mockResponse();
  await processPasswordReset(processReq, processRes);

  assert.equal(processRes.statusCode, 200);
  assert.ok(processRes.body.temporaryPassword);
  assert.equal(typeof processRes.body.temporaryPassword, 'string');
  assert.ok(processRes.body.temporaryPassword.length >= 8);

  const tempPwd = processRes.body.temporaryPassword;

  // Check updated user state
  const updatedStudent = await User.findById(student._id).select('+password');
  assert.equal(updatedStudent.mustChangePassword, true);
  assert.ok(updatedStudent.temporaryPasswordExpiresAt);
  assert.notEqual(updatedStudent.password, tempPwd); // Must be hashed!

  // Check updated request status
  const updatedReq = await PasswordResetRequest.findById(resetReq._id);
  assert.equal(updatedReq.status, 'COMPLETED');
  assert.equal(updatedReq.processedByName, 'Admin User');

  // User logs in with temporary password
  const loginReq = { body: { email: 'priya@gmail.com', password: tempPwd } };
  const loginRes = mockResponse();
  await loginUser(loginReq, loginRes);

  assert.equal(loginRes.statusCode, 200);
  assert.equal(loginRes.body.mustChangePassword, true);

  // User changes password
  const changeReq = {
    user: updatedStudent,
    body: { currentPassword: tempPwd, newPassword: 'NewPermanentPassword123!' },
  };
  const changeRes = mockResponse();
  await changePassword(changeReq, changeRes);

  assert.equal(changeRes.statusCode, 200);
  assert.equal(changeRes.body.mustChangePassword, false);

  // Verify old temp password no longer works
  const oldLoginReq = { body: { email: 'priya@gmail.com', password: tempPwd } };
  const oldLoginRes = mockResponse();
  await loginUser(oldLoginReq, oldLoginRes);
  assert.equal(oldLoginRes.statusCode, 401);

  // Verify new password works
  const newLoginReq = { body: { email: 'priya@gmail.com', password: 'NewPermanentPassword123!' } };
  const newLoginRes = mockResponse();
  await loginUser(newLoginReq, newLoginRes);
  assert.equal(newLoginRes.statusCode, 200);
  assert.equal(newLoginRes.body.mustChangePassword, false);
});

test('Temporary Password Expiry: Expired temporary password fails login', async () => {
  const student = await User.create({
    name: 'Suresh Kumar',
    email: 'suresh@gmail.com',
    password: 'TempPassword123!',
    mustChangePassword: true,
    temporaryPasswordExpiresAt: new Date(Date.now() - 1000), // Past date = expired!
    role: 'student',
  });

  const loginReq = { body: { email: 'suresh@gmail.com', password: 'TempPassword123!' } };
  const loginRes = mockResponse();
  await loginUser(loginReq, loginRes);

  assert.equal(loginRes.statusCode, 401);
  assert.ok(loginRes.body.message.includes('expired'));
});
