(function () {
  const board = document.getElementById("board");
  const tray = document.getElementById("tray");
  const countEl = document.getElementById("count");
  const totalEl = document.getElementById("total");
  const winEl = document.getElementById("win");
  const imgUrlInput = document.getElementById("imgUrl");
  const gridSelect = document.getElementById("gridSize");

  const DEFAULT_IMG = "https://picsum.photos/seed/quebracabeca/600/600";
  let gridN = 4;
  let currentImg = DEFAULT_IMG;
  let pieces = []; // {id, correctIndex}
  let placed = {}; // slotIndex -> pieceId

  function buildPuzzle() {
    gridN = parseInt(gridSelect.value, 10);
    currentImg = imgUrlInput.value.trim() || DEFAULT_IMG;
    winEl.classList.remove("show");

    board.style.gridTemplateColumns = `repeat(${gridN}, 1fr)`;
    board.style.gridTemplateRows = `repeat(${gridN}, 1fr)`;
    board.innerHTML = "";
    tray.innerHTML = "";
    placed = {};

    const total = gridN * gridN;
    totalEl.textContent = total;
    countEl.textContent = 0;

    // create slots
    for (let i = 0; i < total; i++) {
      const slot = document.createElement("div");
      slot.className = "slot";
      slot.dataset.index = i;
      addDropHandlers(slot);
      board.appendChild(slot);
    }

    // create pieces data
    pieces = [];
    for (let i = 0; i < total; i++) {
      pieces.push({ id: "p" + i, correctIndex: i });
    }
    shuffleArray(pieces);

    // create piece elements in tray
    pieces.forEach((p) => {
      const el = createPieceEl(p);
      tray.appendChild(el);
    });
  }

  function createPieceEl(p) {
    const el = document.createElement("div");
    el.className = "piece";
    el.draggable = true;
    el.id = p.id;
    el.dataset.correct = p.correctIndex;

    const row = Math.floor(p.correctIndex / gridN);
    const col = p.correctIndex % gridN;
    const pct = 100 * (gridN - 1);

    el.style.backgroundImage = `url('${currentImg}')`;
    el.style.setProperty("--bg-size", gridN * 100 + "%");
    el.style.backgroundPosition = `${gridN === 1 ? 0 : (col * 100) / (gridN - 1)}% ${gridN === 1 ? 0 : (row * 100) / (gridN - 1)}%`;

    el.addEventListener("dragstart", (e) => {
      e.dataTransfer.setData("text/plain", p.id);
      setTimeout(() => (el.style.opacity = "0.3"), 0);
    });
    el.addEventListener("dragend", () => {
      el.style.opacity = "1";
    });

    // touch support (simple tap-to-select / tap-to-place)
    el.addEventListener("click", () => {
      document
        .querySelectorAll(".piece.selected")
        .forEach((s) => s.classList.remove("selected"));
      if (!el.classList.contains("locked")) {
        el.classList.add("selected");
        el.style.outline = "2px solid var(--coral)";
        setTimeout(() => {
          el.style.outline = "";
        }, 800);
      }
    });

    return el;
  }

  function addDropHandlers(slot) {
    slot.addEventListener("dragover", (e) => {
      e.preventDefault();
      slot.classList.add("over");
    });
    slot.addEventListener("dragleave", () => slot.classList.remove("over"));
    slot.addEventListener("drop", (e) => {
      e.preventDefault();
      slot.classList.remove("over");
      const pieceId = e.dataTransfer.getData("text/plain");
      const pieceEl = document.getElementById(pieceId);
      if (!pieceEl) return;
      placePiece(pieceEl, slot);
    });

    // tap-to-place fallback for touch devices
    slot.addEventListener("click", () => {
      const selected = document.querySelector(".piece.selected");
      if (selected) {
        selected.classList.remove("selected");
        placePiece(selected, slot);
      }
    });
  }

  function placePiece(pieceEl, slot) {
    const slotIndex = parseInt(slot.dataset.index, 10);

    // if slot already has a piece, swap back to tray
    if (slot.firstChild) {
      const existing = slot.firstChild;
      tray.appendChild(existing);
      delete placed[slotIndex];
    }

    // if piece was already in another slot, clear that slot
    const prevSlot = pieceEl.parentElement;
    if (prevSlot && prevSlot.classList.contains("slot")) {
      prevSlot.classList.remove("filled", "correct");
      delete placed[parseInt(prevSlot.dataset.index, 10)];
    }

    slot.appendChild(pieceEl);
    slot.classList.add("filled");
    placed[slotIndex] = pieceEl.id;

    const isCorrect = parseInt(pieceEl.dataset.correct, 10) === slotIndex;
    slot.classList.toggle("correct", isCorrect);
    pieceEl.classList.toggle("locked", isCorrect);

    updateProgress();
  }

  function updateProgress() {
    const correctCount = Array.from(board.children).filter((s) =>
      s.classList.contains("correct"),
    ).length;
    countEl.textContent = correctCount;
    if (correctCount === gridN * gridN) {
      winEl.classList.add("show");
    } else {
      winEl.classList.remove("show");
    }
  }

  function shuffleArray(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
  }

  function shuffleTray() {
    // move all pieces back to tray, shuffled
    const allPieces = Array.from(board.querySelectorAll(".piece")).concat(
      Array.from(tray.querySelectorAll(".piece")),
    );
    document.querySelectorAll(".slot").forEach((s) => {
      s.classList.remove("filled", "correct");
    });
    placed = {};
    shuffleArray(allPieces);
    tray.innerHTML = "";
    allPieces.forEach((p) => {
      p.classList.remove("locked", "selected");
      p.style.outline = "";
      tray.appendChild(p);
    });
    updateProgress();
    winEl.classList.remove("show");
  }

  document.getElementById("newGame").addEventListener("click", buildPuzzle);
  document.getElementById("shuffleBtn").addEventListener("click", shuffleTray);

  buildPuzzle();
})();
