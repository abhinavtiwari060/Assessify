const TestAttempt = require('../models/TestAttempt');
const Test = require('../models/Test');
const Question = require('../models/Question');
const EssaySubmission = require('../models/EssaySubmission');
const User = require('../models/User');
const PlatformSettings = require('../models/PlatformSettings');

// @desc    Get transparent leaderboard (Score -> Accuracy -> Time tiebreaker)
// @route   GET /api/analytics/leaderboard
// @access  Private
const getLeaderboard = async (req, res) => {
  try {
    const { subjectId, testId, limit = 20 } = req.query;

    let query = { status: { $ne: 'in_progress' } };

    // Respect Admin Leaderboard Reset cutoff if active
    const settings = await PlatformSettings.findOne().lean();
    if (settings && settings.leaderboardResetAt) {
      const resetCutoff = new Date(settings.leaderboardResetAt);
      query.$or = [
        { submittedAt: { $gte: resetCutoff } },
        { submittedAt: null, createdAt: { $gte: resetCutoff } },
      ];
    }

    if (testId) {
      query.testId = testId;
    }

    let attempts = await TestAttempt.find(query)
      .populate('studentId', 'name email avatar')
      .populate({
        path: 'testId',
        select: 'title subjectId',
        populate: { path: 'subjectId', select: 'name code' },
      })
      .lean();

    if (subjectId) {
      attempts = attempts.filter(
        (a) => a.testId && a.testId.subjectId && a.testId.subjectId._id.toString() === subjectId
      );
    }

    // Map by student to get best performance or aggregate performance
    const studentStats = {};

    attempts.forEach((att) => {
      if (!att.studentId) return;
      const sId = att.studentId._id.toString();

      if (!studentStats[sId]) {
        studentStats[sId] = {
          student: att.studentId,
          totalScore: 0,
          totalMaxMarks: 0,
          totalAttempts: 0,
          bestScore: 0,
          bestAccuracy: 0,
          bestTimeSeconds: Infinity,
          totalCorrect: 0,
          totalAttempted: 0,
          recentTestTitle: att.testId ? att.testId.title : 'Test',
        };
      }

      studentStats[sId].totalAttempts += 1;
      studentStats[sId].totalScore += att.score;
      studentStats[sId].totalMaxMarks += att.maxMarks;
      studentStats[sId].totalCorrect += att.correctCount;
      studentStats[sId].totalAttempted += att.attemptedCount;

      // Track peak single attempt for ranking tiebreaker
      if (
        att.score > studentStats[sId].bestScore ||
        (att.score === studentStats[sId].bestScore && att.accuracy > studentStats[sId].bestAccuracy) ||
        (att.score === studentStats[sId].bestScore &&
          att.accuracy === studentStats[sId].bestAccuracy &&
          att.timeTakenSeconds < studentStats[sId].bestTimeSeconds)
      ) {
        studentStats[sId].bestScore = att.score;
        studentStats[sId].bestAccuracy = att.accuracy;
        studentStats[sId].bestTimeSeconds = att.timeTakenSeconds || 0;
      }
    });

    const leaderboard = Object.values(studentStats).map((item) => {
      const avgAccuracy =
        item.totalAttempted > 0
          ? Math.round((item.totalCorrect / item.totalAttempted) * 10000) / 100
          : 0;

      return {
        student: item.student,
        bestScore: item.bestScore,
        bestAccuracy: item.bestAccuracy,
        bestTimeSeconds: item.bestTimeSeconds === Infinity ? 0 : item.bestTimeSeconds,
        totalAttempts: item.totalAttempts,
        avgAccuracy,
        totalScore: Math.round(item.totalScore * 100) / 100,
        recentTestTitle: item.recentTestTitle,
      };
    });

    // Transparent Ranking Algorithm: Score (desc) -> Accuracy (desc) -> Time Taken (asc)
    leaderboard.sort((a, b) => {
      if (b.bestScore !== a.bestScore) return b.bestScore - a.bestScore;
      if (b.bestAccuracy !== a.bestAccuracy) return b.bestAccuracy - a.bestAccuracy;
      return a.bestTimeSeconds - b.bestTimeSeconds;
    });

    // Add rank numbers
    const rankedLeaderboard = leaderboard.slice(0, Number(limit)).map((item, idx) => ({
      rank: idx + 1,
      ...item,
    }));

    res.json(rankedLeaderboard);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get comprehensive Student Report Card & Subject Analytics
// @route   GET /api/analytics/report-card/me
// @access  Private (Student)
const getStudentReportCard = async (req, res) => {
  try {
    const studentId = req.user._id;

    // Fetch all completed MCQ attempts
    const attempts = await TestAttempt.find({
      studentId,
      status: { $ne: 'in_progress' },
    })
      .populate({
        path: 'testId',
        select: 'title subjectId type totalMarks',
        populate: { path: 'subjectId', select: 'name code iconName' },
      })
      .lean();

    // Fetch all Essay submissions
    const essays = await EssaySubmission.find({ studentId })
      .populate({
        path: 'testId',
        select: 'title subjectId totalMarks',
        populate: { path: 'subjectId', select: 'name code iconName' },
      })
      .lean();

    let totalScoreObtained = 0;
    let totalMaxMarks = 0;
    let totalQuestionsAttempted = 0;
    let totalCorrect = 0;
    let totalWrong = 0;
    let totalTimeTakenSeconds = 0;

    const subjectPerformance = {};

    attempts.forEach((att) => {
      if (!att.testId || !att.testId.subjectId) return;

      totalScoreObtained += att.score;
      totalMaxMarks += att.maxMarks;
      totalQuestionsAttempted += att.attemptedCount;
      totalCorrect += att.correctCount;
      totalWrong += att.wrongCount;
      totalTimeTakenSeconds += att.timeTakenSeconds || 0;

      const subName = att.testId.subjectId.name;

      if (!subjectPerformance[subName]) {
        subjectPerformance[subName] = {
          subjectName: subName,
          code: att.testId.subjectId.code,
          iconName: att.testId.subjectId.iconName,
          attemptCount: 0,
          totalCorrect: 0,
          totalAttempted: 0,
          totalScore: 0,
          totalMax: 0,
        };
      }

      subjectPerformance[subName].attemptCount += 1;
      subjectPerformance[subName].totalCorrect += att.correctCount;
      subjectPerformance[subName].totalAttempted += att.attemptedCount;
      subjectPerformance[subName].totalScore += att.score;
      subjectPerformance[subName].totalMax += att.maxMarks;
    });

    const subjectBreakdown = Object.values(subjectPerformance).map((sub) => {
      const accuracy =
        sub.totalAttempted > 0
          ? Math.round((sub.totalCorrect / sub.totalAttempted) * 10000) / 100
          : 0;

      return {
        ...sub,
        accuracy,
        status: accuracy >= 75 ? 'Strong' : accuracy >= 50 ? 'Average' : 'Needs Improvement',
      };
    });

    const averageAccuracy =
      totalQuestionsAttempted > 0
        ? Math.round((totalCorrect / totalQuestionsAttempted) * 10000) / 100
        : 0;

    const averageScore =
      attempts.length > 0
        ? Math.round((totalScoreObtained / attempts.length) * 100) / 100
        : 0;

    // Evaluated Essays summary
    const evaluatedEssays = essays.filter((e) => e.status === 'evaluated');

    res.json({
      student: {
        _id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        avatar: req.user.avatar,
      },
      summary: {
        totalMcqAttempts: attempts.length,
        totalEssaySubmissions: essays.length,
        evaluatedEssaysCount: evaluatedEssays.length,
        totalScoreObtained: Math.round(totalScoreObtained * 100) / 100,
        totalMaxMarks,
        averageAccuracy,
        averageScore,
        totalQuestionsAttempted,
        totalCorrect,
        totalWrong,
        totalTimeSpentMinutes: Math.round(totalTimeTakenSeconds / 60),
      },
      subjectBreakdown,
      recentAttempts: attempts.slice(0, 5),
      evaluatedEssays: evaluatedEssays.map((e) => ({
        testTitle: e.testId ? e.testId.title : 'Essay Test',
        marksObtained: e.marksObtained,
        maxMarks: e.maxMarks,
        feedback: e.feedback,
        evaluatedAt: e.evaluatedAt,
      })),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get Teacher dashboard analytics & Item difficulty breakdown
// @route   GET /api/analytics/teacher
// @access  Private (Teacher / Admin)
const getTeacherAnalytics = async (req, res) => {
  try {
    let teacherFilter = {};
    if (req.user.role === 'teacher') {
      teacherFilter.teacherId = req.user._id;
    }

    const myTests = await Test.find(teacherFilter).select('_id title type subjectId').lean();
    const myTestIds = myTests.map((t) => t._id);

    const totalAttempts = await TestAttempt.countDocuments({
      testId: { $in: myTestIds },
      status: { $ne: 'in_progress' },
    });

    const pendingEssays = await EssaySubmission.countDocuments({
      testId: { $in: myTestIds },
      status: 'submitted',
    });

    // Item/Question Difficulty Analysis for teacher's tests
    const allQuestions = await Question.find({ testId: { $in: myTestIds } })
      .select('_id questionText testId')
      .lean();

    const allCompletedAttempts = await TestAttempt.find({
      testId: { $in: myTestIds },
      status: { $ne: 'in_progress' },
    })
      .select('answers')
      .lean();

    // Group answer statistics in memory using a questionId Map (O(N + M) complexity)
    const questionStatsMap = new Map();
    allQuestions.forEach((q) => {
      questionStatsMap.set(q._id.toString(), {
        _id: q._id,
        questionText: q.questionText,
        testId: q.testId,
        timesAnswered: 0,
        timesCorrect: 0,
        timesWrong: 0,
        totalTime: 0,
      });
    });

    allCompletedAttempts.forEach((att) => {
      if (!Array.isArray(att.answers)) return;
      att.answers.forEach((ans) => {
        if (!ans || !ans.questionId) return;
        const qStat = questionStatsMap.get(ans.questionId.toString());
        if (qStat && ans.selectedOptionIndex !== null && ans.selectedOptionIndex !== undefined) {
          qStat.timesAnswered++;
          qStat.totalTime += ans.timeSpentSeconds || 0;
          if (ans.isCorrect) qStat.timesCorrect++;
          else qStat.timesWrong++;
        }
      });
    });

    const questionStats = Array.from(questionStatsMap.values()).map((qStat) => {
      const correctPercentage =
        qStat.timesAnswered > 0 ? Math.round((qStat.timesCorrect / qStat.timesAnswered) * 100) : 0;
      const wrongPercentage =
        qStat.timesAnswered > 0 ? Math.round((qStat.timesWrong / qStat.timesAnswered) * 100) : 0;
      const avgTimeSeconds =
        qStat.timesAnswered > 0 ? Math.round(qStat.totalTime / qStat.timesAnswered) : 0;

      let difficultyLabel = 'Moderate';
      if (correctPercentage < 40) difficultyLabel = 'High (Hard)';
      else if (correctPercentage > 75) difficultyLabel = 'Low (Easy)';

      return {
        _id: qStat._id,
        questionText: qStat.questionText,
        testId: qStat.testId,
        timesAnswered: qStat.timesAnswered,
        timesCorrect: qStat.timesCorrect,
        timesWrong: qStat.timesWrong,
        correctPercentage,
        wrongPercentage,
        avgTimeSeconds,
        difficultyLabel,
      };
    });

    // Sort questions by highest wrong percentage (most problematic first)
    questionStats.sort((a, b) => b.wrongPercentage - a.wrongPercentage);

    res.json({
      totalTests: myTests.length,
      totalAttempts,
      pendingEssays,
      questionAnalytics: questionStats.slice(0, 15),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get Admin System Overview Analytics
// @route   GET /api/analytics/admin
// @access  Private (Admin)
const getAdminAnalytics = async (req, res) => {
  try {
    const totalStudents = await User.countDocuments({ role: 'student' });
    const totalTeachers = await User.countDocuments({ role: 'teacher' });
    const pendingTeachersCount = await User.countDocuments({ role: 'teacher', isApproved: false });
    const totalTests = await Test.countDocuments();
    const totalAttempts = await TestAttempt.countDocuments({ status: { $ne: 'in_progress' } });
    const totalEssays = await EssaySubmission.countDocuments();
    const totalSubjects = await Subject.countDocuments();

    res.json({
      totalStudents,
      totalTeachers,
      pendingTeachersCount,
      totalTests,
      totalAttempts,
      totalEssays,
      totalSubjects,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getLeaderboard,
  getStudentReportCard,
  getTeacherAnalytics,
  getAdminAnalytics,
};
