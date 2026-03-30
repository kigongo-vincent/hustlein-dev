import type { ReactNode } from 'react'
import { Themestore } from '../../data/Themestore'

export const AUTH_PAGE_BACKGROUND_URL =
  'https://framerusercontent.com/images/d5aUZurmFv9lhNFVLjZNcnvSJE.png?width=1200&height=904'

type Props = { children: ReactNode }

/** Split layout: photo left (~50% on md+), auth card and modals on the right. */
export default function AuthBackground({ children }: Props) {
  const panelBg = Themestore((s) => s.current.system.background)

  return (
    <div className="flex min-h-0 w-full flex-1 flex-col overflow-hidden md:flex-row md:items-stretch">
      <div
        className="relative min-h-[200px] w-full shrink-0 overflow-hidden sm:min-h-[240px] md:min-h-0 md:w-1/2"
        aria-hidden
      >
        <img
          src={AUTH_PAGE_BACKGROUND_URL}
          alt=""
          // style={{ mixBlendMode: "luminosity" }}
          className="absolute inset-0 h-full w-full object-cover object-center"
          loading="eager"
          fetchPriority="high"
        />
        <div className="absolute inset-0 bg-black/30" />
      </div>
      <div
        className="flex min-h-0 w-full flex-1 flex-col items-center justify-start overflow-y-auto scroll-slim px-4 py-6 sm:px-6 sm:py-8 md:w-1/2 md:justify-center"
        style={{ backgroundColor: panelBg }}
      >
        {children}
      </div>
    </div>
  )
}
