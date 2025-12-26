import { Skeleton } from "@/components/ui/skeleton"

export function DashboardSkeleton() {
    return (
        <div className="flex flex-col space-y-4 p-4 w-full h-full">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="space-y-2">
                    <Skeleton className="h-8 w-[200px]" />
                    <Skeleton className="h-4 w-[150px]" />
                </div>
                <Skeleton className="h-10 w-10 rounded-full" />
            </div>

            {/* Grid of Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
                <SkeletonCard />
                <SkeletonCard />
                <SkeletonCard />
            </div>

            {/* Table Area */}
            <div className="pt-8 space-y-4">
                <Skeleton className="h-8 w-[100px]" />
                <div className="space-y-2">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                </div>
            </div>
        </div>
    )
}

function SkeletonCard() {
    return (
        <div className="flex flex-col space-y-3">
            <Skeleton className="h-[125px] w-full rounded-xl" />
            <div className="space-y-2">
                <Skeleton className="h-4 w-[250px]" />
                <Skeleton className="h-4 w-[200px]" />
            </div>
        </div>
    )
}
