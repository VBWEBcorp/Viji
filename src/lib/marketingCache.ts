// Module-level cache for /api/marketing.
// Without this, PromoBanner + PromoPopup each fired their own request on
// every page load — doubling the round-trip and DB hit for no reason.

interface BannerData {
  isActive: boolean;
  text: string;
  backgroundColor: string;
  textColor: string;
  linkUrl: string;
  speed: number;
}

interface PopupData {
  isActive: boolean;
  image: string;
  title: string;
  description: string;
  buttonText: string;
  buttonUrl: string;
  delay: number;
}

export interface MarketingData {
  banner?: BannerData;
  popup?: PopupData;
}

let cached: Promise<MarketingData> | null = null;

export function getMarketing(): Promise<MarketingData> {
  if (!cached) {
    cached = fetch("/api/marketing")
      .then((r) => (r.ok ? r.json() : ({} as MarketingData)))
      .catch(() => ({} as MarketingData));
  }
  return cached;
}
