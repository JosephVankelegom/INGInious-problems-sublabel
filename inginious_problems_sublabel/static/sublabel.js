

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
}

function load_feedback_sublabel(key, content) {
    load_feedback_code(key, content);
}



/*$(document).on('mouseup','textarea',function(){
    var selectedText = getSelectionText(this);
    $("#debug").html(selectedText);
})

$('#input').highlightWithinTextarea({
    highlight: 'a' // string, regexp, array, function, or custom object
});
*/


function getSelectionText(textarea){
    var text = "";

    if(window.getSelection){
        try{
            return window.getSelection().getRangeAt(0).toString();
        }
        catch (e) {
        }
        try{
            return window.getSelection().toString();
        }
        catch (e) {
        }
    }
    try{   // for textarea.
        var start = textarea.selectionStart;
        var finish = textarea.selectionEnd;
        return textarea.value.substring(start,finish);
    }
    catch (e) {
    }
    return "ERROR";
}

function getIndexStartSelection(textarea){   // maybe save the value for correction ?
    return textarea.selectionStart;
}
function getIndexEndSelection(textarea){
    return textarea.selectionEnd;
}

function highlightFromIndexes(textarea){
    var inputText = document.getElementById("codeHighlight");
    var innerHTML = inputText.innerHTML;  // Use value property instead of innerHTML
    var start   = getIndexStartSelection(textarea);
    var end     = getIndexEndSelection(textarea);
    var answerText = document.getElementById("answer-sublabel").value;
    document.getElementById("answer-sublabel").value = start.toString()+ end.toString() + answerText;
    if (start=>0 && start < end ) {    // CONDITION DE FIN Et CHECK SI BUG AVEC DIFF!!!
        innerHTML = innerHTML.substring(0, start) + "<span class='highlight'>" + innerHTML.substring(start, end) + "</span>" + innerHTML.substring(end);
        inputText.innerHTML = innerHTML;  // Use value property instead of innerHTML
    }
}
function highlight(text) {
    //var text = getSelectionText("codeHighlight");
    var inputText = document.getElementById("codeHighlight");
    var innerHTML = inputText.innerHTML;  // Use value property instead of innerHTML
    var index = innerHTML.indexOf(text);
    if (index >= 0) {
        innerHTML = innerHTML.substring(0, index) + "<span class='highlight'>" + innerHTML.substring(index, index + text.length) + "</span>" + innerHTML.substring(index + text.length);
        inputText.innerHTML = innerHTML;  // Use value property instead of innerHTML
    }
}

function updateText(){
    var inputText = document.getElementById("codeInput-sublabel").value;
    document.getElementById("codeHighlight").textContent = inputText;
}

function showSelection(textarea){
    document.getElementById("testSelection").textContent = getSelectionText(textarea);
}

$('.codeTest').highlightWithinTextarea({highlight: 'p'});