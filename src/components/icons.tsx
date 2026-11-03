import type { ReactNode, SVGProps } from 'react';

export type IconName =
  | 'dashboard'
  | 'building'
  | 'room'
  | 'users'
  | 'contract'
  | 'bill'
  | 'wrench'
  | 'chart'
  | 'settings'
  | 'plus'
  | 'search'
  | 'close'
  | 'chevron-down'
  | 'chevron-right'
  | 'chevron-left'
  | 'logout'
  | 'bell'
  | 'check'
  | 'alert'
  | 'clock'
  | 'edit'
  | 'trash'
  | 'phone'
  | 'download'
  | 'calendar'
  | 'arrow-up'
  | 'arrow-down'
  | 'key'
  | 'wallet'
  | 'home'
  | 'map-pin'
  | 'layers'
  | 'sparkle'
  | 'menu'
  | 'user'
  | 'refresh'
  | 'send'
  | 'logo';

const PATHS: Record<IconName, ReactNode> = {
  dashboard: (
    <>
      <rect x="3" y="3" width="7.5" height="8.5" rx="1.8" />
      <rect x="13.5" y="3" width="7.5" height="5.5" rx="1.8" />
      <rect x="3" y="14.5" width="7.5" height="6.5" rx="1.8" />
      <rect x="13.5" y="11.5" width="7.5" height="9.5" rx="1.8" />
    </>
  ),
  building: (
    <>
      <path d="M4 21V6.2c0-1 .8-1.7 1.7-1.9l7-1.6c1.1-.3 2.3.6 2.3 1.8V21" />
      <path d="M15 10h3.3c.9 0 1.7.8 1.7 1.7V21" />
      <path d="M2.5 21h19" />
      <path d="M7.5 8.5h3M7.5 12h3M7.5 15.5h3M9 18.5h0" />
    </>
  ),
  room: (
    <>
      <path d="M3.5 21V4.5A1.5 1.5 0 0 1 5 3h14a1.5 1.5 0 0 1 1.5 1.5V21" />
      <path d="M3.5 21h17" />
      <path d="M14.5 12h.01" />
      <path d="M7 8h4M7 12h4" />
    </>
  ),
  users: (
    <>
      <circle cx="9" cy="8" r="3.2" />
      <path d="M2.8 20c.5-3.4 3-5.4 6.2-5.4s5.7 2 6.2 5.4" />
      <path d="M16 5.2a3.2 3.2 0 0 1 0 6.1" />
      <path d="M17.6 14.6c2.1.5 3.4 2.2 3.7 5.4" />
    </>
  ),
  contract: (
    <>
      <path d="M6 2.8h8l4.5 4.5V21a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V3.8a1 1 0 0 1 1-1Z" />
      <path d="M14 2.8V7.5h4.5" />
      <path d="M8.5 12h6.5M8.5 15.5h6.5M8.5 8.5h2.5" />
    </>
  ),
  bill: (
    <>
      <rect x="2.8" y="5.5" width="18.4" height="13" rx="2.2" />
      <path d="M2.8 9.5h18.4" />
      <path d="M6.5 14.5h4" />
    </>
  ),
  wrench: (
    <>
      <path d="M14.6 6.4a4.5 4.5 0 0 1 6 6l-9.2 9.2a2.2 2.2 0 0 1-3.1 0l-2.9-2.9a2.2 2.2 0 0 1 0-3.1Z" />
      <path d="M14.6 6.4 11.4 3.2a4.5 4.5 0 0 0-6 6l3.2 3.2" />
    </>
  ),
  chart: (
    <>
      <path d="M3.5 3.5v17h17" />
      <path d="M7.5 16.5v-4M12 16.5V7.5M16.5 16.5v-6.5" />
    </>
  ),
  settings: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 14.5a1.6 1.6 0 0 0 .3 1.8l.1.1a1.9 1.9 0 1 1-2.7 2.7l-.1-.1a1.6 1.6 0 0 0-1.8-.3 1.6 1.6 0 0 0-1 1.5v.3a1.9 1.9 0 1 1-3.8 0v-.2a1.6 1.6 0 0 0-1-1.5 1.6 1.6 0 0 0-1.8.3l-.1.1a1.9 1.9 0 1 1-2.7-2.7l.1-.1a1.6 1.6 0 0 0 .3-1.8 1.6 1.6 0 0 0-1.5-1H3.3a1.9 1.9 0 1 1 0-3.8h.2a1.6 1.6 0 0 0 1.5-1 1.6 1.6 0 0 0-.3-1.8l-.1-.1a1.9 1.9 0 1 1 2.7-2.7l.1.1a1.6 1.6 0 0 0 1.8.3H9.3a1.6 1.6 0 0 0 1-1.5V3.3a1.9 1.9 0 1 1 3.8 0v.2a1.6 1.6 0 0 0 1 1.5 1.6 1.6 0 0 0 1.8-.3l.1-.1a1.9 1.9 0 1 1 2.7 2.7l-.1.1a1.6 1.6 0 0 0-.3 1.8v.1a1.6 1.6 0 0 0 1.5 1h.3a1.9 1.9 0 1 1 0 3.8h-.2a1.6 1.6 0 0 0-1.5 1Z" />
    </>
  ),
  plus: <path d="M12 5v14M5 12h14" />,
  search: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </>
  ),
  close: <path d="M6 6l12 12M18 6 6 18" />,
  'chevron-down': <path d="m6 9 6 6 6-6" />,
  'chevron-right': <path d="m9 6 6 6-6 6" />,
  'chevron-left': <path d="m15 6-6 6 6 6" />,
  logout: (
    <>
      <path d="M9 21H5.5A1.5 1.5 0 0 1 4 19.5v-15A1.5 1.5 0 0 1 5.5 3H9" />
      <path d="M16 16.5 20.5 12 16 7.5" />
      <path d="M20 12H9" />
    </>
  ),
  bell: (
    <>
      <path d="M18 8.5a6 6 0 1 0-12 0c0 6-2.5 7.5-2.5 7.5h17S18 14.5 18 8.5Z" />
      <path d="M13.7 20a2 2 0 0 1-3.4 0" />
    </>
  ),
  check: <path d="m4.5 12.5 5 5 10-10.5" />,
  alert: (
    <>
      <path d="M12 3.5 2.8 19.2a1.4 1.4 0 0 0 1.2 2.1h16a1.4 1.4 0 0 0 1.2-2.1Z" />
      <path d="M12 9v4.5M12 17h.01" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5.3l3.5 2" />
    </>
  ),
  edit: (
    <>
      <path d="M12 20h8" />
      <path d="M16.4 3.6a2 2 0 0 1 2.9 2.8L8.5 17.2 4 18.5l1.3-4.5Z" />
    </>
  ),
  trash: (
    <>
      <path d="M4 7h16M9.5 7V4.8a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1V7" />
      <path d="M6.5 7l.8 12.2a1.8 1.8 0 0 0 1.8 1.8h5.8a1.8 1.8 0 0 0 1.8-1.8L18 7" />
      <path d="M10 11v6M14 11v6" />
    </>
  ),
  phone: (
    <path d="M20.5 16.9v2.5a2 2 0 0 1-2.2 2 19.6 19.6 0 0 1-8.5-3 19.3 19.3 0 0 1-6-6 19.6 19.6 0 0 1-3-8.6 2 2 0 0 1 2-2.2h2.5a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.4 9.3a16 16 0 0 0 6 6l1.1-1.1a2 2 0 0 1 2.1-.5c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2Z" />
  ),
  download: (
    <>
      <path d="M12 3.5v12M7.5 11 12 15.5 16.5 11" />
      <path d="M4 20h16" />
    </>
  ),
  calendar: (
    <>
      <rect x="3.2" y="5" width="17.6" height="16" rx="2" />
      <path d="M3.2 10h17.6M8 3v4M16 3v4" />
    </>
  ),
  'arrow-up': <path d="M12 19V5M6 11l6-6 6 6" />,
  'arrow-down': <path d="M12 5v14M6 13l6 6 6-6" />,
  key: (
    <>
      <circle cx="8" cy="15.5" r="4.5" />
      <path d="m11.5 12 8-8M16.5 7l2.5 2.5M19 4.5 21.5 7" />
    </>
  ),
  wallet: (
    <>
      <path d="M3 7.5A2.5 2.5 0 0 1 5.5 5H18a3 3 0 0 1 3 3v8.5a2.5 2.5 0 0 1-2.5 2.5h-13A2.5 2.5 0 0 1 3 16.5Z" />
      <path d="M3 8.5h18" />
      <circle cx="16.5" cy="13" r="1.2" />
    </>
  ),
  home: (
    <>
      <path d="M3.5 10.5 12 3.5l8.5 7" />
      <path d="M5.5 9.5V20a1 1 0 0 0 1 1h11a1 1 0 0 0 1-1V9.5" />
      <path d="M9.5 21v-6h5v6" />
    </>
  ),
  'map-pin': (
    <>
      <path d="M20 10c0 6-8 11.5-8 11.5S4 16 4 10a8 8 0 1 1 16 0Z" />
      <circle cx="12" cy="10" r="2.8" />
    </>
  ),
  layers: (
    <>
      <path d="m12 3 9 4.8-9 4.8-9-4.8Z" />
      <path d="m3 12.5 9 4.8 9-4.8" />
      <path d="m3 17 9 4.8 9-4.8" />
    </>
  ),
  sparkle: <path d="M12 3.5 13.8 9l5.7 1.8-5.7 1.7L12 18l-1.8-5.5L4.5 10.8 10.2 9Z" />,
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  user: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4.5 21c.6-4 3.7-6.2 7.5-6.2s6.9 2.2 7.5 6.2" />
    </>
  ),
  refresh: (
    <>
      <path d="M20 11a8 8 0 0 0-13.7-4.6L3 9.5" />
      <path d="M3 4.5v5h5" />
      <path d="M4 13a8 8 0 0 0 13.7 4.6L21 14.5" />
      <path d="M21 19.5v-5h-5" />
    </>
  ),
  send: <path d="M21 3 3 10.5l7 3 3 7L21 3Z" />,
  logo: (
    <>
      <path d="M4 19.5V9.2L12 3l8 6.2v10.3" />
      <path d="M9.2 21v-6.5h5.6V21" />
      <path d="M4 19.5h16" />
    </>
  ),
};

interface IconProps extends Omit<SVGProps<SVGSVGElement>, 'name'> {
  name: IconName;
  size?: number;
}

export function Icon({ name, size = 18, className, ...rest }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      {...rest}
    >
      {PATHS[name]}
    </svg>
  );
}
