"use strict";

/**
 * all music information
 */

const musicData = [];

/** Azuracast server */
const apiUrl = "https://s1.cloudmu.id";

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
    playerBanner.src = musicData[currentMusic].posterUrl;
    playerBanner.setAttribute("alt", `${musicData[currentMusic].title} Album Poster`);
    document.body.style.backgroundImage = `url(${musicData[currentMusic].posterUrl})`;
    playerTitle.textContent = musicData[currentMusic].title;
    playerAlbum.textContent = musicData[currentMusic].album;
    // playerYear.textContent = musicData[currentMusic].year;
    playerArtist.textContent = musicData[currentMusic].artist;

    audioSource.src = musicData[currentMusic].streamUrl;

    audioSource.addEventListener("loadeddata", updateDuration);
    playMusic();
  }

  addEventOnElements(playlistItems, "click", changePlayerInfo);

  /** update player duration */
  const playerDuration = document.querySelector("[data-duration]");
  const playerSeekRange = document.querySelector("[data-seek]");

  /** pass seconds and get timcode formate */
  const getTimecode = function (duration) {
    const minutes = Math.floor(duration / 60);
    const seconds = Math.ceil(duration - (minutes * 60));
    const timecode = `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
    return timecode;
  }

  const updateDuration = function () {
    playerSeekRange.max = Math.ceil(audioSource.duration);
    playerDuration.textContent = getTimecode(Number(playerSeekRange.max));
  }

  audioSource.addEventListener("loadeddata", updateDuration);

  /**
   * PLAY MUSIC
   * 
   * play and pause music when click on play button
   */

  const playBtn = document.querySelector("[data-play-btn]");

  let playInterval;

  const playMusic = function () {
    if (audioSource.paused) {
      audioSource.play();
      playBtn.classList.add("active");
      playInterval = setInterval(updateRunningTime, 500);
    } else {
      audioSource.pause();
      playBtn.classList.remove("active");
      clearInterval(playInterval);
    }
  }

  playBtn.addEventListener("click", playMusic);

  /** update running time while playing music */
  const playerRunningTime = document.querySelector("[data-running-time");

  const updateRunningTime = function () {
    playerSeekRange.value = audioSource.currentTime;
    playerRunningTime.textContent = getTimecode(audioSource.currentTime);

    updateRangeFill();
    isMusicEnd();
  }

  /**
   * RANGE FILL WIDTH
   * 
   * change 'rangeFill' width, while changing range value
   */

  const ranges = document.querySelectorAll("[data-range]");
  const rangeFill = document.querySelector("[data-range-fill]");

  const updateRangeFill = function () {
    let element = this || ranges[0];

    const rangeValue = (element.value / element.max) * 100;
    element.nextElementSibling.style.width = `${rangeValue}%`;
  }

  addEventOnElements(ranges, "input", updateRangeFill);

  /**
   * SEEK MUSIC
   * 
   * seek music while changing player seek range
   */

  const seek = function () {
    audioSource.currentTime = playerSeekRange.value;
    playerRunningTime.textContent = getTimecode(playerSeekRange.value);
  }

  playerSeekRange.addEventListener("input", seek);

  /**
   * END MUSIC
   */

  const isMusicEnd = function () {
    if (audioSource.ended) {
      playBtn.classList.remove("active");
      audioSource.currentTime = 0;
      playerSeekRange.value = audioSource.currentTime;
      playerRunningTime.textContent = getTimecode(audioSource.currentTime);
      updateRangeFill();
    }
  }

  /**
   * SKIP TO NEXT MUSIC
   */

  const playerSkipNextBtn = document.querySelector("[data-skip-next]");

  const skipNext = function () {
    lastPlayedMusic = currentMusic;

    if (isShuffled) {
      shuffleMusic();
    } else {
      currentMusic >= musicData.length - 1 ? currentMusic = 0 : currentMusic++;
    }

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

    if (isShuffled) {
      shuffleMusic();
    } else {
      currentMusic <= 0 ? currentMusic = musicData.length - 1 : currentMusic--;
    }

    changePlayerInfo();
    changePlaylistItem();
  }

  playerSkipPrevBtn.addEventListener("click", skipPrev);

  /**
   * SHUFFLE MUSIC
   */

  /** get random number for shuffle */
  const getRandomMusic = () => Math.floor(Math.random() * musicData.length);

  const shuffleMusic = () => currentMusic = getRandomMusic();

  const playerShuffleBtn = document.querySelector("[data-shuffle]");
  let isShuffled = false;

  const shuffle = function () {
    playerShuffleBtn.classList.toggle("active");

    isShuffled = isShuffled ? false : true;
  }

  playerShuffleBtn.addEventListener("click", shuffle);

  /**
   * REPEAT MUSIC
   */

  const playerRepeatBtn = document.querySelector("[data-repeat]");

  const repeat = function () {
    if (!audioSource.loop) {
      audioSource.loop = true;
      this.classList.add("active");
    } else {
      audioSource.loop = false;
      this.classList.remove("active");
    }
  }

  playerRepeatBtn.addEventListener("click", repeat);

  /**
   * MUSIC VOLUME
   * 
   * increase or decrease music volume when change the volume range
   */

  const playerVolumeRange = document.querySelector("[data-volume]");
  const playerVolumeBtn = document.querySelector("[data-volume-btn]");

  const changeVolume = function () {
    audioSource.volume = playerVolumeRange.value;
    audioSource.muted = false;

    if (audioSource.volume <= 0.1) {
      playerVolumeBtn.children[0].textContent = "volume_mute";
    } else if (audioSource.volume <= 0.5) {
      playerVolumeBtn.children[0].textContent = "volume_down";
    } else {
      playerVolumeBtn.children[0].textContent = "volume_up";
    }
  }

  playerVolumeRange.addEventListener("input", changeVolume);


  /**
   * MUTE MUSIC
   */

  const muteVolume = function () {
    if (!audioSource.muted) {
      audioSource.muted = true;
      playerVolumeBtn.children[0].textContent = "volume_off";
    } else {
      changeVolume();
    }
  }

  playerVolumeBtn.addEventListener("click", muteVolume);

  // Get data from selected station
  async function getDataSelected(data) {
    try {
      const reslt = await (await fetch(data)).json();
      const T = musicData[currentMusic];
      const artist = reslt.now_playing.song.artist || T.artist;
      const title = reslt.now_playing.song.title || T.title;
      const album = reslt.now_playing.song.album || T.album;
      const art = reslt.now_playing.song.art || T.posterUrl;
      const cover = art;

      document.getElementById("title").innerHTML = title;
      document.title = artist + " | " + title;
      document.getElementById("album").innerHTML = album || "N/A";
      document.getElementById("artwork").src = cover;
      document.getElementById("artist").innerHTML = artist;
      getMetaData(reslt.now_playing.song);
    } catch (e) {
      console.error("Error fetching data:", e);
    }
  }

  function getMetaData(callback) {
    if ("mediaSession" in navigator) {
      const {
        title: title = callback.title,
        artist: artist = callback.artist,
        art: art = callback.posterUrl,
      } = callback,
        img96 = {
          src: art,
          sizes: "96x96",
          type: "image/png",
        };
      const img128 = {
        src: art,
        sizes: "128x128",
        type: "image/png",
      };
      const img192 = {
        src: art,
        sizes: "192x192",
        type: "image/png",
      };
      const img256 = {
        src: art,
        sizes: "256x256",
        type: "image/png",
      };
      const img384 = {
        src: art,
        sizes: "384x384",
        type: "image/png",
      };
      const img512 = {
        src: art,
        sizes: "512x512",
        type: "image/png",
      };
      const mData = {
        title: title,
        artist: artist,
        artwork: [img96, img128, img192, img256, img384, img512],
      };
      navigator.mediaSession.metadata = new MediaMetadata(mData);
    }
  }

  function getData() {
    setInterval(() => {
      getDataSelected(musicData[currentMusic].api);
    }, 3000);
  }
  getData();
}
