const createPaymentFlipCardController = () => {
  const cardEl = document.getElementById("fpc-card");
  const logoEl = document.getElementById("fpc-logo");
  const waveEl = document.getElementById("fpc-wave");
  const hintEl = document.getElementById("fpc-hint");

  const GLYPHS = {
    logo: '<svg viewBox="0 0 100 100" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M61.097 0.330724L99.726 54.2026C100.12 54.7528 100.333 55.416 100.333 56.0966V63.2435C100.333 64.0219 99.3522 64.3459 98.9014 63.7163L61.0964 10.9513C60.7787 10.5076 60.1265 10.5104 59.8128 10.9567L22.6974 63.6754C22.2495 64.3119 21.2617 63.9902 21.2617 63.2078V56.1275C21.2617 55.4564 21.4684 54.8022 21.8526 54.2564L59.8128 0.336405C60.1271 -0.109735 60.7787 -0.11262 61.097 0.330724Z"/><path fill-rule="evenodd" clip-rule="evenodd" d="M61.4755 23.9003C61.1369 23.4348 60.4425 23.4369 60.1074 23.9048L54.3151 31.9876L26.5357 70.754L19.9329 79.9671C19.5327 80.5264 19.9316 81.3036 20.6185 81.3036H31.9498H60.788H90.1334H101.512C102.201 81.3036 102.599 80.5212 102.194 79.9636L95.505 70.754L67.3192 31.9459L61.4755 23.9003ZM61.5328 41.9249C61.1948 41.4594 60.4998 41.4618 60.1647 41.9294L40.4669 69.4181C40.0667 69.9762 40.4655 70.754 41.1523 70.754H60.788H80.8157C81.505 70.754 81.9031 69.9716 81.498 69.4134L61.5328 41.9249Z"/></svg>',
    wave: '<svg viewBox="0 3.71 26.959 38.787" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M19.709 3.719c.266.043.5.187.656.406 4.125 5.207 6.594 11.781 6.594 18.938 0 7.156-2.469 13.73-6.594 18.937-.195.336-.57.531-.957.492a.9946.9946 0 0 1-.851-.66c-.129-.367-.035-.777.246-1.051 3.855-4.867 6.156-11.023 6.156-17.718 0-6.696-2.301-12.852-6.156-17.719-.262-.317-.301-.762-.102-1.121.204-.36.602-.559 1.008-.504z"/><path d="M13.74 7.563c.231.039.442.164.594.343 3.508 4.059 5.625 9.371 5.625 15.157 0 5.785-2.113 11.097-5.625 15.156-.363.422-1 .472-1.422.109-.422-.363-.472-1-.109-1.422 3.211-3.711 5.156-8.551 5.156-13.843 0-5.293-1.949-10.133-5.156-13.844-.27-.309-.324-.75-.141-1.114.188-.367.578-.582.985-.542h.093z"/><path d="M7.584 11.438c.227.031.438.144.594.312 2.953 2.863 4.781 6.875 4.781 11.313 0 4.433-1.828 8.449-4.781 11.312-.398.387-1.035.383-1.422-.016-.387-.398-.383-1.035.016-1.421 2.582-2.504 4.187-5.993 4.187-9.875 0-3.883-1.605-7.372-4.187-9.875-.321-.282-.426-.739-.266-1.133.164-.395.559-.641.984-.617h.094z"/><path d="M1.178 15.531c.121.02.238.063.344.125 2.633 1.414 4.437 4.215 4.437 7.407 0 3.195-1.797 5.996-4.437 7.406-.492.258-1.102.07-1.36-.422-.257-.492-.07-1.102.422-1.359 2.012-1.075 3.375-3.176 3.375-5.625 0-2.446-1.371-4.551-3.375-5.625-.441-.204-.676-.692-.551-1.165.122-.468.567-.785 1.051-.742h.094z"/></svg>',
  };

  const LABEL_FRONT = "Show the back of the card with the security code";
  const LABEL_BACK = "Show the front of the card with the card number";
  const HINT_FRONT = "Click the card or press Enter to flip it.";
  const HINT_BACK = "Showing the back. Click or press Enter to flip back.";

  const parseRgb = (value) => {
    const channels = String(value).match(/[\d.]+/g);
    return channels && channels.length >= 3 ? channels.slice(0, 3).map(Number) : null;
  };

  const relativeLuminance = (channels) =>
    channels
      .map((value) => {
        const channel = value / 255;
        return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
      })
      .reduce((sum, channel, index) => sum + channel * [0.2126, 0.7152, 0.0722][index], 0);

  const contrastRatio = (a, b) => {
    const light = Math.max(a, b);
    const dark = Math.min(a, b);
    return (light + 0.05) / (dark + 0.05);
  };

  const mixToward = (rgb, target, amount) =>
    rgb.map((channel, index) => channel + (target[index] - channel) * amount);
  const toRgb = (rgb) => `rgb(${rgb.map((channel) => Math.round(channel)).join(", ")})`;

  /* The decorative face pattern is derived from the card's OWN fill, moved in BOTH
       directions (a light tint and a dark shade). The audit reads every gradient
       stop as a background candidate for the card ink, so each tone is pushed only
       as far as the ink's contrast headroom allows: the dark shade is the reliable
       visible carrier on any fill (darkening never hurts light ink and light ink
       sits on light fills with room to spare), while the light tint lifts as far as
       a thin light-ink pair can tolerate — down to nearly nothing when the ink is
       white on a mid fill. That keeps a subtle geometric texture visible under every
       design system without ever dropping the ink below its audited 4.5:1 floor. */
  const AA_TEXT = 4.5;
  const SAFETY = 0.12; /* headroom above the AA floor */
  const SUBTLE_DARK = 0.17;
  const SUBTLE_LIGHT = 0.15;
  const HARD_CAP = 0.5;

  const safeAmount = (fill, target, inkLum, subtle) => {
    let best = 0;
    for (let amount = 0.02; amount <= HARD_CAP + 1e-9; amount += 0.02) {
      const ratio = contrastRatio(relativeLuminance(mixToward(fill, target, amount)), inkLum);
      if (ratio >= AA_TEXT + SAFETY) best = amount;
      else break;
    }
    return Math.min(best, subtle);
  };

  const syncPatternContrast = () => {
    const face = document.querySelector(".fpc-card__face");
    if (!face) return;
    const ink = parseRgb(getComputedStyle(face).color);
    const fill = parseRgb(getComputedStyle(face).backgroundColor);
    if (!ink) return;
    const inkLum = relativeLuminance(ink);

    document.body.style.setProperty("--fpc-pattern-contrast", inkLum > 0.5 ? "#000000" : "#ffffff");

    if (!fill) return;
    const lo = mixToward(fill, [0, 0, 0], safeAmount(fill, [0, 0, 0], inkLum, SUBTLE_DARK));
    const hi = mixToward(
      fill,
      [255, 255, 255],
      safeAmount(fill, [255, 255, 255], inkLum, SUBTLE_LIGHT),
    );
    document.body.style.setProperty("--fpc-pattern-lo", toRgb(lo));
    document.body.style.setProperty("--fpc-pattern-hi", toRgb(hi));
  };

  let patternFrame = 0;
  const schedulePatternSync = () => {
    cancelAnimationFrame(patternFrame);
    patternFrame = requestAnimationFrame(syncPatternContrast);
  };

  const renderGlyphs = () => {
    if (logoEl) logoEl.innerHTML = GLYPHS.logo;
    if (waveEl) waveEl.innerHTML = GLYPHS.wave;
  };

  const setFlipped = (flipped) => {
    cardEl.classList.toggle("is-flipped", flipped);
    cardEl.setAttribute("aria-pressed", String(flipped));
    cardEl.setAttribute("aria-label", flipped ? LABEL_BACK : LABEL_FRONT);
    if (hintEl) {
      hintEl.textContent = flipped ? HINT_BACK : HINT_FRONT;
    }
  };

  const toggleFlip = () => {
    /* `has-flipped` arms the return lift animation only after the first
           real flip, so it can never fire on initial load. */
    cardEl.classList.add("has-flipped");
    setFlipped(!cardEl.classList.contains("is-flipped"));
  };

  /* Pointer-tracking tilt: rotateX follows the cursor's vertical offset and
       rotateY its horizontal offset across the full face, feeding the CSS
       hover transform through custom props. Mouse/pen only (touch has no
       hover and taps must stay a clean flip), skipped for reduced motion,
       and pointerleave clears everything so the card settles on the slow
       transition. */
  const TILT_X_MAX = 6;
  const TILT_Y_MAX = 10;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  let tiltFrame = 0;
  const onTiltMove = (event) => {
    if (reduceMotion.matches || (event.pointerType !== "mouse" && event.pointerType !== "pen"))
      return;
    const rect = cardEl.getBoundingClientRect();
    const px = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    const py = ((event.clientY - rect.top) / rect.height) * 2 - 1;
    cancelAnimationFrame(tiltFrame);
    tiltFrame = requestAnimationFrame(() => {
      cardEl.classList.add("is-tilting");
      cardEl.style.setProperty("--fpc-tilt-x", (-py * TILT_X_MAX).toFixed(2) + "deg");
      cardEl.style.setProperty("--fpc-tilt-y", (px * TILT_Y_MAX).toFixed(2) + "deg");
    });
  };
  const onTiltLeave = () => {
    cancelAnimationFrame(tiltFrame);
    cardEl.classList.remove("is-tilting");
    cardEl.style.removeProperty("--fpc-tilt-x");
    cardEl.style.removeProperty("--fpc-tilt-y");
  };

  if (cardEl) {
    renderGlyphs();
    cardEl.addEventListener("click", toggleFlip);
    cardEl.addEventListener("pointermove", onTiltMove);
    cardEl.addEventListener("pointerleave", onTiltLeave);
    setFlipped(false);
    schedulePatternSync();

    const rootObserver = new MutationObserver(schedulePatternSync);
    rootObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["style", "class", "data-browse-design-system"],
    });
    rootObserver.observe(document.body, { attributes: true, attributeFilter: ["class"] });
  }
};
