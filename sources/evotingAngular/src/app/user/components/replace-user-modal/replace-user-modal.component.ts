/**
 DecentraVote
 Copyright (C) 2018-2022 iteratec
 */
import {Component, EventEmitter, Input, Output} from '@angular/core';
import {User} from '@user/models/user.model';
import {AbstractModalComponent} from '@core/components/abstract-modal/abstract-modal.component';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';
import {PlatformLocation} from '@angular/common';
import {FormControl} from '@angular/forms';
import {ObjectUtil} from '@core/utils/object.util';

@Component({
  selector: 'app-replace-user-modal',
  templateUrl: './replace-user-modal.component.html'
})
export class ReplaceUserModalComponent extends AbstractModalComponent {
  @Input()
  user: User;

  @Input()
  accessCode: FormControl;

  @Output()
  replaceUserClick = new EventEmitter();

  copiedToClipboard = false;
  constructor(protected modalRef: NgbActiveModal,
              private platform: PlatformLocation) {
    super(modalRef, platform);
  }


  onReplaceUserClick() {
    this.replaceUserClick.emit();
  }

  setCopyToClipboardSuccessful() {
    this.copiedToClipboard = true;
  }

  showCopyToClipBoard(): boolean {
    return this.accessCode.value;
  }
}
