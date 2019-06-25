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

document.getElementById("search-btn").addEventListener("click", handleSearch);
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

  return
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

  manageHistory(query);

  if (cachedResults) {
    return render(JSON.parse(cachedResults));
  }

  return fetchData(endpoint);
}

function fetchData(endpoint) {
  return fetch(endpoint).then(response => {
    if (response.status === 200) {
      response
        .json()
        .then(data => {
          const simplifiedData = simplifyData(data.items);
          render(simplifiedData);
          localStorage.setItem(endpoint, JSON.stringify(simplifiedData));
        })
        .catch(_ => {
          showError("Oops. Something went wrong, mind trying again in a sec?");
        });
    } else {
      showError("Oops. Something went wrong, mind trying again in a sec?");
    }
  });
}


function manageHistory(query) {
  const history = JSON.parse(localStorage.getItem("history")) || false;

  if (history) {
    history.unshift(query);
    localStorage.setItem("history", JSON.stringify(history));
  } else {
    localStorage.setItem("history", JSON.stringify(new Array(query)));
  }
}

function viewHistoryAll() {
  const $results = document.getElementById("results");
  const history = JSON.parse(localStorage.getItem("history")) || false;

  $results.innerHTML = new String();
  if (history) {
    return history.forEach(query => $results.insertAdjacentHTML("beforeend", createHistoryMarkup(query)));
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
    return render(JSON.parse(localStorage.getItem(endpoint)));
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
    <li class="card-container shadow" id="${bookData.id}">
      <h2 class="text-large text-bold">${bookData.title}</h2>
      <h3 class="text-medium text-normal">${bookData.subtitle}</h3>
      <h4 class="text-small text-darker text-bold">${bookData.authors}</h4>
      <img class="cover-image lazy" data-src="${bookData.thumbnail}" height="190" width="129" src="https://via.placeholder.com/129x190">
      <a class="button bg-success" href="${bookData.infoLink}" target="_blank">Learn More</a>
    </li>
  `
}

// Generate HTML and sets #results's contents to it
function render(bookData) {
  const $results = document.getElementById("results");
  $results.innerHTML = new String();
  bookData.forEach(book => $results.insertAdjacentHTML("beforeend", createCardMarkup(book)));
  lazyLoadSetup();
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

// Renders an error message
function showError(msg) {
  const html = `<li><p class="text-danger">${msg}</p></li>`;
  document.querySelector("#results").innerHTML = html;
}
