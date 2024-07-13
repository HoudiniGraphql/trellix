import { Input, Label } from "~/components/input";
import { Button } from "~/components/button";

export default function Signup() {
  return (
    <div className="flex min-h-full flex-1 flex-col mt-20 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2
          id="login-header"
          className="mt-6 text-center text-2xl font-bold leading-9 tracking-tight text-gray-900"
        >
          Log in
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
                aria-describedby={"login-header"}
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

            <div>
              <Button type="submit">Sign in</Button>
            </div>
            <div className="text-sm text-slate-500">
              Don't have an account?{" "}
              <a className="underline" href="/signup">
                Sign up
              </a>
              .
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
