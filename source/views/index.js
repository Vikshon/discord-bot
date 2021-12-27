const SETTINGS = document.querySelector('.settings');
const PREVIEW = document.querySelector('.preview');
const LIBRARY = document.querySelector('.library');
const IMAGES = document.querySelectorAll('img');

IMAGES.forEach(el => {
    el.addEventListener('click', Change_Background)
});

const CHECKBOX_HIDE = document.querySelectorAll('.checkbox_hide');
CHECKBOX_HIDE.forEach(el => {
    el.addEventListener('click', () => {
        event.target.parentNode.nextElementSibling.classList.toggle('hide_toggle');
    })
})

function Change_Background()
{
    let img = document.querySelector('.preview .container .img img');
    img.src = this.src;
}