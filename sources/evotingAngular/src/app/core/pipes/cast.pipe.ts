/**
 DecentraVote
 Copyright (C) 2018-2022 iteratec
 */
import {Injectable, Pipe, PipeTransform} from "@angular/core";
import {AbstractControl, FormControl} from "@angular/forms";

@Pipe({
  name: 'cast',
  pure: true
})
@Injectable({
  providedIn: 'root'
})
export class CastPipe implements PipeTransform {
  transform(value: any, args?: any): any {
    if(typeof(value) == typeof AbstractControl){
      return value as FormControl;
    }else if(typeof(value) == typeof EventTarget){
      return value as HTMLInputElement;
    }else{
      return value;
    }
  }

}
