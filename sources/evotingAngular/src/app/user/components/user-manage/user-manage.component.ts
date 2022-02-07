/**
 DecentraVote
 Copyright (C) 2018-2022 iteratec
 */
import {ChangeDetectorRef, Component, Input} from '@angular/core';
import {User} from '@app/user/models/user.model';
import {AuthenticationMethod} from '@core/models/common.model';
import {PermissionService} from '@core/services/permission.service';
import {Permission} from '@core/models/permission.model';
import {MeetingModel} from '@meeting/models/meeting.model';
import {ModalService} from '@core/services/modal.service';
import {RemoveUserModalComponent} from '@app/user/components/remove-user-modal/remove-user-modal.component';
import {MemberNamePipe} from '@core/pipes/member-name.pipe';
import {ImportUser} from '@import-user/models/import-user.model';
import {ExportUsersModalSmartComponent} from '@import-user/components/export-users-modal-smart/export-users-modal-smart.component';
import {UserEditModalComponent} from '@user/components/user-edit-modal/user-edit-modal.component';
import {ImportUsersModalSmartComponent} from '@import-user/components/import-users-modal-smart/import-users-modal-smart.component';
import {RemoveImportUserModalComponent} from '@import-user/components/remove-import-user/remove-import-user-modal.component';
import {ReplaceUserModalSmartComponent} from '@user/components/replace-user-modal/replace-user-modal-smart.component';
import {ImportUserAccessCodeModalComponent} from '@import-user/components/import-user-access-code-modal/import-user-access-code-modal.component';
import {ImportUserEditModalComponent} from '@import-user/components/import-user-edit-modal/import-user-edit-modal.component';
import {Role} from '@user/models/role.model';

@Component({
  selector: 'app-user-manage',
  templateUrl: './user-manage.component.html'
})
export class UserManageComponent {

  @Input() usersLoading = false;
  @Input() authOptions: string[] = [];

  @Input()
  set userIsDirector(userIsDirector: boolean) {
    this._userIsDirector = userIsDirector;
    this.updateTemplateVisibilityFlags();
  }

  get userIsDirector(): boolean {
    return this._userIsDirector;
  }

  @Input()
  set meetingsLoading(meetingsLoading: boolean) {
    this._meetingsLoading = meetingsLoading;
    this.updateTemplateVisibilityFlags();
  }

  get meetingsLoading(): boolean {
    return this._meetingsLoading;
  }

  @Input()
  set meetings(meetings: MeetingModel[]) {
    this._meetings = meetings;
    this.updateTemplateVisibilityFlags();
  }

  get meetings(): MeetingModel[] {
    return this._meetings;
  }

  @Input()
  set users(users: User[]) {
    this._users = users;
    this.filter();
  }

  @Input()
  set importedUsers(importUsers: ImportUser[]) {
    this._importedUsers = importUsers;
    this.filter();
  }

  get importedUsers() {
    return this._importedUsers;
  }

  isFilterActive = false;
  activeRoleNumberFilter = Role.NONE.value;
  importedFilterActive: boolean;
  usersFiltered: User[] = [];
  importedUsersFiltered: ImportUser[] = [];
  _userIsDirector: boolean;
  _meetingsLoading = true;
  _meetings: MeetingModel[] = [];
  _users: User[] = [];
  _importedUsers: ImportUser[] = [];

  areChangesAllowed = false;
  enableChangeActions = false;
  showConstrainedUserManagementInfo = false;


  constructor(private permissionService: PermissionService,
              private modalService: ModalService,
              private memberNamePipe: MemberNamePipe,
              private cdr: ChangeDetectorRef) {
  }

  isTokenAuth(): boolean {
    return (this.authOptions || []).includes(AuthenticationMethod.TOKEN);
  }

  updateTemplateVisibilityFlags() {
    this.areChangesAllowed = this.permissionService.checkMeetings(Permission.MEMBER_REMOVE, this.meetings);
    this.enableChangeActions = !this.meetingsLoading && this.areChangesAllowed;
    this.showConstrainedUserManagementInfo = !this.meetingsLoading && !this.areChangesAllowed && this.userIsDirector;
  }

  /*
   * ===========
   * T O O L S
   * ===========
   */

  onDeleteUser(user: User) {
    this.modalService.openModal<RemoveUserModalComponent>(RemoveUserModalComponent, {
      close: true,
      user,
    });
  }

  onDeleteImportUser(importUser: ImportUser) {
    this.modalService.openModal<RemoveImportUserModalComponent>(RemoveImportUserModalComponent, {
      close: true,
      importUser,
    });
  }

  onEditUser(user: User) {
    this.modalService.openModal<UserEditModalComponent>(UserEditModalComponent,
      {user: user, close: true, userConstraint: this.showConstrainedUserManagementInfo});
  }

  onEditImportUser(importUser: ImportUser) {
    this.modalService.openModal<ImportUserEditModalComponent>(ImportUserEditModalComponent, {importUser: importUser, close: true});
  }

  onReplaceUser(user: User) {
    this.modalService.openModal<ReplaceUserModalSmartComponent>(ReplaceUserModalSmartComponent, {
      close: true,
      user: user
    });
  }

  onManageAccessCode(importUser: ImportUser) {
    this.modalService.openModal<ImportUserAccessCodeModalComponent>(ImportUserAccessCodeModalComponent, {
      close: true,
      importUser: importUser
    });
  }

  onExportUsers() {
    this.modalService.openModal<ExportUsersModalSmartComponent>(ExportUsersModalSmartComponent, {
      close: true,
      importedUsers: this._importedUsers
    });
  }

  onImportUsers() {
    this.modalService.openModal<ImportUsersModalSmartComponent>(ImportUsersModalSmartComponent, {
      close: true,
    }, {
      windowClass: 'ev-modal-lg'
    });
  }

  onNewUser() {
    // opens modal
    // TODO: DECVO-462 (User einladen - Einzeln)
  }

  /*
   * ============
   * F I L T E R
   * ============
   */

  onFilterDirectors(searchInputElement: HTMLInputElement) {
    this.isFilterActive = true;
    this.importedFilterActive = false;
    this.activeRoleNumberFilter = Role.DIRECTOR.value;
    this.filter(searchInputElement.value, true);
  }

  onFilterMembers(searchInputElement: HTMLInputElement) {
    this.isFilterActive = true;
    this.importedFilterActive = false;
    this.activeRoleNumberFilter = Role.MEMBER.value;
    this.filter(searchInputElement.value, true);
  }

  onFilterGuests(searchInputElement: HTMLInputElement) {
    this.isFilterActive = true;
    this.importedFilterActive = false;
    this.activeRoleNumberFilter = Role.GUEST.value;
    this.filter(searchInputElement.value, true);
  }

  onFilterInvited() {
    this.isFilterActive = true;
    this.usersFiltered = [];
    this.activeRoleNumberFilter = Role.NONE.value;
    this.importedFilterActive = true;
    this.importedUsersFiltered = this._importedUsers;
  }

  onClearFilter(searchInputElement: HTMLInputElement) {
    this.clearSearchAndFilter();
    searchInputElement.value = '';
  }

  clearSearchAndFilter() {
    this.usersFiltered = this._users;
    this.importedUsersFiltered = this._importedUsers;
    this.isFilterActive = false;
    this.activeRoleNumberFilter = Role.NONE.value;
    this.importedFilterActive = false;
  }

  filter(searchText: string = '', ignoreEmptySearch: boolean = false) {
    if (!searchText && !ignoreEmptySearch) {
      this.clearSearchAndFilter();
      return; // GUARD
    }
    this.usersFiltered = this._users.filter(user => {
      const userString = this.memberNamePipe.transform(user);
      const userStringMatches = userString.toLowerCase().includes(searchText.toLowerCase());
      const userMatchesRole = this.activeRoleNumberFilter && user.role.isRole(this.activeRoleNumberFilter);
      return userStringMatches && (!this.activeRoleNumberFilter || userMatchesRole);
    });

    this.importedUsersFiltered = this._importedUsers.filter(importedUser => {
      const importedUserString = this.memberNamePipe.transform(importedUser);
      const importedUserStringMatches = importedUserString.toLowerCase().includes(searchText.toLowerCase());
      const importedUserMatchesRole = this.activeRoleNumberFilter && new Role(importedUser.role).isRole(this.activeRoleNumberFilter);
      return importedUserStringMatches && (!this.activeRoleNumberFilter || importedUserMatchesRole);
    });
  }

  /*
   * ============
   * P E R M I S S I O N S
   * ============
   */

  showExportButton(): boolean {
    return this.permissionService.check(Permission.USER_EXPORT);
  }

  showImportButton() {
    return this.permissionService.check(Permission.USER_IMPORT);
  }
}
