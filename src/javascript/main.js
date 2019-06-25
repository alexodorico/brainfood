import '../scss/styles.scss';

// Renders an error message
function showError(msg) {
  const html = `<li><p class="error">${msg}</p></li>`;
  document.querySelector('#results').innerHTML = html;
}

// Searches for books and returns a promise that resolves a JSON list
function searchForBooks(term) {
  // TODO
}

// Generate HTML and sets #results's contents to it
function render() {
  // TODO
}

document.getElementById("search-btn").addEventListener("click", _ => {
  const query = document.getElementById("search-bar").value;
  const endpoint = `https://www.googleapis.com/books/v1/volumes?q=${query}`;
  const cached = localStorage.getItem(endpoint) || false;

  if (cached) {
    console.log('cached');
  }

  return fetch(endpoint).then(response => {
    if (response.status === 200) {
      response.json().then(data => {
        const slimData = destructureResults(data.items);
        console.log(slimData);
        localStorage.setItem(endpoint, JSON.stringify(slimData));
      });
    }
  });
});

function destructureResults(data) {
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
