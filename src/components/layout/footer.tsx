'use client';

import Container from '@/components/layout/container';
import { Logo } from '@/components/layout/logo';
import { ModeSwitcherHorizontal } from '@/components/layout/mode-switcher-horizontal';
import BuiltWithButton from '@/components/shared/built-with-button';
import { useFooterLinks } from '@/config/footer-config';
import { useSocialLinks } from '@/config/social-config';
import { LocaleLink, useLocalePathname } from '@/i18n/navigation';
import { cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';
import type React from 'react';

export function Footer({ className }: React.HTMLAttributes<HTMLElement>) {
  const t = useTranslations();
  const footerLinks = useFooterLinks();
  const socialLinks = useSocialLinks();
  const localePathname = useLocalePathname();

  const badges = [
    {
      key: 'goodaitools',
      href: 'https://goodaitools.com/ai/photoscraft',
      label: 'Good AI Tools',
      chipClassName: 'shrink-0',
      img: (
        <>
          <img
            src="https://goodaitools.com/assets/images/badge.png"
            alt="Good AI Tools"
            height={18}
            loading="lazy"
            className="block h-[18px] w-auto dark:hidden"
          />
          <img
            src="https://goodaitools.com/assets/images/badge-dark.png"
            alt="Good AI Tools"
            height={18}
            loading="lazy"
            className="hidden h-[18px] w-auto dark:block"
          />
        </>
      ),
    },
    {
      key: 'frogdr',
      href: 'https://frogdr.com/photoscraft.top?utm_source=photoscraft.top',
      label: 'Monitor your Domain Rating with FrogDR',
      chipClassName: 'shrink-0 rounded-lg bg-slate-900 px-2 py-0.5',
      img: (
        <img
          src="https://frogdr.com/photoscraft.top/badge-white.svg"
          alt="Monitor your Domain Rating with FrogDR"
          width={200}
          height={43}
          loading="lazy"
          className="h-[15px] w-auto"
        />
      ),
    },
    {
      key: 'verifieddr',
      href: 'https://verifieddr.com/website/showmebest-ai',
      label: 'Verified DR - Verified Domain Rating for showmebest.ai',
      chipClassName:
        'shrink-0 rounded-lg border border-border bg-white px-2 py-0.5 dark:bg-slate-900',
      img: (
        <img
          src="https://verifieddr.com/badge/showmebest-ai.svg?metric=dr"
          alt="Verified DR - Verified Domain Rating for showmebest.ai"
          width={200}
          height={62}
          loading="lazy"
          className="h-[21px] w-auto"
        />
      ),
    },
    {
      key: 'verifieddr-truedr',
      href: 'https://verifieddr.com/website/photoscraft-top',
      label: 'Verified DR - Verified Domain Rating for photoscraft.top',
      chipClassName:
        'shrink-0 rounded-lg border border-border bg-white px-2 py-0.5 dark:bg-slate-900',
      img: (
        <img
          src="https://verifieddr.com/badge/photoscraft-top.svg?metric=truedr"
          alt="Verified DR - Verified Domain Rating for photoscraft.top"
          width={220}
          height={68}
          loading="lazy"
          className="h-[21px] w-auto"
        />
      ),
    },
    {
      key: 'findly',
      href: 'https://findly.tools/photoscraft?utm_source=photoscraft',
      label: 'Featured on Findly.tools',
      chipClassName:
        'shrink-0 rounded-lg border border-border bg-white px-2 py-0.5 dark:bg-slate-900',
      img: (
        <>
          <img
            src="https://findly.tools/badges/findly-tools-badge-light.svg"
            alt="Featured on Findly.tools"
            width={175}
            height={55}
            loading="lazy"
            className="block h-[21px] w-auto dark:hidden"
          />
          <img
            src="https://findly.tools/badges/findly-tools-badge-dark.svg"
            alt="Featured on Findly.tools"
            width={175}
            height={55}
            loading="lazy"
            className="hidden h-[21px] w-auto dark:block"
          />
        </>
      ),
    },
    {
      key: 'showmysites',
      href: 'https://www.showmysites.com',
      label: 'ShowMySites',
      chipClassName:
        'shrink-0 rounded-lg border border-border bg-white px-2 py-0.5 text-[12px] font-semibold text-foreground dark:bg-slate-900',
      img: <span>ShowMySites</span>,
    },
    {
      key: 'apprater',
      href: 'https://apprater.net',
      label: 'AppRater — the independent app index',
      chipClassName:
        'shrink-0 rounded-lg border border-border bg-white px-2 py-0.5 dark:bg-slate-900',
      img: (
        <img
          src="https://apprater.net/badge.svg"
          alt="AppRater — the independent app index"
          width={112}
          height={40}
          loading="lazy"
          className="h-[14px] w-auto"
        />
      ),
    },
  ];

  return (
    <footer className={cn('border-t', className)}>
      <Container className="px-4">
        <div className="grid grid-cols-2 gap-8 py-16 md:grid-cols-6">
          <div className="flex flex-col items-start col-span-full md:col-span-2">
            <div className="space-y-4">
              {/* logo and name */}
              <div className="items-center space-x-2 flex">
                <Logo />
              </div>

              {/* tagline */}
              <p className="text-muted-foreground text-base py-2 md:pr-12">
                {t('Marketing.footer.tagline')}
              </p>

              {/* social links */}
              <nav
                aria-label="Social links"
                className="flex items-center gap-4 py-2"
              >
                <div className="flex items-center gap-2">
                  {socialLinks?.map((link) => (
                    <a
                      key={link.title}
                      href={link.href || '#'}
                      target="_blank"
                      rel="noreferrer"
                      aria-label={link.title}
                      className="border border-border inline-flex size-8 items-center
                          justify-center rounded-full hover:bg-primary/10 hover:text-primary hover:border-primary/30 transition-all duration-200"
                    >
                      {link.icon ? link.icon : null}
                    </a>
                  ))}
                </div>
              </nav>

              {/* built with button */}
              <BuiltWithButton />
            </div>
          </div>

          {/* footer links */}
          {footerLinks?.map((section) => (
            <div
              key={section.title}
              className="col-span-1 md:col-span-1 items-start"
            >
              <span className="text-sm font-semibold uppercase">
                {section.title}
              </span>
              <ul className="mt-4 list-inside space-y-3">
                {section.items?.map(
                  (item) =>
                    item.href && (
                      <li key={item.title}>
                        <LocaleLink
                          href={item.href || '#'}
                          target={item.external ? '_blank' : undefined}
                          className={cn(
                            'text-sm text-muted-foreground transition-colors duration-150 hover:text-primary',
                            !item.external &&
                              !item.href.includes('#') &&
                              (item.href === '/'
                                ? localePathname === '/'
                                : localePathname.startsWith(item.href)) &&
                              'font-semibold text-primary'
                          )}
                        >
                          {item.title}
                        </LocaleLink>
                      </li>
                    )
                )}
              </ul>
            </div>
          ))}
        </div>
      </Container>

      {/* badges marquee */}
      <style>{`@keyframes footer-badge-marquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }
.footer-badge-track { animation: footer-badge-marquee 3s linear infinite; }
.footer-badge-marquee:hover .footer-badge-track { animation-play-state: paused; }
@media (prefers-reduced-motion: reduce) { .footer-badge-track { animation: none; } }`}</style>
      <div className="footer-badge-marquee overflow-hidden border-t bg-muted/40 py-2 dark:bg-muted/10">
        <div
          className="footer-badge-track flex w-max items-center gap-4 pr-4"
          aria-label="Partner and verification badges"
        >
          {[0, 1].map((copy) => (
            <div key={copy} className="flex items-center gap-4" aria-hidden={copy === 1}>
              {badges.map((badge) => (
                <a
                  key={`${badge.key}-${copy}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  href={badge.href}
                  aria-label={badge.label}
                  tabIndex={copy === 1 ? -1 : undefined}
                  className={badge.chipClassName}
                >
                  {badge.img}
                </a>
              ))}
            </div>
          ))}
        </div>
      </div>

      <div className="border-t py-8">
        <Container className="px-4 flex items-center justify-between gap-x-4">
          <span className="text-muted-foreground text-sm">
            {t('Marketing.footer.rights', {
              year: new Date().getFullYear(),
              name: t('Metadata.name'),
            })}
          </span>

          <div className="flex items-center gap-x-4">
            <ModeSwitcherHorizontal />
          </div>
        </Container>
      </div>
    </footer>
  );
}
