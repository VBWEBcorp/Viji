import Script from "next/script";
import { connectDB } from "@/lib/db";
import SiteSettings from "@/models/SiteSettings";

export default async function Analytics() {
  let ga: string | undefined;
  let plausible: string | undefined;
  let pixel: string | undefined;
  let custom: string | undefined;

  try {
    await connectDB();
    const settings = await SiteSettings.findOne().lean();
    ga = settings?.analytics?.googleAnalyticsId;
    plausible = settings?.analytics?.plausibleDomain;
    pixel = settings?.analytics?.metaPixelId;
    custom = settings?.analytics?.customHeadScript;
  } catch {
    return null;
  }

  return (
    <>
      {/* Google Analytics 4 */}
      {ga && (
        <>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${ga}`} strategy="afterInteractive" />
          <Script id="ga-init" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${ga}');
            `}
          </Script>
        </>
      )}

      {/* Plausible */}
      {plausible && (
        <Script
          defer
          data-domain={plausible}
          src="https://plausible.io/js/script.js"
          strategy="afterInteractive"
        />
      )}

      {/* Meta Pixel */}
      {pixel && (
        <Script id="meta-pixel" strategy="afterInteractive">
          {`
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '${pixel}');
            fbq('track', 'PageView');
          `}
        </Script>
      )}

      {/* Custom head script (free HTML) */}
      {custom && (
        <div
          aria-hidden="true"
          style={{ display: "none" }}
          dangerouslySetInnerHTML={{ __html: custom }}
        />
      )}
    </>
  );
}
