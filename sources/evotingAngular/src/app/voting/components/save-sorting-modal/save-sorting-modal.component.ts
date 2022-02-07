
/**
 DecentraVote
 Copyright (C) 2018-2022 iteratec
 */import {Component, Input} from '@angular/core';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';
import {AbstractModalComponent} from '@core/components/abstract-modal/abstract-modal.component';
import {PlatformLocation} from '@angular/common';

@Component({
  selector: 'app-save-sorting-modal',
  templateUrl: './save-sorting-modal.component.html'
})
export class SaveSortingModalComponent extends AbstractModalComponent {

  constructor(protected modalRef: NgbActiveModal,
              private platform: PlatformLocation) {
    super(modalRef, platform);
  }

  @Input() modalCallback: (saveSorting: boolean) => void;

  saveSorting() {
    this.modalCallback(true);
    this.dismiss();
  }

  discardSorting() {
    this.modalCallback(false);
    this.dismiss();
  }
}
