# Frontier Chess

Music by <a href="https://pixabay.com/users/deuslower-45666444/?utm_source=link-attribution&utm_medium=referral&utm_campaign=music&
utm_content=236809">Vlad Bakutov</a> from <a href="https://pixabay.com/music//?utm_source=link-attribution&utm_medium=referral&
utm_campaign=music&utm_content=236809">Pixabay</a>

A unique chess variant that supports 2-4 players, featuring fog of war, terrain, goodie huts, and a dynamic move system.

## Features

- 2-4 player support
- Fog of war mechanics (limited vision for each piece)
- Different terrain types (water, forest, mountains)
- Goodie huts that provide new pieces when captured
- Dynamic move system with carry-over mechanics
- Sound effects and background music
- Modern, responsive UI

## Game Rules

### Starting Setup
- Each player starts with 5 pieces:
  - 1 king (placed on the edge)
  - 2 random pieces from rook, knight, bishop, or queen (placed on the edge)
  - 2 pawns (positioned in front of other pieces, facing the center)

### Movement and Turns
- Players get 3 moves per turn
- Unused moves carry over to your next turn
- Maximum available moves = number of pieces you have
- Each piece can move once per turn

### Vision and Terrain
- Pieces have limited vision range:
  - Pawns: 1 square (plus diagonals)
  - Rooks and Knights: 3 squares
  - Other pieces: 2 squares
- Terrain affects movement:
  - Water and Forest: Impassable
  - Mountains: Always impassable
  - Goodie Huts: Can be captured to gain new pieces

### Victory Conditions
- Capturing a king eliminates that player
- Last player standing wins

## Installation

1. Clone the repository
2. Place sound files in the `sounds` directory:
   - `move.mp3`: Piece movement sound
   - `capture.mp3`: Piece capture sound
   - `turn.mp3`: Turn change sound
   - `gameover.mp3`: Game over sound
   - `background.mp3`: Background music
   - `goodiehut.mp3`: Goodie hut capture sound
3. Open `index.html` in a modern web browser

## Project Structure

```
├── index.html
├── src/
│   ├── css/
│   │   └── styles.css
│   └── js/
│       ├── constants.js
│       ├── utils.js
│       ├── SoundManager.js
│       ├── UIManager.js
│       ├── BoardManager.js
│       ├── PieceManager.js
│       ├── VisibilityManager.js
│       ├── Game.js
│       └── script.js
└── sounds/
    ├── move.mp3
    ├── capture.mp3
    ├── turn.mp3
    ├── gameover.mp3
    └── background.mp3
```

## Browser Support

The game requires a modern browser that supports:
- ES6 Modules
- CSS Grid
- CSS Custom Properties
- Web Audio API

## Deployment to Render.com

To deploy the game to Render.com:

1. Create a new account on [Render.com](https://render.com) if you don't have one
2. Fork this repository to your GitHub account
3. In Render.com dashboard:
   - Click "New +"
   - Select "Static Site"
   - Connect your GitHub repository
   - Name your service (e.g., "three-player-chess")
   - Set the build command to empty (no build needed)
   - Set the publish directory to "./"
   - Click "Create Static Site"

The game will be automatically deployed and available at your Render.com URL. Any changes pushed to the main branch will trigger automatic redeployments.

## Contributing

Feel free to submit issues and pull requests.
