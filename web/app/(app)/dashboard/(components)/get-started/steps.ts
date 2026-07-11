// Pure onboarding step definitions and completion logic for the Get Started
// card. Kept free of React so the checkDone rules are unit-testable.

export type StatsShape = {
  totalApiKeyCount?: number
  totalDeviceCount?: number
  totalSentSMSCount?: number
}

export type UserShape = {
  emailVerifiedAt?: string | Date | null
  createdAt?: string | Date
  onboarding?: {
    completedAt?: string | Date | null
    currentStepId?: string
    skippedStepIds?: string[]
  }
}

export type SubShape = { plan?: { name?: string } } | null

export type StepDef = {
  id: string
  label: string
  description: string
  optional: boolean
  checkDone: (
    user: UserShape | undefined,
    stats: StatsShape | undefined,
    sub: SubShape,
    skipped: string[]
  ) => boolean
}

export const STEPS: StepDef[] = [
  {
    id: 'verify_email',
    label: 'Verify your email',
    description: 'Required before you can send SMS.',
    optional: false,
    checkDone: (user) => !!user?.emailVerifiedAt,
  },
  {
    id: 'download_app',
    label: 'Download the Android app',
    description: 'Install TextBee on your Android device.',
    optional: true,
    checkDone: (_u, stats, _s, skipped) =>
      (stats?.totalDeviceCount ?? 0) > 0 || skipped.includes('download_app'),
  },
  {
    id: 'api_key',
    label: 'Generate an API key',
    description: 'Used to connect your device or authenticate API calls.',
    optional: false,
    checkDone: (_u, stats) => (stats?.totalApiKeyCount ?? 0) > 0,
  },
  {
    id: 'register_device',
    label: 'Register your device',
    description: 'Link your phone to your account by scanning a QR code.',
    optional: false,
    checkDone: (_u, stats) => (stats?.totalDeviceCount ?? 0) > 0,
  },
  {
    id: 'choose_plan',
    label: 'Choose your plan',
    description: 'Pick the plan that fits your usage.',
    optional: true,
    checkDone: (_u, _stats, sub, skipped) =>
      (sub?.plan?.name && sub.plan.name.toLowerCase() !== 'free') ||
      skipped.includes('choose_plan'),
  },
  {
    id: 'first_message',
    label: 'Send your first message',
    description: 'Send your first message from the dashboard.',
    optional: false,
    checkDone: (_u, stats) => (stats?.totalSentSMSCount ?? 0) > 0,
  },
]

export type StepState = StepDef & { isDone: boolean }

export function computeStepStates(
  user: UserShape | undefined,
  stats: StatsShape | undefined,
  sub: SubShape,
  skipped: string[]
): StepState[] {
  return STEPS.map((s) => ({
    ...s,
    isDone: s.checkDone(user, stats, sub, skipped),
  }))
}
