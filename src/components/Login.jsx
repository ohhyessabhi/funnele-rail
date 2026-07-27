import { useState } from "react";
import { ROLES } from "../lib/constants";
import { isSupabaseConfigured } from "../lib/supabase";
import { useAuth } from "../hooks/useAuth";

// An invite link (?org=<uuid>) drops the visitor straight into "join this
// organization" sign-up instead of making them paste a raw org id.
const invitedOrgId = new URLSearchParams(window.location.search).get("org");

/**
 * Real Supabase Auth login. Two modes:
 *  - Sign in (email + password)
 *  - Sign up (new user). Providing an org name creates a new org and makes
 *    this user its Admin; otherwise they join an existing org by id.
 */
export function Login() {
  const { login, signup } = useAuth();
  const [mode, setMode] = useState(invitedOrgId ? "signup" : "signin");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState("PM");
  const [orgName, setOrgName] = useState("");
  const [orgId, setOrgId] = useState(invitedOrgId || "");
  const [newOrg, setNewOrg] = useState(!invitedOrgId);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      if (mode === "signin") {
        await login(email, password);
      } else {
        await signup({
          email,
          password,
          name,
          role: newOrg ? "Admin" : role,
          orgName: newOrg ? orgName : undefined,
          orgId: newOrg ? undefined : orgId,
        });
      }
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="login-screen">
      <div className="login-logo">f</div>
      <div className="login-content">
        <h2>Welcome to Funnele</h2>
        <p>
          {mode === "signin"
            ? "Sign in to get back to work"
            : "Create your account"}
        </p>

        {!isSupabaseConfigured && (
          <div className="login-error" style={{ marginBottom: 16 }}>
            Supabase isn’t configured yet. Copy <code>.env.local.example</code>{" "}
            to <code>.env.local</code>, add your project URL + anon key, and
            restart the dev server.
          </div>
        )}

        <form className="login-form" onSubmit={submit}>
          {mode === "signup" && (
            <>
              <label>Full name</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Priya Sharma"
                required
              />
            </>
          )}

          <label>Work email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@funnele.com"
            autoComplete="email"
            required
          />

          <label>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            autoComplete={mode === "signin" ? "current-password" : "new-password"}
            required
          />

          {mode === "signup" && invitedOrgId && (
            <div
              style={{
                fontSize: 13,
                color: "var(--muted)",
                background: "var(--paper)",
                border: "1px solid var(--line)",
                borderRadius: 8,
                padding: "8px 12px",
              }}
            >
              You’re joining your team’s existing organization.
            </div>
          )}

          {mode === "signup" && !invitedOrgId && (
            <>
              <label>Organization</label>
              <select
                value={newOrg ? "new" : "existing"}
                onChange={(e) => setNewOrg(e.target.value === "new")}
              >
                <option value="new">Create a new organization (I’m Admin)</option>
                <option value="existing">Join an existing organization</option>
              </select>

              {newOrg ? (
                <input
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  placeholder="Organization name (e.g. Funnele)"
                  required
                />
              ) : (
                <input
                  value={orgId}
                  onChange={(e) => setOrgId(e.target.value)}
                  placeholder="Organization ID (from your admin)"
                  required
                />
              )}
            </>
          )}

          {mode === "signup" && !newOrg && (
            <select value={role} onChange={(e) => setRole(e.target.value)}>
              {ROLES.filter((r) => r !== "Admin").map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          )}

          {error && <div className="login-error">{error}</div>}

          <button
            type="submit"
            className="btn btn-primary"
            disabled={busy || !isSupabaseConfigured}
            style={{ marginTop: 8, padding: "11px 14px" }}
          >
            {busy
              ? "Please wait…"
              : mode === "signin"
              ? "Sign in"
              : "Create account"}
          </button>
        </form>

        <div className="login-toggle">
          {mode === "signin" ? (
            <>
              New here?{" "}
              <button type="button" onClick={() => setMode("signup")}>
                Create an account
              </button>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <button type="button" onClick={() => setMode("signin")}>
                Sign in
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
