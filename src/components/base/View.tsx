import { HTMLAttributes } from 'react'
import { Themestore } from '../../data/Themestore'

type bgMode = "bg" | "fg" | "p"
export interface Props extends HTMLAttributes<HTMLDivElement> {
    bg?: bgMode
    /** When true, do not add shadow (e.g. for project cards) */
    noShadow?: boolean
}

const View = ({ bg = "bg", children, className, style, noShadow, ...rest }: Props) => {
    const { current } = Themestore()
    const bgColor = bg == "p" ? current?.brand?.primary : bg == "fg" ? current?.system?.foreground : current?.system?.background
    return (
        <div
            className={`${bg === "fg" && !noShadow ? "shadow-custom" : ""} ${className ?? ""}`.trim()}
            style={{ backgroundColor: bgColor, ...style }}
            {...rest}
        >
            {children}
        </div>
    )
}

export default View