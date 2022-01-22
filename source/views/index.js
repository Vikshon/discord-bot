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
let params;

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

// #region Listeners

window.addEventListener('load', () => {
    Load_Config();
})

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

// #endregion

// #region Functions

async function Load_Config()
{
    let search = location.search.slice(1, location.search.length);
    // Функция нужна для декодировки кириллических символов, например
    let query = JSON.parse('{"' + search.replace(/&/g, '","').replace(/=/g,'":"') + '"}', function(key, value) { return key===""?value:decodeURIComponent(value) });

    let guild_id = Object.values(query)[0].slice(0, Object.values(query)[0].lastIndexOf('_'));
    let player_id = Object.values(query)[0].slice(Object.values(query)[0].lastIndexOf('_') + 1);

    let config = await fetch('./player_config.json').then(res => res.json());
    console.log(config);
    let current_player = await config.find(g => g.id == guild_id).players.find(p => p.discord_id == player_id);
    params = current_player;

    Create_Preview();
}

function Create_Preview()
{
    console.log('Creating Preview');
}

function Change_Background()
{
    let img = document.querySelector('.preview .container .img img');
    img.src = this.src;

    params.bage.background = this.src.slice(this.src.lastIndexOf('/') + 1, this.src.lastIndexOf('.'));
}

function Save_Data()
{
    console.log(params);
    // ! Заменить, т.к. в строке больше нет данных параметров
    if (!("uplay_name" in params))
        return;
    this.innerText = "Сохранено";
    
    let xhr = new XMLHttpRequest();
    xhr.open("POST", '/save');
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.onreadystatechange = function() {//Вызывает функцию при смене состояния.
        if(xhr.readyState == XMLHttpRequest.DONE && xhr.status == 200) {
            // Запрос завершён. Здесь можно обрабатывать результат.
        }
    }
    
    // ! Зарефакторить, т.к. данный код повторяется
    let search = location.search.slice(1, location.search.length);
    let query = JSON.parse('{"' + search.replace(/&/g, '","').replace(/=/g,'":"') + '"}', function(key, value) { return key===""?value:decodeURIComponent(value) });

    let guild_id = Object.values(query)[0].slice(0, Object.values(query)[0].lastIndexOf('_'));
    let player_id = Object.values(query)[0].slice(Object.values(query)[0].lastIndexOf('_') + 1);

    xhr.send(JSON.stringify({ settings: params, query: { guild_id, player_id } }));
}

// #endregion