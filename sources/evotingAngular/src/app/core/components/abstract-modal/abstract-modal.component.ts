/**
 DecentraVote
 Copyright (C) 2018-2022 iteratec
 */
import {HostListener, Input} from '@angular/core';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';
import {PlatformLocation} from '@angular/common';

export abstract class AbstractModalComponent {
  @Input() close: boolean;

  protected constructor(protected modalRef: NgbActiveModal,
                        private platformLocation: PlatformLocation) {
    platformLocation.onPopState(() => this.dismiss())
  }

  @HostListener('document:keydown', ['$event'])
  onKeydownHandler(event: KeyboardEvent){
    if(event.key === "Escape"){
      this.dismiss();
    }
  }

  dismiss() {
    this.closeModal();
  }

  private closeModal() {
    this.modalRef.close();
  }
}
