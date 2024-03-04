import os.path

from inginious.common.tasks_problems import Problem
from inginious.frontend.task_problems import DisplayableProblem
from inginious.frontend.parsable_text import ParsableText
from inginious.frontend.task_problems import DisplayableCodeProblem

PATH_TO_PLUGIN = os.path.abspath(os.path.dirname(__file__))
PATH_TO_TEMPLATES = os.path.join(PATH_TO_PLUGIN, "templates")
problem_type = "sublabel"


class SublabelProblem(Problem):
    """display code where can select code to label."""

    def __init__(self, problemid, content, translations, taskfs):
        Problem.__init__(self, problemid, content, translations, taskfs)
        self._header = content['header'] if "header" in content else ""
        self._answer = str(content.get("answer", ""))
        self._code = content['code'] if "code" in content else ""
        self._labels_id = content['label_id'] if "label_id" in content else ""
        self._labels_color = content['label_color'] if "label_color" in content else ""
        self._labels_value = content['label_value'] if "label_value" in content else ""


    @classmethod
    def get_type(cls):
        return problem_type

    def input_is_consistent(self, task_input, default_allowed_extension, default_max_size):
        return self.get_id() in task_input

    def input_type(self):
        return str

    def check_answer(self, task_input, language):
        if self._answer == task_input[self.get_id()]:
            return True, None, None, 0, ""
        else:
            return False, None, None, 0, ""

    @classmethod
    def parse_problem(cls, problem_content):
        return problem_content

    @classmethod
    def get_text_fields(cls):
        fields = Problem.get_text_fields()
        fields.update({"header": True, "code": True, "answer": True})
        return fields


class DisplayableSublabelProblem(SublabelProblem, DisplayableProblem):
    """ A displayable sublabel problem """

    def __init__(self, problemid, content, translations, taskfs):
        SublabelProblem.__init__(self, problemid, content, translations, taskfs)

    @classmethod
    def get_type_name(self, language):
        return problem_type

    def show_input(self, template_helper, language, seed):
        """ Show SublabelProblem, student side """
        header = ParsableText(self.gettext(language, self._header), "rst",
                              translation=self.get_translation_obj(language))
        code = self._code

        return template_helper.render("sublabel.html", template_folder=PATH_TO_TEMPLATES, inputId=self.get_id(),
                                      header=header, code=code)

    @classmethod
    def show_editbox(cls, template_helper, key, language):
        """ Show SublabelEdit, designer side"""
        return template_helper.render("sublabel_edit.html", template_folder=PATH_TO_TEMPLATES, key=key)

    @classmethod
    def show_editbox_templates(cls, template_helper, key, language):
        return template_helper.render("sublabel_edit_templates.html", template_folder=PATH_TO_TEMPLATES, key=key)
#####template_helper.render("sublabel_edit_templates.html", template_folder=PATH_TO_TEMPLATES, key=key)
