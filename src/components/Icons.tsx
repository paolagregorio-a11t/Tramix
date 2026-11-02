export function Bell({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M6 9a6 6 0 1 1 12 0c0 6 2.5 7.5 2.5 7.5h-17S6 15 6 9" />
      <path d="M10 20a2 2 0 0 0 4 0" />
    </svg>
  );
}

const base = { fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round" } as const;
export const IconHome = ({ size = 22 }: { size?: number }) => <svg width={size} height={size} viewBox="0 0 24 24" {...base} aria-hidden="true"><path d="M3 11l9-8 9 8" /><path d="M5 10v10h14V10" /></svg>;
export const IconList = ({ size = 22 }: { size?: number }) => <svg width={size} height={size} viewBox="0 0 24 24" {...base} aria-hidden="true"><path d="M8 6h13M8 12h13M8 18h13" /><circle cx="3.5" cy="6" r=".8" /><circle cx="3.5" cy="12" r=".8" /><circle cx="3.5" cy="18" r=".8" /></svg>;
export const IconGear = ({ size = 22 }: { size?: number }) => <svg width={size} height={size} viewBox="0 0 24 24" {...base} aria-hidden="true"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3h0a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5h0a1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8v0a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" /></svg>;
export const IconArrow = ({ size = 18 }: { size?: number }) => <svg width={size} height={size} viewBox="0 0 24 24" {...base} aria-hidden="true"><path d="M19 12H5M11 6l-6 6 6 6" /></svg>;
export const IconCheck = ({ size = 16 }: { size?: number }) => <svg width={size} height={size} viewBox="0 0 24 24" {...base} strokeWidth={2.4} aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>;
export const IconSpark = ({ size = 22 }: { size?: number }) => <svg width={size} height={size} viewBox="0 0 24 24" {...base} aria-hidden="true"><path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z" /><path d="M19 16l.7 2 2 .7-2 .7-.7 2-.7-2-2-.7 2-.7z" /></svg>;
export const IconPlus = ({ size = 18 }: { size?: number }) => <svg width={size} height={size} viewBox="0 0 24 24" {...base} strokeWidth={2.2} aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>;
export const IconSend = ({ size = 18 }: { size?: number }) => <svg width={size} height={size} viewBox="0 0 24 24" {...base} aria-hidden="true"><path d="M22 2L11 13" /><path d="M22 2l-7 20-4-9-9-4z" /></svg>;
export const IconDownload = ({ size = 18 }: { size?: number }) => <svg width={size} height={size} viewBox="0 0 24 24" {...base} aria-hidden="true"><path d="M12 3v12M7 10l5 5 5-5" /><path d="M5 21h14" /></svg>;
export const IconClose = ({ size = 18 }: { size?: number }) => <svg width={size} height={size} viewBox="0 0 24 24" {...base} aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>;
export const IconShare = ({ size = 18 }: { size?: number }) => <svg width={size} height={size} viewBox="0 0 24 24" {...base} aria-hidden="true"><path d="M12 15V3M8 7l4-4 4 4" /><path d="M5 12v8h14v-8" /></svg>;
export const IconUpload = ({ size = 18 }: { size?: number }) => <svg width={size} height={size} viewBox="0 0 24 24" {...base} aria-hidden="true"><path d="M12 15V3M7 8l5-5 5 5" /><path d="M5 21h14" /></svg>;

export const IconLinkedIn = ({ size = 18 }: { size?: number }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5zM3 9.75h4v11H3zM9.5 9.75h3.8v1.5h.06c.53-1 1.83-2.05 3.77-2.05 4.03 0 4.77 2.65 4.77 6.1v5.45h-4v-4.83c0-1.15-.02-2.63-1.6-2.63-1.6 0-1.85 1.25-1.85 2.55v4.91h-4z"/></svg>;
export const IconInstagram = ({ size = 18 }: { size?: number }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/></svg>;
