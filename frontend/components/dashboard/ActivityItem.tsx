import { Badge } from "@/components/ui/badge";

interface ActivityItemProps {
    date: string;
    description: string;
    status?: "PENDING" | "APPROVED" | "REJECTED";
}

export function ActivityItem({ date, description, status }: ActivityItemProps) {
    return (
        <div className="flex items-center justify-between p-4 border rounded-lg bg-white dark:bg-zinc-950">
            <div className="flex flex-col gap-1">
                <span className="text-sm font-medium">{description}</span>
                <span className="text-xs text-zinc-500">{date}</span>
            </div>
            {status && (
                <Badge variant={
                    status === 'APPROVED' ? 'default' : // default usually black/primary, might need custom variant
                        status === 'REJECTED' ? 'destructive' :
                            'outline' // Pending
                } className={
                    status === 'APPROVED' ? 'bg-green-100 text-green-800 hover:bg-green-200 border-green-200 shadow-none' :
                        status === 'REJECTED' ? 'bg-red-100 text-red-800 hover:bg-red-200 border-red-200 shadow-none' :
                            'bg-yellow-100 text-yellow-800 hover:bg-yellow-200 border-yellow-200 shadow-none'
                }>
                    {status}
                </Badge>
            )}
        </div>
    );
}
