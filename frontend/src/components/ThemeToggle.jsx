import { useRef } from 'react';
import { useTheme } from '../ThemeContext';

function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const audioRef = useRef(null);

  const handleClick = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {}); // ignore if browser blocks autoplay
    }
    toggleTheme();
  };

  return (
    <>
      <audio ref={audioRef} src="/click.mp3" preload="auto" />
      <button
        onClick={handleClick}
        aria-label="Toggle theme"
        className="relative w-14 h-8 rounded-full flex items-center px-1 transition-colors duration-300"
        style={{
          backgroundColor: theme === 'dark' ? '#1e293b' : '#fbbf24',
        }}
      >
        <span
          className="w-6 h-6 rounded-full flex items-center justify-center text-sm transition-transform duration-300 ease-in-out"
          style={{
            backgroundColor: theme === 'dark' ? '#0f172a' : '#ffffff',
            transform: theme === 'dark' ? 'translateX(24px)' : 'translateX(0px)',
          }}
        >
          {theme === 'dark' ? '🌙' : '☀️'}
        </span>
      </button>
    </>
  );
}

export default ThemeToggle;