// riferimenti al DOM
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

// bottone cambio colore nel modale
const colorToggleBtn = document.getElementById('color-toggle-btn');
const colors = ['', 'yellow', 'red', 'blue'];
let colorIndex = 0;
let currentColor = '';


// modal open/close
function openModal() {
  modal.classList.remove('hidden');
  overlay.classList.remove('hidden');
}

function closeModal() {
  modal.classList.add('hidden');
  overlay.classList.add('hidden');
}

openModalBtn.addEventListener('click', openModal);
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


// cambio colore nel modale
colorToggleBtn.addEventListener('click', () => {
  colorIndex = (colorIndex + 1) % colors.length;
  currentColor = colors[colorIndex];
  colorToggleBtn.textContent = currentColor
    ? `Colore: ${currentColor}`
    : 'Cambia colore';
});


// aggiunta nuovo pin
addPinBtn.addEventListener('click', () => {
  const title = titleInput.value.trim() || 'Nuovo titolo';
  const description = descInput.value.trim() || 'Nessuna descrizione';

  let imageSrc = '';
  if (imageInput.files && imageInput.files[0]) {
    imageSrc = URL.createObjectURL(imageInput.files[0]);
  }

  // li
  const li = document.createElement('li');
  li.classList.add('pin-card');

  // 👇 qui applichiamo il colore scelto
  if (currentColor) {
    li.classList.add(currentColor);
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
  info.innerHTML = `
    <h3 class="pin-title">${title}</h3>
    <p class="pin-description">${description}</p>
  `;

  // remove
  const removeBtn = document.createElement('button');
  removeBtn.classList.add('pin-remove');
  removeBtn.textContent = '×';
  removeBtn.setAttribute('aria-label', 'Remove');

  li.append(thumb, info, removeBtn);
  pinList.appendChild(li);

  // reset campi
  titleInput.value = '';
  descInput.value = '';
  imageInput.value = '';
  imagePreview.style.backgroundImage = '';
  imagePreview.classList.remove('has-image');

  // reset colore nel modale
  currentColor = '';
  colorIndex = 0;
  colorToggleBtn.textContent = 'Cambia colore';

  closeModal();
});


// rimozione pin
pinList.addEventListener('click', (event) => {
  if (event.target.classList.contains('pin-remove')) {
    const pin = event.target.closest('li');
    if (pin) {
      pin.remove();
    }
  }
});


// cambio vista
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
