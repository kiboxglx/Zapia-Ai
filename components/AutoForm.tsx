'use client'

import React from 'react'
import { z } from 'zod'
import { useForm, FormProvider, useFormContext } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMediaQuery } from '@/hooks/use-media-query'
import { cn } from '@/lib/utils'
import { Drawer } from 'vaul'

// UI Primitives Mocks (normally these would be imported from @/components/ui/...)
function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
    return <input {...props} className={cn("w-full border border-input bg-transparent px-3 py-2 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 rounded-md", props.className)} />
}

function Label({ children }: { children: React.ReactNode }) {
    return <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">{children}</label>
}

export function AutoForm<T extends z.ZodObject<any>>({
    schema,
    onSubmit,
    defaultValues
}: {
    schema: T
    onSubmit: (data: z.infer<T>) => void
    defaultValues?: Partial<z.infer<T>>
}) {
    const form = useForm({
        resolver: zodResolver(schema),
        defaultValues: defaultValues as any
    })

    return (
        <FormProvider {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {Object.keys(schema.shape).map((key) => (
                    <AutoField key={key} name={key} schema={schema.shape[key]} />
                ))}
                <button type="submit" className="w-full bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 rounded-md font-medium transition-colors">
                    Save Changes
                </button>
            </form>
        </FormProvider>
    )
}

function AutoField({ name, schema }: { name: string, schema: z.ZodTypeAny }) {
    const { register, setValue, watch, formState: { errors } } = useFormContext()
    const value = watch(name)
    const error = errors[name]
    const isDesktop = useMediaQuery("(min-width: 768px)")
    const label = name.replace(/([A-Z])/g, " $1").replace(/^./, str => str.toUpperCase()); // naive label gen

    // Safe type checking
    const typeName = (schema._def as any).typeName;

    // String Input
    if (typeName === 'ZodString') {
        return (
            <div className="space-y-2">
                <Label>{label}</Label>
                <Input {...register(name)} placeholder={`Enter ${label.toLowerCase()}...`} />
                {error && <span className="text-xs text-destructive">{String(error.message)}</span>}
            </div>
        )
    }

    // Boolean Switch
    if (typeName === 'ZodBoolean') {
        return (
            <div className="flex items-center justify-between rounded-lg border p-4 shadow-sm">
                <div className="space-y-0.5">
                    <Label>{label}</Label>
                </div>
                <button
                    type="button"
                    onClick={() => setValue(name, !value)}
                    className={cn(
                        "peer inline-flex h-[24px] w-[44px] shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50",
                        value ? "bg-primary" : "bg-input"
                    )}
                >
                    <span className={cn(
                        "pointer-events-none block h-5 w-5 rounded-full bg-background shadow-lg ring-0 transition-transform",
                        value ? "translate-x-5" : "translate-x-0"
                    )} />
                </button>
            </div>
        )
    }

    // Enum Selection (The Requirement: Select vs Drawer)
    if (typeName === 'ZodEnum') {
        const options: string[] = (schema._def as any).values;

        if (isDesktop) {
            // Desktop: Native Select or Radix Select (using native for scaffolding simplicity)
            return (
                <div className="space-y-2">
                    <Label>{label}</Label>
                    <div className="relative">
                        <select
                            {...register(name)}
                            className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 appearance-none"
                        >
                            {options.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
                        </select>
                    </div>
                </div>
            )
        }

        // Mobile: Vaul Drawer
        return (
            <div className="space-y-2">
                <Label>{label}</Label>
                <Drawer.Root>
                    <Drawer.Trigger asChild>
                        <button type="button" className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
                            {value || "Select option..."}
                        </button>
                    </Drawer.Trigger>
                    <Drawer.Portal>
                        <Drawer.Overlay className="fixed inset-0 z-50 bg-black/80" />
                        <Drawer.Content className="fixed inset-x-0 bottom-0 z-50 mt-24 flex h-auto flex-col rounded-t-[10px] border bg-background outline-none">
                            <div className="p-4 bg-muted/10 rounded-t-[10px] flex items-center justify-center">
                                <div className="h-1.5 w-12 rounded-full bg-muted" />
                            </div>
                            <div className="p-4 grid gap-2 pb-8">
                                <Label>Select {label}</Label>
                                {options.map((opt) => (
                                    <button
                                        key={opt}
                                        type="button"
                                        onClick={() => { setValue(name, opt); document.dispatchEvent(new KeyboardEvent('keydown', { 'key': 'Escape' })); /* trigger close attempt */ }}
                                        className={cn(
                                            "flex w-full items-center p-3 rounded-md transition-colors hover:bg-muted text-sm font-medium",
                                            value === opt && "bg-muted"
                                        )}
                                    >
                                        {opt}
                                    </button>
                                ))}
                            </div>
                        </Drawer.Content>
                    </Drawer.Portal>
                </Drawer.Root>
            </div>
        )
    }

    return <div className="text-red-500 text-xs">Unsupported Type: {typeName}</div>
}
