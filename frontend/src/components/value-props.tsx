import { Card } from "@/components/ui/card"
import { Lock, FileText, Scale } from "lucide-react"

export default function ValueProps() {
    return (
        <div className="w-full max-w-5xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                <Card className="group overflow-hidden shadow-zinc-950/5 sm:rounded-none sm:rounded-bl-xl border border-border rounded-2xl bg-background/80">
                    <div className="p-8">
                        <h3 className="text-xl font-medium">SOC2 Security</h3>
                        <p className="text-muted-foreground mt-2 text-sm">Industry-leading encryption ensures your data is secure.</p>
                    </div>
                    <div className="px-6 pb-12">
                        <div className="flex items-center justify-center">
                            <div className="rounded-lg bg-muted/50 flex aspect-square size-16 items-center justify-center border p-4">
                                <Lock className="size-8 text-foreground" />
                            </div>
                        </div>
                    </div>
                </Card>

                <Card className="group overflow-hidden shadow-zinc-950/5 sm:rounded-none border border-border rounded-2xl bg-background/80">
                    <div className="p-8">
                        <h3 className="text-xl font-medium">Run Thousands of Tasks</h3>
                        <p className="text-muted-foreground mt-2 text-sm">Boost efficiency and operations by 20x in hours.</p>
                    </div>
                    <div className="px-6 pb-12">
                        <div className="flex items-center justify-center">
                            <div className="rounded-lg bg-muted/50 flex aspect-square size-16 items-center justify-center border p-4">
                                <FileText className="size-8 text-foreground" />
                            </div>
                        </div>
                    </div>
                </Card>

                <Card className="group overflow-hidden shadow-zinc-950/5 sm:rounded-none sm:rounded-br-xl border border-border rounded-2xl bg-background/80">
                    <div className="p-8">
                        <h3 className="text-xl font-medium">Scale Without Headcount</h3>
                        <p className="text-muted-foreground mt-2 text-sm">Just build more agents as your needs grow.</p>
                    </div>
                    <div className="px-6 pb-12">
                        <div className="flex items-center justify-center">
                            <div className="rounded-lg bg-muted/50 flex aspect-square size-16 items-center justify-center border p-4">
                                <Scale className="size-8 text-foreground" />
                            </div>
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    )
}
