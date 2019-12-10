'use strict';

/* imports */
import * as $ from 'jquery';
import Chart from 'chart.js';
import './styles/styles.scss';
import {formatQueryParams} from './js/utils'
import {singleMarketPortfolio} from './js/singleMarketPortfolio.js';

/* jquery selectors */
const $document = $(document);
const $window = $(window);
const $body = $('body');
const $html = $('html');
const $header = $('header');
const $nav = $('nav');
const $appForm = $('#app-form');
const $appResults = $('#app-results');
const $hodlAlternative = $('#hodl-alternative');
const $socialProof = $('#social-proof');
const $callToAction = $('#call-to-action');
const $results = $('#results');
const $navGetStartedButton = $('#nav-get-started-button');
const $getStartedButton = $('.get-started-button');
const $starterStrategyButton = $('.starter-strategy-button');
const $strategyForm = $('#strategy-form');
const $symbol = $('#symbol');
const $lookback = $('#lookback');
const $volatility = $('#volatility');
const $leverage = $('#leverage');
const $shorting = $('#shorting');
const $message = $('#message');
const $currentPosition = $('#current-position');
const $allocationChart = $('#allocation-chart');
const $backtestChart = $('#backtest-chart');

/* writes the trend following strategy results to DOM */
function displayResults(symbol, strategyData) {
  $currentPosition.empty();
  $allocationChart.empty();
  $backtestChart.empty();
  $message.empty();

  const dates = strategyData.dates;
  const benchmark = strategyData.totalReturns;
  const strategy = strategyData.rangeScaledTotalReturns;
  const position = strategyData.position;
  const closes = strategyData.closes;

  const positionSize = Math.round(((1000 * position / closes[closes.length-1])) * 100) /100;
  
  //
  $currentPosition.html('For a $10000 account, you should own ' + positionSize + "" + symbol);

  //
  const allocationCtx = $allocationChart;
  const allocationChart = new Chart(allocationCtx, {
    type: 'pie',
    data: {
      datasets: [{
        data: [position, (1-position)],
        backgroundColor: [
          "#0000ff",
          "#000000"
        ],
      }],
      // These labels appear in the legend and in the tooltips when hovering different arcs
      labels: [
          'crypto',
          'USD',
      ]
    },
  });

  //
  const backtestCtx = $backtestChart;
  const backtestChart = new Chart(backtestCtx, {
      type: 'line',
      data: {
          labels: dates,
          datasets: [{
            label: 'Benchmark',
            backgroundColor: 'black',
            borderColor: 'black',
            data: benchmark,
            fill: false,
          }, {
            label: 'Strategy',
            fill: false,
            backgroundColor: 'blue',
            borderColor: 'blue',
            data: strategy,
          }]
      },
      options: {
          scales: {
              yAxes: [{
                  ticks: {
                      beginAtZero: true
                  },
                  type: 'linear',
              }]
          }
      }
  });
}

/* transforms api data into input for trend following strategy */
function mungeData(responseJSON) {
  let extractedData = responseJSON['Time Series (Digital Currency Daily)'];
  console.log(responseJSON);

  const dates = [];
  const closes = [];

  for (const record in extractedData) {
    dates.push(record),
    closes.push(extractedData[record]['4a. close (USD)'])
  }
  return [dates, closes];
}

/* fetches data from Alphavantage api */
async function fetchData(symbol, lookback, volatility, leverage, shorting) {
  const apiKey = 'CFJ6KI5OO7G7X6QA';
  const searchURL = 'https://www.alphavantage.co/query';
  const params = {
    function: 'DIGITAL_CURRENCY_DAILY',
    symbol: symbol,
    market: 'USD',
    apikey: apiKey,
    datatype: 'json',
  };
  const queryString = formatQueryParams(params)
  const url = searchURL + '?' + queryString;
  //const url = ('test/dailyBTC.json');
  
  console.log(url);

  try {
    const response = await fetch(url);
    if (response.ok) {
      const responseJSON = response.json();
      return responseJSON;
    }
    throw new Error(response.statusText);
  } catch (error) {
    $message.html(`Something went wrong: ${error.message}`);
  }
}

/* handles submit events */
async function submitHandler (event) {
  console.log('running submithandler'); 
  event.preventDefault();
  
  /* check to make sure the form is correct */
  if ($(event.target).attr('id') !== 'strategy-form') return;

  /* notify the user with loading message */
  $message.text(`Loading. Please wait.`);
  
  /* get form inputs and do fallback form validation */
  const symbol = $symbol.val();
  if (!symbol || symbol.length < 1) return;

  const lookback = parseInt($lookback.val());
  if (!lookback || lookback.length < 1) return;

  const volatility = Number($volatility.val());
  if (!volatility  || volatility.length < 1) return;

  const leverage = parseInt($leverage.val());
  if (!leverage || leverage.length < 1) return;

  const shorting = $shorting.is(':checked');
  if (shorting.length < 1) return;

  /* fetch the api data */
  const responseJSON = await fetchData(symbol, lookback, volatility, leverage, shorting);

  /* Munge the api data */
  const [dates, closes] = mungeData(responseJSON);
  
  /* Calculate the strategy data */
  const strategyData = singleMarketPortfolio(dates, closes, lookback, volatility, leverage, shorting);

  /* Display the strategy data */
  displayResults(symbol, strategyData);

};

/* handles click events */
async function clickHandler (event) {
  event.preventDefault();

  if ($(this).hasClass('get-started-button')) {
    /* hide splash content */
    $header.addClass('hidden');
    $hodlAlternative.addClass('hidden');
    $socialProof.addClass('hidden');
    $callToAction.addClass('hidden');
    $results.addClass('hidden');
    $navGetStartedButton.addClass('hidden');

    /* unhide app content */
    $nav.removeClass('hidden');
    $appForm.removeClass('hidden');
    $appResults.removeClass('hidden');

    $nav.find('.container').removeClass('container').addClass('fluid-container');
    $html.animate(
      {
        scrollTop: 0,
      },
      500,
      'linear'
    );
    return;
  }

  if($(this).hasClass('starter-strategy-button')) {
        //get form inputs and do fallback form validation
    const symbol = $symbol.val();
    const lookback = 260;
    const volatility = .65;
    const leverage = 1;
    const shorting = false;

    //debug logs
    console.log('form values:', symbol, lookback, volatility, leverage, shorting );

    // Fetch the api data
    const responseJSON = await fetchData(symbol, lookback, volatility, leverage, shorting);

    // Munge the api data
    const [dates, closes] = mungeData(responseJSON);
    
    // Calculate the strategy data
    const strategyData = singleMarketPortfolio(dates, closes, lookback, volatility, leverage, shorting);

    //console.log(strategyData);

    // Display the strategy data
    displayResults(symbol, strategyData);
  }
};

/* handles scroll events */
function scrollHandler (event) {
  if ($window.scrollTop() > $('header').height()) {
    $nav.removeClass('hidden');
  } else {
    $nav.addClass('hidden');
  }
}

/* attach event listeners on document ready */
$(function() {
  $document.on("scroll", scrollHandler);
  $getStartedButton.on('click', clickHandler);
  $starterStrategyButton.on('click', clickHandler);
  $strategyForm.on('submit', submitHandler);
});