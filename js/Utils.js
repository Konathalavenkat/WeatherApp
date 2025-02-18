
/**
 * Utility Function that fetches the data from api
 * @param {String} url - Url of the API
 * @returns {json} - data of the api response
 */
export async function fetchFromAPI(url){
    try{
        const response = await fetch(url);
        if(!response.ok){
            throw new Error(response);
        }
        const data = await response.json();
        return data;
    }
    catch(err){
        console.log("Error fetching data:",err);
        throw err;
    }
}


/**
 * Function that returns Generalized Weather name from condition code
 * @param {Number} code - code Representing the Weather Condition
 * @returns {String} - generalized weather name
 */
export function getWeatherFromCode(code) {
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