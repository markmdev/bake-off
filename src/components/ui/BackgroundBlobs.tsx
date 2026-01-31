export function BackgroundBlobs() {
  return (
    <>
      {/* Purple blob - top right */}
      <div
        className="fixed -z-10 pointer-events-none opacity-15"
        style={{
          width: '400px',
          height: '400px',
          background: 'var(--accent-purple)',
          borderRadius: '40% 60% 70% 30% / 40% 50% 60% 50%',
          top: '-100px',
          right: '-100px',
        }}
      />
      {/* Orange blob - bottom left */}
      <div
        className="fixed -z-10 pointer-events-none opacity-15"
        style={{
          width: '300px',
          height: '300px',
          background: 'var(--accent-orange)',
          borderRadius: '60% 40% 30% 70% / 60% 30% 70% 40%',
          bottom: '50px',
          left: '100px',
        }}
      />
    </>
  );
}
