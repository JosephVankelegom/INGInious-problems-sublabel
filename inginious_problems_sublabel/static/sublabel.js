

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


$(document).on('mouseup','textarea',function(){
    var selectedText = getSelectionText(this);
    $("#debug").html("Selection : '" + selectedText + "'");
})

function getSelectionText(textarea){
    if(window.getSelection){
        try{
            return textarea.value.substring(textarea.selectionStart, textarea.selectionEnd);
        }
        catch (e)
        {
            console.log('Cant get seletion text ERROR')
        }
    }
    if(document.selection && document.selection.type !== "Control") {
        return document.selection.createRange().text;
    }
}
function highlight(){
    var selection = window.getSelection();
    console.log(selection.toString());
    document.body.style.background = "green";

    if (selection > 0){
        var range = selection.getRangeAt(0);
        var span = document.createElement("span");
        span.className = "highlight" ;
        range.surroundContents();
    }
}

function selectionUpdate(){
    HTMLInputElement().select();

}

function myFunction(){
    var input = getSelectionText()
    var output = document.getElementById('output')
    output.value = input.value;
}