import Script from 'next/script'
import React from 'react'

export default function LiveChat() {
  if (!process.env.NEXT_PUBLIC_TAWKTO_EMBED_URL) {
    return null
  }

  return (
    <>
      <Script
        id='tawkto'
        strategy='afterInteractive'
        dangerouslySetInnerHTML={{
          __html: `
            var Tawk_API=Tawk_API||{}, Tawk_LoadStart=new Date();
            (function(){
            var s1=document.createElement("script"),s0=document.getElementsByTagName("script")[0];
            s1.async=true;
            s1.src='${process.env.NEXT_PUBLIC_TAWKTO_EMBED_URL}';
            s1.charset='UTF-8';
            s1.setAttribute('crossorigin','*');
            s0.parentNode.insertBefore(s1,s0);
            })();
        `,
        }}
      />
    </>
  )
}
