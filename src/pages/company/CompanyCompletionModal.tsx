import { useEffect, useMemo, useState, useRef } from 'react'
import View from '../../components/base/View'
import Text from '../../components/base/Text'
import { Input, Button, Modal, FileAttachmentDropzone } from '../../components/ui'
import { companyService } from '../../services'
import type { Company } from '../../types'
import { Themestore } from '../../data/Themestore'
import { notifyError, notifySuccess } from '../../data/NotificationStore'

interface Props {
  open: boolean
  company: Company | null
  onUpdated: (company: Company) => void
  onClose: () => void
}

const CompanyCompletionModal = ({ open, company, onUpdated, onClose }: Props) => {
  const { current } = Themestore()

  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [logoUrl, setLogoUrl] = useState<string | null>(null)
  const [logoFiles, setLogoFiles] = useState<File[]>([])
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const logoPreviewUrlRef = useRef<string | null>(null)

  useEffect(() => {
    if (!open || !company) return
    setError('')
    setName(company.name ?? '')
    setEmail(company.email ?? '')
    setPhone(company.phone ?? '')
    setAddress(company.address ?? '')
    setLogoUrl(company.logoUrl ?? null)
    setLogoFiles([])
    // Clean up any existing preview URL
    if (logoPreviewUrlRef.current) {
      URL.revokeObjectURL(logoPreviewUrlRef.current)
      logoPreviewUrlRef.current = null
    }
    setLogoPreview(null)
  }, [open, company])

  const isValid = useMemo(() => {
    if (!company) return false
    const hasLogo = (!!logoUrl && logoUrl.trim().length > 0) || logoFiles.length > 0
    const hasRequiredStrings =
      name.trim().length > 0 &&
      (email?.trim().length ?? 0) > 0 &&
      (phone?.trim().length ?? 0) > 0 &&
      (address?.trim().length ?? 0) > 0
    return hasLogo && hasRequiredStrings
  }, [address, company, email, logoUrl, logoFiles, name, phone])

  const handleLogoChange = (files: File[]) => {
    const file = files[0] ?? null
    if (!file) return

    // Clean up previous preview URL
    if (logoPreviewUrlRef.current) {
      URL.revokeObjectURL(logoPreviewUrlRef.current)
    }

    // Create new preview URL
    const previewUrl = URL.createObjectURL(file)
    logoPreviewUrlRef.current = previewUrl
    setLogoPreview(previewUrl)
    setLogoFiles([file])
    setError('')
  }

  const handleSave = async () => {
    if (!company) return
    setError('')
    setSaving(true)
    try {
      let finalLogoUrl = logoUrl

      // Upload logo if a new file was selected
      if (logoFiles.length > 0) {
        setUploading(true)
        try {
          finalLogoUrl = await companyService.uploadLogo(company.id, logoFiles[0])
          setLogoUrl(finalLogoUrl)
          setLogoFiles([])
        } finally {
          setUploading(false)
        }
      }

      const updated = await companyService.update(company.id, {
        name: name.trim() || undefined,
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
        address: address.trim() || undefined,
        logoUrl: finalLogoUrl ?? undefined,
      })
      if (updated) {
        onUpdated(updated)
        notifySuccess('Company profile saved.')
        onClose()
        // Force page refresh to ensure all state is updated
        window.location.reload()
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Could not save company.'
      setError(msg)
      notifyError(msg)
    } finally {
      setSaving(false)
    }
  }

  const handleClose = () => {
    setError('')
    // Clean up preview URL
    if (logoPreviewUrlRef.current) {
      URL.revokeObjectURL(logoPreviewUrlRef.current)
      logoPreviewUrlRef.current = null
    }
    setLogoPreview(null)
    onClose()
  }

  return (
    <Modal open={open} onClose={handleClose} closeOnBackdrop={true} variant="wide">
      <View className="space-y-5 p-10">
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

        <View className="space-y-3">
          <Text variant="sm" className="opacity-90" style={{ color: current?.system?.dark }}>
            Company logo
          </Text>

          <div className="flex items-start gap-4">
            <div
              className="w-20 h-20 rounded-base overflow-hidden border border-gray-200 flex items-center justify-center shrink-0"
              style={{ borderColor: current?.system?.border ?? undefined }}
            >
              {logoPreview || logoUrl ? (
                <img
                  src={logoPreview || logoUrl || ''}
                  alt="Company logo"
                  className="w-full h-full object-cover"
                />
              ) : (
                <Text variant="sm" className="opacity-60">
                  No logo
                </Text>
              )}
            </div>

            <div className="flex-1">
              <FileAttachmentDropzone
                files={logoFiles}
                onFilesChange={handleLogoChange}
                disabled={uploading}
                accept="image/*"
                multiple={false}
                label=""
                hint="Drag logo here or browse — PNG, JPG, or SVG"
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
            variant="primary"
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
