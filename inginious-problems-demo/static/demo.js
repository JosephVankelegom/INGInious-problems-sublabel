function load_input_demo(submissionid, key, input) {
    var field = $("form#task input[name='" + key + "']");
    if(key in input)
        $(field).prop('value', input[key]);
    else
        $(field).prop('value', "");
}

function studio_init_template_demo(well, pid, problem)
{
    if("answer" in problem)
        $('#answer-' + pid, well).val(problem["answer"]);
}

function load_feedback_demo(key, content) {
    load_feedback_code(key, content);
}