export function AppLogo({ size = 52 }: { size?: number }) {
  const cell = Math.round(size * 0.27);
  const gap = Math.round(size * 0.1);

  return (
    <div
      className="flex items-center justify-center rounded-[14px] bg-[#F26522]"
      style={{ width: size, height: size }}
    >
      <div
        className="grid grid-cols-2"
        style={{ gap, width: cell * 2 + gap, height: cell * 2 + gap }}
      >
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="rounded-[3px] bg-white"
            style={{ width: cell, height: cell }}
          />
        ))}
      </div>
    </div>
  );
}
