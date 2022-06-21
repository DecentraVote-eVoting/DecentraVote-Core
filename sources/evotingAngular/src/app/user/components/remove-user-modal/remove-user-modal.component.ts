/**
 DecentraVote
 Copyright (C) 2018-2022 iteratec
 */
import {Component, Input} from '@angular/core';
import {AbstractModalComponent} from '@core/components/abstract-modal/abstract-modal.component';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';
import {State} from '@app/app.store';
import {Store} from '@ngrx/store';
import {PlatformLocation} from '@angular/common';
import {ImportUserFacade} from '@import-user/services/import-user.facade';
import {User} from '@app/user/models/user.model';
import {UserFacade} from '@app/user/services/user.facade';
import {ImportUser} from '@import-user/models/import-user.model';

@Component({
  selector: 'app-remove-user-modal',
  templateUrl: './remove-user-modal.component.html'
})
export class RemoveUserModalComponent extends AbstractModalComponent {

  @Input() user: User | ImportUser;

  constructor(protected modalRef: NgbActiveModal,
              private platform: PlatformLocation,
              private store: Store<State>,
              private importUserFacade: ImportUserFacade,
              private userFacade: UserFacade) {
    super(modalRef, platform);
  }

  onRemoveUser() {
    if ('id' in this.user) {
      this.importUserFacade.removeImportedUser(
        this.user.id,
        this.user.uid
      );
    } else {
      this.userFacade.invalidateUser(this.user.address, this.user.claimHash);
    }
    this.dismiss();
  }
}
