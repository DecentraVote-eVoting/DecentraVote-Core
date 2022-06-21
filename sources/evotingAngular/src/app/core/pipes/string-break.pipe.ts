import {Pipe, PipeTransform} from '@angular/core';

@Pipe({
  name: 'stringBreak'
})
export class StringBreakPipe implements PipeTransform {

  transform(input: string, breakLength: number): any {
    let newString = '';
    for (let i = 0; i < input.length; i++) {
      newString = newString + input[i];
      if (i % breakLength === 0) {
        newString = newString + '\n';
      }
    }
    return newString;
  }

}
