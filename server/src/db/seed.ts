// ============================================================
// Seed data: All TU/e CSE Master curriculum courses
// Pre-populates the courses table on first run
// ============================================================

import type Database from 'better-sqlite3';

interface SeedCourse {
  code: string;
  name: string;
  credits: number;
  focus_area: string | null;
  course_type: string;
  quarter: string;
}

// ── Focus Area: Algorithms & Theory ──────────────────────────

const algoTheoryFoundational: SeedCourse[] = [
  { code: '2IMA10', name: 'Advanced Algorithms',    credits: 5, focus_area: 'algo_theory', course_type: 'foundational', quarter: '1' },
  { code: '2IMF25', name: 'Automated Reasoning',    credits: 5, focus_area: 'algo_theory', course_type: 'foundational', quarter: '1' },
  { code: '2IMF10', name: 'Process Algebra',         credits: 5, focus_area: 'algo_theory', course_type: 'foundational', quarter: '4' },
];

const algoTheoryDeepening: SeedCourse[] = [
  { code: '2IMA50', name: 'Algorithms for Collective Decision Making', credits: 5, focus_area: 'algo_theory', course_type: 'deepening', quarter: '1' },
  { code: '2IMA25', name: 'Exact Algorithms for NP-hard Problems',     credits: 5, focus_area: 'algo_theory', course_type: 'deepening', quarter: '1' },
  { code: '2IMA35', name: 'Massively Parallel Algorithms',             credits: 5, focus_area: 'algo_theory', course_type: 'deepening', quarter: '2' },
  { code: '2IMA15', name: 'Geometric Algorithms',                      credits: 5, focus_area: 'algo_theory', course_type: 'deepening', quarter: '2' },
  { code: '2IMA20', name: 'Algorithms for Geovisualization',           credits: 5, focus_area: 'algo_theory', course_type: 'deepening', quarter: '3' },
  { code: '2IMF15', name: 'Proving with Computer Assistance',          credits: 5, focus_area: 'algo_theory', course_type: 'deepening', quarter: '3' },
  { code: '2IMF40', name: 'Modeling and Verification of Probabilistic Systems', credits: 5, focus_area: 'algo_theory', course_type: 'deepening', quarter: '3' },
  { code: '2IMA45', name: 'Computational Topology',                    credits: 5, focus_area: 'algo_theory', course_type: 'deepening', quarter: '4' },
];

// ── Focus Area: Architecture & Systems ───────────────────────

const archSystemsFoundational: SeedCourse[] = [
  { code: '2IMN10', name: 'Architecture of Distributed Systems', credits: 5, focus_area: 'arch_systems', course_type: 'foundational', quarter: '1' },
  { code: '2IMF30', name: 'System Validation',                    credits: 5, focus_area: 'arch_systems', course_type: 'foundational', quarter: '1' },
  { code: '2IMD10', name: 'Engineering of Data-Intensive Systems', credits: 5, focus_area: 'arch_systems', course_type: 'foundational', quarter: '2' },
];

const archSystemsDeepening: SeedCourse[] = [
  { code: '2IMF35', name: 'Algorithms for Model Checking',                        credits: 5, focus_area: 'arch_systems', course_type: 'deepening', quarter: '2' },
  { code: '2IMN15', name: 'Internet of Things',                                   credits: 5, focus_area: 'arch_systems', course_type: 'deepening', quarter: '2' },
  { code: '2IMN20', name: 'Real-Time Systems',                                    credits: 5, focus_area: 'arch_systems', course_type: 'deepening', quarter: '2' },
  { code: '2IMN25', name: 'Quantitative Evaluation of Cyber-Physical Systems',    credits: 5, focus_area: 'arch_systems', course_type: 'deepening', quarter: '3' },
  { code: '2IMN45', name: 'Edge Computing',                                       credits: 5, focus_area: 'arch_systems', course_type: 'deepening', quarter: '3' },
];

// ── Focus Area: Software & Analytics ─────────────────────────

const softAnalyticsFoundational: SeedCourse[] = [
  { code: '2AMI10', name: 'Foundations in Process Mining',  credits: 5, focus_area: 'soft_analytics', course_type: 'foundational', quarter: '1' },
  { code: '2IMP10', name: 'Program Verification Techniques', credits: 5, focus_area: 'soft_analytics', course_type: 'foundational', quarter: '2' },
  { code: '2IMP25', name: 'Software Evolution',              credits: 5, focus_area: 'soft_analytics', course_type: 'foundational', quarter: '3' },
];

const softAnalyticsDeepening: SeedCourse[] = [
  { code: '2AMM20', name: 'Research Topics in Data Mining',         credits: 5, focus_area: 'soft_analytics', course_type: 'deepening', quarter: '1' },
  { code: '2IMP40', name: 'Empirical Methods in Software Engineering', credits: 5, focus_area: 'soft_analytics', course_type: 'deepening', quarter: '2' },
  { code: '2IMP60', name: 'Human-Computer Interaction',              credits: 5, focus_area: 'soft_analytics', course_type: 'deepening', quarter: '2' },
  { code: '2IMN30', name: 'Machine Learning for Industry',           credits: 5, focus_area: 'soft_analytics', course_type: 'deepening', quarter: '3' },
  { code: '2AMD15', name: 'Big Data Management',                     credits: 5, focus_area: 'soft_analytics', course_type: 'deepening', quarter: '3' },
  { code: '2IMP30', name: 'System Design Engineering',               credits: 5, focus_area: 'soft_analytics', course_type: 'deepening', quarter: '4' },
  { code: '2IMP20', name: 'Domain Specific Language Design',         credits: 5, focus_area: 'soft_analytics', course_type: 'deepening', quarter: '4' },
];

// ── CSE Electives ────────────────────────────────────────────

const cseElectives: SeedCourse[] = [
  { code: '2IMS10', name: 'Physical Aspects of Digital Security',  credits: 5,  focus_area: null, course_type: 'cse_elective', quarter: '1' },
  { code: '2IMS25', name: 'Principles of Data Protection',         credits: 5,  focus_area: null, course_type: 'cse_elective', quarter: '1' },
  { code: '2IMP15', name: 'Software Project Management',           credits: 5,  focus_area: null, course_type: 'cse_elective', quarter: '1,2' },
  { code: '2DMI20', name: 'Software Security',                     credits: 5,  focus_area: null, course_type: 'cse_elective', quarter: '2' },
  { code: '2IMS20', name: 'Cyberattacks, Crime and Defenses',      credits: 5,  focus_area: null, course_type: 'cse_elective', quarter: '2' },
  { code: '2IMV10', name: 'Visual Computing Project',              credits: 5,  focus_area: null, course_type: 'cse_elective', quarter: '2' },
  { code: '2AMM15', name: 'Machine Learning Engineering',          credits: 5,  focus_area: null, course_type: 'cse_elective', quarter: '3' },
  { code: '2IMS15', name: 'Verification of Security Protocols',    credits: 5,  focus_area: null, course_type: 'cse_elective', quarter: '3' },
  { code: '2IMS40', name: 'Intrusion Detection Laboratory',        credits: 5,  focus_area: null, course_type: 'cse_elective', quarter: '3' },
  { code: '2IMV15', name: 'Simulation in Computer Graphics',       credits: 5,  focus_area: null, course_type: 'cse_elective', quarter: '3' },
  { code: '2IMS30', name: 'Wireless IoT Security',                 credits: 5,  focus_area: null, course_type: 'cse_elective', quarter: '3' },
  { code: '2IMV30', name: 'Interactive Visualization',             credits: 5,  focus_area: null, course_type: 'cse_elective', quarter: '3' },
  { code: '2IMD20', name: 'Language Virtual Machines Design and Implementation', credits: 5, focus_area: null, course_type: 'cse_elective', quarter: '3' },
  { code: '2AMM10', name: 'Deep Learning',                         credits: 5,  focus_area: null, course_type: 'cse_elective', quarter: '4' },
  { code: '2IMS60', name: 'Provable Security',                     credits: 5,  focus_area: null, course_type: 'cse_elective', quarter: '4' },
  { code: '2IMS55', name: 'Quantum Protocols',                     credits: 5,  focus_area: null, course_type: 'cse_elective', quarter: '4' },
  { code: '2DM100', name: 'Cryptographic Engineering',             credits: 5,  focus_area: null, course_type: 'cse_elective', quarter: '4' },
  { code: '2IMC10', name: 'Internship',                            credits: 15, focus_area: null, course_type: 'cse_elective', quarter: 'year' },
];

// ── Seminars ─────────────────────────────────────────────────

const seminars: SeedCourse[] = [
  { code: '2IMD00', name: 'Seminar Data Management',                                      credits: 5, focus_area: null, course_type: 'seminar', quarter: '2' },
  { code: '2IMF00', name: 'Seminar Formal System Analysis',                                credits: 5, focus_area: null, course_type: 'seminar', quarter: '4' },
  { code: '2IMI00', name: 'Seminar Process Analytics',                                     credits: 5, focus_area: null, course_type: 'seminar', quarter: '1' },
  { code: '2IMM00', name: 'Seminar Data Mining',                                           credits: 5, focus_area: null, course_type: 'seminar', quarter: '2' },
  { code: '2IMN00', name: 'Seminar Interconnected Resource-aware Intelligent Systems (IRIS)', credits: 5, focus_area: null, course_type: 'seminar', quarter: '4' },
  { code: '2IMP00', name: 'Seminar Software Engineering and Technology',                   credits: 5, focus_area: null, course_type: 'seminar', quarter: '4' },
  { code: '2IMU00', name: 'Seminar Uncertainty in AI',                                     credits: 5, focus_area: null, course_type: 'seminar', quarter: '2' },
  { code: '2IMV00', name: 'Seminar Visualization',                                         credits: 5, focus_area: null, course_type: 'seminar', quarter: '1' },
  { code: '2IMA00', name: 'Seminar Algorithms',                                            credits: 5, focus_area: null, course_type: 'seminar', quarter: '4' },
  { code: '2IMS00', name: 'Seminar Cybersecurity',                                         credits: 5, focus_area: null, course_type: 'seminar', quarter: '4' },
];

// ── Graduation ───────────────────────────────────────────────

const graduation: SeedCourse[] = [
  { code: '2IMC05', name: 'Preparation Graduation Project', credits: 10, focus_area: null, course_type: 'graduation', quarter: 'year' },
  { code: '2IMC00', name: 'Master Project',                 credits: 30, focus_area: null, course_type: 'graduation', quarter: 'year' },
  { code: '2IMR10', name: 'Study and Career Orientation (SCOP/e)', credits: 0, focus_area: null, course_type: 'graduation', quarter: 'year' },
];

// ── Seed function ────────────────────────────────────────────

export function seedDatabase(db: Database.Database): void {
  const allCourses: SeedCourse[] = [
    ...algoTheoryFoundational,
    ...algoTheoryDeepening,
    ...archSystemsFoundational,
    ...archSystemsDeepening,
    ...softAnalyticsFoundational,
    ...softAnalyticsDeepening,
    ...cseElectives,
    ...seminars,
    ...graduation,
  ];

  const insert = db.prepare(`
    INSERT INTO courses (code, name, credits, focus_area, course_type, quarter, is_custom)
    VALUES (@code, @name, @credits, @focus_area, @course_type, @quarter, 0)
  `);

  const insertMany = db.transaction((courses: SeedCourse[]) => {
    for (const course of courses) {
      insert.run(course);
    }
  });

  insertMany(allCourses);
}
