import { useEffect, useState, useMemo } from 'react'
import { Link, useSearchParams } from 'react-router'
import Text from '../../components/base/Text'
import { Card, Input, Button } from '../../components/ui'
import { AppPageLayout } from '../../components/layout'
import { Themestore } from '../../data/Themestore'
import { Authstore } from '../../data/Authstore'
import { companyService, userService } from '../../services'
import type { themeMode } from '../../data/Themestore'
import {
  Sun,
  Moon,
  KeyRound,
  Save,
} from 'lucide-react'

type SettingsSectionId = 'general' | 'appearance' | 'account'

const VALID_SECTIONS: SettingsSectionId[] = ['general', 'appearance', 'account']

const SettingsPage = () => {
  const [searchParams] = useSearchParams()
  const sectionParam = searchParams.get('section')
  const activeSection: SettingsSectionId = useMemo(() => {
    if (sectionParam && VALID_SECTIONS.includes(sectionParam as SettingsSectionId)) {
      return sectionParam as SettingsSectionId
    }
    return 'appearance'
  }, [sectionParam])

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

  // Account (profile)
  const [profileName, setProfileName] = useState('')
  const [profileEmail, setProfileEmail] = useState('')
  const [profileAvatarUrl, setProfileAvatarUrl] = useState('')
  const [savingProfile, setSavingProfile] = useState(false)
  const [profileSaved, setProfileSaved] = useState(false)

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
    ;(async () => {
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

  const bg = current?.system?.background ?? '#F4f4f4'
  const dark = current?.system?.dark ?? '#111'
  const primaryColor = current?.brand?.primary ?? '#682308'

  return (
    <AppPageLayout title="Settings" subtitle="Manage your account, company, and preferences" fullWidth>
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
                  label={savingCompany ? 'Saving…' : 'Save company settings'}
                  onClick={handleSaveCompany}
                  disabled={savingCompany || !user?.companyId}
                  startIcon={!savingCompany ? <Save className="w-4 h-4" /> : undefined}
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
                title="Profile"
                subtitle="Name, email, and avatar visible to your team"
                noShadow
              >
                <div className="space-y-4 max-w-xl">
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
                  />
                  <Input
                    label="Avatar URL"
                    value={profileAvatarUrl}
                    onChange={(e) => setProfileAvatarUrl(e.target.value)}
                    placeholder="https://… (optional)"
                  />
                  <div className="flex items-center gap-3 flex-wrap">
                    <Button
                      label={savingProfile ? 'Saving…' : profileSaved ? 'Saved' : 'Save profile'}
                      onClick={handleSaveProfile}
                      disabled={savingProfile || !user?.id}
                      startIcon={
                        !savingProfile && !profileSaved ? (
                          <Save className="w-4 h-4" />
                        ) : undefined
                      }
                    />
                    {profileSaved && (
                      <Text variant="sm" className="opacity-80" color={dark}>
                        Profile updated.
                      </Text>
                    )}
                  </div>
                </div>
              </Card>
              <Card title="Security" subtitle="Password and sign-in" noShadow>
                <div className="space-y-3">
                  <Text variant="sm" className="opacity-90" color={dark}>
                    Change your password or recover your account via email.
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
              </Card>
            </>
          )}

      </div>
    </AppPageLayout>
  )
}

export default SettingsPage
