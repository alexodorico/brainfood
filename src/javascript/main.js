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
        localStorage.setItem(endpoint, JSON.stringify(data));
      });
    }
  });
});