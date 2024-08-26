import { useCache } from "$houdini/plugins/houdini-react/runtime/routing";
import React from "react";

import { LayoutProps } from "./$types";

export default function RootLayout({ children }: LayoutProps) {
  const cache = useCache();
  React.useEffect(() => {
    // @ts-ignore
    window.cache = cache;
  });

  return (
    <div className="h-full flex flex-col min-h-0">
      <div className="bg-slate-900 border-b border-slate-800 flex items-center justify-between py-4 px-8 box-border">
        <a href="/home" className="block leading-3 w-1/3">
          <div className="font-black text-2xl text-white">Trellix</div>
          <div className="text-slate-500">a Houdini Clone of a Remix Demo</div>
        </a>
        <div className="flex items-center gap-6">
          <IconLink
            href="https://github.com/houdinigraphql/trellix"
            label="Source"
            icon="/github-mark-white.png"
          />
          <IconLink
            href="https://houdinigraphql.com/api/react"
            icon="/hat.svg"
            label="Docs"
          />
        </div>
      </div>

      <div className="flex-grow min-h-0 h-full">{children}</div>
    </div>
  );
}

function IconLink({
  icon,
  href,
  label,
}: {
  icon: string;
  href: string;
  label: string;
}) {
  return (
    <a
      href={href}
      className="text-slate-500 text-xs uppercase font-bold text-center"
    >
      <img src={icon} aria-hidden className="inline-block h-8" />
      <span className="block mt-2">{label}</span>
    </a>
  );
}
