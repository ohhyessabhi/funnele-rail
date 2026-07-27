import { useEffect } from "react";
import { supabase, isSupabaseConfigured } from "../lib/supabase";
import useAppStore from "../store/appStore";

/**
 * Auth lifecycle. Uses real Supabase Auth (email/password). The `members`
 * row shares the auth user's id (members.id = auth.users.id), which is what
 * the RLS policies rely on.
 */
export function useAuth() {
  const setUser = useAppStore((s) => s.setUser);
  const setLoading = useAppStore((s) => s.setLoading);
  const resetForLogout = useAppStore((s) => s.resetForLogout);
  const user = useAppStore((s) => s.user);
  const loading = useAppStore((s) => s.loading);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    let active = true;

    const loadMember = async (authUser) => {
      const { data: member } = await supabase
        .from("members")
        .select("*")
        .eq("id", authUser.id)
        .single();
      if (active) setUser(member || null);
    };

    supabase.auth.getSession().then(({ data }) => {
      if (data?.session?.user) loadMember(data.session.user);
      else if (active) setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) loadMember(session.user);
      else resetForLogout();
    });

    return () => {
      active = false;
      sub?.subscription?.unsubscribe();
    };
  }, [setUser, setLoading, resetForLogout]);

  const login = async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });
    if (error) throw error;
  };

  /**
   * Sign up a brand-new user. If `orgName` is provided, a new organization is
   * created and this user becomes its Admin; otherwise they join an existing
   * org (via an admin-supplied invite flow — simplified here to org_id).
   */
  const signup = async ({ email, password, name, role, orgName, orgId }) => {
    const cleanEmail = email.trim().toLowerCase();
    const { data, error } = await supabase.auth.signUp({
      email: cleanEmail,
      password,
    });
    if (error) throw error;
    const authUser = data.user;
    if (!authUser) throw new Error("Sign-up did not return a user.");

    let org_id = orgId || null;
    let memberRole = role || "PM";

    if (orgName) {
      const { data: org, error: orgErr } = await supabase
        .from("organizations")
        .insert({ name: orgName.trim(), owner_id: authUser.id })
        .select()
        .single();
      if (orgErr) throw orgErr;
      org_id = org.id;
      memberRole = "Admin"; // first user of a new org is the Admin
    }

    const { data: member, error: memberErr } = await supabase
      .from("members")
      .insert({
        id: authUser.id,
        org_id,
        email: cleanEmail,
        name: name.trim(),
        role: memberRole,
        status: "Active",
      })
      .select()
      .single();
    if (memberErr) throw memberErr;

    setUser(member);
    return member;
  };

  const logout = async () => {
    if (supabase) await supabase.auth.signOut();
    resetForLogout();
  };

  return { user, loading, login, signup, logout };
}
