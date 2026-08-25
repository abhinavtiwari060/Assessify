import React from 'react';
import { User, GraduationCap, Code2, Mail, Github, Linkedin, Cpu } from 'lucide-react';
import developerPhoto from './IMG-20260817-WA0012.jpeg';

const AboutDeveloper = () => {
  const developer = {
    name: 'Abhinav Kumar Tiwari',
    role: 'Full-Stack Developer',
    photo: developerPhoto || '/IMG-20260817-WA0012.jpeg',
    bio: 'Software engineer passionate about building clean, efficient, and scalable web applications for education and automated evaluations.',
    education: 'MCA Student',
    email: 'abhitiwariaj@gmail.com',
    github: 'https://github.com/abhinavtiwari060',
    linkedin: 'https://linkedin.com',
    skills: [
      'React.js (v18)',
      'Vite',
      'Tailwind CSS',
      'Node.js & Express.js',
      'MongoDB & Mongoose',
      'JWT Authentication & Bcrypt',
      'PDF Parsing (pdf-parse & Multer)',
    ],
  };

  return (
    <div className="py-8 sm:py-10 max-w-3xl mx-auto px-4 sm:px-6 space-y-6">
      {/* Profile Card */}
      <div className="bg-[var(--bg-card)] rounded-2xl p-6 sm:p-8 border border-[var(--border)] shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
          {/* Responsive Developer Photo */}
          <div className="w-[140px] h-[140px] sm:w-[170px] sm:h-[170px] lg:w-[200px] lg:h-[200px] rounded-2xl overflow-hidden shadow-md ring-2 ring-[#FA8128]/30 shrink-0">
            <img
              src={developer.photo}
              alt={developer.name}
              className="w-full h-full object-cover object-center"
            />
          </div>

          {/* Details */}
          <div className="space-y-3 text-center sm:text-left flex-1">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-[#FA8128]">
                Developer Profile
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--text-main)]">
                {developer.name}
              </h1>
              <p className="text-sm font-medium text-[var(--text-sub)] mt-0.5">
                {developer.role}
              </p>
            </div>

            <p className="text-sm text-[var(--text-sub)] leading-relaxed">
              {developer.bio}
            </p>

            <div className="flex items-center justify-center sm:justify-start gap-2 text-xs text-[var(--text-sub)] pt-1">
              <GraduationCap className="w-4 h-4 text-[#FA8128] shrink-0" />
              <span>{developer.education}</span>
            </div>

            {/* Social / Contact Links */}
            <div className="flex items-center justify-center sm:justify-start gap-3 pt-2">
              <a
                href={`mailto:${developer.email}`}
                className="px-3.5 py-1.5 rounded-xl bg-[#FA8128] hover:bg-[#E06D1A] text-white text-xs font-semibold inline-flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
              >
                <Mail className="w-3.5 h-3.5" />
                <span>Contact Email</span>
              </a>
              <a
                href={developer.github}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3.5 py-1.5 rounded-xl bg-[var(--bg-sub)] hover:bg-[var(--bg-card-hover)] text-[var(--text-main)] border border-[var(--border)] text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Github className="w-3.5 h-3.5" />
                <span>GitHub</span>
              </a>
              <a
                href={developer.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3.5 py-1.5 rounded-xl bg-[var(--bg-sub)] hover:bg-[var(--bg-card-hover)] text-[var(--text-main)] border border-[var(--border)] text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Linkedin className="w-3.5 h-3.5 text-blue-500" />
                <span>LinkedIn</span>
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Tech Stack & Skills */}
      <div className="bg-[var(--bg-card)] rounded-2xl p-6 sm:p-8 border border-[var(--border)] shadow-sm space-y-4">
        <h2 className="text-base font-bold text-[var(--text-main)] flex items-center gap-2">
          <Cpu className="w-4 h-4 text-[#FA8128]" />
          <span>Technologies Used to Build Platform</span>
        </h2>
        <div className="flex flex-wrap gap-2">
          {developer.skills.map((skill, i) => (
            <span
              key={i}
              className="px-3 py-1 rounded-xl bg-[var(--bg-sub)] text-[var(--text-sub)] text-xs font-medium border border-[var(--border)]"
            >
              {skill}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AboutDeveloper;
