"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useState } from "react";
import { updateUserProfile } from "@/app/actions";
import UserAvatar from "@/components/UserAvatar";
import { useLocale } from "@/components/LocaleProvider";
import { PRESENCE_STATUSES } from "@/lib/user-presence";

export default function ProfileForm({ user, blobConfigured }) {
  const router = useRouter();
  const { update: updateSession } = useSession();
  const { locale, t } = useLocale();
  const [pending, setPending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [imageUrl, setImageUrl] = useState(user.image || "");

  async function onPhotoChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError("");
    setSuccess("");
    try {
      const form = new FormData();
      form.append("photo", file);
      const res = await fetch("/api/profile/avatar", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al subir");
      setImageUrl(data.url);
      await updateUserProfile({ image: data.url });
      await updateSession({ image: data.url });
      setSuccess(t("profile.saved"));
      router.refresh();
    } catch (err) {
      setError(err.message || "Error al subir foto");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  async function onSubmit(e) {
    e.preventDefault();
    setPending(true);
    setError("");
    setSuccess("");
    const fd = new FormData(e.currentTarget);
    try {
      await updateUserProfile({
        name: fd.get("name"),
        profileStatus: fd.get("profileStatus"),
        statusMessage: fd.get("statusMessage"),
      });
      await updateSession({
        name: String(fd.get("name") || "").trim() || user.email,
        profileStatus: fd.get("profileStatus"),
        statusMessage: fd.get("statusMessage") || null,
      });
      setSuccess(t("profile.saved"));
      router.refresh();
    } catch (err) {
      setError(err.message || "Error al guardar");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="profile-page">
      <div className="card profile-card">
        <div className="profile-photo-block">
          <UserAvatar
            name={user.name}
            email={user.email}
            image={imageUrl}
            profileStatus={user.profileStatus}
            size={88}
            showStatus
            locale={locale}
          />
          <div>
            <p className="profile-photo-label">{t("profile.photo")}</p>
            {blobConfigured ? (
              <label className="btn-secondary profile-upload-btn">
                {uploading ? t("profile.uploading") : t("profile.changePhoto")}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  onChange={onPhotoChange}
                  disabled={uploading || pending}
                  hidden
                />
              </label>
            ) : (
              <p className="muted text-sm">{t("profile.blobMissing")}</p>
            )}
          </div>
        </div>

        <form onSubmit={onSubmit} className="profile-form">
          <div className="field">
            <label htmlFor="profile-name">{t("profile.displayName")}</label>
            <input
              id="profile-name"
              name="name"
              defaultValue={user.name || ""}
              placeholder={user.email}
            />
          </div>
          <div className="field">
            <label htmlFor="profile-email">{t("profile.email")}</label>
            <input id="profile-email" value={user.email} disabled />
          </div>
          <div className="field">
            <label htmlFor="profile-status">{t("profile.status")}</label>
            <select
              id="profile-status"
              name="profileStatus"
              defaultValue={user.profileStatus || "AVAILABLE"}
            >
              {PRESENCE_STATUSES.map((id) => (
                <option key={id} value={id}>
                  {t(`presence.${id}`)}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="profile-status-msg">{t("profile.statusMessage")}</label>
            <input
              id="profile-status-msg"
              name="statusMessage"
              defaultValue={user.statusMessage || ""}
              placeholder={t("profile.statusMessagePlaceholder")}
              maxLength={120}
            />
          </div>
          {error && <p className="form-error">{error}</p>}
          {success && <p className="form-success">{success}</p>}
          <button type="submit" className="btn-primary" disabled={pending || uploading}>
            {pending ? t("profile.saving") : t("profile.save")}
          </button>
        </form>
      </div>

      <p className="profile-team-link muted">
        <Link href="/equipo">{t("profile.viewTeam")}</Link>
      </p>
    </div>
  );
}
