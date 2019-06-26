import "../scss/styles.scss";

(_=> {
  window.onload = fadeIn("results-area");

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("../../serviceworker.js")
      .then(registration => {
        console.log("Service worker registration successful:", registration.scope);
      })
      .catch(error => {
        console.log("Service worker registration failed: ", error);
      });
  }

  document.getElementById("search-button").addEventListener("click", handleSearch);
  document.getElementById("search-bar").addEventListener("keyup", handleKeyUp);
  document.getElementById("view-history").addEventListener("click", viewHistoryAll);
  document.getElementById("results-area").addEventListener("click", viewHistoryItem);
})();

// Get value of search bar
function getQuery() {
  return document.getElementById("search-bar").value;
}

// Searches for books if user hits enter
function handleKeyUp(event) {
  const query = getQuery();

  if (event.keyCode === 13 && query.length) {
    return getBooks(query);
  } else if (event.keyCode === 13) {
    return showError("Oops! Can't search for nothing.");
  }
}

// Search for books if user clicks search icon
function handleSearch() {
  const query = getQuery();

  if (query.length) {
    return getBooks(query);
  }

  return showError("Oops! Can't search for nothing.");
}

// Checks local storage for results. If none, fetchs data 
function getBooks(query, offset = 0) {
  const endpoint = `https://www.googleapis.com/books/v1/volumes?q=${query}&startIndex=${offset}`;
  const cachedResults = localStorage.getItem(endpoint) || false;

  if (cachedResults) {
    return render(query, JSON.parse(cachedResults), offset);
  }

  return fetchData(query, endpoint, offset);
}

function fetchData(query, endpoint, offset = 0) {
  return fetch(endpoint)
    .then(response => {
      if (response.status === 200) {
        response
          .json()
          .then(data => {
            const simplifiedData = simplifyData(data.items);
            localStorage.setItem(endpoint, JSON.stringify(simplifiedData));
            manageHistory(query, data.totalItems, offset);
            render(query, simplifiedData, offset);
          })
          .catch(_ => {
            showError("Oops. Something went wrong, mind trying again in a sec?");
          });
      } else {
        showError("Oops. Something went wrong, mind trying again in a sec?");
      }
  })
  .catch(_ => {
    showError("Sorry, we can't get new books while you're offline!");
  })
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

// Generates HTML for buttons, cards, and result count
function render(query, bookData, offset = 0) {
  const $results = document.getElementById("results");
  const totalItems = getTotalResults(query);

  DESTROYHTML("results");
  document.getElementById("results-count").innerHTML = `${totalItems} results for <span class="text-bold">${query}</span>`;
  bookData.forEach(book => $results.insertAdjacentHTML("beforeend", createCardMarkup(book)));
  buttonSetup(query, offset);
  lazyLoadSetup();
}

// Updates history in local storage. If there's no history, creates history
function manageHistory(query, totalItems, offset = 0) {

  // If there's an offset, no need to add duplicate entry in history
  if (offset > 0) return 

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

// Handles "View Search History" click
function viewHistoryAll() {
  const $results = document.getElementById("results");
  const history = JSON.parse(localStorage.getItem("history")) || false;

  DESTROYHTML("results");
  DESTROYHTML("button-container");
  DESTROYHTML("results-count");
  
  if (history) {
    return history.forEach(historyItem => $results.insertAdjacentHTML("beforeend", createHistoryMarkup(historyItem.query)));
  }

  return $results.insertAdjacentHTML("beforeend", "<li><p class='text-primary'>Looks like you haven't made any searches yet!</p></li>");
}

// Handles history item click
function viewHistoryItem(event) {
  if (event.target.classList.contains("history-item")) {
    const query = event.target.dataset.query;
    const endpoint = `https://www.googleapis.com/books/v1/volumes?q=${query}&startIndex=0`;

    return render(query, JSON.parse(localStorage.getItem(endpoint)));
  }
}

// Handler for next/previous button clicks
function changePage(event) {
  const query = event.target.dataset.query;
  const offset = event.target.dataset.offset;
  DESTROYHTML("results");
  DESTROYHTML("results-count");
  DESTROYHTML("button-container");
  getBooks(query, offset);
  document.body.scrollTop = document.documentElement.scrollTop = 0;
}

function getTotalResults(query) {
  const historyItems = JSON.parse(localStorage.getItem('history')) || false;

  for (const item of historyItems) {
    if (item.query === query) {
      return item.totalItems;
    }
  }
}

function buttonSetup(query, offset) {
  let markup = `
    <button
      class="bg-primary"
      data-offset="${Number(offset) + 10}"
      data-query="${query}"
      id="next-button"
      >Next
    </button>`;

  if (Number(offset) > 0) {
    markup = `
      <button
        class="bg-primary"
        data-offset="${Number(offset) - 10}"
        data-query="${query}"
        id="previous-button"
        >Previous</button>` + markup;
  }

  document.getElementById("button-container").innerHTML = markup;
  document.getElementById("next-button").addEventListener("click", changePage);

  if (Number(offset) > 0) {
    document.getElementById("previous-button").addEventListener("click", changePage);
  }
}

// Creates HTML from book data
function createCardMarkup(bookData) {
  return `
    <li class="card-container shadow ${bookData.id || "hide"}" id="${bookData.id}">
      <h2 class="text-large text-bold ${bookData.title || "hide"}">${bookData.title}</h2>
      <h3 class="text-medium text-normal ${bookData.subtitle || "hide"}">${bookData.subtitle}</h3>
      <h4 class="text-small text-darker text-bold ${bookData.authors || "hide"}">${bookData.authors}</h4>
      <img class="cover-image lazy ${bookData.thumbnail || "hide"}" data-src="${bookData.thumbnail}" height="190" width="129" src="https://via.placeholder.com/129x190">
      <a class="button bg-success shadow ${bookData.infoLink || "hide"}" href="${bookData.infoLink}" target="_blank">Learn More</a>
    </li>
  `
}

function createHistoryMarkup(query) {
  return `
    <li class="history-item card-container shadow" data-query="${query}">${query}</li>
  `
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
  const $alert = document.getElementById("alert");
  $alert.innerHTML = msg;
  $alert.classList.add("bg-danger");
  fadeIn("alert");
  setTimeout(_ => $alert.classList.remove("show"), 2000);
}

function fadeIn(element) {
  document.getElementById(element).classList.add("show");
}

// ...please take me seriously
function DESTROYHTML(id) {
  document.getElementById(id).innerHTML = new String();
}
