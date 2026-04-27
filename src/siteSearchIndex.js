/**
 * Curated routes and keywords for global header search (client-side).
 * Extend this list when you add new public or in-app routes.
 */
export const SITE_SEARCH_ENTRIES = [
  { path: '/', title: 'Home', keywords: 'landing kimux marketing main' },
  { path: '/about', title: 'About', keywords: 'company team story mission' },
  { path: '/pricing', title: 'Pricing', keywords: 'plans cost subscription starter pro enterprise' },
  { path: '/solutions', title: 'Solutions', keywords: 'products services use cases' },
  { path: '/benefits', title: 'Benefits', keywords: 'sectors b2b b2c value' },
  { path: '/products', title: 'Products', keywords: 'catalog offerings features' },
  { path: '/faq', title: 'FAQ', keywords: 'help center questions support' },
  { path: '/blog', title: 'Blog', keywords: 'articles news updates' },
  { path: '/login', title: 'Sign in', keywords: 'login account auth' },
  { path: '/signup', title: 'Sign up', keywords: 'register trial start free account' },
  { path: '/terms', title: 'Terms of service', keywords: 'legal terms conditions' },
  { path: '/privacy', title: 'Privacy policy', keywords: 'legal data gdpr' },
  { path: '/crm', title: 'CRM', keywords: 'customer sales pipeline crm product landing' },
  { path: '/crm/dashboard', title: 'CRM — Dashboard', keywords: 'overview workspace home app' },
  { path: '/crm/leads', title: 'CRM — Leads', keywords: 'contacts prospects capture' },
  { path: '/crm/pipeline', title: 'CRM — Pipeline', keywords: 'deals stages sales funnel' },
  { path: '/crm/campaigns', title: 'CRM — Campaigns', keywords: 'marketing ads outreach' },
  { path: '/crm/communication', title: 'CRM — Messages', keywords: 'email sms inbox communication' },
  { path: '/crm/strategy', title: 'CRM — Strategy engine', keywords: 'planning goals playbook' },
  { path: '/crm/fintech', title: 'CRM — Fintech hub', keywords: 'payments wallet blockchain' },
  { path: '/crm/academy', title: 'CRM — KimuX Academy', keywords: 'training learn tutorials' },
  { path: '/crm/analytics', title: 'CRM — Analytics', keywords: 'reports metrics charts' },
  { path: '/crm/settings', title: 'CRM — Settings', keywords: 'preferences account workspace' },
  { path: '/crm/offers', title: 'CRM — Affiliate offers', keywords: 'affiliate partner commissions' },
  { path: '/crm/content-gen', title: 'CRM — Content generator', keywords: 'ai copy writing posts' },
  { path: '/crm/content-scheduler', title: 'CRM — Content scheduler', keywords: 'calendar publish schedule' },
  { path: '/crm/user-profiles', title: 'CRM — User profiles', keywords: 'team members admin users' },
  { path: '/b2b-brokerage', title: 'B2B Brokerage', keywords: 'wholesale trade business' },
  { path: '/b2c-marketplace', title: 'B2C Marketplace', keywords: 'retail shop consumers' },
  { path: '/affiliate-hub', title: 'Affiliate Hub', keywords: 'partners referrals program' },
  { path: '/ecommerce', title: 'E-commerce', keywords: 'store shop online selling' },
  { path: '/ai-dashboard', title: 'AI Dashboard', keywords: 'intelligence automation insights' },
  { path: '/blockchain', title: 'Blockchain', keywords: 'web3 ledger crypto' },
  { path: '/fintech', title: 'Fintech', keywords: 'payments banking finance' },
  { path: '/commerce-intelligence', title: 'Commerce Intelligence', keywords: 'analytics data retail' },
  { path: '/developer', title: 'Developer', keywords: 'api sdk integration docs' },
  { path: '/monetization', title: 'Monetization', keywords: 'revenue ads earnings' },
  { path: '/usbh', title: 'USBH', keywords: 'program hub' },
  { path: '/content-scheduler', title: 'Content Scheduler', keywords: 'calendar social posts schedule' },
  { path: '/digital-marketing-report', title: 'Digital Marketing Report', keywords: 'report analytics pdf' },
  { path: '/admin', title: 'Admin', keywords: 'administrator panel internal' },
];

const POPULAR_PATHS = ['/', '/pricing', '/crm', '/solutions', '/faq', '/signup', '/login', '/about'];

function scoreEntry(entry, words) {
  const title = entry.title.toLowerCase();
  const path = entry.path.toLowerCase();
  const kw = (entry.keywords || '').toLowerCase();
  let score = 0;
  for (const w of words) {
    if (!w) continue;
    if (title.includes(w)) score += 50;
    if (path.includes(w)) score += 35;
    if (kw.includes(w)) score += 25;
    if (w.length >= 3 && title.split(/\s+/).some((t) => t.startsWith(w))) score += 15;
  }
  return score;
}

/**
 * @param {string} rawQuery
 * @param {{ limit?: number }} [opts]
 * @returns {typeof SITE_SEARCH_ENTRIES}
 */
export function searchSite(rawQuery, { limit = 20 } = {}) {
  const words = rawQuery
    .toLowerCase()
    .trim()
    .split(/\s+/)
    .filter((w) => w.length > 0);

  if (words.length === 0) {
    const byPath = new Map(SITE_SEARCH_ENTRIES.map((e) => [e.path, e]));
    return POPULAR_PATHS.map((p) => byPath.get(p)).filter(Boolean).slice(0, limit);
  }

  const ranked = SITE_SEARCH_ENTRIES.map((entry) => ({
    entry,
    score: scoreEntry(entry, words),
  }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((x) => x.entry);

  return ranked;
}
