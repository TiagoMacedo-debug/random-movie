const apiKey = 'aa2e1c028ee41a14417b72d79ca7192d';
const genreSelect = document.getElementById('genre-select');
const newmoviebtn = document.getElementById('new-movie-btn');
const container = document.getElementById('movie-container');

async function carregarGeneros() {
  const res = await fetch(`https://api.themoviedb.org/3/genre/movie/list?api_key=${apiKey}&language=pt-BR`);
  const data = await res.json();

  // Opção para "Todos"
  const option = document.createElement('option');
  option.value = '';
  option.textContent = 'Todos';
  genreSelect.appendChild(option);

  data.genres.forEach(genero => {
    const option = document.createElement('option');
    option.value = genero.id;
    option.textContent = genero.name;
    genreSelect.appendChild(option);
  });
}

function getSortByRandom() {
  const options = ['popularity.desc', 'release_date.desc', 'vote_average.desc'];
  return options[Math.floor(Math.random() * options.length)];
}

function getRandomPage() {
  return Math.floor(Math.random() * 500) + 1;
}

function getIdiomaPreferido() {
  const idiomaNavegador = navigator.language || navigator.userLanguage;
  return idiomaNavegador.startsWith('pt') ? 'pt-BR' : 'en-US';
}

async function buscarFilmeAleatorioComFiltro(generoId = '') {
  const idioma = getIdiomaPreferido();
  const maxTentativas = 5;

  for (let i = 0; i < maxTentativas; i++) {
    const page = getRandomPage();
    const sort = getSortByRandom();

    const url = new URL('https://api.themoviedb.org/3/discover/movie');
    url.searchParams.set('api_key', apiKey);
    url.searchParams.set('language', idioma);
    url.searchParams.set('sort_by', sort);
    url.searchParams.set('page', page);
    if (generoId) {
      url.searchParams.set('with_genres', generoId);
    }

    const res = await fetch(url.toString());
    const data = await res.json();

    const filmes = data.results.filter(f => f.poster_path && f.overview);
    if (filmes.length > 0) {
      const filmeAleatorio = filmes[Math.floor(Math.random() * filmes.length)];
      return filmeAleatorio;
    }
  }

  return null;
}

async function buscarDetalhesDoFilme(filmeId) {
  const res = await fetch(
    `https://api.themoviedb.org/3/movie/${filmeId}?api_key=${apiKey}&language=pt-BR`
  );
  const data = await res.json();
  return data;
}

async function buscarElenco(filmeId) {
  const res = await fetch(
    `https://api.themoviedb.org/3/movie/${filmeId}/credits?api_key=${apiKey}&language=pt-BR`
  );
  const data = await res.json();
  return data.cast.slice(0, 10);
}

function mostrarFilme(filme, elenco, detalhes) {
  container.innerHTML = `
    <div class="movie-featured">
      <div class="poster-box">
        <img src="https://image.tmdb.org/t/p/w500${filme.poster_path}" alt="${filme.title}">
      </div>
      <div class="details-box">
        <h2>${filme.title}</h2>
        <div class="rating"><i class="bi bi-star-fill"></i> ${filme.vote_average.toFixed(1)} / 10</div>
        <div class="extra-info mb-3">
            <p><strong>Gêneros:</strong> ${detalhes.genres.map(g => g.name).join(', ')}</p>
            <p><strong>Duração:</strong> ${detalhes.runtime} min</p>
            <p><strong>Lançamento:</strong> ${detalhes.release_date.slice(0, 4)}</p>
        </div>
        <p>${filme.overview}</p>
        <div class="cast-scroll">
          ${elenco.map(actor => `
            <a class="link_actor" href="https://www.themoviedb.org/person/${actor.id}" target="_blank">
              <div class="actor">
                <img src="${actor.profile_path ? `https://image.tmdb.org/t/p/w185${actor.profile_path}` : 'https://placehold.co/80x80.png'}" alt="${actor.name}">
                <span>${actor.name}</span>
              </div>
            </a>
          `).join('')}
        </div>
      </div>
    </div>
  `;
}

async function buscarEExibirFilme(generoId = '') {
  container.innerHTML = `<p style="text-align:center">Carregando filme...</p>`;
  try {
    const filme = await buscarFilmeAleatorioComFiltro(generoId);
    if (!filme) {
      container.innerHTML = `<p style="text-align:center">Nenhum filme encontrado.</p>`;
      return;
    }
    const [elenco, detalhes] = await Promise.all([
        buscarElenco(filme.id),
        buscarDetalhesDoFilme(filme.id)
    ]);
    mostrarFilme(filme, elenco, detalhes);

  } catch (err) {
    console.error(err);
    container.innerHTML = `<p style="text-align:center">Erro ao buscar filme. Tente novamente.</p>`;
  }
}

genreSelect.addEventListener('change', () => {
  buscarEExibirFilme(genreSelect.value);
});
newmoviebtn.addEventListener('click', () => {
  buscarEExibirFilme(genreSelect.value);
});

(async () => {
  await carregarGeneros();
  buscarEExibirFilme();
})();
