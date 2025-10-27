/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./**/*.{js,ts,jsx,tsx}",
  ],
  // Add a safelist to ensure dynamic classes for colors are not purged
  safelist: [
    // Pink
    'border-pink-500', 'bg-pink-500', 'hover:bg-pink-600', 'bg-pink-50', 'border-pink-200', 'dark:border-pink-500/50', 'text-pink-700', 'dark:text-pink-300', 'hover:border-pink-400', 'dark:hover:border-pink-400', 'hover:bg-pink-100', 'text-pink-800', 'dark:text-pink-300',
    
    // Indigo
    'border-indigo-500', 'bg-indigo-500', 'hover:bg-indigo-600', 'bg-indigo-50', 'border-indigo-200', 'dark:border-indigo-500/50', 'text-indigo-700', 'dark:text-indigo-300', 'hover:border-indigo-400', 'dark:hover:border-indigo-400', 'text-indigo-800', 'dark:text-indigo-300',

    // Amber
    'border-amber-700', 'bg-amber-700', 'hover:bg-amber-800', 'bg-amber-50', 'border-amber-200', 'dark:border-amber-500/50', 'bg-amber-800/10', 'border-amber-300', 'text-amber-800', 'dark:text-amber-300', 'hover:border-amber-400', 'dark:hover:border-amber-400', 'text-amber-900', 'dark:text-amber-300',

    // Red
    'border-red-500', 'bg-red-500', 'hover:bg-red-600', 'bg-red-50', 'border-red-200', 'dark:border-red-500/50', 'bg-red-100', 'text-red-700', 'dark:text-red-300', 'hover:border-red-400', 'dark:hover:border-red-400', 'hover:bg-red-100', 'text-red-800', 'hover:bg-red-50/50', 'dark:text-red-300',

    // Blue (Added)
    'border-blue-500', 'bg-blue-500', 'hover:bg-blue-600', 'bg-blue-50', 'border-blue-200', 'dark:border-blue-500/50', 'text-blue-700', 'dark:text-blue-300', 'hover:border-blue-400', 'dark:hover:border-blue-400', 'text-blue-800', 'dark:text-blue-300',

    // Orange (Added)
    'border-orange-500', 'bg-orange-500', 'hover:bg-orange-600', 'bg-orange-50', 'border-orange-200', 'dark:border-orange-500/50', 'text-orange-700', 'dark:text-orange-300', 'hover:border-orange-400', 'dark:hover:border-orange-400', 'text-orange-800', 'dark:text-orange-300',
    
    // Green (Added)
    'border-green-500', 'bg-green-500', 'hover:bg-green-600', 'bg-green-50', 'border-green-200', 'dark:border-green-500/50', 'text-green-700', 'dark:text-green-300', 'hover:border-green-400', 'dark:hover:border-green-400', 'text-green-800', 'dark:text-green-300', 'text-green-500',

    // Purple (Added)
    'border-purple-500', 'bg-purple-500', 'hover:bg-purple-600', 'bg-purple-50', 'border-purple-200', 'dark:border-purple-500/50', 'text-purple-700', 'dark:text-purple-300', 'hover:border-purple-400', 'dark:hover:border-purple-400', 'text-purple-800', 'dark:text-purple-300',
    
    // Teal (Added)
    'border-teal-500', 'bg-teal-500', 'hover:bg-teal-600', 'bg-teal-50', 'border-teal-200', 'dark:border-teal-500/50', 'text-teal-700', 'dark:text-teal-300', 'hover:border-teal-400', 'dark:hover:border-teal-400', 'text-teal-800', 'dark:text-teal-300',

    // Cyan (Added)
    'border-cyan-500', 'bg-cyan-500', 'hover:bg-cyan-600', 'bg-cyan-50', 'border-cyan-200', 'dark:border-cyan-500/50', 'text-cyan-700', 'dark:text-cyan-300', 'hover:border-cyan-400', 'dark:hover:border-cyan-400', 'text-cyan-800', 'dark:text-cyan-300'
  ],
  darkMode: 'class',
  theme: {
    extend: {},
  },
  plugins: [],
}