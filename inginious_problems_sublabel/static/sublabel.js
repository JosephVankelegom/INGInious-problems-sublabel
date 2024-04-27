
let colors = ['yellow', 'blue', 'red', 'green']
const eventReload = new CustomEvent("reloadAll");

function load_input_sublabel(submissionid, key, input) {
    var field = $("form#task input[name='" + key + "']");
    if(key in input){
        $(field).prop('value', input[key]);
        $(field).trigger('change')
    }

    else
        $(field).prop('value', "");

}

function studio_init_template_sublabel(well, pid, problem)
{
    let textarea = $('#code-' + pid, well)
    let answerarea = $('#answer-' + pid, well)
    let lineNumbers = $("#line_code-" + pid, well);

    let labelNameID = {}
    let highlightColor = {}
    let highlightValue = {}
    let textareasize = 0;


    if("answer" in problem && problem["answer"] !== ""){

        answerarea.val(problem["answer"]);
        let answer = JSON.parse(problem["answer"])
        for(let id in answer){
            if(id === "0"){break;}
            labelNameID[id] = answer[id]["label"];
            highlightColor[id] = answer[id]["color"]
            highlightValue[id] = answer[id]["values"]
        }
    }

    if("code" in problem){
        textarea.val(problem["code"]);
        textareasize = problem["code"].length
    }


    let exercise = new SubLabel(textarea, answerarea, highlightValue, labelNameID, highlightColor, pid, well, textareasize, "teacher", lineNumbers);
    contextMenuStart(textarea, pid, well)
    exercise.startTeacher();
}

function load_feedback_sublabel(key, content) {
    load_feedback_code(key, content);
}

class SubLabel{

    constructor(textarea, answerarea, highlightValue, labelNameID, highlightColor, pid, well,textareasize, side, linenumbers) {
        this.pid            = pid
        this.well           = well
        this.textarea       = textarea;
        this.answerarea     = answerarea;
        this.highlightValue = highlightValue;
        this.labelNameID    = labelNameID;
        this.highlightColor = highlightColor;
        this.textareasize   = textareasize
        this.side           = side;
        this.lineNumbers    = linenumbers
    }

    startTeacher() {

        let lineNumbers = this.lineNumbers;

         for(let id in this.labelNameID){
            this.createLabelText(id, this.highlightColor[id], false, this.pid, this.well)
            this.createLabelContext(id, this.pid, this.well)
            this.set_labelNameID(id, this.labelNameID[id], this.pid, this.well)
        }


        var that = this;
        this.createHighlightTextarea();
        this.createEraseContext(this.pid, this.well)

        $('#addLabel-'+ this.pid, this.well).on('click', () => {this.createLabelTeacher(this.pid, this.well)})

        // add the possibility of tabulation
        this.textarea.on('keydown', function(e){
            if(e.key === 'Tab'){
                e.preventDefault();
                var start = this.selectionStart;
                var end = this.selectionEnd;

                this.value = this.value.substring(0, start) + "    " + this.value.substring(end);

                // put caret at right position again
                this.selectionStart =
                    this.selectionEnd = start+4;

                //that.updateValues()
            }
        })

        this.textarea.on('input', function(e){
            var start = this.selectionStart;
            var end = this.selectionEnd;
            const indent = that.updateIndexesOnInput(start, end);
            //that.updateValues()
        })



        // Generate line numbers
        this.textarea.on('input', function() {
          var lines = this.value.split('\n').length;
          lineNumbers.html('')
          for (var i = 1; i <= lines; i++) {
            lineNumbers.html(lineNumbers.html()+ i + '<br>')
          }
        });

        this.textarea.on('input', function() {
            this.style.height = 'auto';
            this.style.height = this.scrollHeight + 'px';
        });
        this.textarea.on('click', function() {
            this.style.height = 'auto';
            this.style.height = this.scrollHeight + 'px';
            that.textarea.trigger('input');
        });
        // Initial line numbers generation
    }

    startStudent(){

        var lineNumbers = this.lineNumbers;

        for(let id in this.labelNameID){
            this.createLabelText(id, this.highlightColor[id], true, this.pid, this.well)
            this.createLabelContext(id, this.pid, this.well)
            this.set_labelNameID(id, this.labelNameID[id], this.pid, this.well)
        }


        this.createHighlightTextarea()
        this.createEraseContext(this.pid, this.well)

        this.answerarea.on('change', () => {
            let answer = this.answerarea.val();
            if(answer === ""){return}
            answer = JSON.parse(answer);
            this.labelNameID = {};
            this.highlightValue = {};
            this.highlightColor = {};
            for(let id in answer){
                this.labelNameID[id] = answer[id]["label"];
                this.highlightColor[id] = answer[id]["color"]
                this.highlightValue[id] = answer[id]["values"]
            }
            this.createHighlightTextarea()
        })

        this.textarea.on('click', function() {
          var lines = this.value.split('\n').length;
          lineNumbers.html('')
          for (var i = 1; i <= lines; i++) {
            lineNumbers.html(lineNumbers.html()+ i + '<br>')
          }
        });

        this.textarea.on('click', function() {
            this.style.height = 'auto';
            this.style.height = this.scrollHeight + 'px';
        });
    }

    /**
     *
     */

    createHighlightTextarea(){

        // check the display box is checked
        let highlightValueChecked = {};
        for(const [id, value]  of Object.entries(this.highlightValue)){
            if(this.isBoxChecked(id, this.pid, this.well)){
                highlightValueChecked[id] = value
            }
        }

        // create the intersection between intervals of labels
        let dataIntersections = this.findIntersectionsAndNonIntersectionsAll(highlightValueChecked);
        if(dataIntersections.length === 0){return this.textarea.highlightWithinTextarea({highlight:[]})}
        let highListFormated = [];
        for(let label in dataIntersections){
            highListFormated.push({highlight: dataIntersections[label], className: this.highlightColor[label]})
        }
        this.textarea.highlightWithinTextarea({highlight : highListFormated})
    }

    createLabelTeacher(pid, well){
        let color = colors[lengthDict(this.highlightValue)]
        var id = "Label_id_" + lengthDict(this.highlightValue).toString(); // TODO a verifier dans le futur que ca ne fasse pas crash si creation + delete (trouver solution plus élégante)
        this.createLabelText(id, color, false, pid, well)
        this.createLabelContext(id, pid, well)
        this.highlightValue[id] = [];
        this.highlightColor[id] = color

    }

    eraseLabelTeacher(id, labelDiv){
        let result = confirm("Press OK to erase the label");
        if(result){
            delete this.labelNameID[id]
            delete this.highlightColor[id]
            delete this.highlightValue[id]
            $("#label-text_" + id+"-"+this.pid, this.well).remove()
            this.getCheckBox(id,this.pid,this.well).remove()
            $("context-menu-item_" + id+"-"+this.pid, this.well).remove()
            $("#erase-label_" + id+"-"+this.pid, this.well).remove()
            labelDiv.remove()
            this.updateValues()
        }
    }
    eraseLabelStudent(id, labelDiv){
        let result = confirm("Press OK to erase the label");
        if(result){
            this.highlightValue[id] = [[]]
            this.updateValues()
        }
    }

    createLabelStudent(id, name, color){
        this.createLabelContext(id);
        this.highlightValue[id] = [];
        this.highlightColor[id] = color;
        this.labelNameID[id] = name;
    }

    createLabelContext(id, pid, well){
        var li = document.createElement("li");
        li.setAttribute("id", "context-menu-item_" + id+"-"+pid);
        li.onclick =  ()=> {this.highlightSelection(id)}
        var ul = $("#context-menu-ul-"+pid, well);
        ul.append(li);
    }

    createEraseContext(pid, well){
        var li = document.createElement("li");
        li.setAttribute("id", "context-menu-erase_"+pid);
        li.textContent = "erase"
        li.onclick =  ()=> {this.highlightSelectionErase(pid, well)}
        var ul = $("#context-menu-ul-"+pid, well);
        ul.append(li);
    }


    /***
     * Create Label Input Field
     * @param id
     * @param color
     * @param isReadonly
     * @param pid
     * @param well
     */
    createLabelText(id, color, isReadonly, pid, well){

        let labelDiv = $('#label-div-'+pid, well)

        var inputGroupDiv = document.createElement("div")
        inputGroupDiv.setAttribute("class", "input-group mb-3");

        var labelNameArea = document.createElement("input");
        labelNameArea.setAttribute("type", "text")
        labelNameArea.setAttribute("id", "label-text_"+id+"-"+pid)
        labelNameArea.setAttribute("placeholder", "Label name")
        labelNameArea.setAttribute("style", "background-color: var(--"+color+");")
        labelNameArea.setAttribute("class", "form-control")
        if(isReadonly){labelNameArea.setAttribute("readonly", "true")}
        else{labelNameArea.oninput = ()=> {this.updateLabel(id, labelNameArea)}}

        this.createCheckBox(id, inputGroupDiv, pid, well);
        inputGroupDiv.append(labelNameArea);
        this.createEraseLabelButton(id, inputGroupDiv, pid, well, isReadonly);

        labelDiv.append(inputGroupDiv)

    }


    updateLabel(id,labelNameArea) {
        let new_name = labelNameArea.value;
        this.set_labelNameID(id, new_name, this.pid, this.well);
    }


    /**
     * create a checkbox that is linked to each label, with id define as checkbox_{{id from label}}-{{id of exercice}}
     * @param id = id of the label.
     * @param textarea where the text should be highlighted
     * @param labelNameArea is the input area where we set the label name
     */
    createCheckBox(id, labelDiv, pid, well){

        var inputPrependDiv = document.createElement("div")
        inputPrependDiv.setAttribute("class", "input-group-prepend")

        var inputTextDiv = document.createElement("div")
        inputTextDiv.setAttribute("class", "input-group-text")

        var checkBox = document.createElement("input")
        checkBox.setAttribute("type", "checkbox")
        checkBox.setAttribute("id", "checkbox_" + id +"-"+pid);
        checkBox.setAttribute("checked", "checked");
        checkBox.setAttribute("name", "checkbox");
        checkBox.onclick = ()=> {this.updateHighlightTextArea(this.highlightValue)}

        labelDiv.append(inputPrependDiv)
        inputPrependDiv.append(inputTextDiv)
        inputTextDiv.append(checkBox)

    }


    getCheckBox(id, pid, well){
        return $("#checkbox_" + id +"-"+pid);
    }
    isBoxChecked(id,pid,well){
        return this.getCheckBox(id,pid,well).is(":checked");
    }


    /**
     * Create the Erase button that is linked to each label.
     * @param id
     * @param labelDiv
     */
    createEraseLabelButton(id, labelDiv, pid, well, isReadonly){

        var inputGroupDiv = document.createElement("div");
        inputGroupDiv.setAttribute("class", "input-group-append");

        var eraseLabel = document.createElement("button");
        eraseLabel.setAttribute("id", "erase-label_" + id+"-"+this.pid);
        eraseLabel.setAttribute("class", "btn btn-outline-secondary")
        eraseLabel.setAttribute("type", "button")
        if(isReadonly){
            eraseLabel.onclick = () => {this.eraseLabelStudent(id,labelDiv)}
        }
        else{
            eraseLabel.onclick = () => {this.eraseLabelTeacher(id,labelDiv)}
        }


        var iconTrash = document.createElement("i");
        iconTrash.setAttribute("class", "fa fa-lg fa-trash-o");

        inputGroupDiv.append(eraseLabel);
        eraseLabel.append(iconTrash);
        labelDiv.append(eraseLabel);
    }

    set_labelNameID(id, name,pid, well){
        this.labelNameID[id] = name;
        let area = $("#label-text_"+id+"-"+pid);
        area.val(name);
        this.set_contextName(id,name,pid, well);
    }

    set_contextName(id,name, pid, well){ // TODO a changer danger PID pas bien écrit
        let li = document.getElementById("context-menu-item_" +id+"-"+pid);
        li.textContent = name;
    }

    highlightSelection(label){
        //const codeAreaVal = document.getElementById('code-' + pid);
        let selS = this.textarea[0].selectionStart;
        let selE = this.textarea[0].selectionEnd;
        this.highlightValue[label] = this.updateArray(Math.min(selS,selE),Math.max(selS,selE), this.highlightValue[label]);
        this.updateValues();
    }

    highlightSelectionErase(pid, well){
        let selS = this.textarea[0].selectionStart
        let selE = this.textarea[0].selectionEnd;
        for(const [id, value]  of Object.entries(this.highlightValue)){
            if(this.isBoxChecked(id, pid, well)){
                this.highlightValue[id] = this.removeFromArray(this.highlightValue[id],[Math.min(selS,selE),Math.max(selS,selE)])
            }
        }
        this.updateValues();
    }

    updateValues() {
        this.updateHighlightTextArea()
        this.updateAnswerArea()
    }

    /**
     * It updates the highlight textarea with the new highlighted values.
     * Could erase it and create a check in createHighlightTextarea
     */
    updateHighlightTextArea(){
        this.textarea.highlightWithinTextarea('destroy');
        this.createHighlightTextarea()
    }



    updateAnswerArea(){
        let ids = Object.keys(this.highlightValue);
        let answerDic   = {}
        for(let i = 0; i<ids.length; i++){
            let id = ids[i];
            answerDic[id] = {}
            answerDic[id]["label"] = this.labelNameID[id];
            answerDic[id]["color"] = this.highlightColor[id];
            answerDic[id]["values"] = this.highlightValue[id];
        }

        this.answerarea.val(JSON.stringify(answerDic));
    }


    addTabTextarea(e){
        if(e.key === 'Tab'){
            e.preventDefault();
            var start = this.selectionStart;
            var end = this.selectionEnd;

            this.value = this.value.substring(0, start) + "\t" + this.value.substring(end);

            // put caret at right position again
            this.selectionStart =
                this.selectionEnd = start+1;
        }
    }

    /**
     *
     *
     *
     * Utils for arrays
     *
     *
     *
     *
     ***/

    updateArray(start, end, array){  // TODO need to add when 0-6 6-9 => 0-9
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

    getIntersectionTwoArrays(ranges1,labelsRanges1,ranges2,labelsRanges2){
        function getNewLabelsValuesInsideFunction(label1,label2, that){
            if(label1[0] === "time"){return [`${label2}`]}
            else{
                let newLabel = label1.concat(label2).toString()
                if(!(newLabel in that.highlightColor)){
                    that.highlightColor[newLabel] = that.highlightColor[label1].concat(`-${that.highlightColor[label2]}`)
                }
                return newLabel
            }
        }
        let newRanges = [];
        let newLabels = [];
        for(let index1 = 0; index1 < ranges1.length; index1++){
            let intersecting = false;
            let foundIntersectingIndex = 0;
            let range1 = ranges1[index1]
            for(let index2 = 0; index2 < ranges2.length; index2++){
                if(this.isIntersecting(range1,ranges2[index2])){
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
                newLabels.push([getNewLabelsValuesInsideFunction(labelsRanges1[index1],labelsRanges2[foundIntersectingIndex], this)])
                // if range1 is bigger we need to take into consideration the part left left.
                if(range1[1] > range2[1]){
                    let temp = this.getIntersectionTwoArrays([[range2[1], range1[1]]], [labelsRanges1[index1]], ranges2, labelsRanges2) // TODO On revisite toute les liste quand il y a pas besoin.
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
    isIntersecting(range1, range2){
        return (range1[0] < range2[1] && range1[1] > range2[0]);
    }


    findIntersectionsAndNonIntersectionsAll(dictHighValsChecked){
        let result = {};
        let arrayTime = [[0,Number.MAX_VALUE]];
        let labelTime = [["time"]];
        let ids = Object.keys(dictHighValsChecked);
        for (let i = 0; i < ids.length; i++){
            let id = [[ids[i]]];
            for(let j = 1; j < dictHighValsChecked[id[0][0]].length; j ++){id.push(id[0])}
            let temp = this.getIntersectionTwoArrays(arrayTime, labelTime, dictHighValsChecked[id[0][0]], id)
            arrayTime = temp[0];
            labelTime = temp[1];
        }

        for(let i = 0; i < arrayTime.length; i++){
            let newLabel = labelTime[i][0];
            if(newLabel === "time"){continue;}

            if(newLabel in result){result[newLabel] = result[newLabel].concat([arrayTime[i]])}
            else{result[newLabel] = [arrayTime[i]]}
        }
        return result;
    }

    /**
     * @param ranges are a list of lists representing intervals
     * @param excludeRange is one list representing all the values that if they intersect with ranges to remove from ranges.
     */
    removeFromArray(ranges, excludeRange){
        let result = [[]];
        for(let i = 0; i<ranges.length; i++){
            let range = ranges[i];
            if (this.isIntersecting(range, excludeRange)){
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

    updateIndexesOnInput(start, end){
        let newSize = this.textarea.val().length
        const indent = newSize-this.textareasize
        let ids = Object.keys(this.highlightValue)
        for(let j in ids){
            let id = ids[j]
            let array = this.highlightValue[id];
            for(let i = 0; i < array.length; i++){
                if(array[i][0]>end){array[i][0]+=indent}
                if(array[i][1]>end){array[i][1]+=indent}
            }
            this.highlightValue[id] = array;
        }
        this.textareasize = newSize;
        //this.updateValues();
        return indent;
    }






}




function contextMenuStart(textarea ,pid, well) {
    /**
     *
     * const contextMenu = document.getElementById("context-menus")
     *     var newDiv = document.createElement("div");
     *     newDiv.setAttribute("id", "context-menu_"+pid)
     *     contextMenu.appendChild(newDiv);
     *     const newUl = document.createElement("ul")
     *     newUl.setAttribute("id", "context-menu-ul_"+pid);
     *     newDiv.appendChild(newUl);
     */


    let newDiv = $('#context-menu-'+pid, well);
    document.addEventListener("contextmenu",  (e) => {
        e.preventDefault()

        newDiv.css({
            display: "block",
            left: event.clientX -280 + "px",
            top: event.clientY + "px"
        });
    })
    document.addEventListener("click", function (event){
        newDiv.css({
            "display": "none",
        })
    });

}


function lengthDict(dictionary){
    let count = 0;
    for(let label in dictionary){
        count += 1;
    }
    return count
}

