import { useEffect, useRef, useState } from 'react'
import Avatar from '../../components/base/Avatar'
import Text from '../../components/base/Text'
import { Card, Input, Button } from '../../components/ui'
import { AppPageLayout } from '../../components/layout'
import AvatarCropModal from '../../components/settings/AvatarCropModal'
import { api } from '../../api'
import { Themestore } from '../../data/Themestore'
import { Authstore } from '../../data/Authstore'
import { companyService, projectFileService, projectService, userService } from '../../services'
import type { themeMode } from '../../data/Themestore'
import type { ProjectFileStorageSummary } from '../../types'
import {
  Sun,
  Moon,
  KeyRound,
  Save,
  Camera,
} from 'lucide-react'
import { getGoogleAuthFromJwt, getStoredAuthProvider, syncAuthProviderFromToken } from '../../utils/authProviderStorage'

type SettingsSectionId = 'general' | 'appearance' | 'account'

const SettingsPage = () => {
  const [activeSection] = useState<SettingsSectionId>('account')
  const { current, mode, setTheme, setCustomTheme, customOverrides } = Themestore()
  const { user, setUser } = Authstore()
  const isCompanyAdmin = user?.role === 'company_admin' || user?.role === 'super_admin'

  // Company (General)
  const [savingCompany, setSavingCompany] = useState(false)
  const [companyName, setCompanyName] = useState('')
  const [companyEmail, setCompanyEmail] = useState('')
  const [companyPhone, setCompanyPhone] = useState('')
  const [companyAddress, setCompanyAddress] = useState('')
  const [taxRate, setTaxRate] = useState<number | ''>('')
  const [storageLimitMb, setStorageLimitMb] = useState<number | ''>('')
  const [storageUsedMb, setStorageUsedMb] = useState<number | ''>('')
  const [companyStorageSummary, setCompanyStorageSummary] = useState<ProjectFileStorageSummary | null>(null)

  // Account (profile)
  const [profileName, setProfileName] = useState('')
  const [profileEmail, setProfileEmail] = useState('')
  const [profileAvatarUrl, setProfileAvatarUrl] = useState('')
  const [savingProfile, setSavingProfile] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [profileSaved, setProfileSaved] = useState(false)
  const [passwordCurrent, setPasswordCurrent] = useState('')
  const [passwordNext, setPasswordNext] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [savingPassword, setSavingPassword] = useState(false)
  const [passwordError, setPasswordError] = useState('')
  const [passwordSaved, setPasswordSaved] = useState(false)
  const [cropModalOpen, setCropModalOpen] = useState(false)
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null)
  const cropObjectUrlRef = useRef<string | null>(null)
  const avatarInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    return () => {
      if (cropObjectUrlRef.current) URL.revokeObjectURL(cropObjectUrlRef.current)
    }
  }, [])

  const [bgImageInput, setBgImageInput] = useState(customOverrides?.system?.backgroundImage ?? '')

  useEffect(() => {
    setBgImageInput(customOverrides?.system?.backgroundImage ?? '')
  }, [customOverrides?.system?.backgroundImage])

  const handleSetBgImage = (value: string) => {
    const trimmed = value.trim()
    const newOverrides = { ...customOverrides, system: { ...customOverrides?.system } }
    if (trimmed) {
      const isUrl = trimmed.startsWith('http') || trimmed.startsWith('/')
      newOverrides.system!.backgroundImage = isUrl ? `url(${trimmed})` : trimmed
    } else {
      delete newOverrides.system!.backgroundImage
    }
    setCustomTheme(newOverrides)
  }

  useEffect(() => {
    let cancelled = false
      ; (async () => {
        if (!user?.companyId) return
        const company = await companyService.get(user.companyId)
        if (!company || cancelled) return
        setCompanyName(company.name)
        setCompanyEmail(company.email ?? '')
        setCompanyPhone(company.phone ?? '')
        setCompanyAddress(company.address ?? '')
        setTaxRate(typeof company.taxRate === 'number' ? company.taxRate : '')
        setStorageLimitMb(typeof company.storageLimitMb === 'number' ? company.storageLimitMb : '')
        setStorageUsedMb(typeof company.storageUsedMb === 'number' ? company.storageUsedMb : '')
        try {
          const projects = await projectService.listByCompany(user.companyId)
          if (cancelled) return
          if (projects.length === 0) {
            setCompanyStorageSummary(null)
            return
          }
          const summary = await projectFileService.storageSummary(projects[0].id)
          if (!cancelled) setCompanyStorageSummary(summary)
        } catch {
          if (!cancelled) setCompanyStorageSummary(null)
        }
      })()
    return () => {
      cancelled = true
    }
  }, [user?.companyId])

  useEffect(() => {
    if (!user) return
    setProfileName(user.name)
    setProfileEmail(user.email)
    setProfileAvatarUrl(user.avatarUrl ?? '')
  }, [user?.id, user?.name, user?.email, user?.avatarUrl])

  const [isGoogleAuth, setIsGoogleAuth] = useState(false)

  useEffect(() => {
    if (!user) {
      setIsGoogleAuth(false)
      return
    }
    syncAuthProviderFromToken(user.token)
    const stored = getStoredAuthProvider()
    if (stored === 'google') {
      setIsGoogleAuth(true)
      return
    }
    if (stored === 'password') {
      setIsGoogleAuth(false)
      return
    }
    if (getGoogleAuthFromJwt(user?.token)) {
      setIsGoogleAuth(true)
      return
    }
    const providerCandidate = user as
      | (typeof user & {
          authProvider?: string
          provider?: string
          loginProvider?: string
          isGoogleAuth?: boolean
          googleId?: string
        })
      | null
    const providerName = (
      providerCandidate?.authProvider ??
      providerCandidate?.provider ??
      providerCandidate?.loginProvider ??
      ''
    ).toLowerCase()
    setIsGoogleAuth(
      Boolean(
        providerName.includes('google') ||
          providerCandidate?.isGoogleAuth ||
          providerCandidate?.googleId,
      ),
    )
  }, [user])

  const handleSaveCompany = async () => {
    if (!user?.companyId) return
    setSavingCompany(true)
    try {
      await companyService.update(user.companyId, {
        name: companyName.trim() || undefined,
        email: companyEmail.trim() || undefined,
        phone: companyPhone.trim() || undefined,
        address: companyAddress.trim() || undefined,
        taxRate: taxRate === '' ? undefined : Number(taxRate) || 0,
        storageLimitMb: storageLimitMb === '' ? undefined : Number(storageLimitMb) || 0,
        storageUsedMb: storageUsedMb === '' ? undefined : Number(storageUsedMb) || 0,
      })
    } finally {
      setSavingCompany(false)
    }
  }

  const handleSaveProfile = async () => {
    if (!user?.id) return
    setSavingProfile(true)
    setProfileSaved(false)
    try {
      const updated = await userService.update(user.id, {
        name: profileName.trim() || user.name,
        email: profileEmail.trim() || user.email,
        avatarUrl: profileAvatarUrl.trim() || undefined,
      })
      if (updated) {
        setUser({ ...updated, token: user?.token })
        setProfileSaved(true)
        setTimeout(() => setProfileSaved(false), 3000)
      }
    } finally {
      setSavingProfile(false)
    }
  }

  const releaseCropObjectUrl = () => {
    if (cropObjectUrlRef.current) {
      URL.revokeObjectURL(cropObjectUrlRef.current)
      cropObjectUrlRef.current = null
    }
    setCropImageSrc(null)
  }

  const handleAvatarPick = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (isGoogleAuth) {
      event.target.value = ''
      return
    }
    const file = event.target.files?.[0]
    if (!file || !user?.id) return
    const isImage = file.type.startsWith('image/')
    if (!isImage) return
    releaseCropObjectUrl()
    const url = URL.createObjectURL(file)
    cropObjectUrlRef.current = url
    setCropImageSrc(url)
    setCropModalOpen(true)
    event.target.value = ''
  }

  const handleCropModalClose = () => {
    setCropModalOpen(false)
    releaseCropObjectUrl()
  }

  const handleAvatarCropped = async (dataUrl: string) => {
    if (!user?.id || isGoogleAuth) return
    setUploadingAvatar(true)
    try {
      const updated = await userService.update(user.id, { avatarUrl: dataUrl })
      if (updated) {
        setProfileAvatarUrl(updated.avatarUrl ?? dataUrl)
        setUser({ ...updated, token: user?.token })
      }
    } finally {
      setUploadingAvatar(false)
    }
  }

  const canSubmitPassword =
    !isGoogleAuth &&
    Boolean(user?.id) &&
    !savingPassword &&
    passwordCurrent.trim().length > 0 &&
    passwordNext.trim().length >= 8 &&
    passwordConfirm.trim().length >= 8

  const handleUpdatePassword = async () => {
    if (!user?.id || isGoogleAuth || savingPassword) return
    const currentPassword = passwordCurrent.trim()
    const newPassword = passwordNext.trim()
    const confirmPassword = passwordConfirm.trim()

    setPasswordError('')
    setPasswordSaved(false)

    if (!currentPassword) {
      setPasswordError('Current password is required.')
      return
    }
    if (newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters.')
      return
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('New password and confirmation do not match.')
      return
    }
    if (newPassword === currentPassword) {
      setPasswordError('New password must be different from current password.')
      return
    }

    setSavingPassword(true)
    try {
      const base = import.meta.env.VITE_API_URL ?? '/api'
      const payload = { currentPassword, newPassword, confirmPassword }
      const attempts = [
        api.post<{ message?: string; error?: string }>(`${base}/auth/change-password`, payload),
        api.post<{ message?: string; error?: string }>(`${base}/users/${user.id}/password`, payload),
      ]
      let ok = false
      let lastError = 'Failed to update password.'
      for (const attempt of attempts) {
        try {
          const res = await attempt
          if (res.ok) {
            ok = true
            break
          }
          lastError =
            (typeof res.data === 'object' && res.data && 'error' in res.data && String(res.data.error)) ||
            `Request failed: ${res.status}`
        } catch (err) {
          lastError = err instanceof Error ? err.message : 'Failed to update password.'
        }
      }
      if (!ok) throw new Error(lastError)

      setPasswordCurrent('')
      setPasswordNext('')
      setPasswordConfirm('')
      setPasswordSaved(true)
      setTimeout(() => setPasswordSaved(false), 3000)
    } catch (err) {
      setPasswordError(err instanceof Error ? err.message : 'Failed to update password.')
    } finally {
      setSavingPassword(false)
    }
  }

  const bg = current?.system?.background ?? '#F4f4f4'
  const dark = current?.system?.dark ?? '#111'
  const primaryColor = current?.brand?.primary ?? '#682308'
  const usedBytes = companyStorageSummary
    ? companyStorageSummary.usedBytes
    : ((typeof storageUsedMb === 'number' ? storageUsedMb : 0) * 1024 * 1024)
  const limitBytes = companyStorageSummary
    ? companyStorageSummary.limitBytes
    : ((typeof storageLimitMb === 'number' && storageLimitMb > 0 ? storageLimitMb : 512) * 1024 * 1024)
  const usedMb = usedBytes / (1024 * 1024)
  const limitMb = limitBytes / (1024 * 1024)
  const storagePercent = limitBytes > 0 ? Math.max(0, Math.min(100, (usedBytes / limitBytes) * 100)) : 0

  return (
    <AppPageLayout fullWidth>
      <div className="w-full max-w-3xl space-y-6">
        {/* ——— General (company admin) ——— */}
        {activeSection === 'general' && isCompanyAdmin && (
          <>
            <Card
              title="Company details"
              subtitle="Used on invoices and across the workspace"
              noShadow
            >
              <div className="space-y-3 max-w-xl">
                <Input
                  label="Company name"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="e.g. Acme Corp"
                />
                <Input
                  label="Email"
                  type="email"
                  value={companyEmail}
                  onChange={(e) => setCompanyEmail(e.target.value)}
                  placeholder="billing@company.com"
                />
                <Input
                  label="Phone"
                  value={companyPhone}
                  onChange={(e) => setCompanyPhone(e.target.value)}
                  placeholder="+256 700 000 000"
                />
                <Input
                  label="Address"
                  value={companyAddress}
                  onChange={(e) => setCompanyAddress(e.target.value)}
                  placeholder="Company address"
                />
              </div>
            </Card>
            <Card title="Tax & billing" subtitle="Default tax rate applied to invoices" noShadow>
              <div className="space-y-3 max-w-xs">
                <Input
                  label="Tax rate (%)"
                  type="number"
                  min={0}
                  max={100}
                  value={taxRate === '' ? '' : taxRate}
                  onChange={(e) =>
                    setTaxRate(e.target.value === '' ? '' : Number(e.target.value))
                  }
                  placeholder="e.g. 18"
                />
              </div>
            </Card>
            <Card
              title="Storage"
              subtitle="Workspace storage limit and current usage"
              noShadow
            >
              <div className="space-y-3 max-w-xl">
                <div className="space-y-2 rounded-base p-3" style={{ background: bg }}>
                  <Text variant="sm">{`${usedMb.toFixed(1)} MB / ${limitMb.toFixed(1)} MB used`}</Text>
                  <div className="h-1.5 rounded-full" style={{ background: current?.system?.border }}>
                    <div className="h-full rounded-full" style={{ width: `${storagePercent}%`, background: primaryColor }} />
                  </div>
                </div>
                <Input
                  label="Storage limit (MB)"
                  type="number"
                  min={0}
                  value={storageLimitMb === '' ? '' : storageLimitMb}
                  onChange={(e) =>
                    setStorageLimitMb(e.target.value === '' ? '' : Number(e.target.value))
                  }
                  placeholder="e.g. 10240"
                />
                <Input
                  label="Storage used (MB)"
                  type="number"
                  min={0}
                  value={storageUsedMb === '' ? '' : storageUsedMb}
                  onChange={(e) =>
                    setStorageUsedMb(e.target.value === '' ? '' : Number(e.target.value))
                  }
                  placeholder="e.g. 2048"
                />
              </div>
            </Card>
            <div className="flex items-center gap-3">
              <Button
                label="Save company settings"
                onClick={handleSaveCompany}
                disabled={savingCompany || !user?.companyId}
                loading={savingCompany}
                startIcon={<Save className="w-4 h-4" />}
              />
            </div>
          </>
        )}

        {/* ——— Appearance ——— */}
        {activeSection === 'appearance' && (
          <>
            <Card title="Theme" subtitle="Choose how the app looks" noShadow>
              <div className="space-y-3">
                <Text variant="sm" className="opacity-90" color={dark}>
                  Select light or dark mode. Your choice is saved automatically.
                </Text>
                <div
                  className="inline-flex rounded-base p-1 gap-0"
                  style={{ backgroundColor: bg }}
                >
                  {(['light', 'dark'] as themeMode[]).map((m) => {
                    const isSelected = mode === m
                    return (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setTheme(m)}
                        className={`
                          flex items-center gap-2 py-2 pl-4 pr-4 rounded-base font-normal capitalize
                          transition-all duration-150 ease-out
                          ${isSelected ? 'opacity-100' : 'opacity-80 hover:opacity-100'}
                        `}
                        style={
                          isSelected
                            ? {
                              backgroundColor: primaryColor,
                              color: current?.brand?.onPrimary ?? '#fff',
                            }
                            : { backgroundColor: 'transparent', color: dark }
                        }
                        aria-pressed={isSelected}
                      >
                        {m === 'light' ? (
                          <Sun className="w-4 h-4 shrink-0" aria-hidden />
                        ) : (
                          <Moon className="w-4 h-4 shrink-0" aria-hidden />
                        )}
                        {m}
                      </button>
                    )
                  })}
                </div>
              </div>
            </Card>

            <Card title="Background" subtitle="Customize the main content area background" noShadow>
              <div className="space-y-4 max-w-xl">
                <Text variant="sm" className="opacity-70" color={dark}>
                  Paste an image URL or a CSS gradient value. Leave empty for the default solid color.
                </Text>
                <div className="flex items-end gap-3">
                  <div className="flex-1">
                    <Input
                      label="Image URL or CSS gradient"
                      placeholder="https://example.com/bg.jpg or linear-gradient(...)"
                      value={bgImageInput}
                      onChange={(e) => setBgImageInput(e.target.value)}
                    />
                  </div>
                  <Button
                    label="Apply"
                    size="sm"
                    onClick={() => handleSetBgImage(bgImageInput)}
                    startIcon={<Save className="w-4 h-4 shrink-0" />}
                  />
                </div>
                {current?.system?.backgroundImage && (
                  <div className="flex items-center gap-3">
                    <div
                      className="w-20 h-14 rounded-base shrink-0"
                      style={{
                        backgroundImage: current.system.backgroundImage,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        backgroundColor: bg,
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => { setBgImageInput(''); handleSetBgImage('') }}
                      className="text-[12px] font-medium transition-opacity hover:opacity-80"
                      style={{ color: current?.system?.error ?? 'red' }}
                    >
                      Remove background
                    </button>
                  </div>
                )}
              </div>
            </Card>
          </>
        )}

        {/* ——— Account ——— */}
        {activeSection === 'account' && (
          <>
            <Card
              // title="Edit profile"
              // subtitle="Instagram-style profile settings"
              noShadow
              className='py-[3rem]'
            >
              <div className="max-w-xl mx-auto space-y-5">
                <div className="flex justify-center pt-1">
                  <div className="relative">
                    <Avatar src={profileAvatarUrl} name={profileName || user?.name} size="xl" />
                    <button
                      type="button"
                      onClick={() => {
                        if (isGoogleAuth) return
                        avatarInputRef.current?.click()
                      }}
                      aria-label="Upload profile image"
                      disabled={uploadingAvatar || isGoogleAuth}
                      className={`absolute -bottom-1 -right-1 h-9 w-9 rounded-full border flex items-center justify-center transition-opacity hover:opacity-90 disabled:opacity-50 ${isGoogleAuth ? 'cursor-not-allowed' : ''}`}
                      style={{
                        background: current?.system?.foreground ?? '#fff',
                        borderColor: current?.system?.border,
                        color: current?.brand?.primary ?? '#682308',
                      }}
                    >
                      <Camera className="w-4 h-4" />
                    </button>
                    <input
                      ref={avatarInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      disabled={isGoogleAuth}
                      onChange={handleAvatarPick}
                    />
                  </div>
                </div>
                <Text variant="sm" className="text-center opacity-80" color={dark}>
                  {uploadingAvatar
                    ? 'Uploading avatar...'
                    : isGoogleAuth
                      ? 'Profile photo is managed by your Google account.'
                      : 'Tap the camera badge to change your photo'}
                </Text>
                <Input
                  label="Display name"
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  placeholder="Your name"
                />
                <Input
                  label="Email"
                  type="email"

                  value={profileEmail}
                  onChange={(e) => setProfileEmail(e.target.value)}
                  placeholder="you@company.com"
                  disabled={isGoogleAuth}
                  hint={isGoogleAuth ? 'Email is managed by your Google account.' : undefined}
                />
                {/* <Input
                  label="Avatar URL"
                  value={profileAvatarUrl}
                  onChange={(e) => setProfileAvatarUrl(e.target.value)}
                  placeholder="https://… (optional)"
                /> */}
                {!isGoogleAuth && (
                  <>
                    <Input
                      label="Current password"
                      type="password"
                      value={passwordCurrent}
                      onChange={(e) => setPasswordCurrent(e.target.value)}
                      placeholder="Current password"
                    />
                    <Input
                      label="New password"
                      type="password"
                      value={passwordNext}
                      onChange={(e) => setPasswordNext(e.target.value)}
                      placeholder="New password"
                    />
                    <Input
                      label="Confirm new password"
                      type="password"
                      value={passwordConfirm}
                      onChange={(e) => setPasswordConfirm(e.target.value)}
                      placeholder="Confirm new password"
                    />
                  </>
                )}
                {isGoogleAuth && (
                  <Text variant="sm" className="opacity-80" color={dark}>
                    You signed in with Google. Password change is not available for this account.
                  </Text>
                )}
                <div className="flex items-center gap-3 flex-wrap">
                  <Button
                    label={profileSaved ? 'Saved' : 'Save profile'}
                    onClick={handleSaveProfile}
                    disabled={savingProfile || !user?.id}
                    loading={savingProfile}
                    startIcon={!profileSaved ? <Save className="w-4 h-4" /> : undefined}
                  />
                  {!isGoogleAuth && (
                    <Button
                      label="Update password"
                      variant="outlinePrimary"
                      onClick={handleUpdatePassword}
                      disabled={!canSubmitPassword}
                      loading={savingPassword}
                      startIcon={<KeyRound className="w-4 h-4" />}
                    />
                  )}
                  {passwordSaved && (
                    <Text variant="sm" className="opacity-80" color={dark}>
                      Password updated.
                    </Text>
                  )}
                  {passwordError && (
                    <Text variant="sm" color={current?.system?.error}>
                      {passwordError}
                    </Text>
                  )}
                  {profileSaved && (
                    <Text variant="sm" className="opacity-80" color={dark}>
                      Profile updated.
                    </Text>
                  )}
                </div>
              </div>
            </Card>
            {isCompanyAdmin && (
              <Card title="Company storage usage" subtitle="Company-wide usage across all projects" noShadow>
                <div className="space-y-2 max-w-xl">
                  <Text variant="sm">{`${usedMb.toFixed(1)} MB / ${limitMb.toFixed(1)} MB used`}</Text>
                  <div className="h-1.5 rounded-full" style={{ background: current?.system?.border }}>
                    <div className="h-full rounded-full" style={{ width: `${storagePercent}%`, background: primaryColor }} />
                  </div>
                </div>
              </Card>
            )}
            <AvatarCropModal
              open={cropModalOpen}
              imageSrc={cropImageSrc}
              onClose={handleCropModalClose}
              onConfirm={handleAvatarCropped}
            />
            {/* <Card title="Security" subtitle="Password and sign-in recovery" noShadow>
              <div className="space-y-3">
                <Text variant="sm" className="opacity-90" color={dark}>
                  Use email recovery when you cannot access your account.
                </Text>
                <Link
                  to="/auth/forgot-password"
                  className="inline-flex items-center gap-2 py-2 px-3 rounded-base font-normal transition opacity hover:opacity-90"
                  style={{ color: primaryColor }}
                >
                  <KeyRound className="w-4 h-4 shrink-0" aria-hidden />
                  <span>Change password / Forgot password</span>
                </Link>
              </div>
            </Card> */}
          </>
        )}

      </div>
    </AppPageLayout>
  )
}

export default SettingsPage
