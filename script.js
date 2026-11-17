
document.addEventListener("DOMContentLoaded", () => {

  // ========================================
  // ENVELOPE OPENING AND WEDDING MUSIC
  // ========================================

  const envelopeScreen = document.getElementById("envelopeScreen");
  const openButton = document.getElementById("openInvitation");
  const music = document.getElementById("weddingMusic");
  const musicToggle = document.getElementById("musicToggle");

  function setMusicState(playing) {
    musicToggle.classList.toggle("is-playing", playing);

    musicToggle.setAttribute(
      "aria-label",
      playing ? "Pause wedding music" : "Play wedding music"
    );

    musicToggle.title = playing
      ? "Pause wedding music"
      : "Play wedding music";

    musicToggle.textContent = playing ? "♫" : "♪";
  }

  async function startMusic() {
    try {
      const playRequest = music.play();

      if (playRequest && typeof playRequest.then === "function") {
        await playRequest;
      }

      setMusicState(true);
      return true;

    } catch (error) {
      setMusicState(false);
      console.error("Wedding music playback failed:", error);
      return false;
    }
  }

  openButton.addEventListener("click", () => {

    // Start music from the user's tap.
    startMusic();

    envelopeScreen.classList.add("is-opening");
    document.body.classList.add("is-celebrating");
    document.body.classList.remove("locked");

    window.setTimeout(() => {
      envelopeScreen.hidden = true;

      document.getElementById("coverScreen").scrollIntoView({
        behavior: "smooth"
      });

    }, 850);
  });

  musicToggle.addEventListener("click", async () => {

    if (music.paused) {
      await startMusic();

    } else {
      music.pause();
      setMusicState(false);
    }

  });

  music.addEventListener("play", () => setMusicState(true));
  music.addEventListener("pause", () => setMusicState(false));

  music.addEventListener("error", () => {
    setMusicState(false);
    console.error(
      "Could not load assets/Beast.mp3. Check your assets folder."
    );
  });


  // ========================================
  // WEDDING COUNTDOWN
  // 13 DECEMBER 2026, 7:00 AM IST
  // ========================================

  const target = new Date(
    "2026-12-13T07:00:00+05:30"
  ).getTime();

  function updateCountdown() {

    const diff = Math.max(0, target - Date.now());

    const values = {
      days: Math.floor(diff / 86400000),

      hours: Math.floor(
        (diff % 86400000) / 3600000
      ),

      minutes: Math.floor(
        (diff % 3600000) / 60000
      ),

      seconds: Math.floor(
        (diff % 60000) / 1000
      )
    };

    Object.entries(values).forEach(([id, value]) => {

      const element = document.getElementById(id);

      if (element) {
        element.textContent = String(value).padStart(2, "0");
      }

    });
  }

  updateCountdown();
  window.setInterval(updateCountdown, 1000);


  // ========================================
  // MOBILE-FRIENDLY SCRATCH CARD
  // Supports touch, mouse and stylus
  // ========================================

  const canvas = document.getElementById("scratchCanvas");

  if (canvas) {

    const context = canvas.getContext("2d", {
      willReadFrequently: true
    });

    let drawing = false;
    let revealed = false;
    let activePointer = null;

    let lastX = 0;
    let lastY = 0;

    let pixelRatio = 1;


    // Paint the golden scratch coating.
    function paintLayer() {

      const rect = canvas.getBoundingClientRect();

      if (!rect.width || !rect.height || revealed) {
        return;
      }

      pixelRatio = Math.min(
        window.devicePixelRatio || 1,
        2
      );

      canvas.width = Math.round(rect.width * pixelRatio);
      canvas.height = Math.round(rect.height * pixelRatio);

      context.setTransform(
        pixelRatio,
        0,
        0,
        pixelRatio,
        0,
        0
      );

      context.globalCompositeOperation = "source-over";

      const gradient = context.createLinearGradient(
        0,
        0,
        rect.width,
        rect.height
      );

      gradient.addColorStop(0, "#e4bd50");
      gradient.addColorStop(0.5, "#c99b35");
      gradient.addColorStop(1, "#b98227");

      context.fillStyle = gradient;

      context.fillRect(
        0,
        0,
        rect.width,
        rect.height
      );

      // Text printed on the golden coating.
      context.fillStyle = "rgba(255,255,255,0.95)";
      context.font = "italic 25px Allura, cursive";
      context.textAlign = "center";
      context.textBaseline = "middle";

      context.fillText(
        "Scratch here ✨",
        rect.width / 2,
        rect.height / 2
      );

      // Switch to erasing mode.
      context.globalCompositeOperation = "destination-out";
    }


    // Convert finger/mouse position into canvas coordinates.
    function getPosition(event) {

      const rect = canvas.getBoundingClientRect();

      return {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top
      };
    }


    // Erase a continuous line as the finger moves.
    function eraseLine(x1, y1, x2, y2) {

      context.beginPath();

      context.lineWidth = 38;
      context.lineCap = "round";
      context.lineJoin = "round";

      context.moveTo(x1, y1);
      context.lineTo(x2, y2);

      context.stroke();
    }


    // Check how much of the golden coating is erased.
    function checkReveal() {

      if (revealed) return;

      const pixels = context.getImageData(
        0,
        0,
        canvas.width,
        canvas.height
      ).data;

      const step = 12;

      let transparent = 0;
      let total = 0;

      for (
        let y = 0;
        y < canvas.height;
        y += step
      ) {

        for (
          let x = 0;
          x < canvas.width;
          x += step
        ) {

          const alpha =
            pixels[(y * canvas.width + x) * 4 + 3];

          total++;

          if (alpha < 30) {
            transparent++;
          }

        }
      }

      // Reveal after approximately 40% is scratched.
      if (total > 0 && transparent / total > 0.40) {

        revealed = true;
        drawing = false;

        context.clearRect(
          0,
          0,
          canvas.width / pixelRatio,
          canvas.height / pixelRatio
        );

        const tip = document.querySelector(".scratch-tip");

        if (tip) {
          tip.textContent =
            "13th December 2026 — our special day! ♥";
        }
      }
    }


    // Finger or mouse touches the card.
    canvas.addEventListener("pointerdown", event => {

      if (revealed) return;

      event.preventDefault();

      drawing = true;
      activePointer = event.pointerId;

      try {
        canvas.setPointerCapture(event.pointerId);
      } catch (error) {
        console.warn("Pointer capture unavailable:", error);
      }

      const point = getPosition(event);

      lastX = point.x;
      lastY = point.y;

      // Begin scratching immediately.
      eraseLine(lastX, lastY, lastX, lastY);

    });


    // Finger or mouse moves across the card.
    canvas.addEventListener("pointermove", event => {

      if (
        !drawing ||
        revealed ||
        event.pointerId !== activePointer
      ) {
        return;
      }

      event.preventDefault();

      const point = getPosition(event);

      eraseLine(
        lastX,
        lastY,
        point.x,
        point.y
      );

      lastX = point.x;
      lastY = point.y;

    });


    // Stop scratching when the finger is lifted.
    function stopScratching(event) {

      if (event.pointerId !== activePointer) {
        return;
      }

      drawing = false;
      activePointer = null;

      checkReveal();
    }

    canvas.addEventListener("pointerup", stopScratching);
    canvas.addEventListener("pointercancel", stopScratching);

    canvas.addEventListener("lostpointercapture", () => {
      drawing = false;
      activePointer = null;
    });


    // Draw the coating after the canvas gets its dimensions.
    requestAnimationFrame(paintLayer);


    // Repaint if the phone changes orientation or size.
    window.addEventListener("resize", () => {

      if (!revealed) {
        requestAnimationFrame(paintLayer);
      }

    });

  }


  // ========================================
  // INITIAL PAGE STATE
  // ========================================

  document.body.classList.add("locked");

});


// ========================================
// FALLING ROSE PETALS, JASMINE AND GOLD DUST
// ========================================

document.addEventListener("DOMContentLoaded", function () {

  const shower = document.getElementById("petal-shower");

  if (!shower) return;

  const numberOfPetals =
    window.innerWidth < 600 ? 13 : 22;

  for (let i = 0; i < numberOfPetals; i++) {

    const petal = document.createElement("span");

    const types = [
      "rose",
      "rose",
      "jasmine",
      "gold"
    ];

    const type = types[
      Math.floor(Math.random() * types.length)
    ];

    petal.classList.add("petal", type);

    petal.style.setProperty(
      "--left",
      Math.random() * 100 + "%"
    );

    petal.style.setProperty(
      "--size",
      (6 + Math.random() * 10) + "px"
    );

    petal.style.setProperty(
      "--duration",
      (9 + Math.random() * 9) + "s"
    );

    petal.style.setProperty(
      "--delay",
      (-Math.random() * 15) + "s"
    );

    petal.style.setProperty(
      "--drift",
      (-70 + Math.random() * 140) + "px"
    );

    petal.style.setProperty(
      "--opacity",
      (0.4 + Math.random() * 0.5)
    );

    shower.appendChild(petal);

  }

});
