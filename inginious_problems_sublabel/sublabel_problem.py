import json
import os.path
import re
import gettext

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
        self._answer = self.parse_answer(content.get("answer", ""))
        self._code = content['code'] if "code" in content else ""
        self._tolerance = content['tolerance'] if "tolerance" in content else ""

    @classmethod
    def get_type(cls):
        return problem_type

    def input_is_consistent(self, task_input, default_allowed_extension, default_max_size):
        return self.get_id() in task_input

    def input_type(self):
        return str

    def check_answer(self, task_input, language):
        symbols = [" "]
        all_labels = self._answer.keys()
        answer_raw = self._answer
        answer_student_raw = json.loads(task_input[self.get_id()])
        answer = {}
        answer_student = {}
        answer_tolerance = self.get_tolerance()
        answer_exclusion = self.get_exclusion(all_labels)
        code = self._code
        result_right = {}
        selection_found = {}

        # Verify answer for each label, check tolerance.
        for label in answer_raw:
            selection_found[label] = {}
            result_right[label] = {}
            # Divide section by \n
            answer[label] = remove_symbol_from_answer(answer_raw[label]['values'], code, '\n')
            for sel in answer[label]:
                selection_found[label][json.dumps(sel)] = 0  # 0: not found, 1: found, 2: incomplete, 3: over tolerance

            if label not in answer_student_raw:  # student didn't complete this label
                continue

            answer_student[label] = remove_symbol_from_answer(answer_student_raw[label]['values'], code, '\n')
            for ans in answer_student[label]:
                ans_clean = remove_symbol_list_from_answer([ans], code, symbols)
                corr = verify_correspondence_strict(ans, ans_clean, answer[label], code, symbols)
                tolerance = check_tolerance(ans_clean, answer_tolerance[label])
                exclusion = check_exclusion(ans_clean, answer_exclusion[label])
                result_right[label][json.dumps(ans)] = [corr, tolerance,
                                                        exclusion]  # corr is all the sel that are intersected (0 if correct)

        # Calcul du score total.
        for label in answer:
            if label not in answer_student:  # skip if student didn't answer.
                continue

            for ans in answer_student[label]:
                if not result_right[label][json.dumps(ans)][1]:  # If selection student over tolerance, skip
                    continue
                for sel in result_right[label][json.dumps(ans)][0]:
                    if selection_found[label][sel] == 1:
                        continue
                    elif result_right[label][json.dumps(ans)][0][sel]:
                        selection_found[label][sel] = 1
                    else:
                        selection_found[label][sel] = 2

        total = 0
        output_statement = ""
        for label in answer:
            found = 0
            incomplete = 0
            over_tolerance = 0
            miss = 0
            correct = 0
            for sel in selection_found[label]:
                match selection_found[label][sel]:
                    case 1:
                        found += 1
                    case 2:
                        incomplete += 1
            not_found = len(selection_found[label]) - found - incomplete - over_tolerance

            output_statement_ans_stud = ""
            for ans in result_right[label]:
                ans_number = json.loads(ans)

                output_statement_ans_stud += f"  * - {code[ans_number[0]:ans_number[1]]} \n"
                if len(result_right[label][ans][0]) == 0:
                    miss += 1
                    output_statement_ans_stud += f"    - 🚫 incorrect\n"
                    output_statement_ans_stud += f"    - {result_right[label][ans][2]}\n"
                elif not result_right[label][ans][1]:
                    over_tolerance += 1
                    output_statement_ans_stud += f"    - 🟧 too large\n"
                    output_statement_ans_stud += f"    - \n"
                else:
                    is_corr = False
                    for sel_stuf in result_right[label][ans][0]:
                        if result_right[label][ans][0][sel_stuf]:
                            is_corr = True
                    if is_corr:
                        correct += 1
                        output_statement_ans_stud += f"    - ✅️ succes \n"
                        output_statement_ans_stud += f"    - \n"
                    else:
                        output_statement_ans_stud += f"    - 🟧 incomplete \n"
                        output_statement_ans_stud += f"    - \n"

            score = max(0, (found - over_tolerance - miss) / len(answer[label]))
            total += score
            # text format under :
            output_statement += (
                f"  * - **{answer_raw[label]['label']}**\n"
                f"    - found : {found}/{len(answer[label])}\n"
                f"    - {score * 100} % \n"
            )
            output_statement += output_statement_ans_stud  # TODO TEST

        total = total / len(answer)
        output_statement = (
                               f"The correction is by selection (a selection is each zone selected divided by backslash).\n\n"
                               f"- correct : is the number of correct selection you have done \n\n"
                               f"- incomplete: is the number of selection you have done that are almost correct, "
                               f"but are missing essential elements\n\n"
                               f"- over tolerance : are the selection you did that are too big, but have a correct selection in them"
                               f"they only impact negatively you mark\n\n"
                               f"- miss: is the number of selection you have done that don't intersect with any correct selection\n\n"
                               f"- not found: is the number of selection done by the teacher you still need to find.\n\n\n"
                               f".. list-table:: **{self.get_name()}** \r"
                               f"  :widths: 20 10 20\n"
                               f"  :header-rows: 1\n\n"
                               f"  * - Score \n"
                               f"    - Status \n"
                               f"    - comment \n") + output_statement

        if total >= 1:
            return True, output_statement, None, 0, "total = " + str(total) + "\n"
        else:
            return False, output_statement, None, 0, ""

    @classmethod
    def parse_problem(cls, problem_content):
        return problem_content

    @classmethod
    def get_text_fields(cls):
        fields = Problem.get_text_fields()
        fields.update({"header": True, "code": True, "answer": True})
        return fields

    def get_tolerance(cls):
        if cls._tolerance == "":
            return {}
        raw = json.loads(cls._tolerance)
        tolerance = {}
        for lid in raw:
            match raw[lid]["type"]:
                case "line":
                    tolerance[lid] = identify_lines(cls._code)
                case "5 characters":
                    tolerance_size = 5
                    tolerance[lid] = fix_tolerance(cls._answer, tolerance_size, lid)
                case "3 characters":
                    tolerance_size = 3
                    tolerance[lid] = fix_tolerance(cls._answer, tolerance_size, lid)
                case "1 character":
                    tolerance_size = 1
                    tolerance[lid] = fix_tolerance(cls._answer, tolerance_size, lid)
                case _:
                    tolerance[lid] = identify_lines(cls._code)
        return tolerance

    def get_exclusion(cls, all_labels):
        exclusion = {}
        for lab in all_labels:
            exclusion[lab] = {}
        if cls._tolerance == "":
            return exclusion
        raw = json.loads(cls._tolerance)
        for lid in raw:
            exclusion[lid] = raw[lid]["exclusion"]
        return exclusion

    def parse_answer(self, answer_raw):
        answer = json.loads(str(answer_raw))
        for label in answer:
            answer_result = []
            for i in range(len(answer[label]['values'])):
                ans = answer[label]['values'][i]
                if ans:
                    answer_result.append(answer[label]['values'][i])
            answer[label]['values'] = answer_result
        return answer


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
        if not interval:  ## TODO verifier si not interval est bien le cas limite si l'interval existe aps
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
                result.append([index + 1, interval[1]])

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


def intersect(interval1, interval2):
    if interval1[1] <= interval2[0] or interval2[1] <= interval1[0]:
        return False
    else:
        return True


def identify_lines(code):
    result = []
    symbol = '\n'
    all_indexes_occu = [m.start() for m in
                        re.finditer(symbol, code)]  # inside text \n are converted to \\n so no problem.
    for index in range(len(all_indexes_occu)):
        if index == 0:
            result.append([0, all_indexes_occu[index]])
        else:
            result.append([all_indexes_occu[index - 1], all_indexes_occu[index]])
    return result


def fix_tolerance(answer, tolerance, lid):
    result = []
    for ans in answer[lid]['values']:
        result.append([ans[0] - tolerance, ans[1] + tolerance])
    return result


def sub_interval(sub_interval, interval):
    if interval[0] <= sub_interval[0] and sub_interval[1] <= interval[1]:
        return True
    else:
        return False


"""
Only one label.

INPUT

-interval: raw selection from student (unclean from symbols) => []
-list_of_intervals: all raw selection from teacher  => []
-code : raw code. => String
-symbols : symbols to remove to clean the selection. => [Strings]

OUTPUT

-intersection : dictionary off all the selection (from teacher) the interval (selection from student) intersected. => {key:value}
the key are the intersected selection from teacher.
the value is True if it completely fill the teacher label, False if there a missing elements.


"""


def verify_correspondence_strict(interval, interval_clean, list_of_intervals, code, symbols):
    intersection = {}

    # check for each selection from the teacher individually.
    for index in range(len(list_of_intervals)):
        inter_teacher = list_of_intervals[index]
        if intersect(interval, inter_teacher):
            inter_teach_clean = remove_symbol_list_from_answer([inter_teacher], code, symbols)
            is_corr = True

            # Check every element from the selection is inside de selection form the student.
            for elem_teacher in inter_teach_clean:

                is_in = False
                for elem_student in interval_clean:
                    if sub_interval(elem_teacher, elem_student):
                        is_in = True
                        break
                if not is_in:
                    is_corr = False

            # add if the selection is complete.
            if is_corr:
                intersection[json.dumps(inter_teacher)] = True
            else:
                intersection[json.dumps(inter_teacher)] = False

    return intersection


"""
:return True if it does respect the tolerance.
"""


def at_least_one_intersection(array1, array2):
    for interval1 in array1:
        for interval2 in array2:
            if intersect(interval1, interval2):
                return True
    return False


def check_tolerance(interval_clean, tolerance_intervals):
    for inter in interval_clean:
        is_in = False
        for tol in tolerance_intervals:
            if sub_interval(inter, tol):
                is_in = True
                break
        if not is_in:
            return False

    return True


def check_exclusion(interval_clean, exclusion_intervals):
    result = ""
    for excl in exclusion_intervals:
        if at_least_one_intersection(interval_clean, exclusion_intervals[excl][1]):
            result += exclusion_intervals[excl][0]
    return result


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
        tolerance = self._tolerance
        data = json.dumps(self._answer)
        return template_helper.render("sublabel.html", template_folder=PATH_TO_TEMPLATES, inputId=self.get_id(),
                                      header=header, code=code, tolerance=tolerance, data=data)

    @classmethod
    def show_editbox(cls, template_helper, key, language):
        """ Show SublabelEdit, designer side"""
        return template_helper.render("sublabel_edit.html", template_folder=PATH_TO_TEMPLATES, key=key)

    @classmethod
    def show_editbox_templates(cls, template_helper, key, language):
        return template_helper.render("sublabel_edit_templates.html", template_folder=PATH_TO_TEMPLATES, key=key)
