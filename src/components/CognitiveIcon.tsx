import type { TriggerType } from '../types';

type IconProps = { className?: string; size?: number };

export function TriggerIcon({ type, className = '', size = 18 }: IconProps & { type: TriggerType }) {
  const common = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, className };
  if (type === 'bisociation') return <svg {...common}><circle cx="7" cy="12" r="3.5"/><circle cx="17" cy="12" r="3.5"/><path d="M10.5 12h3M4.5 6.5 7 8.5l2.5-2M14.5 17.5 17 15.5l2.5 2"/></svg>;
  if (type === 'abstraction') return <svg {...common}><path d="M5 19h14M7 15h10M9 11h6M11 7h2M9 5l3-3 3 3M15 19l-3 3-3-3"/></svg>;
  if (type === 'perspective') return <svg {...common}><path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z"/><circle cx="12" cy="12" r="2.7"/><path d="m18.5 4.5 2-2m0 4v-4h-4"/></svg>;
  if (type === 'scamper') return <svg {...common}><path d="M9 18h6M10 22h4M8.2 14.5A6 6 0 1 1 15.8 14.5C14.7 15.3 14.2 16 14 18h-4c-.2-2-.7-2.7-1.8-3.5Z"/></svg>;
  return <svg {...common}><path d="M12 21c-1-6.5 1.4-11.2 7-14-1.1 6.8-3.3 10-7 10M12 21c.1-5.1-2.1-8.4-7-10 0 5.1 2.3 7.7 7 7.7"/></svg>;
}

export function WorkflowIcon({ step, size = 20 }: IconProps & { step: string }) {
  const common = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.7, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  if (step === 'record') return <svg {...common}><path d="M5 3h11l3 3v15H5zM16 3v4h3M8 11h8M8 15h8"/></svg>;
  if (step === 'trigger') return <svg {...common}><path d="M9 18h6M10 21h4M8 14.5a6 6 0 1 1 8 0c-1 .8-1.7 1.8-1.8 3.5H9.8C9.7 16.3 9 15.3 8 14.5Z"/></svg>;
  if (step === 'cluster') return <svg {...common}><circle cx="6" cy="7" r="2.5"/><circle cx="17" cy="6" r="2.5"/><circle cx="12" cy="17" r="2.5"/><path d="m8.4 7.5 6.2-1M7.5 9l3.2 5.8M15.5 8l-2.3 6.6"/></svg>;
  if (step === 'converge') return <svg {...common}><path d="M4 5l6 7-6 7M20 5l-6 7 6 7"/><circle cx="12" cy="12" r="1.5"/></svg>;
  return <svg {...common}><path d="M12 3v12M7 10l5 5 5-5M5 19h14"/></svg>;
}
