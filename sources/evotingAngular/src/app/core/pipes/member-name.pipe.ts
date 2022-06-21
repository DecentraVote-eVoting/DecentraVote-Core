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
      return user.name1 + ' ' + user.name2;
    } else {
      return user.resolvedClaim.name1 + ' ' + user.resolvedClaim.name2;
    }
  }
}
