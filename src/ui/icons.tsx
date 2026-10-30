/** Görev M1: ana menü simgeleri: çizgi (stroke) tipinde satır içi SVG (emoji yok). Renk `currentColor`. */
type P = { size?: number };
const svg = (size: number, children: React.ReactNode) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">{children}</svg>
);
export const IconPlay = ({ size = 24 }: P) => svg(size, <path d="M8 5.5v13l10.5-6.5z" />);
export const IconUser = ({ size = 24 }: P) => svg(size, <><circle cx="12" cy="8" r="3.6" /><path d="M4.8 20c.8-3.8 3.7-6 7.2-6s6.4 2.2 7.2 6" /></>);
export const IconHexDie = ({ size = 24 }: P) => svg(size, <><path d="M12 2.6l8.2 4.7v9.4L12 21.4l-8.2-4.7V7.3z" /><path d="M12 7.2l4 6.8H8z" /><path d="M8 14l4 3.6 4-3.6" /></>);
export const IconStatus = ({ size = 24 }: P) => svg(size, <><path d="M9 6.5h11M9 12h11M9 17.5h11" /><path d="M3.8 6.5l1.2 1.2 2-2.2M3.8 12l1.2 1.2 2-2.2" /><circle cx="5" cy="17.5" r="1.2" /></>);
export const IconGear = ({ size = 24 }: P) => svg(size, <><circle cx="12" cy="12" r="3" /><path d="M12 2.8v2.4M12 18.8v2.4M2.8 12h2.4M18.8 12h2.4M5.5 5.5l1.7 1.7M16.8 16.8l1.7 1.7M5.5 18.5l1.7-1.7M16.8 7.2l1.7-1.7" /></>);
export const IconSun = ({ size = 24 }: P) => svg(size, <><circle cx="12" cy="12" r="4" /><path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4" /></>);
export const IconMoon = ({ size = 24 }: P) => svg(size, <path d="M19.5 14.5A7.5 7.5 0 0 1 9.5 4.5a7.5 7.5 0 1 0 10 10z" />);
export const IconAuto = ({ size = 24 }: P) => svg(size, <><circle cx="12" cy="12" r="8" /><path d="M12 4a8 8 0 0 1 0 16z" fill="currentColor" stroke="none" /></>);
export const IconSound = ({ size = 24 }: P) => svg(size, <><path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" /><path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11" /></>);
