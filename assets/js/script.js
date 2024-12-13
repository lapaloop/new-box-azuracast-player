"use strict";

/**
 * all music information
 */

const musicData = [];

/**
 * History song data
 */
let mscHist = [];

/** Azuracast server */
// const apiUrl = "https://s1.cloudmu.id";

/**
 * Fetch API data from Azuracast server
 */
function fetchData() {
  fetch(apiUrl + "/api/nowplaying")
    .then((e) => (e.ok || checkError("Failed to load API data", () => location.reload()), e.json()))
    .then((data) => {
      data.forEach((reslt) => {
        const randomNumber = Math.floor(Math.random() * 5);
        const fileName = ".jpg";
        const extension = fileName.split("/").pop();

        const apiData = {
          posterUrl: reslt.now_playing.song.art,
          imgBrand: apiUrl + "/static/uploads/" + reslt.station.shortcode + "/" + "album_art." + randomNumber + extension,
          bgimg: reslt.now_playing.song.art,
          title: reslt.now_playing.song.title,
          album: reslt.now_playing.song.album,
          name: reslt.station.name,
          shortcode: reslt.station.shortcode,
          artist: reslt.now_playing.song.artist,
          streamUrl: reslt.station.listen_url,
          api: apiUrl + "/api/nowplaying_static/" + reslt.station.shortcode + ".json",
          duration: reslt.now_playing.duration,
          played_at: reslt.now_playing.played_at,
          elapsed: reslt.now_playing.elapsed,
          remaining: reslt.now_playing.remaining,
        };
        musicData.push(apiData);
      }),
        processData();
    })
    .catch((err) => {
      console.error("Error fetching JSON:", err);
    });
}

function checkError(data) {
  console.error("Error loading data:", data);
}

fetchData();

/**
 * Process data
 */
function processData() {
  /**
 * add eventListnere on all elements that are passed
 */

  const addEventOnElements = function (elements, eventType, callback) {
    for (let i = 0, len = elements.length; i < len; i++) {
      elements[i].addEventListener(eventType, callback);
    }
  }

  /**
   * PLAYLIST
   * 
   * add all music in playlist, from 'musicData'
   */

  const playlist = document.querySelector("[data-music-list]");

  for (let i = 0, len = musicData.length; i < len; i++) {
    playlist.innerHTML += `
  <li>
    <p class="label-md" id="station">${musicData[i].name}</p>
    <button class="music-item ${i === 0 ? "playing" : ""}" data-playlist-toggler data-playlist-item="${i}">
      <img src="${musicData[i].imgBrand}" width="800" height="800" alt="${musicData[i].title} Album Poster"
        class="img-cover">

      <div class="item-icon">
        <span class="material-symbols-rounded">equalizer</span>
      </div>
    </button>
  </li>
  `;
  }

  /**
   * PLAYLIST MODAL SIDEBAR TOGGLE
   * 
   * show 'playlist' modal sidebar when click on playlist button in top app bar
   * and hide when click on overlay or any playlist-item
   */

  const playlistSideModal = document.querySelector("[data-playlist]");
  const playlistTogglers = document.querySelectorAll("[data-playlist-toggler]");
  const overlay = document.querySelector("[data-overlay]");

  const togglePlaylist = function () {
    playlistSideModal.classList.toggle("active");
    overlay.classList.toggle("active");
    document.body.classList.toggle("modalActive");
  }

  addEventOnElements(playlistTogglers, "click", togglePlaylist);

  /**
   * PLAYLIST ITEM
   * 
   * remove active state from last time played music
   * and add active state in clicked music
   */

  const playlistItems = document.querySelectorAll("[data-playlist-item]");

  let currentMusic = 0;
  let lastPlayedMusic = 0;

  const changePlaylistItem = function () {
    playlistItems[lastPlayedMusic].classList.remove("playing");
    playlistItems[currentMusic].classList.add("playing");
  }

  addEventOnElements(playlistItems, "click", function () {
    lastPlayedMusic = currentMusic;
    currentMusic = Number(this.dataset.playlistItem);
    changePlaylistItem();
  });

  /**
   * PLAYER
   * 
   * change all visual information on player, based on current music
   */

  const playerBanner = document.querySelector("[data-player-banner]");
  const playerTitle = document.querySelector("[data-title]");
  const playerAlbum = document.querySelector("[data-album]");
  // const playerYear = document.querySelector("[data-year]");
  const playerArtist = document.querySelector("[data-artist]");

  const audioSource = new Audio(musicData[currentMusic].streamUrl);

  const changePlayerInfo = function () {
    // playerBanner.src = musicData[currentMusic].posterUrl;
    playerBanner.setAttribute("alt", `${musicData[currentMusic].title} Album Poster`);
    // document.body.style.backgroundImage = `url(${musicData[currentMusic].posterUrl})`;
    playerTitle.textContent = musicData[currentMusic].title;
    playerAlbum.textContent = musicData[currentMusic].album;
    // playerYear.textContent = musicData[currentMusic].year;
    playerArtist.textContent = musicData[currentMusic].artist;

    audioSource.src = musicData[currentMusic].streamUrl;
    playMusic();
  }

  addEventOnElements(playlistItems, "click", changePlayerInfo);

  /** pass seconds and get timcode formate */
  const getTimecode = function (duration) {
    const minutes = Math.floor(duration / 60);
    const seconds = Math.ceil(duration - (minutes * 60));
    const timecode = `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
    return timecode;
  }

  /**
   * PLAY MUSIC
   * 
   * play and pause music when click on play button
   */

  const playBtn = document.querySelector("[data-play-btn]");

  let playInterval;

  const playMusic = function () {
    audioSource.volume = 1;
    if (audioSource.paused) {
      audioSource.play();
      playBtn.classList.add("active");
      // playInterval = setInterval(updateRunningTime, 500);
    } else {
      audioSource.pause();
      playBtn.classList.remove("active");
      clearInterval(playInterval);
    }
  }

  playBtn.addEventListener("click", playMusic);

  /**
   * SKIP TO NEXT MUSIC
   */

  const playerSkipNextBtn = document.querySelector("[data-skip-next]");

  const skipNext = function () {
    lastPlayedMusic = currentMusic;
    currentMusic >= musicData.length - 1 ? currentMusic = 0 : currentMusic++;

    changePlayerInfo();
    changePlaylistItem();
  }

  playerSkipNextBtn.addEventListener("click", skipNext);

  /**
   * SKIP TO PREVIOUS MUSIC
   */

  const playerSkipPrevBtn = document.querySelector("[data-skip-prev]");

  const skipPrev = function () {
    lastPlayedMusic = currentMusic;
    currentMusic <= 0 ? currentMusic = musicData.length - 1 : currentMusic--;

    changePlayerInfo();
    changePlaylistItem();
  }

  playerSkipPrevBtn.addEventListener("click", skipPrev);

  /**
   * History button
   */
  const histBtnEle = document.querySelector("[data-history]");
  const closeHistoryModal = document.querySelector("[close-history-modal]");
  const histBtn = function (d) {
    Array.isArray(d) && d.length > 0
      ? histBtnEle.style.display = "block"
      : histBtnEle.style.display = "none";
  }
  histBtnEle.addEventListener("click", () => {
    getDataSelected(musicData[currentMusic].api),
      songListArt(),
      document.getElementById("historyModal").classList.remove("hidden");
  });
  closeHistoryModal.addEventListener("click", () => {
    document.getElementById("historyModal").classList.add("hidden");
  });

  /**
   * History song list
   */

  // const songHistListEle = document.querySelector("[song-history-list]");
  const songListArt = function (d) {
    const songHistListEle = document.querySelector("[song-history-list]");
    songHistListEle.innerHTML = "";

    Array.isArray(d) && d.length > 0 ? d.forEach(b => {
      if (!b.song.title || !b.song.artist) return;
      const frDate = b.played_at;
      const T = b.song.art;
      const D = document.createElement("li");
      D.className = "py-2 flex items-center", D.innerHTML = `
                    ${T ? `<img class="rounded-lg object-cover" src="${T}" width="100" alt="${b.title} artwork">` : ""}
                    <div class="ml-3 flex-grow">
                        <p class="text-2xl font-bold text-white text-left">${b.song.title}</p>
                        <p class="text-medium text-gray-400 text-left">${b.song.artist}</p>
                        <p class="text-xs text-gray-900 mt-1 text-left">${formatData(frDate)}</p>
                    </div>
                `, songHistListEle.appendChild(D)
    }) : songHistListEle.innerHTML = '<li class="py-2 flex items-center justify-center"><img src="./assets/images/spinner.svg" alt="Loading..." class="animate-spin h-30 w-30"></li>'
  }

  /**
   * 
   * @param {*} numeric 
   * @returns 
   * 
   * Format number to time
   */
  const formatData = function (numeric) {
    const date = new Date(numeric * 1000);
    date.toLocaleString();
    date.toDateString();
    date.toLocaleTimeString();
    const options = {
      hour: "2-digit",
      minute: "2-digit",
    };
    const formattedDate = date.toLocaleTimeString("en-us", options);
    return formattedDate;
  }

  /**
   * 
   * @param {*} a = artist
   * @param {*} t = title
   * 
   * Get Cover art
   */
  const getCoverArt = function (a, t) {
    var urlCoverArt = musicData[currentMusic].posterUrl;
    var xhttp = new XMLHttpRequest();

    xhttp.onreadystatechange = function () {
      if (this.readyState === 4 && this.status === 200) {
        const data = JSON.parse(this.responseText);
        const artworkUrl100 = (data.resultCount) ? data.results[0].artworkUrl100 : urlCoverArt;

        urlCoverArt = (artworkUrl100 != urlCoverArt) ? artworkUrl100.replace('100x100bb', '512x512bb') : urlCoverArt;
        var urlCoverArt96 = (artworkUrl100 != urlCoverArt) ? urlCoverArt.replace('512x512bb', '96x96bb') : urlCoverArt;
        var urlCoverArt128 = (artworkUrl100 != urlCoverArt) ? urlCoverArt.replace('512x512bb', '128x128bb') : urlCoverArt;
        var urlCoverArt192 = (artworkUrl100 != urlCoverArt) ? urlCoverArt.replace('512x512bb', '192x192bb') : urlCoverArt;
        var urlCoverArt256 = (artworkUrl100 != urlCoverArt) ? urlCoverArt.replace('512x512bb', '256x256bb') : urlCoverArt;
        var urlCoverArt384 = (artworkUrl100 != urlCoverArt) ? urlCoverArt.replace('512x512bb', '384x384bb') : urlCoverArt;

        playerBanner.src = urlCoverArt;
        document.getElementById("artwork").src = urlCoverArt;
        document.body.style.backgroundImage = `url(${urlCoverArt})`;
        playerBanner.setAttribute("alt", `${t} Album Poster`);

        if ('mediaSession' in navigator) {
          navigator.mediaSession.metadata = new MediaMetadata({
            title: t,
            artist: a,
            artwork: [
              {
                src: urlCoverArt96,
                sizes: '96x96',
                type: 'image/png'
              },
              {
                src: urlCoverArt128,
                sizes: '128x128',
                type: 'image/png'
              },
              {
                src: urlCoverArt192,
                sizes: '192x192',
                type: 'image/png'
              },
              {
                src: urlCoverArt256,
                sizes: '256x256',
                type: 'image/png'
              },
              {
                src: urlCoverArt384,
                sizes: '384x384',
                type: 'image/png'
              },
              {
                src: urlCoverArt,
                sizes: '512x512',
                type: 'image/png'
              }
            ]
          });
        }
      }
    }
    xhttp.open('GET', 'https://itunes.apple.com/search?term=' + a + " " + t + '&media=music&limit=1', true);
    xhttp.crossOrigin = "anonymous";
    xhttp.send();
  }

  // Get data from selected station
  async function getDataSelected(data) {
    try {
      const reslt = await (await fetch(data)).json();
      const T = musicData[currentMusic];
      const artist = reslt.now_playing.song.artist || T.artist;
      const title = reslt.now_playing.song.title || T.title;
      const album = reslt.now_playing.song.album || T.album;
      // const art = reslt.now_playing.song.art || T.posterUrl;
      // const cover = art;

      document.getElementById("title").innerHTML = title;
      document.title = artist + " - " + title;
      document.getElementById("album").innerHTML = album || "N/A";
      // document.getElementById("artwork").src = cover;
      document.getElementById("artist").innerHTML = artist;
      // getMetaData(reslt.now_playing.song);
      getCoverArt(artist, title);

      mscHist = reslt.song_history || [];
      songListArt(mscHist);
      histBtn(mscHist);

    } catch (e) {
      console.error("Error fetching data:", e);
    }
  }

  function getData() {
    setInterval(() => {
      getDataSelected(musicData[currentMusic].api);
    }, 3000);
  }
  getData();
}
