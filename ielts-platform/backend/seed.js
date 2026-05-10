require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');
const User     = require('./models/User');
const Course   = require('./models/Course');
const Lesson   = require('./models/Lesson');
const Test     = require('./models/Test');

const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://tung:tung31102004@doan.uznenqk.mongodb.net/';

async function seed() {
  await mongoose.connect(MONGO_URI);
  console.log('Connected to MongoDB');

  await Promise.all([
    User.deleteMany(), Course.deleteMany(),
    Lesson.deleteMany(), Test.deleteMany()
  ]);
  console.log('Cleared existing data');

  // ── Users ──────────────────────────────────────────────────────────────────
  const admin = await User.create({
  name: 'Admin Hệ Thống',
  email: 'admin@ielts.com',
  password: 'admin123',
  role: 'admin'
});

const teacher = await User.create({
  name: 'Nguyễn Thị Lan',
  email: 'teacher@ielts.com',
  password: 'teacher123',
  role: 'teacher'
});

const student = await User.create({
  name: 'Trần Văn Nam',
  email: 'student@ielts.com',
  password: 'student123',
  role: 'student'
});

  // ── Course ─────────────────────────────────────────────────────────────────
  const course = await Course.create({
    title: 'IELTS Foundation – Nền tảng cho người mới bắt đầu',
    description: 'Khóa học toàn diện dành cho người mới bắt đầu học IELTS. Bao gồm 4 kỹ năng Listening, Reading, Writing, Speaking.',
    teacher: teacher._id, level:'Beginner', targetScore:'5.0 - 6.0',
    skills:['Listening','Reading','Writing','Speaking'], isPublished:true, duration:40,
    enrolledStudents: [student._id]
  });

  await User.findByIdAndUpdate(student._id, { $push: { enrolledCourses: course._id } });

  // ── Lessons ────────────────────────────────────────────────────────────────
  const lesson1 = await Lesson.create({
    title:'Giới thiệu IELTS Listening', description:'Tổng quan về phần thi Listening và chiến lược làm bài.',
    course:course._id, teacher:teacher._id, type:'video', skill:'Listening', order:1, isPublished:true,
    content:{ videoUrl:'https://www.youtube.com/embed/dQw4w9WgXcQ', duration:30 }
  });
  const lesson2 = await Lesson.create({
    title:'IELTS Reading – Skimming & Scanning', description:'Kỹ thuật đọc lướt và đọc tìm thông tin.',
    course:course._id, teacher:teacher._id, type:'document', skill:'Reading', order:2, isPublished:true,
    content:{ text:'## Kỹ thuật Skimming\n\nSkimming là đọc lướt để nắm ý chính...\n\n## Kỹ thuật Scanning\n\nScanning là đọc nhanh để tìm thông tin cụ thể...', duration:45 }
  });

  await Course.findByIdAndUpdate(course._id, { $push: { lessons: { $each:[lesson1._id, lesson2._id] } } });

  // ── Test 1: Reading (auto-graded, 4 question types) ───────────────────────
  const readingTest = await Test.create({
    title:'IELTS Reading Practice – Unit 1',
    description:'Bài kiểm tra đa dạng dạng câu hỏi IELTS Reading.',
    course:course._id, teacher:teacher._id, skill:'Reading',
    duration:30, passingScore:60, isPublished:true,
    questions:[
      {
        question:'Kỹ thuật nào dùng để đọc lướt nắm ý chính?',
        type:'multiple-choice', points:1,
        options:['Scanning','Skimming','Intensive Reading','Extensive Reading'],
        correctAnswer:'Skimming',
        explanation:'Skimming là đọc lướt để nắm ý chính, scanning để tìm thông tin cụ thể.'
      },
      {
        question:'IELTS Academic Reading có 3 sections.',
        type:'true-false-notgiven', points:1,
        options:['True','False','Not Given'],
        correctAnswer:'True',
        explanation:'Đúng, IELTS Academic Reading gồm 3 passages trong 60 phút.'
      },
      {
        question:'Ghép loại câu hỏi với kỹ năng tương ứng.',
        type:'matching', points:2,
        matchingPairs:[
          { left:'True/False/Not Given', right:'Reading' },
          { left:'Note Completion',      right:'Listening' },
          { left:'Task 2 Essay',         right:'Writing' }
        ],
        matchingAnswer:'{"0":"Reading","1":"Listening","2":"Writing"}',
        matchingOptions:['Reading','Listening','Writing'],
        explanation:'Mỗi kỹ năng có dạng câu hỏi đặc trưng riêng.'
      },
      {
        question:'IELTS Reading có tổng cộng ___ câu hỏi trong 60 phút.',
        type:'fill-blank', points:1,
        correctAnswer:'40',
        explanation:'Có 40 câu hỏi chia đều cho 3 passages.'
      }
    ]
  });

  // ── Test 2: Writing (manual grading) ──────────────────────────────────────
  const writingTest = await Test.create({
    title:'IELTS Writing Task 1 & Task 2 – Practice',
    description:'Bài thi Writing gồm 2 task. Giáo viên sẽ chấm điểm và phản hồi.',
    course:course._id, teacher:teacher._id, skill:'Writing',
    duration:60, passingScore:60, isPublished:true,
    requiresManualGrading:true,
    questions:[
      {
        question:'IELTS Writing Task 1: The chart below shows the percentage of households in owned and rented accommodation in England and Wales between 1918 and 2011.\n\nSummarise the information by selecting and reporting the main features, and make comparisons where relevant.',
        type:'writing', points:4,
        taskType:'Task 1', minWords:150, maxWords:200,
        rubric:'Chấm theo Task Achievement, Coherence & Cohesion, Lexical Resource, Grammatical Range & Accuracy'
      },
      {
        question:'IELTS Writing Task 2: Some people believe that it is best to accept a bad situation, such as an unsatisfactory job or shortage of money. Others argue that it is better to try and improve such situations.\n\nDiscuss both these views and give your own opinion.',
        type:'writing', points:4,
        taskType:'Task 2', minWords:250, maxWords:320,
        rubric:'Viết luận điểm rõ ràng, có ví dụ cụ thể, kết luận thuyết phục'
      }
    ]
  });

  await Course.findByIdAndUpdate(course._id, {
    $push: { tests: { $each:[readingTest._id, writingTest._id] } }
  });

  console.log('\n✅ Seed hoàn thành!');
  console.log('📋 Tài khoản demo:');
  console.log('  Admin:   admin@ielts.com   / admin123');
  console.log('  Teacher: teacher@ielts.com / teacher123');
  console.log('  Student: student@ielts.com / student123');
  console.log('\n📚 Dữ liệu tạo ra:');
  console.log('  1 khóa học, 2 bài học, 2 đề kiểm tra');
  console.log('  Reading test: 4 loại câu hỏi (MC + TF/NG + Matching + Fill-blank)');
  console.log('  Writing test: Task 1 + Task 2 (manual grading)');

  process.exit(0);
}

seed().catch(err => { console.error(err); process.exit(1); });
