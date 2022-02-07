/**
 DecentraVote
 Copyright (C) 2018-2022 iteratec
 */
import {Component, Input, OnInit} from '@angular/core';
import {Role} from '@user/models/role.model';

@Component({
  selector: 'app-role-badges',
  templateUrl: './role-badges.component.html'
})
export class RoleBadgesComponent implements OnInit {
  @Input() userRole: Role;

  constructor() { }

  ngOnInit() {
  }

  isUserDirector(): boolean {
    return this.userRole.isRole(Role.DIRECTOR);
  }

  isUserMember(): boolean {
    return this.userRole.isRole(Role.MEMBER);
  }

  isUserGuest(): boolean {
    return this.userRole.isRole(Role.GUEST);
  }
}
