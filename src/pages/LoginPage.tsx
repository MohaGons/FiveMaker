import { useState } from 'react';
import type { FormEvent } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { SiteHeader } from '../shared/components/layout/SiteHeader';
import { supabase } from '../shared/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type Mode = 'password' | 'magic-link';

/** Transmis par la page d'origine (ex. une invitation) via la navigation. */
interface LoginState {
  from?: string;
  /** Ouvrir directement sur la création de compte. */
  signUp?: boolean;
  /** Groupe qui a envoyé l'invitation, rappelé en haut de la page. */
  inviteGroupName?: string;
}

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as LoginState | null;
  // Page demandée avant d'être redirigé ici (ex. un lien d'invitation), sinon la liste des joueurs.
  const redirectTo = state?.from ?? '/joueurs';
  const [mode, setMode] = useState<Mode>('password');
  const [isSignUp, setIsSignUp] = useState(state?.signUp ?? false);
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
      ? await supabase.auth.signUp({
          email,
          password,
          // Le lien de confirmation ramène à la page demandée (ex. l'invitation).
          options: { emailRedirectTo: window.location.origin + redirectTo },
        })
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

    navigate(redirectTo, { replace: true });
  }

  async function handleMagicLinkSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);
    setInfoMessage(null);

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin + redirectTo },
    });

    setIsSubmitting(false);

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    setInfoMessage('Lien de connexion envoyé ! Vérifie ta boîte mail.');
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto flex max-w-md flex-col px-6 py-16">
        {state?.inviteGroupName && (
          <p className="mb-6 rounded-lg bg-primary/10 px-4 py-3 text-sm text-foreground">
            {isSignUp ? 'Crée ton compte' : 'Connecte-toi'} pour rejoindre le groupe{' '}
            <span className="font-semibold">{state.inviteGroupName}</span>. Tu reviendras ensuite sur l'invitation.
          </p>
        )}
        <h1 className="text-2xl font-bold text-foreground">
          {mode === 'password' && isSignUp ? 'Créer un compte' : 'Se connecter'}
        </h1>

        <div className="mt-6 flex gap-1 rounded-full bg-muted p-1">
          <Button
            type="button"
            variant={mode === 'password' ? 'secondary' : 'ghost'}
            onClick={() => switchMode('password')}
            className="flex-1 rounded-full"
          >
            Mot de passe
          </Button>
          <Button
            type="button"
            variant={mode === 'magic-link' ? 'secondary' : 'ghost'}
            onClick={() => switchMode('magic-link')}
            className="flex-1 rounded-full"
          >
            Lien magique
          </Button>
        </div>

        <form
          onSubmit={mode === 'password' ? handlePasswordSubmit : handleMagicLinkSubmit}
          className="mt-6 flex flex-col gap-4"
        >
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </div>

          {mode === 'password' && (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="password">Mot de passe</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                minLength={6}
              />
            </div>
          )}

          {errorMessage && <p className="text-sm text-red-600 dark:text-red-400">{errorMessage}</p>}
          {infoMessage && <p className="text-sm text-primary">{infoMessage}</p>}

          <Button type="submit" disabled={isSubmitting} className="rounded-full">
            {isSubmitting
              ? 'Chargement...'
              : mode === 'magic-link'
                ? 'Envoyer le lien'
                : isSignUp
                  ? 'Créer mon compte'
                  : 'Se connecter'}
          </Button>
        </form>

        {mode === 'password' && (
          <Button
            type="button"
            variant="link"
            onClick={() => {
              setIsSignUp((current) => !current);
              setErrorMessage(null);
              setInfoMessage(null);
            }}
            className="mt-4 text-muted-foreground"
          >
            {isSignUp ? 'Déjà un compte ? Se connecter' : "Pas de compte ? Créer un compte"}
          </Button>
        )}
      </main>
    </div>
  );
}
