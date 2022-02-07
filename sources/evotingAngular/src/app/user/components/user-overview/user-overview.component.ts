/**
 DecentraVote
 Copyright (C) 2018-2022 iteratec
 */
import {Component, Input} from '@angular/core';
import {User, UserTab} from '@app/user/models/user.model';
import {ImportUser} from '@import-user/models/import-user.model';

@Component({
  selector: 'app-user-overview',
  templateUrl: './user-overview.component.html'
})
export class UserOverviewComponent {

  @Input() user: User;
  @Input() users: User[] = [];
  @Input() authOptions: string[] = [];
  @Input() usersLoading: boolean;
  @Input() userIsDirector: boolean;
  @Input() importedUsers: ImportUser[] = [];

  activeTab: UserTab = UserTab.MEMBER;
  userTab = UserTab;

  constructor() {
  }

  onTabChange(tab: UserTab) {
    this.activeTab = tab;
  }

}
