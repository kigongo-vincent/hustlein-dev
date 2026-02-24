import { HTMLAttributes } from "react"
import { themeMode, Themestore } from "../../data/Themestore"

type fontSize = "sm" | "md" | "lg" | "xl" | ""
export interface Props extends HTMLAttributes<HTMLParagraphElement> {
  variant?: fontSize
  mode?: themeMode
  color?: string
}

export const baseFontSize = 12.5

/** 80% for small text; max size is base (no larger). */
const getSize = (fontSize: fontSize): number => {
  switch (fontSize) {
    case "sm":
      return baseFontSize * 0.8
    case "md":
    case "lg":
    case "xl":
      return baseFontSize
    default:
      return baseFontSize
  }
}

/** Unitless line-height for readability; slightly looser for small, tighter for large. */
const getLineHeight = (fontSize: fontSize): number => {
  switch (fontSize) {
    case "sm":
      return 1.7
    case "md":
      return 1.5
    case "lg":
      return 1.45
    case "xl":
      return 1.4
    default:
      return 1.5
  }
}

const Text = ({ className, children, variant = "", mode = "dark", color }: Props) => {
  const { current } = Themestore()
  return (
    <p className={`${className}`} style={{
      fontSize: getSize(variant),
      lineHeight: getLineHeight(variant),
      color: color ? color : mode == "light" ? "white" : current?.system?.dark
    }}>
      {children}
    </p>
  )
}

export default Text