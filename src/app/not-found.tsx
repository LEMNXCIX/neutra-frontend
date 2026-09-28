import { Home, PackageX, Search } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function NotFound() {
    return (
        <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 flex items-center justify-center p-4">
            <Card className="max-w-2xl w-full border-none shadow-2xl overflow-hidden">
                <div className="p-8 sm:p-12 text-center">
                    {/* Icon */}
                    <div className="mb-8">
                        <div className="inline-flex items-center justify-center size-24 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 mb-4">
                            <PackageX className="size-12 text-primary" />
                        </div>
                    </div>

                    {/* 404 Number */}
                    <div className="mb-6">
                        <h1 className="text-9xl font-extrabold text-primary">
                            404
                        </h1>
                    </div>

                    {/* Title & Description */}
                    <div className="mb-8 space-y-3">
                        <h2 className="text-3xl sm:text-4xl font-bold">
                            Página no encontrada
                        </h2>
                        <p className="text-lg text-muted-foreground max-w-md mx-auto">
                            Lo sentimos, no pudimos encontrar la página que
                            buscas. Es posible que se haya movido o eliminado.
                        </p>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Button size="lg" asChild className="h-12 px-6">
                            <Link href="/">
                                <Home className="mr-2 size-5" />
                                Volver al inicio
                            </Link>
                        </Button>
                        <Button
                            size="lg"
                            variant="outline"
                            asChild
                            className="h-12 px-6"
                        >
                            <Link href="/products">
                                <Search className="mr-2 size-5" />
                                Explorar productos
                            </Link>
                        </Button>
                    </div>

                    {/* Additional Help */}
                    <div className="mt-12 pt-8 border-t">
                        <p className="text-sm text-muted-foreground mb-4">
                            ¿Necesitas ayuda para encontrar algo?
                        </p>
                        <div className="flex flex-wrap justify-center gap-3 text-sm">
                            <Link
                                href="/contact"
                                className="text-primary hover:underline"
                            >
                                Contactar a soporte
                            </Link>
                            <span className="text-muted-foreground">•</span>
                            <Link
                                href="/faq"
                                className="text-primary hover:underline"
                            >
                                FAQ
                            </Link>
                            <span className="text-muted-foreground">•</span>
                            <Link
                                href="/products"
                                className="text-primary hover:underline"
                            >
                                Todos los productos
                            </Link>
                        </div>
                    </div>
                </div>
            </Card>
        </div>
    );
}
