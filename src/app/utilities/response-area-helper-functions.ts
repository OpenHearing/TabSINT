import { ChoiceInterface } from '../interfaces/choice.interface';

export function choiceBtnClassHelper(choice: ChoiceInterface, response: any, options: any = undefined) {
  let btnClass = 'btn btn-block ';
  if (options?.buttonScheme === 'markIncorrect') {
    if (response.selected.includes(choice.id)) {
      btnClass += 'btn-danger ';
    } else {
      btnClass += 'btn-success ';
    }
  } else if (options?.buttonScheme === 'markCorrect') {
    if (response.selected.includes(choice.id)) {
      btnClass += 'btn-success ';
    } else {
      btnClass += 'btn-danger ';
    }
  } else {
    btnClass += 'btn-default ';
    if (response.selected.includes(choice.id) && options?.feedback !== 'gradeResponse' && options?.feedback !== 'showCorrect') {
      btnClass += 'active ';
    }
    if (options?.feedback === 'gradeResponse' || options?.feedback === 'showCorrect') {
      btnClass += 'btn-disabled ';
    }
    if ((options?.feedback === 'gradeResponse' || options?.feedback === 'showCorrect') && response.selected.includes(choice.id) && choice?.correct) {
      btnClass += 'btn-success ';
    }
    if ((options?.feedback === 'gradeResponse' || options?.feedback === 'showCorrect') && response.selected.includes(choice.id) && !choice?.correct) {
      btnClass += 'btn-danger ';
    }
    if (options?.feedback === 'showCorrect' && !response.selected.includes(choice.id) && !choice?.correct) {
      btnClass += 'btn-faded ';
    }
  }
  return btnClass;
}
