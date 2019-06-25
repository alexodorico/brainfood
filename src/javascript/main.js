import '../scss/styles.scss';
/*
  TODO
  make function for saving to local storage?
*/
document.getElementById("search-btn").addEventListener("click", searchForBooks);
document.getElementById("view-history").addEventListener("click", viewHistoryAll);
document.getElementById("results-area").addEventListener("click", viewHistoryItem)

// Searches for books and returns a promise that resolves a JSON list
function searchForBooks() {
  const query = document.getElementById("search-bar").value;
  const endpoint = `https://www.googleapis.com/books/v1/volumes?q=${query}`;
  const cachedResults = localStorage.getItem(endpoint) || false;

  manageHistory(query);

  if (cachedResults) {
    return render(JSON.parse(cachedResults));
  }

  return fetch(endpoint).then(response => {
    if (response.status === 200) {
      response.json().then(data => {
        const simplifiedData = simplifyData(data.items);
        render(simplifiedData);
        localStorage.setItem(endpoint, JSON.stringify(simplifiedData));
      });
    }
  });
}

function manageHistory(query) {
  const history = JSON.parse(localStorage.getItem('history')) || false;

  if (history) {
    history.unshift(query);
    localStorage.setItem('history', JSON.stringify(history));
  } else {
    localStorage.setItem('history', JSON.stringify(new Array(query)));
  }
}

function viewHistoryAll() {
  const $results = document.getElementById("results");
  const history = JSON.parse(localStorage.getItem('history')) || false;

  $results.innerHTML = new String();
  history.forEach(query => $results.insertAdjacentHTML("beforeend", createHistoryMarkup(query)));
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

  if ('IntersectionObserver' in window) {
    const lazyImageObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          console.log('is intersecting');
          let lazyImage = entry.target;
          lazyImage.src = lazyImage.dataset.src;
          lazyImage.classList.remove('lazy');
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
  const html = `<li><p class="error">${msg}</p></li>`;
  document.querySelector('#results').innerHTML = html;
}
