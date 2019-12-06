'use strict';

// helper formatting function for fetch
function formatQueryParams(params) {
  const queryItems = Object.keys(params)
    .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
  return queryItems.join('&');
}

// writes the trend following strategy results to DOM
function displayResults(symbol, strategyData) {
  //
  const dates = strategyData.dates;
  const benchmark = strategyData.totalReturns;
  const strategy = strategyData.rangeScaledTotalReturns;
  const position = strategyData.position;
  const closes = strategyData.closes;

  const positionSize = Math.round(((1000 * position / closes[closes.length-1])) * 100) /100;
  
  //
  $('#current-position').html('For a $10000 account, you should own ' + positionSize + "" + symbol);

  //
  const allocationCtx = $('#allocation-chart');
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
  const backtestCtx = $('#backtest-chart');
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

// transforms api data into input for trend following strategy 
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

// fetches data from Alphavantage api
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
    $('#js-error-message').text(`Something went wrong: ${error.message}`);
  }
}

// handles submit events
async function submitHandler (event) { 
  console.log('hi');
  //prevent the form submit to the server
  event.preventDefault();
  
  //check to make sure the form is correct
  if ($(event.target).attr('id') !== 'strategy-form') return;

  console.log('correct form');
  
  //get form inputs and do fallback form validation
  const symbol = $('#symbol').val();
  if (!symbol || symbol.length < 1) return;

  const lookback = parseInt($('#lookback').val());
  if (!lookback || lookback.length < 1) return;

  const volatility = Number($('#volatility').val());
  if (!volatility  || volatility.length < 1) return;

  const leverage = parseInt($('#leverage').val());
  if (!leverage || leverage.length < 1) return;

  const shorting = $('#shorting').is(':checked');
  if (shorting.length < 1) return;

  //debug logs
  console.log('form values:', symbol, lookback, volatility, leverage, shorting );

  // Fetch the api data
  const responseJSON = await fetchData(symbol, lookback, volatility, leverage, shorting);

  // Munge the api data
  const [dates, closes] = mungeData(responseJSON);
  
  // Calculate the strategy data
  const strategyData = calcStrategy(dates, closes, lookback, volatility, leverage, shorting);

  //console.log(strategyData);

  // Display the strategy data
  displayResults(symbol, strategyData);
};

// handles click events
async function clickHandler (event) {
  event.preventDefault();
  const currentTarget = $(this);

  if (currentTarget.hasClass('get-started-button')) {
    event.preventDefault();
    //hide splash content
    $('#header').toggleClass('hidden');
    $('#hodl-alternative').toggleClass('hidden');
    $('#social-proof').toggleClass('hidden');
    $('#call-to-action').toggleClass('hidden');
    $('#results').toggleClass('hidden');
    $('#nav-get-started-button').addClass('hidden');

    //unhide app content
    $('#nav').removeClass('hidden');
    $('#app-form').toggleClass('hidden');
    $('#app-results').toggleClass('hidden');

    $('#nav').find('.container').removeClass('container').addClass('fluid-container');
    console.log($('body'))
    $('html, body').animate(
      {
        scrollTop: 0,
      },
      500,
      'linear'
    )
    return;
  }

  if(currentTarget.hasClass('starter-strategy-button')) {
        //get form inputs and do fallback form validation
    const symbol = $('#symbol').val();
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
    const strategyData = calcStrategy(dates, closes, lookback, volatility, leverage, shorting);

    //console.log(strategyData);

    // Display the strategy data
    displayResults(symbol, strategyData);
  }
};

function scrollHandler (event) {
  if ($(window).scrollTop() > 5) {
    //$("nav").css('height', '50px');
  } else {
    //$("nav").css('height', '50px');
  }

  if ($(window).scrollTop() > $('header').height()) {
    //$('nav').css('background-color', 'blue');
    $('#nav').removeClass('hidden');
  } else {
    //$('nav').css('background-color', 'blue');
    $('#nav').addClass('hidden');
  }
}

// attach event listeners on document ready
$(function() {
  $(window).scroll(scrollHandler);
  $('.get-started-button, .starter-strategy-button').click(clickHandler);
  $('#strategy-form').submit(submitHandler);
});