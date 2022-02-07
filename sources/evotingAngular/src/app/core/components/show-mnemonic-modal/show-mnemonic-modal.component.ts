/**
 DecentraVote
 Copyright (C) 2018-2022 iteratec
 */
import {Component} from '@angular/core';
import {AbstractModalComponent} from '@core/components/abstract-modal/abstract-modal.component';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';
import {first} from 'rxjs/operators';
import {OrganizationFacade} from '@core/services/organization.facade.service';
import {ObjectUtil} from '@core/utils/object.util';
import {SafeResourceUrl} from '@angular/platform-browser';
import {PlatformLocation} from '@angular/common';
import {FormControl} from '@angular/forms';

@Component({
  selector: 'app-show-mnemonic-modal',
  templateUrl: './show-mnemonic-modal.component.html'
})
export class ShowMnemonicModalComponent extends AbstractModalComponent {

  mnemonic: string;
  downloadUrl: SafeResourceUrl;
  filename = 'mnemonic-export.json';
  copiedToClipboard = false;
  mnemonicControl = new FormControl();

  constructor(protected modalRef: NgbActiveModal,
              private organizationFacade: OrganizationFacade,
              private platform: PlatformLocation) {
    super(modalRef, platform);

    this.organizationFacade.getMnemonic()
      .pipe(first())
      .subscribe(mnemonic => {
        this.mnemonicControl.setValue(mnemonic);
        this.mnemonicControl.disable();
      });
  }

  setCopyToClipboardSuccessful() {
      this.copiedToClipboard = true;
  }
}
