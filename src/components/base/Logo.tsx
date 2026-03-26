import { HTMLAttributes } from 'react'
import { Themestore } from '../../data/Themestore'

import BrownLogo from '../../assets/Hustle_In_No_BG_Brown_b9cg7e.png'
import WhiteLogo from '../../assets/Hustle_In_No_BG_White_m1xksm.png'

const SIZE_STYLES = {
    sm: {
        container: 'h-[24px] w-[90px]',
    },
    md: {
        container: 'h-[32px] w-[120px]',
    },
    lg: {
        container: 'h-[40px] w-[150px]',
    },
    xl: {
        container: 'h-[48px] w-[180px]',
    },
} as const

export type LogoSize = keyof typeof SIZE_STYLES

const DEFAULT_LOGO_URL = BrownLogo
export const LOGIN_LOGO_URL = BrownLogo
export const DARK_LOGO_URL = WhiteLogo

export interface Props extends HTMLAttributes<HTMLDivElement> {
    size?: LogoSize | ''
    src?: string
    /** Override logo in dark mode (default: DARK_LOGO_URL) */
    darkSrc?: string
}

const Logo = ({ size = 'lg', src = DEFAULT_LOGO_URL, darkSrc, className, ...rest }: Props) => {
    const mode = Themestore((s) => s.mode)
    // Swap known "light" logos automatically in dark mode.
    const isBrownSrc = src === DEFAULT_LOGO_URL || src === LOGIN_LOGO_URL
    const effectiveSrc =
        mode === 'dark'
            ? (darkSrc ?? (isBrownSrc ? DARK_LOGO_URL : src))
            : src
    const key = (size === '' ? 'lg' : size) as LogoSize
    const styles = SIZE_STYLES[key] ?? SIZE_STYLES.lg

    return (
        <div
            className={`flex font-medium rounded-base items-center justify-center gap-2 ${styles.container} ${className ?? ''}`}
            {...rest}
        >
            <img
                src={effectiveSrc}
                alt="Hustle In"
                // Logo assets are square with lots of transparent padding; `object-cover`
                // crops that padding so the mark fills the fixed-height container.
                className="h-full w-full object-cover object-center"
            />
        </div>
    )
}

export default Logo