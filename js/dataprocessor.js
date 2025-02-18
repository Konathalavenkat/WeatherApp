
onmessage = function(event){
    const {forecastData,history} = event.data;
    // console.log(forecastData,history,"from worker")
    const hourlydata = [];
    const dailydata = [];
      const todayhourlydata = [];
      dailydata.push(`
        <div id="history-container">
            <h3>History</h3>
            <div id="History">`)
      for (let i = 0; i < Math.min(3,history.forecast.forecastday.length); i++) {
        const d = history.forecast.forecastday[i];
        dailydata.push(`
                <div class="day">
                    <div>
                        <img src="./assets/${getWeatherFromCode(
                          d.day.condition.code
                        )}.png" width="100%" loading="lazy">
                    </div>
                    <div>
                        <h6>${d.date}</h5>
                        <h6>${d.day.condition.text}</h6>
                        <h6>Max temp: ${d.day.maxtemp_c}°C</h6>
                        <h6>Min temp: ${d.day.mintemp_c}°C</h6>
                    </div>
                </div>
                `);
      }
      dailydata.push(`    </div>
        </div>
        <div id="forecast-container">
            <h3>Forecast</h3>
            <div id="Forecast">`)
      for (
        let i = Number(history.location.localtime.substring(11, 13));
        i < Math.min(24,forecastData.forecast.forecastday[0].hour.length);
        i++
      ) {
        const hourdata = forecastData.forecast.forecastday[0].hour[i];
        todayhourlydata.push(`
                <div class="hourly">
                    <div>
                        <img src="./assets/${
                          getWeatherFromCode(hourdata.condition.code) +
                          (hourdata.is_day === 1 ? "" : "_night")
                        }.png" width="100%" loading="lazy">
                    </div>
                    <div>
                        <h5>${hourdata.time.substring(11, 16)}</h5>
                        <h6>${hourdata.condition.text}</h6>
                        <h6>Temp : ${hourdata.temp_c}°C</h6>
                    </div>
                </div>
                `);
      }
      hourlydata.push(todayhourlydata);
      for (let i = 0; i < Math.min(4,forecastData.forecast.forecastday.length); i++) {
        const d = forecastData.forecast.forecastday[i];
        dailydata.push(`
                <div class="day" id="${d.date}" day="${i}">
                    <div>
                        <img src="./assets/${getWeatherFromCode(
                          d.day.condition.code
                        )}.png" width="100%" loading="lazy">
                    </div>
                    <div>
                        <h6>${d.date}</h6>
                        <h6>${d.day.condition.text}</h6>
                        <h6>Max temp: ${d.day.maxtemp_c}°C</h6>
                        <h6>Min temp: ${d.day.mintemp_c}°C</h6>
                    </div>
                </div>
                `);
        if (i != 0) {
          const temphourlydata = [];

          for (let hour = 0; hour < Math.min(24,forecastData.forecast.forecastday[i].hour.length); hour++) {
            const hourdata = forecastData.forecast.forecastday[i].hour[hour];
            temphourlydata.push(`
                        <div class="hourly">
                            <div>
                                <img src="./assets/${
                                  getWeatherFromCode(hourdata.condition.code) +
                                  (hourdata.is_day === 1 ? "" : "_night")
                                }.png" width="100%" loading="lazy" >
                            </div>
                            <div>
                                <h5>${hourdata.time.substring(11, 16)}</h5>
                                <h6>${hourdata.condition.text}</h6>
                                <h6>Temp : ${hourdata.temp_c}°C</h6>
                            </div>
                        </div>
                    `);
          }
          hourlydata.push(temphourlydata);
        }
      }
      dailydata.push(`        </div>
        </div>`);
        postMessage({dailydata,hourlydata});
}

function getWeatherFromCode(code) {
  if (code <= 1000) {
    return "sunny";
  } else if (code == 1030) {
    return "foggy";
  } else if (code <= 1117) {
    return "cloudy";
  } else if (code <= 1171) {
    return "foggy";
  } else if (code <= 1264) {
    return "rainy";
  } else {
    return "thunder";
  }
}