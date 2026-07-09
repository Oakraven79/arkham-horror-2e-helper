'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

import './styles.scss'

const links = [
  {
    href: '/',
    label: 'Game Dashboard',
  },
  {
    href: '/sessions',
    label: 'Game Sessions',
  },
  {
    href: '/admin/game-data',
    label: 'Game Data',
  },
]

function isActivePath(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`)
}

export default function GameDataNavLink() {
  const pathname = usePathname()

  return (
    <nav className="game-data-nav" aria-label="Game navigation">
      <p className="game-data-nav__label">Game</p>
      {links.map((link) => {
        const active = isActivePath(pathname, link.href)

        return (
          <Link
            aria-current={active ? 'page' : undefined}
            className={active ? 'active' : undefined}
            href={link.href}
            key={link.href}
          >
            {link.label}
          </Link>
        )
      })}
    </nav>
  )
}
