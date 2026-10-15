import Icon from 'src/@core/components/icon';
import { WHATSAPP_WEB_ICON } from 'src/components/icons/customIcons';

/** Iconify icon per platform. WhatsApp Web and the Cloud API look different on purpose. */
export const PLATFORM_ICONS: Record<string, string> = {
  telegram: 'logos:telegram',
  // Meta WhatsApp Cloud API (official business number).
  whatsapp: 'logos:whatsapp-icon',
  // WhatsApp Web (QR-linked session).
  whatsapp_web: WHATSAPP_WEB_ICON,
  facebook: 'logos:facebook',
  widget: 'icon-park:robot-one',
  viber: 'simple-icons:viber',
  instagram: 'skill-icons:instagram',
};

/** Human label per platform, for tooltips and pickers. */
export const PLATFORM_LABELS: Record<string, string> = {
  telegram: 'Telegram',
  whatsapp: 'WhatsApp Business (Cloud API)',
  whatsapp_web: 'WhatsApp Web',
  facebook: 'Facebook',
  widget: 'Web Chat',
  viber: 'Viber',
  wechat: 'WeChat',
  instagram: 'Instagram',
  twitter: 'Twitter',
};

export const platformLabel = (platform?: string): string => {
  const key = platform?.toLowerCase() || '';
  if (PLATFORM_LABELS[key]) return PLATFORM_LABELS[key];

  return key ? key.charAt(0).toUpperCase() + key.slice(1) : '';
};

export default function returnPlatformIcon(platform: string) {
  const key = platform?.toLowerCase();
  const icon = PLATFORM_ICONS[key];
  if (!icon) return <Icon icon={'pajamas:severity-unknown'} fontSize='20' />;
  if (key === 'viber') return <Icon icon={icon} color='#8e69fb' fontSize='20' />;

  return <Icon icon={icon} fontSize='20' />;
}
