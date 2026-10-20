const GEOCODING_API = 'https://geocoding-api.open-meteo.com/v1/search';
const WEATHER_API = 'https://api.open-meteo.com/v1/forecast';

const weatherCodeMap = {
  0: 'Clear sky',
  1: 'Mainly clear',
  2: 'Partly cloudy',
  3: 'Overcast',
  45: 'Fog',
  48: 'Depositing rime fog',
  51: 'Light drizzle',
  53: 'Moderate drizzle',
  55: 'Dense drizzle',
  56: 'Light freezing drizzle',
  57: 'Dense freezing drizzle',
  61: 'Slight rain',
  63: 'Moderate rain',
  65: 'Heavy rain',
  66: 'Light freezing rain',
  67: 'Heavy freezing rain',
  71: 'Slight snow fall',
  73: 'Moderate snow fall',
  75: 'Heavy snow fall',
  77: 'Snow grains',
  80: 'Slight rain showers',
  81: 'Moderate rain showers',
  82: 'Violent rain showers',
  85: 'Slight snow showers',
  86: 'Heavy snow showers',
  95: 'Thunderstorm',
  96: 'Thunderstorm with slight hail',
  99: 'Thunderstorm with heavy hail'
};

const form = document.getElementById('search-form');
const cityInput = document.getElementById('city-input');
const fieldError = document.getElementById('field-error');
const statusPanel = document.getElementById('status-panel');
const statusMessage = document.getElementById('status-message');
const results = document.getElementById('results');

const locationTitle = document.getElementById('location-title');
const weatherCondition = document.getElementById('weather-condition');
const temperature = document.getElementById('temperature');
const apparentTemperature = document.getElementById('apparent-temperature');
const humidity = document.getElementById('humidity');
const wind = document.getElementById('wind');
const sunrise = document.getElementById('sunrise');
const sunset = document.getElementById('sunset');
const forecastList = document.getElementById('forecast-list');

function setStatus(message, isError = false) {
  statusMessage.textContent = message;
  statusPanel.classList.toggle('error', isError);
}

function setFieldError(message = '') {
  const hasError = message.length > 0;
  fieldError.hidden = !hasError;
  fieldError.textContent = message;
  cityInput.setAttribute('aria-invalid', String(hasError));
}

function formatLocalDate(isoDate, timezone) {
  return new Intl.DateTimeFormat(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    timeZone: timezone
  }).format(new Date(`${isoDate}T12:00:00`));
}

function formatLocalTime(isoDateTime, timezone) {
  return new Intl.DateTimeFormat(undefined, {
    hour: 'numeric',
    minute: '2-digit',
    timeZone: timezone
  }).format(new Date(isoDateTime));
}

function getWeatherDescription(code) {
  return weatherCodeMap[code] || 'Unknown conditions';
}

async function fetchJson(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }
  return response.json();
}

async function fetchLocation(city) {
  const params = new URLSearchParams({
    name: city,
    count: '1',
    language: 'en',
    format: 'json'
  });
  const data = await fetchJson(`${GEOCODING_API}?${params.toString()}`);
  if (!data.results || data.results.length === 0) {
    return null;
  }
  return data.results[0];
}

async function fetchWeather(latitude, longitude, timezone) {
  const params = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
    current: [
      'temperature_2m',
      'apparent_temperature',
      'relative_humidity_2m',
      'wind_speed_10m',
      'wind_direction_10m',
      'weather_code'
    ].join(','),
    daily: [
      'weather_code',
      'temperature_2m_max',
      'temperature_2m_min',
      'sunrise',
      'sunset'
    ].join(','),
    timezone
  });

  return fetchJson(`${WEATHER_API}?${params.toString()}`);
}

function renderForecast(weatherData, timezone) {
  forecastList.innerHTML = '';
  const dates = weatherData.daily.time.slice(0, 5);

  dates.forEach((date, index) => {
    const item = document.createElement('li');
    item.className = 'forecast-item';

    const max = Math.round(weatherData.daily.temperature_2m_max[index]);
    const min = Math.round(weatherData.daily.temperature_2m_min[index]);
    const description = getWeatherDescription(weatherData.daily.weather_code[index]);

    item.innerHTML = `
      <h3>${formatLocalDate(date, timezone)}</h3>
      <p>${description}</p>
      <p><strong>${max}°C</strong> / ${min}°C</p>
    `;

    forecastList.appendChild(item);
  });
}

function renderWeather(location, weatherData) {
  const timezone = weatherData.timezone;
  const current = weatherData.current;

  locationTitle.textContent = `${location.name}${location.admin1 ? `, ${location.admin1}` : ''}, ${location.country}`;
  weatherCondition.textContent = getWeatherDescription(current.weather_code);
  temperature.textContent = `${Math.round(current.temperature_2m)}°C`;
  apparentTemperature.textContent = `${Math.round(current.apparent_temperature)}°C`;
  humidity.textContent = `${current.relative_humidity_2m}%`;
  wind.textContent = `${Math.round(current.wind_speed_10m)} km/h (${Math.round(current.wind_direction_10m)}°)`;
  sunrise.textContent = formatLocalTime(weatherData.daily.sunrise[0], timezone);
  sunset.textContent = formatLocalTime(weatherData.daily.sunset[0], timezone);

  renderForecast(weatherData, timezone);
  results.hidden = false;
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  setFieldError();

  const city = cityInput.value.trim();
  if (!city) {
    results.hidden = true;
    setFieldError('Please enter a city name.');
    setStatus('A city name is required before searching.', true);
    cityInput.focus();
    return;
  }

  setStatus('Loading weather data...');
  results.hidden = true;

  try {
    const location = await fetchLocation(city);

    if (!location) {
      setStatus(`No matching city found for “${city}”. Please try another search.`, true);
      return;
    }

    const weatherData = await fetchWeather(location.latitude, location.longitude, location.timezone);

    if (!weatherData.current || !weatherData.daily) {
      throw new Error('Weather response is missing required fields.');
    }

    renderWeather(location, weatherData);
    setStatus(`Showing weather for ${location.name}.`);
  } catch (error) {
    setStatus('Unable to load weather data right now. Please check your connection and try again.', true);
    console.error(error);
  }
});
