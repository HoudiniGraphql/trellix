import type { PageProps } from "./$types";

export default function ({}: PageProps) {
  return (
    <div className="h-full flex flex-col items-center pt-20 bg-slate-900">
      <img
        src="/logo.svg"
        width="402"
        height="149"
        style={{ marginBottom: 30 }}
      />
      <div className="space-y-4 max-w-xl text-lg text-slate-300">
        <p>
          This is an implementation of Remix's{" "}
          <a
            href="https://trellix.fly.dev/"
            target="_blank"
            rel="noreferrer"
            style={{ textDecoration: "underline" }}
          >
            Trellix Demo
          </a>{" "}
          in order to provide a point of comparison between the two frameworks.
        </p>
        <p className="text-center">
          🚸 This example does differ slightly since there is no auth layer 🚸
        </p>
        <p>
          Ryan said that only reason he included it was to showcase that Remix
          is a full-stack solution. Since this whole app is driven by an API
          contained within the same project, we don't need to add the extra step
          in your flow to show you that Houdini covers the full stack.{" "}
        </p>

        <p>To view the source, please use the link at the top of the screen.</p>

        {/* <p>If you want to play around, click sign up!</p> */}
      </div>
      <div className="flex w-full justify-evenly max-w-xl mt-8 rounded-3xl p-10 bg-slate-800">
        <a
          href="/home"
          className="text-xl font-medium text-brand-aqua underline"
        >
          Take Me In!
        </a>
      </div>
    </div>
  );
}
