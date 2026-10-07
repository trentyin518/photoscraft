import { websiteConfig } from '@/config/website';
import { PaymentTypes } from '@/payment/types';
import {
  findPaymentPlan,
  getCheckoutPlan,
  findPlanByPlanId,
  findPlanByPriceId,
  findPriceInPlan,
  getAllPricePlans,
} from '@/lib/price-plan';
import { afterEach, describe, expect, test, vi } from 'vitest';

describe('pricing catalog', () => {
  test('exposes the configured free, pro, and lifetime plans', () => {
    expect(getAllPricePlans().map((plan) => plan.id)).toEqual([
      'free',
      'pro',
      'lifetime',
    ]);
    expect(findPlanByPlanId('free')).toMatchObject({
      isFree: true,
    });
  });

  test('finds plans and prices by their public identifiers', () => {
    expect(findPlanByPriceId('price_pro_monthly_test')?.id).toBe('pro');
    expect(findPriceInPlan('pro', 'price_pro_yearly_test')).toMatchObject({
      amount: 9900,
      interval: 'year',
    });
    expect(findPlanByPriceId('price_missing')).toBeUndefined();
  });

  test('returns no price when the requested plan does not exist', () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(findPriceInPlan('missing', 'price_missing')).toBeUndefined();
    expect(error).toHaveBeenCalledOnce();

    error.mockRestore();
  });
});

const initialPlans = websiteConfig.price.plans;
afterEach(() => {
  websiteConfig.price.plans = initialPlans;
});

describe('checkout plan validation', () => {
  test.each(['pro', 'lifetime'] as const)(
    'requires the payment type to match the %s plan',
    (planId) => {
      const plan = initialPlans[planId];
      const type = plan.isLifetime
        ? PaymentTypes.SUBSCRIPTION
        : PaymentTypes.ONE_TIME;
      const price = { ...plan.prices[0], type };
      websiteConfig.price.plans = {
        ...initialPlans,
        [planId]: { ...plan, prices: [price] },
      };
      expect(() => getCheckoutPlan(planId, price.priceId)).toThrow();
      expect(findPaymentPlan(price.priceId, type)).toBeUndefined();
    }
  );

  test('rejects cross-plan, unknown, empty, and free checkout prices', () => {
    for (const [planId, priceId] of [
      ['pro', 'price_lifetime_test'],
      ['lifetime', 'price_unknown'],
      ['lifetime', ''],
      ['free', 'price_pro_monthly_test'],
    ])
      expect(() => getCheckoutPlan(planId, priceId)).toThrow();
    expect(
      findPaymentPlan('price_unknown', PaymentTypes.ONE_TIME)
    ).toBeUndefined();
    expect(
      findPaymentPlan('price_pro_monthly_test', PaymentTypes.ONE_TIME)
    ).toBeUndefined();
    expect(
      findPaymentPlan('price_lifetime_test', PaymentTypes.SUBSCRIPTION)
    ).toBeUndefined();
  });

  test.each(['plan', 'price'])(
    'recognizes existing purchases but rejects a disabled %s for checkout',
    (target) => {
      const lifetime = initialPlans.lifetime;
      websiteConfig.price.plans = {
        ...initialPlans,
        lifetime: {
          ...lifetime,
          disabled: target === 'plan',
          prices: lifetime.prices.map((price) => ({
            ...price,
            disabled: target === 'price',
          })),
        },
      };
      expect(() =>
        getCheckoutPlan('lifetime', 'price_lifetime_test')
      ).toThrow();
      expect(
        findPaymentPlan('price_lifetime_test', PaymentTypes.ONE_TIME)
          ?.isLifetime
      ).toBe(true);
    }
  );
});
