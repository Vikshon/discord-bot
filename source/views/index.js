const settings = document.querySelector('.settings');
const preview = document.querySelector('.preview');
const library = document.querySelector('.library');

const images = document.querySelectorAll('img');
images.forEach(el => {
    el.addEventListener('click', Change_Background)
});

let checkbox_hide = document.querySelectorAll('.checkbox_hide');
checkbox_hide.forEach(el => {
    el.addEventListener('click', () => {
        event.target.parentNode.nextElementSibling.classList.toggle('hide_toggle');
    })
})

function Change_Background()
{
    let background = document.createElement('img');
    background.src = this.src;
    let container = document.querySelector('.preview .container .img');
    container.innerHTML = '';
    container.appendChild(background);
}

/* window.onload = () => {
    console.log('object1');
} */