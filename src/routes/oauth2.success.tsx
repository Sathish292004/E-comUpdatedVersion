import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { z } from "zod";
import { useApp } from "@/lib/store/AppContext";
import { AUTH_TOKEN_KEY, AUTH_PROVIDER_KEY } from "@/lib/api/client";
import { profileApi } from "@/lib/api/profile";
import { toast } from "sonner";

const search = z.object({
  token: z.string().optional(),
});

export const Route = createFileRoute("/oauth2/success")({
  head: () => ({
    meta: [{ title: "Signing you in…" }, { name: "robots", content: "noindex" }],
  }),
  validateSearch: (s) => search.parse(s),
  component: OAuthSuccess,
});

function OAuthSuccess() {
  const { login } = useApp();
  const nav = useNavigate();

  useEffect(() => {
    (async () => {
      const params = new URLSearchParams(window.location.search);
      const jwt = params.get("token");

      console.log("TOKEN FROM URL:", jwt);

      if (!jwt) {
        toast.error("Missing OAuth token");
        nav({ to: "/auth/login", replace: true });
        return;
      }

      localStorage.setItem(AUTH_TOKEN_KEY, jwt);
      localStorage.setItem(AUTH_PROVIDER_KEY, "google");

      try {
        window.history.replaceState({}, "", "/oauth2/success");
      } catch {}

      try {
        const me = await profileApi.get();

        login({
          id: me.email,
          name: me.name,
          email: me.email,
          role: "user",
        });

        toast.success("Signed in with Google");

        nav({
          to: "/",
          replace: true,
        });
      } catch (e) {
        console.error(e);

        localStorage.removeItem(AUTH_TOKEN_KEY);

        toast.error("Could not load profile");

        nav({
          to: "/auth/login",
          replace: true,
        });
      }
    })();
  }, []);

  return (
    <div className="grid min-h-[60vh] place-items-center text-sm text-muted-foreground">
      Completing sign-in…
    </div>
  );
}
