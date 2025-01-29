window.onload = () => {
    console.log("Onload funtion running")
    window.localStorage.setItem('Location','Bengaluru')
    // document.getElementById('Location').innerText = window.localStorage.getItem('Location');
    const key = "7f275b4a47ef4dd3843155639252801";

    function getLocation() {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(showPosition,getDefaultLocation);
      } else {
          window.localStorage.setItem('Location',' Location 28.7041,77.1025')
        }
    }
    
    function getDefaultLocation(err) {
        console.log("Location Access Not Given")
        window.localStorage.setItem('Location'," Location 28.7041,77.1025")
    }

    function showPosition(position) {
        window.localStorage.setItem('Location',position.coords.latitude + "," + position.coords.longitude)
    }
    
    async function updateCurrentData(){
        const location = window.localStorage.getItem('Location');
        const url = `http://api.weatherapi.com/v1/current.json?key=${key}&q=${location ? location : '28.7041,77.1025'}&aqi=yes`
        try{
            const data = await fetch(url).
            then(response => {
                if(!response.ok){
                    throw new Error(response.status);
                }
                return response.json()
            })
            .catch((err)=>console.log(err));
            console.log(data);
            document.getElementById('details').innerHTML = `
            <h2>${data.location.name + ", " + data.location.region}</h2>
            <h4>${data.location.localtime}</h4>
            <h3>Weather : ${data.current.condition.text}<h3>
            <h3>Temp : ${data.current.temp_c}°C</h3>
            <h3>Feels: ${data.current.feelslike_c}°C </h3>

            `
            document.getElementById('body').style.backgroundImage = `url(./assets/${getWeatherFromCode(data.current.condition.code)}_bg.jpg)`
            document.getElementById('current-img').src = `./assets/${getWeatherFromCode(data.current.condition.code) + (data.current.is_day === 1 ? '' : '_night')}.png`
        }
        catch(err){
            console.log(err)
        }
    }

    function getWeatherFromCode(code){
        if(code<=1000){
            return 'sunny';
        }
        else if(code==1030){
            return 'foggy';
        }
        else if(code<=1117){
            return 'cloudy';
        }
        else if(code<=1171){
            return 'foggy';
        }
        else if(code<=1264){
            return 'rainy';
        }
        else{
            return 'thunder';
        }
    }

    function getDateFormat(date){
        return date.getFullYear() + '-' + (date.getMonth() + 1) + '-' + date.getDate();
    }

    async function updateHourlyForecast(){
        const location = window.localStorage.getItem('Location');
        const url = `http://api.weatherapi.com/v1/forecast.json?key=${key}&q=${location ? location : '28.7041,77.1025'}&days=4&aqi=yes&alerts=yes`;
        const today = new Date();
        let prevday = new Date();
        prevday.setDate(prevday.getDate()-3);
        

        const historyurl = `http://api.weatherapi.com/v1/history.json?key=${key}&q=${location ? location : '28.7041,77.1025'}&dt=${getDateFormat(prevday)}&end_dt=${getDateFormat(today)}`;
        
        const forecastResponse = await fetch(url)
        const forecastData = await forecastResponse.json()
        console.log({forecastData})
        

        const history = await fetch(historyurl).then((response)=>{
            if(!response.ok){
                throw new Error(response.status);
            }
            return response.json();
        })
        .catch((err)=>console.log(err));
        console.log(forecastData,history);
        const div = document.getElementById('hourly-forecast');
        const div2 = document.getElementById('forecast-history');
        const hourlydata = [];
        const dailydata = [];
        for(let i=0;i<3;i++){
            const d = history.forecast.forecastday[i];
            dailydata.push(`
                <div class="day">
            <div>
                <img src="./assets/${getWeatherFromCode(d.day.condition.code)}.png" width="100%" >
            </div>
            <div>
                <h2>${d.date}</h2>
                <h3>${d.day.condition.text}</h3>
                <h4>Max temp: ${d.day.maxtemp_c}°C</h4>
                <h5>Min temp: ${d.day.mintemp_c}°C</h5>
            </div>
        </div>
                `)
        }

        for(let i=Number(history.location.localtime.substring(11,13));i<24;i++){
            const hourdata = history.forecast.forecastday[0].hour[i];
            hourlydata.push(`
                <div class="hourly">
                    <div>
                        <img src="./assets/${getWeatherFromCode(hourdata.condition.code) + (hourdata.is_day === 1 ? '' : '_night')}.png" width="100%" >
                    </div>
                    <div>
                        <h2>${hourdata.time.substring(11,16)}</h2>
                        <h3>${hourdata.condition.text}</h3>
                        <h3>Temp : ${hourdata.temp_c}°C</h3>
                    </div>
                </div>
                `)
        }

        for(let i=0;i<4;i++){
            const d = forecastData.forecast.forecastday[i];
            dailydata.push(`
                <div class="day">
            <div>
                <img src="./assets/${getWeatherFromCode(d.day.condition.code)}.png" width="100%" >
            </div>
            <div>
                <h2>${d.date}</h2>
                <h3>${d.day.condition.text}</h3>
                <h4>Max temp: ${d.day.maxtemp_c}°C</h4>
                <h5>Min temp: ${d.day.mintemp_c}°C</h5>
            </div>
        </div>
                `)
        }
        div2.innerHTML = dailydata.join('');
        div.innerHTML = hourlydata.join('');

    }

    getLocation();
    updateCurrentData();
    updateHourlyForecast();
    const inputbox = document.getElementById('Location-box');
    inputbox.addEventListener('change',()=>{
        console.log(inputbox.value);
        window.localStorage.setItem('Location',inputbox.value);
        updateCurrentData();
        updateHourlyForecast();
    })
}