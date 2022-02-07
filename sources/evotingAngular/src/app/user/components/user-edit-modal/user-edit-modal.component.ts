/**
 DecentraVote
 Copyright (C) 2018-2022 iteratec
 */
import {ChangeDetectorRef, Component, Input, OnDestroy, OnInit} from '@angular/core';
import {User} from '@app/user/models/user.model';
import {FormBuilder} from '@angular/forms';
import {AbstractModalComponent} from '@core/components/abstract-modal/abstract-modal.component';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';
import {PlatformLocation} from '@angular/common';
import * as userActions from '@app/user/+state/user.actions';
import {Role} from '@user/models/role.model';
import {Store} from '@ngrx/store';
import * as fromRoot from '@app/app.store';
import {TranslatePipe, TranslateService} from '@ngx-translate/core';
import {MeetingFacade} from '@meeting/services/meeting.facade';
import {takeUntil} from 'rxjs/operators';
import {Subject} from 'rxjs';
import {MeetingModel, MeetingStage} from '@meeting/models/meeting.model';

@Component({
  selector: 'app-user-edit-modal',
  templateUrl: './user-edit-modal.component.html'
})
export class UserEditModalComponent extends AbstractModalComponent implements OnInit, OnDestroy {
  @Input()
  set user(user: User) {
    if (user === undefined) { return; } // GUARD
    this._user = user;
    this.userForm.patchValue({
      field1: this._user.resolvedClaim.field1,
      field2: this._user.resolvedClaim.field2,
      field0: this._user.resolvedClaim.field0,
      role: Role.findMostSignificantRole(this._user.role)
    });
  }

  @Input()
  userConstraint: boolean;

  meetings: MeetingModel[];
  _user: User;
  roleIds: number[];

  userForm = this.formBuilder.group({
    field1: [''],
    field2: [''],
    field0: [{value: '', disabled: true}],
    role: ['']
  });

  private unsubscribe$ = new Subject();

  private translatePipe = new TranslatePipe(this.translateService, this.cdr);

  constructor(protected modalRef: NgbActiveModal,
              private formBuilder: FormBuilder,
              private platform: PlatformLocation,
              private store: Store<fromRoot.State>,
              private translateService: TranslateService,
              private cdr: ChangeDetectorRef,
              private meetingFacade: MeetingFacade) {
    super(modalRef, platform);
  }

  ngOnInit() {
    this.roleIds = Object.keys(Role.ALL)
      .map(role => Role.ALL[role].value);

    this.meetingFacade.getMeetings().pipe(
      takeUntil(this.unsubscribe$)
    ).subscribe(meetings => this.meetings = meetings);
  }

  onSubmit() {
    if (!this.userForm.dirty) { this.dismiss(); return; } // GUARD

    const editedUser: User = JSON.parse(JSON.stringify(this._user));
    const formRole = new Role(this.userForm.value.role);

    editedUser.resolvedClaim.field1 = this.userForm.value.field1;
    editedUser.resolvedClaim.field2 = this.userForm.value.field2;

    if (this.allowEditRole()) {
      if (formRole.isRole(Role.GUEST)) {
        const userRole = new Role(this._user.role.value);
        editedUser.role.value = userRole.removeDirectorRole().removeMemberRole().addGuestRole().value;
      }

      if (formRole.isRole(Role.MEMBER)) {
        const userRole = new Role(this._user.role.value);
        editedUser.role.value = userRole.removeDirectorRole().removeGuestRole().addMemberRole().value;
      }

      if (formRole.isRole(Role.DIRECTOR)) {
        const userRole = new Role(this._user.role.value);
        editedUser.role.value = userRole.removeGuestRole().addMemberRole().addDirectorRole().value;
      }
    }

    if (this.changesExist(editedUser)) {
      this.store.dispatch(userActions.EditUserAction({user: editedUser}));
    }

    this.dismiss();
  }

  allowEditRole() {
    return this.meetings
      .filter(meeting => meeting.stage === MeetingStage.OPEN)
      .length === 0;
  }

  /**
   * returns the translated rolls as per i18n for a given role id
   * example: 0b001 => "Guest"
   *          0b110 => "Member, Director"
   * @param id
   */
  getRoleStringI18n(id: number): string {
    if (id === 0b000) { return 'none'; } // GUARD

    const roles = Role.getRoleString(new Role(id)).split('/');
    let result = '';
    const i18nPrefix = 'User.Form.Option-';
    roles.forEach(role => {
      const current = role[0] + role.slice(1).toLowerCase();
      result += this.translatePipe.transform(i18nPrefix + current) + ', ';
    });
    return result.slice(0, -2);
  }

  changesExist(editedUser: User): boolean {
    return editedUser.resolvedClaim.field0 !== this.userForm.value.field0 ||
      editedUser.resolvedClaim.field1 !== this.userForm.value.field1 ||
      editedUser.resolvedClaim.field2 !== this.userForm.value.field2 ||
      editedUser.role !== this.userForm.value.role;
  }

  ngOnDestroy() {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }
}
