import { fetchFromAPI ,getWeatherFromCode} from "./Utils.js";

window.onload = () => {

  /** Setting Default Location */
  window.localStorage.setItem("Location", "Bengaluru");

  /** Api Key */
  const key = "20f87a57f6184afc85653427252502";

  /** flag used to toggle daywise data in the UI */
  let showdata = false;

  let Hourlydata = [];

  /** Variable used to store Debounce TimeOut in the Search Function */
  let debounceTimeOut;

  /**
   * Gets Locations from the User using geolocation
   */
  function getLocation() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        updatePosition,
        getDefaultLocation
      );
    } else {
      window.localStorage.setItem("Location", " Location 28.7041,77.1025");
    }
  }

  /**
   * Updating the Location in LocalStoragae
   */
  function updatePosition(position) {
    window.localStorage.setItem(
      "Location",
      position.coords.latitude + "," + position.coords.longitude
    );
    updateCurrentData();
  }

  /**
   * Error Handling Function for geolocation.getCurrentPosition()
   * @param {Error} err - Error Returned by the geolocation.getCurrentPosition()
   */
  function getDefaultLocation(err) {
    console.log("Location Access Not Given");
    window.localStorage.setItem("Location", "Location 28.7041,77.1025");
    updateCurrentData();
  }

  /**
   * Toggles the Daywise data UI component
   */
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

  /**
   * Function that returns the HTML code for Current Component
   * @param {json} data - Response data of the current api
   * @returns {String} HTML code of the Current Component
   */
  function CurrentUIComponent(data){
    return `
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
            `
  }

  /**
   * Updates the Background image of the body according to the weather
   * @param {Number} code - Code representing the Weather Condition
   */
  function updateBackgroundImageOfBody(code){
    document.body.style.backgroundImage = `url(./assets/${getWeatherFromCode(
      code
    )}_bg-min.jpg)`;
  }

  /**
   * Updates the Current Weather Conditions into UI
   * @param {String} inputlocation - Location Given by the User
   */
  async function updateCurrentData(inputlocation) {
    if (inputlocation) {
      window.localStorage.setItem("InputLocation", inputlocation);
    }

    const location = inputlocation ? inputlocation : window.localStorage.getItem("Location");
    const url = `https://api.weatherapi.com/v1/current.json?key=${key}&q=${location ? location : "28.7041,77.1025"}&aqi=yes`;

    try {
      const data = await fetchFromAPI(url);
      window.localStorage.setItem("Location", location);
      document.getElementById("details").innerHTML = CurrentUIComponent(data);
      updateBackgroundImageOfBody(data.current.condition.code);
      document.getElementById("current-img").src = `./assets/${getWeatherFromCode(data.current.condition.code) +(data.current.is_day === 1 ? "" : "_night")}.png`;
      document.getElementById("toggler").addEventListener('click',toggledata);
      window.localStorage.setItem("Location",location);
      updateHistoryAndForecast();
    } catch (err) {
      console.log(err);
    }
  }

  /**
   * Formats the Date
   * @param {String} date 
   * @returns {String} - Formatted Date String
   */
  function getDateFormat(date) {
    return (
      date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate()
    );
  }

  /**
   * Updates the History and Forecast of Weather into the UI
   */
  async function updateHistoryAndForecast() {
    try {
      const location = window.localStorage.getItem("Location");
      console.log(location);
      const forecastUrl = `https://api.weatherapi.com/v1/forecast.json?key=${key}&q=${location ? location : "28.7041,77.1025"}&days=4&aqi=yes&alerts=yes`;
      
      const today = new Date();
      let prevday = new Date();
      prevday.setDate(prevday.getDate() - 3);

      const historyUrl = `https://api.weatherapi.com/v1/history.json?key=${key}&q=${location ? location : "28.7041,77.1025"}&dt=${getDateFormat(prevday)}&end_dt=${getDateFormat(today)}`;
      
      const [forecastResponse, historyResponse] = await Promise.all([
        fetch(forecastUrl),
        fetch(historyUrl),
      ]);

      const forecastData = await forecastResponse.json();
      const history = await historyResponse.json();
      const div = document.getElementById("hourly-forecast");
      const div2 = document.getElementById("forecast-history");

      
      //Worker For Processing HTML Component from the History and Forecast Reponse 
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
    } catch (err) {
      console.log(err);
    } finally{
      document.getElementById('loader').style.display = 'none'
    }
  }

  /**
   * Updates the Hourly data
   */
  function sethourlydata() {
    const textdata = document.getElementById("Hourly-text");
    const date = this.id;
    if (!date) return;
    const day = Number(this.getAttribute("day"));
    textdata.textContent = "Hourly ForeCast of " + date;
    const div = document.getElementById("hourly-forecast");
    div.innerHTML = Hourlydata[day].join("");
  }

  /**
   * Adds EventListeners for Every Day component
   */
  function setEvents() {
    const classNames = document.getElementsByClassName("day");
    Array.from(classNames).forEach(function (element) {
      element.addEventListener("click", sethourlydata);
    });
  }

  /**
   * Updates the Search with the clicked autocomplete field
   */
  async function searchLocation(){
    document.getElementById('list-autocomplete').innerHTML = "";
    document.getElementById('loader').style.display = 'flex';
    await updateCurrentData(this.innerText);
    inputbox.value = "";
    document.getElementById('list-autocomplete').innerHTML = "";
  }

  getLocation();
  // updateCurrentData();
  // updateHistoryAndForecast();

  const search = document.getElementById("search");
  const inputbox = document.getElementById("Location-box");

  //Event Listener for Search Button
  search.addEventListener("click", () => {
    if (inputbox.value.length > 2) {
      document.getElementById('loader').style.display = 'flex';
      updateCurrentData(inputbox.value);
      inputbox.value = "";
      document.getElementById('list-autocomplete').innerHTML = "";
    }
  });

  //Event Listener for Search Bar
  inputbox.addEventListener('keydown',async function(event){
    if(event.key == "Enter"){
      if (inputbox.value.length > 2) {
        document.getElementById('loader').style.display = 'flex';
        updateCurrentData(inputbox.value);
        inputbox.value = "";
        document.getElementById('list-autocomplete').innerHTML = "";
      }
    }
    else if(event.key!=='Tab'){
      clearTimeout(debounceTimeOut);
      debounceTimeOut = setTimeout(async ()=>{
        const autocompleteapi = `https://api.weatherapi.com/v1/search.json?key=${key}&q=${inputbox.value}`;
        try{
          const searchresponse = await fetch(autocompleteapi);
          if(!searchresponse.ok){
            throw new Error(searchresponse.response);
          }
          const cities =  await searchresponse.json();
          const data = cities.map((val,i) => (`<li tabindex="0"> ${val.name} ${val.region ? ', ' : '' }${val.region} </li>`))
          const list = document.getElementById('list-autocomplete');
          list.innerHTML = data.join(" ");
          for(const option of document.getElementById('list-autocomplete').children){
            option.addEventListener('click',searchLocation);
            option.addEventListener('keydown',(event)=>{if(event.key == "Enter"){
              searchLocation.bind(option)();
            }});  
          }
        }
        catch(err){
          console.log(err);
        }
      },500)
    }
  })
  
};
