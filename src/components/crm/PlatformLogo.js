import { useState } from 'react';
import styled from 'styled-components';
import { crm as C } from '../../styles/crmTheme';

// ── Domain map ────────────────────────────────────────────────────────────────
// Covers both snake_case source keys (from DB) and display names (from UI)
const LOGO_DOMAINS = {
  // Snake_case source / platform keys
  facebook_ads:   'facebook.com',
  google_ads:     'google.com',
  tiktok_ads:     'tiktok.com',
  instagram:      'instagram.com',
  youtube:        'youtube.com',
  twitter:        'twitter.com',

  // Affiliate networks
  ClickBank:      'clickbank.com',
  BuyGoods:       'buygoods.com',
  MaxWeb:         'maxweb.com',
  Digistore24:    'digistore24.com',

  // Display-name platform keys (Settings integrations, Campaigns)
  'Facebook Ads': 'facebook.com',
  'Google Ads':   'google.com',
  'TikTok Ads':   'tiktok.com',
  Instagram:      'instagram.com',
  YouTube:        'youtube.com',
  'YouTube Ads':  'youtube.com',

  // Payment & tools
  Stripe:         'stripe.com',
  PayPal:         'paypal.com',
  Zapier:         'zapier.com',
  Slack:          'slack.com',
  Mailchimp:      'mailchimp.com',
  Shopify:        'shopify.com',
  WooCommerce:    'woocommerce.com',
  Klaviyo:        'klaviyo.com',
};

// Short fallback labels for sources that have no logo
const FALLBACK_LABELS = {
  facebook_ads:   'FB',
  google_ads:     'GG',
  tiktok_ads:     'TT',
  instagram:      'IG',
  youtube:        'YT',
  twitter:        'TW',
  email:          'EM',
  landing_page:   'LP',
  affiliate_link: 'AF',
  website_widget: 'WW',
  api:            'AP',
  ClickBank:      'CB',
  BuyGoods:       'BG',
  MaxWeb:         'MW',
  Digistore24:    'D24',
  'Facebook Ads': 'FB',
  'Google Ads':   'GG',
  'TikTok Ads':   'TT',
  Instagram:      'IG',
  YouTube:        'YT',
  'YouTube Ads':  'YT',
  Stripe:         'ST',
  PayPal:         'PP',
  Zapier:         'ZP',
  Slack:          'SL',
  Mailchimp:      'MC',
  Shopify:        'SH',
  WooCommerce:    'WC',
  Klaviyo:        'KL',
};

// ── Styled components ─────────────────────────────────────────────────────────
const Img = styled.img`
  width: ${({ $size }) => $size}px;
  height: ${({ $size }) => $size}px;
  border-radius: 6px;
  background: #ffffff;
  padding: 3px;
  object-fit: contain;
  display: inline-block;
  vertical-align: middle;
  flex-shrink: 0;
`;

const Fallback = styled.div`
  width: ${({ $size }) => $size}px;
  height: ${({ $size }) => $size}px;
  border-radius: 6px;
  background: ${C.surface};
  border: 1px solid ${C.border};
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: ${({ $size }) => Math.max(8, Math.floor($size * 0.33))}px;
  font-weight: 800;
  color: ${C.muted};
  vertical-align: middle;
  flex-shrink: 0;
  letter-spacing: -0.02em;
`;

// ── Component ─────────────────────────────────────────────────────────────────
/**
 * PlatformLogo
 *
 * Props:
 *   name  — platform/source name key (e.g. 'facebook_ads', 'ClickBank', 'Stripe')
 *   size  — px dimension rendered (default 32)
 */
export default function PlatformLogo({ name, size = 32 }) {
  const [failed, setFailed] = useState(false);
  const token = process.env.REACT_APP_LOGO_TOKEN;
  const domain = LOGO_DOMAINS[name];

  // Derive a fallback label: use known map or auto-generate from name
  const fallback = FALLBACK_LABELS[name]
    || (name || '')
        .replace(/_/g, ' ')
        .split(' ')
        .map(w => w[0] || '')
        .join('')
        .toUpperCase()
        .slice(0, 3)
    || '??';

  if (!domain || failed || !token) {
    return <Fallback $size={size}>{fallback}</Fallback>;
  }

  return (
    <Img
      src={`https://img.logo.dev/${domain}?token=${token}&size=${size * 2}&format=png`}
      alt={name}
      $size={size}
      onError={() => setFailed(true)}
    />
  );
}
