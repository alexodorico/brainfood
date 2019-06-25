/*
  TODO
  make function for saving to local storage?
  Error handling
  Handle book that don't have all data
  Add # of results
  Add buttons for next/previous page
  Implement favorites?
*/

import "../scss/styles.scss";

window.onload = fadeIn("results-area");

document.getElementById("search-button").addEventListener("click", handleSearch);
document.getElementById("search-bar").addEventListener("keyup", handleKeyUp);
document.getElementById("view-history").addEventListener("click", viewHistoryAll);
document.getElementById("results-area").addEventListener("click", viewHistoryItem);

// Get value of search bar
function getQuery() {
  return document.getElementById("search-bar").value;
}

// Searches for books if user hits enter
// Fix this, there's a better way
function handleKeyUp(event) {
  const query = getQuery();

  if (event.keyCode === 13 && query.length) {
    return getBooks(query);
  } else if (event.keyCode === 13) {
    return showError("Oops! Can't search for nothing.");
  }
}

// Search for books if user clicks search
function handleSearch() {
  const query = getQuery();

  if (query.length) {
    return getBooks(query);
  }

  return showError("Oops! Can't search for nothing.")
}

// Checks local storage for results. If none, make fetch data 
function getBooks(query) {
  const endpoint = `https://www.googleapis.com/books/v1/volumes?q=${query}`;
  const cachedResults = localStorage.getItem(endpoint) || false;

  if (cachedResults) {
    return render(query, JSON.parse(cachedResults));
  }

  return fetchData(query, endpoint);
}

function fetchData(query, endpoint) {
  return fetch(endpoint).then(response => {
    if (response.status === 200) {
      response
        .json()
        .then(data => {
          const simplifiedData = simplifyData(data.items);

          localStorage.setItem(endpoint, JSON.stringify(simplifiedData));
          manageHistory(query, data.totalItems);
          render(query, simplifiedData);
        })
        .catch(_ => {
          showError("Oops. Something went wrong, mind trying again in a sec?");
        });
    } else {
      showError("Oops. Something went wrong, mind trying again in a sec?");
    }
  });
}


function manageHistory(query, totalItems) {
  const history = JSON.parse(localStorage.getItem("history")) || false;
  const historyItem = {
    query,
    totalItems
  }

  if (history) {
    history.unshift(historyItem);
    localStorage.setItem("history", JSON.stringify(history));
  } else {
    localStorage.setItem("history", JSON.stringify(new Array(historyItem)));
  }
}

function viewHistoryAll() {
  const $results = document.getElementById("results");
  const history = JSON.parse(localStorage.getItem("history")) || false;

  $results.innerHTML = new String();
  if (history) {
    return history.forEach(historyItem => $results.insertAdjacentHTML("beforeend", createHistoryMarkup(historyItem.query)));
  }

  return $results.insertAdjacentHTML("beforeend", "<li><p class='text-primary'>Looks like you either haven't made any searches yet, or your browsing history was recently cleared!</p></li>");
}

function createHistoryMarkup(query) {
  return `
    <h1 class="history-item" data-query="${query}">${query}</h1>
  `
}

// This is repetitive... fix later
function viewHistoryItem(event) {
  if (event.target.classList.contains("history-item")) {
    const query = event.target.dataset.query;
    const endpoint = `https://www.googleapis.com/books/v1/volumes?q=${query}`;

    return render(query, JSON.parse(localStorage.getItem(endpoint)));
  }
}

// Simplify data structure and save space in local storage
function simplifyData(data) {
  return data.map(item => {
    const { id, volumeInfo: { authors, title, subtitle, infoLink }} = item;
    const { volumeInfo: { imageLinks: { thumbnail } = { thumbnail: false }}} = item;

    return {
      id,
      title,
      subtitle,
      authors,
      infoLink,
      thumbnail
    }
  });
}

// Creates HTML from book data
function createCardMarkup(bookData) {
  return `
    <li class="card-container shadow ${bookData.id || "hide"}" id="${bookData.id}">
      <h2 class="text-large text-bold ${bookData.title || "hide"}">${bookData.title}</h2>
      <h3 class="text-medium text-normal ${bookData.subtitle || "hide"}">${bookData.subtitle}</h3>
      <h4 class="text-small text-darker text-bold ${bookData.authors || "hide"}">${bookData.authors}</h4>
      <img class="cover-image lazy ${bookData.thumbnail || "hide"}" data-src="${bookData.thumbnail}" height="190" width="129" src="https://via.placeholder.com/129x190">
      <a class="button bg-success ${bookData.infoLink || "hide"}" href="${bookData.infoLink}" target="_blank">Learn More</a>
    </li>
  `
}

// Generate HTML and sets #results's contents to it
function render(query, bookData) {
  const $results = document.getElementById("results");
  const totalItems = getTotalResults(query);

  $results.innerHTML = new String();
  document.getElementById("results-count").innerHTML = `${totalItems} results for <span class="text-bold">${query}</span>`;
  bookData.forEach(book => $results.insertAdjacentHTML("beforeend", createCardMarkup(book)));
  lazyLoadSetup();
}

function getTotalResults(query) {
  const historyItems = JSON.parse(localStorage.getItem('history')) || false;

  for (const item of historyItems) {
    if (item.query === query) {
      return item.totalItems;
    }
  }
}

function lazyLoadSetup() {
  const lazyImages = document.querySelectorAll("img.lazy");

  if ("IntersectionObserver" in window) {
    const lazyImageObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          let lazyImage = entry.target;
          lazyImage.src = lazyImage.dataset.src;
          lazyImage.classList.remove("lazy");
          lazyImageObserver.unobserve(lazyImage);
        }
      });
    });

    lazyImages.forEach(lazyImage => {
      lazyImageObserver.observe(lazyImage);
    });
  }
}

function fadeIn(element) {
  document.getElementById(element).classList.add("show");
}

// Renders an error message
function showError(msg) {
  document.getElementById("alert").innerHTML = msg;
  document.getElementById("alert").classList.add("bg-danger");
  fadeIn("alert");
  setTimeout(_ => document.getElementById("alert").classList.remove("show"), 2000);
}
