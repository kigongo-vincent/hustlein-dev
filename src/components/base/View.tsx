import { HTMLAttributes } from 'react'
import { Themestore } from '../../data/Themestore'

type bgMode = "bg" | "fg" | "p"
export interface Props extends HTMLAttributes<HTMLDivElement> {
    bg?: bgMode

}

const View = ({ bg = "bg", children, className, style, ...rest }: Props) => {
    const { current } = Themestore()
    const bgColor = bg == "p" ? current?.brand?.primary : bg == "fg" ? current?.system?.foreground : current?.system?.background
    return (
        <div
            className={`${bg == "fg" && "shadow-custom"} ${className}`}
            style={{ backgroundColor: bgColor, ...style }}
            {...rest}
        >
            {children}
        </div>
    )
}

export default View