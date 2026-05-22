'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { PartyModal } from './PartyModal';

export function CreatePartyButton({ disabled = false }: { disabled?: boolean }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  if (disabled) {
    return (
      <a
        href="/login"
        className="text-zinc-400 hover:text-amber-300 text-sm font-medium"
      >
        Log in to post a party →
      </a>
    );
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="bg-amber-600 hover:bg-amber-500 text-white font-semibold px-4 py-1.5 rounded-lg text-sm transition-colors inline-flex items-center gap-1.5"
      >
        <span className="text-lg leading-none">+</span> Post party
      </button>
      <PartyModal
        open={open}
        onClose={() => setOpen(false)}
        onSuccess={() => router.refresh()}
      />
    </>
  );
}
