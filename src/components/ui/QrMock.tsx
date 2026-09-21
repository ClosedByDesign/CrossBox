/**
 * Deterministisches QR-Muster aus einem Token – sieht aus wie ein echter Code,
 * braucht aber keine Bibliothek und keinen externen Dienst.
 */
export function QrMock({ token, size = 200 }: { token: string; size?: number }) {
  const cells = 21;
  let hash = 2166136261;
  for (let i = 0; i < token.length; i++) {
    hash ^= token.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }

  const filled: boolean[] = [];
  let state = hash >>> 0;
  for (let i = 0; i < cells * cells; i++) {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    filled.push((state >>> 16) % 100 < 46);
  }

  const isFinder = (x: number, y: number) => {
    const inBox = (bx: number, by: number) => x >= bx && x < bx + 7 && y >= by && y < by + 7;
    return inBox(0, 0) || inBox(cells - 7, 0) || inBox(0, cells - 7);
  };

  const finderCell = (x: number, y: number) => {
    const local = (bx: number, by: number) => ({ dx: x - bx, dy: y - by });
    const boxes = [
      { bx: 0, by: 0 },
      { bx: cells - 7, by: 0 },
      { bx: 0, by: cells - 7 },
    ];
    for (const box of boxes) {
      const { dx, dy } = local(box.bx, box.by);
      if (dx < 0 || dy < 0 || dx > 6 || dy > 6) continue;
      const ring = Math.max(Math.abs(dx - 3), Math.abs(dy - 3));
      return ring === 0 || ring === 1 || ring === 3;
    }
    return false;
  };

  const unit = size / cells;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label="Persönlicher Check-in-Code">
      <rect width={size} height={size} rx={8} fill="#ffffff" />
      {Array.from({ length: cells }).map((_, y) =>
        Array.from({ length: cells }).map((__, x) => {
          const on = isFinder(x, y) ? finderCell(x, y) : filled[y * cells + x];
          if (!on) return null;
          return <rect key={`${x}-${y}`} x={x * unit} y={y * unit} width={unit} height={unit} fill="#12151a" />;
        }),
      )}
    </svg>
  );
}
