/**
 DecentraVote
 Copyright (C) 2018-2022 iteratec
 */
import {Injectable, Type} from '@angular/core';
import {NgbModal, NgbModalOptions} from '@ng-bootstrap/ng-bootstrap';
import {AbstractModalComponent} from '../components/abstract-modal/abstract-modal.component';

@Injectable({
  providedIn: 'root'
})
export class ModalService {

  constructor(private ngbModal: NgbModal) {
  }

  openModal<T extends AbstractModalComponent>(type: Type<T>, inputs: { [key in keyof T]?: T[key] }, options?: NgbModalOptions) {
    options = {
      ...options
    };

    const modalRef = this.ngbModal.open(type, options);
    const component: T = modalRef.componentInstance;

    if (inputs) {
      for (const key of Object.keys(inputs)) {
        component[key] = inputs[key];
      }
    }
  }

}
