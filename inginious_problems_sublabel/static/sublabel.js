
let colors = ['yellow', 'blue', 'red', 'green']
const colorMap = {
  0: 'palegoldenrod',
  1: 'lightsalmon',
  2: 'palegreen',
  3: 'lightblue',
  4: 'lightcoral',
  5: 'lemonchiffon',
  6: 'lightyellow',
  7: 'lightcyan',
  8: 'lightpink',
  9: 'palevioletred',
  10: 'palegoldenrod',
  11: 'paleturquoise',
  12: 'lightseagreen',
  13: 'honeydew',
  14: 'mintcream',
  15: 'lightgray',
  16: 'lightsteelblue',
  17: 'lavender',
  18: 'palegreen'
};

const colorMapLight = {
  0: '#FF66FF', // Light Lavender
  1: '#FFFF66', // Light Gold
  2: '#66CCFF', // Light Azure
  3: '#FFCC99', // Light Orange
  4: '#99CCFF', // Light Sky Blue
  5: '#FF66CC', // Light Fuchsia
  6: '#CCFF99', // Light Lime
  7: '#99FFFF', // Light Cyan
  8: '#FF99FF', // Light Magenta
  9: '#99FF99', // Light Green
  10: '#99FF66', // Light Lime Green
  11: '#FF6666', // Light Coral
  12: '#66FF99', // Light Spring Green
  13: '#FFCC66', // Light Orange Yellow
  14: '#6666FF', // Light Indigo
  15: '#FF99CC', // Light Pink
  16: '#99FFCC', // Light Mint Green
  17: '#FF9999', // Light Red
  18: '#CC99FF', // Light Purple
  19: '#99FF99'  // Light Green
};
let tolerance_possibilities = ['line', '5 characters', '3 characters', '1 character', 'none']

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
    let code = ""
    let textarea = $('#code-' + pid, well)
    let answerarea = $('#answer-' + pid, well)
    let lineNumbers = $("#line_code-" + pid, well);

    let labelNameID = {}
    let highlightColor = {}
    let highlightValue = {}
    let textareasize = 0
    let tolerance   = {}

    if("answer" in problem && problem["answer"] !== ""){

        let answer = problem["answer"]
        for(let id in answer){
            if(id === "0"){break;}
            labelNameID[id] = answer[id]["label"];
            highlightColor[id] = answer[id]["color"]
            highlightValue[id] = answer[id]["values"]
        }
    }
    else{
        answerarea.val("{}")
    }

    if("code" in problem){
        code = problem["code"]
        textareasize = problem["code"].length
    }

    if("tolerance" in problem){
        if( problem["tolerance"] !== ""){
            tolerance = problem["tolerance"]
        }
    }


    let exercise = new SubLabel(code, textarea, answerarea, highlightValue, labelNameID, highlightColor, pid, well, textareasize, "teacher", lineNumbers, tolerance);
    exercise.startTeacher();
}

function load_feedback_sublabel(key, content) {
    load_feedback_code(key, content);
}

class SubLabel{

    constructor(code, textarea, answerarea, highlightValue, labelNameID, highlightColor, pid, well, textareasize, side, linenumbers, tolerance) {
        this.code           = code
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
        this.action         = "stop"
        this.tolerance      = tolerance
        this.exclusionInfo  = {}
    }

    startTeacher() {

        let lineNumbers = this.lineNumbers;
        this.textarea.val(this.code)

         for(let lid in this.labelNameID){
             this.createToleranceDiv(lid, this.labelNameID[lid], this.highlightColor[lid], this.pid, this.well)
             this.changeSelectorValue(lid, this.pid, this.getToleranceTypeValue(lid))
            //this.createLabelText(lid, this.highlightColor[lid], false, this.pid, this.well)
            //this.createLabelContext(lid, this.pid, this.well)
            //this.set_labelNameID(lid, this.labelNameID[lid], this.pid, this.well)
        }
         for(let lid in this.tolerance){
             for(let eid in this.tolerance[lid]["exclusion"]){
                 this.createExclusionFields(eid, lid, null, this.getToleranceExclusionValue(lid, eid, 0),  this.pid, this.well)
                 if(this.getToleranceExclusionValue(lid, eid, 2) > 0){
                     var rangeSelector = document.getElementById(getRangeId(eid))
                     var button = document.getElementById(getRangeButtonID(eid))

                     rangeSelector.value = this.getToleranceExclusionValue(lid, eid, 2)/0.25
                     this.transformButton(lid, eid, rangeSelector, button)
                 }
             }
         }
         this.updateToleranceFieldInput()
        this.updateAnswerArea()


        var that = this;
        this.createHighlightTextarea(this.highlightValue);

        //this.createEraseContext(this.pid, this.well)
        //contextMenuStart(this.textarea, this.pid, this.well)

        //#$('#addLabel-'+ this.pid, this.well).on('click', () => {this.createLabelTeacher(this.pid, this.well)})
        $('#addLabel-'+ this.pid, this.well).on('click', () => {this.createLabelTeacher(this.pid, this.well)})

        // add the possibility of tabulation  change tab by 4 spaces.
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
            // Function to replace tabs with spaces
        function replaceTabsWithSpaces(textarea) {
            var currentText = textarea.value;
            var updatedText = currentText.replace(/\t/g, '    '); // Replace all tabs with 4 spaces
            textarea.value = updatedText;
        }

        // change \t by 4 spaces on input and verify that there are no selection after
        this.textarea.on('input', function() {
            replaceTabsWithSpaces(this);
        });

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
            if(this.scrollHeight === 0){
                var lineHeight = 22; // Adjust based on your actual line height
                var numLine = this.value.split('\n').length;
                this.style.height = (numLine * lineHeight) + 23 + 'px'

            }
        });

        // Initial line numbers generation

        this.textarea.on("select", () =>{
            switch(this.action){
                case "stop": break;
                case "eraser":
                    this.highlightSelectionErase(this.pid, this.well)
                    break;
                case "exclusion":
                    this.exclusionActivation()
                    break;
                default :
                    this.highlightSelection(this.action)
                    break;
            }

        })

        $("#toolbar-eraser-"+this.pid).on("click", () => this.set_action("eraser"))
        $("#toolbar-stop-"+this.pid).on("click", () => this.set_action("stop"))

        $(document).ready(() => this.textarea.trigger('input'))


    }

    startStudent(){

        var lineNumbers = this.lineNumbers;

        for(let id in this.labelNameID){
            this.createLabelText(id, true, this.pid, this.well)
            //this.createLabelContext(id, this.pid, this.well)
            this.set_labelNameID(id, this.labelNameID[id], this.pid, this.well)
        }

        this.updateAnswerArea()
        this.createHighlightTextarea(this.highlightValue)
        //this.createEraseContext(this.pid, this.well)

        this.answerarea.on('change', () => {
            let answer = this.answerarea.val();
            if(answer === ""){return}
            answer = JSON.parse(answer)
            this.labelNameID = {};
            this.highlightValue = {};
            this.highlightColor = {};
            for(let id in answer){
                this.labelNameID[id] = answer[id]["label"];
                this.highlightColor[id] = answer[id]["color"]
                this.highlightValue[id] = answer[id]["values"]
            }
            this.createHighlightTextarea(this.highlightValue)
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
                    this.highlightSelectionErase(this.pid, this.well);
                    break;
                case "":
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
     * this.highlightValue as first argument
     */

    createHighlightTextarea(highlightArray){

        // check the display box is checked
        let highlightValueChecked = {};
        for(const [lid, value]  of Object.entries(highlightArray)){
            if(this.isBoxChecked(lid, this.pid, this.well)){
                highlightValueChecked[this.getColorName(lid)] = value
            }
        }

        // create the intersection between intervals of labels
        let dataIntersections = this.findIntersectionsAndNonIntersectionsAll(highlightValueChecked);
        if(dataIntersections.length === 0){return this.textarea.highlightWithinTextarea({highlight:[]})}
        let highListFormated = [];
        for(let label in dataIntersections){
            let class_name_info = this.getHighlightColorIntersectionClassName(label, this.pid)
            highListFormated.push({highlight: dataIntersections[label], className: class_name_info})
        }
        this.textarea.highlightWithinTextarea({highlight : highListFormated})
        this.textarea.trigger('input')                                                  // TODO verifier que c'est pas de la merde ca, (genre que je trigger pas creteH en input et puis que je retrigger pq je trigger input ici)
    }

    createLabelTeacher(pid, well){
        var id = this.generateLabelID();
        let color = this.getColorkey(id)
        let name_area = $("#new_label_name-"+pid, well)
        let name = name_area.val()
        if(name === ""){ animation_input_error(name_area)}
        else{
            $("#new_label_name-"+pid, well).val("")
            this.createToleranceDiv(id, name, color, pid, well)
            //this.createLabelContext(id, pid, well)
            this.labelNameID[id] = name
            this.highlightValue[id] = []
            this.highlightColor[id] = color
            this.checkToleranceTypeExist(id)
            this.updateAnswerArea()
        }
    }

    eraseLabelTeacher(lid, labelDiv){
        let result = confirm("Press OK to erase the label");
        if(result){
            delete this.labelNameID[lid]
            delete this.highlightColor[lid]
            delete this.highlightValue[lid]
            delete this.tolerance[lid]
            $("#"+lid + "-" + this.pid, this.well).remove()
            $("#toolbar-coloring_"+lid+"-"+this.pid).remove()
            this.updateValues()
        }
    }

    garbageExclusion(lid, eid, outerdiv){
        this.eraseToleranceExclusion(lid, eid)
        outerdiv.remove()
    }


    eraseLabelStudent(id, labelDiv){
        let result = confirm("Press OK to erase the label");
        if(result){
            this.highlightValue[id] = [[]]
            this.updateValues()
        }
    }



    updateLabel(id,labelNameArea) {
        let new_name = labelNameArea.value;
        this.set_labelNameID(id, new_name, this.pid, this.well);
    }




    getCheckBox(id, pid, well){
        return $("#checkbox_" + id +"-"+pid);
    }

    isBoxChecked(id,pid,well){
        return this.getCheckBox(id,pid,well).is(":checked");
    }




    set_labelNameID(id, name,pid, well){
        this.labelNameID[id] = name;
        let area = $("#label-text_"+id+"-"+pid);
        area.val(name);
        //this.set_contextName(id,name,pid, well);
    }

    set_contextName(id,name, pid, well){
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
        this.createHighlightTextarea(this.highlightValue)
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
        this.updateHighlightTextArea(this.highlightValue)
    }

    get_button_from_action(action){
        switch (action){
            case "stop":
                return null
            case "exclusion":
                return
            default:
                return document.getElementById("toolbar-coloring_"+action+"-"+this.pid)
        }
    }

    /**
     *
     *
     *
     * Utils for arrays
     *
     * @param start : int is the value in the textarea where the selection begins
     * @param end : int is the value int the textarea where the selection ends
     * @param array : array is and array of array where each interior array in a selection
     *
     * this function will add the start and end to the array of array (there are no intersection, if two selection intersect they become one)
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
        resultFormat = removeEmptyArrays(resultFormat)
        return resultFormat;

    }

    getIntersectionTwoArrays(ranges1,labelsRanges1,ranges2,labelsRanges2){
        function getNewLabelsValuesInsideFunction(label1,label2, that){

            if(label1[0] === "time"){return label2}
            else{
                return insertSorted(label1, label2)
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
                    newLabels.push(labelsRanges1[index1])
                }
                newRanges.push([Math.max(range1[0],range2[0]), Math.min(range1[1],range2[1])])
                newLabels.push([getNewLabelsValuesInsideFunction(labelsRanges1[index1],labelsRanges2[foundIntersectingIndex], this)])
                // if range1 is bigger we need to take into consideration the part left left.
                if(range1[1] > range2[1]){
                    let temp = this.getIntersectionTwoArrays([[range2[1], range1[1]]], [labelsRanges1[index1]], ranges2, labelsRanges2)
                    newRanges= newRanges.concat(temp[0]);
                    newLabels= newLabels.concat(temp[1]);
                }
            } else {
                newRanges.push(range1);
                newLabels.push(labelsRanges1[index1])
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
     * @param ranges : array of intervals
     * @param excludeRange : array with one interval that need to be erased from array if some of the values are present.
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
        result = removeEmptyArrays(result)
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



    //////////////////////////////////////////////////////
    //                                                  //
    //          Exclusion Function Related              //
    //                                                  //
    //////////////////////////////////////////////////////

    GetExclusionId(pid, labelID, RandomNumberExclusion){
        return pid+"_"+labelID+"_"+RandomNumberExclusion
    }


    /**
     * this.tolerance[labelID]["exclusion"][Eid] is an array with index:
     *  0 : comment
     *  1 : selection
     *
     * **/
    ExclusionInputComment(pid, labelID, idExclusion){
        let val = $("#comment_"+idExclusion).val()
        this.setToleranceExclusionNewValue(labelID, idExclusion, 0, val)
    }


    checkToleranceExclusionExist(labelID,idExclusion){
        if(!(labelID in this.tolerance)){
            this.tolerance[labelID] = {"exclusion":{}, "type":"line"}}
        if(!("exclusion" in this.tolerance[labelID])) {
            this.tolerance[labelID]["exclusion"] = {}}
        if(!(idExclusion in this.tolerance[labelID]["exclusion"])){
            this.tolerance[labelID]["exclusion"][idExclusion] = ["", [[]], 0]}
    }
    checkToleranceTypeExist(labelID){
        if(!(labelID in this.tolerance)){
            this.tolerance[labelID] = {"exclusion":{}, "type":"line"}}
    }
    setToleranceExclusionNewValue(labelID,idExclusion,index, value){
        this.checkToleranceExclusionExist(labelID, idExclusion)
        this.tolerance[labelID]["exclusion"][idExclusion][index] = value
        this.updateToleranceFieldInput()
    }

    eraseToleranceExclusion(labelID, idExclusion){
        this.checkToleranceExclusionExist(labelID, idExclusion)
        delete this.tolerance[labelID]["exclusion"][idExclusion]
        this.updateToleranceFieldInput()
    }
    getToleranceExclusionValue(labelID,idExclusion,index){
        this.checkToleranceExclusionExist(labelID, idExclusion)
        return this.tolerance[labelID]["exclusion"][idExclusion][index]
    }

    setToleranceTypeNewValue(labelID, value){
        this.checkToleranceTypeExist(labelID)
        this.tolerance[labelID]["type"] = value
        this.updateToleranceFieldInput()
    }
    createToleranceTypeNewValue(labelID){
        this.checkToleranceTypeExist(labelID)
        this.updateToleranceFieldInput()
    }
    getToleranceTypeValue(labelID){
        this.checkToleranceTypeExist(labelID)
        return this.tolerance[labelID]["type"]
    }

    updateToleranceFieldInput(){
        $("#tolerance-" + this.pid).val(JSON.stringify(this.tolerance))
    }



    exclusionActivation(){
        this.exclusionSelection(this.exclusionInfo["erase"], this.pid, this.exclusionInfo["labelID"], this.exclusionInfo["exclusionID"])
    }
    /**
     *
     * @param selection : array of two elements with start and finish of the new selected elements
     * @param erase : boolean value indicating if we are erasing those elements from the list
     * @param pid :
     * @param labelID :
     * @param exclusionID :
     * @constructor
     */
    exclusionSelection(erase, pid, labelID, exclusionID){
        let start   = this.textarea[0].selectionStart
        let end     = this.textarea[0].selectionEnd
        if(erase){
            let newVal = this.removeFromArray(this.getToleranceExclusionValue(labelID, exclusionID, 1), [start, end])
            this.setToleranceExclusionNewValue(labelID, exclusionID, 1, newVal)
        }
        else{
            let newVal = this.updateArray(start, end, this.getToleranceExclusionValue(labelID, exclusionID, 1))
            this.setToleranceExclusionNewValue(labelID, exclusionID, 1, newVal)
        }

        this.createExclusionHighlight(labelID, exclusionID)
    }

    createExclusionHighlight(labelID, exclusionID){
        let dictToH = {}
        let color = {}

        dictToH[exclusionID] = this.getToleranceExclusionValue(labelID, exclusionID, 1)
        color[exclusionID] = "red"
        //for(let Eid in this.tolerance[labelID]["exclusion"]){
        //    dictToH[Eid] = this.tolerance[labelID]["exclusion"][Eid][1]
        //    color[Eid] = "red"
        //}
        this.highlightTextareaArray(dictToH, color)

    }

    createNewExclusion(labelid, exclusionDiv, pid, well){
        let Eid = this.GetExclusionId(pid, labelid, generateRandomID())
        this.createExclusionFields(Eid, labelid, exclusionDiv, "", pid, well)
    }

    exclusionVariableHandler(erase, labelid, Eid){
        this.action = "exclusion"
        this.exclusionInfo["erase"] = erase
        this.exclusionInfo["labelID"] = labelid
        this.exclusionInfo["exclusionID"] = Eid
        this.createExclusionHighlight(labelid, Eid)
    }


    /**
     *
     * Generate Class in the css style for intersection between two colors
     * @param colorKeys  : string of ids
     * @param pid   : string , it's the problem id.
     * @param index : int, is the number of the new intersection
     * @return {*}
     */
    getHighlightColorIntersectionClassName(colorKeys, pid){
        const colorKeys_parsed = JSON.parse("["+colorKeys+"]")
        const className = getColorClassName(colorKeys, pid)
        if(colorKeys_parsed.length > 1){
            generateGradientClasses(colorKeys_parsed, pid)
            return className
        }
        else{
            generateColorClass(colorKeys_parsed, pid)
            return className
        }
    }

    highlightTextareaArray(dict, colors){
        let highListFormated = [];
        for(let label in dict){
            highListFormated.push({highlight: dict[label], className: colors[label]})
        }
        this.textarea.highlightWithinTextarea('destroy')
        this.textarea.highlightWithinTextarea({highlight : highListFormated})
    }



    getExclusionDiv(lid, pid){
        return "exclusionDiv_"+lid+"_"+pid
    }

    changeSelectorValue(lid, pid, newValue) {
        var selector = document.getElementById(this.getSelectorID(lid, pid))
        selector.value = newValue;
    }

    getSelectorID(lid, pid){
        return "selector_"+lid+"-"+pid
    }




    transformButton(lid, eid, rangeSelector, button) {
        rangeSelector.classList.remove('d-none');  // Show the range selector
        button.textContent = 'X';  // Change button text to 'X'
        button.classList.remove('btn-primary');
        button.classList.add('btn-danger', 'ml-auto');  // Optionally change button style to indicate 'close' and move it to the end
        rangeSelector.dispatchEvent(new Event('change'))

        button.onclick = () => {
            rangeSelector.classList.add('d-none');  // Hide the range selector
            button.textContent = 'Penalty';
            button.classList.remove('btn-danger', 'ml-auto');
            button.classList.add('btn-primary');  // Revert button style and position

            button.onclick = this.transformButton.bind(this, lid, eid, rangeSelector, button);  // Re-assign the transform function
            this.setToleranceExclusionNewValue(lid, eid, 2, 0)
        };
    }

    getColorkey(lid){
        if(lid in this.highlightColor){
            return this.highlightColor[lid]
        }
        else {
            let i = 0
            while(Object.values(this.highlightColor).includes(i)){
                i += 1
            }
            return i;
        }
    }
    getColorName(lid){
        return JSON.stringify(this.getColorkey(lid))
    }


    /////////////////////////////////////
    /////////////////////////////////////
    // Generate HTML From JS
    /////////////////////////////////////
    /////////////////////////////////////


    highlightButton(button) {

        // If there is an active button, remove the active class
        if (this.action !== "stop") {
            this.get_button_from_action().classList.remove("btn-highlight");
        }

        // Add the active class to the clicked button
        button.classList.add("btn-highlight");

        // Update the active button reference
        this.activeButton = button;
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
    createLabelText(id, isReadonly, pid, well){

        const colorKey = this.getColorkey(id)

        let labelDiv = $('#label-div-'+pid, well)

        var inputGroupDiv = document.createElement("div")
        inputGroupDiv.setAttribute("class", "input-group mb-3");

        var labelNameArea = document.createElement("input");
        labelNameArea.setAttribute("type", "text")
        labelNameArea.setAttribute("id", "label-text_"+id+"-"+pid)
        labelNameArea.setAttribute("placeholder", "Label name")
        labelNameArea.setAttribute("style", "background-color: "+getColorCode(colorKey)+";")
        labelNameArea.setAttribute("class", "form-control")
        if(isReadonly){labelNameArea.setAttribute("readonly", "true")}
        else{labelNameArea.oninput = ()=> {this.updateLabel(id, labelNameArea)}}

        this.createCheckBox(id, inputGroupDiv, pid, well);
        inputGroupDiv.append(labelNameArea);
        this.createEraseLabelButton(id, inputGroupDiv, pid, well, isReadonly);

        labelDiv.append(inputGroupDiv)

        this.createColoringButton(id, $("#div-toolbar-"+pid), pid, colorKey)
        // create coloring logo button

    }


    /**
     * create a checkbox that is linked to each label, with id define as checkbox_{{id from label}}-{{id of exercice}}
     * @param id = id of the label.
     * @param labelDiv
     * @param pid
     * @param well
     */
    createCheckBox(id, labelDiv, pid, well) {
        // Create the checkbox element
        var inputPrependDiv = document.createElement("div")
        inputPrependDiv.setAttribute("class", 'input-group-prepend')
        var inputTextDiv = document.createElement("div")
        inputTextDiv.setAttribute("class", "input-group-text")
        var checkBox = document.createElement("input");
        checkBox.setAttribute("type", "checkbox");
        checkBox.setAttribute("id", "checkbox_" + id + "-" + pid);
        checkBox.setAttribute("checked", "checked");
        checkBox.setAttribute("name", "checkbox");

        // Add an onclick event to the checkbox
        checkBox.onclick = () => {
            this.updateHighlightTextArea(this.highlightValue);
        };

        // Append the checkbox directly to the labelDiv
        labelDiv.appendChild(inputPrependDiv);
        inputPrependDiv.appendChild(inputTextDiv);
        inputTextDiv.append(checkBox)
    }

    /**
     * Create the Erase button that is linked to each label.
     * @param id
     * @param labelDiv
     * @param pid
     * @param well
     * @param isReadonly
     */
    createEraseLabelButton(id, labelDiv, pid, well, isReadonly) {
        // Create the button element
        var eraseLabel = document.createElement("button");
        eraseLabel.setAttribute("id", "erase-label_" + id + "-" + pid);
        eraseLabel.setAttribute("class", "btn btn-danger btn-sm"); // Added btn-sm for a smaller button
        eraseLabel.setAttribute("type", "button");

        // Set onclick handler based on isReadonly flag
        if (isReadonly) {
            eraseLabel.onclick = () => { this.eraseLabelStudent(id, labelDiv); };
        } else {
            eraseLabel.onclick = () => { this.eraseLabelTeacher(id, labelDiv); };
        }

        // Create and append the trash icon
        var iconTrash = document.createElement("i");
        iconTrash.setAttribute("class", "fa fa-lg fa-trash-o");

        eraseLabel.appendChild(iconTrash);
        labelDiv.appendChild(eraseLabel);
    }

    createColoringButton(id, outerdiv, pid, colorKey){
        var coloring_button = document.createElement("button")
        coloring_button.setAttribute("type", "button")
        coloring_button.setAttribute("class", "btn btn-secondary")
        coloring_button.setAttribute("id", "toolbar-coloring_"+id+"-"+pid)
        coloring_button.setAttribute("style", "background-color: "+getColorCode(colorKey)+";")
        coloring_button.onclick = () => {this.set_action(id)}

        var iconBrush = document.createElement("i");
        iconBrush.setAttribute("class", "fa fa-paint-brush");

        coloring_button.append(iconBrush)
        outerdiv.append(coloring_button)
    }


    /**
     * @param labelid : string : id of the defined in generateLabelID
     * @param labelName : string : name of the label at the moment of creation.
     * @param colorKey : int :color linked to this label get the color code with getColorCode
     * @param pid : string :the id of this problem
     * @param well :
     */
    createToleranceDiv(labelid, labelName, colorKey, pid, well){
        let outerDiv = $('#div-tolerance-'+pid, well)

        var cardDiv = document.createElement("div")
        cardDiv.setAttribute("class", "card mb-3")
        cardDiv.setAttribute("id", labelid + "-" + pid)

        // Header
        var cardHeaderDiv = document.createElement("div")
        cardHeaderDiv.setAttribute("class", "card-header")
        cardHeaderDiv.setAttribute("style", `background-color: ${getColorCode(colorKey)}; `)
        generateColorClass(colorKey, pid)
        cardHeaderDiv.setAttribute("id", "heading_"+labelid)

        var rowHeaderDivStruct = document.createElement("div")
        rowHeaderDivStruct.setAttribute("class", "row")

        var colHeaderDivName = document.createElement("div")
        colHeaderDivName.setAttribute("class", "col-md-10")
        var colHeaderSpanName = document.createElement("span")
        colHeaderSpanName.setAttribute("role", "button")
        colHeaderSpanName.setAttribute("data-toggle", "collapse")
        colHeaderSpanName.setAttribute("data-parent", "#accordion")
        colHeaderSpanName.setAttribute("href", "#collapse_"+labelid)
        colHeaderSpanName.setAttribute("aria-controls", "collapse_"+labelid)
        colHeaderSpanName.setAttribute("class", "")
        colHeaderSpanName.setAttribute("aria-expanded", "true")

        var colHeaderIconBar = document.createElement("i")
        colHeaderIconBar.setAttribute("class", "fa fa-bars")
        colHeaderSpanName.append(colHeaderIconBar)

        var labelText = document.createTextNode(" Label name : ");
        colHeaderSpanName.append(labelText);


        var colHeaderSpanNameSecond = document.createElement("span")
        colHeaderSpanNameSecond.textContent = labelName

        // append headerDiv
        cardDiv.append(cardHeaderDiv)
        cardHeaderDiv.append(rowHeaderDivStruct)

        colHeaderDivName.append(colHeaderSpanName)
        colHeaderSpanName.append(colHeaderSpanNameSecond)

        this.createCheckBox(labelid, rowHeaderDivStruct, pid, well)
        rowHeaderDivStruct.append(colHeaderDivName)
        this.createEraseLabelButton(labelid, rowHeaderDivStruct, pid, well, false);


        // Body
        var cardCollapse = document.createElement("div")
        cardCollapse.setAttribute("class", "in collapse")
        cardCollapse.setAttribute("id", "collapse_"+labelid)
        cardCollapse.setAttribute("role", "tabpanel")
        var cardBody = document.createElement("div")
        cardBody.setAttribute("class", "card-body")

        this.createToleranceChoice(labelid, cardBody, pid, colorKey)

        // Exclusion Elements
        var exclusionDiv = document.createElement("div")
        exclusionDiv.setAttribute("class", "row")
        exclusionDiv.setAttribute("id", this.getExclusionDiv(labelid,pid))


        // button add (exclusion selection)
        var addExclusionButton = document.createElement("button")
        addExclusionButton.setAttribute("type", "button")
        addExclusionButton.setAttribute("class", "btn btn-success")
        addExclusionButton.onclick = ()=> {this.createNewExclusion(labelid, exclusionDiv , pid, well)}
        addExclusionButton.textContent = "+"

        cardBody.append(exclusionDiv)
        cardBody.append(addExclusionButton)


        cardCollapse.append(cardBody)
        cardDiv.append(cardCollapse)
        outerDiv.append(cardDiv)

        this.createColoringButton(labelid,$("#div-toolbar-"+pid), pid, colorKey)

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

        // Tolerance Type Selector
        var typeDiv = document.createElement("select")
        typeDiv.setAttribute("class", "custom-select")
        typeDiv.setAttribute("id", this.getSelectorID(id, pid))

        // types
        for(let type in tolerance_possibilities){
            let choice = document.createElement("option")
            choice.setAttribute("value", tolerance_possibilities[type])
            choice.innerText = tolerance_possibilities[type]
            typeDiv.append(choice)
        }
        this.createToleranceTypeNewValue(id)
        typeDiv.addEventListener("change", () => this.setToleranceTypeNewValue(id, typeDiv.value))

        generalDiv.append(nameDiv)
        generalDiv.append(typeDiv)

        outerDiv.append(generalDiv)

    }

    createExclusionFields(Eid, labelid, outerDiv, comment, pid, well) {
        if(outerDiv === null){
            outerDiv = document.getElementById(this.getExclusionDiv(labelid, pid))
        }
        var generaldiv = document.createElement("div")
        generaldiv.setAttribute("class", "col-md-8")
        var mediaDiv = document.createElement("div")
        //mediaDiv.setAttribute("class", "media g-mb-30 media-comment")

        // Body
        var mediaBodyRow = document.createElement("div")
        mediaBodyRow.setAttribute("class", "row")

        var mediaBody = document.createElement("div")
        mediaBody.setAttribute("class", "col d-flex flex-column")

        var exclusionIconsUL = document.createElement("ul")
        exclusionIconsUL.setAttribute("class", "list-inline d-sm-flex my-0")


        // coloring button
        var exclusionEditLI = document.createElement("li")
        exclusionEditLI.setAttribute("class", "list-inline-item g-mr-20")
        var exclusionEditA = document.createElement("A")
        exclusionEditA.setAttribute("class", "u-link-v5  g-color-primary--hover")
        var exclusionEditIcon = document.createElement("i")
        exclusionEditIcon.setAttribute("class", "fa fa-paint-brush")
        exclusionEditA.style.color = "red"
        exclusionEditA.onclick = this.exclusionVariableHandler.bind(this,false, labelid, Eid)

        // eraser button
        var exclusionEraseLI = document.createElement("li")
        exclusionEraseLI.setAttribute("class", "list-inline-item g-mr-20")
        var exclusionEraseA = document.createElement("A")
        exclusionEraseA.setAttribute("class", "u-link-v5  g-color-primary--hover")
        var exclusionEraseIcon = document.createElement("i")
        exclusionEraseIcon.setAttribute("class", "fa fa-eraser")
        exclusionEraseA.onclick = this.exclusionVariableHandler.bind(this,true, labelid, Eid)


        // Garbage
        var exclusionGarbageLI = document.createElement("li")
        exclusionGarbageLI.setAttribute("class", "list-inline-item ml-auto")
        var exclusionGarbageA = document.createElement("A")
        exclusionGarbageA.setAttribute("class", "u-link-v5 g-color-gray-dark-v4 g-color-primary--hover")
        var exclusionGarbageIcon = document.createElement("i")
        exclusionGarbageIcon.setAttribute("class", "fa fa-lg fa-trash-o")
        exclusionGarbageA.onclick = this.garbageExclusion.bind(this, labelid, Eid, generaldiv)

        // range

        var rangeColDiv = document.createElement("div")
        rangeColDiv.setAttribute("class", "col d-flex flex-column")
        this.createRangeSelector(labelid, Eid, rangeColDiv)

        mediaBodyRow.append(mediaBody)
        mediaBodyRow.append(rangeColDiv)
        mediaBody.append(exclusionIconsUL)

        exclusionIconsUL.append(exclusionEditLI)
        exclusionIconsUL.append(exclusionEraseLI)
        exclusionIconsUL.append(exclusionGarbageLI)

        exclusionEditLI.append(exclusionEditA)
        exclusionEditA.append(exclusionEditIcon)

        exclusionEraseLI.append(exclusionEraseA)
        exclusionEraseA.append(exclusionEraseIcon)

        exclusionGarbageLI.append(exclusionGarbageA)
        exclusionGarbageA.append(exclusionGarbageIcon)

        var exclusionTextAreaDiv = document.createElement("div")
        exclusionTextAreaDiv.setAttribute("class", "list-inline d-sm-flex my-0")
        var exclusionTextArea = document.createElement("textarea")
        exclusionTextArea.style.width = "100%"
        exclusionTextArea.oninput = this.ExclusionInputComment.bind(this, pid, labelid, Eid)
        exclusionTextArea.setAttribute("id", "comment_"+Eid)
        exclusionTextArea.value = comment

        mediaBody.append(exclusionTextAreaDiv)


        exclusionTextAreaDiv.append(exclusionTextArea)
        // general
        outerDiv.append(generaldiv)
        generaldiv.append(mediaDiv)
        mediaDiv.append(mediaBodyRow)

    }

    createRangeSelector(lid, eid, outerDiv){
        // Create the main container div
        const containerDiv = document.createElement("div");
        containerDiv.setAttribute("class", "container mt-5");

        // Create the row div
        const rowDiv = document.createElement("div");
        rowDiv.setAttribute("class", "row");

        // Create the column div
        const colDiv = document.createElement("div");
        colDiv.setAttribute("class", "col text-center");

        // Create the range container div
        const rangeContainerDiv = document.createElement("div");
        rangeContainerDiv.setAttribute("class", "range-container");

        // Create the range input
        const rangeInput = document.createElement("input");
        rangeInput.setAttribute("type", "range");
        rangeInput.setAttribute("min", "0");
        rangeInput.setAttribute("max", "4");
        rangeInput.setAttribute("id", getRangeId(eid));
        rangeInput.setAttribute("class", "form-control-range d-none");

        rangeInput.onchange = (event) => {
            const rangeValue = event.target.value
            this.setToleranceExclusionNewValue(lid, eid, 2, rangeValue*0.25)
        }

        // Create the button
        const button = document.createElement("button");
        button.setAttribute("id", getRangeButtonID(eid));
        button.setAttribute("class", "btn btn-primary");
        button.setAttribute("type", "button")
        button.textContent = "Penalty";
        button.onclick = this.transformButton.bind(this, lid, eid, rangeInput, button)

        // Append the range input and button to the range container div
        rangeContainerDiv.appendChild(rangeInput);
        rangeContainerDiv.appendChild(button);

        colDiv.appendChild(rangeContainerDiv);
        rowDiv.appendChild(colDiv);
        containerDiv.appendChild(rowDiv);

        // Append the main container div to the body or another container
        outerDiv.appendChild(containerDiv);
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

function generateRandomID(){
        return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

function animation_input_error(input_element){
    input_element.css('background-color', '#ff4c4c')
    input_element.addClass('input_error')
    setTimeout(function () {
        input_element.removeClass('input_error')
        input_element.css('background-color', '')
    }, 300)
}

function getRangeId(eid){
    return "range_id_"+eid
}

function getRangeButtonID(eid){
    return "range_button_"+eid
}

/**
 *
 * @param colorPairs : array of strings with two colors.
 * @param index : int, the number corresponding to the int in the class name
 * @param pid : string, pid of this problem
 */
function generateGradientClasses(colorPairs, pid) {
    const color1 = getColorCode(colorPairs[0]);
    const color2 = getColorCode(colorPairs[1]);
    const className = getGradiantClassName(colorPairs, pid);
    if(className === "rainbow"){return}

    if(checkClassExist(className)){return}
    const style = document.createElement('style');
    document.head.appendChild(style);

    let cssRules = '';


    if (color1 && color2) {
        cssRules += `
            .${className} {
                background: linear-gradient(to top, ${color1} 0%, ${color1} 50%, ${color2} 50%, ${color2} 100%);
            }
        `;
    }

    style.sheet.insertRule(cssRules, style.sheet.cssRules.length);
}

function generateColorClass(colorKey, pid) {
    const className = getMonoColorClassName(colorKey, pid);
    const color = getColorCode(colorKey);

    const classExists = checkClassExist(className)

    if (!classExists) {
        const style = document.createElement('style');
        document.head.appendChild(style);
        let cssRule = `
            .${className} {
                background: ${color}
            }
        `;
        style.sheet.insertRule(cssRule, style.sheet.cssRules.length);
    }
}

function checkClassExist(className){
    // Check if class already exists
    const cssRules = Array.from(document.styleSheets).reduce((rules, sheet) => {
        try {
            return rules.concat(Array.from(sheet.cssRules || []));
        } catch (e) {
            return rules;
        }
    }, []);
    return cssRules.some(rule => rule.selectorText === `.${className}`);
}


function getGradiantClassName(colorKeys, pid){
    let colorKeyP = JSON.parse("["+colorKeys+"]")
    if(colorKeyP.length > 2){return "rainbow"}
    let name = ""
    for(let key in colorKeyP){
        name += '_'+colorKeyP[key]
    }
    return `gradient${name}-${pid}`
}

function getColorCode(colorKey){
    return colorMap[colorKey]
}

function sort_unique(arr) {
    if (arr.length === 0) return arr;
    arr = arr.sort(function (a, b) { return a*1 - b*1; });
    var ret = [arr[0]];
    for (var i = 1; i < arr.length; i++) { //Start loop at 1: arr[0] can never be a duplicate
        if (arr[i-1] !== arr[i]) {
            ret.push(arr[i]);
        }
    }
    return ret;
}

function insertSorted(array, value) {
    const arr = array.flat()
    if (arr.length === 0) {
        arr.push(value);
        return arr;
    }

    for (let i = 0; i < arr.length; i++) {
        if (arr[i] >= value) {
            arr.splice(i, 0, value);
            return arr;
        }
    }

    arr.push(value);
    return arr;
}

function getMonoColorClassName(colorKey, pid){
    return 'Mono_Color_'+colorKey.toString()+"-"+pid
}

function getColorClassName(colorKeys, pid){
    if(colorKeys.length > 1){
        return getGradiantClassName(colorKeys, pid)
    }
    else{
        return getMonoColorClassName(colorKeys, pid)
    }

}

function removeEmptyArrays(arr) {
    return arr.filter(subArray => subArray.length > 0);
}
