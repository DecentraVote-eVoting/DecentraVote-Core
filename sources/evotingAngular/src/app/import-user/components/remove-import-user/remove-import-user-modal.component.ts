/**
 DecentraVote
 Copyright (C) 2018-2022 iteratec
 */
import {Component, Input} from '@angular/core';
import {ImportUser} from '@import-user/models/import-user.model';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';
import {PlatformLocation} from '@angular/common';
import {Store} from '@ngrx/store';
import {State} from '@app/app.store';
import {ImportUserFacade} from '@import-user/services/import-user.facade';
import {AbstractModalComponent} from '@core/components/abstract-modal/abstract-modal.component';

@Component({
  selector: 'app-remove-import-user-modal',
  templateUrl: './remove-import-user-modal.component.html'
})
export class RemoveImportUserModalComponent extends AbstractModalComponent {

  @Input() importUser: ImportUser;

  constructor(protected modalRef: NgbActiveModal,
              private platform: PlatformLocation,
              private store: Store<State>,
              private importUserFacade: ImportUserFacade) {
    super(modalRef, platform);
  }

  onRemoveImportUser() {
    this.importUserFacade.removeImportedUser(
      this.importUser.id,
      this.importUser.field0
    );
    this.dismiss();
  }
}
