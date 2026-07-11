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

// Data + derived state for the onboarding card. Query keys intentionally match
// the app-wide keys (['whoAmI'], ['stats'], ['currentSubscription']) so this
// hook shares caches and invalidations with the other dashboard components.
export function useOnboarding() {
  const queryClient = useQueryClient()
  const autoCompletedRef = useRef(false)
  const legacyAutoCompletedRef = useRef(false)
  const [selectedStepId, setSelectedStepId] = useState<string | null>(null)

  const { data: userData, isLoading: userLoading } = useQuery({
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

  const { data: stats } = useQuery({
    queryKey: ['stats'],
    queryFn: () =>
      httpBrowserClient
        .get(ApiEndpoints.gateway.getStats())
        .then((res) => res.data?.data as StatsShape),
    refetchInterval: () => (userData?.onboarding?.completedAt ? false : 10_000),
  })

  const { data: currentSubscription, isLoading: subLoading } = useQuery({
    queryKey: ['currentSubscription'],
    queryFn: () =>
      httpBrowserClient
        .get(ApiEndpoints.billing.currentSubscription())
        .then((res) => res.data as SubShape),
    refetchInterval: () => (userData?.onboarding?.completedAt ? false : 10_000),
  })

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

  return {
    userData,
    userLoading,
    subLoading,
    stepStates,
    doneCount,
    activeStepId,
    canNavigateToStep,
    selectStep: setSelectedStepId,
    updateOnboarding,
    savingOnboarding,
  }
}
