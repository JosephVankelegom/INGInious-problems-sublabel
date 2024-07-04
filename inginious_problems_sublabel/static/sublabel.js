
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
        this.action         = "action"
    }

    startTeacher() {

        let lineNumbers = this.lineNumbers;

         for(let id in this.labelNameID){
             this.createToleranceDiv(id, this.labelNameID[id], this.highlightColor[id], this.pid, this.well)
            //this.createLabelText(id, this.highlightColor[id], false, this.pid, this.well)
            //this.createLabelContext(id, this.pid, this.well)
            //this.set_labelNameID(id, this.labelNameID[id], this.pid, this.well)
        }


        var that = this;
        this.createHighlightTextarea();
        //this.createEraseContext(this.pid, this.well)
        //contextMenuStart(this.textarea, this.pid, this.well)

        //#$('#addLabel-'+ this.pid, this.well).on('click', () => {this.createLabelTeacher(this.pid, this.well)})
        $('#addLabel-'+ this.pid, this.well).on('click', () => {this.createLabelTeacher(this.pid, this.well)})

        // add the possibility of tabulation  change tab by 3 spaces.
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

        //
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
        }
        );

        this.textarea.on('input', function() {
            this.style.height = 'auto';
            this.style.height = this.scrollHeight + 'px';
        });
        this.textarea.on('click', function() {
            this.style.height = 'auto';
            this.style.height = this.scrollHeight + 'px';
        });
        // Initial line numbers generation

        this.textarea.on("select", () =>{
            switch(this.action){
                case "stop": break;
                case "eraser":
                    this.highlightSelectionErase(this.pid, this.well)
                    break;
                default:
                    this.highlightSelection(this.action)
                    break;
            }

        })

        $("#toolbar-eraser-"+this.pid).on("click", () => this.set_action("eraser"))
        $("#toolbar-stop-"+this.pid).on("click", () => this.set_action("stop"))

    }

    startStudent(){

        var lineNumbers = this.lineNumbers;

        for(let id in this.labelNameID){
            this.createLabelText(id, this.highlightColor[id], true, this.pid, this.well)
            //this.createLabelContext(id, this.pid, this.well)
            this.set_labelNameID(id, this.labelNameID[id], this.pid, this.well)
        }


        this.createHighlightTextarea()
        //this.createEraseContext(this.pid, this.well)

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


        this.textarea.on('change', function() {
          var lines = this.value.split('\n').length;
          lineNumbers.html('')
          for (var i = 1; i <= lines; i++) {
            lineNumbers.html(lineNumbers.html()+ i + '<br>')
          }
        });

        this.textarea.on('change', function() {
            this.style.height = 'auto';
            this.style.height = this.scrollHeight + 'px';
        });

        this.textarea.on("select", () =>{
            switch(this.action){
                case "stop": break;
                case "eraser":
                    this.highlightSelectionErase(this.pid, this.well)
                    break;
                default:
                    this.highlightSelection(this.action)
                    break;
            }

        })
        $("#toolbar-eraser-"+this.pid).on("click", () => this.set_action("eraser"))
        $("#toolbar-stop-"+this.pid).on("click", () => this.set_action("stop"))
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
        var id = this.generateLabelID();
        let name = $("#new_label_name").val()
        this.createToleranceDiv(id, name, color, pid, well)
        //this.createLabelContext(id, pid, well)
        this.labelNameID[id] = name
        this.highlightValue[id] = []
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
            //$("#context-menu-item_" +id+"-"+this.pid).remove()
            $("#erase-label_" + id+"-"+this.pid, this.well).remove()
            $("#toolbar-coloring_"+id+"-"+this.pid).remove()
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
        //this.createLabelContext(id);
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

        this.createColoringButton(id, $("#div-toolbar-"+pid), pid, color)
        // create coloring logo button

    }


    updateLabel(id,labelNameArea) {
        let new_name = labelNameArea.value;
        this.set_labelNameID(id, new_name, this.pid, this.well);
    }


    /**
     * create a checkbox that is linked to each label, with id define as checkbox_{{id from label}}-{{id of exercice}}
     * @param id = id of the label.
     * @param labelDiv
     * @param pid
     * @param well
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
     * @param pid
     * @param well
     * @param isReadonly
     */
    createEraseLabelButton(id, labelDiv, pid, well, isReadonly){

        var inputGroupDiv = document.createElement("div");
        inputGroupDiv.setAttribute("class", "input-group-append");

        var eraseLabel = document.createElement("button");
        eraseLabel.setAttribute("id", "erase-label_" + id+"-"+this.pid);
        eraseLabel.setAttribute("class", "btn btn-danger")
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

    createColoringButton(id, outerdiv, pid, color){
        var coloring_button = document.createElement("button")
        coloring_button.setAttribute("type", "button")
        coloring_button.setAttribute("class", "btn btn-secondary")
        coloring_button.setAttribute("id", "toolbar-coloring_"+id+"-"+pid)
        coloring_button.setAttribute("style", "background-color: var(--"+color+");")
        coloring_button.onclick = () => {this.set_action(id)}

        var iconBrush = document.createElement("i");
        iconBrush.setAttribute("class", "fa fa-paint-brush");

        coloring_button.append(iconBrush)
        outerdiv.append(coloring_button)
    }


    set_labelNameID(id, name,pid, well){
        this.labelNameID[id] = name;
        let area = $("#label-text_"+id+"-"+pid);
        area.val(name);
        //this.set_contextName(id,name,pid, well);
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

    set_action(val){
        this.action = val;
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

    /**
     * @param id : string defined in generateLabelID
     * @param labelName : string of the label at the moment of creation.
     * @param color : string linked to this label
     * @param pid : string is the id of this problem
     * @param well :
     */
    createToleranceDiv(id, labelName, color, pid, well){
        let outerDiv = $('#div-tolerance-'+pid, well)

        var cardDiv = document.createElement("div")
        cardDiv.setAttribute("class", "card mb-3")
        cardDiv.setAttribute("id", id)

        // Header
        var cardHeaderDiv = document.createElement("div")
        cardHeaderDiv.setAttribute("class", "card-header")
        cardHeaderDiv.setAttribute("style", "background-color: var(--"+color+"); ")
        cardHeaderDiv.setAttribute("id", "heading_"+id)

        var rowHeaderDivStruct = document.createElement("div")
        rowHeaderDivStruct.setAttribute("class", "row")

        var colHeaderDivName = document.createElement("div")
        colHeaderDivName.setAttribute("class", "col-md-10")
        var colHeaderSpanName = document.createElement("span")
        colHeaderSpanName.setAttribute("role", "button")
        colHeaderSpanName.setAttribute("data-toggle", "collapse")
        colHeaderSpanName.setAttribute("data-parent", "#accordion")
        colHeaderSpanName.setAttribute("href", "#collapse_"+id)
        colHeaderSpanName.setAttribute("aria-controls", "collapse_"+id)
        colHeaderSpanName.setAttribute("class", "")
        colHeaderSpanName.setAttribute("aria-expanded", "true")
        colHeaderSpanName.textContent = "Label name : "

        var colHeaderSpanNameSecond = document.createElement("span")
        colHeaderSpanNameSecond.textContent = labelName

        // append headerDiv
        cardDiv.append(cardHeaderDiv)
        cardHeaderDiv.append(rowHeaderDivStruct)

        colHeaderDivName.append(colHeaderSpanName)
        colHeaderSpanName.append(colHeaderSpanNameSecond)

        this.createCheckBox(id, rowHeaderDivStruct, pid, well)
        rowHeaderDivStruct.append(colHeaderDivName)
        this.createEraseLabelButton(id, rowHeaderDivStruct, pid, well, false);


        // Body
        var cardCollapse = document.createElement("div")
        cardCollapse.setAttribute("class", "in collapse")
        cardCollapse.setAttribute("id", "collapse_"+id)
        cardCollapse.setAttribute("role", "tabpanel")
        var cardBody = document.createElement("div")
        cardBody.setAttribute("class", "card-body")

        this.createToleranceChoice(id, cardBody, pid, color)

        // Exclusion Elements
        var exclusionDiv = document.createElement("div")
        exclusionDiv.setAttribute("class", "row")


        var addExclusionButton = document.createElement("button")
        addExclusionButton.setAttribute("type", "button")
        addExclusionButton.setAttribute("class", "btn btn-success")
        addExclusionButton.onclick = ()=> {this.createExclusionFields("", exclusionDiv )}
        addExclusionButton.textContent = "+"

        cardBody.append(exclusionDiv)
        cardBody.append(addExclusionButton)





        cardCollapse.append(cardBody)
        cardDiv.append(cardCollapse)
        outerDiv.append(cardDiv)

        this.createColoringButton(id,$("#div-toolbar-"+pid), pid, color)

    }

    createToleranceChoice(id, outerDiv, pid, well){
        var generalDiv = document.createElement("div")
        generalDiv.setAttribute("class", "input-group mb-3")

        // name
        var nameDiv = document.createElement("div")
        nameDiv.setAttribute("class", "input-group-prepend")
        var nameLabel = document.createElement("label")
        nameLabel.setAttribute("class", "input-group-class")
        nameLabel.innerText = "Tolerance : "

        nameDiv.append(nameLabel)
        // type
        var typeDiv = document.createElement("select")
        typeDiv.setAttribute("class", "custom-select")


        generalDiv.append(nameDiv)
        generalDiv.append(typeDiv)

        outerDiv.append(generalDiv)

    }

    createExclusionFields(id, outerDiv, pid, well) {
        var generaldiv = document.createElement("div")
        generaldiv.setAttribute("class", "col-md-8")
        var mediaDiv = document.createElement("div")
        mediaDiv.setAttribute("class", "media g-mb-30 media-comment")

        // Body
        var mediaBody = document.createElement("div")
        mediaBody.setAttribute("class", "media-body u-shadow-v18 g-bg-secondary g-pa-30")

        var exclusionGarbage = document.createElement("ul")
        exclusionGarbage.setAttribute("class", "list-inline d-sm flex my-0")
        var exclusionGarbageLI = document.createElement("li")
        exclusionGarbageLI.setAttribute("class", "u-link-v5 g-color-gray-dark-v4 g-color-primary--hover")
        var exclusionGarbageIcon = document.createElement("i")
        exclusionGarbageIcon.setAttribute("class", "fa fa-lg fa-trash-o")

        mediaBody.append(exclusionGarbage)
        exclusionGarbage.append(exclusionGarbageLI)
        exclusionGarbageLI.append(exclusionGarbageIcon)

        var exclusionTextArea = document.createElement("input")
        mediaBody.append(exclusionTextArea)


        // general
        outerDiv.append(generaldiv)
        generaldiv.append(mediaDiv)
        mediaDiv.append(mediaBody)

    }

    generateLabelID() {
        function extractNumber(label) {
            const parts = label.split('_');
            // The number is the last part of the split array
            const numberPart = parts[parts.length - 1];
            return parseInt(numberPart, 10);
        }

        let i = 0;
        for (let key in this.labelNameID){
            let val = extractNumber(key)
            if(val >= i){
                i = val + 1
            }
        }
        return "Label_id_"+i.toString();
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
            left: e.pageX -260 + "px",
            top: e.pageY - 200 + "px"
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

