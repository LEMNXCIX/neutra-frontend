import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { MapPin, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function CareersPage() {
    return (
    <div className="max-w-5xl mx-auto px-6 py-24 lg:py-32 animate-slide-up">
        <div className="space-y-24">
            <header className="space-y-6 max-w-3xl">
                <Badge variant="secondary" className="px-4 py-1 rounded-full">Human Resources</Badge>
                <h1 className="text-6xl md:text-8xl font-bold tracking-tight text-foreground leading-[0.9]">
                    Join Our <span className="text-primary">Network</span>
                </h1>
                <p className="text-xl text-muted-foreground font-medium leading-relaxed">
                    We are engineering a new paradigm for minimalist environments. 
                    We are consistently scouting for specialized talent to join our architectural core.
                </p>
            </header>

            <section className="space-y-12">
                <div className="flex items-center gap-6">
                    <h2 className="text-xs font-bold uppercase tracking-[0.3em] text-primary whitespace-nowrap">
                        Active Node Vacancies
                    </h2>
                    <div className="h-px flex-1 bg-border" />
                </div>

                <div className="grid grid-cols-1 gap-6">
                    {[
                        { title: "Senior Grid Architect", location: "Global / Remote", desc: "Lead the spatial design protocol for our next-generation asset collection." },
                        { title: "Operations Controller", location: "NYC Intelligence Hub", desc: "Optimize the logistic flow and supply chain integrity across all network nodes." }
                    ].map((job, i) => (
                        <Card key={i} className="t-card border-none shadow-lg hover:shadow-xl group overflow-hidden">
                            <CardContent className="p-10 flex flex-col md:flex-row md:items-center justify-between gap-10">
                                <div className="space-y-4 flex-1">
                                    <div className="flex flex-wrap items-center gap-4">
                                        <h3 className="font-bold text-2xl tracking-tight group-hover:text-primary transition-colors">{job.title}</h3>
                                        <Badge variant="secondary" className="bg-primary/10 text-primary font-bold px-3 py-1 rounded-full text-[10px]">
                                            <MapPin className="w-3 h-3 mr-1.5" />
                                            {job.location}
                                        </Badge>
                                    </div>
                                    <p className="text-muted-foreground font-medium text-base leading-relaxed max-w-xl">{job.desc}</p>
                                </div>
                                <Button className="h-14 px-10 rounded-xl font-bold text-sm shadow-lg shadow-primary/10 hover:-translate-y-0.5" asChild>
                                    <Link href="/contact">Provision Intake <ArrowRight className="ml-2 w-4 h-4" /></Link>
                                </Button>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                <div className="pt-12 text-center space-y-4">
                    <p className="text-muted-foreground font-semibold uppercase tracking-widest text-xs">No suitable node found?</p>
                    <a href="mailto:careers@xcix.com" className="text-xl font-bold tracking-tight text-foreground hover:text-primary transition-all border-b-2 border-primary/20 hover:border-primary pb-1">
                        careers@xcix.com
                    </a>
                </div>
            </section>
        </div>
    </div>
  );
}
