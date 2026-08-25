/**
 * 手帐风格基础元件：回形针 / 胶带 / 图章 / 档案标题
 * 全部为纯 SVG + CSS，无图片依赖。
 */

/** 回形针。夹在纸卡上边缘，视觉上"压住"纸张。 */
export function Paperclip({
  className = '',
  size = 46,
  rotate = -8,
}: {
  className?: string;
  size?: number;
  rotate?: number;
}) {
  return (
    <svg
      width={size}
      height={size * 2.1}
      viewBox="0 0 40 84"
      className={className}
      style={{ transform: `rotate(${rotate}deg)` }}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="clipMetal" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#5f5f59" />
          <stop offset="18%" stopColor="#cfcfc8" />
          <stop offset="38%" stopColor="#8a8a83" />
          <stop offset="62%" stopColor="#f2f2ec" />
          <stop offset="84%" stopColor="#9a9a92" />
          <stop offset="100%" stopColor="#63635d" />
        </linearGradient>
      </defs>
      {/* 外圈 */}
      <path
        d="M13 76 L13 20 A9 9 0 0 1 31 20 L31 62"
        fill="none"
        stroke="rgba(40,32,18,0.42)"
        strokeWidth="7"
        strokeLinecap="round"
      />
      <path
        d="M13 76 L13 20 A9 9 0 0 1 31 20 L31 62"
        fill="none"
        stroke="url(#clipMetal)"
        strokeWidth="4.6"
        strokeLinecap="round"
      />
      {/* 内圈 */}
      <path
        d="M22 70 L22 30 A4.5 4.5 0 0 0 13 30 L13 58"
        fill="none"
        stroke="rgba(40,32,18,0.34)"
        strokeWidth="6"
        strokeLinecap="round"
      />
      <path
        d="M22 70 L22 30 A4.5 4.5 0 0 0 13 30 L13 58"
        fill="none"
        stroke="url(#clipMetal)"
        strokeWidth="3.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

/** 胶带条 */
export function Tape({
  className = '',
  rotate = -3,
  width = 78,
}: {
  className?: string;
  rotate?: number;
  width?: number;
}) {
  return (
    <span
      className={`tape ${className}`}
      style={{ transform: `rotate(${rotate}deg)`, width }}
      aria-hidden="true"
    />
  );
}

/** 圆形橡皮图章 */
export function Stamp({
  lines,
  size = 78,
  rotate = -8,
  className = '',
}: {
  lines: string[];
  size?: number;
  rotate?: number;
  className?: string;
}) {
  return (
    <span
      className={`stamp inline-flex flex-col items-center justify-center text-center ${className}`}
      style={{ width: size, height: size, transform: `rotate(${rotate}deg)` }}
      aria-hidden="true"
    >
      {lines.map((l) => (
        <span key={l} className="text-[9px] leading-[1.25]">
          {l}
        </span>
      ))}
    </span>
  );
}

/**
 * 档案式区块标题：主标题 + 斜杠分隔的元信息
 * 视觉参考实体档案袋上的标签条。
 */
export function ArchiveLabel({
  title,
  meta,
  className = '',
}: {
  title: string;
  meta?: string[];
  className?: string;
}) {
  return (
    <div className={className}>
      <div className="label-title inline-block text-[13px] font-semibold tracking-[0.14em] text-ink">
        {title}
      </div>
      {meta && meta.length > 0 && (
        <div className="meta-line mt-1 text-[10px] uppercase">
          {meta.join(' / ')}
        </div>
      )}
    </div>
  );
}

/** 手绘风格分隔线 */
export function HandDrawnRule({ className = '' }: { className?: string }) {
  return (
    <svg
      className={className}
      height="6"
      width="100%"
      preserveAspectRatio="none"
      viewBox="0 0 300 6"
      aria-hidden="true"
    >
      <path
        d="M1 3.2 C 40 1.4, 78 4.6, 118 2.8 S 196 1.2, 236 3.6 S 286 2.2, 299 3"
        fill="none"
        stroke="rgba(79,69,52,0.42)"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
    </svg>
  );
}
