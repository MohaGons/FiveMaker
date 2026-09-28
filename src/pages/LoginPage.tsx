import { useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { SiteHeader } from '../shared/components/layout/SiteHeader';
import { supabase } from '../shared/lib/supabaseClient';

type Mode = 'password' | 'magic-link';

const inputClassName =
  'w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100';

const labelClassName = 'block text-sm font-medium text-gray-700 dark:text-gray-300';

export function LoginPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>('password');
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  function switchMode(nextMode: Mode) {
    setMode(nextMode);
    setErrorMessage(null);
    setInfoMessage(null);
  }

  async function handlePasswordSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);
    setInfoMessage(null);

    const { data, error } = isSignUp
      ? await supabase.auth.signUp({ email, password })
      : await supabase.auth.signInWithPassword({ email, password });

    setIsSubmitting(false);

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    if (isSignUp && !data.session) {
      setInfoMessage('Compte créé ! Vérifie ta boîte mail pour confirmer ton adresse avant de te connecter.');
      return;
    }

    navigate('/joueurs');
  }

  async function handleMagicLinkSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);
    setInfoMessage(null);

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin },
    });

    setIsSubmitting(false);

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    setInfoMessage('Lien de connexion envoyé ! Vérifie ta boîte mail.');
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 via-white to-white dark:from-gray-950 dark:via-gray-950 dark:to-gray-950">
      <SiteHeader />
      <main className="mx-auto flex max-w-md flex-col px-6 py-16">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          {mode === 'password' && isSignUp ? 'Créer un compte' : 'Se connecter'}
        </h1>

        <div className="mt-6 flex gap-1 rounded-full bg-gray-100 p-1 dark:bg-gray-800">
          <button
            type="button"
            onClick={() => switchMode('password')}
            className={`flex-1 rounded-full px-4 py-2 text-sm font-medium transition ${
              mode === 'password'
                ? 'bg-white text-gray-900 shadow-sm dark:bg-gray-900 dark:text-gray-100'
                : 'text-gray-500 dark:text-gray-400'
            }`}
          >
            Mot de passe
          </button>
          <button
            type="button"
            onClick={() => switchMode('magic-link')}
            className={`flex-1 rounded-full px-4 py-2 text-sm font-medium transition ${
              mode === 'magic-link'
                ? 'bg-white text-gray-900 shadow-sm dark:bg-gray-900 dark:text-gray-100'
                : 'text-gray-500 dark:text-gray-400'
            }`}
          >
            Lien magique
          </button>
        </div>

        <form
          onSubmit={mode === 'password' ? handlePasswordSubmit : handleMagicLinkSubmit}
          className="mt-6 flex flex-col gap-4"
        >
          <div>
            <label htmlFor="email" className={labelClassName}>
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              className={`mt-1 ${inputClassName}`}
            />
          </div>

          {mode === 'password' && (
            <div>
              <label htmlFor="password" className={labelClassName}>
                Mot de passe
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                minLength={6}
                className={`mt-1 ${inputClassName}`}
              />
            </div>
          )}

          {errorMessage && <p className="text-sm text-red-600 dark:text-red-400">{errorMessage}</p>}
          {infoMessage && <p className="text-sm text-purple-600 dark:text-purple-400">{infoMessage}</p>}

          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-full bg-purple-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting
              ? 'Chargement...'
              : mode === 'magic-link'
                ? 'Envoyer le lien'
                : isSignUp
                  ? 'Créer mon compte'
                  : 'Se connecter'}
          </button>
        </form>

        {mode === 'password' && (
          <button
            type="button"
            onClick={() => {
              setIsSignUp((current) => !current);
              setErrorMessage(null);
              setInfoMessage(null);
            }}
            className="mt-4 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            {isSignUp ? 'Déjà un compte ? Se connecter' : "Pas de compte ? Créer un compte"}
          </button>
        )}
      </main>
    </div>
  );
}
