/**
 DecentraVote
 Copyright (C) 2018-2022 iteratec
 */
import {Component, EventEmitter, Input, Output} from '@angular/core';
import {ImportUser} from '@import-user/models/import-user.model';
import {UserTab} from '@app/user/models/user.model';
import {Role} from '@user/models/role.model';

@Component({
  selector: 'app-user-manage-import-list',
  templateUrl: './user-manage-import-list.component.html',
  styles: [`
    :host {
      display: flex;
      flex-direction: column;
    }
  `]
})
export class UserManageImportListComponent {

  @Input() changesAllowed = false;
  @Input() userTab: UserTab;

  _importedUser: ImportUser[] = [];

  @Input()
  set importedUsers(importedUser: ImportUser[]) {
    if (this.userTab === UserTab.GUEST) {
      this._importedUser = importedUser.filter((user: ImportUser) => new Role(user.role).isRole(Role.GUEST));
    } else {
      this._importedUser = importedUser.filter((user: ImportUser) => new Role(user.role).isRole(Role.MEMBER));
    }
  }

  get importedUsers(): ImportUser[] {
    return (this._importedUser || []);
  }

  @Output() removeImportUserClickedAction = new EventEmitter<ImportUser>();

  constructor() {
  }

  onIconClick(importUser: ImportUser) {
    this.removeImportUserClickedAction.emit(importUser);
  }

}
