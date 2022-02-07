/**
 DecentraVote
 Copyright (C) 2018-2022 iteratec
 */
import {Component, Input, OnInit} from '@angular/core';
import {AbstractModalComponent} from '@core/components/abstract-modal/abstract-modal.component';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';
import {PlatformLocation} from '@angular/common';

@Component({
  selector: 'app-confirmation-dialog-modal',
  templateUrl: './confirmation-dialog-modal.component.html'
})
export class ConfirmationDialogModalComponent extends AbstractModalComponent {

  @Input()
  modalCallback: (choice: boolean) => void;
  @Input()
  headerText: string;
  @Input()
  dialogText: string;
  @Input()
  consequenceTexts: string[];

  constructor(protected modalRef: NgbActiveModal,
              private platform: PlatformLocation) {
    super(modalRef, platform);
  }

  confirm() {
    this.modalCallback(true);
    this.dismiss();
  }

  cancel() {
    this.modalCallback(false);
    this.dismiss();
  }

}
