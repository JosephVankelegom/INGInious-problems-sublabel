
let colors = ['yellow', 'blue', 'red', 'green']

// Answer global variables
let labelNameID = {};
let highlightColor = {}; // dict of pair {label:[list of indexes]}
let highlightValue = {}; // dict of pair {label:[list of indexes]}


function load_input_sublabel(submissionid, key, input) {
    var field = $("form#task input[name='" + key + "']");
    if(key in input)
        $(field).prop('value', input[key]);
    else
        $(field).prop('value', "");
}

function studio_init_template_sublabel(well, pid, problem)
{
    if("answer" in problem){
        let textarea = $('#code-' + pid, well)
        let answerarea = $('#answer-' + pid, well)
        answerarea.val(problem["answer"]);
        let answer = JSON.parse(problem["answer"])
        for(let id in answer){
            if(id === "0"){break;}
            labelNameID[id] = answer[id]["label"];
            highlightColor[id] = answer[id]["color"]
            highlightValue[id] = answer[id]["values"]
            createLabelText(id, textarea, answerarea, answer[id]["color"], false)
            createLabelContext(id, textarea, answerarea)
            set_labelNameID(id,labelNameID[id])
        }
    }

    if("code" in problem)
        $('#code-' + pid, well).val(problem["code"]);

    startTeacher(well, pid)
    contextMenuStart()
}

function load_feedback_sublabel(key, content) {
    load_feedback_code(key, content);
}


function startTeacher(well, pid) {
    let textarea = $('#code-' + pid, well)
    let answerarea = $('#answer-' + pid, well)
    createHighlightTextarea(highlightValue, textarea)
    createEraseContext(textarea, answerarea)

    $('#eraseButton').on('click', function() {
        highlightValue={}
        updateValues(highlightValue,textarea, answerarea)
    })

    $('#addLabel').on('click', function(){createLabelTeacher(textarea, answerarea)})
}

function startStudent(textarea, answerarea){
    createHighlightTextarea(highlightValue, textarea)
    createEraseContext(textarea, answerarea)
    $('#eraseButton').on('click', function() {
        highlightValue={}
        updateValues(highlightValue,textarea, answerarea)
    })
}

function contextMenuStart() {
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


function createHighlightTextarea(dictHighlightValues, textarea){

    let dataIntersections = findIntersectionsAndNonIntersectionsAll(dictHighlightValues);
    if(dataIntersections.length === 0){return textarea.highlightWithinTextarea({highlight:[]})}
    let highListFormated = [];
    for(let label in dataIntersections){
        highListFormated.push({highlight: dataIntersections[label], className: highlightColor[label]})
    }
    textarea.highlightWithinTextarea({highlight : highListFormated})
}

function createLabelTeacher(textarea, answerarea){
    let color = colors[lengthDict(highlightValue)]
    var id = "Label_id_" + lengthDict(highlightValue).toString(); // TODO a verifier dans le futur que ca ne fasse pas crash si creation + delete (trouver solution plus élégante)
    createLabelText(id, textarea, answerarea, color, false)
    createLabelContext(id,textarea, answerarea)
    highlightValue[id] = [];
    highlightColor[id] = color   // TODO create a set and get, to not repeat code.

}

function eraseLabelTeacher(id, textarea, answerarea){
    delete labelNameID[id]
    delete highlightColor[id]
    delete highlightValue[id]
    document.getElementById("label-text_" + id).remove()
    document.getElementById("checkbox_" + id).remove()
    document.getElementById("context-menu_" + id).remove()
    document.getElementById("erase-label_" + id).remove()
    updateValues(highlightValue, textarea, answerarea)
}

function createLabelStudent(id, name, color, textarea, answerarea){
    createLabelContext(id,textarea, answerarea)
    highlightValue[id] = [];
    highlightColor[id] = color
    labelNameID[id] = name
}

function createLabelContext(id, textarea, answerarea){
    var li = document.createElement("li");
    li.setAttribute("id", "context-menu_" + id);
    li.onclick = function () {highlightSelection(id, textarea, answerarea)}
    var ul = document.getElementById("list_context-menu");
    ul.appendChild(li);
}

function createEraseContext(textarea, answerarea){
    var li = document.createElement("li");
    li.setAttribute("id", "context-menu_erase");
    li.textContent = "erase"
    li.onclick = function () {highlightSelectionErase(textarea, answerarea)}
    var ul = document.getElementById("list_context-menu");
    ul.appendChild(li);
}
function createLabelText(id, textarea, answerarea, color, isReadonly){

    var labelNameArea = document.createElement("input");
    labelNameArea.setAttribute("type", "text")
    labelNameArea.setAttribute("id", "label-text_"+id)
    labelNameArea.setAttribute("placeholder", "Label name")
    labelNameArea.setAttribute("style", "background-color: var(--"+color+");")
    if(isReadonly){labelNameArea.setAttribute("readonly", "true")}
    else{labelNameArea.oninput = function () {updateLabel(id)}}
    document.getElementById('labelDiv').appendChild(labelNameArea)
    createCheckBox(id, textarea)
    createEraseLabelButton(id, textarea, answerarea)
}

/**
 * create a checkbox with id define as checkbox_{{id from label}}
 * @param id = id of the label.
 * @param textarea where the text should be highlighted
 * @param labelNameArea is the input area where we set the label name
 */
function createCheckBox(id, textarea){
    var checkBox = document.createElement("input")
    checkBox.setAttribute("type", "checkbox")
    checkBox.setAttribute("id", "checkbox_" + id)
    checkBox.setAttribute("checked", "checked")
    checkBox.onclick = function() {updateHighlightTextArea(highlightValue, textarea)}
    document.getElementById('labelDiv').appendChild(checkBox)
}

function createEraseLabelButton(id, textarea, answerarea){
    var eraseLabel = document.createElement("button")
    eraseLabel.setAttribute("id", "erase-label_" + id)
    eraseLabel.innerHTML = "#"
    eraseLabel.onclick = function() {eraseLabelTeacher(id, textarea, answerarea)}
    document.getElementById('labelDiv').appendChild(eraseLabel)
}

function set_labelNameID(id, name){
    labelNameID[id] = name;
    let area = document.getElementById("label-text_"+id);
    area.value = name;
    set_contextName(id,name)
}

function set_contextName(id,name){
    let li = document.getElementById("context-menu_" + id);
    li.textContent = name;
}

function updateLabel(label_id) {
    let new_name = document.getElementById("label-text_"+label_id).value
    set_labelNameID(label_id, new_name);
}

function highlightSelection(label, textarea, answerarea){
    //const codeAreaVal = document.getElementById('code-' + pid);
    let selS = textarea[0].selectionStart;
    let selE = textarea[0].selectionEnd;
    highlightValue[label] = updateArray(Math.min(selS,selE),Math.max(selS,selE), highlightValue[label]);
    updateValues(highlightValue, textarea, answerarea);
}

function highlightSelectionErase(textarea, answerarea){
    let selS = textarea[0].selectionStart
    let selE = textarea[0].selectionEnd;
    for(const [id, value]  of Object.entries(highlightValue)){
        if(isBoxChecked(id)){
            highlightValue[id] = removeFromArray(highlightValue[id],[Math.min(selS,selE),Math.max(selS,selE)])
        }
    }
    updateValues(highlightValue, textarea, answerarea);
}

function updateValues(highlightValueDict,textarea, answerarea) {
    updateHighlightTextArea(highlightValueDict, textarea)
    updateAnswerArea(highlightValueDict,answerarea)
}

/**
 * It updates the highlight textarea with the new highlighted values.
 * @param highlightValueDict is a dictionary with {id:intervales}
 * id : is the id of the label
 * intervales is a list of list where each list is an interval of where the label is selected.
 * @param textarea should already have a highlightWithinTextarea that exist.
 */
function updateHighlightTextArea(highlightValueDict, textarea){
    textarea.highlightWithinTextarea('destroy');
    let highlightValueChecked = {};
    for(const [id, value]  of Object.entries(highlightValueDict)){
        if(isBoxChecked(id)){
            highlightValueChecked[id] = value
        }
    }
    createHighlightTextarea(highlightValueChecked, textarea)
}

function isBoxChecked(id){
    return document.getElementById("checkbox_"+id).checked
}

function updateAnswerArea(highlightValueDict, answerarea){
    let ids = Object.keys(highlightValueDict);
    let answer_format = "{"
    for(let i = 0; i<ids.length; i++){
        let id = ids[i];
        answer_format += '"'+id+'"'+':{"label":"'+ labelNameID[id] +'","color":"'+ highlightColor[id] +'","values":' + JSON.stringify(highlightValueDict[id])+ '}'
        if(i<ids.length-1){answer_format+=','}
    }
    answer_format+='}'
    answerarea.val(answer_format);
}

function lengthDict(dictionary){
    let count = 0;
    for(let label in dictionary){
        count += 1;
    }
    return count
}



/**
 * Utils for arrays
 ***/

function updateArray(start, end, array){  // TODO need to add when 0-6 6-9 => 0-9
    /**
     * return an array of array where the group don't intersect (union of both group if intersection)
     */
    if (array === undefined){return [[start, end]]}
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

function getIntersectionTwoArrays(ranges1,labelsRanges1,ranges2,labelsRanges2){
    function getNewLabelsValuesInsideFunction(label1,label2){
        if(label1[0] === "time"){return [`${label2}`]}
        else{return label1.concat(label2)}
    }
    let newRanges = [];
    let newLabels = [];
    for(let index1 = 0; index1 < ranges1.length; index1++){
        let intersecting = false;
        let foundIntersectingIndex = 0;
        let range1 = ranges1[index1]
        for(let index2 = 0; index2 < ranges2.length; index2++){
            if(isIntersecting(range1,ranges2[index2])){
                intersecting = true;
                foundIntersectingIndex = index2;
                break;
            }
        }

        if (intersecting) {
            let range2 = ranges2[foundIntersectingIndex];
            if(range1[0]<range2[0]){
                newRanges.push([range1[0],range2[0]])
                newLabels.push([`${labelsRanges1[index1]}`])
            }
            newRanges.push([Math.max(range1[0],range2[0]), Math.min(range1[1],range2[1])])
            newLabels.push(getNewLabelsValuesInsideFunction(labelsRanges1[index1],labelsRanges2[foundIntersectingIndex]))
            // if range1 is bigger we need to take into consideration the part left left.
            if(range1[1] > range2[1]){
                let temp = getIntersectionTwoArrays([[range2[1], range1[1]]], [labelsRanges1[index1]], ranges2, labelsRanges2) // TODO On revisite toute les liste quand il y a pas besoin.
                newRanges= newRanges.concat(temp[0]);
                newLabels= newLabels.concat(temp[1]);
            }
        } else {
            newRanges.push(range1);
            newLabels.push([`${labelsRanges1[index1]}`])
        }
    }
    return [newRanges,newLabels];
}
function isIntersecting(range1, range2){
    return (range1[0] < range2[1] && range1[1] > range2[0]);
}


function findIntersectionsAndNonIntersectionsAll(dictHighVals){
    let result = {};
    let arrayTime = [[0,Number.MAX_VALUE]];
    let labelTime = [["time"]];
    let ids = Object.keys(dictHighVals);
    for (let i = 0; i < ids.length; i++){
        let id = [[ids[i]]];
        for(let j = 1; j < dictHighVals[id[0][0]].length; j ++){id.push(id[0])}
        let temp = getIntersectionTwoArrays(arrayTime, labelTime, dictHighVals[id[0][0]], id)
        arrayTime = temp[0];
        labelTime = temp[1];
    }

    for(let i = 0; i < arrayTime.length; i++){
        let newLabel = labelTime[i][0];
        if(newLabel === "time"){continue;}
        let newColor = highlightColor[newLabel];
        if(labelTime[i].length > 1){
            for(let j=1; j < labelTime[i].length; j ++){
                newLabel= newLabel.concat(`-${labelTime[i][j]}`);
                newColor= newColor.concat(`-${highlightColor[labelTime[i][j]]}`)
            }
            if(newLabel in highlightColor){}else{highlightColor[newLabel] = newColor}
        }
        if(newLabel in result){result[newLabel] = result[newLabel].concat([arrayTime[i]])}
        else{result[newLabel] = [arrayTime[i]]}
    }
    return result;
}

/**
 * @param ranges are a list of lists representing intervals
 * @param excludeRange is one list representing all the values that if they intersect with ranges to remove from ranges.
 */
function removeFromArray(ranges, excludeRange){
    let result = [[]];
    for(let i = 0; i<ranges.length; i++){
        let range = ranges[i];
        if (isIntersecting(range, excludeRange)){
            if(range[0]>=excludeRange[0] && range[1] > excludeRange[1]){
                result = result.concat([[excludeRange[1],range[1]]])
                continue
            }
            if(range[0]<excludeRange[0]){
                result = result.concat([[range[0],excludeRange[0]]])
                if(range[1]>excludeRange[1]){
                    result = result.concat([[excludeRange[1],range[1]]])
                }
            }
        }
        else{result = result.concat([ranges[i]])}
    }
    return result;
}
