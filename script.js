//datos iniciales
let players = [];
let myTeam = JSON.parse(localStorage.getItem("inazumaTeamFull")) || [];
let state = {
  stats: ["Kick_Lv50_0"],
  pos: "ALL",
  elem: "ALL",
  query: "",
};

// librería papaParse (no se como funciona, simplemente busqué una librería para trabajar con csv porque es asi como tengo los datos)
Papa.parse("./datos.csv", {
  download: true,
  header: true,
  complete: function (r) {
    players = r.data.filter((p) => p.name_0);
    renderTiers();
    renderField();
  },
});

//suma las stats seleccioandas para el filtro
const getSum = (p) =>
  state.stats.reduce((acc, s) => acc + parseInt(p[s] || 0), 0);

//cambio de pestaña
function openTab(id) {
  document
    .querySelectorAll(".tab-content")
    .forEach((c) => c.classList.remove("active"));
  document
    .querySelectorAll(".tab-btn")
    .forEach((b) => b.classList.remove("active"));
  document.getElementById(id).classList.add("active");
  event.currentTarget.classList.add("active");
}

// carga las tierlist
function renderTiers() {
  const container = document.getElementById("tierContainer");
  container.innerHTML = "";

  let filtered = players
    .filter((p) => {
      const mName = p.name_0.toLowerCase().includes(state.query.toLowerCase());
      const mPos = state.pos === "ALL" || p.Position_0 === state.pos;
      const mElem = state.elem === "ALL" || p.Element_0 === state.elem;
      return mName && mPos && mElem;
    })
    .sort((a, b) => getSum(b) - getSum(a)); // mayor a menor

  //la lista ya viene ordenada, solo hay q separar las tiers
  let tiers = [];
  if (filtered.length > 0) {
    let current = [filtered[0]],
      lastS = getSum(filtered[0]);
    for (let i = 1; i < filtered.length; i++) {
      let s = getSum(filtered[i]);
      if (s < lastS) {
        tiers.push({ sum: lastS, members: current });
        current = [filtered[i]];
        lastS = s;
      } else current.push(filtered[i]);
    }
    tiers.push({ sum: lastS, members: current });
  }

  let startL = tiers[0] && tiers[0].members.length <= 7 ? 0 : 1; //lógica para q solo exista tier 0 si hay 7 players o menos
  //textazo enorme que hizo la IA
  tiers.forEach((t, i) => {
    const num = startL + i;
    const sec = document.createElement("div");
    sec.className = `tier-section`;
    sec.innerHTML = `
                <div style="padding:10px; cursor:pointer; background:${num === 0 ? "#fff9f9" : "#fff"}; border-left:6px solid ${num === 0 ? "#ff4136" : "#555"}; display:flex; justify-content:space-between;" onclick="this.nextElementSibling.style.display = this.nextElementSibling.style.display==='none'?'grid':'none'">
                    <b>TIER ${num} ${num === 0 ? "★" : ""}</b> <span style="font-size:0.7rem; opacity:0.6;">Suma: ${t.sum} | ${t.members.length} Jugadores</span>
                </div>
                <div class="grid" style="padding:10px; display:${i === 0 ? "grid" : "none"}">
                    ${t.members
                      .map(
                        (p) => `
                        <div class="card">
                            <button class="add-btn" onclick="addToTeam('${p.name_0}')">+</button>
                            <img src="${p.image_0}">
                            <div class="badge-container">
                                <span class="badge" style="background:#555">${p.Position_0}</span>
                                <span class="badge bg-${p.Element_0}">${p.Element_0}</span>
                            </div>
                            <div class="player-name">${p.name_0}</div>
                            <table class="stats-table">
                                ${statRow("Tir", p.Kick_Lv50_0, "Kick_Lv50_0")}
                                ${statRow("Con", p.Control_Lv50_0, "Control_Lv50_0")}
                                ${statRow("Int", p.Intelligence_Lv50_0, "Intelligence_Lv50_0")}
                                ${statRow("Téc", p.Technique_Lv50_0, "Technique_Lv50_0")}
                                ${statRow("Pre", p.Pressure_Lv50_0, "Pressure_Lv50_0")}
                                ${statRow("Fís", p.Physical_Lv50_0, "Physical_Lv50_0")}
                                ${statRow("Agi", p.Agility_Lv50_0, "Agility_Lv50_0")}
                            </table>
                        </div>
                    `,
                      )
                      .join("")}
                </div>`;
    container.appendChild(sec);
  });
}

function statRow(label, val, key) {
  const active = state.stats.includes(key);
  return `<tr><td>${label}</td><td class="stat-val ${active ? "highlight-stat" : ""}">${val}</td></tr>`;
}

// el equipo (quiero añadir que haya formaciones para elegir, pero esto era mas sencillo y asi cada uno arrastra y coloca los jugadores como quiere)
function addToTeam(name) {
  if (myTeam.length >= 16) return alert("Máximo 16 jugadores");
  if (myTeam.find((x) => x.name === name)) return alert("Ya está en el equipo");
  const p = players.find((x) => x.name_0 === name);
  myTeam.push({ name: p.name_0, img: p.image_0, x: 50, y: 80 });
  save();
}

//lo guardamos en localstorage para que quede ahi aun efrescando
function save() {
  localStorage.setItem("inazumaTeamFull", JSON.stringify(myTeam));
  renderField();
  document.getElementById("team-count").innerText = myTeam.length;
}

function clearTeam() {
  myTeam = [];
  save();
}

// No se como funciona esto, yo se lo pedi a la IA y a volar
function renderField() {
  const field = document.getElementById("field");
  const bench = document.getElementById("bench");
  field.innerHTML = "";
  bench.innerHTML = "";

  myTeam.forEach((p, i) => {
    if (i < 11) {
      // Titulares en el campo
      const el = document.createElement("div");
      el.className = "player-on-field";
      el.style.left = p.x + "%";
      el.style.top = p.y + "%";
      el.innerHTML = `<div class="remove-trigger" onclick="removePlayer(${i})">X</div><img src="${p.img}"><span class="name">${p.name}</span>`;

      // Eventos de arrastrar
      el.onmousedown = (e) => {
        let moveX = e.clientX,
          moveY = e.clientY;
        document.onmousemove = (e) => {
          const rect = field.getBoundingClientRect();
          let newX = ((e.clientX - rect.left) / rect.width) * 100;
          let newY = ((e.clientY - rect.top) / rect.height) * 100;
          p.x = Math.max(5, Math.min(95, newX));
          p.y = Math.max(5, Math.min(95, newY));
          el.style.left = p.x + "%";
          el.style.top = p.y + "%";
        };
        document.onmouseup = () => {
          document.onmousemove = null;
          localStorage.setItem("inazumaTeamFull", JSON.stringify(myTeam));
        };
      };
      field.appendChild(el);
    } else {
      // Suplentes en el banco
      const bSlot = document.createElement("div");
      bSlot.style = "text-align:center; position:relative;";
      bSlot.innerHTML = `<div class="remove-trigger" onclick="removePlayer(${i})">X</div><img src="${p.img}" style="width:40px; border-radius:50%; background:white; border:1px solid #999;"><br><span style="font-size:0.5rem;">${p.name}</span>`;
      bench.appendChild(bSlot);
    }
  });
  document.getElementById("team-count").innerText = myTeam.length;
}

function removePlayer(i) {
  myTeam.splice(i, 1);
  save();
}

// Handlers de filtros
document.getElementById("search").addEventListener("input", (e) => {
  state.query = e.target.value;
  renderTiers();
});

function bindFilters(selector, key) {
  document.querySelectorAll(selector).forEach((btn) => {
    btn.addEventListener("click", (e) => {
      if (selector === ".btn-stat") {
        const s = e.target.dataset.stat;
        if (state.stats.includes(s))
          //si ya está la stat en la q hacemos click en nuestro array, la quitamos del array (unselect)
          state.stats = state.stats.filter((x) => x !== s);
        else state.stats.push(s); //si no está la stat la añadimos al array (select)
        e.target.classList.toggle("active"); //lo mismo con la clase active, si estaba, la quitamos, si no la ponemos (toggle)
      } else {
        document
          .querySelectorAll(selector)
          .forEach((b) => b.classList.remove("active")); //esto es para el resto de botones, como no queremos seleccion multiple quitamos activede todos los botones
        e.target.classList.add("active"); // y activamos active en el que se ha clicado
        state[key] = e.target.dataset.val;
      }
      renderTiers();
    });
  });
}

bindFilters(".btn-stat", "stats");
bindFilters(".btn-pos", "pos");
bindFilters(".btn-elem", "elem");
