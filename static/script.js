let claims = [];
let currentTopic = "All",
  currentSource = "All",
  currentIdea = "All";

const stage = document.getElementById("dot-stage"),
  steps = document.querySelectorAll(".step"),
  visibleCount = document.getElementById("visible-count"),
  visualTitle = document.getElementById("visual-title"),
  legend = document.getElementById("legend"),
  preview = document.getElementById("claim-preview"),
  topicButtons = document.getElementById("topic-buttons"),
  sourceFilter = document.getElementById("source-filter"),
  ideaFilter = document.getElementById("idea-filter"),
  searchFilter = document.getElementById("search-filter"),
  machineSlips = document.getElementById("machine-slips"),
  machineCount = document.getElementById("machine-count"),
  selectedClaims = document.getElementById("selected-claims");

const topicColors = {
    "Election Fraud": "#1d4e89",
    Immigration: "#c1121f",
    "COVID-19": "#171717",
    Economy: "#e5ad2c",
    Other: "#6f685f",
  };

  const ideaColors = {
    "Border Wall": "#c1121f",
    "Stolen/Rigged Election": "#1d4e89",
    "China/Origins of Virus": "#171717",
    "Stock Market Records": "#e5ad2c",
    Other: "#9b948b",
  };

  const sourceColors = {
    Speech: "#6f685f",
    Tweet: "#1d4e89",
    Interview: "#c1121f",
    "Press Conference": "#e5ad2c",
  };

  const CLUSTER_WIDTH_RATIO = 0.62;

  const topicDotSize = {
    Immigration: "18px",
    "Election Fraud" : "16px",
    "COVID-19" : "13px",
    Economy : "11px"
  };

  const ideaDotSizes = {
    "Border Wall" : "22px", 
    "Stolen/Rigged Election": "18px",
    "China/Origins of Virus" : "15px",
    "Stock Market Records" : "13px"
  };

  const sourceDotSizes = {
    Speech: "20px",
    Tweet: "15px",
    Interview: "12px",
    "Press Conference": "10px",
  };

  function normaliseSource(s){
    if (!s) return "Speech";
    if (["Statement", "Other", "Debate"].includes(s)) return "Speech";
    return s;
  }

  fetch("/api/claims")
    .then((r) => r.json())
    .then((data) => {
        claims = data.map((claim,index) => ({
            ...claim,
            id: claim.id || index, 
            topic: normalizeTopic(claim.topic),
            sourceType: normaliseSource(claim.sourceType),
            idea: claim.repeatedIdea || claim.idea || "Other",
        }));
        createDots();
        buildControls();
        updateVisual("chaos");
        renderMachine();
        renderSelectedClaims();
        setupScroll();
    });
function normalizeTopic(topic) {
    if(!topic) return "Other";
    if (topic.toLowerCase() === "election fraud") return "Election Fraud";
    return topic;
}

function createDots() {
    stage.innerHTML = "";
    claims.forEach((claim, index) => {
      const dot = document.createElement("button");
      dot.className = "dot";
      dot.type = "button";
      dot.dataset.index = index;
      dot.style.setProperty("--color", topicColors[claim.topic] || topicColors.Other);
      dot.style.setProperty("--size", "8px");
      dot.style.setProperty("--scale", "1");
      dot.addEventListener("click", () => showPreview(claim));
      stage.appendChild(dot);
    });
}

function updateVisual(view) {
    const dots = [...document.querySelectorAll(".dot")];
    const fullWidth = stage.clientWidth;
    const fullHeight = stage.clientHeight;
    const clusterWidth = view === "chaos" ? fullWidth : fullWidth * CLUSTER_WIDTH_RATIO;


const titleMap = {
    chaos: "The archive",
    topic: "Organized by topic",
    source: "Organized by source", 
    idea: "Organized by repeated idea"
};

visualTitle.textContent = titleMap[view];
visibleCount.textContent = `${claims.length} claims of 30,575`;

dots.forEach((dot, index) => {
    const claim = claims[index];
    const p = getPosition(claim, index, view, clusterWidth, fullHeight);
    dot.style.setProperty("--x", `${p.x}px`);
    dot.style.setProperty("--y", `${p.y}px`);
    dot.style.setProperty("--scale", p.scale);
    dot.style.setProperty("--size", p.size);
    dot.style.setProperty("--color", p.color);
  });

  renderLegend(view);
}

function getPosition(claim, index, view, width, height) {
    if (view === "chaos")
        return {
            x: random(index * 9) * (width - 18),
            y: random(index * 17) * (height - 18),
            scale: 1,
            size: "7px",
            color: topicColors[claim.topic] || topicColors.Other,
        }
    if (view === "topic") {
        const p = clusterPosition(
        claim.topic,
        ["Election Fraud", "Immigration", "COVID-19", "Economy"],
        claim.id, width, height, 2
        );
        return { ...p, size: topicDotSize[claim.topic] || "11px", color: topicColors[claim.topic] || topicColors.Other };
    }
    if (view === "source") {
        const p = clusterPosition(
          claim.sourceType,
          ["Speech", "Tweet", "Interview", "Press Conference"],
          claim.id, width, height, 2
        );
        return {
          ...p,
          size: sourceDotSizes[claim.sourceType] || "8px",
          color: sourceColors[claim.sourceType] || "#6f685f",
        };
    }
    if (view === "idea") {
        const p = clusterPosition(
          claim.idea,
          ["Border Wall", "Stolen/Rigged Election", "China/Origins of Virus", "Stock Market Records"],
          claim.id, width, height, 2
        );
        return {
          ...p,
          size: ideaDotSizes[claim.idea] || "10px",
          color: ideaColors[claim.idea] || ideaColors.Other,
        };
    }
}

function clusterPosition(group, groups, seed, width, height, columns) {
    const index = Math.max(groups.indexOf(group), 0);
    const cols = columns || 2;
    const rows = Math.ceil(groups.length / cols);
    const col = index % cols;
    const row = Math.floor(index / cols);
  
    const padX = width * 0.08;
    const padY = height * 0.06;
    const cellWidth = (width - padX * 2) / cols;
    const cellHeight = (height - padY * 2) / rows;
    const centerX = padX + col * cellWidth + cellWidth / 2;
    const centerY = padY + row * cellHeight + cellHeight / 2;
  
    const spread = Math.min(cellWidth, cellHeight) * 0.44;
  
    return {
      x: centerX + (random(seed * 5) - 0.5) * 2 * spread,
      y: centerY + (random(seed * 11) - 0.5) * 2 * spread,
      scale: 1,
    };
}

function renderLegend(view) {
    if (view === "chaos") {
      legend.innerHTML = "";
      legend.style.display = "none";
      return;
    }
  
    legend.style.display = "flex";
  
    let items = [];
    let colorMap = {};
  
    if (view === "idea") {
      items = ["Border Wall", "Stolen/Rigged Election", "China/Origins of Virus", "Stock Market Records"];
      colorMap = ideaColors;
    } else if (view === "source") {
      items = ["Speech", "Tweet", "Interview", "Press Conference"];
      colorMap = sourceColors;
    } else {
      items = ["Election Fraud", "Immigration", "COVID-19", "Economy"];
      colorMap = topicColors;
    }
  
    legend.innerHTML = items
      .map((item) => {
        const color = colorMap[item] || "#9b948b";
        return `<span class="legend-item"><span class="legend-dot" style="--color:${color}"></span>${item}</span>`;
      })
      .join("");
}

function showPreview(claim) {
    preview.innerHTML = `
      <p class="preview-label">${claim.topic} · ${claim.sourceType} · ${claim.idea}</p>
      <h3>"${escapeHTML(claim.claim || "")}"</h3>
      <p>${claim.explanation ? escapeHTML(claim.explanation) : "No explanation added yet."}</p>
    `;
}

function setupScroll() {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            steps.forEach((s) => s.classList.remove("active"));
            entry.target.classList.add("active");
            updateVisual(entry.target.dataset.view);
          }
        });
      },
      { threshold: 0.55 }
    );
    steps.forEach((step) => observer.observe(step));
}

function buildControls() {
    const topics = ["All", ...unique(claims.map((c) => c.topic)).sort()],
      sources = ["All", ...unique(claims.map((c) => c.sourceType)).sort()],
      ideas = ["All", ...unique(claims.map((c) => c.idea)).sort()];
  
    topicButtons.innerHTML = topics
      .map(
        (t) =>
          `<button class="topic-button ${t === "All" ? "active" : ""}" data-topic="${t}">${t}</button>`
      )
      .join("");
  
    sourceFilter.innerHTML = sources
      .map((s) => `<option value="${s}">${s}</option>`)
      .join("");
  
    ideaFilter.innerHTML = ideas
      .map((i) => `<option value="${i}">${i}</option>`)
      .join("");
  
    document.querySelectorAll(".topic-button").forEach((button) => {
      button.addEventListener("click", () => {
        document
          .querySelectorAll(".topic-button")
          .forEach((btn) => btn.classList.remove("active"));
        button.classList.add("active");
        currentTopic = button.dataset.topic;
        renderMachine();
      });
    });
  
    sourceFilter.addEventListener("change", () => {
      currentSource = sourceFilter.value;
      renderMachine();
    });
  
    ideaFilter.addEventListener("change", () => {
      currentIdea = ideaFilter.value;
      renderMachine();
    });
  
    searchFilter.addEventListener("input", renderMachine);
}

function filteredClaims() {
    const search = searchFilter.value.toLowerCase();
    return claims.filter((claim) => {
      const topicMatch = currentTopic === "All" || claim.topic === currentTopic,
        sourceMatch = currentSource === "All" || claim.sourceType === currentSource,
        ideaMatch = currentIdea === "All" || claim.idea === currentIdea,
        searchMatch = !search || (claim.claim || "").toLowerCase().includes(search);
      return topicMatch && sourceMatch && ideaMatch && searchMatch;
    });
}

function renderMachine() {
    const visible = filteredClaims(),
      readable = visible.slice(0, 36);
  
    machineCount.textContent = `${visible.length} matching · ${readable.length} shown`;
    machineSlips.innerHTML = readable
      .map(
        (claim) => `
        <article class="machine-slip" style="--topic-color:${topicColors[claim.topic] || topicColors.Other}">
          <strong>${claim.topic} · ${claim.sourceType} · ${claim.idea}</strong>
          "${escapeHTML(claim.claim || "")}"
        </article>`
      )
      .join("");
}

function renderSelectedClaims() {
    const selected = [
      ...claims.filter((c) => c.idea === "Border Wall").slice(0, 2),
      ...claims.filter((c) => c.idea === "Stolen/Rigged Election").slice(0, 2),
      ...claims.filter((c) => c.idea === "China/Origins of Virus").slice(0, 2),
      ...claims.filter((c) => c.idea === "Stock Market Records").slice(0, 2),
    ];
  
    selectedClaims.innerHTML = selected
      .map(
        (claim) => `
        <article class="selected-card">
          <div class="selected-card-top">
            <span>${claim.topic}</span>
            <span>${claim.sourceType}</span>
          </div>
          <h3>"${escapeHTML(claim.claim || "")}"</h3>
        </article>`
      )
      .join("");
}

function unique(values) {
    return [...new Set(values.filter(Boolean))];
  }
  
  function random(seed) {
    const x = Math.sin(seed * 9999) * 10000;
    return x - Math.floor(x);
  }
  
  function escapeHTML(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }
  
  window.addEventListener("resize", () => {
    const active = document.querySelector(".step.active");
    updateVisual(active ? active.dataset.view : "chaos");
  });

