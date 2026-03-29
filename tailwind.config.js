/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./views/**/*.ejs', './src/**/*.js', './api/**/*.js'],
  // These classes are injected dynamically at runtime from weatherViewModelBuilder
  // so the content scanner cannot detect them — they must be safelisted.
  safelist: [
    // Gradient backgrounds from CONDITION_STYLES in helpers.js
    'from-gray-800',
    'via-purple-900',
    'to-gray-900',
    'from-blue-400',
    'to-slate-600',
    'from-blue-500',
    'to-slate-700',
    'from-blue-100',
    'to-slate-300',
    'from-yellow-300',
    'via-amber-200',
    'to-sky-400',
    'from-slate-400',
    'from-slate-300',
    'to-slate-500',
    'from-sky-400',
    'to-blue-600',
    // Text colours passed as variables
    'text-white',
    'text-slate-800',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};
