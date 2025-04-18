const API_BASE = "https://api.themoviedb.org/3";
const IMG_BASE_URL = "https://image.tmdb.org/t/p/w300";
const AUTH_HEADERS = {
  method: "GET",
  headers: {
    accept: "application/json",
    Authorization:
      "Bearer eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJhMmY0Y2QzZDg0OGZlMjU4YzJjYzhlNzljOTMzMWNjZSIsIm5iZiI6MTc0NDc4Mjg0Ny4xMzUsInN1YiI6IjY3ZmY0NWZmOWQxZjc3OGFiODk5YTEyYiIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.bB1H9IVkT33aoKWPoafRYiohnUdG0x4gNiv94v9-3Dk",
  },
};

async function loadMovies(endpoint, targetId) {
  const res = await fetch(`${API_BASE}${endpoint}`, AUTH_HEADERS);
  const data = await res.json();
  displayMovies(data.results, targetId);
}

async function getWatchProviders(movieId) {
  try {
    const res = await fetch(
      `${API_BASE}/movie/${movieId}/watch/providers`,
      AUTH_HEADERS
    );
    const data = await res.json();
    const results = data.results;
    const region = results?.US || results?.SA || results?.IN;
    if (region && region.flatrate) {
      return region.flatrate.map((provider) => provider.provider_name);
    }
    return [];
  } catch {
    return [];
  }
}

function getRatingColor(rating) {
  if (rating >= 7.5) return "green";
  if (rating >= 5) return "orange";
  return "red";
}

async function displayMovies(movies, targetId) {
  const section = document.getElementById(targetId);
  if (!section) return;
  section.innerHTML = "";

  for (const movie of movies) {
    const card = document.createElement("div");
    card.classList.add("movie-card");

    const providers = await getWatchProviders(movie.id);
    const providerHTML = `<div class="providers"><strong>Watch on:</strong> ${
      providers.length ? providers.join(", ") : "N/A"
    }</div>`;

    card.innerHTML = `
      <img src="${IMG_BASE_URL + movie.poster_path}" alt="${movie.title}" />
      <div class="movie-info">
        <h4>${movie.title}</h4>
        <span class="rating ${getRatingColor(
          movie.vote_average
        )}">${movie.vote_average.toFixed(1)}</span>
      </div>
      <div class="overview">
        <div class="overview-title"><strong>Overview</strong></div>
        <div class="overview-text">${movie.overview}</div>
        ${providerHTML}
      </div>
    `;
    card.addEventListener("click", () => {
      window.location.href = `movie.html?id=${movie.id}`;
    });

    section.appendChild(card);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const path = window.location.pathname;

  if (
    path.includes("index.html") ||
    path === "/" ||
    path.includes("localhost")
  ) {
    loadMovies("/movie/popular?language=en-US&page=1", "popular-movies");
    loadMovies(
      "/movie/now_playing?language=en-US&page=1",
      "now-playing-movies"
    );
    loadMovies("/movie/upcoming?language=en-US&page=1", "upcoming-movies");
  }

  if (path.includes("upcoming.html")) {
    loadMovies("/movie/upcoming?language=en-US&page=1", "upcoming-movies");
  }

  if (path.includes("discover.html")) {
    setupDiscover();
  }

  const searchBtn = document.getElementById("searchbutton");
  if (searchBtn) {
    searchBtn.addEventListener("click", (e) => {
      e.preventDefault();
      const query = document.getElementById("searchInput").value.trim();
      if (query) {
        searchMovies(query);
      }
    });
  }
});

async function setupDiscover() {
  const genreSelect = document.getElementById("genre-filter");
  const sortSelect = document.getElementById("sort-by");

  const genres = await fetch(
    `${API_BASE}/genre/movie/list?language=en`,
    AUTH_HEADERS
  )
    .then((res) => res.json())
    .then((data) => data.genres);

  genres.forEach((genre) => {
    const option = document.createElement("option");
    option.value = genre.id;
    option.textContent = genre.name;
    genreSelect.appendChild(option);
  });

  async function fetchDiscoverMovies() {
    const selectedGenre = genreSelect.value;
    const sortBy = sortSelect.value;

    let url = `${API_BASE}/discover/movie?language=en-US&sort_by=${sortBy}&page=1`;
    if (selectedGenre) url += `&with_genres=${selectedGenre}`;

    const res = await fetch(url, AUTH_HEADERS);
    const data = await res.json();
    displayMovies(data.results, "popular-movies");
  }

  genreSelect.addEventListener("change", fetchDiscoverMovies);
  sortSelect.addEventListener("change", fetchDiscoverMovies);

  fetchDiscoverMovies();
}

async function searchMovies(query) {
  const res = await fetch(
    `${API_BASE}/search/movie?query=${encodeURIComponent(
      query
    )}&language=en-US&page=1`,
    AUTH_HEADERS
  );
  const data = await res.json();

  const searchContainer = document.getElementById("search-container");
  const resultsSection = document.getElementById("search-results");
  const defaultMovies =
    document.getElementById("default-movies") ||
    document.getElementById("default-movie-view");
  const fallback = document.getElementById("popular-movies");

  if (data.results.length > 0) {
    if (searchContainer) searchContainer.style.display = "block";
    if (defaultMovies) defaultMovies.style.display = "none";
    const target = resultsSection || fallback;
    if (target) displayMovies(data.results, target.id);
  } else {
    if (resultsSection) resultsSection.innerHTML = "<p>No results found.</p>";
  }
}
