import { useEffect, useState } from 'react';
import { Check, Copy, MessageCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { getWhatsAppShareUrl } from '../../teams/utils/shareMessage';

interface InviteLinkCardProps {
  groupName: string;
  /** null tant que le lien est en cours de chargement. */
  inviteUrl: string | null;
  onRegenerate: () => void;
  onError: (message: string) => void;
}

export function InviteLinkCard({ groupName, inviteUrl, onRegenerate, onError }: InviteLinkCardProps) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timeout = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(timeout);
  }, [copied]);

  async function handleCopy() {
    if (!inviteUrl) return;
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
    } catch {
      onError('Copie impossible.');
    }
  }

  function handleShare() {
    if (!inviteUrl) return;
    const message = `⚽ Rejoins le groupe *${groupName}* sur FiveMaker :\n${inviteUrl}`;
    window.open(getWhatsAppShareUrl(message), '_blank', 'noopener,noreferrer');
  }

  return (
    <Card className="p-5">
      <div>
        <h2 className="font-semibold text-foreground">Inviter des membres</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Toute personne qui ouvre ce lien et se connecte rejoint le groupe en tant que membre.
        </p>
      </div>
      {inviteUrl ? (
        <>
          <Input value={inviteUrl} readOnly onFocus={(event) => event.target.select()} aria-label="Lien d'invitation" />
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              onClick={handleShare}
              className="rounded-full bg-[#25D366] text-[#0b3d1f] hover:bg-[#1ebe5b]"
            >
              <MessageCircle />
              WhatsApp
            </Button>
            <Button type="button" variant="outline" onClick={handleCopy} className="rounded-full">
              {copied ? <Check /> : <Copy />}
              {copied ? 'Copié !' : 'Copier'}
            </Button>
            <Button type="button" variant="ghost" onClick={onRegenerate} className="rounded-full">
              <RefreshCw />
              Nouveau lien
            </Button>
          </div>
        </>
      ) : (
        <p className="text-sm text-muted-foreground">Chargement du lien...</p>
      )}
    </Card>
  );
}
