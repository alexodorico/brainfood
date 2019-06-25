import '../scss/styles.scss';

document.getElementById("search-btn").addEventListener("click", searchForBooks);

// Searches for books and returns a promise that resolves a JSON list
function searchForBooks() {
  const query = document.getElementById("search-bar").value;
  const endpoint = `https://www.googleapis.com/books/v1/volumes?q=${query}`;
  const cachedResults = localStorage.getItem(endpoint) || false;

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

// Uses object destructuring to simplify data structure and save space in local storage
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
function createCard(bookData) {
  return `
    <li class="card-container shadow" id="${bookData.id}">
      <h2 class="text-large text-bold">${bookData.title}</h2>
      <h3 class="text-medium text-normal">${bookData.subtitle}</h3>
      <h4 class="text-small text-darker text-bold">${bookData.authors}</h4>
      <img class="cover-image" src="${bookData.thumbnail}">
      <a class="button bg-success" href="${bookData.infoLink}" target="_blank">Learn More</a>
    </li>
  `
}

// Generate HTML and sets #results's contents to it
function render(bookData) {
  let markup = new String();
  bookData.forEach(book => markup += createCard(book));
  document.getElementById("results").innerHTML = markup;
}

// Renders an error message
function showError(msg) {
  const html = `<li><p class="error">${msg}</p></li>`;
  document.querySelector('#results').innerHTML = html;
}
