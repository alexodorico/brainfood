import "../scss/styles.scss";

(_=> {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("../../serviceworker.js")
      .then(registration => {
        console.log("Service worker registration successful:", registration.scope);
      })
      .catch(error => {
        console.log("Service worker registration failed: ", error);
      });
  }

  /*
    Add shadow to sticky header if user scrolls more than 20px
  */
  window.addEventListener("scroll", e => {
    if (window.scrollY > 20) {
      getById("sticky").classList.add("bottom-shadow");
    } else {
      getById("sticky").classList.remove("bottom-shadow");
    }
  });

  getById("search-button").addEventListener("click", handleSearch);
  getById("search-bar").addEventListener("keyup", handleSearch);
  getById("view-history").addEventListener("click", viewHistoryAll);
  getById("results-area").addEventListener("click", viewHistoryItem);
})();

/*
  1. If empty search, display error
  2. If user clicks on search icon or hits enter, initiate search
  The "else if" prevents error from being displayed if the user
  hits backspace on final character or an empty search bar
*/
function handleSearch(e) {
  const query = getById("search-bar").value;

  if (query) {
    if (event.type === "click" || event.keyCode === 13) {
      rotateIcon();
      scrollToTop();
      getBooks(query);
    }
    return;
  } else if (event.keyCode === 8) {
    return;
  }
  return showError("Oops! Can't search for nothing.");
}

/*
  Checks local storage for results before making API call
*/
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
            handleSuccessfulFetch(data, endpoint, query, offset);
          })
          .catch(_ => {
            showError("Oops. Something went wrong, mind trying again in a sec?");
          });
      } else {
        showError("Oops. Something went wrong, mind trying again in a sec?");
      }
  })

  // If there's a fetch error, the user is probably offline
  .catch(_ => {
    showError("Sorry, we can't get new books while you're offline!");
  })
}

function handleSuccessfulFetch(data, endpoint, query, offset = 0) {
  const simplifiedData = simplifyData(data.items);

  localStorage.setItem(endpoint, JSON.stringify(simplifiedData));
  manageHistory(query, data.totalItems, offset);
  render(query, simplifiedData, offset);
}

/*
  Simplifies data structure to minimize space in local storage
  Returns array of objects
*/
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

/*
  Generates markup for buttons, cards, and results count
*/
function render(query, bookData, offset = 0) {
  const $results = getById("results");
  const totalItems = getTotalResults(query);

  destroyHTML("results");
  getById("results-count").innerHTML = `${totalItems} results for <span class="text-bold">${query}</span>`;
  bookData.forEach(book => $results.insertAdjacentHTML("beforeend", createCardMarkup(book)));
  buttonSetup(query, offset);
  lazyLoadSetup();
}

/*
  Updates history in local storage. If there's no history, history is created
*/
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

/*
  Handles "Search History" click
*/
function viewHistoryAll() {
  const $results = getById("results");
  const history = JSON.parse(localStorage.getItem("history")) || false;

  destroyHTML("results");
  destroyHTML("button-container");
  destroyHTML("results-count");
  
  if (history) {
    $results.innerHTML = "<h2 style='margin-bottom: 0.5em;'>Recent Searches</h2>";
    return history.forEach(historyItem => $results.insertAdjacentHTML("beforeend", createHistoryMarkup(historyItem.query)));
  }

  return $results.insertAdjacentHTML("beforeend", "<li><p class='init-text text-large'>Looks like you haven't made any searches yet!</p></li>");
}

/*
  Handles history item click
*/
function viewHistoryItem(event) {
  if (event.target.classList.contains("history-item")) {
    const query = event.target.dataset.query;
    const endpoint = `https://www.googleapis.com/books/v1/volumes?q=${query}&startIndex=0`;

    return render(query, JSON.parse(localStorage.getItem(endpoint)));
  }
}

/*
  Handles next/previous button clicks
*/
function changePage(event) {
  const query = event.target.dataset.query;
  const offset = event.target.dataset.offset;

  destroyHTML("results");
  destroyHTML("results-count");
  destroyHTML("button-container");
  rotateIcon();
  scrollToTop();
  getBooks(query, offset);
}

function getTotalResults(query) {
  const historyItems = JSON.parse(localStorage.getItem("history")) || false;

  for (const item of historyItems) {
    if (item.query === query) {
      return item.totalItems;
    }
  }
}

function buttonSetup(query, offset) {
  let markup = `
    <button
      class="bg-primary shadow"
      data-offset="${Number(offset) + 10}"
      data-query="${query}"
      id="next-button"
      >Next
    </button>`;

  if (Number(offset) > 0) {
    markup = `
      <button
        class="bg-primary shadow"
        data-offset="${Number(offset) - 10}"
        data-query="${query}"
        id="previous-button"
        >Previous</button>` + markup;
  }

  getById("button-container").innerHTML = markup;
  getById("next-button").addEventListener("click", changePage);

  if (Number(offset) > 0) {
    getById("previous-button").addEventListener("click", changePage);
  }
}

// Creates HTML from book data
function createCardMarkup(bookData) {
  return `
    <li class="card-container shadow ${bookData.id || "hide"}" id="${bookData.id}">
      <div class="book-info">
        <h2 class="text-large text-bold ${bookData.title || "hide"}">${bookData.title}</h2>
        <h3 class="text-medium text-normal ${bookData.subtitle || "hide"}">${bookData.subtitle}</h3>
        <h4 class="text-small text-darker text-bold ${bookData.authors || "hide"}">${bookData.authors}</h4>
      </div>
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
  getById("alert").innerHTML = msg;
  getById("alert").classList.add("show");
  setTimeout(_ => getById("alert").classList.remove("show"), 2000);
}

function destroyHTML(id) {
  getById(id).innerHTML = new String();
}

function rotateIcon() {
  getById("search-icon").classList.add("rotate");
  setTimeout(_=> getById("search-icon").classList.remove("rotate"), 2000);
}

function scrollToTop() {
  document.body.scrollTop = document.documentElement.scrollTop = 0;
}

function getById(id) {
  return document.getElementById(id);
}
