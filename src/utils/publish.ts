import { ReactNode } from "react";
import { toast } from "react-toastify";

export type messageType = "success" | "error" | "";

export const getMessageColor = (mType: messageType): string => {
  switch (mType) {
    case "error":
      return "#D5304B";
    case "success":
      return "#20B038";
    default:
      return "";
  }
};

export function publish(
  message: string | ReactNode,
  mType: messageType = "",
  autoClose?: number | false
) {
  toast(message, {
    autoClose: autoClose,
    style: {
      fontFamily: "poppins",
      fontSize: ".9vw",
      backgroundColor: getMessageColor(mType),
    },
    hideProgressBar: true,
  });
}
