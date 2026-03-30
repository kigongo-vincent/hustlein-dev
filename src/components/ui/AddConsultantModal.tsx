import { useState, useEffect } from 'react'
import Text from '../base/Text'
import Modal from './Modal'
import AlertModal from './AlertModal'
import Button from './Button'
import Input from './Input'
import CurrencyInput from './CurrencyInput'
import CustomSelect from './CustomSelect'
import DateSelectInput from './DateSelectInput'
import { Authstore } from '../../data/Authstore'
import { Themestore } from '../../data/Themestore'
import { departmentService, userService } from '../../services'
import { notifyError, notifySuccess } from '../../data/NotificationStore'
import type { User } from '../../types'
import type { CreateConsultantPayload, ConsultantAddress, ConsultantBankDetails, ConsultantNextOfKin } from '../../types'
import { User as UserIcon, Briefcase, DollarSign, MapPin, Users, Building2, FileCheck } from 'lucide-react'

const STEPS = [
  { id: 'personal', label: 'Personal', icon: UserIcon },
  { id: 'employment', label: 'Employment', icon: Briefcase },
  { id: 'compensation', label: 'Compensation', icon: DollarSign },
  { id: 'address', label: 'Address', icon: MapPin },
  { id: 'nextOfKin', label: 'Next of kin', icon: Users },
  { id: 'bank', label: 'Bank details', icon: Building2 },
  { id: 'review', label: 'Review', icon: FileCheck },
] as const

const OFFICE_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const
/** Currency list from browser Intl API (supportedValuesOf('currency')) when available; fallback UGX, USD */
function buildCurrencyOptions(): { value: string; label: string }[] {
  const fromIntl =
    typeof Intl !== 'undefined' && (Intl as any).supportedValuesOf
      ? ((Intl as any).supportedValuesOf('currency') as string[])
      : ['UGX', 'USD']
  const unique = Array.from(new Set(['UGX', 'USD', ...fromIntl]))
  return unique
    .map((c) => ({ value: c, label: c }))
    .sort((a, b) => a.label.localeCompare(b.label))
}

const defaultAddress: ConsultantAddress = {
  street: '',
  city: '',
  state: '',
  country: '',
  postalCode: '',
}
const defaultNextOfKin: ConsultantNextOfKin = {
  name: '',
  phoneNumber: '',
  relationship: '',
}
const defaultBank: ConsultantBankDetails = {
  bankName: '',
  branch: '',
  accountName: '',
  accountNumber: '',
}

const defaultFormState: CreateConsultantPayload = {
  firstName: '',
  lastName: '',
  email: '',
  phoneNumber: '',
  dateOfBirth: '',
  jobTitle: '',
  status: 'active',
  role: 'consultant',
  grossPay: '',
  hourlyRate: '',
  currency: 'UGX',
  totalHoursPerMonth: 160,
  officeDays: [],
  nextOfKin: defaultNextOfKin,
  address: defaultAddress,
  bankDetails: defaultBank,
}

export interface AddConsultantModalProps {
  open: boolean
  onClose: () => void
  onSuccess?: (user: User) => void
  /** When set, modal is in edit mode: form prefilled and submit updates this user */
  editUser?: User | null
}

const AddConsultantModal = ({ open, onClose, onSuccess, editUser }: AddConsultantModalProps) => {
  const { user } = Authstore()
  const { current } = Themestore()
  const [step, setStep] = useState(0)
  const [form, setForm] = useState<CreateConsultantPayload>(defaultFormState)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const isEdit = !!editUser
  const [currencyOptions] = useState(() => buildCurrencyOptions())
  const [departmentOptions, setDepartmentOptions] = useState<{ value: string; label: string }[]>([
    { value: '', label: 'No department' },
  ])

  useEffect(() => {
    if (!open) return
    if (user?.companyId) {
      departmentService.listByCompany(user.companyId).then((list) => {
        setDepartmentOptions([{ value: '', label: 'No department' }, ...list.map((d) => ({ value: d.id, label: d.name }))])
      })
    }
    if (editUser) {
      const parts = editUser.name.trim().split(/\s+/)
      const firstName = parts[0] ?? ''
      const lastName = parts.slice(1).join(' ') ?? ''
      setForm((prev) => ({
        ...prev,
        firstName,
        lastName,
        email: editUser.email,
        role: 'consultant',
        departmentId: editUser.departmentId,
      }))
    } else {
      setForm(defaultFormState)
    }
    setStep(0)
  }, [open, editUser, user?.companyId])

  const update = <K extends keyof CreateConsultantPayload>(key: K, value: CreateConsultantPayload[K]) => {
    setForm((prev) => {
      const next: CreateConsultantPayload = { ...prev, [key]: value }
      if (key === 'grossPay' || key === 'totalHoursPerMonth') {
        const gross = Number(next.grossPay.toString().replace(/[^0-9.]/g, ''))
        const hours = Number(next.totalHoursPerMonth)
        if (!Number.isNaN(gross) && gross > 0 && !Number.isNaN(hours) && hours > 0) {
          const rate = gross / hours
          next.hourlyRate = Math.round(rate).toString()
        }
      }
      return next
    })
    setError(null)
  }

  const updateNested = (
    key: 'address' | 'nextOfKin' | 'bankDetails',
    field: string,
    value: string
  ) => {
    setForm((prev) => ({
      ...prev,
      [key]: { ...prev[key], [field]: value },
    }))
    setError(null)
  }

  const toggleOfficeDay = (day: string) => {
    setForm((prev) => {
      const next = prev.officeDays.includes(day)
        ? prev.officeDays.filter((d) => d !== day)
        : [...prev.officeDays, day]
      return { ...prev, officeDays: next }
    })
  }

  const reset = () => {
    setStep(0)
    setForm(defaultFormState)
    setError(null)
    setSubmitting(false)
  }

  const handleClose = () => {
    reset()
    onClose()
  }

  const validateStep = (index: number): string | null => {
    switch (index) {
      case 0: {
        if (!form.firstName.trim()) return 'First name is required.'
        if (!form.lastName.trim()) return 'Last name is required.'
        if (!form.email.trim()) return 'Email is required.'
        return null
      }
      case 1: {
        if (!form.jobTitle.trim()) return 'Job title is required.'
        return null
      }
      case 2: {
        if (!form.grossPay.trim()) return 'Gross pay is required.'
        if (!form.hourlyRate.trim()) return 'Hourly rate is required.'
        const total = Number(form.totalHoursPerMonth)
        if (Number.isNaN(total) || total < 1) return 'Total hours per month must be a positive number.'
        return null
      }
      case 3: {
        const a = form.address
        if (!a.street.trim()) return 'Street is required.'
        if (!a.city.trim()) return 'City is required.'
        if (!a.country.trim()) return 'Country is required.'
        return null
      }
      case 4: {
        const n = form.nextOfKin
        if (!n.name.trim()) return 'Next of kin name is required.'
        if (!n.phoneNumber.trim()) return 'Next of kin phone is required.'
        if (!n.relationship.trim()) return 'Relationship is required.'
        return null
      }
      case 5: {
        const b = form.bankDetails
        if (!b.bankName.trim()) return 'Bank name is required.'
        if (!b.accountName.trim()) return 'Account name is required.'
        if (!b.accountNumber.trim()) return 'Account number is required.'
        return null
      }
      default:
        return null
    }
  }

  const goNext = (e: any) => {
    (e as { preventDefault: () => void })?.preventDefault()
    const err = validateStep(step)
    if (err) {
      setError(err)
      return
    }
    setError(null)
    if (step < STEPS.length - 1) setStep((s) => s + 1)
  }

  const goBack = () => {
    setError(null)
    if (step > 0) setStep((s) => s - 1)
  }

  const handleSubmit = async () => {
    const err = validateStep(step)
    if (err) {
      setError(err)
      return
    }
    if (!user?.companyId && !editUser) {
      setError('You must belong to a company to add consultants.')
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      const fullName = `${form.firstName.trim()} ${form.lastName.trim()}`.trim()
      if (editUser) {
        const updated = await userService.update(editUser.id, {
          name: fullName,
          email: form.email.trim(),
          role: 'consultant',
          departmentId: form.departmentId,
        })
        if (updated) {
          onSuccess?.(updated)
          notifySuccess('Consultant updated.')
          handleClose()
        } else {
          setError('Failed to update consultant.')
          notifyError('Failed to update consultant.')
        }
      } else {
        const created = await userService.create({
          name: fullName,
          email: form.email.trim(),
          role: 'consultant',
          companyId: user!.companyId,
          departmentId: form.departmentId,
        })
        onSuccess?.(created)
        notifySuccess('Consultant created.')
        handleClose()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : isEdit ? 'Failed to update consultant.' : 'Failed to add consultant.')
      notifyError(err instanceof Error ? err.message : isEdit ? 'Failed to update consultant.' : 'Failed to add consultant.')
    } finally {
      setSubmitting(false)
    }
  }

  const isLastStep = step === STEPS.length - 1
  const canGoNext = !isLastStep
  const currentIcon = STEPS[step].icon
  const Icon = currentIcon

  return (
    <Modal open={open} onClose={handleClose}>
      <div className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <span className="flex items-center justify-center w-8 h-8 rounded-base shrink-0" style={{ backgroundColor: current?.brand?.primary ? `${current?.system?.background}` : 'rgba(0,0,0,0.06)' }}>
            <Icon className="w-4 h-4" style={{ color: current?.brand?.primary ?? undefined }} />
          </span>
          <div>
            <Text className="font-semibold">{isEdit ? 'Edit consultant' : 'Add consultant'}</Text>
            <Text variant="sm" className="opacity-80">
              Step {step + 1} of {STEPS.length} · {STEPS[step].label}
            </Text>
          </div>
        </div>

        {/* Step indicator */}
        <div className="flex gap-1 mb-8 w-full">
          {STEPS.map((s, i) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setStep(i)}
              className="flex-1 h-1.5 rounded-full min-w-0 transition-colors"
              style={{
                backgroundColor: i <= step ? (current?.brand?.primary ?? 'rgba(0,0,0,0.1)') : 'rgba(0,0,0,0.12)',
              }}
              aria-label={`Go to step ${i + 1}: ${s.label}`}
            />
          ))}
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault()
            if (isLastStep) handleSubmit()
            else goNext(e)
          }}
          className="space-y-4 pt-1"
        >
          {/* Step 0: Personal */}
          {step === 0 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="First name"
                  placeholder="e.g. Vincent"
                  value={form.firstName}
                  onChange={(e) => update('firstName', e.target.value)}
                  autoComplete="given-name"
                  disabled={submitting}
                />
                <Input
                  label="Last name"
                  placeholder="e.g. Kigongo"
                  value={form.lastName}
                  onChange={(e) => update('lastName', e.target.value)}
                  autoComplete="family-name"
                  disabled={submitting}
                />
              </div>
              <Input
                label="Email"
                type="email"
                placeholder="email@company.com"
                value={form.email}
                onChange={(e) => update('email', e.target.value)}
                autoComplete="email"
                disabled={submitting}
              />
              <Input
                label="Phone number"
                placeholder="+256782147143"
                value={form.phoneNumber}
                onChange={(e) => update('phoneNumber', e.target.value)}
                autoComplete="tel"
                disabled={submitting}
              />
              <DateSelectInput
                label="Date of birth"
                value={form.dateOfBirth}
                onChange={(v) => update('dateOfBirth', v)}
                disabled={submitting}
                order="dmy"
                yearMin={new Date().getFullYear() - 100}
                yearMax={new Date().getFullYear()}
              />
            </div>
          )}

          {/* Step 1: Employment */}
          {step === 1 && (
            <div className="space-y-4">
              <Input
                label="Job title"
                placeholder="e.g. Full Stack Developer"
                value={form.jobTitle}
                onChange={(e) => update('jobTitle', e.target.value)}
                disabled={submitting}
              />
              <CustomSelect
                label="Department"
                options={departmentOptions}
                value={form.departmentId ?? ''}
                onChange={(v) => update('departmentId', v || undefined)}
                disabled={submitting}
                placeholder="Select department"
                placement="below"
              />
              <div>
                <Text variant="sm" className="mb-2 block opacity-80">Office days</Text>
                <div className="flex flex-wrap gap-2">
                  {OFFICE_DAYS.map((day) => (
                    <button
                      key={day}
                      type="button"
                      onClick={() => toggleOfficeDay(day)}
                      className="rounded-base px-3 py-2 text-sm border transition-colors"
                      style={{
                        borderColor: form.officeDays.includes(day) ? current?.brand?.primary : undefined,
                        backgroundColor: form.officeDays.includes(day) && current?.brand?.primary ? `${current.brand.primary}15` : undefined,
                      }}
                    >
                      {day}
                    </button>
                  ))}
                </div>
              </div>
              <Input
                label="Employee ID (optional)"
                placeholder="Optional"
                value={form.employeeId ?? ''}
                onChange={(e) => update('employeeId', e.target.value || undefined)}
                disabled={submitting}
              />
            </div>
          )}

          {/* Step 2: Compensation */}
          {step === 2 && (
            <div className="space-y-4">
              <CustomSelect
                label="Currency"
                options={currencyOptions}
                value={form.currency}
                onChange={(v) => update('currency', v)}
                disabled={submitting}
              />
              <CurrencyInput
                label="Gross pay"
                placeholder="e.g. 2,200,000"
                value={form.grossPay}
                currency={form.currency}
                onChange={(raw) => update('grossPay', raw)}
                disabled={submitting}
                ariaLabel="Gross pay"
              />
              <CurrencyInput
                label="Hourly rate"
                placeholder="Auto-computed from gross pay and hours"
                value={form.hourlyRate}
                currency={form.currency}
                onChange={() => {}}
                disabled
                ariaLabel="Hourly rate"
              />
              <Input
                label="Total hours per month"
                type="number"
                min={1}
                placeholder="160"
                value={form.totalHoursPerMonth === 0 ? '' : form.totalHoursPerMonth}
                onChange={(e) => update('totalHoursPerMonth', parseInt(e.target.value, 10) || 0)}
                disabled={submitting}
              />
            </div>
          )}

          {/* Step 3: Address */}
          {step === 3 && (
            <div className="space-y-4">
              <Input
                label="Street"
                placeholder="e.g. Kampala"
                value={form.address.street}
                onChange={(e) => updateNested('address', 'street', e.target.value)}
                disabled={submitting}
              />
              <Input
                label="City"
                placeholder="e.g. Kampala"
                value={form.address.city}
                onChange={(e) => updateNested('address', 'city', e.target.value)}
                disabled={submitting}
              />
              <Input
                label="State / Region"
                placeholder="e.g. Uganda"
                value={form.address.state}
                onChange={(e) => updateNested('address', 'state', e.target.value)}
                disabled={submitting}
              />
              <Input
                label="Country"
                placeholder="e.g. Uganda"
                value={form.address.country}
                onChange={(e) => updateNested('address', 'country', e.target.value)}
                disabled={submitting}
              />
              <Input
                label="Postal code"
                placeholder="e.g. 256"
                value={form.address.postalCode}
                onChange={(e) => updateNested('address', 'postalCode', e.target.value)}
                disabled={submitting}
              />
            </div>
          )}

          {/* Step 4: Next of kin */}
          {step === 4 && (
            <div className="space-y-4">
              <Input
                label="Full name"
                placeholder="e.g. Ongone Joshua"
                value={form.nextOfKin.name}
                onChange={(e) => updateNested('nextOfKin', 'name', e.target.value)}
                disabled={submitting}
              />
              <Input
                label="Phone number"
                placeholder="e.g. 256774079883"
                value={form.nextOfKin.phoneNumber}
                onChange={(e) => updateNested('nextOfKin', 'phoneNumber', e.target.value)}
                disabled={submitting}
              />
              <Input
                label="Relationship"
                placeholder="e.g. Friend, Spouse"
                value={form.nextOfKin.relationship}
                onChange={(e) => updateNested('nextOfKin', 'relationship', e.target.value)}
                disabled={submitting}
              />
            </div>
          )}

          {/* Step 5: Bank */}
          {step === 5 && (
            <div className="space-y-4">
              <Input
                label="Bank name"
                placeholder="e.g. Centenary Bank"
                value={form.bankDetails.bankName}
                onChange={(e) => updateNested('bankDetails', 'bankName', e.target.value)}
                disabled={submitting}
              />
              <Input
                label="Branch"
                placeholder="e.g. Kampala"
                value={form.bankDetails.branch}
                onChange={(e) => updateNested('bankDetails', 'branch', e.target.value)}
                disabled={submitting}
              />
              <Input
                label="Account name"
                placeholder="e.g. Vincent Kigongo"
                value={form.bankDetails.accountName}
                onChange={(e) => updateNested('bankDetails', 'accountName', e.target.value)}
                disabled={submitting}
              />
              <Input
                label="Account number"
                placeholder="e.g. 3204885561"
                value={form.bankDetails.accountNumber}
                onChange={(e) => updateNested('bankDetails', 'accountNumber', e.target.value)}
                disabled={submitting}
              />
            </div>
          )}

          {/* Step 6: Review */}
          {step === 6 && (
            <div className="space-y-3 text-sm">
              <ReviewRow label="Name" value={`${form.firstName} ${form.lastName}`.trim() || '—'} />
              <ReviewRow label="Email" value={form.email || '—'} />
              <ReviewRow label="Phone" value={form.phoneNumber || '—'} />
              <ReviewRow label="DOB" value={form.dateOfBirth || '—'} />
              <ReviewRow label="Job title" value={form.jobTitle || '—'} />
              {/* <ReviewRow label="Role" value={form.role ? ROLE_OPTIONS.find((o) => o.value === form.role)?.label ?? form.role : '—'} /> */}
              {/* <ReviewRow label="Status" value={form.status} /> */}
              <ReviewRow label="Office days" value={form.officeDays.length ? form.officeDays.join(', ') : '—'} />
              <ReviewRow label="Gross pay" value={form.currency && form.grossPay ? `${form.currency} ${form.grossPay}` : form.grossPay || '—'} />
              <ReviewRow label="Hourly rate" value={form.hourlyRate ? `${form.currency} ${form.hourlyRate}` : '—'} />
              <ReviewRow label="Hours/month" value={String(form.totalHoursPerMonth || '—')} />
              <ReviewRow label="Address" value={[form.address.street, form.address.city, form.address.country].filter(Boolean).join(', ') || '—'} />
              <ReviewRow label="Next of kin" value={form.nextOfKin.name ? `${form.nextOfKin.name} (${form.nextOfKin.relationship})` : '—'} />
              <ReviewRow label="Bank" value={form.bankDetails.bankName ? `${form.bankDetails.bankName} · ${form.bankDetails.accountNumber}` : '—'} />
            </div>
          )}

          <div className="flex justify-between gap-2 pt-8 mt-12 border-t" style={{ borderColor: current?.system?.border }}>
            <Button
              type="button"
              variant="ghost"
              label="Back"
              onClick={goBack}
              disabled={step === 0 || submitting}
              className={step === 0 ? 'invisible' : ''}
            />
            <div className="flex gap-2 ml-auto">
              <Button type="button" variant="background" label="Cancel" onClick={handleClose} disabled={submitting} />
              {canGoNext ? (
                <Button type="button" label="Next" onClick={(e) => { e.preventDefault(); goNext(e) }} disabled={submitting} loading={submitting} />
              ) : (
                <Button type="submit" label={isEdit ? 'Save changes' : 'Add consultant'} disabled={submitting} loading={submitting} />
              )}
            </div>
          </div>
        </form>
      </div>
      <AlertModal
        open={!!error}
        title="Form error"
        message={error ?? ''}
        onClose={() => setError(null)}
        variant="error"
        confirmLabel="OK"
      />
    </Modal>
  )
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 py-1.5 border-b border-neutral-200/50 dark:border-neutral-700/50">
      <span className="opacity-70">{label}</span>
      <span className="text-right truncate max-w-[60%]">{value}</span>
    </div>
  )
}

export default AddConsultantModal
