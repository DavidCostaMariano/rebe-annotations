let annotations = [];

let selectedIndex = null;

// ========================================
// CARREGAR JSON
// ========================================

async function loadAnnotations(){

  try{

    const response =
      await fetch("./annotations.json");

    annotations =
      await response.json();

    renderCards(annotations);

  }catch(error){

    console.error(
      "Erro ao carregar annotations.json",
      error
    );

  }

}

// ========================================
// RENDERIZAR CARDS
// ========================================

function renderCards(list){

  const container =
    document.getElementById("cardsContainer");

  container.innerHTML = "";

  if(list.length === 0){

    container.innerHTML =
      "<p>Nenhuma anotação encontrada.</p>";

    return;
  }

  list.forEach((item, index) => {

    const card =
      document.createElement("div");

    card.className = "card";

    const formattedDate =
      formatDate(item.dataCriacao);

    card.innerHTML = `
      <div class="card-title">
        ${item.nome} - ${item.pedido}
      </div>

      <div class="card-description">
        ${item.descricao}
      </div>

      <div class="card-date">
        Criado em ${formattedDate}
      </div>
    `;

    card.addEventListener("click", () => {
      openDetailsModal(index);
    });

    container.appendChild(card);

  });

}

// ========================================
// MODAL DETALHES
// ========================================

function openDetailsModal(index){

  selectedIndex = index;

  const item = annotations[index];

  document.getElementById("modalTitle")
    .innerText = "Detalhes da Anotação";

  document.getElementById("modalNome")
    .value = item.nome;

  document.getElementById("modalPedido")
    .value = item.pedido;

  document.getElementById("modalDescricao")
    .value = item.descricao;

  document.getElementById("modalOverlay")
    .style.display = "flex";

}

// ========================================
// MODAL NOVA ANOTAÇÃO
// ========================================

function openCreateModal(){

  selectedIndex = null;

  document.getElementById("modalTitle")
    .innerText = "Nova Anotação";

  document.getElementById("modalNome")
    .value = "";

  document.getElementById("modalPedido")
    .value = "";

  document.getElementById("modalDescricao")
    .value = "";

  document.getElementById("modalOverlay")
    .style.display = "flex";

}

// ========================================
// FECHAR MODAL
// ========================================

function closeModal(){

  document.getElementById("modalOverlay")
    .style.display = "none";

}

// ========================================
// SALVAR
// ========================================

function saveAnnotation(){

  const nome =
    document.getElementById("modalNome")
    .value;

  const pedido =
    document.getElementById("modalPedido")
    .value;

  const descricao =
    document.getElementById("modalDescricao")
    .value;

  if(!nome || !pedido || !descricao){

    alert("Preencha todos os campos.");

    return;
  }

  const newAnnotation = {
    nome,
    pedido,
    descricao,
    dataCriacao:
      new Date().toISOString()
  };

  if(selectedIndex === null){

    annotations.push(newAnnotation);

  }else{

    newAnnotation.dataCriacao =
      annotations[selectedIndex].dataCriacao;

    annotations[selectedIndex] =
      newAnnotation;

  }

  renderCards(annotations);

  closeModal();

}

function formatDate(dateString){

  const date =
    new Date(dateString);

  return date.toLocaleDateString("pt-BR")
    + " às "
    + date.toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit"
    });

}


function applyFilters(){

  const searchValue =
    document.getElementById("searchInput")
    .value
    .toLowerCase();

  const dateValue =
    document.getElementById("dateFilter")
    .value;

  const filtered =
    annotations.filter(item => {

      const matchesText =

        item.nome.toLowerCase().includes(searchValue)
        ||
        item.pedido.toLowerCase().includes(searchValue);

      let matchesDate = true;

      if(dateValue){

        const itemDate =
          item.dataCriacao.split("T")[0];

        matchesDate =
          itemDate === dateValue;

      }

      return matchesText && matchesDate;

    });

  renderCards(filtered);

}
// ========================================
// PESQUISA
// ========================================
document
  .getElementById("searchInput")
  .addEventListener("input", applyFilters);

// ========================================
// EVENTOS
// ========================================

document
  .getElementById("closeModalButton")
  .addEventListener("click", closeModal);

document
  .getElementById("newAnnotationButton")
  .addEventListener("click", openCreateModal);

document
  .getElementById("saveButton")
  .addEventListener("click", saveAnnotation);

  document
  .getElementById("dateFilter")
  .addEventListener("change", applyFilters);
// ========================================
// INICIAR
// ========================================

loadAnnotations();


