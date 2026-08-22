# Comprehensive Performance Audit Report — Assessify MCQ Platform

**Audit Date**: August 22, 2026  
**Auditor**: Senior MERN Stack Performance Engineer  
**System Target**: Assessify Examination Platform (Node.js/Express, MongoDB Atlas, React/Vite)

---

## 1. Current Bottlenecks Overview
During peak concurrency (100 Virtual Users), the platform maintains a 0% request failure rate, but suffers from severe latency degradation:
- **Average Response Time**: 11.81 seconds
- **Median Response Time**: 5.18 seconds
- **p90 Latency**: 37.83 seconds
- **p95 Latency**: 40.55 seconds
- **Maximum Latency**: 51.78 seconds

The primary causes are Mongoose document instantiation overhead on every request in `protect` middleware, duplicate database queries during user authentication checks (`getMe`), un-indexed compound queries, un-lean read queries in admin and analytics controllers, missing HTTP response compression, and production fallback handling in database configuration.

---

## 2. Slowest APIs
1. **`GET /api/tests/:testId`**: High-concurrency test loading when hundreds of students open an exam simultaneously.
2. **`GET /api/analytics/leaderboard`**: Un-lean populated query over all completed attempts.
3. **`GET /api/analytics/teacher`**: $O(N \times M)$ nested array loops over questions and attempts without projection.
4. **`GET /api/admin/teachers/pending`**: Un-indexed compound filter `{ role: 'teacher', isApproved: false }`.
5. **`GET /api/auth/me`**: Performs a redundant `User.findById()` database query despite `protect` middleware already executing `User.findById()`.

---

## 3. Expensive Database Queries
- `User.find({ role: 'teacher', isApproved: false })`: Full collection scan without compound index `{ role: 1, isApproved: 1 }`.
- `TestAttempt.find({ testId, studentId, status: 'in_progress' })`: Evaluated frequently on attempt check without compound index.
- `Question.find({ testId }).sort({ order: 1 })`: Requires `{ testId: 1, order: 1 }` for index-scan ordering.
- `AuditLog.find(query).sort({ createdAt: -1 })`: Lacks index on `createdAt`.

---

## 4. Missing Indexes
- **`User`**: Compound index `{ role: 1, isApproved: 1 }` and `{ role: 1, isActive: 1 }`.
- **`TestAttempt`**: `{ testId: 1, studentId: 1, status: 1 }`, `{ studentId: 1, status: 1 }`, and unique partial index `{ testId: 1, studentId: 1 }` where `status === 'in_progress'`.
- **`Question`**: Compound index `{ testId: 1, order: 1 }`.
- **`Test`**: Compound indexes `{ isPublished: 1, type: 1 }` and `{ subjectId: 1, isPublished: 1 }`.
- **`AuditLog`**: Index `{ createdAt: -1 }`.

---

## 5. Duplicate API Requests
- **`GET /api/auth/me`**: Re-queries `User.findById(req.user._id)` when `protect` middleware has already fetched and attached `req.user`. Returning `req.user` directly saves 1 DB roundtrip on every profile check.
- **Frontend Component Mounts**: `TakeMcqTest.jsx` initializes test fetching inside `useEffect` without a ref guard, risking duplicate API invocations during component re-renders.

---

## 6. N+1 Queries
- Historically present in test listing (`getTests`) where question counts and attempt stats were queried sequentially inside `.map()`. Already refactored to bulk aggregations (`Question.aggregate` & `TestAttempt.find`), verified and retained.

---

## 7. Large Payloads
- Response payloads historically included unselected internal Mongoose document properties (`__v`, `updatedAt`).
- Express server lacks GZIP/Brotli HTTP compression middleware (`compression`), sending uncompressed JSON over the wire.

---

## 8. Authentication Bottlenecks
- `protect` middleware executes `User.findById(decoded.id).select('-password')` as a full Mongoose document instead of using `.lean()`.
- Password hashing using `bcryptjs` salt rounds (10) is appropriate for security, but user lookup in middleware must be lean.

---

## 9. Test-Loading Bottlenecks
- Unnecessary `teacherId` populate (name, email) during student test loading.
- Absence of server-side in-memory caching for public sanitized test definitions during active concurrent exam bursts.

---

## 10. Answer-Autosave Bottlenecks
- Direct per-click HTTP calls under high VU count. Mitigated by `PUT /api/attempts/:id/save-batch` batch autosave endpoint and frontend dirty-answer tracking with pre-submission flushing.

---

## 11. Submission Bottlenecks
- Score evaluation performing $O(N^2)$ linear array searches across questions. Mitigated via $O(1)$ `Map(questionId -> answer)` lookup.
- Synchronous audit logging blocking HTTP response paths. Mitigated via non-blocking `setImmediate` execution.

---

## 12. Frontend Performance Problems
- Potential duplicate API calls on mount in React Strict Mode.
- Unnecessary full component tree re-renders on single option selection.

---

## 13. Recommended Fixes Ranked by Priority

### Priority 1: High-Impact Infrastructure & Connection Safety
1. **Production Error Handling (`db.js`)**: Disable silent fallback to `MongoMemoryServer` when `process.env.NODE_ENV === 'production'` or `MONGODB_URI` is set.
2. **HTTP Compression (`server.js`)**: Add Express `compression()` middleware to compress JSON responses.

### Priority 2: Authentication & Middleware Optimization
1. **Lean User Middleware (`auth.js`)**: Add `.lean()` to `User.findById` inside `protect` middleware.
2. **Eliminate Duplicate Query (`authController.js`)**: Return `req.user` directly in `getMe` without re-querying MongoDB.

### Priority 3: Database Indexing & Read Query Optimization
1. **Compound Indexes**: Add `{ role: 1, isApproved: 1 }` to `User` schema and `{ createdAt: -1 }` to `AuditLog`.
2. **Lean Read Queries**: Add `.lean()` to all read queries in `adminController.js`, `analyticsController.js`, `testController.js`, `attemptController.js`.

### Priority 4: Test Loading & Caching Optimization
1. **In-Memory Test Cache (`testController.js`)**: Maintain safe 60-second TTL cache for sanitized student test definitions with automatic cache invalidation on test edit/delete.
2. **Field Projection & Populate Removal**: Omit `teacherId` populate for student test loading; fetch only required fields.

### Priority 5: Frontend Ref Guarding & Batching
1. **Guarded useEffect (`TakeMcqTest.jsx`)**: Ensure `api.get('/tests/' + testId)` runs strictly once per component mount.

### Priority 6: Automated Verification & Load Testing
1. **Verification Suite**: Validate all 16 security and functional regression checks.
2. **k6 Load Testing**: Run progressive k6 load test (10, 25, 50, 100, 200, 300 VUs) and generate `OPTIMIZATION_REPORT.md`.
