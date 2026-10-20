# nodejs-azure-app

My first Node.js app hosted on Azure.

## Weather Dashboard

This project serves a responsive weather dashboard that lets users search by city and view:

- Current temperature and apparent temperature
- Weather condition description
- Humidity
- Wind speed and direction
- Sunrise and sunset times
- 5-day forecast

The UI calls [Open-Meteo](https://open-meteo.com/) directly from the browser:

1. **Geocoding API** resolves the city name to latitude/longitude.
2. **Forecast API** returns current weather and daily forecast data for that location.

Open-Meteo is public and does not require an API key, so no API secrets or environment variables are needed for weather data.

## Run locally

### Prerequisites

- Node.js 18+ (Node.js 20+ recommended)

### Setup

```bash
npm install
npm start
```

The app runs at `http://localhost:3000` by default.

## Test

```bash
npm test
```

## Azure App Service deployment (quick start)

1. Create an Azure App Service configured for Node.js.
2. Connect the App Service to this GitHub repository and branch.
3. Keep the startup command as the default `npm start` (or set it explicitly).
4. Deploy.

The server listens on `process.env.PORT` (with local fallback to `3000`), which is compatible with Azure App Service.
