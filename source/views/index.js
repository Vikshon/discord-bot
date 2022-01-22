const SETTINGS = document.querySelector('.settings');
const PREVIEW = document.querySelector('.preview');
const LIBRARY = document.querySelector('.library');
const IMAGES = document.querySelectorAll('img');
const SAVE_BTN = document.querySelector('#save_btn');

const TEXT_COLOR_INPUT = document.querySelector('input.text_color');
const BORDER_COLOR_INPUT = document.querySelector('input.border_color');
const TEXT_OUTLINE_COLOR_INPUT = document.querySelector('input.text_outline_color');
const RANK_IMAGE_SIDE_SELECT = document.querySelector('select.rank_image_side_select');
const BORDER_CHECKBOX = document.querySelector('input#border_checkbox');
const TEXT_OUTLINE_CHECKBOX = document.querySelector('input#text_outline_checkbox');

const COLOR_PICKER = document.querySelectorAll(".color_picker");
const CHECKBOX_HIDE = document.querySelectorAll('.checkbox_hide');

let params;

// #region Listeners

IMAGES.forEach(el => {
    el.addEventListener('click', Change_Background)
});

SAVE_BTN.addEventListener('click', Save_Data);

window.addEventListener('load', () => {
    Load_Config();
})

// TODO: Хотелось бы все имена привести к единому порядку, то есть и классы тоже. Тогда можно было бы все листнеры в единую функцию, и искать в конфиге имя по названию класса...
// Может нужен ивент change ?
TEXT_COLOR_INPUT.addEventListener('input', () => {
    params.bage.text_color = event.target.value;
    PREVIEW.querySelector('.user_info').style.color = event.target.value;
})

BORDER_COLOR_INPUT.addEventListener('input', () => {
    params.bage.bage_border = event.target.value;
    PREVIEW.querySelector('.img > img').style.border = `2px solid ${event.target.value}`;
})

TEXT_OUTLINE_COLOR_INPUT.addEventListener('input', () => {
    params.bage.text_border = event.target.value;
    PREVIEW.querySelector('.user_info').style.textShadow = `2px 0 0 ${event.target.value}, -2px 0 0 ${event.target.value}, 0 2px 0 ${event.target.value}, 0 -2px 0 ${event.target.value}, 1px 1px 0 ${event.target.value}, 1px -1px 0 ${event.target.value}, -1px 1px 0 ${event.target.value}, -1px -1px 0 ${event.target.value}`;
})

RANK_IMAGE_SIDE_SELECT.addEventListener('input', () => {
    if (event.target.value === "Слева") {
        params.bage.rank_image_side = "left";
        PREVIEW.querySelector('.user_info').style.gridTemplateAreas = `"image nickname" "image statistic" "image top_ops" "image ops_img"`;
        PREVIEW.querySelector('.user_info').style.gridTemplateColumns = `128px 1fr`;
    }
    else if (event.target.value === "Справа") {
        params.bage.rank_image_side = "right";
        PREVIEW.querySelector('.user_info').style.gridTemplateAreas = `"nickname image" "statistic image" "top_ops image" "ops_img image"`;
        PREVIEW.querySelector('.user_info').style.gridTemplateColumns = `1fr 128px`;
    }
})

BORDER_CHECKBOX.addEventListener('click', () => {
    if (event.target.checked) {
        PREVIEW.querySelector('.img > img').style.border = `2px solid black`;
        params.bage.bage_border = "black";
    }
    else if (!event.target.checked) {
        PREVIEW.querySelector('.img > img').style.border = `none`;
        params.bage.bage_border = "transparent";
    }
})

TEXT_OUTLINE_CHECKBOX.addEventListener('click', () => {
    if (event.target.checked) {
        PREVIEW.querySelector('.user_info').style.textShadow = `2px 0 0 black, -2px 0 0 black, 0 2px 0 black, 0 -2px 0 black, 1px 1px 0 black, 1px -1px 0 black, -1px 1px 0 black, -1px -1px 0 black`;
        params.bage.text_border = "black";
    }
    else if (!event.target.checked) {
        PREVIEW.querySelector('.user_info').style.textShadow = `none`;
        params.bage.text_border = "transparent";
    }
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
    let current_player = await config.find(g => g.id == guild_id).players.find(p => p.discord_id == player_id);
    console.log(current_player);
    params = current_player;

    Create_Preview();
}

async function Create_Preview()
{
    console.log('Creating Preview');

    const bage_settings = params.bage;
    
    // Просто установка value не поменяет фон родителя, а если просто поменять фон родителя, то при нажатии сохранить без изменении могут быть ошибки с фоном в конфиге
    TEXT_COLOR_INPUT.value = bage_settings.text_color;
    TEXT_COLOR_INPUT.closest('.color_picker_wrapper').style.backgroundColor = bage_settings.text_color;
    PREVIEW.querySelector('.img').style.color = bage_settings.text_color;
    
    if (bage_settings.bage_border !== "transparent") {
        BORDER_CHECKBOX.click();
        BORDER_COLOR_INPUT.value = bage_settings.bage_border;
        BORDER_COLOR_INPUT.closest('.color_picker_wrapper').style.backgroundColor = bage_settings.bage_border;
        PREVIEW.querySelector('.img > img').style.border = `2px solid ${bage_settings.bage_border}`;
    }
    
    if (bage_settings.text_border !== "transparent") {
        TEXT_OUTLINE_CHECKBOX.click();
        TEXT_OUTLINE_COLOR_INPUT.value = bage_settings.text_border;
        TEXT_OUTLINE_COLOR_INPUT.closest('.color_picker_wrapper').style.backgroundColor = bage_settings.text_border;
        PREVIEW.querySelector('.user_info').style.textShadow = `2px 0 0 ${event.target.value}, -2px 0 0 ${event.target.value}, 0 2px 0 ${event.target.value}, 0 -2px 0 ${event.target.value}, 1px 1px 0 ${event.target.value}, 1px -1px 0 ${event.target.value}, -1px 1px 0 ${event.target.value}, -1px -1px 0 ${event.target.value}`;
    }

    if (bage_settings.rank_image_side === "left") {
        RANK_IMAGE_SIDE_SELECT.value = "Слева";
        PREVIEW.querySelector('.user_info').style.gridTemplateAreas = `"image nickname" "image statistic" "image top_ops" "image ops_img"`;
        PREVIEW.querySelector('.user_info').style.gridTemplateColumns = `128px 1fr`;
    }

    // ! Может вынести в listeners? 
    [...COLOR_PICKER].forEach(el => {
        el.addEventListener('input', () => {
            el.closest('.color_picker_wrapper').style.backgroundColor = el.value;
        });
    });

    CHECKBOX_HIDE.forEach(el => {
        el.addEventListener('click', () => {
            event.target.parentNode.nextElementSibling.classList.toggle('hide_toggle');
        })
    });
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