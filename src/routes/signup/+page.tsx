import { Button } from "~/components/button";
import { Input, Label } from "~/components/input";

export default function Signup() {
  return (
    <div className="flex min-h-full flex-1 flex-col mt-20 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2
          id="signup-header"
          className="mt-6 text-center text-2xl font-bold leading-9 tracking-tight text-gray-900"
        >
          Sign up
        </h2>
      </div>

      <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-[480px]">
        <div className="bg-white px-6 py-12 shadow sm:rounded-lg sm:px-12">
          <form className="space-y-6" method="post">
            <div>
              <Label htmlFor="email">Email address </Label>
              <Input
                autoFocus
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                aria-describedby={"signup-header"}
                required
              />
            </div>

            <div>
              <Label htmlFor="password">Password </Label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                aria-describedby="password-error"
                required
              />
            </div>

            <Button type="submit">Sign in</Button>

            <div className="text-sm text-slate-500">
              Already have an account?{" "}
              <a className="underline" href="/login">
                Log in
              </a>
              .
            </div>
          </form>
        </div>
        <div className="mt-8 space-y-2 mx-2">
          <h3 className="font-bold text-black">Privacy Notice</h3>
          <p>
            We won't use your email address for anything other than
            authenticating with this demo application. This app doesn't send
            email anyway, so you can put whatever fake email address you want.
          </p>
          <h3 className="font-bold text-black">Terms of Service</h3>
          <p>
            This is a demo app, there are no terms of service. Don't be
            surprised if your data dissappears.
          </p>
        </div>
      </div>
    </div>
  );
}
