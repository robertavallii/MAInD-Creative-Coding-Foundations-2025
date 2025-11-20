const openModalBtn = document.getElementById('open-modal-btn');
const closeModalBtn = document.getElementById('close-modal-btn');
const modal = document.getElementById('create-pin-modal');
const overlay = document.getElementById('modal-overlay');

const imageInput = document.getElementById('pin-image');
const imagePreview = document.getElementById('image-preview');

const titleInput = document.getElementById('pin-title');
const descInput = document.getElementById('pin-description');
const addPinBtn = document.getElementById('add-pin-btn');

const pinList = document.getElementById('contenitore-pin');

const listViewBtn = document.getElementById('list-view-btn');
const cardViewBtn = document.getElementById('card-view-btn');

const colorLabel = document.querySelector('.color-label');
const colorPreview = document.getElementById('color-preview');
const colorPicker = document.getElementById('color-picker');

// 
const DEFAULT_COLOR = '#2b2b2b';

// stato
let currentColor = '';
let editingPin = null; // se è null → stiamo creando

// apertura e chiusura modale
function openModal() {
  modal.classList.remove('hidden');
  overlay.classList.remove('hidden');
}

function closeModal() {
  modal.classList.add('hidden');
  overlay.classList.add('hidden');
  editingPin = null;
}

// apre modale per nuovo pin
openModalBtn.addEventListener('click', () => {
  // reset manuale (potresti anche chiamare resetModalFields())
  titleInput.value = '';
  descInput.value = '';
  imageInput.value = '';
  imagePreview.style.backgroundImage = '';
  imagePreview.classList.remove('has-image');

  // reset colore
  currentColor = '';
  if (colorPicker) colorPicker.value = DEFAULT_COLOR;
  if (colorPreview) colorPreview.style.backgroundColor = DEFAULT_COLOR;
  if (colorLabel) colorLabel.textContent = 'Pin color';

  editingPin = null;
  openModal();
});

closeModalBtn.addEventListener('click', closeModal);
overlay.addEventListener('click', closeModal);

// anteprima immagine
imageInput.addEventListener('change', () => {
  if (imageInput.files && imageInput.files[0]) {
    const imgURL = URL.createObjectURL(imageInput.files[0]);
    imagePreview.style.backgroundImage = `url(${imgURL})`;
    imagePreview.classList.add('has-image');
  } else {
    imagePreview.style.backgroundImage = '';
    imagePreview.classList.remove('has-image');
  }
});

// color picker
function openColorPicker() {
  if (colorPicker) colorPicker.click();
}

if (colorLabel) colorLabel.addEventListener('click', openColorPicker);
if (colorPreview) colorPreview.addEventListener('click', openColorPicker);

if (colorPicker) {
  colorPicker.addEventListener('input', () => {
    currentColor = colorPicker.value;
    if (colorPreview) colorPreview.style.backgroundColor = currentColor;
    if (colorLabel) colorLabel.textContent = `Pin color (${currentColor})`;
  });
}

// aggiungere o modificare pin
addPinBtn.addEventListener('click', () => {
  const title = titleInput.value.trim() || 'Nuovo titolo';
  const description = descInput.value.trim() || 'Nessuna descrizione';

  // MODIFICA pin esistente
  if (editingPin) {
    const info = editingPin.querySelector('.pin-info');
    if (info) {
      const titleEl = info.querySelector('.pin-title');
      const descEl = info.querySelector('.pin-description');
      if (titleEl) titleEl.textContent = title;
      if (descEl) descEl.textContent = description;
    }

    // applica colore scelto
    if (currentColor) {
      editingPin.style.backgroundColor = currentColor;
      // se è il giallo chiaro → testo nero
      if (currentColor.toLowerCase() === DEFAULT_COLOR) {
        editingPin.style.color = '#000';
      } else {
        editingPin.style.color = '';
      }
    } else {
      // nessun colore scelto → rimuovi stile
      editingPin.style.backgroundColor = '';
      editingPin.style.color = '';
    }

    // immagine (solo se l’utente ne ha caricata una nuova)
    if (imageInput.files && imageInput.files[0]) {
      const imgURL = URL.createObjectURL(imageInput.files[0]);
      const thumbImg = editingPin.querySelector('.pin-thumb img');
      if (thumbImg) {
        thumbImg.src = imgURL;
      }
    }

    resetModalFields();
    closeModal();
    return;
  }

  // CREAZIONE nuovo pin
  let imageSrc = '';
  if (imageInput.files && imageInput.files[0]) {
    imageSrc = URL.createObjectURL(imageInput.files[0]);
  }

  const li = document.createElement('li');
  li.classList.add('pin-card');

  // applica colore se scelto
  if (currentColor) {
    li.style.backgroundColor = currentColor;
    if (currentColor.toLowerCase() === DEFAULT_COLOR) {
      li.style.color = '#000';
    }
  }

  // thumb
  const thumb = document.createElement('div');
  thumb.classList.add('pin-thumb');
  if (imageSrc) {
    const img = document.createElement('img');
    img.src = imageSrc;
    img.alt = 'Poster';
    thumb.appendChild(img);
  }

  // info
  const info = document.createElement('div');
  info.classList.add('pin-info');

  const header = document.createElement('div');
  header.classList.add('pin-header');

  const titleEl = document.createElement('h3');
  titleEl.classList.add('pin-title');
  titleEl.textContent = title;

  const editBtn = document.createElement('button');
  editBtn.classList.add('pin-edit');

  const editImg = document.createElement('img');
  editImg.src = 'assets/image/Icon_edit.svg';
  editImg.alt = 'modifica';
  editImg.classList.add('icon-edit');
  editBtn.appendChild(editImg);

  header.appendChild(titleEl);
  header.appendChild(editBtn);

  const descEl = document.createElement('p');
  descEl.classList.add('pin-description');
  descEl.textContent = description;

  info.appendChild(header);
  info.appendChild(descEl);

  const removeBtn = document.createElement('button');
  removeBtn.classList.add('pin-remove');
  removeBtn.textContent = '×';

  li.append(thumb, info, removeBtn);
  pinList.appendChild(li);

  resetModalFields();
  closeModal();
});

// reset modale
function resetModalFields() {
  titleInput.value = '';
  descInput.value = '';
  imageInput.value = '';
  imagePreview.style.backgroundImage = '';
  imagePreview.classList.remove('has-image');

  currentColor = '';
  if (colorPicker) colorPicker.value = DEFAULT_COLOR;
  if (colorPreview) colorPreview.style.backgroundColor = DEFAULT_COLOR;
  if (colorLabel) colorLabel.textContent = 'Pin color';

  editingPin = null;
}

// eventi lista: rimuovi + modifica
pinList.addEventListener('click', (event) => {
  // rimozione
  if (event.target.closest('.pin-remove')) {
    const pin = event.target.closest('li');
    if (pin) pin.remove();
    return;
  }

  // modifica
  const editButton = event.target.closest('.pin-edit');
  if (editButton) {
    const pin = event.target.closest('li');
    if (!pin) return;

    editingPin = pin;

    // prendi dati esistenti
    const titleEl = pin.querySelector('.pin-title');
    const descEl = pin.querySelector('.pin-description');
    const thumbImg = pin.querySelector('.pin-thumb img');

    titleInput.value = titleEl ? titleEl.textContent : '';
    descInput.value = descEl ? descEl.textContent : '';

    // colore esistente sul pin
    const bg = pin.style.backgroundColor;
    if (bg) {
      currentColor = bg;
      if (colorPreview) colorPreview.style.backgroundColor = currentColor;
    } else {
      currentColor = '';
      if (colorPreview) colorPreview.style.backgroundColor = DEFAULT_COLOR;
    }
    if (colorPicker) colorPicker.value = DEFAULT_COLOR; // mantieni un valore valido
    if (colorLabel) colorLabel.textContent = 'Pin color';

    // immagine in anteprima
    if (thumbImg && thumbImg.src) {
      imagePreview.style.backgroundImage = `url(${thumbImg.src})`;
      imagePreview.classList.add('has-image');
    } else {
      imagePreview.style.backgroundImage = '';
      imagePreview.classList.remove('has-image');
    }

    openModal();
  }
});

// cambio viste
listViewBtn.addEventListener('click', () => {
  listViewBtn.classList.add('active');
  cardViewBtn.classList.remove('active');

  pinList.classList.remove('card-view');
  pinList.classList.add('list-view');
});

cardViewBtn.addEventListener('click', () => {
  cardViewBtn.classList.add('active');
  listViewBtn.classList.remove('active');

  pinList.classList.remove('list-view');
  pinList.classList.add('card-view');
});
