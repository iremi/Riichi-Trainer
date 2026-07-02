> **Note:** This is a fork of the original [Riichi-Trainer by Euophrys](https://github.com/Euophrys/Riichi-Trainer). Its focus is a **mobile-first experience**: the trainer can be **installed to your home screen as an app**, and its layout is **optimized for phones**. On top of that it adds several quality-of-life features — an Undo button, tile images and a cleaner hand history, and a single compact top navigation row. All credit for the underlying trainer goes to the original author and contributors.

If you're looking to contribute, translations or otherwise, please see the [contributing guidelines](https://github.com/Euophrys/Riichi-Trainer/blob/develop/CONTRIBUTING.md) for instructions.

This is a collection of tools designed to improve the play of Riichi Mahjong players. It includes an efficiency trainer to help players identify the best tile to discard, a replay analyzer to check the efficiency (and safety, if relevant) of a player's discards, an all-last trainer to assist with comebacks, and a few random utilities.

When referring to efficiency here, we're referring to ukeire, which is the tile acceptance of the hand in the present. There's no look-ahead for future efficiency. Ukeire is an easily measurable thing, and playing towards ukeire is sufficient for many players when combined with adequate defensive play. These tools are primarily aimed at people below Tokujou on Tenhou, and most Mahjong Soul players.

See the [itch.io page](https://euophrys.itch.io/mahjong-efficiency-trainer) for more information.

## Install it as an app (Add to Home Screen)

This fork is a full [Progressive Web App](https://web.dev/progressive-web-apps/), so you can install it to your phone's home screen (or your desktop) and launch it like a native app — no app store needed. In Chrome/Edge on Android, use the browser menu's **"Install app" / "Add to Home Screen"** option (or the install icon in the desktop address bar); on iOS Safari, tap **Share → "Add to Home Screen"**. Once installed it opens full-screen in its own window.

## Mobile-first layout

The Efficiency Trainer's layout is optimized for phones:

- On phones — including landscape — the hand uses the **full screen width** so the tiles are as large and tappable as possible, while still keeping all 13/14 tiles on a **single row**. On narrow screens the tiles are stretched slightly taller for legibility.
- The top navigation (Trainer, Analyzer, …) plus **Language, Settings, and Statistics** are gathered into a single compact, centered row that fits on one line on landscape phones and desktop.
- On desktop the content keeps its original fixed, centered width.
- The efficiency-trainer disclaimer text block was removed to save vertical space.

## Undo button (Efficiency Trainer)

The main Trainer tab now has an **Undo** button next to "New Hand". It steps back exactly one discard, restoring the previous game state (your hand, the tile you had drawn, the discard pool, the remaining wall, the history log, and your running efficiency totals). Because each draw is random, undo replays the *exact* prior state rather than recomputing it, so undoing and re-discarding stays consistent.

The button is disabled on the first selection of a hand (there is nothing to undo) and resets whenever a new hand starts. If the undone discard had completed the round, the stats that were saved for that completion are rolled back as well. The label is translated in all supported languages.

## Hand history (Efficiency Trainer)

The hand history messages are laid out across three rows — your discard and its result, the most efficient discard, and the tile you drew. The number of tiles that improve the hand is highlighted in a small outlined pill so it stands out at a glance. Each result reads as a single clean sentence (the long list of accepting tiles was removed). When a hand is completed, the **"Congratulations! Your efficiency was …"** summary appears on its own bold row.

A setting, **"Show tile images in hand history"** (in the Trainer's Settings, under "Verbose tile names"), is **on by default**. When enabled, the discarded tile, the suggested tile, and the drawn tile are shown as inline tile images instead of text. Turning the setting off reverts to a plain text-only history.

# For Programmers:
This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app). Make sure to run `npm install`, everyone's favourite command.

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.<br>
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

The page will reload if you make edits.<br>
You will also see any lint errors in the console.

If you run into `ERR_OSSL_EVP_UNSUPPORTED`, you may need to `export NODE_OPTIONS=--openssl-legacy-provider` to get it working.

### `npm run build`

Builds the app for production to the `build` folder.<br>
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.<br>
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.
