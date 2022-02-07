/**
 DecentraVote
 Copyright (C) 2018-2022 iteratec
 */
import {Injectable, Pipe, PipeTransform} from '@angular/core';
import {User} from '@app/user/models/user.model';
import {ImportUser} from "@import-user/models/import-user.model";

@Pipe({name: 'MemberName'})
@Injectable({
  providedIn: 'root'
})
export class MemberNamePipe implements PipeTransform {

  transform(user: User | ImportUser) {
    if (!user) {
      return '';
    }
    if ('id' in user) {
      return user.field1 + ' ' + user.field2;
    } else {
      return user.resolvedClaim.field1 + ' ' + user.resolvedClaim.field2;
    }
  }
}
