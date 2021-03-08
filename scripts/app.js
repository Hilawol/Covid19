// const statApiBase = "http://corona-api.com/countries/";
const covidApiBase = "http://corona-api.com/countries/";
const proxy = "https://thingproxy.freeboard.io/fetch/";
// "https://cors-anywhere.herokuapp.com/";
// "http://alloworigin.com/get?url=";
// "https://thingproxy.freeboard.io/fetch/";
// "http://alloworigin.com/get?url=";




const STATISTIC_TYPES = [{ type: "total_cases", str: "Confirmed Cases" },
{ type: "total_deaths", str: "Total Deaths" },
{ type: "total_recovered", str: "Total Recovered" },
{ type: "total_critical", str: "Critical Condition" }];
const continentBtns = document.querySelectorAll(".continent");
const statTypeBtn = document.querySelectorAll(".statType");
const countriesDDList = document.querySelector("#countries");
const ctx = document.querySelector("#chart");
const spinner = document.querySelector(".spinner");


continentBtns.forEach(btn => btn.addEventListener("click", continentClick));
statTypeBtn.forEach(btn => btn.addEventListener("click", statTypeClick));

// SETUP 
const continents = [];
let selectedRegion = "africa";
let selectedStat = "total_cases";
setSelected(selectedStat, "stat");
displayContinent(selectedRegion);



class Continent {

  constructor(name, countries) {
    this.name = name;
    this.countries = countries;
    // this.currentStat = 
  }

  getCountryCode(code) {
    return this.countries.find(country => country.code);
  }

  getCountriesNames() {
    return this.countries.map(country => country.name);
  }

  getContinentStat(dataType) {
    return this.countries.map(country => {
      if (country.covidData) {
        return country.covidData[dataType];
      }
      else return 0;
    });
  }
}

function setSelected(value, type) {
  console.log(`setselected:value:${value},type:${type}`);
  let c = ""; //class to add
  if (type === "continent") {
    selectedRegion = value;
    c = "selectedRegion";
  }
  else {
    selectedStat = value;
    c = "selectedStat";
  }
  const element = document.querySelector(`#${value}`);
  const prevSelected = document.querySelector(`.${c}`);
  if (prevSelected) {
    prevSelected.classList.remove(c);
  }
  element.classList.add(c);
}

function continentClick(event) {
  const name = event.currentTarget.id;
  displayContinent(name);
}

async function statTypeClick(event) {
  const id = event.currentTarget.id;
  setSelected(id, "stat");
  let continent = continents.find(c => c.name === selectedRegion);
  debugger
  await generateGraph(continent, id);
}

async function displayContinent(continentName) {
  setSelected(continentName, "continent");
  let continent = continents.find(c => c.name === continentName);
  spinner.classList.add("loading");
  if (!continent) {
    const continentData = await fetchContinent(continentName);
    continent = setContinentData(continentName, continentData);
  }
  setCountriesList(continent.countries);
  const continentCovidData = await fetchContinentCovidData(continent);
  generateGraph(continent, selectedStat);
  spinner.classList.remove("loading");
}

/**
 * Function returns all countreis data of selected continent 
 * @param {String} continent - continent name to fetch
 */
async function fetchContinent(continent) {
  const countriesApiBase = "https://restcountries.herokuapp.com/api/v1/region/";
  const response = await fetch(countriesApiBase + continent);
  const continentData = await response.json();
  return continentData;
};

function setContinentData(name, continentData) {
  const countries = continentData.map(country => { return { name: country.name.common, code: country.cca2, }; });
  const c = new Continent(name, countries);
  continents.push(c);
  return c;
}

/**
 * Function sets the countries drop down list options for the selected continent
 * @param {Continent} continent 
 */
function setCountriesList(countries) {
  countriesDDList.innerHTML = `<option value="">-- Select a country --</option>`;
  countriesDDList.style.display = "block";
  (countries).forEach(country => {
    const op = document.createElement("option");
    op.value = country.name;
    op.textContent = country.name;
    countriesDDList.appendChild(op);
  })
}

// async function getCountryStats(countryCode) {
//   const response = await fetch(proxy + statApiBase + countryCode);
//   const data = await response.json();
//   return data;
// };





async function fetchContinentCovidData(continent) {
  const covidApiBase = "http://corona-api.com/countries/";
  for (let i = 0; i < continent.countries.length; i++) {
    const response = await fetch(covidApiBase + continent.countries[i].code);
    if (response.status === 200) { //If response other then 200 - no covid data will be available
      const continentCovidData = await response.json();
      const covidData = {
        total_cases: continentCovidData.data.latest_data.confirmed,
        total_deaths: continentCovidData.data.latest_data.deaths,
        total_recovered: continentCovidData.data.latest_data.recovered,
        total_critical: continentCovidData.data.latest_data.critical,
        new_cases: continentCovidData.data.today.confirmed,
        new_deaths: continentCovidData.data.today.deaths,
      }
      continent.countries[i].covidData = covidData;
    }
  }
  console.log(continent);
}

const generateGraph = (continent, dataType) => {
  ctx.innerHTML = "";
  const lables = continent.getCountriesNames();
  const data = continent.getContinentStat(dataType);
  const chart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: lables,
      datasets: [{
        label: dataType,
        data: data,
        backgroundColor: ['rgba(54, 162, 235, 0.2)'],
        borderColor: ['rgba(54, 162, 235, 1)',],
        borderWidth: 1
      }]
    },
    options: {
      events: ['click'],
      scales: {
        xAxes: [{
          ticks: {
            beginAtZero: true,
            autoSkip: false,
          }
        }]
      }
    }
  });
};


