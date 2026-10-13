import { ChoiceInterface } from '../interfaces/choice.interface';

export function includesOrEquals(item: string[] | string | number, arg: string | number): boolean {
  if (item === undefined) {
    return false;
  } else if (Array.isArray(item)) {
    return item.length === 0 ? false : item.map(String).includes(String(arg));
  } else {
    return String(item) === String(arg);
  }
}

export function choiceBtnClassHelper(choice: ChoiceInterface, response: any, options: any = undefined) {
  let btnClass = 'btn btn-block ';
  if (options?.buttonScheme === 'markIncorrect') {
    if (options?.disableButton) {
      btnClass += 'btn-disabled ';
    }
    if (includesOrEquals(response.selected, String(choice.id))) {
      btnClass += 'btn-danger ';
    } else {
      btnClass += 'btn-success ';
    }
  } else if (options?.buttonScheme === 'markCorrect') {
    if (includesOrEquals(response.selected, String(choice.id))) {
      btnClass += 'btn-success ';
    } else {
      btnClass += 'btn-danger ';
    }
  } else {
    btnClass += 'btn-default ';
    if (
      includesOrEquals(response.selected, String(choice.id)) &&
      options?.feedback !== 'gradeResponse' &&
      options?.feedback !== 'showCorrect' &&
      !options?.disableButton
    ) {
      btnClass += 'active ';
    }
    if (options?.feedback === 'gradeResponse' || options?.feedback === 'showCorrect' || options?.disableButton) {
      btnClass += 'btn-disabled ';
    }
    if (
      (options?.feedback === 'gradeResponse' || options?.feedback === 'showCorrect') &&
      includesOrEquals(response.selected, String(choice.id)) &&
      choice?.correct
    ) {
      btnClass += 'btn-success ';
    }
    if (
      (options?.feedback === 'gradeResponse' || options?.feedback === 'showCorrect') &&
      includesOrEquals(response.selected, String(choice.id)) &&
      !choice?.correct
    ) {
      btnClass += 'btn-danger ';
    }
    if (
      (options?.feedback === 'showCorrect' && !includesOrEquals(response.selected, String(choice.id)) && !choice?.correct) ||
      options?.disableButton
    ) {
      btnClass += 'btn-faded ';
    }
  }
  return btnClass;
}
