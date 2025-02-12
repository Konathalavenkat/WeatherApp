window.onload = () => {

  window.localStorage.setItem("Location", "Bengaluru");

  const key = "d7086282fbbf40308c254148251102";

  let showdata = false;
  let Hourlydata = [];

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

  function toggledata(){
    showdata = !showdata;
    if(showdata){
      document.getElementById('forecast-history').style.display = 'flex';
      document.getElementById('toggler').innerText = 'Hide daywise data'; 
      document.getElementById('main').style.display = 'block';
      document.getElementById('Hourly-text').style.display = 'block';
    }
    else{
      document.getElementById('forecast-history').style.display = 'none';
      document.getElementById('toggler').innerText = 'Show daywise data';
      document.getElementById('main').style.display = 'flex';
      document.getElementById('Hourly-text').style.display = 'none';
      document.getElementById('Hourly-text').innerText = ''
      document.getElementById('hourly-forecast').innerHTML = '';
    }
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
              <button class="btn btn-primary mt-2 ml-5" id="toggler">${showdata ? 'Hide daywise data' : 'Show daywise data'} </button>

            </div>
            `;
      document.getElementById(
        "body"
      ).style.backgroundImage = `url(./assets/${getWeatherFromCode(
        data.current.condition.code
      )}_bg-min.jpg)`;
      document.getElementById("current-img").src = `./assets/${
        getWeatherFromCode(data.current.condition.code) +
        (data.current.is_day === 1 ? "" : "_night")
      }.png`;
      document.getElementById("toggler").addEventListener('click',toggledata);
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
      const div = document.getElementById("hourly-forecast");
      const div2 = document.getElementById("forecast-history");
      const worker = new Worker("./js/dataprocessor.js");
      worker.onmessage = (event) => {
        const {dailydata , hourlydata } = event.data;
        div2.innerHTML = dailydata.join("");
        div.innerHTML = "";
        document.getElementById("Hourly-text").innerText = '';
        Hourlydata = hourlydata;
        setEvents();
        worker.terminate();
      }
      worker.postMessage({forecastData,history});
      document.getElementById('loader').style.display = 'none'
    } catch (err) {
        document.getElementById('loader').style.display = 'none'
      console.log(err);
    }
  }

  function sethourlydata(event) {
    const textdata = document.getElementById("Hourly-text");
    const date = this.id;
    if (!date) return;
    const day = Number(this.getAttribute("day"));
    textdata.textContent = "Hourly ForeCast of " + date;
    const div = document.getElementById("hourly-forecast");
    div.innerHTML = Hourlydata[day].join("");
  }

  function setEvents() {
    const classNames = document.getElementsByClassName("day");
    Array.from(classNames).forEach(function (element) {
      element.addEventListener("click", sethourlydata);
    });
  }

  function updateinput(text){
    const inputbox = document.getElementById('Location-box');
    inputbox.value = this.innerText ? this.innerText : text;
    document.getElementById('list-autocomplete').innerHTML = "";
    document.getElementById('loader').style.display = 'flex';
    updateCurrentData(inputbox.value);
    updateHourlyForecast();
    inputbox.value = "";
    document.getElementById('list-autocomplete').innerHTML = "";
  }

  getLocation();
  updateCurrentData();
  updateHourlyForecast();

  const search = document.getElementById("search");
  const inputbox = document.getElementById("Location-box");

  search.addEventListener("click", () => {
    if (inputbox.value.length > 2) {
      document.getElementById('loader').style.display = 'flex';
      updateCurrentData(inputbox.value);
      updateHourlyForecast();
      inputbox.value = "";
      document.getElementById('list-autocomplete').innerHTML = "";
    }
  });

  inputbox.addEventListener('keydown',async function(event){
    if(event.key == "Enter"){
      if (inputbox.value.length > 2) {
        document.getElementById('loader').style.display = 'flex';
        updateCurrentData(inputbox.value);
        updateHourlyForecast();
        inputbox.value = "";
        document.getElementById('list-autocomplete').innerHTML = "";
      }
    }
    else{
      const autocompleteapi = `https://api.weatherapi.com/v1/search.json?key=${key}&q=${inputbox.value}`;
      try{
        const searchresponse = await fetch(autocompleteapi);
        if(!searchresponse.ok){
          throw new Error(searchresponse.response);
        }
        const cities =  await searchresponse.json();
        data = cities.map((val,i) => (`<li tabindex="0"> ${val.name} ${val.region ? ', ' : '' }${val.region} </li>`))

        document.getElementById('list-autocomplete').innerHTML = data.join(" ");
        for(const option of document.getElementById('list-autocomplete').children){
          option.addEventListener('click',updateinput);
          option.addEventListener('keydown',function(event){if(event.key == "Enter") updateinput(this.innerText)});  
        }
      }
      catch(err){
        console.log(err);
      }
    }
  })
  
};
