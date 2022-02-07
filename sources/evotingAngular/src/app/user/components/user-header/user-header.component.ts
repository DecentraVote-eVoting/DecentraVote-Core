/**
 DecentraVote
 Copyright (C) 2018-2022 iteratec
 */
import {Component, EventEmitter, Input, Output} from '@angular/core';
import {ROUTE_PATHS} from '@app/route-paths';
import {User, UserTab} from '@app/user/models/user.model';
import {AuthenticationMethod} from '@core/models/common.model';

@Component({
  selector: 'app-user-header',
  templateUrl: './user-header.component.html'
})
export class UserHeaderComponent {

  @Input() activeTab: UserTab;
  @Input() users: User[];
  @Input() user: User;
  @Input() authOptions: string[];
  @Input() userIsDirector: boolean;

  @Output() tabChangeAction = new EventEmitter<UserTab>();

  memberTab = UserTab;
  routePaths = ROUTE_PATHS;

  constructor() {
  }

  isTokenAuth(): boolean {
    return (this.authOptions || []).includes(AuthenticationMethod.TOKEN);
  }

}
