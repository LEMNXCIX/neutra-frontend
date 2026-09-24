"use client";

import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

export function PrintReceiptButton() {
    return (
        <Button
            className="h-14 px-10 rounded-xl font-bold bg-foreground text-background hover:bg-foreground/90 shadow-xl shadow-foreground/10 transition-all hover:-translate-y-1 print:hidden"
            onClick={() => window.print()}
        >
            <Download className="size-5 mr-3" strokeWidth={2} />
            Descargar recibo
        </Button>
    );
}
