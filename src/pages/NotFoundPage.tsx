import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-6 text-center">
      <span className="text-sm font-semibold text-primary">404</span>
      <h1 className="text-2xl font-bold text-foreground">Cette page n'existe pas</h1>
      <p className="text-muted-foreground">Vérifie l'adresse ou retourne à l'accueil.</p>
      <Button render={<Link to="/" />} className="mt-2 rounded-full">
        Retour à l'accueil
      </Button>
    </div>
  );
}
