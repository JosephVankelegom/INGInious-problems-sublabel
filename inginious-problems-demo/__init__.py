# -*- coding: utf-8 -*-
#
# This file is part of INGInious. See the LICENSE and the COPYRIGHTS files for
# more information about the licensing of this file.

import os

from flask import send_from_directory

from inginious.common.tasks_problems import Problem
from inginious.frontend.pages.utils import INGIniousPage
from inginious.frontend.task_problems import DisplayableProblem
from inginious.frontend.parsable_text import ParsableText

__version__ = "0.1.dev0"

PATH_TO_PLUGIN = os.path.abspath(os.path.dirname(__file__))
PATH_TO_TEMPLATES = os.path.join(PATH_TO_PLUGIN, "templates")


class StaticMockPage(INGIniousPage):
    def GET(self, path):
        return send_from_directory(os.path.join(PATH_TO_PLUGIN, "static"), path)

    def POST(self, path):
        return self.GET(path)


class DemoProblem(Problem):
    """Display an input box and check that the content is correct"""

    def __init__(self, problemid, content, translations, taskfs):
        Problem.__init__(self, problemid, content, translations, taskfs)
        self._header = content['header'] if "header" in content else ""
        self._answer = str(content.get("answer", ""))

    @classmethod
    def get_type(cls):
        return "demo"

    def input_is_consistent(self, task_input, default_allowed_extension, default_max_size):
        return self.get_id() in task_input

    def input_type(self):
        return str

    def check_answer(self, task_input, language):
        # By default, everything pass in the docker agent.
        # If answer is specified, can be assessed in MCQ-like environnment using check_answer
        if not self._answer:
            return None, None, None, 0, ""
        elif task_input[self.get_id()].strip() == self._answer:
            return True, None, ["correct answer"], 0, ""
        else:
            return False, None, ["wrong answer"], 0, ""

    @classmethod
    def parse_problem(self, problem_content):
        return Problem.parse_problem(problem_content)

    @classmethod
    def get_text_fields(cls):
        return Problem.get_text_fields()


class DisplayableDemoProblem(DemoProblem, DisplayableProblem):
    """ A displayable match problem """

    def __init__(self, problemid, content, translations, taskfs):
        DemoProblem.__init__(self, problemid, content, translations, taskfs)

    @classmethod
    def get_type_name(self, language):
        return "demo"

    def show_input(self, template_helper, language, seed):
        """ Show DemoProblem """
        header = ParsableText(self.gettext(language, self._header), "rst",
                              translation=self.get_translation_obj(language))
        return template_helper.render("demo.html", template_folder=PATH_TO_TEMPLATES, inputId=self.get_id(), header=header)

    @classmethod
    def show_editbox(cls, template_helper, key, language):
        return template_helper.render("demo_edit.html", template_folder=PATH_TO_TEMPLATES, key=key)

    @classmethod
    def show_editbox_templates(cls, template_helper, key, language):
        return ""


def init(plugin_manager, course_factory, client, plugin_config):
    # TODO: Replace by shared static middleware and let webserver serve the files
    plugin_manager.add_page('/plugins/demo/static/<path:path>', StaticMockPage.as_view("demoproblemstaticpage"))
    plugin_manager.add_hook("css", lambda: "/plugins/demo/static/demo.css")
    plugin_manager.add_hook("javascript_header", lambda: "/plugins/demo/static/demo.js")
    course_factory.get_task_factory().add_problem_type(DisplayableDemoProblem)
