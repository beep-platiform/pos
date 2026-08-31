"use client";

import { useState } from "react";
import { UserPlus, X, Mail, Clock, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { getErrorMessage } from "@/lib/errors";
import type { UserRole } from "@/types/database.types";

interface Staff {
  id: string;
  user_id: string;
  role: UserRole;
  active: boolean;
  email: string | null;
  full_name: string | null;
}
interface Invite {
  id: string;
  email: string;
  role: UserRole;
  accepted: boolean;
  created_at: string;
}

const ROLES: UserRole[] = ["owner", "manager", "cashier", "waiter", "kitchen", "delivery"];

export default function EmployeesClient({
  role,
  currentUserId,
  initialStaff,
  initialInvites,
}: {
  role: string;
  currentUserId: string;
  initialStaff: Staff[];
  initialInvites: Invite[];
}) {
  const supabase = createClient();
  const isOwner = role === "owner";
  const [staff, setStaff] = useState<Staff[]>(initialStaff);
  const [invites, setInvites] = useState<Invite[]>(initialInvites);
  const [showInvite, setShowInvite] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function updateRole(member: Staff, newRole: UserRole, active: boolean) {
    setError(null);
    const { error: err } = await supabase.rpc("update_staff_role", {
      p_business_user_id: member.id,
      p_new_role: newRole,
      p_active: active,
    });
    if (err) {
      setError(getErrorMessage(err, "Unable to update this team member."));
      return;
    }
    setStaff((prev) => prev.map((s) => (s.id === member.id ? { ...s, role: newRole, active } : s)));
  }

  async function cancelInvite(invite: Invite) {
    const { error: err } = await supabase.from("invites").delete().eq("id", invite.id);
    if (err) {
      setError(getErrorMessage(err, "Unable to cancel this invite."));
      return;
    }
    setInvites((prev) => prev.filter((i) => i.id !== invite.id));
  }

  async function removeStaff(member: Staff) {
    if (!confirm(`Remove ${member.full_name || member.email} from the team? A backup copy is kept.`)) return;
    const { error: err } = await supabase.rpc("delete_staff_member", { p_business_user_id: member.id });
    if (err) {
      setError(getErrorMessage(err, "Unable to remove this team member."));
      return;
    }
    setStaff((prev) => prev.filter((s) => s.id !== member.id));
  }

  return (
    <div className="p-6 max-w-3xl">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold mb-1">Employees</h1>
          <p className="text-sm text-muted">Manage roles and invite new team members.</p>
        </div>
        <button
          onClick={() => setShowInvite(true)}
          className="flex items-center gap-2 bg-primary hover:bg-primary-dark text-white text-sm font-medium px-4 py-2.5 rounded-xl transition"
        >
          <UserPlus size={16} /> Invite
        </button>
      </div>

      {error && <div className="mb-4 bg-red-50 text-danger text-sm px-4 py-2.5 rounded-lg">{error}</div>}

      <div className="bg-surface border border-border rounded-2xl overflow-hidden mb-6">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs text-muted uppercase tracking-wide">
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">Role</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {staff.map((s) => {
              const isSelf = s.user_id === currentUserId;
              const canEditRole = isOwner || (s.role !== "owner" && !isSelf);
              return (
                <tr key={s.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3 font-medium">{s.full_name || "—"}{isSelf && <span className="text-muted font-normal"> (you)</span>}</td>
                  <td className="px-4 py-3 text-muted">{s.email}</td>
                  <td className="px-4 py-3">
                    <select
                      value={s.role}
                      disabled={!canEditRole}
                      onChange={(e) => updateRole(s, e.target.value as UserRole, s.active)}
                      className="text-xs rounded-lg border border-border px-2 py-1.5 outline-none disabled:opacity-60 capitalize"
                    >
                      {ROLES.filter((r) => r !== "owner" || isOwner).map((r) => (
                        <option key={r} value={r} className="capitalize">
                          {r}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      disabled={!canEditRole}
                      onClick={() => updateRole(s, s.role, !s.active)}
                      className={`text-xs font-medium px-2.5 py-1 rounded-full disabled:opacity-60 ${
                        s.active ? "bg-primary-light text-primary-dark" : "bg-red-50 text-danger"
                      }`}
                    >
                      {s.active ? "Active" : "Deactivated"}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {canEditRole && s.role !== "owner" && !isSelf && (
                      <button
                        onClick={() => removeStaff(s)}
                        className="text-muted hover:text-danger p-1"
                        aria-label="Remove"
                        title="Remove from team"
                      >
                        <Trash2 size={13} className="inline" />
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {invites.length > 0 && (
        <>
          <p className="text-xs font-medium text-muted uppercase tracking-wide mb-2">Pending invites</p>
          <div className="space-y-1.5">
            {invites.map((inv) => (
              <div
                key={inv.id}
                className="flex items-center justify-between bg-surface border border-border rounded-xl px-4 py-3 text-sm"
              >
                <div className="flex items-center gap-2">
                  <Mail size={14} className="text-muted" />
                  <span>{inv.email}</span>
                  <span className="text-xs text-muted capitalize">· {inv.role}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-muted flex items-center gap-1">
                    <Clock size={11} /> Pending
                  </span>
                  <button onClick={() => cancelInvite(inv)} className="text-muted hover:text-danger">
                    <X size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {showInvite && (
        <InviteModal
          isOwner={isOwner}
          onClose={() => setShowInvite(false)}
          onCreated={(invite) => {
            setInvites((prev) => [invite, ...prev.filter((i) => i.email !== invite.email)]);
            setShowInvite(false);
          }}
        />
      )}
    </div>
  );
}

function InviteModal({
  isOwner,
  onClose,
  onCreated,
}: {
  isOwner: boolean;
  onClose: () => void;
  onCreated: (invite: Invite) => void;
}) {
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<UserRole>("cashier");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      const { error: err } = await supabase.rpc("create_invite", { p_email: email, p_role: inviteRole });
      if (err) throw err;
      onCreated({ id: crypto.randomUUID(), email: email.toLowerCase(), role: inviteRole, accepted: false, created_at: new Date().toISOString() });
    } catch (err) {
      setError(getErrorMessage(err, "Unable to send this invite."));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
      <div className="bg-surface rounded-2xl w-full max-w-sm p-6 relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-muted hover:text-foreground">
          <X size={18} />
        </button>
        <h3 className="font-semibold text-lg mb-1">Invite a team member</h3>
        <p className="text-xs text-muted mb-4">
          They&apos;ll be able to join with this role once they sign up (or log in) using this email.
        </p>

        <div className="space-y-3">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="teammate@email.com"
            className="w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/40"
          />
          <select
            value={inviteRole}
            onChange={(e) => setInviteRole(e.target.value as UserRole)}
            className="w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/40 capitalize"
          >
            {ROLES.filter((r) => r !== "owner" || isOwner).map((r) => (
              <option key={r} value={r} className="capitalize">
                {r}
              </option>
            ))}
          </select>
        </div>

        {error && <p className="text-sm text-danger mt-3">{error}</p>}

        <button
          disabled={!email || saving}
          onClick={handleSave}
          className="w-full mt-5 bg-primary hover:bg-primary-dark text-white font-semibold py-2.5 rounded-lg disabled:opacity-50"
        >
          {saving ? "Saving…" : "Send invite"}
        </button>
      </div>
    </div>
  );
}
