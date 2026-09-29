import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { SiteHeader } from '../shared/components/layout/SiteHeader';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface Feature {
  title: string;
  description: string;
  icon: ReactNode;
}

interface Step {
  title: string;
  description: string;
}

function IconUsers() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-6 w-6">
      <circle cx="9" cy="8" r="3" strokeLinecap="round" />
      <path d="M3.5 19c0-3 2.5-5 5.5-5s5.5 2 5.5 5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="17" cy="8" r="2.3" strokeLinecap="round" />
      <path d="M15 19c.3-2 1.8-3.5 4-3.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconScale() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
      <path d="M12 3v3" />
      <path d="M5 6h14" />
      <path d="M12 6v15" />
      <path d="M7 21h10" />
      <path d="M5 6 2 11a3 3 0 0 0 6 0z" />
      <path d="M19 6l-3 5a3 3 0 0 0 6 0z" />
    </svg>
  );
}

function IconCalendar() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 10h18" />
      <path d="M8 3v4" />
      <path d="M16 3v4" />
    </svg>
  );
}

function IconTrophy() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
      <path d="M8 4h8v5a4 4 0 0 1-8 0V4z" />
      <path d="M8 5H5a3 3 0 0 0 3 4" />
      <path d="M16 5h3a3 3 0 0 1-3 4" />
      <path d="M12 13v3" />
      <path d="M9 20h6" />
      <path d="M10 16h4l.5 4h-5z" />
    </svg>
  );
}

const FEATURES: Feature[] = [
  {
    title: 'Gestion des joueurs',
    description: "Ajoute tes potes, note leur niveau et garde une trace des joueurs invités d'un match à l'autre.",
    icon: <IconUsers />,
  },
  {
    title: 'Équilibrage automatique',
    description: 'Des équipes justes en un clic, calculées à partir du niveau de chaque joueur présent.',
    icon: <IconScale />,
  },
  {
    title: 'Organisation des matchs',
    description: 'Planifie la date, le lieu et le nombre de joueurs pour chaque session sans prise de tête.',
    icon: <IconCalendar />,
  },
  {
    title: 'Historique & scores',
    description: 'Retrouve les résultats des matchs passés et suivez vos stats au fil des semaines.',
    icon: <IconTrophy />,
  },
];

const STEPS: Step[] = [
  {
    title: 'Ajoute ton groupe',
    description: 'Crée la liste de tes joueurs réguliers, avec leur position préférée et leur niveau.',
  },
  {
    title: 'Lance un match',
    description: 'Choisis la date, le lieu et qui est présent parmi tes joueurs.',
  },
  {
    title: 'Laisse FiveMaker équilibrer',
    description: 'Deux équipes homogènes générées automatiquement, prêtes à jouer.',
  },
];

function FeatureCard({ feature }: { feature: Feature }) {
  return (
    <Card className="p-6 text-left">
      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-100 text-purple-600 dark:bg-purple-500/15 dark:text-purple-300">
        {feature.icon}
      </div>
      <h3 className="mt-4 font-semibold text-foreground">{feature.title}</h3>
      <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{feature.description}</p>
    </Card>
  );
}

function HeroMockupCard() {
  return (
    <Card className="mx-auto w-full max-w-sm p-5 shadow-lg">
      <div className="flex items-center justify-between">
        <span className="rounded-full bg-purple-100 px-2.5 py-1 text-xs font-medium text-purple-700 dark:bg-purple-500/15 dark:text-purple-300">
          Prochain match
        </span>
        <span className="text-xs text-gray-400">Jeudi 19h30</span>
      </div>

      <div className="mt-5 flex items-center justify-between">
        <div className="text-center">
          <div className="mx-auto flex -space-x-2">
            {['#a855f7', '#c084fc', '#e9d5ff'].map((color) => (
              <span
                key={color}
                className="h-7 w-7 rounded-full border-2 border-white dark:border-gray-900"
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
          <p className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">Équipe A</p>
        </div>

        <span className="text-sm font-semibold text-gray-400">VS</span>

        <div className="text-center">
          <div className="mx-auto flex -space-x-2">
            {['#f97316', '#fb923c', '#fed7aa'].map((color) => (
              <span
                key={color}
                className="h-7 w-7 rounded-full border-2 border-white dark:border-gray-900"
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
          <p className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">Équipe B</p>
        </div>
      </div>

      <div className="mt-5 flex items-center gap-1.5 rounded-lg bg-gray-50 px-3 py-2 text-xs font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-300">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5 text-purple-500">
          <path d="M20 6 9 17l-5-5" />
        </svg>
        Équipes équilibrées automatiquement
      </div>
    </Card>
  );
}

export function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 via-white to-white dark:from-gray-950 dark:via-gray-950 dark:to-gray-950">
      <SiteHeader />

      <main>
        <section className="mx-auto grid max-w-6xl items-center gap-12 px-6 py-20 md:grid-cols-2 md:py-28">
          <div className="text-center md:text-left">
            <span className="inline-block rounded-full bg-purple-100 px-3 py-1 text-xs font-semibold text-purple-700 dark:bg-purple-500/15 dark:text-purple-300">
              Organisation de matchs, simplifiée
            </span>
            <h1 className="mt-5 text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl dark:text-gray-100">
              Organise tes matchs de foot à 5 sans prise de tête
            </h1>
            <p className="mt-5 text-lg leading-relaxed text-gray-500 dark:text-gray-400">
              FiveMaker gère tes joueurs, équilibre les équipes automatiquement et garde
              l'historique de vos matchs entre potes.
            </p>
            <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center md:justify-start">
              <Button render={<Link to="/joueurs" />} size="lg" className="w-full rounded-full sm:w-auto">
                Gérer mes joueurs
              </Button>
              <Button
                render={<a href="#fonctionnalites" />}
                variant="outline"
                size="lg"
                className="w-full rounded-full sm:w-auto"
              >
                Voir les fonctionnalités
              </Button>
            </div>
          </div>

          <HeroMockupCard />
        </section>

        <section id="fonctionnalites" className="border-t border-gray-200/70 py-20 dark:border-gray-800">
          <div className="mx-auto max-w-6xl px-6">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                Tout ce qu'il faut pour organiser un five
              </h2>
              <p className="mt-3 text-gray-500 dark:text-gray-400">
                Pensé pour les groupes d'amis qui jouent chaque semaine.
              </p>
            </div>
            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {FEATURES.map((feature) => (
                <FeatureCard key={feature.title} feature={feature} />
              ))}
            </div>
          </div>
        </section>

        <section id="comment-ca-marche" className="border-t border-gray-200/70 py-20 dark:border-gray-800">
          <div className="mx-auto max-w-6xl px-6">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Comment ça marche</h2>
              <p className="mt-3 text-gray-500 dark:text-gray-400">Trois étapes, et c'est parti.</p>
            </div>
            <div className="mt-12 grid gap-10 md:grid-cols-3">
              {STEPS.map((step, index) => (
                <div key={step.title} className="text-center md:text-left">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-600 text-sm font-semibold text-white md:mx-0 mx-auto">
                    {index + 1}
                  </span>
                  <h3 className="mt-4 font-semibold text-gray-900 dark:text-gray-100">{step.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-gray-500 dark:text-gray-400">
                    {step.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-gray-200/70 py-8 dark:border-gray-800">
        <p className="text-center text-sm text-gray-400">FiveMaker — organisez vos matchs entre amis</p>
      </footer>
    </div>
  );
}
