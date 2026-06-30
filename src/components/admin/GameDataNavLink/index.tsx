'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

import './styles.scss'

export default function GameDataNavLink() {
  const pathname = usePathname()

  return (
    <div className="game-data-nav">
      <Link
        aria-current={pathname === '/admin/game-data' ? 'page' : undefined}
        className={pathname === '/admin/game-data' ? 'active' : undefined}
        href="/admin/game-data"
      >
        Game Data
      </Link>
    </div>
  )
}
