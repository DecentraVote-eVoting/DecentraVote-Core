/**
 DecentraVote
 Copyright (C) 2018-2022 iteratec
 */
import {Component, Input} from '@angular/core';
import {AbstractModalComponent} from '@core/components/abstract-modal/abstract-modal.component';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';
import {PlatformLocation} from '@angular/common';
import {ImportUser} from '@import-user/models/import-user.model';
import {FormBuilder} from '@angular/forms';
import * as importUserActions from '@import-user/+state/import-user.actions';
import {Role} from '@user/models/role.model';
import {Store} from '@ngrx/store';
import * as fromRoot from '@app/app.store';

@Component({
  selector: 'app-import-user-edit-modal',
  templateUrl: './import-user-edit-modal.component.html'
})
export class ImportUserEditModalComponent extends AbstractModalComponent {

  @Input()
  set importUser(importUser: ImportUser) {
    if (importUser === undefined) { return; } // GUARD
    this._importUser = importUser;
    this.importUserForm.patchValue({
      name1: this._importUser.name1,
      name2: this._importUser.name2,
      uid: this._importUser.uid,
      role: this._importUser.role
    });
  }

  _importUser: ImportUser;

  importUserForm = this.formBuilder.group({
    name1: [''],
    name2: [''],
    uid: [{value: '', disabled: true}],
    role: ['']
  });

  constructor(protected modalRef: NgbActiveModal,
              private platform: PlatformLocation,
              private formBuilder: FormBuilder,
              private store: Store<fromRoot.State>) {
    super(modalRef, platform);
  }

  onSubmit() {
    if (!this.importUserForm.dirty) { this.dismiss(); return; } // GUARD

    const editedImportUser: ImportUser = JSON.parse(JSON.stringify(this._importUser));
    const formRole = new Role(this.importUserForm.value.role);

    editedImportUser.name1 = this.importUserForm.value.name1;
    editedImportUser.name2 = this.importUserForm.value.name2;

    if (formRole.isRole(Role.GUEST)) {
      const importUserRole = new Role(this._importUser.role);
      editedImportUser.role = importUserRole.removeDirectorRole().removeMemberRole().addGuestRole().value;
    }

    if (formRole.isRole(Role.MEMBER)) {
      const importUserRole = new Role(this._importUser.role);
      editedImportUser.role = importUserRole.removeDirectorRole().removeGuestRole().addMemberRole().value;
    }

    if (formRole.isRole(Role.DIRECTOR)) {
      const importUserRole = new Role(this._importUser.role);
      editedImportUser.role = importUserRole.removeGuestRole().addMemberRole().addDirectorRole().value;
    }

    this.store.dispatch(importUserActions.EditImportUserAction({editedImportUser} ));
    this.dismiss();
  }
}
