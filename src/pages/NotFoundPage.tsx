import { Link } from 'react-router-dom';

export function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-gradient-to-b from-purple-50 via-white to-white px-6 text-center dark:from-gray-950 dark:via-gray-950 dark:to-gray-950">
      <span className="text-sm font-semibold text-purple-600">404</span>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
        Cette page n'existe pas
      </h1>
      <p className="text-gray-500 dark:text-gray-400">
        Vérifie l'adresse ou retourne à l'accueil.
      </p>
      <Link
        to="/"
        className="mt-2 rounded-full bg-purple-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-purple-700"
      >
        Retour à l'accueil
      </Link>
    </div>
  );
}
