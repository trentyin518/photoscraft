import { PaymentTypes, PlanIntervals } from '@/payment/types';
import type { PaymentConfig, WebsiteConfig } from '@/types';

const isE2ETestMode = process.env.NEXT_PUBLIC_E2E_TEST_MODE === 'true';

// Payment provider controlled by env var: 'stripe' | 'creem' | 'waffo'
const paymentProvider = (process.env.NEXT_PUBLIC_PAYMENT_PROVIDER ||
  'stripe') as PaymentConfig['provider'];
const isCreem = paymentProvider === 'creem';
const isWaffo = paymentProvider === 'waffo';

// Resolve price/product IDs based on the active payment provider
const priceIds = {
  proMonthly: isCreem
    ? process.env.NEXT_PUBLIC_CREEM_PRODUCT_PRO_MONTHLY!
    : isWaffo
      ? (process.env.NEXT_PUBLIC_WAFFO_PRODUCT_PRO_MONTHLY ?? '')
      : process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO_MONTHLY!,
  proYearly: isCreem
    ? process.env.NEXT_PUBLIC_CREEM_PRODUCT_PRO_YEARLY!
    : isWaffo
      ? (process.env.NEXT_PUBLIC_WAFFO_PRODUCT_PRO_YEARLY ?? '')
      : process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO_YEARLY!,
  lifetime: isCreem
    ? process.env.NEXT_PUBLIC_CREEM_PRODUCT_LIFETIME!
    : isWaffo
      ? (process.env.NEXT_PUBLIC_WAFFO_PRODUCT_LIFETIME ?? '')
      : process.env.NEXT_PUBLIC_STRIPE_PRICE_LIFETIME!,
};

/**
 * website config, without translations
 *
 * docs:
 * https://mksaas.com/docs/config/website
 */
export const websiteConfig: WebsiteConfig = {
  ui: {
    mode: {
      defaultMode: 'dark',
      enableSwitch: true,
    },
  },
  metadata: {
    images: {
      ogImage: '/og.png',
      logoLight: '/photocraft-logo.svg',
      logoDark: '/photocraft-logo.svg',
    },
    social: {
      github: '',
      twitter: '',
      blueSky: '',
      discord: '',
      mastodon: '',
      linkedin: '',
      youtube: '',
    },
  },
  features: {
    enableUpgradeCard: true,
    enableUpdateAvatar: true,
    enableDatafastRevenueTrack: false,
    enableCrispChat: process.env.NEXT_PUBLIC_DEMO_WEBSITE === 'true',
    enableTurnstileCaptcha:
      process.env.NEXT_PUBLIC_DEMO_WEBSITE === 'true' && !isE2ETestMode,
  },
  affiliates: {
    enable: false,
    provider: 'affonso',
  },
  analytics: {
    enableVercelAnalytics: false,
    enableSpeedInsights: false,
  },
  apikeys: {
    enable: process.env.NEXT_PUBLIC_DEMO_WEBSITE === 'true',
  },
  auth: {
    enableGoogleLogin: true,
    enableGithubLogin: true,
    enableCredentialLogin: true,
    enableDeleteUser: true,
  },
  i18n: {
    defaultLocale: 'en',
    locales: {
      en: { flag: '🇺🇸', name: 'English', hreflang: 'en' },
      de: { flag: '🇩🇪', name: 'Deutsch', hreflang: 'de' },
      fr: { flag: '🇫🇷', name: 'Français', hreflang: 'fr' },
      es: { flag: '🇪🇸', name: 'Español', hreflang: 'es' },
      it: { flag: '🇮🇹', name: 'Italiano', hreflang: 'it' },
      pt: { flag: '🇵🇹', name: 'Português', hreflang: 'pt' },
      nl: { flag: '🇳🇱', name: 'Nederlands', hreflang: 'nl' },
      ru: { flag: '🇷🇺', name: 'Русский', hreflang: 'ru' },
      zh: { flag: '🇨🇳', name: '中文', hreflang: 'zh-CN' },
      ja: { flag: '🇯🇵', name: '日本語', hreflang: 'ja' },
      ko: { flag: '🇰🇷', name: '한국어', hreflang: 'ko' },
    },
  },
  blog: {
    enable: false,
    paginationSize: 6,
    relatedPostsSize: 3,
  },
  docs: {
    enable: false,
  },
  mail: {
    enable: true,
    provider: 'resend',
    fromEmail: 'PhotoCraft <hello@photoscraft.top>',
    supportEmail: 'PhotoCraft <support@photoscraft.top>',
  },
  newsletter: {
    enable: false,
    provider: 'resend',
    autoSubscribeAfterSignUp: false,
  },
  notification: {
    enable: false,
    provider: 'discord',
  },
  storage: {
    enable: true,
    provider: 's3',
  },
  payment: {
    provider: paymentProvider,
  },
  price: {
    plans: {
      free: {
        id: 'free',
        prices: [],
        isFree: true,
        isLifetime: false,
      },
      pro: {
        id: 'pro',
        prices: [
          {
            type: PaymentTypes.SUBSCRIPTION,
            priceId: priceIds.proMonthly,
            amount: 990,
            currency: 'USD',
            interval: PlanIntervals.MONTH,
          },
          {
            type: PaymentTypes.SUBSCRIPTION,
            priceId: priceIds.proYearly,
            amount: 9900,
            currency: 'USD',
            interval: PlanIntervals.YEAR,
          },
        ],
        isFree: false,
        isLifetime: false,
        popular: true,
      },
      lifetime: {
        id: 'lifetime',
        prices: [
          {
            type: PaymentTypes.ONE_TIME,
            priceId: priceIds.lifetime,
            amount: 19900,
            currency: 'USD',
            allowPromotionCode: true,
          },
        ],
        isFree: false,
        isLifetime: true,
      },
    },
  },
};
