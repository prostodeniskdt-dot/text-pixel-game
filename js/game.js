// js/game.js

const gameEl = document.getElementById("game");

const state = {
  dayIndex: 0,
  lives: MAX_LIVES,
  score: 0,
  mode: "intro",  // intro | dialog | guess | result | ending
  lineIndex: 0
};

function hearts() {
  return "♥".repeat(state.lives) + "♡".repeat(MAX_LIVES - state.lives);
}

function clearScreen() {
  gameEl.textContent = "";
}

function println(text = "") {
  gameEl.textContent += text + "\n";
}

function showStatusHeader() {
  const day = Math.min(state.dayIndex + 1, TOTAL_DAYS);
  println(`День ${day}/${TOTAL_DAYS}   Жизни: ${hearts()}   Очки: ${state.score}`);
  println("─────────────────────────────────────────────");
  println();
}

function startGame() {
  clearScreen();
  println("BAR / 7 NIGHTS");
  println("Пиксельная текстовая игра о бармене и гостях.");
  println();
  println("Управление:");
  println("  Enter / Пробел — следующий шаг");
  println("  1 / 2 / 3     — выбор варианта");
  println();
  println("У тебя 3 жизни. Если ошибёшься — потеряешь жизнь.");
  println("Если угадаешь, кто гость — получишь очки, которые влияют на концовку.");
  println();
  println("Нажми Enter, чтобы начать первую ночь.");
  state.mode = "start";
}

function startDay() {
  const guest = guests[state.dayIndex];
  state.mode = "dialog";
  state.lineIndex = 0;
  clearScreen();
  showStatusHeader();
  println(guest.title);
  println();
  println(guest.intro);
  println();
  println("[Нажми Enter / Пробел, чтобы продолжить диалог]");
}

function showNextDialogLine() {
  const guest = guests[state.dayIndex];

  if (state.lineIndex < guest.dialog.length) {
    if (state.lineIndex === 0) {
      clearScreen();
      showStatusHeader();
      println(guest.title);
      println();
    }
    println(guest.dialog[state.lineIndex]);
    state.lineIndex++;

    if (state.lineIndex === guest.dialog.length) {
      println();
      println("[Нажми Enter / Пробел, чтобы попытаться угадать гостя]");
    }
  } else {
    startGuess();
  }
}

function startGuess() {
  const guest = guests[state.dayIndex];
  state.mode = "guess";
  println();
  println("Кто перед тобой?");
  println();
  guest.options.forEach((opt, idx) => {
    println(`${idx + 1}) ${opt}`);
  });
  println();
  println("Нажми 1, 2 или 3, чтобы выбрать.");
}

function handleGuess(optionIndex) {
  const guest = guests[state.dayIndex];
  state.mode = "result";
  println();

  if (optionIndex === guest.correctIndex) {
    state.score += 2;
    println("✔ Верно. Ты угадал.");
    println(guest.reveal);
    println("+2 очка.");
  } else {
    state.lives -= 1;
    println("✖ Неверно. Ты ошибся.");
    println(guest.reveal);
    println("-1 жизнь.");
  }

  println();
  if (state.lives <= 0) {
    println("У тебя больше не осталось жизней.");
    println("[Нажми Enter, чтобы увидеть, чем всё закончилось.]");
    state.mode = "ending_dead";
  } else if (state.dayIndex === TOTAL_DAYS - 1) {
    println("[Это была последняя ночь. Нажми Enter, чтобы увидеть концовку.]");
    state.mode = "ending";
  } else {
    println("[Нажми Enter, чтобы перейти к следующей ночи.]");
  }
}

function showEnding(deadEarly = false) {
  clearScreen();
  showStatusHeader();
  println("Финал истории:");
  println();

  if (deadEarly) {
    println("Ты выгорел раньше, чем закончилась неделя.");
    println("Где-то между гостями, сменами и пустыми бокалами бар перестал быть убежищем.");
    println("Может, иногда важно не только слушать других, но и признать, что устал сам.");
    println();
    println("Когда-то ты ещё вернёшься за стойку. Но не сегодня.");
    println();
    println(`[Твои очки: ${state.score}]`);
    println();
    println("Спасибо за игру.");
    state.mode = "done";
    return;
  }

  if (state.score >= 10) {
    println("К концу седьмой ночи ты начал видеть людей насквозь.");
    println("Гости уходят, оставляя на стойке не только деньги, но и доверие.");
    println("Бар живёт своей жизнью, а ты — её тихий дирижёр.");
    println();
    println("Ты понимаешь: это не просто работа. Это твоё место силы.");
  } else if (state.score >= 6) {
    println("Ты иногда ошибался, но чаще попадал в точку.");
    println("Гости возвращаются, приносят друзей и истории.");
    println("Бар стал местом, где можно быть собой — и для них, и для тебя.");
    println();
    println("Не идеально, но честно. А этого обычно достаточно.");
  } else {
    println("Неделя закончилась, а в голове всё ещё шумят голоса гостей.");
    println("Многие остались для тебя загадкой.");
    println("Ты понимаешь, что хорошо мешать напитки — не значит всегда понимать людей.");
    println();
    println("Но в этом тоже есть своя правда: не все истории нужно разгадать до конца.");
  }

  println();
  println(`[Твои очки: ${state.score}]`);
  println();
  println("Спасибо за игру. Нажми Enter, чтобы начать заново.");
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
    if (e.key === "1" || e.key === "2" || e.key === "3") {
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
      state.dayIndex = 0;
      state.lives = MAX_LIVES;
      state.score = 0;
      startDay();
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

// старт игры
startGame();
