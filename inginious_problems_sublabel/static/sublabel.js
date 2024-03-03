
let numberOfLabels = 3;
let highlightValueArray =[[[]],[[]],[[]]]; // indexes of highlighted text is situated.
let ListIdLabels =[]



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
    startPage(well, pid, problem)
    contextMenuStart(well, pid, problem)
}

function load_feedback_sublabel(key, content) {
    load_feedback_code(key, content);
}

function startPage(well, pid, problem) {

    let textarea = $('#code-' + pid, well)
    createHighlightTextarea()

    function createHighlightTextarea(){
        if(numberOfLabels === 1){textarea.highlightWithinTextarea({ highlight:
                highlightValueArray[0], className:'yellow'});}
        if(numberOfLabels === 2){textarea.highlightWithinTextarea({ highlight:[
            {highlight: highlightValueArray[0], className: 'yellow'},
            {highlight: highlightValueArray[1], className: 'blue'}]});}
        if(numberOfLabels === 3){textarea.highlightWithinTextarea({ highlight:[
            {highlight: highlightValueArray[0], className: 'yellow'},
            {highlight: highlightValueArray[1], className: 'blue'},
            {highlight: highlightValueArray[2], className: 'red'}]});}
    }

    function updateValues() {
        console.log("updateValue javascript")
        textarea.highlightWithinTextarea('destroy');
        createHighlightTextarea()
        $('#answer-' + pid).val( "label 1: " + highlightValueArray[0].toString()+"   label 2: " + highlightValueArray[1].toString()+"   label 3: " + highlightValueArray[2].toString());
    }

    $('#highlight_button').on('mousedown', function() {
        console.log("Ligne 48 javascript")
        const codeAreaval = document.getElementById('code-' + pid);
        let selS = codeAreaval.selectionStart;
        let selE = codeAreaval.selectionEnd;
        highlightValueArray[0] = updateArray(selS,selE, highlightValueArray[0]);
        updateValues();

    })

    $('#highlight_button2').on('mousedown', function() {
        console.log("Ligne 58 javascript")
        const codeAreaval = document.getElementById('code-' + pid);
        let selS = codeAreaval.selectionStart;
        let selE = codeAreaval.selectionEnd;
        highlightValueArray[1] = updateArray(selS,selE, highlightValueArray[1]);
        updateValues();

    })

    $('#highlight_button3').on('mousedown', function() {
        console.log("Ligne 68 javascript")
        const codeAreaval = document.getElementById('code-' + pid);
        let selS = codeAreaval.selectionStart;
        let selE = codeAreaval.selectionEnd;
        highlightValueArray[2] = updateArray(selS,selE, highlightValueArray[2]);
        updateValues();
    })

    console.log("Before event listener registration");

    $('#eraseButton').on('click', function() {
        console.log("Ligne 78 javascript")
        highlightValueArray=[[[]],[[]],[[]]]
        updateValues()
    })

    function updateArray(start, end, array){
        let result = array.flat();

        let indexStart  = result.findIndex(function(value){return value>=start}) // rajouter si plus grand que tout etc
        let indexEnd    = result.findIndex(function(value){return value>=end})
        if(indexStart   === -1){indexStart = result.length}
        if(indexEnd     === -1){indexEnd = result.length}
        let usefulStart = (indexStart%2) === 0
        let usefulEnd   = (indexEnd%2) === 0


        if(indexStart === result.length){
            console.log(start, indexStart, "enter indexStart max")
            result = result.concat([start, end])}
        else if(indexEnd === 0){
            console.log("enter indexEnd min")
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

    function createLabel(){

        var labelName = document.createElement("input");
        labelName.setAttribute("type", "text")
        labelName.setAttribute("id", getNewLabelId().toString())
        labelName.setAttribute("placeholder", "Label name")
        document.getElementById('labelDiv').appendChild(labelName)
    }

    /**
     * @return {Number}
     */
    function getNewLabelId() {
        let result = 0;
        if(ListIdLabels.length > 0){
            result = ListIdLabels[ListIdLabels.length-1]+1
        }
        ListIdLabels.push(result)
        return result
    }
    $('#addLabel').on('click', createLabel)

    $('#TestButton').on('click', function() {
        console.log($('#'+'1').val())
    })
}
function contextMenuStart(well, pid, problem) {
    var context = $('#code-PID')
    var contextMenu = $('#context-menu')
    document.addEventListener("contextmenu", function (e) {
        e.preventDefault()

        contextMenu.css({
            display: "block",
            left: event.clientX -280 + "px",
            top: event.clientY  +200 + "px"
        });
    })
    document.addEventListener("click", function (event){
        contextMenu.css({
            "display": "none"
        })
    });
    $("option1").on("click", function(){
        alert("Option 1 bg whaaa")
    })
}