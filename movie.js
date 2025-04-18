const API_BASE = "https://api.themoviedb.org/3";
const IMG_BASE_URL = "https://image.tmdb.org/t/p/w500";
const AUTH_HEADERS = {
  method: "GET",
  headers: {
    accept: "application/json",
    Authorization:
      "Bearer eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJhMmY0Y2QzZDg0OGZlMjU4YzJjYzhlNzljOTMzMWNjZSIsIm5iZiI6MTc0NDc4Mjg0Ny4xMzUsInN1YiI6IjY3ZmY0NWZmOWQxZjc3OGFiODk5YTEyYiIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.bB1H9IVkT33aoKWPoafRYiohnUdG0x4gNiv94v9-3Dk",
  },
};

const movieId = new URLSearchParams(window.location.search).get("id");

if (movieId) {
  loadMovieDetails(movieId);
}

async function loadMovieDetails(id) {
  const [details, videos, credits, providers, reviews] = await Promise.all([
    fetchData(`/movie/${id}`),
    fetchData(`/movie/${id}/videos`),
    fetchData(`/movie/${id}/credits`),
    fetchData(`/movie/${id}/watch/providers`),
    fetchData(`/movie/${id}/reviews`),
  ]);

  renderMovie(details);
  renderTrailer(videos);
  renderCredits(credits);
  renderProviders(providers);
}

async function fetchData(endpoint) {
  const res = await fetch(`${API_BASE}${endpoint}`, AUTH_HEADERS);
  return await res.json();
}

function renderMovie(movie) {
  const movieInfo = document.getElementById("movie-info");
  movieInfo.innerHTML = `
      <img src="${IMG_BASE_URL + movie.poster_path}" alt="${movie.title}" />
      <div id="movie-info-content">
        <h1>${movie.title}</h1>
        <p><em>${movie.tagline || ""}</em></p>
        <p><strong>Genres:</strong> ${movie.genres
          .map((g) => g.name)
          .join(", ")}</p>
        <p><strong>Runtime:</strong> ${movie.runtime} min</p>
        <p><strong>Release Date:</strong> ${movie.release_date}</p>
        <p><strong>Overview:</strong></p>
        <p class="overview-text">${movie.overview}</p>
        <div id="inline-cast"></div>
      </div>
    `;
}

function renderTrailer(videoData) {
  const trailerSection = document.getElementById("trailer");
  const trailer = videoData.results.find(
    (v) => v.type === "Trailer" && v.site === "YouTube"
  );
  if (trailer) {
    trailerSection.innerHTML = `
        <h2>Trailer</h2>
        <iframe width="560" height="315" src="https://www.youtube.com/embed/${trailer.key}" frameborder="0" allowfullscreen></iframe>
      `;
  }
}

function renderCredits(credits) {
  const castContainer = document.getElementById("inline-cast");
  const topCast = credits.cast.slice(0, 5);

  castContainer.innerHTML = `
      <h2>Top Cast</h2>
      <ul>
        ${topCast
          .map((actor) => `<li>${actor.name} as ${actor.character}</li>`)
          .join("")}
      </ul>
    `;
}

function renderProviders(data) {
  const providerSection = document.getElementById("providers");
  const region = data.results?.US || data.results?.SA || data.results?.IN;
  const flatrate = region?.flatrate || [];

  providerSection.innerHTML = `
      <h2>Watch On</h2>
      <p>${
        flatrate.length
          ? flatrate.map((p) => p.provider_name).join(", ")
          : "N/A"
      }</p>
    `;
}
