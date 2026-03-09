import { HTMLAttributes } from "react"
import { themeMode, Themestore } from "../../data/Themestore"

type fontSize = "sm" | "md" | "lg" | "xl" | ""
export interface Props extends HTMLAttributes<HTMLParagraphElement> {
  variant?: fontSize
  mode?: themeMode
  color?: string
}

/** Scale factor on Windows so text matches Mac visual size (Windows often renders px smaller). */
const isWindows =
  typeof navigator !== "undefined" && /Win/i.test(navigator.userAgent)
const FONT_SCALE_WINDOWS = 1.12

const _base = 12.5
const _min = 11
export const baseFontSize = isWindows ? _base * FONT_SCALE_WINDOWS : _base
/** Max font size (px) for the app; lg/xl variants use this so body text never exceeds base. */
export const maxFontSize = baseFontSize
/** Smallest allowed font size (px) for the whole app. */
export const minFontSize = isWindows ? _min * FONT_SCALE_WINDOWS : _min

/** 80% for small text; never below minFontSize. */
const getSize = (fontSize: fontSize): number => {
  switch (fontSize) {
    case "sm":
      return Math.max(minFontSize, baseFontSize * 0.8)
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

const Text = ({ className, children, variant = "", mode = "dark", color, style, ...rest }: Props) => {
  const { current } = Themestore()
  return (
    <p
      className={`${className}`}
      style={{
        fontSize: getSize(variant),
        lineHeight: getLineHeight(variant),
        color: color ? color : mode == "light" ? "white" : current?.system?.dark,
        ...style,
      }}
      {...rest}
    >
      {children}
    </p>
  )
}

export default Text