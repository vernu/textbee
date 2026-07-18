'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import httpBrowserClient from '@/lib/httpBrowserClient'
import { ApiEndpoints } from '@/config/api'
import {
  STEPS,
  computeStepStates,
  type StatsShape,
  type SubShape,
  type UserShape,
} from './steps'

// The card must never mislead: it renders the checklist only when all three
// queries have succeeded ('ready'). Backend down -> 'error' (quiet retry row),
// never a checklist computed from missing data that would show a verified
// user stuck on "Verify your email".
export type OnboardingStatus =
  | 'loading'
  | 'error'
  | 'ready'
  | 'hidden'
  | 'celebrate'

// Data + derived state for the onboarding card. Query keys intentionally match
// the app-wide keys (['whoAmI'], ['stats'], ['currentSubscription']) so this
// hook shares caches and invalidations with the other dashboard components.
export function useOnboarding() {
  const queryClient = useQueryClient()
  const autoCompletedRef = useRef(false)
  const legacyAutoCompletedRef = useRef(false)
  const [selectedStepId, setSelectedStepId] = useState<string | null>(null)
  // Set when completedAt flips during this session: show the success state
  // once instead of unmounting the card mid-glance.
  const [justCompleted, setJustCompleted] = useState(false)
  const [celebrationDismissed, setCelebrationDismissed] = useState(false)
  const prevCompletedAtRef = useRef<string | Date | null | undefined>(undefined)

  const userQuery = useQuery({
    queryKey: ['whoAmI'],
    queryFn: () =>
      httpBrowserClient
        .get(ApiEndpoints.auth.whoAmI())
        .then((res) => res.data?.data as UserShape),
    refetchInterval: (query) => {
      const u = query.state.data as UserShape | undefined
      return u?.onboarding?.completedAt ? false : 10_000
    },
  })
  const userData = userQuery.data

  const statsQuery = useQuery({
    queryKey: ['stats'],
    queryFn: () =>
      httpBrowserClient
        .get(ApiEndpoints.gateway.getStats())
        .then((res) => res.data?.data as StatsShape),
    refetchInterval: () => (userData?.onboarding?.completedAt ? false : 10_000),
  })
  const stats = statsQuery.data

  const subQuery = useQuery({
    queryKey: ['currentSubscription'],
    queryFn: () =>
      httpBrowserClient
        .get(ApiEndpoints.billing.currentSubscription())
        .then((res) => res.data as SubShape),
    refetchInterval: () => (userData?.onboarding?.completedAt ? false : 10_000),
  })
  const currentSubscription = subQuery.data
  const subLoading = subQuery.isLoading

  const { mutate: updateOnboarding, isPending: savingOnboarding } = useMutation({
    mutationFn: (body: {
      skipStepId?: string
      complete?: boolean
      currentStepId?: string
    }) =>
      httpBrowserClient
        .patch(ApiEndpoints.auth.updateOnboarding(), body)
        .then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whoAmI'] })
      queryClient.invalidateQueries({ queryKey: ['stats'] })
      queryClient.invalidateQueries({ queryKey: ['currentSubscription'] })
    },
  })

  // Detect the incomplete -> complete transition for the celebration state.
  useEffect(() => {
    const completedAt = userData?.onboarding?.completedAt ?? null
    const prev = prevCompletedAtRef.current
    if (prev !== undefined && !prev && completedAt) {
      setJustCompleted(true)
    }
    if (userData !== undefined) {
      prevCompletedAtRef.current = completedAt
    }
  }, [userData])

  const skippedIds = useMemo(
    () => userData?.onboarding?.skippedStepIds ?? [],
    [userData?.onboarding?.skippedStepIds]
  )

  const stepStates = useMemo(
    () =>
      computeStepStates(userData, stats, currentSubscription ?? null, skippedIds),
    [userData, stats, currentSubscription, skippedIds]
  )

  const doneCount = stepStates.filter((s) => s.isDone).length
  const progressPercent = Math.round((doneCount / STEPS.length) * 100)

  const isFreePlan =
    !currentSubscription?.plan?.name ||
    currentSubscription.plan.name.toLowerCase() === 'free'

  const canNavigateToStep = useCallback(
    (stepId: string) => {
      if (stepId === 'verify_email') return false
      if (stepId === 'choose_plan') return isFreePlan
      return true
    },
    [isFreePlan]
  )

  // Restore the persisted current step once, when navigable.
  useEffect(() => {
    if (selectedStepId) return
    const persisted = userData?.onboarding?.currentStepId
    if (persisted && stepStates.some((s) => s.id === persisted)) {
      if (!canNavigateToStep(persisted)) return
      setSelectedStepId(persisted)
    }
  }, [selectedStepId, userData?.onboarding?.currentStepId, stepStates, canNavigateToStep])

  const activeStepId = useMemo(() => {
    const firstIncomplete = stepStates.find((s) => !s.isDone)?.id
    const candidate =
      selectedStepId && stepStates.some((s) => s.id === selectedStepId)
        ? selectedStepId
        : userData?.onboarding?.currentStepId

    if (candidate && stepStates.some((s) => s.id === candidate)) {
      if (!canNavigateToStep(candidate)) {
        return firstIncomplete ?? STEPS[STEPS.length - 1].id
      }
      return candidate
    }

    return firstIncomplete ?? STEPS[STEPS.length - 1].id
  }, [stepStates, userData?.onboarding?.currentStepId, selectedStepId, canNavigateToStep])

  // When the step you are sitting on gets completed (e.g. the poll detected a
  // registered device), advance the selection to the next incomplete one.
  //
  // Only on that transition, though. This used to clear the selection whenever
  // the selected step was done, which also meant deliberately opening an
  // already-completed step deselected it on the very next render, so it looked
  // like clicking it did nothing at all.
  const selectionRef = useRef<{ id: string; isDone: boolean } | null>(null)
  useEffect(() => {
    if (!selectedStepId) {
      selectionRef.current = null
      return
    }
    const selected = stepStates.find((s) => s.id === selectedStepId)
    if (!selected) return

    const previous = selectionRef.current
    selectionRef.current = { id: selectedStepId, isDone: selected.isDone }

    const completedWhileSelected =
      previous?.id === selectedStepId && !previous.isDone && selected.isDone
    if (completedWhileSelected) {
      setSelectedStepId(null)
    }
  }, [selectedStepId, stepStates])

  // Auto-complete once every step reports done.
  useEffect(() => {
    if (!userData || stats === undefined || subLoading || autoCompletedRef.current) {
      return
    }
    if (userData.onboarding?.completedAt) return

    const allStepsDone = STEPS.every((step) =>
      step.checkDone(userData, stats, currentSubscription ?? null, skippedIds)
    )

    if (allStepsDone) {
      autoCompletedRef.current = true
      updateOnboarding({ complete: true })
    }
  }, [userData, stats, currentSubscription, skippedIds, subLoading, updateOnboarding])

  // Legacy accounts (created before 2026) that clearly already use the product
  // get auto-completed without walking the checklist.
  useEffect(() => {
    if (!userData || stats === undefined || subLoading) return
    if (legacyAutoCompletedRef.current) return
    if (userData.onboarding?.completedAt) return

    const createdAt = userData.createdAt ? new Date(userData.createdAt) : null
    if (!createdAt || Number.isNaN(createdAt.getTime())) return

    const cutoff = new Date('2026-01-01T00:00:00.000Z')
    if (createdAt >= cutoff) return

    const hasDevice = (stats.totalDeviceCount ?? 0) >= 1
    const hasApiKey = (stats.totalApiKeyCount ?? 0) >= 1
    const hasSent = (stats.totalSentSMSCount ?? 0) >= 1
    if (!hasDevice || !hasApiKey || !hasSent) return

    legacyAutoCompletedRef.current = true
    updateOnboarding({ complete: true })
  }, [userData, stats, subLoading, updateOnboarding])

  const retry = useCallback(() => {
    void userQuery.refetch()
    void statsQuery.refetch()
    void subQuery.refetch()
  }, [userQuery, statsQuery, subQuery])

  // Fail-closed status machine. Note: react-query keeps last-good data on
  // background refetch failures, so an established card never flips to the
  // error state from a flaky poll (data stays defined).
  const status: OnboardingStatus = useMemo(() => {
    const completedAt = userData?.onboarding?.completedAt
    if (justCompleted && !celebrationDismissed) return 'celebrate'
    if (completedAt) return 'hidden'
    if (
      (userQuery.isError && userData === undefined) ||
      (statsQuery.isError && stats === undefined) ||
      (subQuery.isError && currentSubscription === undefined)
    ) {
      return 'error'
    }
    if (
      userData === undefined ||
      stats === undefined ||
      currentSubscription === undefined
    ) {
      return 'loading'
    }
    return 'ready'
  }, [
    justCompleted,
    celebrationDismissed,
    userData,
    stats,
    currentSubscription,
    userQuery.isError,
    statsQuery.isError,
    subQuery.isError,
  ])

  return {
    status,
    userData,
    subLoading,
    stepStates,
    doneCount,
    totalSteps: STEPS.length,
    progressPercent,
    activeStepId,
    canNavigateToStep,
    selectStep: setSelectedStepId,
    updateOnboarding,
    savingOnboarding,
    retry,
    dismissCelebration: () => setCelebrationDismissed(true),
  }
}
