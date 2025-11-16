// js/game.js

const elGame      = document.getElementById("game");
const elStatus    = document.getElementById("status");
const elDialog    = document.getElementById("dialog-text");
const elChoices   = document.getElementById("choices");
const elHint      = document.getElementById("hint");
const elGuestName = document.getElementById("guest-name");
const elBartender = document.querySelector(".sprite-bartender");
const elGuestSprite = document.querySelector(".sprite-guest");

// Система анимаций и эффектов
let typingTimeout = null;
let currentTypingText = "";
let typingIndex = 0;
let isTyping = false;

const state = {
  dayIndex: 0,
  lives: MAX_LIVES,
  score: 0,
  hints: 3, // Подсказки
  streak: 0, // Серия правильных ответов
  bonuses: [], // Активные бонусы
  achievements: [], // Достижения
  mode: "intro", // start | dialog | guess | result | ending | ending_dead | restart | done
  lineIndex: 0,
  usedHints: 0
};

function hearts() {
  return "♥".repeat(state.lives) + "♡".repeat(MAX_LIVES - state.lives);
}

function clearScreen() {
  stopTyping();
  elDialog.textContent = "";
  elChoices.innerHTML = "";
  elHint.textContent = "";
}

function stopTyping() {
  if (typingTimeout) {
    clearTimeout(typingTimeout);
    typingTimeout = null;
  }
  isTyping = false;
  typingIndex = 0;
}

// Анимация печати текста
function typeText(text, callback = null, speed = 30) {
  stopTyping();
  currentTypingText = text;
  typingIndex = 0;
  isTyping = true;
  elDialog.textContent = "";
  
  function typeChar() {
    if (typingIndex < currentTypingText.length) {
      const char = currentTypingText[typingIndex];
      elDialog.textContent += char;
      typingIndex++;
      typingTimeout = setTimeout(typeChar, char === "\n" ? speed * 2 : speed);
    } else {
      isTyping = false;
      if (callback) callback();
    }
  }
  
  typeChar();
}

function println(text = "", instant = false) {
  if (instant || !isTyping) {
    elDialog.textContent += text + "\n";
  } else {
    // Если уже идет печать, добавляем в очередь
    const current = elDialog.textContent;
    stopTyping();
    typeText(current + text + "\n");
  }
}

function showStatusHeader() {
  const day = Math.min(state.dayIndex + 1, TOTAL_DAYS);
  const hintsText = state.hints > 0 ? `   Подсказки: ${"💡".repeat(state.hints)}` : "";
  const streakText = state.streak > 0 ? `   Серия: ${state.streak}🔥` : "";
  elStatus.textContent = `День ${day}/${TOTAL_DAYS}   Жизни: ${hearts()}   Очки: ${state.score}${hintsText}${streakText}`;
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
    .map((opt, idx) => `<div class="choice" data-index="${idx}">${idx + 1}) ${opt}</div>`)
    .join("");
  
  // Добавляем анимацию появления
  setTimeout(() => {
    document.querySelectorAll(".choice").forEach((el, i) => {
      el.style.opacity = "0";
      el.style.transform = "translateY(10px)";
      setTimeout(() => {
        el.style.transition = "all 0.3s ease";
        el.style.opacity = "1";
        el.style.transform = "translateY(0)";
      }, i * 100);
    });
  }, 50);
}

function animateSprite(sprite, animation = "idle") {
  if (!sprite) return;
  sprite.classList.remove("animate-blink", "animate-happy", "animate-sad", "animate-think");
  if (animation !== "idle") {
    sprite.classList.add(`animate-${animation}`);
  }
}

function createParticles(x, y, color = "#ff0000", count = 5) {
  for (let i = 0; i < count; i++) {
    const particle = document.createElement("div");
    particle.className = "particle";
    
    // Используем getBoundingClientRect для точных координат
    const rect = elGuestSprite ? elGuestSprite.getBoundingClientRect() : { left: x, top: y };
    const centerX = x || (rect.left + rect.width / 2);
    const centerY = y || (rect.top + rect.height / 2);
    
    particle.style.left = centerX + "px";
    particle.style.top = centerY + "px";
    particle.style.backgroundColor = color;
    document.body.appendChild(particle);
    
    const angle = (Math.PI * 2 * i) / count;
    const velocity = 50 + Math.random() * 30;
    const vx = Math.cos(angle) * velocity;
    const vy = Math.sin(angle) * velocity;
    
    particle.style.setProperty("--vx", vx + "px");
    particle.style.setProperty("--vy", vy + "px");
    
    setTimeout(() => particle.remove(), 800);
  }
}

function startGame() {
  state.mode = "start";
  state.dayIndex = 0;
  state.lives = MAX_LIVES;
  state.score = 0;
  state.lineIndex = 0;
  state.hints = 3;
  state.streak = 0;
  state.bonuses = [];
  state.achievements = [];
  state.usedHints = 0;

  elGuestName.textContent = "Гость";
  animateSprite(elBartender, "idle");
  animateSprite(elGuestSprite, "idle");
  showStatusHeader();
  clearScreen();

  const introText =
    "BAR / 7 NIGHTS\n" +
    "Пиксельная текстовая игра о бармене и гостях.\n\n" +
    "Управление:\n" +
    "  Enter / Пробел — следующий шаг\n" +
    "  1 / 2 / 3     — выбор варианта\n" +
    "  H              — использовать подсказку\n\n" +
    "У тебя 3 жизни. Ошибка — минус жизнь.\n" +
    "Угадал гостя — получаешь очки.\n" +
    "Серия правильных ответов даёт бонусы!\n\n" +
    "Нажми Enter, чтобы начать первую ночь.";

  typeText(introText);
  setChoices([]);
  setHint("Enter / пробел — начать");
}

function startDay() {
  const guest = guests[state.dayIndex];

  state.mode = "dialog";
  state.lineIndex = 0;

  // Анимация появления гостя
  animateSprite(elGuestSprite, "idle");
  elGuestSprite.style.opacity = "0";
  elGuestSprite.style.transform = "translateX(50px)";
  setTimeout(() => {
    elGuestSprite.style.transition = "all 0.5s ease";
    elGuestSprite.style.opacity = "1";
    elGuestSprite.style.transform = "translateX(0)";
  }, 100);

  elGuestName.textContent = guest.name || "Гость";
  showStatusHeader();
  clearScreen();

  const introText = guest.title + "\n\n" + guest.intro + "\n";
  typeText(introText, () => {
    setChoices([]);
    setHint("Enter / пробел — продолжить диалог");
  });
}

function showNextDialogLine() {
  if (isTyping) {
    // Пропустить анимацию печати
    stopTyping();
    elDialog.textContent = currentTypingText;
    return;
  }

  const guest = guests[state.dayIndex];

  if (state.lineIndex === 0) {
    // первый реальный репликовый шаг — перерисовываем окно
    clearScreen();
    typeText(guest.title + "\n\n");
  }

  if (state.lineIndex < guest.dialog.length) {
    const line = guest.dialog[state.lineIndex];
    
    // Анимация персонажей в зависимости от реплики
    if (line.startsWith("Гость:")) {
      animateSprite(elGuestSprite, "blink");
    } else if (line.startsWith("Бармен:")) {
      animateSprite(elBartender, "blink");
    }
    
    typeText(line + "\n", () => {
      state.lineIndex++;
      if (state.lineIndex === guest.dialog.length) {
        setHint("Enter / пробел — попытаться угадать гостя  |  H — подсказка");
      }
    });
  } else {
    startGuess();
  }
}

function startGuess() {
  const guest = guests[state.dayIndex];
  state.mode = "guess";

  clearScreen();
  showStatusHeader();
  animateSprite(elBartender, "think");

  typeText("Кто перед тобой?\n", () => {
    setChoices(guest.options);
    setHint("Нажми 1, 2 или 3, чтобы выбрать.  |  H — подсказка");
  });
}

function useHint() {
  if (state.mode !== "guess" || state.hints <= 0) return;
  
  const guest = guests[state.dayIndex];
  state.hints--;
  state.usedHints++;
  showStatusHeader();
  
  // Убираем один неправильный вариант
  const wrongOptions = guest.options
    .map((opt, idx) => idx !== guest.correctIndex ? idx : null)
    .filter(idx => idx !== null);
  
  if (wrongOptions.length > 0) {
    const toRemove = wrongOptions[Math.floor(Math.random() * wrongOptions.length)];
    const choiceEl = document.querySelector(`.choice[data-index="${toRemove}"]`);
    if (choiceEl) {
      choiceEl.style.transition = "all 0.3s ease";
      choiceEl.style.opacity = "0";
      choiceEl.style.transform = "translateX(-20px)";
      setTimeout(() => choiceEl.remove(), 300);
    }
  }
  
  if (elGuestSprite) {
    const rect = elGuestSprite.getBoundingClientRect();
    createParticles(rect.left + rect.width / 2, rect.top + rect.height / 2, "#ffff00", 3);
  }
  setHint("Подсказка использована! Нажми 1, 2 или 3, чтобы выбрать.");
}

function handleGuess(optionIndex) {
  const guest = guests[state.dayIndex];
  state.mode = "result";

  clearScreen();
  showStatusHeader();

  const rect = elGuestSprite.getBoundingClientRect();
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;

  if (optionIndex === guest.correctIndex) {
    state.score += 2;
    state.streak++;
    
    // Бонусы за серию
    let bonusText = "";
    if (state.streak === 3) {
      state.score += 1;
      bonusText = "\n🔥 Серия из 3! +1 бонусное очко!";
      checkAchievement("streak_3");
    } else if (state.streak === 5) {
      state.score += 2;
      state.hints += 1;
      bonusText = "\n🔥🔥 Серия из 5! +2 очка и подсказка!";
      checkAchievement("streak_5");
    } else if (state.streak === 7) {
      state.score += 3;
      state.lives = Math.min(state.lives + 1, MAX_LIVES);
      bonusText = "\n🔥🔥🔥 ИДЕАЛЬНАЯ СЕРИЯ! +3 очка и жизнь!";
      checkAchievement("streak_7");
    }
    
    animateSprite(elBartender, "happy");
    animateSprite(elGuestSprite, "happy");
    createParticles(centerX, centerY, "#00ff00", 8);
    
    typeText("✔ Верно. Ты угадал.\n\n" + guest.reveal + "\n\n+2 очка." + bonusText);
  } else {
    state.lives -= 1;
    state.streak = 0;
    
    animateSprite(elBartender, "sad");
    animateSprite(elGuestSprite, "sad");
    createParticles(centerX, centerY, "#ff0000", 5);
    
    typeText("✖ Неверно. Ты ошибся.\n\n" + guest.reveal + "\n\n-1 жизнь.");
  }

  setChoices([]);

  if (state.lives <= 0) {
    setTimeout(() => {
      println("\nУ тебя больше не осталось жизней.", true);
      setHint("Enter / пробел — увидеть финал.");
      state.mode = "ending_dead";
    }, 2000);
  } else if (state.dayIndex === TOTAL_DAYS - 1) {
    setTimeout(() => {
      println("\nЭто была последняя ночь.", true);
      setHint("Enter / пробел — увидеть финал.");
      state.mode = "ending";
    }, 2000);
  } else {
    setTimeout(() => {
      setHint("Enter / пробел — перейти к следующей ночи.");
    }, 2000);
  }
}

function checkAchievement(id) {
  if (state.achievements.includes(id)) return;
  
  state.achievements.push(id);
  const achievements = {
    streak_3: "🔥 Горячая серия",
    streak_5: "🔥🔥 Мастер интуиции",
    streak_7: "🔥🔥🔥 Легенда бара",
    perfect_game: "⭐ Идеальная игра",
    no_hints: "🧠 Без подсказок"
  };
  
  const name = achievements[id];
  if (name) {
    showAchievement(name);
  }
}

function showAchievement(name) {
  const achievement = document.createElement("div");
  achievement.className = "achievement-popup";
  achievement.textContent = "🏆 " + name;
  document.body.appendChild(achievement);
  
  setTimeout(() => {
    achievement.classList.add("show");
  }, 10);
  
  setTimeout(() => {
    achievement.classList.remove("show");
    setTimeout(() => achievement.remove(), 500);
  }, 3000);
}

function showEnding(deadEarly = false) {
  clearScreen();
  showStatusHeader();
  setChoices([]);
  animateSprite(elBartender, "idle");
  animateSprite(elGuestSprite, "idle");

  let endingText = "Финал истории:\n\n";

  if (deadEarly) {
    endingText +=
      "Ты выгорел раньше, чем закончилась неделя.\n" +
      "Где-то между гостями, сменами и пустыми бокалами бар перестал быть убежищем.\n" +
      "Иногда важно не только слушать других, но и признать, что устал сам.\n\n" +
      "Когда-нибудь ты ещё вернёшься за стойку. Но не сегодня.\n";
  } else if (state.score >= 14) {
    endingText +=
      "К концу седьмой ночи ты начал видеть людей насквозь.\n" +
      "Гости уходят, оставляя на стойке не только деньги, но и доверие.\n" +
      "Бар живёт своей жизнью, а ты — её тихий дирижёр.\n\n" +
      "Это уже не просто работа. Это твоё место силы.\n";
    checkAchievement("perfect_game");
  } else if (state.score >= 10) {
    endingText +=
      "Ты иногда ошибался, но чаще попадал в точку.\n" +
      "Гости возвращаются, приводят друзей и новые истории.\n" +
      "Бар стал местом, где можно быть собой — и для них, и для тебя.\n\n" +
      "Не идеально, но честно. А честности почти всегда хватает.\n";
  } else {
    endingText +=
      "Неделя закончилась, а в голове всё ещё шумят голоса гостей.\n" +
      "Многие остались для тебя загадкой.\n" +
      "Хорошо мешать напитки — не значит всегда понимать людей.\n\n" +
      "Но, может быть, не все истории нужно разгадать до конца.\n";
  }

  if (state.usedHints === 0 && !deadEarly) {
    checkAchievement("no_hints");
  }

  endingText += `\n[Твои очки: ${state.score}]`;
  if (state.achievements.length > 0) {
    endingText += `\n[Достижения: ${state.achievements.length}]`;
  }
  endingText += "\n\nСпасибо за игру.";

  typeText(endingText);
  setHint("Enter / пробел — начать заново.");
  state.mode = "restart";
}

function onKeyDown(e) {
  if (e.key === "Tab") return;
  e.preventDefault();

  // Подсказка доступна в режиме угадывания
  if ((e.key === "h" || e.key === "H" || e.key === "х" || e.key === "Х") && state.mode === "guess") {
    useHint();
    return;
  }

  if (state.mode === "start") {
    if (e.key === "Enter" || e.key === " ") {
      state.dayIndex = 0;
      state.lives = MAX_LIVES;
      state.score = 0;
      state.streak = 0;
      state.hints = 3;
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
      const choiceEl = document.querySelector(`.choice[data-index="${idx}"]`);
      if (choiceEl) {
        handleGuess(idx);
      }
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
