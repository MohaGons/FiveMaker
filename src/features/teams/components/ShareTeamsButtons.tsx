import { useEffect, useState } from 'react';
import { Check, Copy, MessageCircle } from 'lucide-react';
import { getWhatsAppShareUrl } from '../utils/shareMessage';
import { Button } from '@/components/ui/button';

interface ShareTeamsButtonsProps {
  /** Construit à la demande : le message reflète l'état au moment du clic. */
  getMessage: () => string;
  size?: 'sm' | 'default';
}

const COPIED_FEEDBACK_MS = 2000;

export function ShareTeamsButtons({ getMessage, size = 'default' }: ShareTeamsButtonsProps) {
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied' | 'failed'>('idle');

  useEffect(() => {
    if (copyStatus === 'idle') return;
    const timeout = setTimeout(() => setCopyStatus('idle'), COPIED_FEEDBACK_MS);
    return () => clearTimeout(timeout);
  }, [copyStatus]);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(getMessage());
      setCopyStatus('copied');
    } catch {
      setCopyStatus('failed');
    }
  }

  return (
    <>
      <Button
        type="button"
        size={size}
        onClick={() => window.open(getWhatsAppShareUrl(getMessage()), '_blank', 'noopener,noreferrer')}
        className="rounded-full bg-[#25D366] text-[#0b3d1f] hover:bg-[#1ebe5b]"
      >
        <MessageCircle />
        WhatsApp
      </Button>
      <Button type="button" size={size} variant="outline" onClick={handleCopy} className="rounded-full">
        {copyStatus === 'copied' ? <Check /> : <Copy />}
        {copyStatus === 'copied' ? 'Copié !' : copyStatus === 'failed' ? 'Copie impossible' : 'Copier'}
      </Button>
    </>
  );
}
