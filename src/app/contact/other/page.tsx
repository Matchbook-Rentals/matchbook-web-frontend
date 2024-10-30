
"use client";

import { useEffect } from "react";

export default function FreshworksWidget() {
  useEffect(() => {
    // Initialize Freshworks settings
    window.fwSettings = {
      widget_id: 157000000242
    };

    // Add Freshworks Widget script
    const script = document.createElement("script");
    script.type = "text/javascript";
    script.src = "https://widget.freshworks.com/widgets/157000000242.js";
    script.async = true;
    script.defer = true;

    // Add initialization script
    const initScript = document.createElement("script");
    initScript.text = `
      !function(){
        if("function"!=typeof window.FreshworksWidget){
          var n=function(){n.q.push(arguments)};
          n.q=[];
          window.FreshworksWidget=n
        }
      }()
    `;

    // Append scripts to document
    document.head.appendChild(initScript);
    document.head.appendChild(script);

    // Cleanup on unmount
    return () => {
      document.head.removeChild(script);
      document.head.removeChild(initScript);
    };
  }, []);

  return null;
}
