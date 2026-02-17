import { HTMLAttributes } from 'react'

const SIZE_STYLES = {
    sm: {
        container: 'h-[24px] w-[90px]',
        img: { width: 90, height: 60 },
    },
    md: {
        container: 'h-[32px] w-[120px]',
        img: { width: 120, height: 80 },
    },
    lg: {
        container: 'h-[40px] w-[150px]',
        img: { width: 150, height: 100 },
    },
    xl: {
        container: 'h-[48px] w-[180px]',
        img: { width: 180, height: 120 },
    },
} as const

export type LogoSize = keyof typeof SIZE_STYLES

const DEFAULT_LOGO_URL = 'https://res.cloudinary.com/dauv815j5/image/upload/v1771319637/Hustle_In_No_BG_Boxed_dnx3dv.png'
export const LOGIN_LOGO_URL = 'https://res.cloudinary.com/dauv815j5/image/upload/v1771319637/Hustle_In_No_BG_Brown_b9cg7e.png'

export interface Props extends HTMLAttributes<HTMLDivElement> {
    size?: LogoSize | ''
    src?: string
}

const Logo = ({ size = 'lg', src = DEFAULT_LOGO_URL, className, ...rest }: Props) => {
    const key = (size === '' ? 'lg' : size) as LogoSize
    const styles = SIZE_STYLES[key] ?? SIZE_STYLES.lg

    return (
        <div
            className={`flex font-medium rounded-base items-center justify-center gap-2 ${styles.container} ${className ?? ''}`}
            {...rest}
        >
            <img
                height={styles.img.height}
                width={styles.img.width}
                src={src}
                alt="Hustle In"
            />
        </div>
    )
}

export default Logo