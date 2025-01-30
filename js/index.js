window.onload = () => {
  console.log("Onload funtion running");
  window.localStorage.setItem("Location", "Bengaluru");
  // document.getElementById('Location').innerText = window.localStorage.getItem('Location');
  const key = "7f275b4a47ef4dd3843155639252801";

  const hourlydata = [];

  function getLocation() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        showPosition,
        getDefaultLocation
      );
    } else {
      window.localStorage.setItem("Location", " Location 28.7041,77.1025");
    }
  }

  function getDefaultLocation(err) {
    console.log("Location Access Not Given");
    window.localStorage.setItem("Location", " Location 28.7041,77.1025");
  }

  function showPosition(position) {
    window.localStorage.setItem(
      "Location",
      position.coords.latitude + "," + position.coords.longitude
    );
  }

  async function updateCurrentData(inputlocation) {
    if (inputlocation) {
      window.localStorage.setItem("InputLocation", inputlocation);
    }
    const location = inputlocation
      ? inputlocation
      : window.localStorage.getItem("Location");
    const url = `https://api.weatherapi.com/v1/current.json?key=${key}&q=${
      location ? location : "28.7041,77.1025"
    }&aqi=yes`;
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(response.status);
      }
      const data = await response.json();
      window.localStorage.setItem("Location", location);
      console.log(data);
      document.getElementById("details").innerHTML = `
            <h4>${data.location.name + ", " + data.location.region}</h4>
            <h5>${data.location.localtime}</h5>
            <h6>Weather : ${data.current.condition.text}<h6>
            <h6>Temp : ${data.current.temp_c}°C</h6>
            <h6>Feels: ${data.current.feelslike_c}°C </h6>
            <div class="accordion accordion-flush" id="accordionFlushExample">
              <div class="accordion-item">
                <h2 class="accordion-header" id="flush-headingOne">
                  <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#flush-collapseOne" aria-expanded="false" aria-controls="flush-collapseOne">
                    More Info
                  </button>
                </h2>
                <div id="flush-collapseOne" class="accordion-collapse collapse" aria-labelledby="flush-headingOne" data-bs-parent="#accordionFlushExample">
                    <p> Wind Speed : ${data.current.wind_kph} kmph</p>
                    <p> Wind Direction : ${data.current.wind_dir}</p>
                    <p> Wind Degree : ${data.current.wind_degree}</p>
                    <p> Humidity : ${data.current.humidity}</p>
                    <p> Pressure : ${data.current.pressure_in} in </p>
                    <p> Precipitation : ${data.current.precip_in} in</p>
                </div>
              </div>

            </div>
            `;
      document.getElementById(
        "body"
      ).style.backgroundImage = `url(./assets/${getWeatherFromCode(
        data.current.condition.code
      )}_bg.jpg)`;
      document.getElementById("current-img").src = `./assets/${
        getWeatherFromCode(data.current.condition.code) +
        (data.current.is_day === 1 ? "" : "_night")
      }.png`;
    } catch (err) {
      document.getElementById('loader').style.display = 'none'
      console.log(err);
    }
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

  function getDateFormat(date) {
    return (
      date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate()
    );
  }

  async function updateHourlyForecast() {
    try {
      const location = window.localStorage.getItem("Location");
      const url = `https://api.weatherapi.com/v1/forecast.json?key=${key}&q=${location ? location : "28.7041,77.1025"}&days=4&aqi=yes&alerts=yes`;
      const today = new Date();
      let prevday = new Date();
      prevday.setDate(prevday.getDate() - 3);

      const historyurl = `https://api.weatherapi.com/v1/history.json?key=${key}&q=${location ? location : "28.7041,77.1025"}&dt=${getDateFormat(prevday)}&end_dt=${getDateFormat(today)}`;

      const [forecastResponse, historyResponse] = await Promise.all([
        fetch(url),
        fetch(historyurl),
      ]);
      const forecastData = await forecastResponse.json();
      const history = await historyResponse.json();
      console.log(history);
      console.log(forecastData, history);
      const div = document.getElementById("hourly-forecast");
      const div2 = document.getElementById("forecast-history");
      hourlydata.splice(0, hourlydata.length);
      const dailydata = [];
      const todayhourlydata = [];
      for (let i = 0; i < 3; i++) {
        const d = history.forecast.forecastday[i];
        dailydata.push(`
                <div class="day">
                    <div>
                        <img src="./assets/${getWeatherFromCode(
                          d.day.condition.code
                        )}.png" width="100%" >
                    </div>
                    <div>
                        <h5>${d.date}</h5>
                        <h6>${d.day.condition.text}</h6>
                        <h6>Max temp: ${d.day.maxtemp_c}°C</h6>
                        <h6>Min temp: ${d.day.mintemp_c}°C</h6>
                    </div>
                </div>
                `);
      }

      for (
        let i = Number(history.location.localtime.substring(11, 13));
        i < 24;
        i++
      ) {
        const hourdata = history.forecast.forecastday[0].hour[i];
        todayhourlydata.push(`
                <div class="hourly">
                    <div>
                        <img src="./assets/${
                          getWeatherFromCode(hourdata.condition.code) +
                          (hourdata.is_day === 1 ? "" : "_night")
                        }.png" width="100%" >
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
      for (let i = 0; i < 4; i++) {
        const d = forecastData.forecast.forecastday[i];
        dailydata.push(`
                <div class="day" id="${d.date}" day="${i}">
                    <div>
                        <img src="./assets/${getWeatherFromCode(
                          d.day.condition.code
                        )}.png" width="100%" >
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

          for (let hour = 0; hour < 24; hour++) {
            const hourdata = forecastData.forecast.forecastday[i].hour[hour];
            temphourlydata.push(`
                        <div class="hourly">
                            <div>
                                <img src="./assets/${
                                  getWeatherFromCode(hourdata.condition.code) +
                                  (hourdata.is_day === 1 ? "" : "_night")
                                }.png" width="100%" >
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
      div2.innerHTML = dailydata.join("");
      div.innerHTML = "";
      document.getElementById("Hourly-text").innerText = '';
      setEvents();
      document.getElementById('loader').style.display = 'none'
    } catch (err) {
        document.getElementById('loader').style.display = 'none'
      console.log(err);
    }
  }

  function sethourlydata(event) {
    console.log(event);
    const textdata = document.getElementById("Hourly-text");
    const date = this.id;
    if (!date) return;
    const day = Number(this.getAttribute("day"));
    textdata.textContent = "Hourly ForeCast of " + date;
    const div = document.getElementById("hourly-forecast");
    console.log(hourlydata, day, this);
    div.innerHTML = hourlydata[day].join("");
  }

  function setEvents() {
    const classNames = document.getElementsByClassName("day");
    Array.from(classNames).forEach(function (element) {
      element.addEventListener("click", sethourlydata);
      // console.log(element);
    });
  }

  getLocation();
  updateCurrentData();
  updateHourlyForecast();
  const search = document.getElementById("search");
  const inputbox = document.getElementById("Location-box");
  search.addEventListener("click", () => {
    console.log(inputbox.value);
    if (inputbox.value.length > 2) {
      document.getElementById('loader').style.display = 'flex';
      updateCurrentData(inputbox.value);
      updateHourlyForecast();
    }
  });
  inputbox.addEventListener('keydown',function(event){
    if(event.key == "Enter"){
      if (inputbox.value.length > 2) {
        document.getElementById('loader').style.display = 'flex';
        updateCurrentData(inputbox.value);
        updateHourlyForecast();
      }
    }
  })
};
