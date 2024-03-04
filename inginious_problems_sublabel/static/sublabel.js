
let colors = ['yellow', 'blue', 'red', 'green']
let labelNameID = {};
let highlightValue = {}; // dict of pair {label:[list of indexes]}
let highlightColor = {}; // dict of pair {label:[list of indexes]}



function load_input_sublabel(submissionid, key, input) {
    var field = $("form#task input[name='" + key + "']");
    if(key in input)
        $(field).prop('value', input[key]);
    else
        $(field).prop('value', "");
}

function studio_init_template_sublabel(well, pid, problem)
{
    if("answer" in problem)
        $('#answer-' + pid, well).val(problem["answer"]);
    if("code" in problem)
        $('#code-' + pid, well).val(problem["code"]);

    /*
    if("label_id" in problem && problem["label_id"] !== undefined){
        $('#label_id-' + pid, well).val(problem["label_id"]);
        labelNameID = problem["label_id"]
    }
    if("label_value" in problem && problem["label_value"] !== undefined){
        $('#label_value-' + pid, well).val(problem["label_value"]);
        highlightValue = problem["label_value"]
    }
    if("label_color" in problem && problem["label_color"] !== undefined)
    {
        $('#label_color-' + pid, well).val(problem["label_color"]);
        highlightColor = problem["label_color"]
    }*/

    startPage(well, pid, problem)
    contextMenuStart(well, pid, problem)
}

function load_feedback_sublabel(key, content) {
    load_feedback_code(key, content);
}


function set_labelNameID(id, name){
    labelNameID[id] = name;
    let area = document.getElementById("label_id");
    let li = document.getElementById("context-menu" + id);
    area.value = labelNameID;
    li.textContent = name;
}
function set_highlightValue(){

}
function set_highlightColor(){

}


function updateArray(start, end, array){
    /**
     * return an array of array where the group don't intersect (union of both group if intersection)
     */
    if (array === undefined){return [[start, end].sort()]}
    let result = array.flat();

    let indexStart  = result.findIndex(function(value){return value>=start}) // rajouter si plus grand que tout etc
    let indexEnd    = result.findIndex(function(value){return value>=end})
    if(indexStart   === -1){indexStart = result.length}
    if(indexEnd     === -1){indexEnd = result.length}
    let usefulStart = (indexStart%2) === 0
    let usefulEnd   = (indexEnd%2) === 0


    if(indexStart === result.length){
        result = result.concat([start, end])}
    else if(indexEnd === 0){
        result = [start, end].concat(result)}

    else if(usefulStart && usefulEnd){
        result.splice(indexStart,indexEnd-indexStart,start,end)
    }
    else if(usefulStart && !usefulEnd){
        result.splice(indexStart,indexEnd-indexStart,start)
    }
    else if(!usefulStart && usefulEnd){
        result.splice(indexStart,indexEnd-indexStart,end)
    }
    else{
        result.splice(indexStart,indexEnd-indexStart)
    }

    let resultFormat = []
    while (result.length) resultFormat.push(result.splice(0,2));
    return resultFormat;

}

function startPage(well, pid, problem) {

    let textarea = $('#code-' + pid, well)
    createHighlightTextarea()

    $('#eraseButton').on('click', function() {
        highlightValue={}
        updateValues()
    })

    function createHighlightTextarea(){

        let highListFormated = [];
        for(let label in highlightValue){
            highListFormated.push({highlight: highlightValue[label], className: highlightColor[label]})
        }
        textarea.highlightWithinTextarea({highlight : highListFormated})
    }

    function updateValues() {
        textarea.highlightWithinTextarea('destroy');
        createHighlightTextarea()
        let answer_format = ""
        for(let id in highlightValue){
            answer_format += "id : " + id + " label : " + labelNameID[id] + " color : " + highlightColor[id] + " values = " + highlightValue[id]+ "  "
        }
        $('#answer-' + pid).val(answer_format);
    }

    function highlightSelection(label){
        console.log(label)
        const codeAreaVal = document.getElementById('code-' + pid);
        let selS = codeAreaVal.selectionStart;
        let selE = codeAreaVal.selectionEnd;
        highlightValue[label] = updateArray(selS,selE, highlightValue[label]);
        updateValues();
    }



    function createLabel(){
        var idtemp = "Label_id_" + lengthDict(highlightValue).toString();  // TODO a verifier dans le futur que ca ne fasse pas crash si creation + delete (trouver solution plus élégante)
        var labelName = document.createElement("input");
        var li = document.createElement("li");
        li.setAttribute("id", "context-menu" + idtemp);
        li.onclick = function () {highlightSelection(idtemp)}
        var ul = document.getElementById("list_context-menu");
        ul.appendChild(li);

        set_labelNameID(idtemp, "Label_name" + idtemp)
        labelName.setAttribute("type", "text")
        labelName.setAttribute("id", "labelName" + idtemp)
        labelName.setAttribute("placeholder", "Label name")
        labelName.oninput = function () {updateLabel(idtemp)}
        highlightValue[idtemp] = [];
        highlightColor[idtemp] = colors[lengthDict(highlightValue)-1]   // TODO create a set and get, to not repeat code.
        document.getElementById('labelDiv').appendChild(labelName)

    }

    function updateLabel(label_id) {
        let new_name = document.getElementById("labelName" + label_id).value
        set_labelNameID(label_id, new_name);
    }

    $('#addLabel').on('click', createLabel)

}
function contextMenuStart(well, pid, problem) {
    var context = $('#code-PID')
    var contextMenu = $('#context-menu')
    document.addEventListener("contextmenu", function (e) {
        e.preventDefault()

        contextMenu.css({
            display: "block",
            left: event.clientX -280 + "px", // goes to the right if positive
            top: event.clientY  +20 + "px"  // old 200
        });
    })
    document.addEventListener("click", function (event){
        contextMenu.css({
            "display": "none"
        })
    });
}

function lengthDict(dictionary){
    let count = 0;
    for(let label in dictionary){
        console.log(label)
        count += 1;
    }
    return count
}