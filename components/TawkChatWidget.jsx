"use client";

import { useEffect } from "react";

const TAWK_PROPERTY_ID =
  process.env.NEXT_PUBLIC_TAWK_PROPERTY_ID || "6adbb16381a964346f443c32";
const TAWK_WIDGET_ID = process.env.NEXT_PUBLIC_TAWK_WIDGET_ID || "1k5l2prtp";

export default function TawkChatWidget() {
  useEffect(() => {
    if (document.getElementById("tawk-chat-widget")) return;

    window.Tawk_API = window.Tawk_API || {};
    window.Tawk_LoadStart = new Date();
    const script = document.createElement("script");
    script.id = "tawk-chat-widget";
    script.async = true;
    script.src = `https://embed.tawk.to/${TAWK_PROPERTY_ID}/${TAWK_WIDGET_ID}`;
    script.charset = "UTF-8";
    script.setAttribute("crossorigin", "*");
    document.head.appendChild(script);
  }, []);

  return null;
}

export function openTawkChat() {
  if (typeof window === "undefined" || typeof window.Tawk_API?.maximize !== "function") {
    return false;
  }
  window.Tawk_API.maximize();
  return true;
}
