const gameContainer = document.getElementById("game-container");
const bucket = document.getElementById("bucket");
const scoreDisplay = document.getElementById("score");
const timeDisplay = document.getElementById("time");
const feedback = document.getElementById("feedback");
const confetti = document.getElementById("confetti");
const countryLabel = document.getElementById("country-label");
const countryDescription = document.getElementById("country-description");
const startButton = document.getElementById("start-btn");
const resetButton = document.getElementById("reset-btn");

const gameLength = 45;
const countries = [
  {
    name: "India",
    description: "Clean water helps families stay healthy and children stay in school."
  },
  {
    name: "Ethiopia",
    description: "Reliable water gives communities more time for school, work, and family."
  },
  {
    name: "Haiti",
    description: "Safe water supports healthier homes and stronger communities."
  },
  {
    name: "Uganda",
    description: "Nearby clean water helps families spend less time collecting water each day."
  }
];
let gameRunning = false;
let score = 0;
let timeRemaining = gameLength;
let bucketX = 0;
let drops = [];
let lastFrameTime = 0;
let dropTimer = 0;
let countdownTimer;
let animationFrame;
let stunnedUntil = 0;

startButton.addEventListener("click", startGame);
resetButton.addEventListener("click", resetGame);
gameContainer.addEventListener("pointermove", moveBucket);
gameContainer.addEventListener("pointerdown", moveBucket);

function startGame() {
  if (gameRunning) return;

  resetGame(false);
  gameRunning = true;
  startButton.textContent = "Playing...";
  startButton.disabled = true;
  feedback.textContent = "Catch the drops before they hit the ground!";
  countdownTimer = setInterval(updateTimer, 1000);
  animationFrame = requestAnimationFrame(gameLoop);
}

function resetGame(showMessage = true) {
  gameRunning = false;
  clearInterval(countdownTimer);
  cancelAnimationFrame(animationFrame);
  drops.forEach((drop) => drop.element.remove());
  drops = [];
  confetti.replaceChildren();
  score = 0;
  timeRemaining = gameLength;
  stunnedUntil = 0;
  scoreDisplay.textContent = score;
  timeDisplay.textContent = formatTime(timeRemaining);
  bucketX = Math.max(0, (gameContainer.clientWidth - bucket.offsetWidth) / 2);
  bucket.style.left = `${bucketX}px`;
  startButton.textContent = "Start Game";
  startButton.disabled = false;
  bucket.classList.remove("stunned");
  updateCountry();
  if (showMessage) feedback.textContent = "Move the bucket to catch a drop.";
}

function updateTimer() {
  timeRemaining -= 1;
  timeDisplay.textContent = formatTime(timeRemaining);
  if (timeRemaining <= 0) endGame();
}

function endGame() {
  gameRunning = false;
  clearInterval(countdownTimer);
  cancelAnimationFrame(animationFrame);
  drops.forEach((drop) => drop.element.remove());
  drops = [];
  startButton.textContent = "Play Again";
  startButton.disabled = false;
  feedback.textContent = score >= 20
    ? `Amazing! You collected ${score} points.`
    : `Time's up! You collected ${score} points.`;
  if (score >= 20) showConfetti();
}

function gameLoop(timestamp) {
  if (!gameRunning) return;

  const delta = Math.min((timestamp - lastFrameTime) / 1000 || 0, 0.05);
  lastFrameTime = timestamp;
  dropTimer += delta;

  if (dropTimer >= 0.8) {
    createDrop();
    dropTimer = 0;
  }

  updateDrops(delta, timestamp);
  animationFrame = requestAnimationFrame(gameLoop);
}

function createDrop() {
  const isBrown = Math.random() < 0.15;
  const points = isBrown ? -5 : (Math.random() < 0.25 ? 3 : 1);
  const size = isBrown ? 32 : 28;
  const element = document.createElement("div");
  element.className = isBrown ? "drop brown-drop" : points === 3 ? "drop bonus-drop" : "drop";
  element.setAttribute(
    "aria-label",
    isBrown ? "Brown drop worth negative five points" : `Water drop worth ${points} point${points === 1 ? "" : "s"}`
  );
  element.style.width = `${size}px`;
  element.style.height = `${size}px`;

  const maxX = Math.max(0, gameContainer.clientWidth - size);
  const drop = {
    element,
    x: Math.random() * maxX,
    y: 54,
    size,
    points,
    missPenalty: isBrown ? 0 : points,
    speed: 125 + Math.random() * 45
  };

  element.style.left = `${drop.x}px`;
  element.style.top = `${drop.y}px`;
  gameContainer.appendChild(element);
  drops.push(drop);
}

function updateDrops(delta, timestamp) {
  const bucketTop = gameContainer.clientHeight - bucket.offsetHeight - 10;
  const bucketRight = bucketX + bucket.offsetWidth;

  drops = drops.filter((drop) => {
    drop.y += drop.speed * delta;
    drop.element.style.top = `${drop.y}px`;

    const overlapsBucket = drop.x < bucketRight && drop.x + drop.size > bucketX;
    if (drop.y + drop.size >= bucketTop && overlapsBucket && drop.y < bucketTop + bucket.offsetHeight) {
      changeScore(drop.points);
      drop.element.remove();
      return false;
    }

    if (drop.y > gameContainer.clientHeight) {
      if (drop.missPenalty > 0) {
        changeScore(-drop.missPenalty);
        feedback.textContent = `Missed drop: -${drop.missPenalty} point${drop.missPenalty === 1 ? "" : "s"}.`;
        stunBucket(timestamp);
      }
      drop.element.remove();
      return false;
    }

    return true;
  });
}

function changeScore(points) {
  score += points;
  scoreDisplay.textContent = score;
  if (points > 0) {
    feedback.textContent = `+${points} point${points === 1 ? "" : "s"}!`;
  } else {
    feedback.textContent = `${points} points for catching a brown drop.`;
  }
  updateCountry();
}

function showConfetti() {
  const colors = ["#ffc907", "#2e9df7", "#4fcb53", "#ff902a", "#f5402c"];
  for (let index = 0; index < 40; index += 1) {
    const piece = document.createElement("span");
    piece.className = "confetti-piece";
    piece.style.setProperty("--confetti-color", colors[index % colors.length]);
    piece.style.setProperty("--confetti-x", `${Math.random() * 100}%`);
    piece.style.setProperty("--confetti-delay", `${Math.random() * 0.5}s`);
    confetti.appendChild(piece);
  }
}

function moveBucket(event) {
  if (!gameRunning || performance.now() < stunnedUntil) return;
  const bounds = gameContainer.getBoundingClientRect();
  bucketX = Math.max(0, Math.min(
    bounds.width - bucket.offsetWidth,
    event.clientX - bounds.left - bucket.offsetWidth / 2
  ));
  bucket.style.left = `${bucketX}px`;
}

function stunBucket(timestamp) {
  stunnedUntil = timestamp + 500;
  bucket.classList.remove("stunned");
  void bucket.offsetWidth;
  bucket.classList.add("stunned");
  setTimeout(() => bucket.classList.remove("stunned"), 500);
}

function updateCountry() {
  const countryIndex = Math.min(Math.floor(Math.max(score, 0) / 15), countries.length - 1);
  const country = countries[countryIndex];
  gameContainer.className = `theme-${country.name.toLowerCase()}`;
  countryLabel.textContent = country.name;
  countryDescription.textContent = country.description;
}

function formatTime(seconds) {
  return `0:${String(Math.max(0, seconds)).padStart(2, "0")}`;
}
