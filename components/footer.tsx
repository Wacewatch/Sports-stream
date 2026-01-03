"use client"

import Link from "next/link"

export function Footer() {
  return (
    <footer className="bg-card border-t border-border py-8 mt-12">
      <div className="max-w-7xl mx-auto px-4 text-center">
        <Link
          href="https://wavewatch.xyz"
          target="_blank"
          className="inline-flex items-center gap-3 text-lg font-bold text-primary hover:text-primary/80 transition-colors mb-4"
        >
          <img src="https://i.imgur.com/nOLggXU.png?v=1" alt="Logo" className="h-10 w-auto" />
          <span>Sports-Stream by WaveWatch</span>
        </Link>
        <p className="text-sm text-muted-foreground">© {new Date().getFullYear()} WaveWatch. Tous droits réservés.</p>
        <p className="text-xs text-muted-foreground mt-2">
          Cette plateforme utilise uniquement de l'argent virtuel. Aucun pari réel n'est effectué.
        </p>
      </div>
    </footer>
  )
}
