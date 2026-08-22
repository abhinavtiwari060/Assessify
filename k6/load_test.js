import http from 'k6/http';
import { check, sleep } from 'k6';
import { Counter, Rate, Trend } from 'k6/metrics';

// Custom k6 Metrics
const successfulAttemptStarts = new Counter('successful_attempt_starts');
const failedAttemptStarts = new Counter('failed_attempt_starts');
const successfulSubmissions = new Counter('successful_submissions');
const failedSubmissions = new Counter('failed_submissions');
const batchAutosaveLatency = new Trend('batch_autosave_latency_ms');
const submitLatency = new Trend('submit_latency_ms');
const errorRate = new Rate('api_error_rate');

export const options = {
  stages: [
    { duration: '10s', target: 10 },  // Stage 1: 10 Concurrent Students
    { duration: '15s', target: 25 },  // Stage 2: 25 Concurrent Students
    { duration: '20s', target: 50 },  // Stage 3: 50 Concurrent Students
    { duration: '25s', target: 100 }, // Stage 4: 100 Concurrent Students
    { duration: '30s', target: 200 }, // Stage 5: 200 Concurrent Students
    { duration: '30s', target: 500 }, // Stage 6: 500 Concurrent Students
    { duration: '10s', target: 0 },   // Ramp-down
  ],
  thresholds: {
    http_req_failed: ['rate<0.02'],     // Error rate must be under 2%
    http_req_duration: ['p(95)<3000'],  // 95% of requests must finish within 3000ms
    api_error_rate: ['rate<0.02'],
  },
};

const BASE_URL = __ENV.TARGET_URL || 'http://localhost:5000/api';

export function setup() {
  // Global Setup: Seed or fetch target test ID
  const res = http.get(`${BASE_URL}/health`);
  check(res, { 'health check online': (r) => r.status === 200 });

  // Get available published tests
  const testsRes = http.get(`${BASE_URL}/tests`);
  let testId = null;
  if (testsRes.status === 200) {
    const tests = JSON.parse(testsRes.body);
    if (tests.length > 0) {
      testId = tests[0]._id;
    }
  }

  return { testId };
}

export default function (data) {
  const vuId = __VU;
  const iter = __ITER;

  // Each VU represents a unique student
  const studentEmail = `load_student_${vuId}@platform.com`;
  const studentPassword = 'student123';

  // 1. Authenticate / Register Student VU (Once)
  let token = null;
  const loginRes = http.post(
    `${BASE_URL}/auth/login`,
    JSON.stringify({ email: studentEmail, password: studentPassword }),
    { headers: { 'Content-Type': 'application/json' } }
  );

  if (loginRes.status === 200) {
    token = JSON.parse(loginRes.body).token;
  } else {
    // Register if user doesn't exist yet
    const regRes = http.post(
      `${BASE_URL}/auth/register`,
      JSON.stringify({
        name: `Student VU ${vuId}`,
        email: studentEmail,
        password: studentPassword,
        role: 'student',
      }),
      { headers: { 'Content-Type': 'application/json' } }
    );
    if (regRes.status === 201) {
      token = JSON.parse(regRes.body).token;
    }
  }

  if (!token) {
    errorRate.add(1);
    return;
  }

  const authHeaders = {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  };

  // 2. Fetch Available Tests
  const testsRes = http.get(`${BASE_URL}/tests`, authHeaders);
  const testsOk = check(testsRes, { 'GET /tests 200 OK': (r) => r.status === 200 });
  errorRate.add(!testsOk);

  const testId = data.testId;
  if (!testId) return;

  // 3. Start Exam Attempt
  const startRes = http.post(`${BASE_URL}/attempts/start/${testId}`, null, authHeaders);
  const startOk = check(startRes, { 'Start Attempt 200/201': (r) => r.status === 200 || r.status === 201 });

  if (startOk) {
    successfulAttemptStarts.add(1);
  } else {
    failedAttemptStarts.add(1);
    errorRate.add(1);
    return;
  }

  const attempt = JSON.parse(startRes.body);
  const attemptId = attempt._id;

  // 4. Fetch Test Questions
  const testDetailsRes = http.get(`${BASE_URL}/tests/${testId}`, authHeaders);
  const questionsOk = check(testDetailsRes, { 'GET /tests/:id 200 OK': (r) => r.status === 200 });
  errorRate.add(!questionsOk);

  let questions = [];
  if (questionsOk) {
    questions = JSON.parse(testDetailsRes.body).questions || [];
  }

  // Simulate exam taking: student answers questions locally
  sleep(1);

  // 5. Batch Autosave (Simulating 5-second interval debounced batch save)
  if (questions.length > 0 && attempt.status === 'in_progress') {
    const answersBatch = questions.map((q, idx) => ({
      questionId: q._id,
      selectedOptionIndex: idx % 4,
      timeSpentSeconds: 5,
      isFlagged: idx === 0,
    }));

    const saveStart = Date.now();
    const batchRes = http.put(
      `${BASE_URL}/attempts/${attemptId}/save-batch`,
      JSON.stringify({ answers: answersBatch }),
      authHeaders
    );

    batchAutosaveLatency.add(Date.now() - saveStart);
    const saveOk = check(batchRes, { 'Batch Autosave 200 OK': (r) => r.status === 200 });
    errorRate.add(!saveOk);
  }

  sleep(1);

  // 6. Submit Test (Only if attempt is still in_progress)
  if (attempt.status === 'in_progress') {
    const submitStart = Date.now();
    const submitRes = http.post(
      `${BASE_URL}/attempts/${attemptId}/submit`,
      JSON.stringify({ isTimerExpired: false }),
      authHeaders
    );

    submitLatency.add(Date.now() - submitStart);
    const submitOk = check(submitRes, { 'Submit Test 200 OK': (r) => r.status === 200 });

    if (submitOk) {
      successfulSubmissions.add(1);
    } else {
      failedSubmissions.add(1);
      errorRate.add(1);
    }
  }

  sleep(1);
}
