'use client'

import React from 'react'
import { useQueryClient, useMutation, UseMutationOptions, DefaultError } from '@tanstack/react-query'

/**
 * A hook to automate optimistic updates.
 * 
 * @param mutationFn The mutation function
 * @param queryKey The query key to update
 * @param updater A function that takes the old data and the variables (mutation payload) and returns the new optimistic data.
 * @param options Additional mutation options
 */
export function useOptimisticMutation<TData = unknown, TError = DefaultError, TVariables = void, TContext = unknown>(
    mutationFn: (variables: TVariables) => Promise<TData>,
    queryKey: unknown[],
    updater: (oldData: any, variables: TVariables) => any,
    options?: Omit<UseMutationOptions<TData, TError, TVariables, TContext>, 'mutationFn' | 'onMutate' | 'onError' | 'onSettled'>
) {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn,
        ...options,
        onMutate: async (variables) => {
            // 1. Cancel any outgoing refetches (so they don't overwrite our optimistic update)
            await queryClient.cancelQueries({ queryKey })

            // 2. Snapshot the previous value
            const previousData = queryClient.getQueryData(queryKey)

            // 3. Optimistically update to the new value
            queryClient.setQueryData(queryKey, (old: any) => updater(old, variables))

            // 4. Return a context object with the snapshotted value
            return { previousData }
        },
        onError: (err, newTodo, context: any) => {
            // 5. Rollback on error
            if (context?.previousData) {
                queryClient.setQueryData(queryKey, context.previousData)
            }
            options?.onError?.(err, newTodo, context);
        },
        onSettled: (data, error, variables, context) => {
            // 6. Always refetch after error or success to ensure data sync
            queryClient.invalidateQueries({ queryKey })
            options?.onSettled?.(data, error, variables, context);
        },
    })
}
