import { useEffect, useMemo, useRef, useState } from 'react'
import View from '../../components/base/View'
import Text from '../../components/base/Text'
import { Input, Button, Modal } from '../../components/ui'
import { companyService } from '../../services'
import type { Company } from '../../types'
import { Themestore } from '../../data/Themestore'

interface Props {
  open: boolean
  company: Company | null
  onUpdated: (company: Company) => void
}

const CompanyCompletionModal = ({ open, company, onUpdated }: Props) => {
  const { current } = Themestore()
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [taxRate, setTaxRate] = useState<number | ''>('')
  const [storageLimitMb, setStorageLimitMb] = useState<number | ''>('')
  const [storageUsedMb, setStorageUsedMb] = useState<number | ''>('')
  const [logoUrl, setLogoUrl] = useState<string | null>(null)

  useEffect(() => {
    if (!open || !company) return
    setError('')
    setName(company.name ?? '')
    setEmail(company.email ?? '')
    setPhone(company.phone ?? '')
    setAddress(company.address ?? '')
    setTaxRate(typeof company.taxRate === 'number' ? company.taxRate : '')
    setStorageLimitMb(typeof company.storageLimitMb === 'number' ? company.storageLimitMb : '')
    setStorageUsedMb(typeof company.storageUsedMb === 'number' ? company.storageUsedMb : '')
    setLogoUrl(company.logoUrl ?? null)
  }, [open, company])

  const numbers = useMemo(() => {
    const tax = taxRate === '' ? undefined : Number(taxRate)
    const limit = storageLimitMb === '' ? undefined : Number(storageLimitMb)
    const used = storageUsedMb === '' ? undefined : Number(storageUsedMb)
    return { tax, limit, used }
  }, [taxRate, storageLimitMb, storageUsedMb])

  const isValid = useMemo(() => {
    if (!company) return false
    const hasLogo = !!logoUrl && logoUrl.trim().length > 0
    const hasRequiredStrings =
      name.trim().length > 0 &&
      (email?.trim().length ?? 0) > 0 &&
      (phone?.trim().length ?? 0) > 0 &&
      (address?.trim().length ?? 0) > 0
    const hasRequiredNumbers =
      typeof numbers.tax === 'number' &&
      !Number.isNaN(numbers.tax) &&
      typeof numbers.limit === 'number' &&
      !Number.isNaN(numbers.limit) &&
      typeof numbers.used === 'number' &&
      !Number.isNaN(numbers.used)
    return hasLogo && hasRequiredStrings && hasRequiredNumbers
  }, [address, company, email, logoUrl, name, numbers.limit, numbers.tax, numbers.used, phone])

  const onPickLogo = async (file: File | null) => {
    if (!company || !file) return
    setError('')
    setUploading(true)
    try {
      const uploadedUrl = await companyService.uploadLogo(company.id, file)
      setLogoUrl(uploadedUrl)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Logo upload failed.')
    } finally {
      setUploading(false)
    }
  }

  const handleSave = async () => {
    if (!company) return
    if (!isValid) return
    setError('')
    setSaving(true)
    try {
      const updated = await companyService.update(company.id, {
        name: name.trim() || undefined,
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
        address: address.trim() || undefined,
        taxRate: numbers.tax,
        storageLimitMb: numbers.limit,
        storageUsedMb: numbers.used,
        logoUrl: logoUrl ?? undefined,
      })
      if (updated) onUpdated(updated)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal open={open} onClose={() => {}} closeOnBackdrop={false} variant="wide">
      <View className="space-y-5 p-1">
        <div className="space-y-2">
          <Text variant="md" className="font-semibold">
            Complete company setup
          </Text>
          <Text variant="sm" className="opacity-80">
            You must add company details (including logo) before you can use the app.
          </Text>
        </div>

        <View className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input label="Company name" value={name} onChange={(e) => setName(e.target.value)} />
          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />
          <Input
            label="Phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            autoComplete="tel"
          />
          <Input
            label="Address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            autoComplete="street-address"
          />
        </View>

        <View className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            label="Tax rate (%)"
            type="number"
            min={0}
            max={100}
            value={taxRate}
            onChange={(e) =>
              setTaxRate(e.target.value === '' ? '' : Math.max(0, Number(e.target.value)))
            }
          />
          <Input
            label="Storage limit (MB)"
            type="number"
            min={0}
            value={storageLimitMb}
            onChange={(e) =>
              setStorageLimitMb(e.target.value === '' ? '' : Math.max(0, Number(e.target.value)))
            }
          />
          <Input
            label="Storage used (MB)"
            type="number"
            min={0}
            value={storageUsedMb}
            onChange={(e) =>
              setStorageUsedMb(e.target.value === '' ? '' : Math.max(0, Number(e.target.value)))
            }
          />
        </View>

        <View className="space-y-3">
          <Text variant="sm" className="opacity-90" style={{ color: current?.system?.dark }}>
            Company logo
          </Text>

          <div className="flex items-center gap-4">
            <div
              className="w-20 h-20 rounded-base overflow-hidden border border-gray-200 flex items-center justify-center"
              style={{ borderColor: current?.system?.border ?? undefined }}
            >
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt="Company logo"
                  className="w-full h-full object-cover"
                />
              ) : (
                <Text variant="sm" className="opacity-60">
                  No logo
                </Text>
              )}
            </div>

            <div className="flex-1 flex items-center gap-3 justify-end">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => onPickLogo(e.target.files?.[0] ?? null)}
              />
              <Button
                type="button"
                variant="background"
                label={uploading ? 'Uploading…' : 'Upload logo'}
                disabled={uploading}
                onClick={() => fileInputRef.current?.click()}
              />
            </div>
          </div>
        </View>

        {error && (
          <Text variant="sm" className="opacity-100" color={current?.system?.error}>
            {error}
          </Text>
        )}

        <div className="flex items-center justify-end gap-3 pt-1">
          <Button
            type="button"
            variant="background"
            label={saving ? 'Saving…' : 'Complete setup'}
            disabled={!isValid || saving}
            loading={saving}
            onClick={handleSave}
          />
        </div>
      </View>
    </Modal>
  )
}

export default CompanyCompletionModal

