/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'tue-red': '#C8102E',
        'tue-red-dark': '#A00D24',
        'cat-foundational': '#3B82F6',
        'cat-specialization': '#8B5CF6',
        'cat-cse-elective': '#10B981',
        'cat-free-elective': '#F59E0B',
        'cat-seminar': '#EAB308',
        'cat-graduation': '#4F46E5',
      },
    },
  },
  plugins: [],
};
