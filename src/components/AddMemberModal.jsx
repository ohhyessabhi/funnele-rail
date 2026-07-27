import { useState } from "react";
import useAppStore from "../store/appStore";

/**
 * Team members are created by signing up themselves (their auth user id
 * becomes their members.id — see the schema notes in supabase/migrations).
 * There's no server-side "invite" email yet, so this just hands the admin a
 * shareable link + instructions, and the new member appears in Team
 * automatically the moment they sign up.
 */
export function AddMemberModal({ onClose }) {
  const showToast = useAppStore((s) => s.showToast);
  const orgId = useAppStore((s) => s.user?.org_id);
  const [copied, setCopied] = useState(false);

  const signupUrl = `${window.location.origin}/?org=${orgId}`;

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(signupUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      showToast("Couldn't copy — copy the link manually", true);
    }
  };

  return (
    <>
      <div className="scrim" onClick={onClose} />
      <div className="modal">
        <div className="modal-h">
          <div className="k">Invite</div>
          <h3>Invite a team member</h3>
        </div>
        <div className="modal-b">
          <p style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.6 }}>
            Team members create their own account — send them this link and
            they’ll land straight on a sign-up form pre-set to join your
            organization. They’ll show up here automatically once they do.
          </p>
          <div className="fl" style={{ marginTop: 14 }}>
            <label>Sign-up link</label>
            <input readOnly value={signupUrl} onFocus={(e) => e.target.select()} />
          </div>
        </div>
        <div className="modal-f">
          <span className="sp" />
          <button className="btn btn-sm" onClick={onClose}>
            Close
          </button>
          <button className="btn btn-primary btn-sm" onClick={copyLink}>
            {copied ? "Copied!" : "Copy link"}
          </button>
        </div>
      </div>
    </>
  );
}
