"use client";

import { useEffect } from "react";
import Script from "next/script";

const GA_MEASUREMENT_ID = "G-RHHKT4KCGM"; // Replace with your own ID

export default function GoogleAnalytics() {
  useEffect(() => {
    // Optional: Log page views on route change (for SPA-like behavior)
   

    if (typeof window !== "undefined") {
      // You can hook into route changes using your router (optional)
    }

    return () => {
      // Clean up if needed
    };
  }, []);

  return (
    <>
      <Script
        strategy="afterInteractive"
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){ dataLayer.push(arguments); }
          gtag('js', new Date());
          gtag('config', '${GA_MEASUREMENT_ID}');
        `}
      </Script>
    </>
  );
}
