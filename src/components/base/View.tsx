import { HTMLAttributes } from 'react'
import { Themestore } from '../../data/Themestore'

type bgMode = "bg" | "fg" | "p"
export interface Props extends HTMLAttributes<HTMLDivElement> {
    bg?: bgMode

}

const View = ({ bg = "bg", children, className }: Props) => {

    const { current } = Themestore()

    return (
        <div
            className={`${bg == "fg" && "shadow-custom"} ${className}`}
            style={{
                backgroundColor: bg == "p" ? current?.brand?.primary : bg == "fg" ? current?.system?.foreground : current?.system?.background
            }}>
            {children}
        </div>
    )
}

export default View