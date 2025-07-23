# Bike Workout Tracker

A modern web application for tracking cycling workouts with location, distance, time, and elevation data.

## Features

- 📝 **Add Workouts**: Track location, miles, time, and elevation gain
- 📊 **Statistics**: View total miles, time, elevation, and workout count
- 📋 **Workout History**: See all previous workouts with timestamps
- 💾 **SQLite Storage**: Persistent data storage with SQLite database
- ⚡ **Real-time Updates**: Dynamic UI updates using HTMX
- 🎨 **Web Components**: Custom components built with wrec library

## Tech Stack

- **Backend**: [Hono](https://hono.dev/) - Fast, lightweight web framework
- **Database**: [SQLite](https://sqlite.org/) with better-sqlite3
- **Frontend**: [HTMX](https://htmx.org/) for dynamic interactions
- **Components**: [wrec](https://github.com/mvolkmann/wrec) for web components
- **Runtime**: Node.js

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd cycling-app
```

2. Install dependencies:
```bash
npm install
```

3. Start the application:
```bash
npm start
```

4. Open your browser to `http://localhost:3000`

## Usage

### Adding a Workout
1. Fill in the workout form with:
   - Location (e.g., "Katy Trail", "Central Park")
   - Miles (distance traveled)
   - Time in minutes
   - Elevation gain in feet
2. Click "Add Workout"
3. The form will clear and the workout appears in your history

### Viewing Statistics
- **Summary**: Quick totals displayed above workout list
- **Detailed Stats**: Full statistics component at bottom of page
- **Workout History**: Chronological list of all workouts

## Database Migration

If you have existing workout data in a `workouts.json` file, run the migration script:

```bash
node migrate.js
```

This will import all existing workouts into the SQLite database.

## Project Structure

```
cycling-app/
├── components/
│   └── workout-stats.js     # Statistics web component
├── index.html              # Main application page
├── server.js              # Hono server and API endpoints
├── migrate.js             # JSON to SQLite migration script
├── package.json           # Dependencies and scripts
└── README.md             # This file
```

## API Endpoints

- `GET /` - Main application page
- `GET /workouts` - Get workout list HTML
- `POST /workouts` - Add new workout
- `GET /summary` - Get workout summary HTML
- `GET /api/stats` - Get workout statistics JSON

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details