/**
 DecentraVote
 Copyright (C) 2018-2022 iteratec
 */

import {Component} from '@angular/core';
import {AbstractModalComponent} from "@core/components/abstract-modal/abstract-modal.component";
import {NgbActiveModal} from "@ng-bootstrap/ng-bootstrap";
import {PlatformLocation} from "@angular/common";

@Component({
  selector: 'license-component',
  templateUrl: './license.component.html'
})
export class LicenseComponent extends AbstractModalComponent {

  constructor(
    protected modalRef: NgbActiveModal,
    private platform: PlatformLocation
  ) {
    super(modalRef, platform);
  }

}
