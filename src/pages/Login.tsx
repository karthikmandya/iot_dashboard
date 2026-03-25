import { FormEvent, useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { Lock, ShieldCheck } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type LoginProps = {
  isAuthenticated: boolean;
  onLogin: () => void;
};

const Login = ({ isAuthenticated, onLogin }: LoginProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (username === "admin" && password === "admin") {
      onLogin();
      const nextPath = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname ?? "/";
      navigate(nextPath, { replace: true });
      return;
    }

    setError("Invalid credentials. Use admin / admin.");
  };

  return (
    <div className="min-h-screen px-4 py-8 md:px-6">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-6xl items-center justify-center">
        <div className="grid w-full items-center gap-6 lg:grid-cols-[1.1fr_420px]">
          <div className="space-y-6">
            <Badge className="border-primary/30 bg-primary/12 text-primary">Secure Access</Badge>
            <div className="space-y-4">
              <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-foreground md:text-6xl">
                Snug Hub edge controls, protected behind a login screen.
              </h1>
              <p className="max-w-2xl text-sm leading-7 text-muted-foreground md:text-base">
                Sign in to access the home layout, device telemetry, and live control actions for your IoT deployment.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-[24px] border border-white/10 bg-black/20 p-5">
                <ShieldCheck className="h-5 w-5 text-primary" />
                <p className="mt-4 text-lg font-semibold text-foreground">Authenticated control</p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Device operations and telemetry views are only available after successful sign-in.
                </p>
              </div>
              <div className="rounded-[24px] border border-white/10 bg-black/20 p-5">
                <Lock className="h-5 w-5 text-primary" />
                <p className="mt-4 text-lg font-semibold text-foreground">Default credentials</p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Username: <span className="font-mono text-foreground">admin</span>
                  <br />
                  Password: <span className="font-mono text-foreground">admin</span>
                </p>
              </div>
            </div>
          </div>

          <Card className="panel-shell rounded-[32px] border-white/10">
            <CardContent className="p-6 md:p-7">
              <form className="space-y-5" onSubmit={handleSubmit}>
                <div>
                  <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Login</p>
                  <h2 className="mt-2 text-3xl font-semibold text-foreground">Welcome back</h2>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Enter the default credentials to access the application.
                  </p>
                </div>

                <div className="space-y-2">
                  <label htmlFor="username" className="text-sm font-medium text-foreground">
                    Username
                  </label>
                  <Input
                    id="username"
                    value={username}
                    onChange={(event) => {
                      setUsername(event.target.value);
                      setError("");
                    }}
                    placeholder="admin"
                    className="h-12 rounded-2xl border-white/10 bg-white/[0.03]"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="password" className="text-sm font-medium text-foreground">
                    Password
                  </label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(event) => {
                      setPassword(event.target.value);
                      setError("");
                    }}
                    placeholder="admin"
                    className="h-12 rounded-2xl border-white/10 bg-white/[0.03]"
                  />
                </div>

                {error ? (
                  <div className="rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-red-200">
                    {error}
                  </div>
                ) : null}

                <Button type="submit" className="h-12 w-full rounded-2xl">
                  Sign In
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Login;
