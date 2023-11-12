import os.path

from inginious.common.tasks_problems import Problem
from inginious.frontend.task_problems import DisplayableProblem
from inginious.frontend.parsable_text import ParsableText
from inginious.frontend.task_problems import DisplayableCodeProblem

PATH_TO_PLUGIN = os.path.abspath(os.path.dirname(__file__))
PATH_TO_TEMPLATES = os.path.join(PATH_TO_PLUGIN, "templates")
problem_type = "sublabel"

class SublabelProblem(Problem):
    "display code where can select code to label."

    def __init__(self, problemid, content, translations, taskfs):
        Problem.__init__(self, problemid, content, translations, taskfs)

    @classmethod
    def get_type(cls):
        return problem_type

    def input_is_consistent(self, task_input, default_allowed_extension, default_max_size):
        return self.get_id() in task_input

    def input_type(self):
        return str

    def check_answer(self, task_input, language):
        return None, None, None, 0, ""

    @classmethod
    def parse_problem(self, problem_content):
        return Problem.parse_problem(problem_content)

    @classmethod
    def get_text_fields(cls):
        return Problem.get_text_fields()


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
        return template_helper.render("demo.html", template_folder=PATH_TO_TEMPLATES, inputId=self.get_id(), header=header)

    @classmethod
    def show_editbox(cls, template_helper, key, language):
        """ Show SublabelEdit, designer side"""
        return template_helper.render("sublabel_edit.html", template_folder=PATH_TO_TEMPLATES, key=key)

    @classmethod
    def show_editbox_templates(cls, template_helper, key, language):
        return ""