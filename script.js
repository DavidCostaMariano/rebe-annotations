const SUPABASE_URL =
  "https://zzzvwxjuznvyncxmuvuc.supabase.co/";

const SUPABASE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp6enZ3eGp1em52eW5jeG11dnVjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEzNzkwMjcsImV4cCI6MjA5Njk1NTAyN30.cO0nIapoBgB5SGHyJkEkk3rLCQZehyX2eXCKZy9GlWM";


const client =
  window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
  );

let annotations = [];

let selectedId = null;

/* ====================================== */
/* CARREGAR ANOTAÇÕES */
/* ====================================== */

async function loadAnnotations(){

  const { data, error } =
    await client
      .from("annotations")
      .select("*")
      .order(
        "data_criacao",
        { ascending:false }
      );

  if(error){

    console.error(
      "Erro ao carregar:",
      error
    );

    return;
  }

  annotations = data;

  applyFilters();

}

/* ====================================== */
/* RENDERIZAR CARDS */
/* ====================================== */

function renderCards(list){

  const container =
    document.getElementById(
      "cardsContainer"
    );

  container.innerHTML = "";

  if(list.length === 0){

    container.innerHTML = `
      <p>Nenhuma anotação encontrada.</p>
    `;

    return;

  }

  list.forEach((item, index) => {

    const card =
      document.createElement("div");

    card.className = "card";

    card.innerHTML = `
      <div class="card-title">
        ${item.nome} - ${item.pedido}
      </div>

      <div class="card-description">
        ${item.descricao}
      </div>

      <div class="card-date">
        Criado em
        ${formatDate(item.data_criacao)}
      </div>
    `;

    card.addEventListener(
      "click",
      () => openDetailsModal(index)
    );

    container.appendChild(card);

  });

}

/* ====================================== */
/* FORMATAR DATA */
/* ====================================== */

function formatDate(dateString){

  const date =
    new Date(dateString);

  return (
    date.toLocaleDateString(
      "pt-BR"
    )
    +
    " às "
    +
    date.toLocaleTimeString(
      "pt-BR",
      {
        hour:"2-digit",
        minute:"2-digit"
      }
    )
  );

}

/* ====================================== */
/* ABRIR MODAL DETALHES */
/* ====================================== */

function openDetailsModal(index){

  const item =
    annotations[index];

  selectedId = item.id;

  document
    .getElementById("modalTitle")
    .innerText =
      "Detalhes da Anotação";

  document
    .getElementById("modalNome")
    .value =
      item.nome;

  document
    .getElementById("modalPedido")
    .value =
      item.pedido;

  document
    .getElementById("modalDescricao")
    .value =
      item.descricao;

  document
    .getElementById("deleteButton")
    .style.display =
      "block";

  document
    .getElementById("modalOverlay")
    .style.display =
      "flex";

}

/* ====================================== */
/* ABRIR MODAL NOVA ANOTAÇÃO */
/* ====================================== */

function openCreateModal(){

  selectedId = null;

  document
    .getElementById("modalTitle")
    .innerText =
      "Nova Anotação";

  document
    .getElementById("modalNome")
    .value = "";

  document
    .getElementById("modalPedido")
    .value = "";

  document
    .getElementById("modalDescricao")
    .value = "";

  document
    .getElementById("deleteButton")
    .style.display =
      "none";

  document
    .getElementById("modalOverlay")
    .style.display =
      "flex";

}

/* ====================================== */
/* FECHAR MODAL */
/* ====================================== */

function closeModal(){

  document
    .getElementById("modalOverlay")
    .style.display =
      "none";

}

/* ====================================== */
/* SALVAR */
/* ====================================== */

async function saveAnnotation(){

  const nome =
    document
      .getElementById("modalNome")
      .value
      .trim();

  const pedido =
    document
      .getElementById("modalPedido")
      .value
      .trim();

  const descricao =
    document
      .getElementById("modalDescricao")
      .value
      .trim();

  if(
    !nome
    ||
    !pedido
    ||
    !descricao
  ){

    alert(
      "Preencha todos os campos."
    );

    return;

  }

  /* ========================= */
  /* NOVA ANOTAÇÃO */
  /* ========================= */

  if(selectedId === null){

    const { error } =
      await client
        .from("annotations")
        .insert([
          {
            nome,
            pedido,
            descricao,
            data_criacao:
              new Date()
          }
        ]);

    if(error){

      console.error(
        "Erro ao salvar:",
        error
      );

      return;

    }

  }

  /* ========================= */
  /* EDITAR */
  /* ========================= */

  else{

    const { error } =
      await client
        .from("annotations")
        .update({
          nome,
          pedido,
          descricao
        })
        .eq(
          "id",
          selectedId
        );

    if(error){

      console.error(
        "Erro ao editar:",
        error
      );

      return;

    }

  }

  closeModal();

  loadAnnotations();

}

/* ====================================== */
/* EXCLUIR */
/* ====================================== */

async function deleteAnnotation(){

  if(selectedId === null){
    return;
  }

  const confirmed =
    confirm(
      "Deseja realmente excluir esta anotação?"
    );

  if(!confirmed){
    return;
  }

  const { error } =
    await client
      .from("annotations")
      .delete()
      .eq(
        "id",
        selectedId
      );

  if(error){

    console.error(
      "Erro ao excluir:",
      error
    );

    return;

  }

  closeModal();

  loadAnnotations();

}

/* ====================================== */
/* FILTROS */
/* ====================================== */

function applyFilters(){

  const searchValue =
    document
      .getElementById(
        "searchInput"
      )
      .value
      .toLowerCase();

  const dateValue =
    document
      .getElementById(
        "dateFilter"
      )
      .value;

  const filtered =
    annotations.filter(item => {

      const matchesText =

        item.nome
          .toLowerCase()
          .includes(searchValue)

        ||

        item.pedido
          .toLowerCase()
          .includes(searchValue);

      let matchesDate = true;

      if(dateValue){

        const itemDate =
          item.data_criacao
            .split("T")[0];

        matchesDate =
          itemDate === dateValue;

      }

      return (
        matchesText
        &&
        matchesDate
      );

    });

  renderCards(filtered);

}

/* ====================================== */
/* EVENTOS */
/* ====================================== */

document
  .getElementById(
    "searchInput"
  )
  .addEventListener(
    "input",
    applyFilters
  );

document
  .getElementById(
    "dateFilter"
  )
  .addEventListener(
    "change",
    applyFilters
  );

document
  .getElementById(
    "newAnnotationButton"
  )
  .addEventListener(
    "click",
    openCreateModal
  );

document
  .getElementById(
    "closeModalButton"
  )
  .addEventListener(
    "click",
    closeModal
  );

document
  .getElementById(
    "saveButton"
  )
  .addEventListener(
    "click",
    saveAnnotation
  );

document
  .getElementById(
    "deleteButton"
  )
  .addEventListener(
    "click",
    deleteAnnotation
  );

/* ====================================== */
/* INICIALIZAÇÃO */
/* ====================================== */

loadAnnotations();
