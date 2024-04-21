import json
import os.path
import re

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

    @classmethod
    def get_type(cls):
        return problem_type

    def input_is_consistent(self, task_input, default_allowed_extension, default_max_size):
        return self.get_id() in task_input

    def input_type(self):
        return str

    def check_answer(self, task_input, language):
        symbols = ["\n", " "]  # TODO maybe implement a symbol variable to allow teacher to update that list.
        answer = json.loads(self._answer)
        answer_student = json.loads(task_input[self.get_id()])
        code = self._code
        result_right = {}
        result_wrong = {}
        total = 0
        for label in answer:
            answer[label]["values"] = remove_symbol_list_from_answer(answer[label]["values"], code, symbols)
            answer_student[label]["values"] = remove_symbol_list_from_answer(answer_student[label]["values"], code, symbols)
            result_right[label] = []
            result_wrong[label] = []

            for i in range(len(answer_student[label]["values"])):
                if answer_student[label]["values"][i] in answer[label]["values"]:
                    result_right[label].append(i)
                else:
                    result_wrong[label].append(i)
            total += max(0.0, (len(result_right[label]) - len(result_wrong[label])) / len(answer[label]["values"]))

        total = total / len(answer)

        output_statement = "total = " + str(total) + "\n"
        for label in answer:
            output_statement += (answer[label]["label"]
                                 + " : #correct = " + str(len(result_right[label]))
                                 + "   #incorrect = " + str(len(result_wrong[label]))
                                 + "   #expected = " + str(len(answer[label]["values"]))
                                 + "\n")

        if total >= 0.5:
            return True, output_statement, None, 0, "total = " + str(total) + "\n"
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


def parse_answer_student(answer):
    data = json.loads(answer)
    for key in data:
        data[key].pop("values")
    return data


""" Helper functions """


def remove_symbol_list_from_answer(answer, text, symbol_list):
    result = answer
    for symbol in symbol_list:
        result = remove_symbol_from_answer(result, text, symbol)
    return result


def remove_symbol_from_answer(answer, text, symbol):
    result = answer
    all_indexes_occu = [m.start() for m in re.finditer(symbol, text)]
    for index in all_indexes_occu:
        result = remove_index_from_answer(result, index)
    return result


def remove_index_from_answer(answer, index):
    result = []
    for i in range(len(answer)):
        interval = answer[i]
        if not interval:
            continue
        position = is_index_in_interval(interval, index)
        if position == -1:
            result.append(interval)

        elif position == 0:
            if index + 1 != interval[1]:
                result.append([index + 1, interval[1]])

        elif position == 1:
            if interval[0] != index:
                result.append([interval[0], index])

            if index + 1 != interval[1]:
                result.append([index+1, interval[1]])

        elif position == 2:
            result.append([interval[0], index])
    return result


def is_index_in_interval(interval, index):
    if index < interval[0] or index > interval[1]:
        return -1
    elif index == interval[0]:
        return 0
    elif index == interval[1]:
        return 2
    else:
        return 1


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
        data = json.dumps(parse_answer_student(self._answer))
        return template_helper.render("sublabel.html", template_folder=PATH_TO_TEMPLATES, inputId=self.get_id(),
                                      header=header, code=code, data=data)

    @classmethod
    def show_editbox(cls, template_helper, key, language):
        """ Show SublabelEdit, designer side"""
        return template_helper.render("sublabel_edit.html", template_folder=PATH_TO_TEMPLATES, key=key)

    @classmethod
    def show_editbox_templates(cls, template_helper, key, language):
        return template_helper.render("sublabel_edit_templates.html", template_folder=PATH_TO_TEMPLATES, key=key)
