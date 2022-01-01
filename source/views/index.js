const SETTINGS = document.querySelector('.settings');
const PREVIEW = document.querySelector('.preview');
const LIBRARY = document.querySelector('.library');
const IMAGES = document.querySelectorAll('img');
const SAVE_BTN = document.querySelector('#save_btn');

const TEXT_COLOR_INPUT = document.querySelector('input.text_color');
const BORDER_COLOR_INPUT = document.querySelector('input.border_color');
const TEXT_OUTLINE_COLOR_INPUT = document.querySelector('input.text_outline_color');
const RANK_IMAGE_SIDE_SELECT = document.querySelector('select.rank_image_side_select');
const BORDER_STATUS = document.querySelector('input#border_checkbox');
const TEXT_OUTLINE_STATUS = document.querySelector('input#text_outline_checkbox');
let params = Build_Params();

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

// TODO: Хотелось бы все имена привести к единому порядку, то есть и классы тоже. Тогда можно было бы все листнеры в единую функцию, и искать в конфиге имя по названию класса...
TEXT_COLOR_INPUT.addEventListener('change', () => {
    params.text_color = event.target.value;
})
BORDER_COLOR_INPUT.addEventListener('change', () => {
    params.bage_border = event.target.value;
})
TEXT_OUTLINE_COLOR_INPUT.addEventListener('change', () => {
    params.text_border = event.target.value;
})
RANK_IMAGE_SIDE_SELECT.addEventListener('change', () => {
    if (event.target.value === "Слева")
        params.rank_image_side = "left";
    else
        params.rank_image_side = "right";
})
BORDER_STATUS.addEventListener('click', () => {
    params.bage_border = "black";
    if (!event.target.checked)
        params.bage_border = "transparent";
})
TEXT_OUTLINE_STATUS.addEventListener('click', () => {
    params.text_border = "black";
    if (!event.target.checked)
        params.text_border = "transparent";
})

function Change_Background()
{
    let img = document.querySelector('.preview .container .img img');
    img.src = this.src;

    params.background = this.src.slice(this.src.lastIndexOf('/') + 1, this.src.lastIndexOf('.'));
}

function Save_Data()
{
    this.innerText = "Сохранено";
    
    let xhr = new XMLHttpRequest();
    xhr.open("POST", '/save');
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.onreadystatechange = function() {//Вызывает функцию при смене состояния.
        if(xhr.readyState == XMLHttpRequest.DONE && xhr.status == 200) {
            // Запрос завершён. Здесь можно обрабатывать результат.
        }
    }

    let data = {
        k1: 'v1',
        k2: 'v2'
    }

    // console.log(JSON.stringify(params));
    // console.log(params);
    xhr.send(JSON.stringify(params));
}

function Build_Params()
{
    let search = location.search.slice(1, location.search.length);
    // Функция нужна для декодировки кириллических символов, например
    search = JSON.parse('{"' + search.replace(/&/g, '","').replace(/=/g,'":"') + '"}', function(key, value) { return key===""?value:decodeURIComponent(value) });
    return search;
}