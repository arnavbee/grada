"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

import { AuthShell } from "@/src/components/auth/auth-shell";
import { Button } from "@/src/components/ui/button";
import { InputField } from "@/src/components/ui/input-field";
import { apiRequest } from "@/src/lib/api-client";
import { setAuthCookies } from "@/src/lib/auth-cookie";

interface RegisterResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
}

export default function SignupPage(): JSX.Element {
  const router = useRouter();
  const [companyName, setCompanyName] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);
    try {
      const tokens = await apiRequest<RegisterResponse>("/auth/register", {
        method: "POST",
        body: JSON.stringify({
          company_name: companyName,
          full_name: fullName,
          email,
          password,
        }),
      });

      setAuthCookies(tokens, true);
      router.push("/dashboard");
      router.refresh();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to create account.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthShell
      subtitle="Create your operations workspace and start with catalog, PO prep, received-PO review, and document automation."
      title="Create account"
    >
      <form className="space-y-4" noValidate onSubmit={handleSubmit}>
        <InputField
          label="Company Name"
          onChange={(event) => setCompanyName(event.target.value)}
          placeholder="Your company legal name"
          value={companyName}
        />
        <InputField
          label="Full Name"
          onChange={(event) => setFullName(event.target.value)}
          placeholder="Admin user name"
          value={fullName}
        />
        <InputField
          label="Work Email"
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@company.com"
          type="email"
          value={email}
        />
        <InputField
          hint="At least 8 chars, one uppercase, one number."
          label="Password"
          onChange={(event) => setPassword(event.target.value)}
          type="password"
          value={password}
        />
        <InputField
          label="Confirm Password"
          onChange={(event) => setConfirmPassword(event.target.value)}
          type="password"
          value={confirmPassword}
        />

        {error ? (
          <p className="rounded-md bg-kira-warmgray/20 px-3 py-2 text-sm text-kira-black">
            {error}
          </p>
        ) : null}

        <Button className="w-full" disabled={isSubmitting} type="submit">
          {isSubmitting ? "Creating account..." : "Create Account"}
        </Button>

        <Link
          className="kira-focus-ring inline-flex w-full items-center justify-center rounded-md border border-kira-darkgray bg-transparent px-4 py-2 text-sm font-semibold text-kira-darkgray transition-colors duration-150 hover:bg-kira-warmgray/18 active:bg-kira-warmgray/28"
          href="/"
        >
          Home
        </Link>

        <p className="text-center text-sm text-kira-midgray">
          Already have an account?{" "}
          <Link className="kira-focus-ring text-kira-darkgray hover:text-kira-black" href="/login">
            Sign in
          </Link>
          .
        </p>
      </form>
    </AuthShell>
  );
}
