const SETTINGS = document.querySelector('.settings');
const PREVIEW = document.querySelector('.preview');
const LIBRARY = document.querySelector('.library');
const IMAGES = document.querySelectorAll('img');
const SAVE_BTN = document.querySelector('#save_btn');

IMAGES.forEach(el => {
    el.addEventListener('click', Change_Background)
});

SAVE_BTN.addEventListener('click', Save_Data);

const CHECKBOX_HIDE = document.querySelectorAll('.checkbox_hide');
CHECKBOX_HIDE.forEach(el => {
    el.addEventListener('click', () => {
        event.target.parentNode.nextElementSibling.classList.toggle('hide_toggle');
    })
});

function Change_Background()
{
    let img = document.querySelector('.preview .container .img img');
    img.src = this.src;
}

function Save_Data()
{
    this.innerText = "Сохранено";
    location.href = `http://localhost:3000/save/${location.search}`;
}