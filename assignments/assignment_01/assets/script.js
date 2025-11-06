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

// stato
let currentColor = '';
let editingPin = null; // se è null 


// apertura e chiusra modale 

function openModal() {
  modal.classList.remove('hidden');
  overlay.classList.remove('hidden');
}

function closeModal() {
  modal.classList.add('hidden');
  overlay.classList.add('hidden');
  editingPin = null;
}

openModalBtn.addEventListener('click', () => {

  editingPin = null;

  // reset campi modale
  titleInput.value = '';
  descInput.value = '';
  imageInput.value = '';
  imagePreview.style.backgroundImage = '';
  imagePreview.classList.remove('has-image');

  // reset colore modale
  currentColor = '';
  if (colorPicker) colorPicker.value = '#f8d448';
  if (colorPreview) colorPreview.style.backgroundColor = '#f8d448';
  if (colorLabel) colorLabel.textContent = 'Pin color';

  openModal();
});

closeModalBtn.addEventListener('click', closeModal);
overlay.addEventListener('click', closeModal);

// anteprima img
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



// colour pickk
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


// agg o modificare pin

addPinBtn.addEventListener('click', () => {
  const title = titleInput.value.trim() || 'Nuovo titolo';
  const description = descInput.value.trim() || 'Nessuna descrizione';

  // mod
  if (editingPin) {
    const info = editingPin.querySelector('.pin-info');
    if (info) {
      const titleEl = info.querySelector('.pin-title');
      const descEl = info.querySelector('.pin-description');
      if (titleEl) titleEl.textContent = title;
      if (descEl) descEl.textContent = description;
    }

    // colore
    if (currentColor) {
      editingPin.style.backgroundColor = currentColor;
      if (currentColor.toLowerCase() === '#f8d448') {
        editingPin.style.color = '#000';
      } else {
        editingPin.style.color = '';
      }
    } else {
      editingPin.style.backgroundColor = '';
      editingPin.style.color = '';
    }

    // immagine (solo cambio)
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

  // 
  let imageSrc = '';
  if (imageInput.files && imageInput.files[0]) {
    imageSrc = URL.createObjectURL(imageInput.files[0]);
  }

  // <li> (???? sistemare!!!!!)
  const li = document.createElement('li');
  li.classList.add('pin-card');

  // colore applicato 
  if (currentColor) {
    li.style.backgroundColor = currentColor;
    if (currentColor.toLowerCase() === '#f8d448') {
      li.style.color = '#000';
    }
  }

  // thumb img
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

  // header con titolo + icona edit
  const header = document.createElement('div');
  header.classList.add('pin-header');

  const titleEl = document.createElement('h3');
  titleEl.classList.add('pin-title');
  titleEl.textContent = title;

  const editBtn = document.createElement('button');
  editBtn.classList.add('pin-edit');
  
  // icona svg 
  const editImg = document.createElement('img');
  editImg.src = 'assets/icons/edit.svg';
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

  // rimuovi elemento pinboard
  const removeBtn = document.createElement('button');
  removeBtn.classList.add('pin-remove');
  removeBtn.textContent = '×';

  li.append(thumb, info, removeBtn);
  pinList.appendChild(li);

  resetModalFields();
  closeModal();
});

// reset del modale
function resetModalFields() {
  titleInput.value = '';
  descInput.value = '';
  imageInput.value = '';
  imagePreview.style.backgroundImage = '';
  imagePreview.classList.remove('has-image');

  currentColor = '';
  if (colorPicker) colorPicker.value = '#f8d448';
  if (colorPreview) colorPreview.style.backgroundColor = '#f8d448';
  if (colorLabel) colorLabel.textContent = 'Pin color';

  editingPin = null;
}



// eventi lista: rimuovi + modificare
pinList.addEventListener('click', (event) => {
  // rimozione
  if (event.target.closest('.pin-remove')) {
    const pin = event.target.closest('li');
    if (pin) pin.remove();
    return;
  }

  // modifica (usare closest perché click img nel "button"  )
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

    // colore esistente
    const bg = pin.style.backgroundColor;
    if (bg) {
      currentColor = rgbToHex(bg);
      if (colorPicker) colorPicker.value = currentColor;
      if (colorPreview) colorPreview.style.backgroundColor = currentColor;
      if (colorLabel) colorLabel.textContent = `Pin color (${currentColor})`;
    } else {
      currentColor = '';
      if (colorPicker) colorPicker.value = '#f8d448';
      if (colorPreview) colorPreview.style.backgroundColor = '#f8d448';
      if (colorLabel) colorLabel.textContent = 'Pin color';
    }

    // immagine inserimento anteprima ì anteprima
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
