# Weather widget server side rendered

## Description

This project is a weather widget that is server side rendered and can be embedded in Notion. It fetches the current weather data from the OpenWeather API and displays it in a clean and modern design using TailwindCSS. The widget is responsive and works on different screen sizes, and it also has a loading state and an error state. The widget is designed to be accessible and follows best practices for web accessibility.

## Requirements
- Node.js LTS 12.13 or higher
- NPM
- Runs on vercel
- Runs on serverside and not client side
- Has to be run on a server with HTTPS enabled (because of the API we use)
- API key for [OpenWeather](https://openweathermap.org/api) - `OPENWEATHERMAP_API_KEY`
- We need to cache the API response for 10 minutes to avoid hitting the API limits, so we need a way to store that cache on the server, we can use something like [node-cache](https://www.npmjs.com/package/node-cache) for that.
- We need to rate limit the API calls to avoid hitting the API limits, we can use something like [express-rate-limit](https://www.npmjs.com/package/express-rate-limit) for that.
- We need to handle errors gracefully, if the API call fails we should return a default response with a message like "Unable to fetch weather data" and a default icon.
- We need to get location from the path of the request, for example, if the request is made to `/weather/london` we should fetch the weather data for London.
- We need to get location from the path of the request, for example, if the request is made to `/weather/coordinate/50.447086/5.962080` we should fetch the weather data for the coordinates 50.447086, 5.962080.

## UI
- The widget should display the current temperature, weather condition, and an icon representing the weather condition.
- It should use TailwindCSS for styling and be responsive to different screen sizes.
- The widget should have a clean and modern design, with a focus on readability and usability.
- The widget should have a background color that changes based on the weather condition (e.g. blue for clear skies, gray for cloudy, etc.).
- The widget should have a loading state while the data is being fetched from the API, and an error state if the API call fails.
- The widget should load on the server side and not on the client side, so it should be rendered on the server and sent to the client as HTML.
- The widget should be accessible and follow best practices for web accessibility, such as using semantic HTML and providing alt text for images.
- The widget should work on notion by just embedding the URL of the widget, for example, if the widget is hosted on `https://myweatherwidget.com/weather/london` we should be able to embed it in notion by just adding that URL.


