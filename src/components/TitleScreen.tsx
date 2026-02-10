'use client';

interface TitleScreenProps {
  onStart: () => void;
}

export default function TitleScreen({ onStart }: TitleScreenProps) {
  return (
    <div
      className="absolute inset-0 flex flex-col items-center justify-center z-10"
      onClick={onStart}
      onTouchEnd={(e) => { e.preventDefault(); onStart(); }}
    >
      {/* Rendered via canvas - this is a fallback */}
    </div>
  );
}
