/**
 DecentraVote
 Copyright (C) 2018-2022 iteratec
 */
import {Component, EventEmitter, HostListener, Input, Output} from '@angular/core';
import {User} from '@app/user/models/user.model';
import {ImportUser} from '@import-user/models/import-user.model';
import {TranslatePipe} from '@ngx-translate/core';
import {PermissionService} from '@core/services/permission.service';
import {Permission} from '@core/models/permission.model';
import {Role} from '@user/models/role.model';

export interface UserListCell {
  title: string;
  subtitle?: string;
  detail?: string;
  role?: Role;
  validUntil?: string;
  userRef?: User;
  importUserRef?: ImportUser;
}

@Component({
  selector: 'app-user-manage-list',
  templateUrl: './user-manage-list.component.html',
})
export class UserManageListComponent {
  @Input() enableChangeActions = false;
  @Input() meetingsLoading = true;

  @Input()
  set users(users: User[]) {
    this._users = users;
    this.processUserListCells();
  }

  @Input()
  set importedUsers(importedUsers: ImportUser[]) {
    this._importUsers = importedUsers;
    this.processUserListCells();
  }

  @Output() deleteImportUserEvent = new EventEmitter<ImportUser>();
  @Output() deleteUserEvent = new EventEmitter<User>();
  @Output() editUserEvent = new EventEmitter<User>();
  @Output() editImportUserEvent = new EventEmitter<ImportUser>();
  @Output() replaceUserEvent = new EventEmitter<User>();
  @Output() manageAccessCodeEvent = new EventEmitter<ImportUser>();

  userListCells: UserListCell[] = [];
  _users: User[] = [];
  _importUsers: ImportUser[] = [];
  pageSize: number = 10;
  page = 1;
  screenWidth: number;

  constructor(private translatePipe: TranslatePipe,
              private permissionService: PermissionService) {
    this.onResize();
  }

  @HostListener('window:resize', ['$event'])
  onResize(event?) {
    this.screenWidth = window.innerWidth;
  }

  processUserListCells() {
    this.userListCells = [];

    // process Users to Cells
    this._users.forEach(user => {
      this.userListCells.push({
        title: user.resolvedClaim.field1 + ' ' + user.resolvedClaim.field2,
        subtitle: user.resolvedClaim.field0,
        detail: user.address,
        role: user.role,
        userRef: user
      });
    });

    // process importUsers to Cells
    this._importUsers.forEach(importUser => {
      this.userListCells.push({
        title: importUser.field1 + ' ' + importUser.field2,
        subtitle: importUser.field0,
        detail: 'User.Invited',
        role: new Role(importUser.role),
        validUntil: importUser.validUntil,
        importUserRef: importUser
      });
    });


    if (this.userListCells.length < 10) this.page = 1;
  }

  isAccessCodeValid(user: UserListCell): boolean {
    return new Date(user.validUntil).getTime() > Date.now();
  }

  showUserTools(): boolean {
    return this.permissionService.check(Permission.USER_MANAGE);
  }

  getAccessCodeInformation(user: UserListCell): string {
    const msPerSecond = 1000;
    const msPerMinute = msPerSecond * 60;
    const msPerHour = msPerMinute * 60;
    const msPerDay = msPerHour * 24;
    const msPerWeek = msPerDay * 7;

    const msCodeIsStillValid = new Date(user.validUntil).getTime() - Date.now();
    const accessCodeString = this.translatePipe.transform('User.Access-Code.Is');

    const weeksLeft = Math.floor(msCodeIsStillValid / msPerWeek);
    if (weeksLeft > 1) {
      return `${accessCodeString} ${weeksLeft} ${this.translatePipe.transform('User.Access-Code.Weeks-Valid')}`;
    }
    if (weeksLeft === 1) {
      return `${accessCodeString} 1 ${this.translatePipe.transform('User.Access-Code.Week-Valid')}`;
    }

    const daysLeft = Math.floor(msCodeIsStillValid / msPerDay);
    if (daysLeft > 1) {
      return `${accessCodeString} ${daysLeft} ${this.translatePipe.transform('User.Access-Code.Days-Valid')}`;
    }
    if (daysLeft === 1) {
      return `${accessCodeString} 1 ${this.translatePipe.transform('User.Access-Code.Day-Valid')}`;
    }

    const hoursLeft = Math.floor(msCodeIsStillValid / msPerHour);
    if (hoursLeft > 1) {
      return `${accessCodeString} ${hoursLeft} ${this.translatePipe.transform('User.Access-Code.Hours-Valid')}`;
    }
    if (hoursLeft === 1) {
      return `${accessCodeString} 1 ${this.translatePipe.transform('User.Access-Code.Hour-Valid')}`;
    }

    const minutesLeft = Math.floor(msCodeIsStillValid / msPerMinute);
    if (minutesLeft > 1) {
      return `${accessCodeString} ${minutesLeft} ${this.translatePipe.transform('User.Access-Code.Minutes-Valid')}`;
    }
    if (minutesLeft === 1) {
      return `${accessCodeString} 1 ${this.translatePipe.transform('User.Access-Code.Minute-Valid')}`;
    }

    return this.translatePipe.transform('User.Access-Code.Expires-Soon');
  }


  getArray(pagenumber: number, usePagination: boolean): UserListCell[] {
    pagenumber -= 1;
    if (usePagination) {
      return this.userListCells.slice(pagenumber * this.pageSize, (pagenumber + 1) * this.pageSize);
    } else {
      return this.userListCells;
    }
  }

}
