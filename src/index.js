/* #region(collapsed) SVG classes */

// Regiony są z wtyczki do VSCode (https://marketplace.visualstudio.com/items?itemName=maptz.regionfolder), aby prościej było scrollować po pliku
// Używałbym modułów do exportu klas, ale na file:// nie można, a nie chcę wymuszać aby plik był hostowany na serwerze lokalnie

class SVGObject {
    constructor(SVGElement, elements) {
        this.width = SVGElement.getAttribute('width');
        this.height = SVGElement.getAttribute('height');
        this.handle = SVGElement;
        if (elements) {
            this.children = elements;
        } else {
            this.children = [];
        }
    }
    
    appendChild(el) {
        // Intended for actual SVG object instances, or objects passed as string that didn't get a proper implementation. Also adding text between tags.
        // You can also use the SVGArbitrary class for representing any tag with its properties
        this.children.push(el)
    }

    clear() {
        this.children = [];
        this.handle.innerHTML = "";
    }

    render() {
        this.handle.innerHTML = '';
        this.children.forEach(element => {
            if (element instanceof SVGElement) {
                this.handle.innerHTML += element.getString();
            } else if (typeof element == "string") {
                this.handle.innerHTML += element;
            }
        });
    }
}

class SVGElement {
    constructor(style = '', transform = '', customAttrs = '') {
        this.style = style;
        this.transform = transform;
        this.customAttrs = customAttrs; // String or Object (treated as a dictionary of k/v pairs)
        // SVG as a format has too many useful attributes to implement interfaces for them all here, for anything non-standard this is the go-to approach.
    }
    
    getCustomString() {
        if (typeof this.customAttrs == "object") {
            let str = '';
            for (let key in this.customAttrs) {
                str += `${key}="${this.customAttrs[key]}" `;
            }
            return str;
        } else if (typeof this.customAttrs == "string") {
            return this.customAttrs
        }
    }

    getString() {
        throw new Error('This method is not supposed to be called on a barebones SVGElement instance, please instantiate an inherited object that returns a proper element like <line> or <rect>.');
    }
}


class SVGLine extends SVGElement {
    constructor(x1, y1, x2, y2, style = '', transform = '', customAttrs = '') {
        super(style, transform, customAttrs);
        this.x1 = x1;
        this.x2 = x2;
        this.y1 = y1;
        this.y2 = y2;
    }
    
    getString() {
        return `<line x1="${this.x1}" y1="${this.y1}" x2="${this.x2}" y2="${this.y2}" style="${this.style}" transform="${this.transform}" ${super.getCustomString()}/>`
    }
}

class SVGGroup extends SVGElement {
    constructor(children, style = '', transform = '', customAttrs = '') {
        super(style, transform, customAttrs);
        this.children = children;
    }
    
    appendChild(el) {
        this.children.push(el)
    }

    appendChildren(l) {
        this.children.push(...l)
    }

    getString() {
        let str = ''
        this.children.forEach(child => {
            if (child instanceof SVGElement) {
                str += child.getString();
            } else if (typeof child == "string") {
                str += child
            }
        })
        return `<g style="${this.style}" transform="${this.transform}" ${super.getCustomString()}>${str}</g>`
    }
}

class SVGText extends SVGElement {
    constructor(x, y, text, style = '', transform = '', customAttrs = '') {
        super(style, transform, customAttrs);
        this.x = x
        this.y = y
        this.text = text;
    }

    getString() {
        return `<text x=${this.x} y=${this.y} style="${this.style}" transform="${this.transform}" ${super.getCustomString()}>${this.text}</text>`
    }
}

class SVGRectangle extends SVGElement {
    constructor(x, y, width, height, rx = 0, ry = 0, style = '', transform = '', customAttrs = '') {
        super(style, transform, customAttrs);
        this.x = x
        this.y = y
        this.width = width
        this.height = height
        this.rx = rx
        this.ry = ry
    }

    getString() {
        return `<rect x="${this.x}" y="${this.y}" width="${this.width}" height="${this.height}" rx="${this.rx}" ry="${this.ry}" style="${this.style}" transform="${this.transform}" ${super.getCustomString()}></rect>`
    }
}

class SVGCircle extends SVGElement {
    constructor(cx, cy, r, style = '', transform = '', customAttrs = '') {
        super(style, transform, customAttrs);
        this.cx = cx
        this.cy = cy
        this.r = r
    }

    getString() {
        return `<circle cx="${this.cx}" cy="${this.cy}" r="${this.r}" style="${this.style}" transform="${this.transform}" ${super.getCustomString()}></circle>`
    }
}

class SVGPolygon extends SVGElement {
    constructor(points, style = '', transform = '', customAttrs = '') {
        super(style, transform, customAttrs);
        this.points = points
    }

    getString() {
        let points_str = '';
        this.points.forEach(p => {
            points_str += `${p[0]},${p[1]} `;
        })
        return `<polygon points="${this.points}" style="${this.style}" transform="${this.transform}" ${super.getCustomString()}></polygon>`
    }
}

class SVGArbitrary extends SVGElement {
    constructor(tag, children, style = '', transform = '', customAttrs = '') {
        super(style, transform, customAttrs);
        this.tag = tag
        this.children = children
    }

    getString() {
        let childstr = ''
        if (this.children) {
            this.children.forEach(el => {
                if (el instanceof SVGElement) {
                    childstr += el.getString()
                } else if (typeof el == "string") {
                    childstr += el
                }
            })
        }
        return `<${this.tag} style="${this.style}" transform="${this.transform}" ${super.getCustomString()}>${childstr}</${this.tag}>`
    }
}

/* #endregion */

/* #region(collapsed) Trigonometry functions */

function angleToRad(deg) {
    return deg * (Math.PI/180);
}

function rotateAround(tx, ty, cx, cy, angle) {
    let theta = angleToRad(angle);
    let cost = Math.cos(theta);
    let sint = Math.sin(theta);

    let rotx = (tx - cx) * cost - (ty - cy) * sint + cx;
    let roty = (tx - cx) * sint + (ty - cy) * cost + cy;

    return [rotx, roty];
}

/* #endregion */

let isOpenConfig = false;
var root = document.querySelector(':root');
const motywy = {
    cytrusowy: {
        hands_color: 'rgb(255,0,0)',
        markers_color: 'rgb(55,50,240)',
        tarcza_bg_stroke: 'green',
        tarcza_bg_fill: 'rgba(198, 230, 20, 0.46)',
        tarcza_fill: 'rgba(252,252, 29, 0.9)',
        digi_border: '#FAA381',
        text_color: 'black',
        body_bg: 'white',
        logo: '../assets/logo.png'
    },
    ametyst: {
        hands_color: '#4F359B',
        markers_color: 'rgb(55,50,240)',
        tarcza_bg_stroke: '#1E00FF',
        tarcza_bg_fill: '#585191',
        tarcza_fill: '#7D6F86',
        digi_border: 'black',
        text_color: '#E7C8DD',
        body_bg: '#585191',
        logo: '../assets/logo_ametyst.png'
    },
    bezowy: {
        hands_color: '#80727B',
        markers_color: '#040711', 
        tarcza_bg_stroke: '#040711',
        tarcza_bg_fill: '#E7DECD',
        tarcza_fill: '#E7DECD',
        digi_border: '#FAA381',
        text_color: '#040711',
        body_bg: '#E7DECD',
        logo: '../assets/logo_beżowy.png'
    },
    morski: {
        hands_color: '#BEA8A7',
        markers_color: '#BEA8A7',
        tarcza_bg_stroke: 'green',
        tarcza_bg_fill: '#00A6FB',
        tarcza_fill: '#DEFFFC',
        digi_border: '#75DBCD',
        text_color: 'black',
        body_bg: 'white',
        logo: '../assets/logo_morski.png'
    },
    truskawkowy: {
        hands_color: '#2a5800',
        markers_color: '#2a5800',
        tarcza_bg_stroke: '#f9b5b5',
        tarcza_bg_fill: '#d84f4f',
        tarcza_fill: '#f9b5b5',
        digi_border: '#FAA381',
        text_color: 'black',
        body_bg: 'white',
        logo: '../assets/logo.png'
    }
}

function setTheme() {
    const numerki = {0: 'ametyst', 1: 'bezowy', 2: 'cytrusowy', 3: 'morski', 4: 'truskawkowy'};
    let theme = motywy[numerki[cform.theme.value.toString()]];
    
    root.style.setProperty('--hands-color', theme.hands_color);
    root.style.setProperty('--markers-color', theme.markers_color);
    root.style.setProperty('--tarcza-bg-stroke', theme.tarcza_bg_stroke);
    root.style.setProperty('--tarcza-bg-fill', theme.tarcza_bg_fill);
    root.style.setProperty('--tarcza-fill', theme.tarcza_fill);
    root.style.setProperty('--color', theme.text_color);
    root.style.setProperty('--body-bg', theme.body_bg);
    root.style.setProperty('--digi-border', theme.digi_border);


    document.getElementById('spolem-logo')?.setAttribute('href', theme.logo);
}


function toggleConfig() {
    if(isOpenConfig) {
        document.getElementById("config-sidepanel").style.height = "0";
        document.getElementById("config-sidepanel").style.width = "0";
        isOpenConfig = false;
    } else {
        document.getElementById("config-sidepanel").style.height = "868px";
        document.getElementById("config-sidepanel").style.width = "880px";
        isOpenConfig = true;
    }
}

const cform = document.forms['config-form'];

const toRomanNumeral = num => {
    const lookup = [
        ['M', 1000],
        ['CM', 900],
        ['D', 500],
        ['CD', 400],
        ['C', 100],
        ['XC', 90],
        ['L', 50],
        ['XL', 40],
        ['X', 10],
        ['IX', 9],
        ['V', 5],
        ['IV', 4],
        ['I', 1],
    ];
    return lookup.reduce((acc, [k, v]) => {
        acc += k.repeat(Math.floor(num / v));
        num = num % v;
        return acc;
    }, '');
};
const rzymskie = [...[...Array(3600)].keys()].map((i) => toRomanNumeral(i+1));

cform.clocktype.addEventListener("input", () => {
    if(cform.clocktype.value == "0") {
        createAnalog(svg);
    } else {
        createDigital(svg);
    }
})

cform.labeltype.addEventListener("input", () => {
    if(cform.clocktype.value == "0") {
        handleHourLabels()
        handleMinuteLabels()
        handleSecondLabels()
    }
})

function handleHourLabels() {
    if (cform.clocktype.value == "0") {
        let arr = [...document.getElementById('hour-labels').children];
        let val = cform.labeltype.value;
        for (let i = 0; i < 12; i++) {
            if (cform.godziny.checked) {
                switch (val) {
                    case "0":
                        arr[i].innerHTML = `${i+1}`;
                        break;
                    case "1":
                        arr[i].innerHTML = rzymskie[i];
                        break;
                    case "2":
                        arr[i].innerHTML = "";
                        break;
                
                    default:
                        throw new RangeError(`Labeltype input value is out of bounds (${val}).`);
                }
            } else {
                arr[i].innerHTML = "";
            } 
        }
    } else {
        let elems = [...document.getElementsByClassName('digit')];
        [...elems[0].children].concat([...elems[1].children]).forEach(el => {
            if (cform.godziny.checked) {
                el.style.display = 'unset';
            } else {
                el.style.display = 'none';
            }
        })
    }
}
function handleMinuteLabels() {
    if (cform.clocktype.value == "0") {
        let arr = [...document.getElementById('minute-labels').children];
        let val = cform.labeltype.value;
        for (let i = 0; i < 60; i++) {
            if ((cform.minuty.checked && !cform.minuty5.checked) || (cform.minuty.checked && cform.minuty5.checked && (i+1) % 5 == 0)) {
                switch (val) {
                    case "0":
                        arr[i].innerHTML = `${i+1}`;
                        break;
                    case "1":
                        arr[i].innerHTML = rzymskie[i];
                        break;
                    case "2":
                        arr[i].innerHTML = "";
                        break;
                
                    default:
                        throw new RangeError(`Labeltype input value is out of bounds (${val}).`);
                }
            } else {
                arr[i].innerHTML = "";
            } 
        }
    } else {
        let elems = [...document.getElementsByClassName('digit')];
        [...elems[2].children].concat([...elems[3].children]).forEach(el => {
            if (cform.minuty.checked) {
                el.style.display = 'unset';
            } else {
                el.style.display = 'none';
            }
        })
    }
}
function handleSecondLabels() {
    let arr = [...document.getElementById('second-labels').children];
    let val = cform.labeltype.value;
    for (let i = 0; i < 60; i++) {
        if (cform.sekundy.checked) {
            switch (val) {
                case "0":
                    arr[i].innerHTML = `${i+1}`;
                    break;
                case "1":
                    arr[i].innerHTML = rzymskie[i];
                    break;
                case "2":
                    arr[i].innerHTML = "";
                    break;
            
                default:
                    throw new RangeError(`Labeltype input value is out of bounds (${val}).`);
            }
        } else {
            arr[i].innerHTML = "";
        } 
    }
}


cform.theme.addEventListener("input", setTheme);
cform.godziny.addEventListener("input", handleHourLabels)
cform.minuty.addEventListener("input", handleMinuteLabels)
cform.minuty5.addEventListener("input", handleMinuteLabels)
cform.sekundy.addEventListener("input", handleSecondLabels)

let alarms = [];

cform.addalarm.addEventListener("click", () => {
    let hrs = parseInt(cform.newhour.value);
    let mins = parseInt(cform.newmin.value);
    let alarm_str = cform.alarmpath.value;

    alarms.push({hrs: hrs, mins: mins, path: alarm_str, id: `${hrs}-${mins}-${alarm_str}`});
    // console.log(alarms);
    
    let output = document.getElementById('alarm-wrapper');
    output.innerHTML += `<div class='alarm-entry ${hrs}-${mins}-${alarm_str}' onClick="removeAlarm('${hrs}-${mins}-${alarm_str}')" class='alarm-entry'>${hrs}:${mins} (${alarm_str})</div>`
})

function removeAlarm(s) {
    let hrs = parseInt(s.split('-')[0])
    let mins = parseInt(s.split('-')[1])
    let alarm_str = s.split('-')[2]
    Array.from(document.getElementsByClassName(s)).forEach(element => {
        element.remove();
    });

    alarms = alarms.filter(a => {
        return a.hrs != hrs || a.mins != mins || a.path != alarm_str;
    })
    console.log(alarms)
}

let active_alarms = [];

function processAlarms(hour, minutes) {
    alarms.forEach(a => {
        if(a.hrs == hour && a.mins == minutes) {
            let audio = new Audio(a.path);
            audio.play()
            // all_audios.push(audio);

            let element = document.getElementById('alarm-dialog');
            let hspan = document.getElementById('hrs-span');
            let mspan = document.getElementById('mins-span');
            hspan.innerText = hour;
            mspan.innerText = minutes;
            
            active_alarms.push({alarm: a, audio: audio});
            

            alarms = alarms.filter(b => {
                return a.hrs != b.hrs || a.mins != b.mins || a.path != b.path;
            })
            element.showModal();
        }
    })
}

function endAlarm() {
    active_alarms.forEach(el => {
        el.audio.pause();
        el.audio.currentTime = 0;
        alarms = alarms.filter(b => {
            return el.alarm.hrs != b.hrs || el.alarm.mins != b.mins || el.alarm.path != b.path;
        })
        Array.from(document.getElementsByClassName(`${el.alarm.hrs}-${el.alarm.mins}-${el.alarm.path}`)).forEach(element => {
            element.remove();
        });
    })
}

cform.inner.addEventListener("input", () => {
    let arr = [...document.getElementById('hour-labels').children];
    // console.log(arr)
    for(let i = 0; i < 12; i++) {
        let cx = svg.width * 11 / 22;
        let cy = svg.height * 11.2 / 22;
    
        let tx = svg.width * 11 / 22;
        let ty = svg.height * (cform.inner.checked ? 6 / 22 : 0.75 / 11);
        
        let [rotx, roty] = rotateAround(tx, ty, cx, cy, (i+1)*30);
        // console.log(`${rotx}, ${roty}`)
        arr[i].setAttribute('x', rotx);
        arr[i].setAttribute('y', roty);
    }
})

cform.logo.addEventListener("input", () => {
    document.getElementById('spolem-logo').setAttribute("class", cform.logo.checked ? 'unhide' : 'hide');
})

let tarcza = document.getElementById('tarcza');
let svg = new SVGObject(tarcza);
let analoginterval = -1;
let digitalinterval = -1;

function createAnalog(svg) {
    if(digitalinterval != -1) {
        clearInterval(digitalinterval);
        digitalinterval = -1;
    }

    svg.clear();
    
    svg.appendChild(new SVGArbitrary('defs', [new SVGArbitrary('filter', [new SVGArbitrary('feGaussianBlur', '', '', '', {in: 'SourceGraphic', stdDeviation: '15'} )], '', '', {id: 'f1', x: '0', y:'0'})]));
    svg.appendChild(new SVGRectangle(0, 0, svg.width, svg.height, 0, 0, '', '',{filter:'url(#f1)', id: 'tarcza-bg'}))
    svg.appendChild(new SVGCircle(svg.width / 2, svg.height / 2, svg.width * 10.4 / 22, '', '', {id: 'tarcza-kolo'}))

    let minute_markers = new SVGGroup([],'', '', {id: 'minute-markers'});
    svg.appendChild(minute_markers);

    for (let i = 0; i < 60; i++) {
        minute_markers.appendChild(new SVGLine(svg.width * 19 / 22, svg.height / 2, svg.width * 10 / 11, svg.height / 2, "stroke-width: 1", `rotate(${i*6} ${svg.width / 2},${svg.height / 2})`));
    }

    let hour_markers = new SVGGroup([],'', '', {id: 'hour-markers'});
    svg.appendChild(hour_markers);

    for (let i = 0; i < 12; i++) {
        hour_markers.appendChild(new SVGLine(svg.width * 17 / 22, svg.height / 2, svg.width * 10 / 11, svg.height / 2, "stroke-width: 2", `rotate(${i*30} ${svg.width / 2},${svg.height / 2})`));
    }

    let image = new SVGArbitrary('image', [], '', '', {
        x: `${svg.width / 2 - ((635 / 880) * svg.width / 4)}`,
        y: `${svg.height /2 - ((171 / 880) * svg.height / 4)}`,
        width: `${(635 / 880) * svg.width / 2}`,
        height: `${(171 / 880) * svg.height / 2}`,
        href: '',
        id: 'spolem-logo',
        class: cform.logo.checked ? 'unhide' : 'hide'
    });
    svg.appendChild(image);

    let hour_labels = new SVGGroup([],'', '', {id: 'hour-labels'});
    svg.appendChild(hour_labels);
    for (let i = 0; i < 12; i++) {
        let cx = svg.width * 11 / 22;
        let cy = svg.height * 11.2 / 22;
    
        let tx = svg.width * 11 / 22;
        let ty = svg.height * (cform.inner.checked ? 6 / 22 : 0.75 / 11);
        
        let [rotx, roty] = rotateAround(tx, ty, cx, cy, (i+1)*30)

        hour_labels.appendChild(new SVGText(rotx, roty, `${cform.godziny.checked ? (cform.labeltype.value == "0" ? i+1 : cform.labeltype.value == "1" ? rzymskie[i] : "") : ""}`, "", `rotate(0 ${rotx},${roty})`, {class: 'center-text'}));
    }

    let minute_labels = new SVGGroup([],'', '', {id: 'minute-labels'});
    svg.appendChild(minute_labels);
    for (let i = 0; i < 60; i++) {
        let cx = svg.width * 11 / 22;
        let cy = svg.height * 11.1 / 22;

        let tx = svg.width * 11 / 22;
        let ty = svg.height * 0.90 / 11;
        
        let [rotx, roty] = rotateAround(tx, ty, cx, cy, (i+1)*6)

        minute_labels.appendChild(new SVGText(rotx, roty, `${(cform.minuty.checked && !cform.minuty5.checked) || (cform.minuty.checked && cform.minuty5.checked && (i+1) % 5 == 0)? (cform.labeltype.value == "0" ? i+1 : cform.labeltype.value == "1" ? rzymskie[i] : "") : ""}`, "", `rotate(0 ${rotx},${roty})`, {class: 'small-text center-text'}));
    }

    let second_labels = new SVGGroup([],'', '', {id: 'second-labels'});
    svg.appendChild(second_labels);
    for (let i = 0; i < 60; i++) {
        let cx = svg.width * 11 / 22;
        let cy = svg.height * 11.1 / 22;

        let tx = svg.width * 11 / 22;
        let ty = svg.height * 0.90 / 11;
        
        let [rotx, roty] = rotateAround(tx, ty, cx, cy, (i+1)*6)

        second_labels.appendChild(new SVGText(rotx, roty, `${cform.sekundy.checked ? (cform.labeltype.value == "0" ? i+1 : cform.labeltype.value == "1" ? rzymskie[i] : "") : ""}`, "", `rotate(0 ${rotx},${roty})`, {class: 'smaller-text center-text'}));
    }


    let cur_time = new Date();

    let hands_of_time = new SVGGroup([],'', '', {id: 'hands-of-time'});
    svg.appendChild(hands_of_time);

    hands_of_time.appendChild(new SVGLine(svg.width / 2, svg.height / 2, svg.width * 10 / 11, svg.height * 10.5 / 22, '', `rotate(${-87 + cur_time.getSeconds() * 6} ${svg.width / 2},${svg.height / 2})`, {id: 'seconds'}));
    hands_of_time.appendChild(new SVGLine(svg.width / 2, svg.height / 2, svg.width * 18 / 22, svg.height * 10.5 / 22, '', `rotate(${-86 + cur_time.getSeconds() * 6/60 + cur_time.getMinutes() * 6} ${svg.width / 2},${svg.height / 2})`, {id: 'minutes'}));
    hands_of_time.appendChild(new SVGLine(svg.width / 2, svg.height / 2, svg.width * 17 / 22, svg.height * 10.5 / 22, '', `rotate(${-86 + cur_time.getMinutes() * 0.5 + cur_time.getHours() * 30} ${svg.width / 2},${svg.height / 2})`, {id: 'hours'}));

    svg.render();
    setTheme();

    if(analoginterval == -1) {
        analoginterval = setInterval(updateAnalog, 1000);
    }
}

function updateAnalog() {
    let cur_time = new Date();
    processAlarms(cur_time.getHours(), cur_time.getMinutes());
    let sec = document.getElementById('seconds');
    let min = document.getElementById('minutes');
    let hrs = document.getElementById('hours');

    sec.setAttribute('transform', `rotate(${-87 + cur_time.getSeconds() * 6} ${svg.width / 2},${svg.height / 2})`);
    min.setAttribute('transform', `rotate(${-86 + cur_time.getSeconds() * 6/60 + cur_time.getMinutes() * 6} ${svg.width / 2},${svg.height / 2})`);
    hrs.setAttribute('transform', `rotate(${-86 + cur_time.getMinutes() * 0.5 + cur_time.getHours() * 30} ${svg.width / 2},${svg.height / 2})`);
}

/**
 * 
 * @param {SVGObject} svg 
 */
function createDigital(svg) {
    if(analoginterval != -1) {
        clearInterval(analoginterval);
        analoginterval = -1;
    }

    svg.clear();

    svg.appendChild(new SVGArbitrary('defs', [
        new SVGArbitrary('filter', [new SVGArbitrary('feGaussianBlur', '', '', '', {in: 'SourceGraphic', stdDeviation: '15'} )], '', '', {id: 'f1', x: '0', y:'0'}),
        new SVGArbitrary('clipPath', [new SVGRectangle(svg.width * 5/22, svg.height * 4/22, svg.width * 12 / 22, svg.height * 12 / 22)], '', '', {id: 'screen-clip'})
    ]
    ));
    svg.appendChild(new SVGRectangle(0, 0, svg.width, svg.height, 0, 0, '', '',{filter:'url(#f1)', id: 'tarcza-bg'}))
    
    svg.appendChild(new SVGRectangle(svg.width * 3.5/22, svg.height * 2/22, svg.width * 15 / 22, svg.height * 18 / 22, 15, 15, '', '', {id: 'digi-padding'}))

    svg.appendChild(new SVGRectangle(svg.width * 3.5/22, svg.height * 2/22, svg.width * 15 / 22, svg.height * 18 / 22, 15, 15, '', '', {id: 'digi-border'}))

    svg.appendChild(new SVGRectangle(svg.width * 5/22, svg.height * 4/22, svg.width * 12 / 22, svg.height * 12 / 22, 0, 0, '', '', {id: 'digi-screen'}))


    let image = new SVGArbitrary('image', [], '', '', {
        x: `${svg.width * 1 / 8}`,
        y: `${svg.height * 0.5 / 8}`,
        width: `${svg.width * 3 / 4}`,
        height: `${svg.height * 3 / 4}`,
        href: '',
        id: 'spolem-logo',
        class: cform.logo.checked ? 'unhide' : 'hide',
        'clip-path': 'url(#screen-clip)'
    });
    svg.appendChild(image);

    let displays = new SVGGroup([], '', '', {id: 'display-digits'})

    function createDigit(x, y, width, height) {
        let digit = new SVGRectangle(x, y, width, height, 0, 0, '', '', {class: "digit_rect"});
    
        let segments = [
            new SVGPolygon([
                [digit.x + digit.width * 1.5 / 8, digit.y + digit.height / 2],
                [digit.x + digit.width * 2 / 8, digit.y + digit.height * 11 / 20],
                [digit.x + digit.width * 6 / 8, digit.y + digit.height * 11 / 20],
                [digit.x + digit.width * 6.5 / 8, digit.y + digit.height / 2],
                [digit.x + digit.width * 6 / 8, digit.y + digit.height * 9 / 20],
                [digit.x + digit.width * 2 / 8, digit.y + digit.height * 9 / 20],
            ] , '', '', {class: 'segment'}),
            new SVGPolygon([
                [digit.x + digit.width * 1.4 / 8, digit.y + digit.height * 9.5 / 20],
                [digit.x + digit.width * 0.9 / 8, digit.y + digit.height * 8.5 / 20],
                [digit.x + digit.width * 0.9 / 8, digit.y + digit.height * 2.5 / 20],
                [digit.x + digit.width * 1.4 / 8, digit.y + digit.height * 1.5 / 20],
                [digit.x + digit.width * 1.9 / 8, digit.y + digit.height * 2.5 / 20],
                [digit.x + digit.width * 1.9 / 8, digit.y + digit.height * 8.5 / 20],
            ] , '', '', {class: 'segment'}),
            new SVGPolygon([
                [digit.x + digit.width * 1.5 / 8, digit.y + digit.height * 1 / 20],
                [digit.x + digit.width * 2 / 8, digit.y + digit.height * 0 / 20],
                [digit.x + digit.width * 6 / 8, digit.y + digit.height * 0 / 20],
                [digit.x + digit.width * 6.5 / 8, digit.y + digit.height * 1 / 20],
                [digit.x + digit.width * 6 / 8, digit.y + digit.height * 2 / 20],
                [digit.x + digit.width * 2 / 8, digit.y + digit.height * 2 / 20],
            ] , '', '', {class: 'segment'}),
            new SVGPolygon([
                [digit.x + digit.width * 6.6 / 8, digit.y + digit.height * 9.5 / 20],
                [digit.x + digit.width * 6.1 / 8, digit.y + digit.height * 8.5 / 20],
                [digit.x + digit.width * 6.1 / 8, digit.y + digit.height * 2.5 / 20],
                [digit.x + digit.width * 6.6 / 8, digit.y + digit.height * 1.5 / 20],
                [digit.x + digit.width * 7.1 / 8, digit.y + digit.height * 2.5 / 20],
                [digit.x + digit.width * 7.1 / 8, digit.y + digit.height * 8.5 / 20],
            ] , '', '', {class: 'segment'}),
            new SVGPolygon([
                [digit.x + digit.width * 6.6 / 8, digit.y + digit.height * 10.5 / 20],
                [digit.x + digit.width * 6.1 / 8, digit.y + digit.height * 11.5 / 20],
                [digit.x + digit.width * 6.1 / 8, digit.y + digit.height * 17.5 / 20],
                [digit.x + digit.width * 6.6 / 8, digit.y + digit.height * 18.5 / 20],
                [digit.x + digit.width * 7.1 / 8, digit.y + digit.height * 17.5 / 20],
                [digit.x + digit.width * 7.1 / 8, digit.y + digit.height * 11.5 / 20],
            ] , '', '', {class: 'segment'}),
            new SVGPolygon([
                [digit.x + digit.width * 1.5 / 8, digit.y + digit.height * 19 / 20],
                [digit.x + digit.width * 2 / 8, digit.y + digit.height * 20 / 20],
                [digit.x + digit.width * 6 / 8, digit.y + digit.height * 20 / 20],
                [digit.x + digit.width * 6.5 / 8, digit.y + digit.height * 19 / 20],
                [digit.x + digit.width * 6 / 8, digit.y + digit.height * 18 / 20],
                [digit.x + digit.width * 2 / 8, digit.y + digit.height * 18 / 20],
            ] , '', '', {class: 'segment'}),
            new SVGPolygon([
                [digit.x + digit.width * 1.4 / 8, digit.y + digit.height * 10.5 / 20],
                [digit.x + digit.width * 0.9 / 8, digit.y + digit.height * 11.5 / 20],
                [digit.x + digit.width * 0.9 / 8, digit.y + digit.height * 17.5 / 20],
                [digit.x + digit.width * 1.4 / 8, digit.y + digit.height * 18.5 / 20],
                [digit.x + digit.width * 1.9 / 8, digit.y + digit.height * 17.5 / 20],
                [digit.x + digit.width * 1.9 / 8, digit.y + digit.height * 11.5 / 20],
            ] , '', '', {class: 'segment'}),
        ]

        return new SVGGroup(segments, '', '', {class: 'digit'});
    }

    let digits = [
        createDigit(svg.width * 7.5 / 22, svg.height * 6 / 22, svg.width * 2 / 22, svg.height * 3 / 22),
        createDigit(svg.width * 9.5 / 22, svg.height * 6 / 22, svg.width * 2 / 22, svg.height * 3 / 22),
        createDigit(svg.width * 12.5 / 22, svg.height * 6 / 22, svg.width * 2 / 22, svg.height * 3 / 22),
        createDigit(svg.width * 14.5 / 22, svg.height * 6 / 22, svg.width * 2 / 22, svg.height * 3 / 22),
    ];

    function createSeparator(x, y, width) {
        let rect = new SVGRectangle(x, y, width, width) // this is a square

        let segment = new SVGPolygon([
            [x + rect.width / 2, y],
            [x + rect.width, y + rect.height / 2],
            [x + rect.width / 2, y + rect.width],
            [x, y + rect.width / 2]
        ], '', '', {class: 'separator-dot'})

        return segment
    }

    let separator = new SVGGroup([
        createSeparator(svg.width * 11.625 / 22, svg.height * 6.4 / 22, svg.width * 0.825 / 22),
        createSeparator(svg.width * 11.625 / 22, svg.height * 7.7 / 22, svg.width * 0.825 / 22)
    ], '', '', {id: 'hour-separator'})

    svg.appendChild(separator);

    let cur_date = new Date();

    /*
            2
        1       3
            0
        6       4
            5
    */
    
    let conv = [
        [1, 2, 3, 4, 5, 6],
        [3, 4],
        [2, 3, 0, 6, 5],
        [2, 3, 0, 4, 5],
        [1, 0, 3, 4],
        [2, 1, 0, 4, 5],
        [2, 1, 0, 4, 5, 6],
        [2, 3, 4],
        [0, 1, 2, 3, 4, 5, 6],
        [0, 1, 2, 3, 4, 5],
    ]

    function charToDigit(c) {
        let d = c.toString();
        return conv[d];
    }

    
    let hrs = cur_date.getHours().toString().padStart(2, '0')
    let min  = cur_date.getMinutes().toString().padStart(2, '0')
    let d_arr = [hrs[0], hrs[1], min[0], min[1]];

    for(let i = 0; i < 4; i++) {
        if ((cform.godziny.checked && (i == 0 || i == 1)) || (cform.minuty.checked && (i == 2 || i == 3))) {
            let arr = charToDigit(d_arr[i]);
            for (let j = 0; j < 7; j++) {
                digits[i].children[j].style = (arr.includes(j)) ? 'display: unset;' : 'display: none;'
            }
        } else {
            for (let j = 0; j < 7; j++) {
                digits[i].children[j].style = 'display: none;'
            }
        }
    }
    
    for(let i = 0; i < 4; i++) {
        if ((cform.godziny.checked && (i == 0 || i == 1)) || (cform.minuty.checked && (i == 2 || i == 3))) {
            let arr = charToDigit(d_arr[i]);
            for (let j = 0; j < 7; j++) {
                [...digits[i].children][j].style = (arr.includes(j)) ? 'display: unset;' : 'display: none;'
            }
        }
    }

    displays.appendChildren(digits);
    
    svg.appendChild(displays);

    let daytext = new SVGText(svg.width * 12 / 22, svg.height * 11 / 22, removePolishDiacritics(cur_date.toLocaleDateString((navigator.languages && navigator.languages.length) ? navigator.languages[0] : navigator.language, { weekday: 'long' })), '', '', {class: 'digi-text', id:'weekday-text', textLength: svg.width * 9.5 / 22});

    svg.appendChild(daytext);

    let monthtext = new SVGText(svg.width * 12 / 22, svg.height * 13 / 22, removePolishDiacritics(cur_date.toLocaleDateString((navigator.languages && navigator.languages.length) ? navigator.languages[0] : navigator.language, { month: 'short', day: '2-digit' })), '', '', {class: 'digi-text', id:'month-text', textLength: svg.width * 9.5 / 22});

    svg.appendChild(monthtext);
    svg.render()

    setTheme()
    if(digitalinterval == -1) {
        digitalinterval = setInterval(updateDigital, 1000);
    }
}

function removePolishDiacritics(s) {
    return s.replace('ś', 's').replace('ą', 'a').replace('ę', 'e').replace(/[żź]/, 'z').replace('ń', 'n').replace('ł', 'l');
}

function updateDigital(svg) {
    let cur_date = new Date();
    processAlarms(cur_date.getHours(), cur_date.getMinutes());
    
    let conv = [
        [1, 2, 3, 4, 5, 6],
        [3, 4],
        [2, 3, 0, 6, 5],
        [2, 3, 0, 4, 5],
        [1, 0, 3, 4],
        [2, 1, 0, 4, 5],
        [2, 1, 0, 4, 5, 6],
        [2, 3, 4],
        [0, 1, 2, 3, 4, 5, 6],
        [0, 1, 2, 3, 4, 5],
    ]

    function charToDigit(c) {
        let d = c.toString();
        return conv[d];
    }

    let hrs = cur_date.getHours().toString().padStart(2, '0')
    let min  = cur_date.getMinutes().toString().padStart(2, '0')
    let d_arr = [hrs[0], hrs[1], min[0], min[1]];
    let digits = [...document.getElementById('display-digits').children]
    
    for(let i = 0; i < 4; i++) {
        if ((cform.godziny.checked && (i == 0 || i == 1)) || (cform.minuty.checked && (i == 2 || i == 3))) {
            let arr = charToDigit(d_arr[i]);
            for (let j = 0; j < 7; j++) {
                [...digits[i].children][j].style = (arr.includes(j)) ? 'display: unset;' : 'display: none;'
            }
        }
    }

    document.getElementById('weekday-text').innerText = removePolishDiacritics(cur_date.toLocaleDateString((navigator.languages && navigator.languages.length) ? navigator.languages[0] : navigator.language, { weekday: 'long' }));

    document.getElementById('month-text').innerText = removePolishDiacritics(cur_date.toLocaleDateString((navigator.languages && navigator.languages.length) ? navigator.languages[0] : navigator.language, { month: 'short', day: '2-digit' }));
}

if (cform.clocktype.value == "0") {
    createAnalog(svg);
} else {
    createDigital(svg);
}

root.style.setProperty('--svg-width', svg.width);

setTheme();