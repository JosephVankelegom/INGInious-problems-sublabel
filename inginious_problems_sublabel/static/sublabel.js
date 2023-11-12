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

function highlight(){
    var selection = window.getSelection();
    if (selection > 0){
        var range = selection.getRangeAt(0);
        var span = document.createElement("span");
        span.className = "highlight" ;
        range.surroundContents();
    }
}