function renderStatus(playerNameEl, playerMoneyEl, nick, money, currency) {
  playerNameEl.textContent = `Player: ${nick}`;
  playerMoneyEl.textContent = `Money: ${money} ${currency}`;
}

function setGuessEnabled(guessButtons, on) {
  guessButtons.forEach((btn) => (btn.disabled = !on));
}

function resetCards() {
  for (let i = 0; i < 3; i++) {
    const inner = document.getElementById(`card-inner-${i}`);
    const front = document.getElementById(`card-front-${i}`);
    inner.classList.remove('flipped');
    front.style.backgroundImage = '';
  }
}

function revealCard(chosen, correctPos) {
  const inner = document.getElementById(`card-inner-${chosen}`);
  const front = document.getElementById(`card-front-${chosen}`);
  if (chosen === correctPos) {
    front.style.backgroundImage = 'url("images/torvalds.jpeg")';
  } else {
    front.style.backgroundImage = 'url("images/bill.jpg")';
  }
  setTimeout(() => inner.classList.add('flipped'), 50);
}

function endGame(msg, guessButtons, nextRoundBtn, gameOverBox) {
  setGuessEnabled(guessButtons, false);
  nextRoundBtn.disabled = true;
  gameOverBox.style.display = 'block';
  gameOverBox.textContent = msg;
}

function restartGame(setupCard, gameCard, gameOverBox, form, roundMsg) {
  setupCard.style.display = 'flex';
  gameCard.style.display = 'none';
  gameOverBox.style.display = 'none';
  form.reset();
  roundMsg.textContent = '';
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

(function init() {
  const form = document.getElementById('start-form');
  const rulesNote = document.getElementById('rules-note');
  const setupCard = document.getElementById('setup-card');
  const gameCard = document.getElementById('game-card');
  const playerNameEl = document.getElementById('player-name');
  const playerMoneyEl = document.getElementById('player-money');
  const roundMsg = document.getElementById('round-message');
  const guessButtons = document.querySelectorAll('.guess-card');
  const nextRoundBtn = document.getElementById('next-round-btn');
  const stopBtn = document.getElementById('stop-btn');
  const restartBtn = document.getElementById('restart-btn');
  const gameOverBox = document.getElementById('game-over-box');

  let nick = '';
  let money = 0;
  let currency = 'USD';
  let payoutBase = 10;

  let playing = false;
  let roundActive = false;
  let correctPos = -1;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    nick = document.getElementById('nick').value.trim();
    money = parseInt(document.getElementById('money').value, 10);
    const currencySel = document.getElementById('currency');
    currency = currencySel.value;
    payoutBase = parseInt(currencySel.options[currencySel.selectedIndex].dataset.mult, 10);

    if (!nick || isNaN(money) || money <= 0) {
      alert('Please enter valid nickname and money > 0');
      return;
    }

    setupCard.style.display = 'none';
    gameCard.style.display = 'block';
    playing = true;
    roundActive = true;
    correctPos = Math.floor(Math.random() * 3);
    renderStatus(playerNameEl, playerMoneyEl, nick, money, currency);
    resetCards();
    setGuessEnabled(guessButtons, true);
    nextRoundBtn.disabled = true;
    roundMsg.textContent = '';
    gameOverBox.style.display = 'none';
    rulesNote.style.display = 'block';
    gameCard.scrollIntoView({ behavior: 'smooth' });
  });

  guessButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      if (!playing || !roundActive) return;
      const chosen = parseInt(btn.dataset.id, 10);
      roundActive = false;
      setGuessEnabled(guessButtons, false);
      revealCard(chosen, correctPos);

      setTimeout(() => {
        if (chosen === correctPos) {
          money += payoutBase;
          roundMsg.textContent = `YOU WON ${payoutBase} ${currency}!`;
        } else {
          const loss = payoutBase * 2;
          money -= loss;
          roundMsg.textContent = `YOU LOST - ${loss} ${currency}!`;
        }

        renderStatus(playerNameEl, playerMoneyEl, nick, money, currency);

        if (money <= 0) {
          endGame('You are broke. Game over!', guessButtons, nextRoundBtn, gameOverBox);
          return;
        }

        nextRoundBtn.disabled = false;
      }, 700);
    });
  });

  nextRoundBtn.addEventListener('click', () => {
    if (!playing) return;
    if (money <= 0) {
      endGame('You are broke. Game over.', guessButtons, nextRoundBtn, gameOverBox);
      return;
    }

    roundActive = true;
    nextRoundBtn.disabled = true;
    correctPos = Math.floor(Math.random() * 3);
    resetCards();
    setGuessEnabled(guessButtons, true);
    roundMsg.textContent = '';
  });

  stopBtn.addEventListener('click', () => {
    if (!playing) return;
    endGame(`You stopped the game with ${money} ${currency} Respect!`, guessButtons, nextRoundBtn, gameOverBox);
    playing = false;
    roundActive = false;
  });

  restartBtn.addEventListener('click', () => {
    restartGame(setupCard, gameCard, gameOverBox, form, roundMsg);
    playing = false;
    roundActive = false;
    correctPos = -1;
  });
})();
