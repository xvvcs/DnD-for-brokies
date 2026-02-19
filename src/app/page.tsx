import { Shield, Swords, Scroll, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Navbar, PageWrapper } from '@/components/shared';
import { SeedCharacterButton } from '@/components/debug/SeedCharacterButton';
import Link from 'next/link';

export default function Home() {
  return (
    <>
      <Navbar />
      <PageWrapper>
        {/* Hero Section */}
        <div className="text-center py-16 md:py-24">
          <div className="inline-flex items-center justify-center w-24 h-24 mb-8 rounded-full bg-primary/10 border-2 border-primary">
            <Shield className="w-12 h-12 text-primary" />
          </div>
          <h1 className="font-[family-name:var(--font-cinzel)] text-4xl md:text-6xl font-bold text-foreground mb-6">
            DnDnB
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground mb-4 max-w-2xl mx-auto">
            Free & Open-Source D&D 5e Character Manager
          </p>
          <p className="text-base text-muted-foreground/80 mb-8 max-w-xl mx-auto">
            Create, manage, and export your D&D characters using Open5E content. All data stored
            locally in your browser.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              asChild
              size="lg"
              className="font-[family-name:var(--font-cinzel)] text-lg px-8"
            >
              <Link href="/characters/new">Create Character</Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="font-[family-name:var(--font-cinzel)] text-lg px-8"
            >
              <Link href="/characters">My Characters</Link>
            </Button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 py-12">
          <Card className="fantasy-card">
            <CardHeader>
              <Swords className="w-10 h-10 text-primary mb-2" />
              <CardTitle className="font-[family-name:var(--font-cinzel)]">
                Character Creation
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-muted-foreground">
                Step-by-step wizard guiding you through race, class, background, and ability scores.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="fantasy-card">
            <CardHeader>
              <Scroll className="w-10 h-10 text-primary mb-2" />
              <CardTitle className="font-[family-name:var(--font-cinzel)]">
                Full Character Sheet
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-muted-foreground">
                Interactive character sheet with auto-calculated stats, HP tracking, and spell
                management.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="fantasy-card">
            <CardHeader>
              <Users className="w-10 h-10 text-primary mb-2" />
              <CardTitle className="font-[family-name:var(--font-cinzel)]">
                Campaign Management
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-muted-foreground">
                Organize characters by campaign with edition-specific content filtering.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="fantasy-card">
            <CardHeader>
              <Shield className="w-10 h-10 text-primary mb-2" />
              <CardTitle className="font-[family-name:var(--font-cinzel)]">PDF Export</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-muted-foreground">
                Export your characters to PDF for printing or sharing with your DM.
              </CardDescription>
            </CardContent>
          </Card>
        </div>

        {/* Supported Content */}
        <div className="py-12 text-center">
          <h2 className="font-[family-name:var(--font-cinzel)] text-2xl md:text-3xl font-bold text-foreground mb-4">
            Powered by Open5E
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Access SRD 5.1, SRD 5.2, and other Open5E content. Choose between 2014 and 2025 edition
            rules for your campaign.
          </p>
        </div>

        {/* Debug Mode Section */}
        <div className="py-12 border-t border-border">
          <div className="bg-yellow-50 border-2 border-yellow-400 rounded-lg p-6">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-2xl">🔧</span>
              <h2 className="font-[family-name:var(--font-cinzel)] text-xl font-bold text-yellow-800">
                Developer Debug Mode
              </h2>
            </div>
            <p className="text-yellow-700 mb-4">
              Preview the character sheet with mock data. Click below to see what we have built so
              far:
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                asChild
                variant="outline"
                className="border-yellow-600 text-yellow-800 hover:bg-yellow-100"
              >
                <Link href="/characters/debug-fighter">View Fighter (mock, no DB)</Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="border-yellow-600 text-yellow-800 hover:bg-yellow-100"
              >
                <Link href="/characters/debug-wizard">View Wizard (mock, no DB)</Link>
              </Button>
            </div>

            <div className="mt-4 pt-4 border-t border-yellow-300">
              <p className="text-yellow-700 text-sm mb-3">
                Or seed a character into IndexedDB and open the{' '}
                <strong>live character sheet</strong> (auto-save, delete, etc.):
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <SeedCharacterButton
                  variant="fighter"
                  className="border-yellow-600 text-yellow-800 hover:bg-yellow-100"
                />
                <SeedCharacterButton
                  variant="wizard"
                  className="border-yellow-600 text-yellow-800 hover:bg-yellow-100"
                />
              </div>
            </div>
          </div>
        </div>
      </PageWrapper>
    </>
  );
}
