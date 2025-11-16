// js/game.js

const elGame      = document.getElementById("game");
const elStatus    = document.getElementById("status");
const elDialog    = document.getElementById("dialog-text");
const elChoices   = document.getElementById("choices");
const elHint      = document.getElementById("hint");
const elGuestName = document.getElementById("guest-name");

const state = {
  dayIndex: 0,
  lives: MAX_LIVES,
  score: 0,
  mode: "intro", // start | dialog | guess | result | ending | ending_dead | restart | done
  lineIndex: 0
};

function hearts() {
  return "♥".repeat(state.lives) + "♡".repeat(MAX_LIVES - state.lives);
}

function clearScreen() {
  elDialog.textContent = "";
  elChoices.innerHTML = "";
  elHint.textContent = "";
}

function println(text = "") {
  elDialog.textContent += text + "\n";
}

function showStatusHeader() {
  const day = Math.min(state.dayIndex + 1, TOTAL_DAYS);
  elStatus.textContent = `День ${day}/${TOTAL_DAYS}   Жизни: ${hearts()}   Очки: ${state.score}`;
}

function setHint(text) {
  elHint.textContent = text || "";
}

function setChoices(options) {
  if (!options || !options.length) {
    elChoices.innerHTML = "";
    return;
  }
  elChoices.innerHTML = options
    .map((opt, idx) => `<div>${idx + 1}) ${opt}</div>`)
    .join("");
}

function startGame() {
  state.mode = "start";
  state.dayIndex = 0;
  state.lives = MAX_LIVES;
  state.score = 0;
  state.lineIndex = 0;

  elGuestName.textContent = "Гость";
  showStatusHeader();
  clearScreen();

  elDialog.textContent =
    "BAR / 7 NIGHTS\n" +
    "Пиксельная текстовая игра о бармене и гостях.\n\n" +
    "Управление:\n" +
    "  Enter / Пробел — следующий шаг\n" +
    "  1 / 2 / 3     — выбор варианта\n\n" +
    "У тебя 3 жизни. Ошибка — минус жизнь.\n" +
    "Угадал гостя — получаешь очки.\n\n" +
    "Нажми Enter, чтобы начать первую ночь.";

  setChoices([]);
  setHint("Enter / пробел — начать");
}

function startDay() {
  const guest = guests[state.dayIndex];

  state.mode = "dialog";
  state.lineIndex = 0;

  elGuestName.textContent = "Гость";
  showStatusHeader();
  clearScreen();

  println(guest.title + "\n");
  println(guest.intro + "\n");
  setChoices([]);
  setHint("Enter / пробел — продолжить диалог");
}

function showNextDialogLine() {
  const guest = guests[state.dayIndex];

  if (state.lineIndex === 0) {
    // первый реальный репликовый шаг — перерисовываем окно
    clearScreen();
    println(guest.title + "\n");
  }

  if (state.lineIndex < guest.dialog.length) {
    println(guest.dialog[state.lineIndex]);
    state.lineIndex++;

    if (state.lineIndex === guest.dialog.length) {
      println("\n");
      setHint("Enter / пробел — попытаться угадать гостя");
    }
  } else {
    startGuess();
  }
}

function startGuess() {
  const guest = guests[state.dayIndex];
  state.mode = "guess";

  clearScreen();
  showStatusHeader();

  elDialog.textContent = "Кто перед тобой?\n";
  setChoices(guest.options);
  setHint("Нажми 1, 2 или 3, чтобы выбрать.");
}

function handleGuess(optionIndex) {
  const guest = guests[state.dayIndex];
  state.mode = "result";

  clearScreen();
  showStatusHeader();

  if (optionIndex === guest.correctIndex) {
    state.score += 2;
    println("✔ Верно. Ты угадал.\n");
    println(guest.reveal);
    println("\n+2 очка.");
  } else {
    state.lives -= 1;
    println("✖ Неверно. Ты ошибся.\n");
    println(guest.reveal);
    println("\n-1 жизнь.");
  }

  setChoices([]);

  if (state.lives <= 0) {
    println("\nУ тебя больше не осталось жизней.");
    setHint("Enter / пробел — увидеть финал.");
    state.mode = "ending_dead";
  } else if (state.dayIndex === TOTAL_DAYS - 1) {
    println("\nЭто была последняя ночь.");
    setHint("Enter / пробел — увидеть финал.");
    state.mode = "ending";
  } else {
    setHint("Enter / пробел — перейти к следующей ночи.");
  }
}

function showEnding(deadEarly = false) {
  clearScreen();
  showStatusHeader();
  setChoices([]);

  println("Финал истории:\n");

  if (deadEarly) {
    println(
      "Ты выгорел раньше, чем закончилась неделя.\n" +
      "Где-то между гостями, сменами и пустыми бокалами бар перестал быть убежищем.\n" +
      "Иногда важно не только слушать других, но и признать, что устал сам.\n\n" +
      "Когда-нибудь ты ещё вернёшься за стойку. Но не сегодня.\n"
    );
  } else if (state.score >= 10) {
    println(
      "К концу седьмой ночи ты начал видеть людей насквозь.\n" +
      "Гости уходят, оставляя на стойке не только деньги, но и доверие.\n" +
      "Бар живёт своей жизнью, а ты — её тихий дирижёр.\n\n" +
      "Это уже не просто работа. Это твоё место силы.\n"
    );
  } else if (state.score >= 6) {
    println(
      "Ты иногда ошибался, но чаще попадал в точку.\n" +
      "Гости возвращаются, приводят друзей и новые истории.\n" +
      "Бар стал местом, где можно быть собой — и для них, и для тебя.\n\n" +
      "Не идеально, но честно. А честности почти всегда хватает.\n"
    );
  } else {
    println(
      "Неделя закончилась, а в голове всё ещё шумят голоса гостей.\n" +
      "Многие остались для тебя загадкой.\n" +
      "Хорошо мешать напитки — не значит всегда понимать людей.\n\n" +
      "Но, может быть, не все истории нужно разгадать до конца.\n"
    );
  }

  println(`\n[Твои очки: ${state.score}]`);
  println("\nСпасибо за игру.");

  setHint("Enter / пробел — начать заново.");
  state.mode = "restart";
}

function onKeyDown(e) {
  if (e.key === "Tab") return;
  e.preventDefault();

  if (state.mode === "start") {
    if (e.key === "Enter" || e.key === " ") {
      state.dayIndex = 0;
      state.lives = MAX_LIVES;
      state.score = 0;
      startDay();
    }
    return;
  }

  if (state.mode === "dialog") {
    if (e.key === "Enter" || e.key === " ") {
      showNextDialogLine();
    }
    return;
  }

  if (state.mode === "guess") {
    if (["1", "2", "3"].includes(e.key)) {
      const idx = parseInt(e.key, 10) - 1;
      handleGuess(idx);
    }
    return;
  }

  if (state.mode === "result") {
    if (e.key === "Enter" || e.key === " ") {
      if (state.lives <= 0) {
        showEnding(true);
      } else if (state.dayIndex === TOTAL_DAYS - 1) {
        showEnding(false);
      } else {
        state.dayIndex++;
        startDay();
      }
    }
    return;
  }

  if (state.mode === "ending_dead") {
    if (e.key === "Enter" || e.key === " ") {
      showEnding(true);
    }
    return;
  }

  if (state.mode === "ending") {
    if (e.key === "Enter" || e.key === " ") {
      showEnding(false);
    }
    return;
  }

  if (state.mode === "restart") {
    if (e.key === "Enter" || e.key === " ") {
      startGame();
    }
    return;
  }

  if (state.mode === "done") {
    if (e.key === "Enter" || e.key === " ") {
      startGame();
    }
  }
}

window.addEventListener("keydown", onKeyDown);

// старт
startGame();
