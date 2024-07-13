import { LayoutProps } from "./$types";
import { LoginIcon } from "~/components/icons";

export default function RootLayout({ children }: LayoutProps) {
  return (
    <div className="h-full flex flex-col min-h-0">
      <div className="bg-slate-900 border-b border-slate-800 flex items-center justify-between py-4 px-8 box-border">
        <a href="/home" className="block leading-3 w-1/3">
          <div className="font-black text-2xl text-white">Trellix</div>
          <div className="text-slate-500">a Houdini Demo</div>
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
        <div className="w-1/3 flex justify-end">
          <a href="/login" className="block text-center">
            <LoginIcon />
            <br />
            <span className="text-slate-500 text-xs uppercase font-bold">
              Log in
            </span>
          </a>
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
