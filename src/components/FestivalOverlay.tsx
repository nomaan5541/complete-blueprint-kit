import { useEffect, useState } from "react";
import { FestivalTheme } from "@/hooks/useFestivalTheme";

export function FestivalOverlay({ theme }: { theme: FestivalTheme }) {
  if (!theme || !theme.apply_to_whole_page) return null;

  const animationClass = theme.animation_class;

  // Render elements based on the theme
  if (animationClass === "snow-fall") {
    // Render 50 snowflakes
    return (
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden" aria-hidden="true">
        {Array.from({ length: 50 }).map((_, i) => (
          <div
            key={i}
            className="absolute bg-white rounded-full opacity-70 animate-snow"
            style={{
              width: `${Math.random() * 8 + 4}px`,
              height: `${Math.random() * 8 + 4}px`,
              left: `${Math.random() * 100}vw`,
              animationDuration: `${Math.random() * 5 + 5}s`,
              animationDelay: `-${Math.random() * 5}s`,
            }}
          />
        ))}
      </div>
    );
  }

  if (animationClass === "diwali-sparkle") {
    return (
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden" aria-hidden="true">
        {Array.from({ length: 30 }).map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full animate-sparkle"
            style={{
              width: `${Math.random() * 6 + 2}px`,
              height: `${Math.random() * 6 + 2}px`,
              left: `${Math.random() * 100}vw`,
              top: `${Math.random() * 100}vh`,
              background: Math.random() > 0.5 ? '#fffbcc' : '#ffb703',
              boxShadow: '0 0 10px 2px rgba(255, 200, 0, 0.6)',
              animationDuration: `${Math.random() * 2 + 1.5}s`,
              animationDelay: `-${Math.random() * 2}s`,
            }}
          />
        ))}
        {/* Diyas at the bottom */}
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={`diya-${i}`} className="absolute bottom-0 text-4xl animate-bounce" style={{
            left: `${20 + i * 15}vw`,
            animationDelay: `${i * 0.2}s`,
            filter: 'drop-shadow(0 -5px 15px rgba(255, 100, 0, 0.5))'
          }}>
            🪔
          </div>
        ))}
      </div>
    );
  }

  if (animationClass === "holi-colors") {
    const colors = ['#ff0a54', '#ff477e', '#ff7096', '#ff85a1', '#fbb1bd', '#f9bec7', '#8338ec', '#3a86ff', '#ffbe0b', '#fb5607', '#ff006e'];
    return (
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden" aria-hidden="true">
        {Array.from({ length: 15 }).map((_, i) => {
          const color = colors[Math.floor(Math.random() * colors.length)];
          return (
            <div
              key={i}
              className="absolute mix-blend-multiply opacity-40 animate-pulse"
              style={{
                width: `${Math.random() * 200 + 100}px`,
                height: `${Math.random() * 200 + 100}px`,
                left: `${Math.random() * 100}vw`,
                top: `${Math.random() * 100}vh`,
                background: `radial-gradient(circle, ${color} 0%, rgba(255,255,255,0) 70%)`,
                transform: `rotate(${Math.random() * 360}deg) scale(${Math.random() * 0.5 + 0.5})`,
                animationDuration: `${Math.random() * 4 + 3}s`,
                animationDelay: `-${Math.random() * 2}s`,
              }}
            />
          );
        })}
      </div>
    );
  }

  if (animationClass === "tricolor-wave") {
    return (
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden" aria-hidden="true">
        <div className="absolute top-0 left-0 right-0 h-32 opacity-20 bg-gradient-to-b from-orange-500 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 h-32 opacity-20 bg-gradient-to-t from-green-600 to-transparent" />
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={`kite-${i}`} className="absolute text-2xl animate-float-slow" style={{
            left: `${Math.random() * 100}vw`,
            top: `${Math.random() * 40}vh`,
            animationDuration: `${Math.random() * 5 + 10}s`,
            animationDelay: `-${Math.random() * 5}s`,
          }}>
            🪁
          </div>
        ))}
      </div>
    );
  }

  if (animationClass === "school-bounce") {
    const elements = ["📚", "🎒", "✏️", "📐", "🔬", "🍎"];
    return (
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden" aria-hidden="true">
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={i}
            className="absolute text-3xl opacity-20 animate-float"
            style={{
              left: `${Math.random() * 100}vw`,
              top: `${Math.random() * 100}vh`,
              animationDuration: `${Math.random() * 6 + 6}s`,
              animationDelay: `-${Math.random() * 5}s`,
              transform: `rotate(${Math.random() * 360}deg)`
            }}
          >
            {elements[Math.floor(Math.random() * elements.length)]}
          </div>
        ))}
      </div>
    );
  }

  if (animationClass === "crescent-glow") {
    return (
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden" aria-hidden="true">
        <div className="absolute top-10 right-10 text-8xl opacity-30 animate-pulse drop-shadow-[0_0_30px_rgba(255,255,255,0.8)] filter">
          🌙
        </div>
        {Array.from({ length: 40 }).map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full animate-twinkle"
            style={{
              width: `${Math.random() * 3 + 1}px`,
              height: `${Math.random() * 3 + 1}px`,
              left: `${Math.random() * 100}vw`,
              top: `${Math.random() * 70}vh`, // Mostly top portion
              background: '#fff',
              boxShadow: '0 0 5px 1px rgba(255, 255, 255, 0.8)',
              animationDuration: `${Math.random() * 3 + 2}s`,
              animationDelay: `-${Math.random() * 3}s`,
            }}
          />
        ))}
      </div>
    );
  }

  // Fallback
  return null;
}
