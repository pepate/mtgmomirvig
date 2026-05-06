# Momir Basic — Tabletop

A sleek, touch-optimized web app that brings the **Momir Basic** format from Magic: The Gathering Online to your kitchen table. Place a tablet in the center or let each player use their phone — no special cards needed.

## How It Works

1. **Pick a mode** — Solo or Two Players
2. **Tap +** to open the summon controls
3. **Set your CMC** (0–16) with − / +
4. **Tap the number** to summon a random creature with that exact mana value
5. **Tap a creature** to toggle tapped/untapped
6. **Tap ✕** on a card to remove it from the battlefield

Lands and discarding are handled with real cards at the table — the app only manages creature generation.

## Two-Player Mode

The screen splits horizontally. The top half is rotated 180° so the player sitting across the table sees their side right-side up. Each player has independent controls and their own battlefield.

## Features

- Random creatures via the [Scryfall API](https://scryfall.com/docs/api) (vintage-legal pool)
- Remembers your last CMC between summons
- Cards auto-size to fit the screen, then scroll horizontally when the battlefield gets crowded
- Tap to toggle tapped state (90° rotation)
- Dark UI with Simic-inspired color palette
- Works offline once loaded (except for summoning new creatures)
- No install, no build step — just HTML + JS

## Play It

**[Open the app](https://pepate.github.io/mtgmomirvig/)**

Works best in landscape on a tablet, or portrait on a phone.

## Tech

- React 18 (CDN, no build step)
- Scryfall REST API
- Pure inline styles, no dependencies beyond React and two Google Fonts (Inter + Fraunces)

## License

MIT
