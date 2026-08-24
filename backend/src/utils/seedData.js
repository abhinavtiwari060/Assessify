const mongoose = require('mongoose');
const User = require('../models/User');
const Subject = require('../models/Subject');
const Test = require('../models/Test');
const Question = require('../models/Question');
const TestAttempt = require('../models/TestAttempt');

const seedInitialData = async () => {
  try {
    // Always ensure Admin user exists and has correct password & admin permissions
    let admin = await User.findOne({ email: 'abhitiwariaj@gmail.com' }).select('+password');
    if (!admin) {
      admin = await User.create({
        name: 'Platform Admin',
        email: 'abhitiwariaj@gmail.com',
        password: 'Abhi8957@tiwari#9451',
        role: 'admin',
        isApproved: true,
        isActive: true,
        bio: 'System Administrator & Moderation Lead',
      });
      console.log('✅ Default Admin user created: abhitiwariaj@gmail.com');
    } else {
      admin.role = 'admin';
      admin.isActive = true;
      admin.isApproved = true;
      const isMatch = await admin.matchPassword('Abhi8957@tiwari#9451');
      if (!isMatch) {
        admin.password = 'Abhi8957@tiwari#9451';
      }
      await admin.save();
      console.log('✅ Admin user verified & updated: abhitiwariaj@gmail.com');
    }

    const userCount = await User.countDocuments();
    if (userCount > 1) {
      console.log('🌱 Database already populated. Skipping initial seed.');
      return;
    }

    console.log('🌱 Seeding initial application database...');

    const teacherA = await User.create({
      name: 'Prof. Alan Turing (Teacher A)',
      email: 'teacher@platform.com',
      password: 'teacher123',
      role: 'teacher',
      isApproved: true,
      bio: 'Senior Computer Science Lecturer & Algorithm Expert',
    });

    const teacherB = await User.create({
      name: 'Dr. Grace Hopper (Teacher B)',
      email: 'teacher2@platform.com',
      password: 'teacher123',
      role: 'teacher',
      isApproved: true,
      bio: 'Database Architecture Specialist & Systems Instructor',
    });

    const student1 = await User.create({
      name: 'Alex Johnson',
      email: 'student@platform.com',
      password: 'student123',
      role: 'student',
      bio: 'Computer Science Undergraduate',
    });

    const student2 = await User.create({
      name: 'Sophia Chen',
      email: 'sophia@platform.com',
      password: 'student123',
      role: 'student',
      bio: 'Full Stack Engineering Student',
    });

    console.log('✅ Users seeded: abhitiwariaj@gmail.com, teacher@platform.com, teacher2@platform.com, student@platform.com');

    // 2. Create Subjects
    const subjectsData = [
      { name: 'Java Programming', code: 'JAVA101', description: 'Core Java OOP concepts, JVM, Collections & Multithreading', iconName: 'Code', createdBy: admin._id },
      { name: 'Python Fundamentals', code: 'PY201', description: 'Python syntax, data structures, OOP & modules', iconName: 'Terminal', createdBy: admin._id },
      { name: 'Database Management Systems (DBMS)', code: 'DBMS301', description: 'Relational Model, SQL, Normalization & ACID Transactions', iconName: 'Database', createdBy: admin._id },
      { name: 'Data Structures & Algorithms', code: 'DSA401', description: 'Arrays, Linked Lists, Trees, Graphs, Sorting & Dynamic Programming', iconName: 'Cpu', createdBy: admin._id },
      { name: 'Web Development', code: 'WEB102', description: 'HTML5, CSS3, JavaScript, React & RESTful API Architecture', iconName: 'Globe', createdBy: admin._id },
      { name: 'Quantitative Aptitude', code: 'APT501', description: 'Problem solving, logic, probability, numerical reasoning', iconName: 'Calculator', createdBy: admin._id },
      { name: 'English Communication', code: 'ENG101', description: 'Grammar, vocabulary, comprehension and essay articulation', iconName: 'BookOpen', createdBy: admin._id },
      { name: 'General Knowledge', code: 'GK100', description: 'Current affairs, world geography, history and science basics', iconName: 'Award', createdBy: admin._id },
    ];

    const createdSubjects = await Subject.insertMany(subjectsData);
    const javaSubject = createdSubjects.find((s) => s.code === 'JAVA101');
    const pySubject = createdSubjects.find((s) => s.code === 'PY201');
    const dbmsSubject = createdSubjects.find((s) => s.code === 'DBMS301');
    const dsaSubject = createdSubjects.find((s) => s.code === 'DSA401');

    console.log(`✅ ${createdSubjects.length} Subjects created.`);

    // 3. Create Tests for Teacher A
    const javaTest = await Test.create({
      title: 'Java Core Concepts & Collections Mastery',
      description: 'Comprehensive evaluation on Java OOPs, interfaces, exception handling and ArrayList/HashMap mechanics.',
      subjectId: javaSubject._id,
      teacherId: teacherA._id,
      type: 'mcq',
      timerMode: 'full',
      durationMinutes: 15,
      perQuestionSeconds: 60,
      isSequential: false,
      maxAttempts: 3,
      passingPercentage: 50,
      negativeMarkingRate: 0.25,
      isPublished: true,
      instructions: 'Each correct answer adds 1 mark. Incorrect answers deduct 0.25 marks.',
    });

    const javaQuestions = [
      {
        testId: javaTest._id,
        questionText: 'Which keyword is used by a class to inherit another class in Java?',
        options: ['implements', 'extends', 'inherits', 'super'],
        correctAnswerIndex: 1,
        marks: 1,
        explanation: 'The `extends` keyword is used in Java for single inheritance between classes.',
        order: 0,
      },
      {
        testId: javaTest._id,
        questionText: 'What is the default initial capacity of an ArrayList in Java?',
        options: ['5', '10', '16', '32'],
        correctAnswerIndex: 1,
        marks: 1,
        explanation: 'Default initial capacity of an ArrayList in Java is 10.',
        order: 1,
      },
      {
        testId: javaTest._id,
        questionText: 'Which component of Java Development Kit executes bytecode?',
        options: ['JDK', 'JVM', 'JRE', 'JDB'],
        correctAnswerIndex: 1,
        marks: 1,
        explanation: 'JVM (Java Virtual Machine) loads, verifies, and executes Java bytecode.',
        order: 2,
      },
      {
        testId: javaTest._id,
        questionText: 'Which of the following is NOT a primitive data type in Java?',
        options: ['int', 'boolean', 'String', 'char'],
        correctAnswerIndex: 2,
        marks: 1,
        explanation: 'String is a reference object class in Java, not a primitive type.',
        order: 3,
      },
      {
        testId: javaTest._id,
        questionText: 'What is the runtime complexity of HashMap `get()` in average case?',
        options: ['O(n)', 'O(log n)', 'O(1)', 'O(n log n)'],
        correctAnswerIndex: 2,
        marks: 1,
        explanation: 'HashMap provides constant time O(1) performance for get and put operations assuming proper hash distribution.',
        order: 4,
      },
    ];

    const createdJavaQuestions = await Question.insertMany(javaQuestions);
    javaTest.totalMarks = 5;
    await javaTest.save();

    // 4. Create DSA Test with Question Timers for Teacher A
    const dsaTest = await Test.create({
      title: 'DSA Speed Challenge (Question Timed)',
      description: 'Rapid-fire test on Binary Search Trees, Graph Traversal and Sorting algorithms.',
      subjectId: dsaSubject._id,
      teacherId: teacherA._id,
      type: 'mcq',
      timerMode: 'question',
      perQuestionSeconds: 30,
      isSequential: true,
      maxAttempts: 2,
      passingPercentage: 60,
      negativeMarkingRate: 0,
      isPublished: true,
      instructions: 'Each question has a strict 30-second countdown. Auto-advances upon timeout.',
    });

    const dsaQuestions = [
      {
        testId: dsaTest._id,
        questionText: 'What is the time complexity of Binary Search on a sorted array of size N?',
        options: ['O(N)', 'O(log N)', 'O(N^2)', 'O(1)'],
        correctAnswerIndex: 1,
        marks: 2,
        explanation: 'Binary Search halves the search space at each step, yielding O(log N) complexity.',
        timerSeconds: 30,
        order: 0,
      },
      {
        testId: dsaTest._id,
        questionText: 'Which data structure follows the First-In First-Out (FIFO) principle?',
        options: ['Stack', 'Queue', 'Binary Tree', 'Heap'],
        correctAnswerIndex: 1,
        marks: 2,
        explanation: 'A Queue processes elements in FIFO order.',
        timerSeconds: 20,
        order: 1,
      },
    ];

    await Question.insertMany(dsaQuestions);
    dsaTest.totalMarks = 4;
    await dsaTest.save();

    // 5. Create Essay Test for Teacher A
    const essayTest = await Test.create({
      title: 'Impact of Generative AI on Modern Software Engineering',
      description: 'Timed analytical essay writing test evaluating deep critical reasoning.',
      subjectId: pySubject._id,
      teacherId: teacherA._id,
      type: 'essay',
      timerMode: 'full',
      durationMinutes: 20,
      maxAttempts: 1,
      passingPercentage: 40,
      totalMarks: 20,
      isPublished: true,
      instructions: 'Write a well-structured response (minimum 250 words) covering efficiency benefits, security risks, and code quality concerns.',
    });

    // 6. Create Test for Teacher B (to demonstrate Teacher B isolation!)
    const dbmsTest = await Test.create({
      title: 'DBMS SQL & ACID Properties Assessment',
      description: 'Teacher B private assessment test on Transactions, Normalization and Relational Algebra.',
      subjectId: dbmsSubject._id,
      teacherId: teacherB._id,
      type: 'mcq',
      timerMode: 'full',
      durationMinutes: 20,
      maxAttempts: 2,
      passingPercentage: 50,
      isPublished: true,
      totalMarks: 3,
    });

    await Question.insertMany([
      {
        testId: dbmsTest._id,
        questionText: 'Which property ensures that a transaction is all-or-nothing?',
        options: ['Atomicity', 'Consistency', 'Isolation', 'Durability'],
        correctAnswerIndex: 0,
        marks: 1,
        explanation: 'Atomicity guarantees that all operations within a work unit complete successfully or rollback entirely.',
        order: 0,
      },
      {
        testId: dbmsTest._id,
        questionText: 'Which SQL command is used to remove a table structure permanently?',
        options: ['DELETE TABLE', 'REMOVE TABLE', 'DROP TABLE', 'TRUNCATE TABLE'],
        correctAnswerIndex: 2,
        marks: 1,
        explanation: 'DROP TABLE removes the schema definition and all data.',
        order: 1,
      },
      {
        testId: dbmsTest._id,
        questionText: '1NF (First Normal Form) requires that attributes must be:',
        options: ['Atomic values', 'Unique keys', 'Foreign references', 'Indexed'],
        correctAnswerIndex: 0,
        marks: 1,
        explanation: 'First Normal Form requires all column values to be single-valued atomic domain elements.',
        order: 2,
      },
    ]);

    // 7. Seed sample completed attempts for student 1 & student 2 to populate leaderboard
    await TestAttempt.create({
      testId: javaTest._id,
      studentId: student1._id,
      answers: [
        { questionId: createdJavaQuestions[0]._id, selectedOptionIndex: 1, isCorrect: true, marksAwarded: 1 },
        { questionId: createdJavaQuestions[1]._id, selectedOptionIndex: 1, isCorrect: true, marksAwarded: 1 },
        { questionId: createdJavaQuestions[2]._id, selectedOptionIndex: 1, isCorrect: true, marksAwarded: 1 },
        { questionId: createdJavaQuestions[3]._id, selectedOptionIndex: 2, isCorrect: true, marksAwarded: 1 },
        { questionId: createdJavaQuestions[4]._id, selectedOptionIndex: 0, isCorrect: false, marksAwarded: -0.25 },
      ],
      score: 3.75,
      maxMarks: 5,
      accuracy: 80,
      attemptedCount: 5,
      correctCount: 4,
      wrongCount: 1,
      timeTakenSeconds: 320,
      status: 'submitted',
      startedAt: new Date(Date.now() - 3600000),
      submittedAt: new Date(Date.now() - 3600000 + 320000),
    });

    await TestAttempt.create({
      testId: javaTest._id,
      studentId: student2._id,
      answers: [
        { questionId: createdJavaQuestions[0]._id, selectedOptionIndex: 1, isCorrect: true, marksAwarded: 1 },
        { questionId: createdJavaQuestions[1]._id, selectedOptionIndex: 1, isCorrect: true, marksAwarded: 1 },
        { questionId: createdJavaQuestions[2]._id, selectedOptionIndex: 1, isCorrect: true, marksAwarded: 1 },
        { questionId: createdJavaQuestions[3]._id, selectedOptionIndex: 2, isCorrect: true, marksAwarded: 1 },
        { questionId: createdJavaQuestions[4]._id, selectedOptionIndex: 2, isCorrect: true, marksAwarded: 1 },
      ],
      score: 5,
      maxMarks: 5,
      accuracy: 100,
      attemptedCount: 5,
      correctCount: 5,
      wrongCount: 0,
      timeTakenSeconds: 240,
      status: 'submitted',
      startedAt: new Date(Date.now() - 7200000),
      submittedAt: new Date(Date.now() - 7200000 + 240000),
    });

    // Migration safeguard: Ensure all tests in DB have testCode and status
    const legacyTests = await Test.find({
      $or: [{ testCode: { $exists: false } }, { testCode: null }, { status: { $exists: false } }, { status: null }],
    });

    if (legacyTests.length > 0) {
      const { generateUniqueTestCode } = require('./codeGenerator');
      for (const t of legacyTests) {
        if (!t.testCode) {
          t.testCode = await generateUniqueTestCode();
        }
        if (!t.status) {
          t.status = t.isPublished ? 'STARTED' : 'DRAFT';
          if (t.isPublished && !t.startedAt) {
            t.startedAt = new Date();
          }
        }
        await t.save();
      }
      console.log(`✅ Migrated ${legacyTests.length} existing tests with unique test codes and status.`);
    }

    console.log('✅ Initial tests, questions, and sample student attempts seeded successfully!');
  } catch (error) {
    console.error('Error seeding initial data:', error);
  }
};

module.exports = seedInitialData;
