/**
 DecentraVote
 Copyright (C) 2018-2022 iteratec
 */
import {Injectable, Pipe, PipeTransform} from '@angular/core';
import {User} from "@user/models/user.model";
import {UserListCell} from "@user/components/user-manage-list/user-manage-list.component";
import {UserResult} from "@voting/models/vote.model";
import {MemberRepresentation} from "@meeting/models/meeting-member.model";

@Pipe({name: 'UserSortPipe'})
@Injectable({providedIn: 'root'})
export class UserSortPipe implements PipeTransform {

  constructor() {
  }
  resultsByUserFiltered: { [key: string]: { result: UserResult, expanded: boolean } } = {};

  transform(value: any, method?: number): any {
    if (value) {
      const type = this.getCorrectType(value);
      //since type 1 is a dictionary this needs to be cast
      if (type == 1) value = Object.values(value)
      return value.sort((u1, u2) => this.userSort(u1, u2, type, method));
    } else return
  }

  getCorrectType(value): number {
    if (!value) return -1
    if (this.isUserListCell(value)) return 0
    if (this.isResultsByUserFiltered(value)) return 1
    if (this.isUser(value)) return 2;
    if (this.isMemberRepresentation(value)) return 3;
    if (this.isUserResult(value)) return 4;
    return -1;
  }

  isUser(object: any): object is User[] {
    if (!object[0]) return false;
    return 'resolvedClaim' in object[0];
  }
  isResultsByUserFiltered(object: any): object is { [key: string]: { result: UserResult, expanded: boolean } }[] {
    if (!Object.values(object)) return false;
    const temp: any = Object.values(object)[0];
    if (!temp) return
    return 'result' in temp;
  }
  isUserListCell(object: any): object is UserListCell[] {
    if (!object[0]) return false;
    return 'subtitle' in object[0];
  }
  isMemberRepresentation(object: any): object is MemberRepresentation[] {
    if (!object[0]) return false;
    return 'representee' in object[0];
  }
  isUserResult(object: any): object is UserResult[] {
    if (!object[0]) return false;
    return 'ethAddress' in object[0];
  }


  userSort(v1, v2, type, method): number {
    switch (type) {
      case -1: return
      case 0: {
        if (v1.title.localeCompare(v2.title) < 0) {return -1;}
        if (v1.title.localeCompare(v2.title) > 0) {return 1;}
        if (v1.subtitle.localeCompare(v2.subtitle) < 0) {return -1;}
        if (v1.subtitle.localeCompare(v2.subtitle) > 0) {return 1;}
        break;
      }
      case 1: {
        if (v1.result.field1.localeCompare(v2.result.field1) < 0) {return -1;}
        if (v1.result.field1.localeCompare(v2.result.field1) > 0) {return 1;}

        if (v1.result.field2.localeCompare(v2.result.field2) < 0) {return -1;}
        if (v1.result.field2.localeCompare(v2.result.field2) > 0) {return 1;}

        if (v1.result.field0.localeCompare(v2.result.field0) < 0) {return -1;}
        if (v1.result.field0.localeCompare(v2.result.field0) > 0) {return 1;}
        break;
      }

      case 2: {
        if (method == 1) {
          if (v1.role && v1.role.value > v2.role.value) { return -1; }
          if (v1.role && v1.role.value < v2.role.value) { return 1; }
        }

        if (v1.resolvedClaim.field1.localeCompare(v2.resolvedClaim.field1) < 0) {return -1;}
        if (v1.resolvedClaim.field1.localeCompare(v2.resolvedClaim.field1) > 0) {return 1;}

        if (v1.resolvedClaim.field2.localeCompare(v2.resolvedClaim.field2) < 0) {return -1;}
        if (v1.resolvedClaim.field2.localeCompare(v2.resolvedClaim.field2) > 0) {return 1;}

        if (v1.resolvedClaim.field0.localeCompare(v2.resolvedClaim.field0) < 0) {return -1;}
        if (v1.resolvedClaim.field0.localeCompare(v2.resolvedClaim.field0) > 0) {return 1;}
        break;
      }
      case 3: {
        if (v1.representee.localeCompare(v2.representee) < 0) {return -1;}
        if (v1.representee.localeCompare(v2.representee) > 0) {return 1;}

        if (v1.representative.localeCompare(v2.representative) < 0) {return -1;}
        if (v1.representative.localeCompare(v2.representative) > 0) {return 1;}
        break;
      }
      case 4: {
        if (v1.field1.localeCompare(v2.field1) < 0) {return -1;}
        if (v1.field1.localeCompare(v2.field1) > 0) {return 1;}

        if (v1.field2.localeCompare(v2.field2) < 0) {return -1;}
        if (v1.field2.localeCompare(v2.field2) > 0) {return 1;}

        if (v1.field0.localeCompare(v2.field0) < 0) {return -1;}
        if (v1.field0.localeCompare(v2.field0) > 0) {return 1;}
      }
    }
    return 0;
  }

}
