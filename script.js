const SUPABASE_URL =
  "https://zzzvwxjuznvyncxmuvuc.supabase.co/";

const SUPABASE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp6enZ3eGp1em52eW5jeG11dnVjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEzNzkwMjcsImV4cCI6MjA5Njk1NTAyN30.cO0nIapoBgB5SGHyJkEkk3rLCQZehyX2eXCKZy9GlWM";


const client =
  window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
  );


let currentUser = null;

let annotations = [];

let tags = [];

let selectedTags = [];
let selectedId = null;

/* ====================================== */
/* AUTH */
/* ====================================== */

async function register(){

  const email =
    document
      .getElementById("emailInput")
      .value;

  const password =
    document
      .getElementById("passwordInput")
      .value;

  const { error } =
    await client.auth.signUp({
      email,
      password
    });

  if(error){

    alert(error.message);

    return;

  }

  alert("Conta criada.");

}

async function login(){

  const email =
    document
      .getElementById("emailInput")
      .value;

  const password =
    document
      .getElementById("passwordInput")
      .value;

  const { data, error } =
    await client.auth.signInWithPassword({
      email,
      password
    });

  if(error){

    alert(error.message);

    return;

  }

  currentUser = data.user;

  startApp();

}

async function logout(){

  await client.auth.signOut();

  location.reload();

}

async function checkAuth(){

  const { data } =
    await client.auth.getUser();

  if(data.user){

    currentUser = data.user;

    startApp();

  }

}

function startApp(){

  document
    .getElementById("authScreen")
    .style.display =
      "none";

  document
    .getElementById("app")
    .style.display =
      "block";

  loadAnnotations();

}

/* ====================================== */
/* LOAD */
/* ====================================== */

async function loadAnnotations(){

  const { data, error } =
    await client
      .from("annotations")
      .select(`
        *,
        annotations_x_tags(
          tag_id,
          tags(
            id,
            name
          )
        )
      `)
      .eq(
        "user_id",
        currentUser.id
      )
      .order(
        "data_criacao",
        {
          ascending:false
        }
      );

  if(error){

    console.error(error);

    return;

  }

  annotations = data.map(annotation => {

    const tags =
      annotation.annotations_x_tags
        ?.map(
          relation => relation.tags
        )
        ?? [];

    return {
      ...annotation,
      tags
    };

  });
  console.log(annotations);
  applyFilters();

}

async function loadTags(){

  const { data, error } =
    await client
      .from("tags")
      .select("*")
      .eq(
        "user_id",
        currentUser.id
      );

  if(error){

    console.error(error);

    return;

  }

  tags = data;

}


/* ====================================== */
/* RENDER */
/* ====================================== */
function renderAllTags(){

  const select =
    document.getElementById(
      "tagSelect"
    );

  select.innerHTML =
    `<option value="">
      Selecione uma tag
    </option>`;

  tags.forEach(tag => {

    const alreadySelected =
      selectedTags.some(
        t => t.id === tag.id
      );

    if(alreadySelected){
      return;
    }

    const option =
      document.createElement(
        "option"
      );

    option.value =
      tag.id;

    option.textContent =
      tag.name;

    select.appendChild(option);

  });

}

function renderCards(list){

  const container =
    document.getElementById(
      "cardsContainer"
    );

  container.innerHTML = "";

  if(list.length === 0){

    container.innerHTML =
      "<p>Nenhuma anotação encontrada.</p>";

    return;

  }

  list.forEach((item,index)=>{

    const card =
      document.createElement("div");

    card.className =
      "card";

    const previewTags =
      item.tags
        ?.slice(0,2)
        ?? [];

    const hiddenCount =
      (item.tags?.length ?? 0)
      - previewTags.length;

    const tagsHtml =
      previewTags
        .map(tag => `
          <span class="card-tag">
            ${tag.name}
          </span>
        `)
        .join("");

    const hiddenHtml =
      hiddenCount > 0
      ? `
        <span class="card-tag-more">
          +${hiddenCount}
        </span>
      `
      : "";

    card.innerHTML = `

      <div class="card-title">
        ${item.nome}
        -
        ${item.pedido}
      </div>

      <div class="card-description">
        ${item.descricao}
      </div>

      <div class="card-tags">
        ${tagsHtml}
        ${hiddenHtml}
      </div>

      <div class="card-date">
        ${formatDate(
          item.data_criacao
        )}
      </div>

    `;

    card.addEventListener(
      "click",
      () => openDetailsModal(index)
    );

    container.appendChild(card);

  });

}

function addSelectedTag(){

  const select =
    document.getElementById(
      "tagSelect"
    );

  const tagId =
    select.value;

  if(!tagId){
    return;
  }

  const tag =
    tags.find(
      t =>
        String(t.id)
        ===
        String(tagId)
    );

  if(!tag){
    return;
  }

  const alreadySelected =
    selectedTags.some(
      t =>
        String(t.id)
        ===
        String(tag.id)
    );

  if(alreadySelected){

    select.value = "";

    return;

  }

  selectedTags.push(tag);

  renderSelectedTags();

  renderAllTags();

  select.value = "";

}

/* ====================================== */
/* DATE */
/* ====================================== */

function formatDate(dateString){

  const date =
    new Date(dateString);

  return (
    date.toLocaleDateString("pt-BR")
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
/* MODAL */
/* ====================================== */

async function openCreateModal(){

  selectedId = null;

  selectedTags = [];

  await loadTags();

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
    .getElementById("newTagInput")
    .value = "";

  renderAllTags();

  renderSelectedTags();

  document
    .getElementById("deleteButton")
    .style.display =
      "none";

  document
    .getElementById("modalOverlay")
    .style.display =
      "flex";

}

async function saveAnnotationTags(
    annotationId
){

    await client
        .from(
            "annotations_x_tags"
        )
        .delete()
        .eq(
            "annotation_id",
            annotationId
        );

    if(
        selectedTags.length === 0
    ){
        return;
    }

    const relations =
        selectedTags.map(
            tag => ({
                annotation_id:
                    annotationId,

                tag_id:
                    tag.id
            })
        );

    await client
        .from(
            "annotations_x_tags"
        )
        .insert(relations);

}
function renderSelectedTags(){

  const container =
    document.getElementById(
      "selectedTagsContainer"
    );

  if(!container){
    return;
  }

  container.innerHTML = "";

  selectedTags.forEach(tag => {

    const chip =
      document.createElement("div");

    chip.className =
      "tag-chip selected";

    chip.innerHTML =
      `${tag.name} ✕`;

    chip.addEventListener(
      "click",
      () => toggleTag(tag)
    );

    container.appendChild(chip);

  });

}

async function createTag(){

  const input =
    document.getElementById(
      "newTagInput"
    );

  const name =
    input.value.trim();

  if(!name){
    return;
  }

  const exists =
    tags.some(
      tag =>
        tag.name
          .toLowerCase()
          ===
        name.toLowerCase()
    );

  if(exists){

    alert(
      "Essa tag já existe."
    );

    return;

  }

  const {
    data,
    error
  } =
    await client
      .from("tags")
      .insert([
        {
          user_id:
            currentUser.id,
          name
        }
      ])
      .select()
      .single();

  if(error){

    console.error(error);

    alert(
      "Erro ao criar tag."
    );

    return;

  }

  input.value = "";

  tags.push(data);

  selectedTags.push(data);

  renderAllTags();

  renderSelectedTags();

}


function toggleTag(tag){

  const exists =
    selectedTags.some(
      t => t.id === tag.id
    );

  if(exists){

    selectedTags =
      selectedTags.filter(
        t => t.id !== tag.id
      );

  }else{

    selectedTags.push(tag);

  }

  renderAllTags();

  renderSelectedTags();

}

async function openDetailsModal(index){

  const item =
    annotations[index];

  selectedId =
    item.id;

  await loadTags();

  selectedTags =
    [...item.tags];

  document
    .getElementById("modalTitle")
    .innerText =
      "Detalhes";

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

  renderAllTags();

  renderSelectedTags();

  document
    .getElementById("deleteButton")
    .style.display =
      "block";

  document
    .getElementById("modalOverlay")
    .style.display =
      "flex";

}

function closeModal(){

  document
    .getElementById("modalOverlay")
    .style.display =
      "none";

}

/* ====================================== */
/* SAVE */
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

  if(selectedId === null){

    const {
      data,
      error
    } =
      await client
        .from("annotations")
        .insert([
          {
            user_id:
              currentUser.id,

            nome,
            pedido,
            descricao,

            data_criacao:
              new Date()
          }
        ])
        .select()
        .single();

    if(error){

      console.error(error);

      return;

    }

    await saveAnnotationTags(
      data.id
    );

  }else{

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

      console.error(error);

      return;

    }

    await saveAnnotationTags(
      selectedId
    );

  }

  closeModal();

  await loadAnnotations();

}

/* ====================================== */
/* DELETE */
/* ====================================== */

async function deleteAnnotation(){

  const confirmed =
    confirm(
      "Deseja excluir?"
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

    console.error(error);

    return;

  }

  closeModal();

  loadAnnotations();

}

/* ====================================== */
/* FILTERS */
/* ====================================== */

function applyFilters(){

  const searchValue =
    document
      .getElementById("searchInput")
      .value
      .toLowerCase();

  const dateValue =
    document
      .getElementById("dateFilter")
      .value;

  const filtered =
    annotations.filter(item=>{

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
/* EVENTS */
/* ====================================== */

document
  .getElementById(
    "tagSelect"
  )
  .addEventListener(
    "change",
    addSelectedTag
  );
document
  .getElementById("loginButton")
  .addEventListener(
    "click",
    login
  );

document
  .getElementById("registerButton")
  .addEventListener(
    "click",
    register
  );

document
  .getElementById("logoutButton")
  .addEventListener(
    "click",
    logout
  );

document
  .getElementById("newAnnotationButton")
  .addEventListener(
    "click",
    openCreateModal
  );

document
  .getElementById("closeModalButton")
  .addEventListener(
    "click",
    closeModal
  );

document
  .getElementById("saveButton")
  .addEventListener(
    "click",
    saveAnnotation
  );

document
  .getElementById("deleteButton")
  .addEventListener(
    "click",
    deleteAnnotation
  );

document
  .getElementById("searchInput")
  .addEventListener(
    "input",
    applyFilters
  );

document
  .getElementById("dateFilter")
  .addEventListener(
    "change",
    applyFilters
  );

  document
  .getElementById("newTagInput")
  .addEventListener(
    "keydown",
    async event => {

      if(event.key !== "Enter"){
        return;
      }

      event.preventDefault();

      await createTag();

    }
  );
/* ====================================== */
/* INIT */
/* ====================================== */

checkAuth();
  console.log(tags);